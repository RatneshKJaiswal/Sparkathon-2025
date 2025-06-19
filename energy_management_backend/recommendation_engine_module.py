# filename: recommendation_engine_module.py

from datetime import datetime, timedelta, date, timezone  # Import timezone
from typing import List, Dict, Any, Optional
import pandas as pd

# Import your data loading and forecasting modules
# These are necessary to fetch real current status and predicted data for testing
import data_loader_module
import forecast_model_module


def generate_recommendations(
        current_status: Dict[str, Any],
        forecast_data: List[Dict[str, Any]],
        optimization_goal: str = "cost_reduction",
        period: str = "hourly"
) -> List[Dict[str, Any]]:
    """
    Generates rule-based recommendations for energy optimization based on a specified period.

    Args:
        current_status (Dict[str, Any]): Dictionary containing current KPIs and energy mix.
                                         Expected structure similar to /api/v1/current-status response.
        forecast_data (List[Dict[str, Any]]): List of dictionaries representing future energy predictions.
                                               Expected structure similar to /api/v1/forecast predictions array.
                                               MUST cover the full 'period' horizon (e.g., 24h for daily, 168h for weekly).
        optimization_goal (str): The primary goal for optimization (e.g., "cost_reduction", "carbon_footprint", "battery_longevity").
        period (str): The aggregation level for recommendations ("hourly", "daily", "weekly").

    Returns:
        List[Dict[str, Any]]: A list of dictionaries, where each dictionary describes a recommended action.
    """
    recommendations = []

    # --- 1. Data Preprocessing and Validation ---

    # Ensure current_status_dt is a UTC-aware datetime object
    current_status_dt: Optional[datetime] = None
    if "timestamp" in current_status and current_status["timestamp"]:
        try:
            # Parse the timestamp string and ensure it's UTC-aware
            current_status_dt = datetime.fromisoformat(current_status["timestamp"].replace('Z', '')).replace(
                tzinfo=timezone.utc)
        except ValueError:
            print(
                f"Warning: Could not parse current_status timestamp: {current_status['timestamp']}. Using current UTC time.")
            current_status_dt = datetime.now(timezone.utc).replace(microsecond=0)
    else:
        print("Warning: 'timestamp' not found in current_status. Using current UTC time for recommendations.")
        current_status_dt = datetime.now(timezone.utc).replace(microsecond=0)

    if current_status_dt is None:  # Fallback if parsing failed and no timestamp was present
        print("Error: Failed to establish current_status_dt. Cannot generate recommendations.")
        return []

    # Convert forecast data timestamps to UTC-aware datetime objects for easier manipulation
    for entry in forecast_data:
        if 'timestamp' in entry and entry['timestamp']:
            entry_dt = datetime.fromisoformat(entry['timestamp'].replace('Z', ''))
            if entry_dt.tzinfo is None:  # Ensure it's UTC-aware, if it's naive after parsing (e.g., if 'Z' wasn't there)
                entry['datetime'] = entry_dt.replace(tzinfo=timezone.utc)
            else:
                entry['datetime'] = entry_dt
        else:
            entry['datetime'] = None  # Handle cases where timestamp might be missing in forecast entry

    # Filter out forecast entries with invalid or missing datetimes
    forecast_data = [entry for entry in forecast_data if entry.get('datetime')]
    if not forecast_data:
        recommendations.append(
            {"type": "Info", "action": "No valid forecast data available for recommendations.", "profit_in_usd": 0.0})
        return recommendations

    # Extract current KPIs (with defaults to avoid KeyError)
    current_kpis = current_status.get("current_kpis", {})
    current_total_consumption = current_kpis.get("total_consumption_kwh", 0.0)
    current_solar_available = current_kpis.get("solar_available_for_use_kwh", 0.0)
    current_battery_1_stored = current_kpis.get("battery_1_energy_stored_kwh", 0.0)
    current_battery_2_stored = current_kpis.get("battery_2_energy_stored_kwh", 0.0)
    current_electricity_price = current_kpis.get("electricity_price_usd_per_kwh", 0.0)
    current_hvac_energy = current_status.get("energy_mix", {}).get("hvac_energy_kwh", 0.0)
    current_lighting_energy = current_status.get("energy_mix", {}).get("lighting_energy_kwh", 0.0)

    # Constants (can be made configurable if needed)
    BATTERY_CAPACITY_KWH = 500.0  # Example capacity for a single battery
    BATTERY_CHARGE_THRESHOLD_LOW = 0.20 * BATTERY_CAPACITY_KWH  # 20% of capacity
    BATTERY_CHARGE_THRESHOLD_HIGH = 0.80 * BATTERY_CAPACITY_KWH  # 80% of capacity
    PRICE_THRESHOLD_HIGH = 0.25  # USD/kWh
    PRICE_THRESHOLD_LOW = 0.10  # USD/kWh
    SOLAR_THRESHOLD_HIGH = 50.0  # kWh
    CONSUMPTION_THRESHOLD_HIGH = 200.0  # kWh

    # New constants for specific device control and impact estimation
    # These are example values and should be tuned based on actual facility data
    HVAC_DEFAULT_IMPACT_PER_DEGREE_KWH = 10.0  # Estimated kWh saved/cost per degree Celsius/Fahrenheit change per hour
    LIGHTING_TYPICAL_LOAD_KWH = 20.0  # Typical kWh for non-critical lighting load per hour

    # --- 2. Recommendation Logic Based on Period and Goal ---

    if period == "hourly":
        # Find hours with max solar availability and min/max electricity prices within forecast horizon
        max_solar_hour = None
        min_price_hour = None
        max_price_hour = None

        # Filter forecast data relevant for the immediate next few hours (e.g., next 24h for hourly decisions)
        # Ensure only future forecasts relative to current_status_dt are considered
        relevant_forecast = [
            f for f in forecast_data if f['datetime'] > current_status_dt
        ]

        if relevant_forecast:
            # Use correct keys for accessing forecast data
            max_solar_hour = max(relevant_forecast, key=lambda x: x.get('Solar_Available_for_Use(t)', 0.0))
            min_price_hour = min(relevant_forecast, key=lambda x: x.get('Electricity_Price(t)', float('inf')))
            max_price_hour = max(relevant_forecast, key=lambda x: x.get('Electricity_Price(t)', float('-inf')))

        # Hourly recommendations for Cost Reduction
        if optimization_goal == "cost_reduction":
            # Scenario 1: High solar forecast & low battery charge -> Charge batteries
            if max_solar_hour and max_solar_hour.get('Solar_Available_for_Use(t)', 0.0) > SOLAR_THRESHOLD_HIGH and \
                    (
                            current_battery_1_stored < BATTERY_CHARGE_THRESHOLD_HIGH or current_battery_2_stored < BATTERY_CHARGE_THRESHOLD_HIGH) and \
                    max_solar_hour['datetime'] > current_status_dt:  # Ensure max solar hour is in the future

                charge_amount_b1 = max(0, BATTERY_CAPACITY_KWH - current_battery_1_stored)
                charge_amount_b2 = max(0, BATTERY_CAPACITY_KWH - current_battery_2_stored)
                total_charge_potential = charge_amount_b1 + charge_amount_b2

                # Estimated profit/savings by avoiding grid purchase at current price, assuming solar covers the need
                financial_impact_value = (min(total_charge_potential, max_solar_hour.get('Solar_Available_for_Use(t)',
                                                                                         0.0)) * current_electricity_price)

                recommendations.append({
                    "type": "Battery Management",
                    "action": f"Prioritize charging batteries (up to {total_charge_potential:.2f} kWh total) using solar power around {max_solar_hour['datetime'].strftime('%H:%M')} UTC. Predicted Solar: {max_solar_hour.get('Solar_Available_for_Use(t)', 0.0):.2f} kWh.",
                    "financial_impact": f"Estimated profit/savings: ${financial_impact_value:.2f} by reducing grid reliance during peak solar.",
                    "profit_in_usd": float(f"{financial_impact_value:.7f}")
                })

            # Scenario 2: High electricity price forecast -> Discharge batteries or shift loads
            if max_price_hour and max_price_hour.get('Electricity_Price(t)', 0.0) > PRICE_THRESHOLD_HIGH and \
                    (
                            current_battery_1_stored > BATTERY_CHARGE_THRESHOLD_LOW or current_battery_2_stored > BATTERY_CHARGE_THRESHOLD_LOW) and \
                    max_price_hour['datetime'] > current_status_dt:  # Ensure max price hour is in the future

                discharge_amount_b1 = max(0, current_battery_1_stored - BATTERY_CHARGE_THRESHOLD_LOW)
                discharge_amount_b2 = max(0, current_battery_2_stored - BATTERY_CHARGE_THRESHOLD_LOW)
                total_discharge_potential = discharge_amount_b1 + discharge_amount_b2

                # Estimated profit/savings by using stored energy instead of buying from grid at max forecasted price
                financial_impact_value = total_discharge_potential * max_price_hour.get('Electricity_Price(t)', 0.0)

                recommendations.append({
                    "type": "Battery Management",
                    "action": f"Discharge batteries (up to {total_discharge_potential:.2f} kWh total) and use stored energy around {max_price_hour['datetime'].strftime('%H:%M')} UTC to avoid high grid prices ({max_price_hour.get('Electricity_Price(t)', 0.0):.2f} USD/kWh).",
                    "financial_impact": f"Estimated profit/savings: ${financial_impact_value:.2f} by avoiding peak price hours.",
                    "profit_in_usd": float(f"{financial_impact_value:.7f}")
                })

                # HVAC Adjustment for high price
                if current_hvac_energy > 0.1 * current_total_consumption and current_electricity_price > PRICE_THRESHOLD_HIGH:  # HVAC is a significant load and current price is already high
                    # Profit/Savings from reducing HVAC consumption during high price
                    financial_impact_value = HVAC_DEFAULT_IMPACT_PER_DEGREE_KWH * 2 * max_price_hour.get(
                        'Electricity_Price(t)', 0.0)
                    recommendations.append({
                        "type": "Device Control",
                        "action": f"Adjust HVAC setpoint by +2 degrees Celsius/Fahrenheit at {max_price_hour['datetime'].strftime('%H:%M')} UTC to reduce energy consumption during high price periods.",
                        "financial_impact": f"Estimated profit/savings: ${financial_impact_value:.2f}.",
                        "profit_in_usd": float(f"{financial_impact_value:.7f}")
                    })

                # Lighting Adjustment for high price (assuming non-critical lighting)
                if current_lighting_energy > 0.1 * current_total_consumption and current_electricity_price > PRICE_THRESHOLD_HIGH:
                    # Profit/Savings from reducing lighting consumption during high price
                    financial_impact_value = LIGHTING_TYPICAL_LOAD_KWH * max_price_hour.get('Electricity_Price(t)', 0.0)
                    recommendations.append({
                        "type": "Device Control",
                        "action": f"Turn off non-critical lighting in areas like warehouse sector C from {current_status_dt.strftime('%H:%M')} UTC for the next hour to reduce demand.",
                        "financial_impact": f"Estimated profit/savings: ${financial_impact_value:.2f}.",
                        "profit_in_usd": float(f"{financial_impact_value:.7f}")
                    })

            # Scenario 3: Low electricity price forecast -> Charge batteries from grid / Shift loads
            if min_price_hour and min_price_hour.get('Electricity_Price(t)', 0.0) < PRICE_THRESHOLD_LOW and \
                    (
                            current_battery_1_stored < BATTERY_CAPACITY_KWH or current_battery_2_stored < BATTERY_CAPACITY_KWH) and \
                    min_price_hour['datetime'] > current_status_dt + timedelta(
                hours=1):  # Ensure min price hour is slightly in the future to allow action

                charge_amount_b1 = max(0, BATTERY_CAPACITY_KWH - current_battery_1_stored)
                charge_amount_b2 = max(0, BATTERY_CAPACITY_KWH - current_battery_2_stored)
                total_charge_potential = charge_amount_b1 + charge_amount_b2

                # This is a cost, not a profit, but is strategic for future savings
                financial_impact_value = - (total_charge_potential * min_price_hour.get('Electricity_Price(t)',
                                                                                        0.0))  # Negative for cost

                recommendations.append({
                    "type": "Battery Management",
                    "action": f"Consider charging batteries (up to {total_charge_potential:.2f} kWh total) from the grid around {min_price_hour['datetime'].strftime('%H:%M')} UTC when electricity prices are lowest ({min_price_hour.get('Electricity_Price(t)', 0.0):.2f} USD/kWh).",
                    "financial_impact": f"Estimated cost for charge: ${abs(financial_impact_value):.2f}. Optimizes battery charging cost, prepares for higher price periods.",
                    "profit_in_usd": float(f"{financial_impact_value:.7f}")  # This will be negative
                })

                # HVAC Adjustment for low price (pre-cooling/heating)
                if current_hvac_energy > 0.1 * current_total_consumption and current_electricity_price > min_price_hour.get(
                        'Electricity_Price(t)', 0.0):
                    # Benefit of using cheaper energy now to avoid higher cost later
                    financial_impact_value = HVAC_DEFAULT_IMPACT_PER_DEGREE_KWH * 2 * (
                                current_electricity_price - min_price_hour.get('Electricity_Price(t)', 0.0))
                    recommendations.append({
                        "type": "Device Control",
                        "action": f"Adjust HVAC setpoint by -2 degrees Celsius/Fahrenheit at {min_price_hour['datetime'].strftime('%H:%M')} UTC to pre-cool/heat using cheaper energy.",
                        "financial_impact": f"Estimated profit/savings: ${financial_impact_value:.2f} by leveraging low price for HVAC.",
                        "profit_in_usd": float(f"{financial_impact_value:.7f}")
                    })

                # Load shifting suggestion for general non-essential loads
                recommendations.append({
                    "type": "Load Shifting",
                    "action": f"Shift non-essential high-power loads (e.g., specific manufacturing processes, EV charging) to forecasted low-price period around {min_price_hour['datetime'].strftime('%H:%M')} UTC.",
                    "financial_impact": f"Utilize cheaper energy for cost reduction and potential future profit.",
                    "profit_in_usd": 0.0
                    # Cannot directly quantify profit for general load shifting without more context
                })

            # Scenario 4: High current consumption -> Load shedding or check HVAC
            if current_total_consumption > CONSUMPTION_THRESHOLD_HIGH:
                # Estimate a generic saving for reducing high consumption
                financial_impact_value = current_total_consumption * current_electricity_price * 0.1  # 10% reduction
                recommendations.append({
                    "type": "Operational Efficiency",
                    "action": "Current energy consumption is high. Review active loads and consider temporarily reducing non-essential equipment, especially HVAC settings.",
                    "financial_impact": "Immediate reduction in electricity usage and costs, leading to profit/savings.",
                    "profit_in_usd": float(f"{financial_impact_value:.7f}")
                })

        # Hourly recommendations for Carbon Footprint
        elif optimization_goal == "carbon_footprint":
            # Assuming higher solar availability implies lower carbon intensity of grid
            if max_solar_hour and max_solar_hour.get('Solar_Available_for_Use(t)', 0.0) > SOLAR_THRESHOLD_HIGH and \
                    max_solar_hour['datetime'] > current_status_dt:
                recommendations.append({
                    "type": "Carbon  Reduction",
                    "action": f"Maximize use of solar energy around {max_solar_hour['datetime'].strftime('%H:%M')} UTC. Charge batteries or run high loads to reduce reliance on potentially carbon-intensive grid power.",
                    "financial_impact": "Lower carbon emissions by utilizing clean solar energy. Indirectly supports green initiatives and brand value.",
                    "profit_in_usd": 0.0  # Direct monetary profit not applicable
                })

                # HVAC and Lighting adjustments for carbon footprint
                if current_hvac_energy > 0.1 * current_total_consumption and max_solar_hour.get(
                        'Solar_Available_for_Use(t)', 0.0) > SOLAR_THRESHOLD_HIGH:
                    recommendations.append({
                        "type": "Device Control",
                        "action": f"Adjust HVAC setpoint by -1 degree Celsius/Fahrenheit at {max_solar_hour['datetime'].strftime('%H:%M')} UTC to utilize abundant solar energy for cooling/heating.",
                        "financial_impact": "Reduces carbon footprint by leveraging clean energy for HVAC. Indirect financial benefits from compliance or incentives.",
                        "profit_in_usd": 0.0  # Direct monetary profit not applicable
                    })
                if current_lighting_energy > 0.1 * current_total_consumption and max_solar_hour.get(
                        'Solar_Available_for_Use(t)', 0.0) > SOLAR_THRESHOLD_HIGH:
                    recommendations.append({
                        "type": "Device Control",
                        "action": f"Ensure non-critical lighting is turned off in warehouse sector C from {current_status_dt.strftime('%H:%M')} UTC, or consider dimming, to maximize solar self-consumption and reduce carbon footprint.",
                        "financial_impact": "Reduces carbon footprint by minimizing non-essential grid consumption. Indirect financial benefits from compliance or incentives.",
                        "profit_in_usd": 0.0  # Direct monetary profit not applicable
                    })
            else:
                recommendations.append({
                    "type": "Carbon  Reduction",
                    "action": "Maintain optimal energy usage. If possible, consider shifting large loads to periods with higher forecasted solar generation to reduce carbon footprint.",
                    "financial_impact": "Contributes to overall carbon emissions reduction and long-term sustainability goals.",
                    "profit_in_usd": 0.0  # Direct monetary profit not applicable
                })


        # Hourly recommendations for Battery Longevity
        elif optimization_goal == "battery_longevity":
            # Avoid deep discharges/charges, maintain mid-range
            avg_battery_stored = (current_battery_1_stored + current_battery_2_stored) / 2
            if avg_battery_stored < BATTERY_CHARGE_THRESHOLD_LOW:
                charge_needed_b1 = BATTERY_CHARGE_THRESHOLD_LOW - current_battery_1_stored
                charge_needed_b2 = BATTERY_CHARGE_THRESHOLD_LOW - current_battery_2_stored
                total_charge_needed = charge_needed_b1 + charge_needed_b2

                recommendations.append({
                    "type": "Battery Management",
                    "action": f"Battery levels are low ({avg_battery_stored:.2f} kWh average). Consider moderate charging (e.g., target {total_charge_needed:.2f} kWh total) to extend battery lifespan by avoiding deep discharge cycles.",
                    "financial_impact": "Increased battery lifespan and reliability, leading to long-term cost savings on replacements.",
                    "profit_in_usd": 0.0  # Direct hourly profit not applicable
                })
            elif avg_battery_stored > BATTERY_CHARGE_THRESHOLD_HIGH:
                discharge_excess_b1 = current_battery_1_stored - BATTERY_CHARGE_THRESHOLD_HIGH
                discharge_excess_b2 = current_battery_2_stored - BATTERY_CHARGE_THRESHOLD_HIGH
                total_discharge_excess = discharge_excess_b1 + discharge_excess_b2

                recommendations.append({
                    "type": "Battery Management",
                    "action": f"Battery levels are high ({avg_battery_stored:.2f} kWh average). If not discharging during peak price, consider moderate discharge (e.g., target {total_discharge_excess:.2f} kWh total) or pause charging to avoid overcharging and extend battery lifespan.",
                    "financial_impact": "Increased battery lifespan by avoiding overcharge stress, leading to long-term cost savings on replacements.",
                    "profit_in_usd": 0.0  # Direct hourly profit not applicable
                })
            else:
                recommendations.append({
                    "type": "Battery Management",
                    "action": "Battery levels are optimal for longevity. Maintain current charging/discharging patterns.",
                    "financial_impact": "Ensures maximum battery lifespan and efficiency, leading to sustained operational profit.",
                    "profit_in_usd": 0.0  # Direct hourly profit not applicable, but contributes to long-term profit
                })

    elif period == "daily":
        # Daily recommendations require aggregation over 24 hours of forecast data
        # For simplicity, we'll just check if there's enough forecast data for a day
        if len(forecast_data) < 24:
            recommendations.append({"type": "Warning",
                                    "action": "Insufficient forecast data for daily recommendations (requires at least 24 hours).",
                                    "profit_in_usd": 0.0})
            return recommendations

        # Aggregate forecast data for the next 24 hours starting from current_status_dt + 1 hour
        daily_forecast_period = [
            f for f in forecast_data if f['datetime'] >= current_status_dt + timedelta(hours=1) and \
                                        f['datetime'] < current_status_dt + timedelta(hours=25)
        ]

        if not daily_forecast_period:
            recommendations.append(
                {"type": "Info", "action": "No relevant forecast data for the next 24 hours for daily recommendations.",
                 "profit_in_usd": 0.0})
            return recommendations

        # Calculate daily averages/sums from relevant_forecast using correct keys
        predicted_daily_solar = sum(f.get('Solar_Available_for_Use(t)', 0) for f in daily_forecast_period)
        # Ensure division by length to avoid ZeroDivisionError if list is empty
        predicted_daily_price_avg = sum(f.get('Electricity_Price(t)', 0) for f in daily_forecast_period) / len(
            daily_forecast_period) if daily_forecast_period else 0
        predicted_daily_consumption = sum(
            f.get('Total_Energy(t)', 0) for f in daily_forecast_period)  # Assuming Total_Energy(t) for consumption

        # Daily recommendations for Cost Reduction
        if optimization_goal == "cost_reduction":
            if predicted_daily_solar > 200:  # Example daily solar threshold
                # Placeholder for daily profit calculation from solar (e.g., kWh saved * avg price)
                daily_profit_value = predicted_daily_solar * predicted_daily_price_avg * 0.5  # Example
                recommendations.append({
                    "type": "Strategic Planning",
                    "action": f"Expect high solar generation today ({predicted_daily_solar:.2f} kWh). Plan to shift heavy energy usage to daylight hours to maximize solar self-consumption.",
                    "financial_impact": "Significant daily cost savings and reduced grid reliance, leading to higher profit.",
                    "profit_in_usd": float(f"{daily_profit_value:.7f}")
                })
            if predicted_daily_price_avg > PRICE_THRESHOLD_HIGH:
                # Placeholder for daily profit calculation from price avoidance (e.g., load shifted * price diff)
                daily_profit_value = predicted_daily_consumption * (
                            predicted_daily_price_avg - PRICE_THRESHOLD_LOW) * 0.1  # Example
                recommendations.append({
                    "type": "Strategic Planning",
                    "action": f"Anticipate higher average electricity prices today ({predicted_daily_price_avg:.2f} USD/kWh). Prepare to utilize battery storage and minimize peak hour grid consumption.",
                    "financial_impact": "Reduces exposure to high daily electricity costs, leading to improved profit margins.",
                    "profit_in_usd": float(f"{daily_profit_value:.7f}")
                })
            elif predicted_daily_price_avg < PRICE_THRESHOLD_LOW:
                # This is a strategic cost, not a direct profit from grid charging
                daily_profit_value = - (predicted_daily_consumption * (
                            PRICE_THRESHOLD_LOW - predicted_daily_price_avg) * 0.05)  # Example
                recommendations.append({
                    "type": "Strategic Planning",
                    "action": f"Expect lower average electricity prices today ({predicted_daily_price_avg:.2f} USD/kWh). Consider opportunistic grid charging of batteries if needed.",
                    "financial_impact": f"Cost-effective battery charging, contributing to future profit/savings (estimated cost: ${abs(daily_profit_value):.2f}).",
                    "profit_in_usd": float(f"{daily_profit_value:.7f}")  # This will be negative
                })
            if predicted_daily_consumption > 3000:  # Example daily consumption threshold
                daily_profit_value = predicted_daily_consumption * predicted_daily_price_avg * 0.05  # 5% reduction example
                recommendations.append({
                    "type": "Strategic Planning",
                    "action": f"Forecasted high daily energy consumption ({predicted_daily_consumption:.2f} kWh). Implement demand management strategies like optimized HVAC schedules and turning off non-essential equipment overnight.",
                    "financial_impact": "Overall reduction in daily energy costs, boosting profitability.",
                    "profit_in_usd": float(f"{daily_profit_value:.7f}")
                })

        # Daily recommendations for Carbon Footprint
        elif optimization_goal == "carbon_footprint":
            if predicted_daily_solar > 200:
                recommendations.append({
                    "type": "Carbon  Reduction",
                    "action": f"High solar day expected ({predicted_daily_solar:.2f} kWh). Maximize direct solar usage and prioritize battery charging from solar to reduce daily carbon footprint.",
                    "financial_impact": "Significantly lower daily carbon emissions. Supports green branding and potential compliance benefits.",
                    "profit_in_usd": 0.0  # Direct monetary profit not applicable
                })
            else:
                recommendations.append({
                    "type": "Carbon  Reduction",
                    "action": "Monitor energy usage throughout the day. Consider strategies like optimizing lighting and HVAC to minimize grid electricity consumption, especially during periods of high carbon intensity if known.",
                    "financial_impact": "Contributes to daily carbon emissions reduction and long-term sustainability. Indirect financial benefits may apply.",
                    "profit_in_usd": 0.0  # Direct monetary profit not applicable
                })

        # Daily recommendations for Battery Longevity
        elif optimization_goal == "battery_longevity":
            recommendations.append({
                "type": "Strategic Planning",
                "action": "Plan daily battery usage to maintain charge levels between 20-80% as much as possible. Avoid frequent full charges or deep discharges.",
                "financial_impact": "Extends overall battery lifespan, leading to long-term cost savings on replacements and maintenance.",
                "profit_in_usd": 0.0  # Direct daily profit not applicable
            })

    elif period == "weekly":
        # Weekly recommendations require aggregation over 168 hours of forecast data
        if len(forecast_data) < 168:
            recommendations.append({"type": "warning",
                                    "action": "Insufficient forecast data for weekly recommendations (requires at least 168 hours).",
                                    "profit_in_usd": 0.0})
            return recommendations

        # Aggregate forecast data for the next 168 hours starting from current_status_dt + 1 hour
        weekly_forecast_period = [
            f for f in forecast_data if f['datetime'] >= current_status_dt + timedelta(hours=1) and \
                                        f['datetime'] < current_status_dt + timedelta(hours=169)
        ]

        if not weekly_forecast_period:
            recommendations.append({"type": "Info",
                                    "action": "No relevant forecast data for the next 168 hours for weekly recommendations.",
                                    "profit_in_usd": 0.0})
            return recommendations

        # Calculate weekly averages/sums from relevant_forecast using correct keys
        predicted_weekly_solar = sum(f.get('Solar_Available_for_Use(t)', 0) for f in weekly_forecast_period)
        predicted_weekly_price_avg = sum(f.get('Electricity_Price(t)', 0) for f in weekly_forecast_period) / len(
            weekly_forecast_period) if weekly_forecast_period else 0
        predicted_weekly_consumption = sum(
            f.get('Total_Energy(t)', 0) for f in weekly_forecast_period)  # Assuming Total_Energy(t) for consumption

        # Weekly recommendations for Cost Reduction
        if optimization_goal == "cost_reduction":
            if predicted_weekly_solar > 1000:  # Example weekly solar threshold
                weekly_profit_value = predicted_weekly_solar * predicted_weekly_price_avg * 0.4  # Example
                recommendations.append({
                    "type": "Strategic Planning",
                    "action": f"Anticipate high solar generation this week ({predicted_weekly_solar:.2f} kWh). Develop a weekly schedule for high-load operations to align with peak solar periods.",
                    "financial_impact": "Maximizes self-sufficiency and reduces weekly grid energy costs, enhancing overall profit.",
                    "profit_in_usd": float(f"{weekly_profit_value:.7f}")
                })
            if predicted_weekly_price_avg > PRICE_THRESHOLD_HIGH:
                weekly_profit_value = predicted_weekly_consumption * (
                            predicted_weekly_price_avg - PRICE_THRESHOLD_LOW) * 0.08  # Example
                recommendations.append({
                    "type": "Strategic Planning",
                    "action": f"Average electricity prices are expected to be high this week ({predicted_weekly_price_avg:.2f} USD/kWh). Focus on minimizing overall grid consumption and leveraging battery storage strategically throughout the week.",
                    "financial_impact": "Reduces weekly operating costs by avoiding expensive electricity, leading to higher profit.",
                    "profit_in_usd": float(f"{weekly_profit_value:.7f}")
                })
            if predicted_weekly_consumption > 15000:  # Example weekly consumption threshold
                weekly_profit_value = predicted_weekly_consumption * predicted_weekly_price_avg * 0.03  # 3% reduction example
                recommendations.append({
                    "type": "Strategic Planning",
                    "action": f"Forecasted high weekly energy consumption ({predicted_weekly_consumption:.2f} kWh). Review and optimize all major energy-consuming systems (HVAC, lighting schedules) for the upcoming week.",
                    "financial_impact": "Comprehensive cost reduction across the week, boosting profitability.",
                    "profit_in_usd": float(f"{weekly_profit_value:.7f}")
                })

        # Weekly recommendations for Carbon Footprint
        elif optimization_goal == "carbon_footprint":
            if predicted_weekly_solar > 1000:
                recommendations.append({
                    "type": "Carbon  Reduction",
                    "action": f"High solar availability expected this week ({predicted_weekly_solar:.2f} kWh). Implement strategies to maximize renewable energy use and minimize grid reliance throughout the week for a lower carbon footprint.",
                    "financial_impact": "Significant reduction in weekly carbon emissions. Supports green initiatives and brand value.",
                    "profit_in_usd": 0.0  # Direct monetary profit not applicable
                })
            else:
                recommendations.append({
                    "type": "Carbon  Reduction",
                    "action": "Continuously optimize energy usage patterns this week. Consider energy efficiency upgrades or maintenance for systems with high energy consumption to reduce long-term carbon footprint.",
                    "financial_impact": "Long-term environmental benefits and compliance. Potential for indirect financial gains from incentives or market perception.",
                    "profit_in_usd": 0.0  # Direct monetary profit not applicable
                })

        # Weekly recommendations for Battery Longevity
        elif optimization_goal == "battery_longevity":
            recommendations.append({
                "type": "Strategic Planning",
                "action": "Develop a weekly battery cycling strategy to ensure regular, moderate charge and discharge cycles. Avoid prolonged periods at very high or very low states of charge.",
                "financial_impact": "Maximizes battery lifespan and overall system durability over the long term, leading to sustained cost savings.",
                "profit_in_usd": 0.0  # Direct weekly profit not applicable
            })

    else:
        recommendations.append(
            {"type": "Error", "action": f"Unsupported period '{period}' for recommendations.", "profit_in_usd": 0.0})

    if not recommendations:
        recommendations.append({"type": "Info",
                                "action": f"No specific recommendations generated for {optimization_goal} during {period} period. System seems to be operating optimally or further data/rules are needed.",
                                "profit_in_usd": 0.0})

    return recommendations


if __name__ == "__main__":
    print("--- Testing recommendation_engine_module locally ---")

    # --- Fetch current status for local testing (simulating API call) ---
    print("Fetching current status data...")
    current_status_raw = data_loader_module.get_latest_hourly_data()
    current_status_api_format: Dict[str, Any] = {}

    if current_status_raw:
        # Simulate the FastAPI response format for current status
        current_status_api_format = {
            "timestamp": current_status_raw.get("timestamp").isoformat() + "Z" if current_status_raw.get(
                "timestamp") is not None else datetime.now(timezone.utc).isoformat() + "Z",
            "current_kpis": {
                "total_consumption_kwh": current_status_raw.get("Total_Energy(t)", 0.0),
                "solar_available_for_use_kwh": current_status_raw.get("Solar_Available_for_Use(t)", 0.0),
                "battery_1_energy_stored_kwh": current_status_raw.get("Battery_1_Energy_Stored(t)", 0.0),
                "battery_2_energy_stored_kwh": current_status_raw.get("Battery_2_Energy_Stored(t)", 0.0),
                "electricity_price_usd_per_kwh": current_status_raw.get("Electricity_Price(t)", 0.0)
            },
            "energy_mix": {
                "hvac_energy_kwh": current_status_raw.get("HVAC_Energy(t)", 0.0),
                "refrigeration_energy_kwh": current_status_raw.get("Refrigeration_Energy(t)", 0.0),
                # Added for comprehensive test
                "lighting_energy_kwh": current_status_raw.get("Lighting_Energy(t)", 0.0),
                # Added for comprehensive test
                "it_system_kwh": current_status_raw.get("IT_System(t)", 0.0),  # Added for comprehensive test
                "other_system_kwh": current_status_raw.get("Other_System(t)", 0.0)  # Added for comprehensive test
            }
        }
        # Add a 'datetime' object to current_status_api_format for direct use within this module's logic (local testing only)
        # ENSURE THIS IS UTC-AWARE FOR CONSISTENCY
        if current_status_raw.get("timestamp") is not None:
            # Convert to UTC-aware datetime, assuming raw timestamp might be naive from data_loader
            if isinstance(current_status_raw.get("timestamp"), datetime):
                if current_status_raw["timestamp"].tzinfo is None:
                    current_status_api_format['datetime'] = current_status_raw["timestamp"].replace(tzinfo=timezone.utc)
                else:
                    current_status_api_format['datetime'] = current_status_raw["timestamp"]
            else:  # If it's a string, parse it as UTC
                current_status_api_format['datetime'] = datetime.fromisoformat(
                    current_status_api_format["timestamp"].replace('Z', '')).replace(tzinfo=timezone.utc)
        else:
            current_status_api_format['datetime'] = datetime.now(timezone.utc)  # Fallback to current UTC time
        print(f"Current Status Timestamp (API format): {current_status_api_format.get('timestamp')}")
        print(f"Current Status Datetime (for module logic): {current_status_api_format.get('datetime')}")
        if current_status_api_format.get('datetime') and current_status_api_format['datetime'].tzinfo is None:
            print(
                "WARNING: current_status_api_format['datetime'] is still naive. Check data_loader_module if this persists.")
    else:
        print("No current status data found from data_loader_module. Generating dummy data.")
        dummy_timestamp = datetime.now(timezone.utc) - timedelta(hours=1)
        current_status_api_format = {
            "timestamp": dummy_timestamp.isoformat() + "Z",
            "current_kpis": {
                "total_consumption_kwh": 500.0,  # Increased for testing load management
                "solar_available_for_use_kwh": 100.0,  # Increased for testing solar usage
                "battery_1_energy_stored_kwh": 100.0,  # Testing low charge scenario
                "battery_2_energy_stored_kwh": 400.0,  # Testing high charge scenario
                "electricity_price_usd_per_kwh": 0.20  # Testing high price scenario
            },
            "energy_mix": {
                "hvac_energy_kwh": 100.0,  # Significant HVAC load
                "refrigeration_energy_kwh": 50.0,
                "lighting_energy_kwh": 30.0,  # Significant lighting load
                "it_system_kwh": 20.0,
                "other_system_kwh": 10.0
            },
            "datetime": dummy_timestamp  # Ensure dummy is also UTC-aware
        }

    # --- Generate forecast data for local testing ---
    # Need sufficient forecast hours for daily/weekly recommendations
    forecast_horizon = 168  # For weekly recommendations, need 168 hours of forecast
    print(f"\nGenerating {forecast_horizon}-hour forecast data...")
    actual_forecast_data = forecast_model_module.generate_forecast(forecast_horizon)
    print(f"Generated {len(actual_forecast_data)} forecast entries.")
    if actual_forecast_data:
        print(f"First forecast entry timestamp: {actual_forecast_data[0].get('timestamp')}")
        # Verify if forecast datetimes are UTC-aware after internal parsing in generate_recommendations
        # This will be checked inside generate_recommendations

    try:
        # --- Hourly Recommendations (Cost Reduction) ---
        print("\n--- Hourly Recommendations (Cost Reduction) ---")
        hourly_cost_recommendations = generate_recommendations(current_status_api_format, actual_forecast_data,
                                                               "cost_reduction", "hourly")
        for rec in hourly_cost_recommendations:
            print(
                f"- Type: {rec['type']}, Action: {rec['action']}, Financial Impact: {rec['financial_impact']}, Profit in USD: {rec['profit_in_usd']:.7f}")

        print("\n--- Hourly Recommendations (Carbon Footprint) ---")
        hourly_carbon_recommendations = generate_recommendations(current_status_api_format, actual_forecast_data,
                                                                 "carbon_footprint", "hourly")
        for rec in hourly_carbon_recommendations:
            print(
                f"- Type: {rec['type']}, Action: {rec['action']}, Financial Impact: {rec['financial_impact']}, Profit in USD: {rec['profit_in_usd']:.7f}")

        print("\n--- Hourly Recommendations (Battery Longevity) ---")
        hourly_battery_recommendations = generate_recommendations(current_status_api_format, actual_forecast_data,
                                                                  "battery_longevity", "hourly")
        for rec in hourly_battery_recommendations:
            print(
                f"- Type: {rec['type']}, Action: {rec['action']}, Financial Impact: {rec['financial_impact']}, Profit in USD: {rec['profit_in_usd']:.7f}")

        # --- Daily Recommendations (requires 24h+ forecast data) ---
        print("\n--- Daily Recommendations (Cost Reduction) ---")
        daily_cost_recommendations = generate_recommendations(current_status_api_format, actual_forecast_data,
                                                              "cost_reduction", "daily")
        for rec in daily_cost_recommendations:
            print(
                f"- Type: {rec['type']}, Action: {rec['action']}, Financial Impact: {rec['financial_impact']}, Profit in USD: {rec['profit_in_usd']:.7f}")

        print("\n--- Daily Recommendations (Carbon Footprint) ---")
        daily_carbon_recommendations = generate_recommendations(current_status_api_format, actual_forecast_data,
                                                                "carbon_footprint", "daily")
        for rec in daily_carbon_recommendations:
            print(
                f"- Type: {rec['type']}, Action: {rec['action']}, Financial Impact: {rec['financial_impact']}, Profit in USD: {rec['profit_in_usd']:.7f}")

        # Weekly Recommendations (requires 168h+ forecast data)
        print("\n--- Weekly Recommendations (Cost Reduction) ---")
        weekly_cost_recommendations = generate_recommendations(current_status_api_format, actual_forecast_data,
                                                               "cost_reduction", "weekly")
        for rec in weekly_cost_recommendations:
            print(
                f"- Type: {rec['type']}, Action: {rec['action']}, Financial Impact: {rec['financial_impact']}, Profit in USD: {rec['profit_in_usd']:.7f}")

        print("\n--- Weekly Recommendations (Carbon Footprint) ---")
        weekly_carbon_recommendations = generate_recommendations(current_status_api_format, actual_forecast_data,
                                                                 "carbon_footprint", "weekly")
        for rec in hourly_carbon_recommendations:  # Corrected to weekly_carbon_recommendations
            print(
                f"- Type: {rec['type']}, Action: {rec['action']}, Financial Impact: {rec['financial_impact']}, Profit in USD: {rec['profit_in_usd']:.7f}")

    except Exception as e:
        print(f"\nError during local testing of recommendation_engine_module: {e}")
        import traceback

        traceback.print_exc()  # Print full traceback for debugging