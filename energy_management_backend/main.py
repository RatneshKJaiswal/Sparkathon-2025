# --- 1. FastAPI App Initialization ---
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone, date
from typing import Optional
import pandas as pd

# Assuming these are separate modules or helper functions
import data_loader_module, forecast_model_module
import recommendation_engine_module

# uvicorn main:app --host 127.0.0.1 --port 5000 --reload

app = FastAPI(
    title="Energy Management System API",
    description="API for real-time KPIs, forecasts, recommendations, and historical energy data.",
    version="1.0.0"
)

# --- Add this CORS middleware section ---
origins = [
    "http://localhost:3003", # The default port for Next.js
    "http://localhost",
    # Add any other origins if your frontend is deployed elsewhere
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# --- 2. API Endpoints ---

@app.get("/api/v1/current-status", summary="Get real-time KPIs and current energy mix")
async def get_current_status():
    """
    Retrieves real-time Key Performance Indicators (KPIs) and the current energy mix.
    """
    try:
        # PURELY PSEUDO-CODE LOGIC:
        # 1. Get the latest available timestamp from your data source (e.g., last row in hourly CSV)
        latest_timestamp_data = data_loader_module.get_latest_hourly_data()

        if not latest_timestamp_data:
            raise HTTPException(status_code=404, detail="No current status data available")

        # 2. Extract relevant KPIs and energy mix components
        # This will map directly from your CSV columns to the API response structure
        current_kpis = {
            "total_consumption_kwh": latest_timestamp_data.get("Total_Energy(t)", 0.0),
            "solar_available_for_use_kwh": latest_timestamp_data.get("Solar_Available_for_Use(t)", 0.0),
            "solar_used_to_charge_battery_kwh": latest_timestamp_data.get("Solar_Used_to_Charge_Battery(t)", 0.0),
            "battery_1_charge_discharge_kwh": latest_timestamp_data.get("Battery_1_Charge_Discharge(t)", 0.0),
            "battery_1_energy_stored_kwh": latest_timestamp_data.get("Battery_1_Energy_Stored(t)", 0.0),
            "battery_2_charge_discharge_kwh": latest_timestamp_data.get("Battery_2_Charge_Discharge(t)", 0.0),
            "battery_2_energy_stored_kwh": latest_timestamp_data.get("Battery_2_Energy_Stored(t)", 0.0),
            # Grid import/export would be calculated based on Total_Energy(t), Solar, and Battery flows
            "grid_import_kwh": max(0, latest_timestamp_data.get("Base_Consumption_Loads(t)", 0.0) - latest_timestamp_data.get("Solar_Available_for_Use(t)", 0.0)),
            "electricity_price_usd_per_kwh": latest_timestamp_data.get("Electricity_Price(t)", 0.0)
        }

        energy_mix = {
            "hvac_energy_kwh": latest_timestamp_data.get("HVAC_Energy(t)", 0.0),
            "refrigeration_energy_kwh": latest_timestamp_data.get("Refrigeration_Energy(t)", 0.0),
            "lighting_energy_kwh": latest_timestamp_data.get("Lighting_Energy(t)", 0.0),
            "it_system_kwh": latest_timestamp_data.get("IT_System(t)", 0.0),
            "other_system_kwh": latest_timestamp_data.get("Other_System(t)", 0.0)
        }

        return {
            "timestamp": latest_timestamp_data.get("timestamp").isoformat() + "Z",  # Ensure ISO 8601 with Z
            "current_kpis": current_kpis,
            "energy_mix": energy_mix
        }
    except Exception as e:
        # Log the error for debugging
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


@app.get("/api/v1/historical-data", summary="Access aggregated historical data")
async def get_historical_data(
        start_date: date = Query(..., description="Start date in YYYY-MM-DD format."),
        end_date: date = Query(..., description="End date in YYYY-MM-DD format."),
        aggregation_level: Optional[str] = Query("daily", description="Aggregation level: 'hourly' or 'daily'.")
):
    """
    Provides access to aggregated historical energy data by date range and aggregation level.
    """
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date cannot be after end_date.")

    if aggregation_level not in ["hourly", "daily"]:
        raise HTTPException(status_code=400, detail="Invalid aggregation_level. Must be 'hourly' or 'daily'.")

    try:
        if aggregation_level == "daily":
            historical_data = data_loader_module.load_daily_aggregated_data(start_date, end_date)
            formatted_data = []
            for _, row in historical_data.iterrows():
                formatted_data.append({
                    "date": row["date"].isoformat(),
                    "Daily_HVAC_Energy_kWh": row["Daily_HVAC_Energy_kWh"],
                    "Daily_Refrigeration_Energy_kWh": row["Daily_Refrigeration_Energy_kWh"],
                    "Daily_Lighting_Energy_kWh": row["Daily_Lighting_Energy_kWh"],
                    "Daily_IT_System_Energy_kWh": row["Daily_IT_System_Energy_kWh"],
                    "Daily_Other_System_Energy_kWh": row["Daily_Other_System_Energy_kWh"],
                    "Daily_Solar_Available_for_Use_kWh": row["Daily_Solar_Available_for_Use_kWh"],
                    "Daily_Solar_Used_to_Charge_Battery_kWh": row["Daily_Solar_Used_to_Charge_Battery_kWh"],
                    "Daily_Battery_1_average_charge": row["Daily_Battery_1_average_charge"],
                    "Daily_Battery_2_average_charge": row["Daily_Battery_2_average_charge"],
                    "Daily_Total_Energy_Usage_kWh": row["Daily_Total_Energy_Usage_kWh"],
                    "Daily_Avg_Electricity_Price_USD_per_kWh": row["Daily_Avg_Electricity_Price_USD_per_kWh"]
                })

        else:  # aggregation_level == "hourly"
            df = data_loader_module.load_historical_data_in_chunks(start_date, end_date)

            if df.empty:
                raise HTTPException(status_code=404, detail="No historical data found for the specified date range.")

            formatted_data = []
            for _, row in df.iterrows():
                formatted_data.append({
                    "timestamp": row["timestamp"].isoformat() + "Z",
                    "HVAC_Energy(t)": row["HVAC_Energy(t)"],
                    "Refrigeration_Energy(t)": row["Refrigeration_Energy(t)"],
                    "Lighting_Energy(t)": row["Lighting_Energy(t)"],
                    "IT_System(t)": row.get("IT_System(t)", 0.0),
                    "Other_System(t)": row.get("Other_System(t)", 0.0),
                    "Solar_Available_for_Use(t)": row["Solar_Available_for_Use(t)"],
                    "Solar_Used_to_Charge_Battery(t)": row["Solar_Used_to_Charge_Battery(t)"],
                    "Battery_1_Charge_Discharge(t)": row["Battery_1_Charge_Discharge(t)"],
                    "Battery_2_Charge_Discharge(t)": row["Battery_2_Charge_Discharge(t)"],
                    "Total_Energy(t)": row["Total_Energy(t)"],
                    "Electricity_Price(t)": row["Electricity_Price(t)"]
                })

        return {
            "query_start_date": start_date.isoformat(),
            "query_end_date": end_date.isoformat(),
            "aggregation_level": aggregation_level,
            "data": formatted_data
        }

    except FileNotFoundError:
        raise HTTPException(status_code=404,
                            detail="Required data files not found. Ensure data generation is complete.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve historical data: {e}")


@app.get("/api/v1/forecast", summary="Get next hour, today's total, and week's total energy forecasts")
async def get_forecast():
    """
    Provides:
    - Next hour forecast
    - Today's total forecast (past actuals + remaining predicted hours)
    - Current week's total forecast (past actuals + remaining predicted hours)
    """
    try:
        now_utc = datetime.now().replace(minute=0, second=0, microsecond=0, tzinfo=timezone.utc)
        start_of_day = now_utc.replace(hour=0)
        start_of_week = start_of_day - timedelta(days=start_of_day.weekday())  # Monday start

        # Generate forecast for the next 168 hours (1 week)
        forecast_predictions = forecast_model_module.generate_forecast(forecast_horizon_hours=168)

        if not forecast_predictions:
            raise HTTPException(status_code=503, detail="Forecasting model unavailable or returned no predictions.")

        # Organize forecast predictions by timestamp
        forecast_by_time = {p["timestamp"]: p for p in forecast_predictions}

        historical_df = data_loader_module.load_historical_data_in_chunks(start_of_week.date(), now_utc.date())

        if historical_df.empty:
            raise HTTPException(status_code=404, detail="No historical data available to compute today/week totals.")

        historical_df['timestamp'] = pd.to_datetime(historical_df['timestamp'], utc=True)
        historical_df = historical_df.set_index('timestamp')

        # Sum of past hours for today
        past_today = historical_df.loc[start_of_day:now_utc].copy()
        total_consumed_today_actual = past_today["Base_Consumption_Loads(t)"].sum()
        total_solar_today_actual = past_today["Solar_Available_for_Use(t)"].sum()

        # Sum of past hours for the current week
        past_week = historical_df.loc[start_of_week:now_utc].copy()
        total_consumed_week_actual = past_week["Base_Consumption_Loads(t)"].sum()
        total_solar_week_actual = past_week["Solar_Available_for_Use(t)"].sum()

        # Calculate predicted consumption for remaining hours of today
        remaining_hours_today = [
            (start_of_day + timedelta(hours=h)).isoformat()
            for h in range(24)
            if (start_of_day + timedelta(hours=h)) > now_utc and (
                        start_of_day + timedelta(hours=h)).isoformat() in forecast_by_time
        ]
        predicted_today_total = sum(forecast_by_time[t]["Base_Consumption_Loads(t)"] for t in remaining_hours_today)
        predicted_solar_today = sum(forecast_by_time[t]["Solar_Available_for_Use(t)"] for t in remaining_hours_today)

        # Calculate predicted consumption for remaining hours of the week
        end_of_week = start_of_week + timedelta(days=7)
        remaining_hours_week = [
            (start_of_week + timedelta(hours=h)).isoformat()
            for h in range(24 * 7)
            if (start_of_week + timedelta(hours=h)) > now_utc and (
                        start_of_week + timedelta(hours=h)).isoformat() in forecast_by_time
        ]
        predicted_week_total = sum(forecast_by_time[t]["Base_Consumption_Loads(t)"] for t in remaining_hours_week)
        predicted_solar_week_total = sum(forecast_by_time[t]["Solar_Available_for_Use(t)"] for t in remaining_hours_week)


        # Get next hour forecast
        next_hour_time = now_utc + timedelta(hours=1)
        next_hour_forecast = forecast_by_time.get(next_hour_time.isoformat())
        if not next_hour_forecast:
            raise HTTPException(status_code=500, detail=f"Forecast missing for next hour: {next_hour_time.isoformat()}")

        return {
            "next_hour_forecast": {
                "timestamp": next_hour_time.isoformat(),
                "base_consumption_kwh": next_hour_forecast["Base_Consumption_Loads(t)"],
                "solar_battery_for_use_kwh": next_hour_forecast["Solar_Available_for_Use(t)"]*1.43,
                "battery_1_energy_stored_kwh": next_hour_forecast["Battery_1_Energy_Stored(t)"],
                "battery_2_energy_stored_kwh": next_hour_forecast["Battery_2_Energy_Stored(t)"],
                "grid_import_kwh": round(next_hour_forecast["Base_Consumption_Loads(t)"] - next_hour_forecast["Solar_Available_for_Use(t)"], 7),
                "electricity_price_usd_per_kwh": next_hour_forecast["Electricity_Price(t)"],
                "hvac_energy_kwh": next_hour_forecast["HVAC_Energy(t)"],
                "refrigeration_energy_kwh": next_hour_forecast["Refrigeration_Energy(t)"],
                "lighting_energy_kwh": next_hour_forecast["Lighting_Energy(t)"],
                "it_system_kwh": next_hour_forecast["IT_System(t)"],
                "other_system_kwh": next_hour_forecast["Other_System(t)"]
            },
            "today_total_forecast": {
                "date": start_of_day.date().isoformat(),
                "base_consumption_kwh": round(total_consumed_today_actual + predicted_today_total, 7),
                "total_useful_solar_kwh": round((total_solar_today_actual + predicted_solar_today)*1.43, 7),
            },
            "week_total_forecast": {
                "week_start_date": start_of_week.date().isoformat(),
                "week_end_date": (end_of_week - timedelta(days=1)).date().isoformat(),
                "base_consumption_kwh": round(total_consumed_week_actual + predicted_week_total, 7),
                "total_useful_solar_kwh": round((total_solar_week_actual + predicted_solar_week_total)*1.43, 7),
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate forecasts: {e}")


@app.get("/api/v1/recommendations", summary="Get optimization suggestions")
async def get_recommendations(
        optimization_goal: Optional[str] = Query(
            "cost_reduction",
            description="Primary goal for recommendations (cost_reduction, carbon_footprint, battery_longevity)."
        ),
        period: Optional[str] = Query(
            "hourly",
            description="Recommendation period (hourly, daily, weekly)."
        )
):
    """
    Retrieves energy optimization recommendations based on current status, forecast data,
    and a specified optimization goal and period.
    """
    valid_goals = ["cost_reduction", "carbon_footprint", "battery_longevity"]
    valid_periods = ["hourly", "daily", "weekly"]

    if optimization_goal not in valid_goals:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid optimization_goal. Must be one of: {', '.join(valid_goals)}"
        )

    if period not in valid_periods:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid period. Must be one of: {', '.join(valid_periods)}"
        )

    try:
        # 1. Get current status data
        current_status_data = await get_current_status()  # Re-use the current-status logic

        # 2. Determine forecast horizon based on the period
        forecast_horizon_hours: int
        if period == "hourly":
            forecast_horizon_hours = 24  # Look ahead for immediate hourly decisions
        elif period == "daily":
            forecast_horizon_hours = 24  # Need at least 24 hours for daily aggregation
        elif period == "weekly":
            forecast_horizon_hours = 168  # Need 168 hours for weekly aggregation
        else:
            # This case should ideally be caught by the valid_periods check, but as a fallback
            forecast_horizon_hours = 24

        # 3. Get forecast data directly from the module, not the endpoint
        forecast_data_for_recommendations = forecast_model_module.generate_forecast(forecast_horizon_hours)

        if not forecast_data_for_recommendations:
            raise HTTPException(status_code=404, detail="No forecast data available to generate recommendations.")

        # 4. Generate recommendations using the recommendation engine module
        suggestions = recommendation_engine_module.generate_recommendations(
            current_status=current_status_data,
            forecast_data=forecast_data_for_recommendations,
            optimization_goal=optimization_goal,
            period=period
        )

        if not suggestions:
            return {
                "recommendation_timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                "optimization_goal": optimization_goal,
                "period": period,
                "suggestions": []  # Return empty list if no recommendations
            }

        return {
            "recommendation_timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            "optimization_goal": optimization_goal,
            "period": period,
            "suggestions": suggestions
        }
    except HTTPException as e:
        # Re-raise HTTP exceptions from helper calls
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while generating recommendations: {e}")

