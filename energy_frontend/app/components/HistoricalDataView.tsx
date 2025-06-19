"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { BarChart2, Calendar, TrendingUp, Filter, RefreshCw, AlertCircle, Clock, Download, Share2 } from "lucide-react"
import useApi from "../hooks/useApi"
import type { HistoricalDataPoint } from "../types"
import EnergyConsumptionChart from "./charts/EnergyConsumptionChart"
import EnergyTrendsChart from "./charts/EnergyTrendsChart"
import BatteryChart from "./charts/BatteryChart"
import ElectricityPriceChart from "./charts/ElectricityPriceChart"

const InteractiveLoadingProgress = ({
  dateParams,
  onCancel,
}: {
  dateParams: any
  onCancel: () => void
}) => {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const steps = [
    { name: "Connecting to API", duration: 1000 },
    { name: "Fetching S3 data", duration: 2000 },
    { name: "Processing energy data", duration: 1500 },
    { name: "Aggregating daily metrics", duration: 1000 },
    { name: "Preparing visualizations", duration: 800 },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 100)

      let totalDuration = 0
      let currentStepIndex = 0
      let stepProgress = 0

      for (let i = 0; i < steps.length; i++) {
        if (timeElapsed >= totalDuration && timeElapsed < totalDuration + steps[i].duration) {
          currentStepIndex = i
          stepProgress = ((timeElapsed - totalDuration) / steps[i].duration) * 100
          break
        }
        totalDuration += steps[i].duration
      }

      setCurrentStep(currentStepIndex)
      const overallProgress = Math.min((timeElapsed / steps.reduce((sum, step) => sum + step.duration, 0)) * 100, 95)
      setProgress(overallProgress)
    }, 100)

    return () => clearInterval(interval)
  }, [timeElapsed])

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Loading Historical Data</h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">{steps[currentStep]?.name || "Finalizing..."}</p>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-300 dark:hover:bg-blue-700 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-2">
          <span>Progress: {Math.round(progress)}%</span>
          <span>{(timeElapsed / 1000).toFixed(1)}s elapsed</span>
        </div>
        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-center flex-1">
            <div
              className={`w-3 h-3 rounded-full mb-1 transition-colors duration-300 ${index < currentStep
                  ? "bg-green-500"
                  : index === currentStep
                    ? "bg-blue-500 animate-pulse"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
            />
            <span
              className={`text-xs transition-colors duration-300 ${index <= currentStep ? "text-blue-700 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"
                }`}
            >
              {step.name.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Data Info */}
      <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Date Range:</span>
            <div className="text-blue-800 dark:text-blue-200">
              {dateParams.start_date} to {dateParams.end_date}
            </div>
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Aggregation:</span>
            <div className="text-blue-800 dark:text-blue-200 capitalize">{dateParams.aggregation_level}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const HistoricalDataView = () => {
  const [dateRange, setDateRange] = useState("7")

  // Calculate start_date and end_date based on selected range
  const getDateRange = (days: string) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - Number.parseInt(days))

    // Ensure we don't request future dates - API validates this
    const today = new Date()
    if (endDate > today) {
      endDate.setTime(today.getTime())
    }

    return {
      start_date: startDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
      end_date: endDate.toISOString().split("T")[0], // Format: YYYY-MM-DD
      aggregation_level: "daily", // Use daily aggregation as per your API
    }
  }

  const dateParams = getDateRange(dateRange)

  const {
    data: historicalData,
    loading,
    error,
    refetch,
  } = useApi<HistoricalDataPoint[]>("/historical-data", dateParams)

  // Ensure historicalData is always an array
  const safeHistoricalData = Array.isArray(historicalData) ? historicalData : []

  const exportData = () => {
    if (safeHistoricalData.length === 0) return

    const csvContent = [
      Object.keys(safeHistoricalData[0]).join(","),
      ...safeHistoricalData.map((row) => Object.values(row).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `energy-data-${dateParams.start_date}-to-${dateParams.end_date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
            <BarChart2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Historical Data
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Loading energy consumption data...</p>
          </div>
        </div>

        {/* Interactive Loading State */}
        <InteractiveLoadingProgress dateParams={dateParams} onCancel={() => window.location.reload()} />

        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
            <BarChart2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Historical Data
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Energy consumption trends and analytics</p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Unable to Load Historical Data</h3>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Troubleshooting:</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• The API may be processing S3 data - this can take time for large date ranges</li>
              <li>• Try selecting a shorter period (3-7 days work best)</li>
              <li>• Ensure the date range doesn't include future dates</li>
              <li>• Check if the S3 data exists for the selected period</li>
            </ul>
          </div>

          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg mb-4">
            <p className="text-xs text-red-600 dark:text-red-400 font-mono">
              Date Range: {dateParams.start_date} to {dateParams.end_date} ({dateRange} days,{" "}
              {dateParams.aggregation_level})
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => setDateRange("3")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            >
              Try Last 3 Days
            </button>
            <button
              onClick={() => setDateRange("7")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105"
            >
              Try Last 7 Days
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (safeHistoricalData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
            <BarChart2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Historical Data
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Energy consumption trends and analytics</p>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 max-w-md mx-auto">
            <BarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Data Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No historical data found for the selected period. The S3 data store may not have data for these dates.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Date range: {dateParams.start_date} to {dateParams.end_date} ({dateParams.aggregation_level})
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={refetch}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              <button
                onClick={() => setDateRange("14")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105"
              >
                Try Last 14 Days
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ChartContainer = ({
    title,
    description,
    children,
  }: { title: string; description: string; children: React.ReactNode }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-lg"></div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )

  // Calculate summary statistics safely
  const calculateAverage = (data: HistoricalDataPoint[], field: keyof HistoricalDataPoint): number => {
    if (data.length === 0) return 0
    const sum = data.reduce((acc, item) => {
      const value = item[field]
      return acc + (typeof value === "number" ? value : 0)
    }, 0)
    return sum / data.length
  }

  const avgDailyConsumption = calculateAverage(safeHistoricalData, "Daily_Total_Energy_Usage_kWh")
  const avgSolarGeneration = calculateAverage(safeHistoricalData, "Daily_Solar_Available_for_Use_kWh")
  const avgElectricityPrice = calculateAverage(safeHistoricalData, "Daily_Avg_Electricity_Price_USD_per_kWh")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
            <BarChart2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Historical Data
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Energy consumption trends and analytics</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="3">Last 3 days</option>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <button
            onClick={refetch}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={exportData}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105"
            title="Export data"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Data Info */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-800 dark:text-green-200">Data Successfully Loaded</h3>
          </div>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">S3 Data Store</span>
          </div>
        </div>
        <p className="text-green-700 dark:text-green-300 text-sm mt-1">
          Showing {safeHistoricalData.length} data points from {dateParams.start_date} to {dateParams.end_date} (
          {dateParams.aggregation_level} aggregation)
        </p>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-28">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7" />
            <h3 className="text-base sm:text-lg font-semibold">Avg Daily Consumption</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{avgDailyConsumption.toFixed(2)} kWh</p>
          <p className="text-blue-100 text-sm">Per day average</p>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-28">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
            <h3 className="text-base sm:text-lg font-semibold">Avg Solar Generation</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{avgSolarGeneration.toFixed(2)} kWh</p>
          <p className="text-orange-100 text-sm">Per day average</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-28">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="w-6 h-6 sm:w-7 sm:h-7" />
            <h3 className="text-base sm:text-lg font-semibold">Avg Electricity Price</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">${avgElectricityPrice.toFixed(3)}/kWh</p>
          <p className="text-green-100 text-sm">Per kWh average</p>
        </div>
      </div>


      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Energy Consumption Breakdown" description="Daily energy usage by system type">
          <EnergyConsumptionChart data={safeHistoricalData} />
        </ChartContainer>

        <ChartContainer title="Energy Trends" description="Consumption vs solar generation over time">
          <EnergyTrendsChart data={safeHistoricalData} />
        </ChartContainer>

        <ChartContainer title="Battery Performance" description="Battery charge levels and performance">
          <BatteryChart data={safeHistoricalData} />
        </ChartContainer>

        <ChartContainer title="Electricity Pricing" description="Daily average electricity prices">
          <ElectricityPriceChart data={safeHistoricalData} />
        </ChartContainer>
      </div>
    </div>
  )
}

export default HistoricalDataView
