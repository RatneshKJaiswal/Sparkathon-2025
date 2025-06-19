
import pandas as pd
import boto3
import os
import io
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Union

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
        raise  # Re-raise for upstream error handling


def get_latest_hourly_data() -> Dict[str, Any]:
    """
    Finds and loads the latest hourly CSV file from S3 based on the new path structure.
    It iterates backward from the current hour to find the most recent file.
    """
    current_time = datetime.now()
    # Look back a few hours/days in case the latest file is from yesterday
    # We'll construct potential paths and look for files
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