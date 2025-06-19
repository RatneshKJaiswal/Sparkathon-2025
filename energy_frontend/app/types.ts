export interface Kpi {
  total_consumption_kwh: number
  solar_available_for_use_kwh: number
  grid_import_kwh: number
  battery_1_energy_stored_kwh: number
  battery_2_energy_stored_kwh: number
  electricity_price_usd_per_kwh: number
}

export interface EnergyMix {
  hvac_energy_kwh: number
  refrigeration_energy_kwh: number
  lighting_energy_kwh: number
  it_system_kwh: number
  other_system_kwh: number
}

export interface CurrentStatus {
  timestamp: string
  current_kpis: Kpi
  energy_mix: EnergyMix
}

export interface NextHourForecast {
  timestamp: string
  base_consumption_kwh: number
  solar_battery_for_use_kwh: number
  grid_import_kwh: number
  electricity_price_usd_per_kwh: number
}

export interface AggregateForecast {
  base_consumption_kwh: number
  total_useful_solar_kwh: number
}

export interface Forecast {
  next_hour_forecast: NextHourForecast
  today_total_forecast: AggregateForecast
  week_total_forecast: AggregateForecast
}

export interface Recommendation {
  type: string
  action: string
  financial_impact: string
  profit_in_usd: number
}

export interface HistoricalDataPoint {
  date: string
  Daily_Total_Energy_Usage_kWh: number
  Daily_Solar_Available_for_Use_kWh: number
  Daily_Avg_Electricity_Price_USD_per_kWh: number
  Daily_HVAC_Energy_kWh: number
  Daily_Refrigeration_Energy_kWh: number
  Daily_Lighting_Energy_kWh: number
  Daily_IT_System_Energy_kWh: number
  Daily_Other_System_Energy_kWh: number
  Daily_Solar_Used_to_Charge_Battery_kWh: number
  Daily_Battery_1_average_charge: number
  Daily_Battery_2_average_charge: number
  [key: string]: unknown
}

export enum OptimizationGoal {
  CostReduction = "cost_reduction",
  CarbonFootprint = "carbon_footprint",
  BatteryLongevity = "battery_longevity",
}

export enum RecommendationPeriod {
  Hourly = "hourly",
  Daily = "daily",
  Weekly = "weekly",
}
