# filename: data_loader_module.py

import pandas as pd
import boto3
import os
import io
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Union
import pytz
import concurrent.futures  # Import for parallel processing

# Initialize S3 client
s3_client = boto3.client('s3')

# Define your S3 bucket name from environment variables for flexibility
# IMPORTANT: Ensure 'S3_BUCKET_NAME' is set in your environment
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'walmart-sparkathon-energy-data')

# Base S3 prefix for the hourly raw data (matches your provided path)
HOURLY_DATA_BASE_PREFIX = 'historical_store1_energy_data/'


def _read_csv_from_s3(bucket: str, key: str) -> pd.DataFrame:
    """Helper function to read a CSV file from S3 into a pandas DataFrame."""
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        csv_content = response['Body'].read().decode('utf-8')
        df = pd.read_csv(io.StringIO(csv_content))
        # Ensure 'timestamp' column is datetime type if it exists
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        # Ensure 'date' column is date type if it exists
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date']).dt.date
        return df
    except s3_client.exceptions.NoSuchKey:
        print(f"Warning: S3 object not found: s3://{bucket}/{key}")
        return pd.DataFrame()  # Return empty DataFrame if file not found
    except Exception as e:
        print(f"Error reading s3://{bucket}/{key}: {e}")
        # Do not re-raise here if using ThreadPoolExecutor, let the future result handle it
        return pd.DataFrame()  # Return empty DF on error for robustness


def get_latest_hourly_data() -> Dict[str, Any]:
    """
    Finds and loads the latest hourly CSV file from S3 based on the new path structure.
    It iterates backward from the current hour to find the most recent file.
    """
    timezone = pytz.timezone("UTC")
    current_time = datetime.now(timezone)

    # Look back a few hours/days in case the latest file is from yesterday
    for i in range(48):  # Check last 48 hours
        check_time = current_time - timedelta(hours=i)

        # S3 folder path for the specific day (e.g., historical_store1_energy_data/year=YYYY/month=MM/day=DD/)
        folder_prefix = (
            f"{HOURLY_DATA_BASE_PREFIX}"
            f"year={check_time.year}/"
            f"month={check_time.strftime('%m')}/"
            f"day={check_time.strftime('%d')}/"
        )

        # The specific filename we expect for this hour
        expected_filename = f"store_energy_data_{check_time.strftime('%H')}.csv"
        s3_key = folder_prefix + expected_filename

        try:
            # Check if the specific file exists
            response = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix=s3_key)
            if 'Contents' in response:
                # If Contents exist and the key matches (exact file found)
                if any(obj['Key'] == s3_key for obj in response['Contents']):
                    print(f"Found latest hourly data file: s3://{S3_BUCKET_NAME}/{s3_key}")
                    df = _read_csv_from_s3(S3_BUCKET_NAME, s3_key)
                    if not df.empty:
                        return df.iloc[0].to_dict()
        except Exception as e:
            print(f"Error checking S3 key {s3_key}: {e}")
            # Continue to previous hour in case of transient S3 errors

    print("No recent hourly data found in S3 with the expected path structure.")
    return {}


def get_recent_hourly_data(lookback_hours: int) -> List[Dict[str, Any]]:
    """
    Loads multiple recent hourly CSV files from S3 based on the new path structure.

    Args:
        lookback_hours (int): The number of recent hours to retrieve data for.

    Returns:
        List[Dict[str, Any]]: A list of dictionaries, where each dictionary represents an hourly data row.
    """
    all_recent_data = []
    timezone = pytz.timezone("UTC")
    current_time = datetime.now(timezone)

    for i in range(lookback_hours):
        check_time = current_time - timedelta(hours=i)
        folder_prefix = (
            f"{HOURLY_DATA_BASE_PREFIX}"
            f"year={check_time.year}/"
            f"month={check_time.strftime('%m')}/"
            f"day={check_time.strftime('%d')}/"
        )
        expected_filename = f"store_energy_data_{check_time.strftime('%H')}.csv"
        s3_key = folder_prefix + expected_filename

        try:
            response = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix=s3_key)
            if 'Contents' in response:
                if any(obj['Key'] == s3_key for obj in response['Contents']):
                    df = _read_csv_from_s3(S3_BUCKET_NAME, s3_key)
                    if not df.empty:
                        all_recent_data.append(df.iloc[0].to_dict())
        except Exception as e:
            print(f"Error fetching data for hour {check_time.isoformat()} at {s3_key}: {e}")

    # Sort data by timestamp in ascending order
    all_recent_data.sort(key=lambda x: x['timestamp'])
    return all_recent_data


def load_historical_data_in_chunks(start_date: date, end_date: date, max_workers: int = 10) -> pd.DataFrame:
    """
    Efficiently loads historical S3 data into a single Pandas DataFrame using parallel processing.
    It identifies all relevant hourly CSVs within the specified date range and fetches them concurrently.

    Args:
        start_date (date): The start date (inclusive) for data loading.
        end_date (date): The end date (inclusive) for data loading.
        max_workers (int): The maximum number of threads to use for parallel loading.

    Returns:
        pd.DataFrame: A single Pandas DataFrame containing all historical data
                      for the specified date range. Returns an empty DataFrame if no data found.
    """
    s3_keys_to_fetch = []
    current_date_iter = start_date

    print(f"Collecting S3 keys for historical data from {start_date} to {end_date}...")

    # First, collect all S3 keys that fall within the desired date range
    while current_date_iter <= end_date:
        for hour in range(24):
            check_time = datetime(current_date_iter.year, current_date_iter.month, current_date_iter.day, hour)
            folder_prefix = (
                f"{HOURLY_DATA_BASE_PREFIX}"
                f"year={check_time.year}/"
                f"month={check_time.strftime('%m')}/"
                f"day={check_time.strftime('%d')}/"
            )
            expected_filename = f"store_energy_data_{check_time.strftime('%H')}.csv"
            s3_key = folder_prefix + expected_filename

            try:
                # Use list_objects_v2 with the exact key to check for existence
                response = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix=s3_key, MaxKeys=1)
                if 'Contents' in response and any(obj['Key'] == s3_key for obj in response['Contents']):
                    s3_keys_to_fetch.append(s3_key)
            except Exception as e:
                print(f"Error checking existence of {s3_key}: {e}")
                # Continue to next file even if checking one fails

        current_date_iter += timedelta(days=1)

    if not s3_keys_to_fetch:
        print("No historical data files found for the specified date range.")
        return pd.DataFrame()

    print(f"Found {len(s3_keys_to_fetch)} files. Starting parallel download with {max_workers} workers...")

    all_dfs = []
    # Use ThreadPoolExecutor for I/O-bound tasks like S3 downloads
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit tasks to the executor
        future_to_key = {executor.submit(_read_csv_from_s3, S3_BUCKET_NAME, key): key for key in s3_keys_to_fetch}

        for future in concurrent.futures.as_completed(future_to_key):
            key = future_to_key[future]
            try:
                df = future.result()  # Get the result (DataFrame) from the completed future
                if not df.empty:
                    all_dfs.append(df)
            except Exception as e:
                print(f"Error processing {key}: {e}")  # Log error for specific file

    if not all_dfs:
        print("No data successfully loaded after parallel processing.")
        return pd.DataFrame()

    # Concatenate all DataFrames into a single one
    combined_df = pd.concat(all_dfs, ignore_index=True)

    # Ensure timestamp is sorted in ascending order for time series analysis
    if 'timestamp' in combined_df.columns:
        combined_df = combined_df.sort_values(by='timestamp').reset_index(drop=True)

    print(f"Successfully loaded {len(combined_df)} rows of historical data.")
    return combined_df


def load_daily_aggregated_data(start_date: date, end_date: date, max_workers: int = 10) -> pd.DataFrame:
    """
    Loads hourly historical data from S3 and aggregates it into daily summaries.

    Args:
        start_date (date): Start date (inclusive).
        end_date (date): End date (inclusive).
        max_workers (int): Maximum number of threads for parallel download.

    Returns:
        pd.DataFrame: Daily aggregated energy data.
    """

    hourly_df = load_historical_data_in_chunks(start_date, end_date, max_workers=max_workers)

    if hourly_df.empty:
        return pd.DataFrame()  # No data to aggregate

    hourly_df['timestamp'] = pd.to_datetime(hourly_df['timestamp'])
    hourly_df['date'] = hourly_df['timestamp'].dt.date  # Extract date for grouping

    aggregation = {
        'HVAC_Energy(t)': 'sum',
        'Refrigeration_Energy(t)': 'sum',
        'Lighting_Energy(t)': 'sum',
        'IT_System(t)': 'sum',
        'Other_System(t)': 'sum',
        'Solar_Available_for_Use(t)': 'sum',
        'Solar_Used_to_Charge_Battery(t)': 'sum',
        'Battery_1_Energy_Stored(t)': 'mean',
        'Battery_2_Energy_Stored(t)': 'mean',
        'Total_Energy(t)': 'sum',
        'Electricity_Price(t)': 'mean'
    }

    daily_df = hourly_df.groupby('date').agg(aggregation).reset_index()

    daily_df.rename(columns={
        'HVAC_Energy(t)': 'Daily_HVAC_Energy_kWh',
        'Refrigeration_Energy(t)': 'Daily_Refrigeration_Energy_kWh',
        'Lighting_Energy(t)': 'Daily_Lighting_Energy_kWh',
        'IT_System(t)': 'Daily_IT_System_Energy_kWh',
        'Other_System(t)': 'Daily_Other_System_Energy_kWh',
        'Solar_Available_for_Use(t)': 'Daily_Solar_Available_for_Use_kWh',
        'Solar_Used_to_Charge_Battery(t)': 'Daily_Solar_Used_to_Charge_Battery_kWh',
        'Battery_1_Energy_Stored(t)': 'Daily_Battery_1_average_charge',
        'Battery_2_Energy_Stored(t)': 'Daily_Battery_2_average_charge',
        'Total_Energy(t)': 'Daily_Total_Energy_Usage_kWh',
        'Electricity_Price(t)': 'Daily_Avg_Electricity_Price_USD_per_kWh'
    }, inplace=True)

    return daily_df


# --- Example Usage (for local testing) ---
if __name__ == "__main__":
    # Ensure S3_BUCKET_NAME environment variable is set for local testing
    # Or, uncomment and set it directly for quick local tests:
    # os.environ['S3_BUCKET_NAME'] = 'walmart-sparkathon-energy-data'

    # --- Test get_latest_hourly_data ---
    # print("--- Testing get_latest_hourly_data ---")
    # try:
    #     latest_data = get_latest_hourly_data()
    #     if latest_data:
    #         print("Latest hourly data found:")
    #         print(pd.Series(latest_data).to_string())
    #     else:
    #         print("No latest hourly data available.")
    # except Exception as e:
    #     print(f"Failed to get latest hourly data: {e}")

    # --- Test get_recent_hourly_data ---
    # print("\n--- Testing get_recent_hourly_data (last 3 hours) ---")
    # try:
    #     recent_data = get_recent_hourly_data(lookback_hours=3)
    #     if recent_data:
    #         print(f"Found {len(recent_data)} recent hourly data points:")
    #         for row in recent_data:
    #             print(f"  Timestamp: {row['timestamp']}, Total Energy: {row.get('Total_Energy(t)', 'N/A'):.2f}")
    #     else:
    #         print("No recent hourly data available.")
    # except Exception as e:
    #     print(f"Failed to get recent hourly data: {e}")

    # --- Test load_historical_data_in_chunks (NEW FUNCTION with Parallelization) ---
    # print("\n--- Testing load_historical_data_in_chunks (e.g., 2 days with parallelization) ---")
    # try:
    #     # Adjust dates to a range where you know you have data ingested by Lambda
    #     test_start_date_chunk = date(2024, 8, 6)  # Example: June 11, 2025
    #     test_end_date_chunk = date(2024, 8, 6)  # Example: June 14, 2025 (today)
    #
    #     # Set max_workers based on your system's capabilities and network
    #     # A common starting point is (CPU cores * 2) + 1, or simply 10-20 for I/O bound tasks
    #     chunked_df = load_historical_data_in_chunks(test_start_date_chunk, test_end_date_chunk, max_workers=20)
    #     if not chunked_df.empty:
    #         print(f"Successfully loaded {len(chunked_df)} rows into a single DataFrame using parallelization.")
    #         print("First 5 rows of the combined DataFrame:")
    #         print(chunked_df.head(24).to_string())
    #         print("\nCombined DataFrame Info:")
    #         print(chunked_df.info())
    #     else:
    #         print("No data loaded by load_historical_data_in_chunks.")
    # except Exception as e:
    #     print(f"Failed to load historical data in chunks: {e}")

    # --- Test load_daily_aggregated_data ---
    print("\n--- Testing load_daily_aggregated_data  ---")

    try:
        # Example: adjust to dates where you expect to have data in S3
        test_start_date_daily = date(2024, 8, 6)  # Change to test dates with known data
        test_end_date_daily = date(2024, 8, 16)

        # You can adjust workers depending on your machine/network
        max_workers = 10

        daily_agg_df = load_daily_aggregated_data(test_start_date_daily, test_end_date_daily, max_workers=max_workers)

        if not daily_agg_df.empty:
            print(f"Successfully loaded and aggregated to daily summaries with {len(daily_agg_df)} days of data.")
            print("First few rows of aggregated daily DataFrame:")
            print(daily_agg_df.head().to_string(index=False))

            print("\nAggregated DataFrame Info:")
            print(daily_agg_df.info())

            print("\nDaily Energy Summaries:")
            print(daily_agg_df[['date', 'Daily_Total_Energy_Usage_kWh', 'Daily_Solar_Available_for_Use_kWh']].to_string(
                index=False))

        else:
            print("⚠No daily aggregated data returned by load_daily_aggregated_data.")

    except Exception as e:
        print(f"Failed to load or aggregate historical data to daily summaries: {e}")
