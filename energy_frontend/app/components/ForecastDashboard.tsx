"use client"

import type React from "react"
import {
  TrendingUp,
  Clock,
  Calendar,
  CalendarDays,
  Zap,
  Sun,
  Grid3X3,
  DollarSign,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import useApi from "../hooks/useApi"
import type { Forecast } from "../types"

const ForecastDashboard = () => {
  const { data: forecast, loading, error, refetch } = useApi<Forecast>("/forecast")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Energy Forecast
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Loading predictive analytics...</p>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Loading Forecast Data</h3>
          </div>
          <p className="text-purple-700 dark:text-purple-300">
            Analyzing energy patterns and generating predictions...
          </p>
        </div>

        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight break-words">
              Energy Forecast
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base break-words">
              Predictive analytics for energy planning
            </p>
          </div>
        </div>


        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Unable to Load Forecast</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Troubleshooting:</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Verify the API server is running</li>
              <li>• Try refreshing the page</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => window.open("https://renergyapi-production-4b89.up.railway.app/docs", "_blank")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 hover:scale-105"
            >
              View API Docs
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!forecast) {
    return (
      <div className="space-y-6">
        {/* Header with Icon and Text */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight break-words">
              Energy Forecast
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base break-words">
              Predictive analytics for energy planning
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 sm:p-8 max-w-md mx-auto w-full">
            <TrendingUp className="w-14 h-14 sm:w-16 sm:h-16 text-purple-500 dark:text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">No Forecast Data</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
              Forecast data is currently unavailable. Please try again later.
            </p>
            <button
              onClick={refetch}
              className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Forecast
            </button>
          </div>
        </div>
      </div>

    )
  }

  const ForecastCard = ({
    title,
    value,
    unit,
    icon: Icon,
    period,
    color,
    description,
    trend,
  }: {
    title: string
    value: number
    unit: string
    icon: React.ElementType
    period: string
    color: string
    description: string
    trend?: "up" | "down" | "stable"
  }) => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            {period}
          </span>
          {trend && (
            <div
              className={`flex items-center gap-1 mt-1 justify-end ${trend === "up"
                ? "text-green-600 dark:text-green-400"
                : trend === "down"
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
                }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${trend === "up" ? "bg-green-500" : trend === "down" ? "bg-red-500" : "bg-gray-500"
                  }`}
              />
              <span className="text-xs font-medium">{trend}</span>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value.toFixed(2)}</p>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{unit}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )

  const AggregateCard = ({
    title,
    consumption,
    solar,
    icon: Icon,
    period,
  }: {
    title: string
    consumption: number
    solar: number
    icon: React.ElementType
    period: string
  }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{period} forecast</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Base Consumption</span>
          </div>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{consumption.toFixed(2)} kWh</span>
        </div>

        <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Solar Available</span>
          </div>
          <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{solar.toFixed(2)} kWh</span>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700 dark:text-gray-300">Net Grid Import</span>
            <span
              className={`text-lg font-bold ${consumption - solar > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                }`}
            >
              {(consumption - solar).toFixed(2)} kWh
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${consumption - solar > 0 ? "bg-red-500" : "bg-green-500"}`} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {consumption - solar > 0 ? "Grid import required" : "Surplus solar energy"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Icon + Heading */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight break-words min-w-0">
            Energy Forecast
          </h1>
        </div>

        {/* Refresh Button */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={refetch}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200 hover:scale-105 w-full sm:w-[150px]"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Hour Forecast */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Next Hour Forecast</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ForecastCard
              title="Base Consumption"
              value={forecast.next_hour_forecast.base_consumption_kwh}
              unit="kWh"
              icon={Zap}
              period="Next Hour"
              color="bg-gradient-to-r from-blue-500 to-blue-600"
              description="Expected energy consumption"
              trend="up"
            />
            <ForecastCard
              title="Solar + Battery"
              value={forecast.next_hour_forecast.solar_battery_for_use_kwh}
              unit="kWh"
              icon={Sun}
              period="Next Hour"
              color="bg-gradient-to-r from-yellow-500 to-orange-500"
              description="Available renewable energy"
              trend="stable"
            />
            <ForecastCard
              title="Grid Import"
              value={forecast.next_hour_forecast.base_consumption_kwh - forecast.next_hour_forecast.solar_battery_for_use_kwh}
              unit="kWh"
              icon={Grid3X3}
              period="Next Hour"
              color="bg-gradient-to-r from-purple-500 to-purple-600"
              description="Required grid electricity"
              trend="down"
            />
            <ForecastCard
              title="Electricity Price"
              value={forecast.next_hour_forecast.electricity_price_usd_per_kwh}
              unit="$/kWh"
              icon={DollarSign}
              period="Next Hour"
              color="bg-gradient-to-r from-red-500 to-red-600"
              description="Expected energy cost"
              trend="up"
            />
          </div>
        </div>

        {/* Aggregate Forecasts */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Aggregate Forecasts</h2>
          </div>

          <div className="space-y-6">
            <AggregateCard
              title="Today's Total"
              consumption={forecast.today_total_forecast.base_consumption_kwh}
              solar={forecast.today_total_forecast.total_useful_solar_kwh * 1.43}
              icon={Calendar}
              period="24-hour"
            />

            <AggregateCard
              title="This Week's Total"
              consumption={forecast.week_total_forecast.base_consumption_kwh}
              solar={forecast.week_total_forecast.total_useful_solar_kwh * 1.43}
              icon={CalendarDays}
              period="7-day"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForecastDashboard
