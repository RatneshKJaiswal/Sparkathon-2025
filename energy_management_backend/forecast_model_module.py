
import xgboost as xgb
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone

TARGET_MODELS = [
    "models/Battery_1_Energy_Stored(t)_model.json",
    "models/Battery_2_Energy_Stored(t)_model.json",
    "models/Electricity_Price(t)_model.json",
    "models/HVAC_Energy(t)_model.json",
    "models/IT_System(t)_model.json",
    "models/Lighting_Energy(t)_model.json",
    "models/Other_System(t)_model.json",
    "models/Refrigeration_Energy(t)_model.json",
    "models/Solar_Available_for_Use(t)_model.json",
    "models/Total_Energy(t)_model.json",
    "models/Base_Consumption_Loads(t)_model.json"
]

TARGET_NAMES = [
    "Battery_1_Energy_Stored(t)",
    "Battery_2_Energy_Stored(t)",
    "Electricity_Price(t)",
    "HVAC_Energy(t)",
    "IT_System(t)",
    "Lighting_Energy(t)",
    "Other_System(t)",
    "Refrigeration_Energy(t)",
    "Solar_Available_for_Use(t)",
    "Total_Energy(t)",
    "Base_Consumption_Loads(t)"
]

def generate_features(forecast_horizon_hours: int) -> pd.DataFrame:
    timestamps = pd.date_range(datetime.now(timezone.utc), periods=forecast_horizon_hours, freq='h')
    features = pd.DataFrame({
        "dayofyear": timestamps.dayofyear,
        "hour": timestamps.hour,
        "dayofweek": timestamps.dayofweek,
        "quarter": timestamps.quarter,
        "month": timestamps.month,
    }, index=timestamps)
    return features

def generate_forecast(forecast_horizon_hours: int) -> List[Dict[str, Any]]:
    X_test = generate_features(forecast_horizon_hours)
    timestamps = X_test.index

    predictions = {target: [] for target in TARGET_NAMES}

    for model_file, target in zip(TARGET_MODELS, TARGET_NAMES):
        reg = xgb.XGBRegressor()
        reg.load_model(model_file)
        pred = reg.predict(X_test)
        predictions[target] = pred

    forecast = []
    for i in range(forecast_horizon_hours):
        forecast.append({
            "timestamp": timestamps[i].replace(minute=0, second=0, microsecond=0).isoformat(),
            **{target: round(float(predictions[target][i]), 7) if (
                        target == "Electricity_Price(t)" or predictions[target][i] >= 1) else 0 for target in
               TARGET_NAMES}
        })
    return forecast

if __name__ == "__main__":
    forecast = generate_forecast(forecast_horizon_hours=24)
    for item in forecast:
        print(item)