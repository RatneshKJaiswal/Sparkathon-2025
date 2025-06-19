"use client"

import type React from "react"
import { Battery, Zap, DollarSign, Sun, Grid3X3, TrendingUp, TrendingDown } from "lucide-react"
import useApi from "../hooks/useApi"
import type { CurrentStatus } from "../types"
import SimpleEnergyMixChart from "./charts/SimpleEnergyMixChart"
import { useTheme } from "../contexts/ThemeContext"

const CurrentStatusDashboard = () => {
  const { theme } = useTheme()
  const { data: currentStatus, loading, error } = useApi<CurrentStatus>("/current-status")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Connection Error</h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <p className="text-sm text-red-600 dark:text-red-400">
          Please ensure the API server is running and accessible.
        </p>
      </div>
    )
  }

  if (!currentStatus) {
    return (
      <div className="text-center py-12">
        <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No current status data available</p>
      </div>
    )
  }

  const kpis = currentStatus.current_kpis
  const energyMix = currentStatus.energy_mix

  const KpiCard = ({
    title,
    value,
    unit,
    icon: Icon,
    trend,
    trendValue,
    color,
  }: {
    title: string
    value: number
    unit: string
    icon: React.ElementType
    trend?: "up" | "down"
    trendValue?: number
    color: string
  }) => (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend === "up"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trendValue)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toFixed(2)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{unit}</span>
        </p>
      </div>
    </div>
  )

  const energyMixData = [
    { name: "HVAC", value: energyMix.hvac_energy_kwh || 0, color: "#3B82F6" },
    { name: "Refrigeration", value: energyMix.refrigeration_energy_kwh || 0, color: "#10B981" },
    { name: "Lighting", value: energyMix.lighting_energy_kwh || 0, color: "#F59E0B" },
    { name: "IT Systems", value: energyMix.it_system_kwh || 0, color: "#8B5CF6" },
    { name: "Other", value: energyMix.other_system_kwh || 0, color: "#EF4444" },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Current Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time energy monitoring and insights</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          title="Total Consumption"
          value={kpis.total_consumption_kwh}
          unit="kWh"
          icon={Zap}
          trend="up"
          trendValue={5.2}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <KpiCard
          title="Solar Available"
          value={kpis.solar_available_for_use_kwh}
          unit="kWh"
          icon={Sun}
          trend="up"
          trendValue={12.8}
          color="bg-gradient-to-r from-yellow-500 to-orange-500"
        />
        <KpiCard
          title="Grid Import"
          value={kpis.grid_import_kwh}
          unit="kWh"
          icon={Grid3X3}
          trend="down"
          trendValue={3.1}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <KpiCard
          title="Battery 1 Storage"
          value={kpis.battery_1_energy_stored_kwh}
          unit="kWh"
          icon={Battery}
          trend="up"
          trendValue={8.4}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <KpiCard
          title="Battery 2 Storage"
          value={kpis.battery_2_energy_stored_kwh}
          unit="kWh"
          icon={Battery}
          trend="up"
          trendValue={6.7}
          color="bg-gradient-to-r from-teal-500 to-teal-600"
        />
        <KpiCard
          title="Electricity Price"
          value={kpis.electricity_price_usd_per_kwh}
          unit="$/kWh"
          icon={DollarSign}
          trend="down"
          trendValue={2.3}
          color="bg-gradient-to-r from-red-500 to-red-600"
        />
      </div>

      {/* Energy Mix Chart */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-lg"></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Energy Distribution</h2>
            <p className="text-gray-600 dark:text-gray-400">Current energy consumption breakdown by system</p>
          </div>
        </div>
        <SimpleEnergyMixChart data={energyMixData} />
      </div>
    </div>
  )
}

export default CurrentStatusDashboard
