import json
import boto3
from datetime import datetime, timedelta
import os
import io
import pandas as pd
import numpy as np


# Import the data loader module to read previous state
from data_loader_module import get_latest_hourly_data, S3_BUCKET_NAME, HOURLY_DATA_BASE_PREFIX


# --- Data Generation Logic ---
def generate_single_hour_data_for_lambda(
        current_timestamp: datetime,
        initial_battery_energy_stored_1: float,
        initial_battery_energy_stored_2: float
) -> str:
    """
    Generates a single row of synthetic energy data for a given timestamp,
    considering past battery energy levels for synchronization.

    Args:
        current_timestamp (datetime): The specific timestamp for which to generate data.
        initial_battery_energy_stored_1 (float): The energy stored in Battery 1 at the start of this hour (from previous hour's data).
        initial_battery_energy_stored_2 (float): The energy stored in Battery 2 at the start of this hour (from previous hour's data).

    Returns:
        str: A CSV string representing a single row of generated data.
    """
    timestamps_series = pd.Series([current_timestamp])

    # --- Parameters for Battery Logic ---
    num_battery_banks = 2
    battery_capacity_kwh = 500  # Each battery bank capacity
    battery_max_rate_kwh = 150  # Max charge/discharge rate per hour per bank
    charge_efficiency = 0.95
    discharge_efficiency = 0.95

    # Use initial values passed to the function as the starting point for this hour
    # These will be updated based on current hour's charge/discharge
    battery_energy_stored = [
        initial_battery_energy_stored_1,
        initial_battery_energy_stored_2
    ]

    # --- HVAC Energy Data Generation ---
    baseline_hvac = 150
    seasonal_hvac = 50 * np.sin(2 * np.pi * (timestamps_series.dt.dayofyear - 80) / 365).item()
    daily_hvac = 75 * np.sin(2 * np.pi * (timestamps_series.dt.hour - 8) / 24).item()
    daily_hvac = 0 if timestamps_series.dt.hour.item() < 7 or timestamps_series.dt.hour.item() > 22 else daily_hvac
    noise_hvac = np.random.normal(0, 10)
    hvac_consumption = max(0, baseline_hvac + seasonal_hvac + daily_hvac + noise_hvac)

    # --- Refrigeration Energy Data Generation ---
    baseline_fridge = 200
    daily_fridge = 10 * np.sin(2 * np.pi * (timestamps_series.dt.hour - 10) / 24).item()
    defrost_spikes = np.random.choice([0, 50], p=[0.98, 0.02])  # REMOVED .item()
    noise_fridge = np.random.normal(0, 5)
    refrigeration_consumption = baseline_fridge + daily_fridge + defrost_spikes + noise_fridge
    refrigeration_consumption = max(0, refrigeration_consumption)

    # --- Lighting Energy Data Generation ---
    lighting_consumption_base = 0
    if 7 <= timestamps_series.dt.hour.item() <= 22:
        lighting_consumption_base = 100
    daylight_effect = 20 * np.sin(np.pi * (timestamps_series.dt.hour - 7) / 15).item()
    daylight_effect = 0 if timestamps_series.dt.hour.item() < 7 or timestamps_series.dt.hour.item() > 22 else daylight_effect
    lighting_consumption = max(0, lighting_consumption_base - daylight_effect)
    noise_lighting = np.random.normal(0, 2)
    lighting_consumption = max(0, lighting_consumption + noise_lighting)

    # --- Total Solar Generation (Base for 70/30 split) ---
    daily_solar_base = 300 * np.sin(np.pi * (timestamps_series.dt.hour - 6) / 12).item()
    daily_solar_base = 0 if timestamps_series.dt.hour.item() < 6 or timestamps_series.dt.hour.item() > 18 else daily_solar_base
    seasonal_solar_base = 100 * np.sin(2 * np.pi * (timestamps_series.dt.dayofyear - 172) / 365).item()
    cloud_cover_base = np.random.uniform(0.3, 1)  # REMOVED .item()
    total_solar_generation = max(0, (daily_solar_base + seasonal_solar_base) * cloud_cover_base)

    # --- Electricity Price Data Generation ---
    base_price = 0.10
    tou_price = 0
    if 14 <= timestamps_series.dt.hour.item() <= 20:
        tou_price = 0.08
    elif timestamps_series.dt.hour.item() <= 6:
        tou_price = -0.03
    seasonal_price_adj = 0.02 * np.sin(2 * np.pi * (timestamps_series.dt.dayofyear - 172) / 365).item()
    noise_price = np.random.normal(0, 0.005)
    electricity_price = max(0.01, base_price + tou_price + seasonal_price_adj + noise_price)

    # --- IT System Power Consumption Generation ---
    baseline_it = 80
    daily_it = 30 * np.sin(2 * np.pi * (timestamps_series.dt.hour - 9) / 24).item()
    noise_it = np.random.normal(0, 5)
    it_consumption = max(0, baseline_it + daily_it + noise_it)

    # --- Other System Power Consumption Generation ---
    baseline_other = 50
    daily_other = 20 * np.sin(2 * np.pi * (timestamps_series.dt.hour - 12) / 24).item()
    noise_other = np.random.normal(0, 7)
    other_consumption = max(0, baseline_other + daily_other + noise_other)

    # --- Calculate Base Consumption Loads ---
    base_consumption_loads = (
            hvac_consumption +
            refrigeration_consumption +
            lighting_consumption +
            it_consumption +
            other_consumption
    )

    # --- Solar Split for current hour ---
    solar_available_for_use = 0.70 * total_solar_generation
    solar_dedicated_to_battery_potential = 0.30 * total_solar_generation

    # --- Battery Charge/Discharge & State Update ---
    hourly_battery_flows = [0.0] * num_battery_banks
    hourly_energy_changes = [0.0] * num_battery_banks
    current_hour_solar_used_to_charge_battery = 0.0

    # Phase 1: Battery Charging (from dedicated solar portion)
    remaining_solar_for_charging = solar_dedicated_to_battery_potential

    possible_charge_amounts_per_battery = []
    for i in range(num_battery_banks):
        if battery_energy_stored[i] < battery_capacity_kwh:
            max_charge_rate_allowed = battery_max_rate_kwh
            space_to_fill_kwh = battery_capacity_kwh - battery_energy_stored[i]
            max_charge_input_based_on_capacity = space_to_fill_kwh / charge_efficiency

            possible_charge_amounts_per_battery.append(min(max_charge_rate_allowed, max_charge_input_based_on_capacity))
        else:
            possible_charge_amounts_per_battery.append(0)

    total_possible_charge_from_all_batteries = sum(possible_charge_amounts_per_battery)
    solar_to_distribute_for_charging = min(remaining_solar_for_charging, total_possible_charge_from_all_batteries)

    if solar_to_distribute_for_charging > 0:
        num_chargeable_batteries = sum(1 for x in possible_charge_amounts_per_battery if x > 0)
        if num_chargeable_batteries > 0:
            equal_share_per_battery = solar_to_distribute_for_charging / num_chargeable_batteries

            for i in range(num_battery_banks):
                if possible_charge_amounts_per_battery[i] > 0:
                    charge_amount_for_this_battery = min(equal_share_per_battery,
                                                         possible_charge_amounts_per_battery[i])

                    actual_charge_flow_i = charge_amount_for_this_battery + np.random.normal(0, 0.5)
                    actual_charge_flow_i = max(0, actual_charge_flow_i)
                    actual_charge_flow_i = min(actual_charge_flow_i, charge_amount_for_this_battery)

                    hourly_battery_flows[i] = actual_charge_flow_i
                    hourly_energy_changes[i] = actual_charge_flow_i * charge_efficiency
                    current_hour_solar_used_to_charge_battery += actual_charge_flow_i

    # Phase 2: Battery Discharging (ONLY if solar is NOT available for direct use)
    net_demand_after_direct_solar = base_consumption_loads - solar_available_for_use
    current_slow_discharge_factor = np.random.uniform(0.1, 0.3)

    if net_demand_after_direct_solar > 0 and solar_available_for_use == 0:
        remaining_deficit = net_demand_after_direct_solar
        for i in range(num_battery_banks):
            if remaining_deficit > 0 and battery_energy_stored[i] > 0:
                max_discharge_rate_allowed = battery_max_rate_kwh * current_slow_discharge_factor
                available_discharge_power_from_stored = battery_energy_stored[i] * discharge_efficiency

                discharge_amount = min(remaining_deficit, max_discharge_rate_allowed,
                                       available_discharge_power_from_stored)

                actual_discharge_flow_magnitude = discharge_amount + np.random.normal(0, 0.5)
                actual_discharge_flow_magnitude = max(0, actual_discharge_flow_magnitude)
                actual_discharge_flow_magnitude = min(actual_discharge_flow_magnitude, remaining_deficit)

                if hourly_battery_flows[i] == 0:  # Only discharge if not already charging
                    hourly_battery_flows[i] -= actual_discharge_flow_magnitude
                    hourly_energy_changes[i] -= actual_discharge_flow_magnitude / discharge_efficiency

                remaining_deficit -= actual_discharge_flow_magnitude

    # Finalize Battery State for the Hour
    for i in range(num_battery_banks):
        battery_energy_stored[i] += hourly_energy_changes[i]
        battery_energy_stored[i] = np.clip(battery_energy_stored[i], 0, battery_capacity_kwh)

    # Data row as a dictionary
    data_row = {
        'timestamp': current_timestamp.isoformat(),
        'HVAC_Energy(t)': hvac_consumption,
        'Refrigeration_Energy(t)': refrigeration_consumption,
        'Lighting_Energy(t)': lighting_consumption,
        'IT_System(t)': it_consumption,
        'Other_System(t)': other_consumption,
        'Electricity_Price(t)': electricity_price,
        'Solar_Available_for_Use(t)': float(solar_available_for_use),
        'Solar_Used_to_Charge_Battery(t)': float(current_hour_solar_used_to_charge_battery),
        'Base_Consumption_Loads(t)': base_consumption_loads,
        'Total_Energy(t)': float(base_consumption_loads + current_hour_solar_used_to_charge_battery),
        'Battery_1_Charge_Discharge(t)': float(hourly_battery_flows[0]),
        'Battery_1_Energy_Stored(t)': float(battery_energy_stored[0]),
        'Battery_2_Charge_Discharge(t)': float(hourly_battery_flows[1]),
        'Battery_2_Energy_Stored(t)': float(battery_energy_stored[1]),
    }

    df_row = pd.DataFrame([data_row])

    output = io.StringIO()
    df_row.to_csv(output, index=False, header=True)
    csv_string = output.getvalue()

    return csv_string


# --- AWS Lambda Handler Function ---
s3_client = boto3.client('s3')

# Define battery parameters for default initial state
BATTERY_CAPACITY_KWH = 500  # This needs to match the value in generate_single_hour_data_for_lambda


def lambda_handler(event, context):
    """
    AWS Lambda function to generate hourly synthetic energy data and upload it to S3,
    considering the previous hour's battery state.
    """
    try:
        current_time = datetime.utcnow()  # Changed to UTC for consistency

        # --- 1. Get previous hour's battery state ---
        print("Attempting to retrieve last hour's battery state from S3...")
        latest_data_dict = get_latest_hourly_data()

        # Default to half capacity if no previous data is found (e.g., first run)
        initial_battery_1_stored = BATTERY_CAPACITY_KWH / 2
        initial_battery_2_stored = BATTERY_CAPACITY_KWH / 2

        if latest_data_dict and 'Battery_1_Energy_Stored(t)' in latest_data_dict and 'Battery_2_Energy_Stored(t)' in latest_data_dict:
            initial_battery_1_stored = latest_data_dict['Battery_1_Energy_Stored(t)']
            initial_battery_2_stored = latest_data_dict['Battery_2_Energy_Stored(t)']
            print(
                f"Retrieved previous battery state: Bat1={initial_battery_1_stored} kWh, Bat2={initial_battery_2_stored} kWh")
        else:
            print(
                f"No previous battery state found or incomplete. Starting with default: {BATTERY_CAPACITY_KWH / 2} kWh each.")

        # --- 2. Generate current hour's data with initial battery state ---
        csv_data = generate_single_hour_data_for_lambda(
            current_time,
            initial_battery_energy_stored_1=initial_battery_1_stored,
            initial_battery_energy_stored_2=initial_battery_2_stored
        )

        # Define the S3 key (object path) based on the current timestamp and existing structure
        s3_key = (
            f"{HOURLY_DATA_BASE_PREFIX}"
            f"year={current_time.year}/"
            f"month={current_time.strftime('%m')}/"
            f"day={current_time.strftime('%d')}/"
            f"store_energy_data_{current_time.strftime('%H')}.csv"
        )

        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=csv_data,
            ContentType='text/csv'
        )

        print(f"Successfully uploaded data for {current_time.isoformat()} to s3://{S3_BUCKET_NAME}/{s3_key}")

        return {
            'statusCode': 200,
            'body': json.dumps('Hourly energy data ingestion successful!')
        }
    except Exception as e:
        print(f"Error during hourly energy data ingestion: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error: {str(e)}")
        }