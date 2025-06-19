"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { HistoricalDataPoint } from "../../types"
import { useTheme } from "../../contexts/ThemeContext"

interface EnergyConsumptionBarChartProps {
  data: HistoricalDataPoint[]
}

const EnergyConsumptionBarChart = ({ data }: EnergyConsumptionBarChartProps) => {
  const { theme } = useTheme()

  // Validate data first
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No consumption data available</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    HVAC: Number(d.Daily_HVAC_Energy_kWh) || 0,
    Refrigeration: Number(d.Daily_Refrigeration_Energy_kWh) || 0,
    Lighting: Number(d.Daily_Lighting_Energy_kWh) || 0,
    "IT Systems": Number(d.Daily_IT_System_Energy_kWh) || 0,
    Other: Number(d.Daily_Other_System_Energy_kWh) || 0,
  }))

  // Enhanced vibrant color palette that works well in both themes
  const colors = {
    light: {
      HVAC: "#2563EB", // Blue-600
      Refrigeration: "#059669", // Emerald-600
      Lighting: "#D97706", // Amber-600
      "IT Systems": "#7C3AED", // Violet-600
      Other: "#DC2626", // Red-600
    },
    dark: {
      HVAC: "#3B82F6", // Blue-500
      Refrigeration: "#10B981", // Emerald-500
      Lighting: "#F59E0B", // Amber-500
      "IT Systems": "#8B5CF6", // Violet-500
      Other: "#EF4444", // Red-500
    },
  }

  const currentColors = colors[theme]
  const gridColor = theme === "dark" ? "#374151" : "#E5E7EB"
  const textColor = theme === "dark" ? "#D1D5DB" : "#6B7280"

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0)

      return (
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 min-w-[220px]">
          <p className="font-semibold text-gray-800 dark:text-white mb-3 text-center border-b border-gray-200 dark:border-gray-600 pb-2">
            {label}
          </p>
          <div className="space-y-2">
            {payload
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white dark:ring-gray-800"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{entry.dataKey}:</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-white text-sm">{entry.value.toFixed(1)} kWh</span>
                </div>
              ))}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total:</span>
                <span className="font-bold text-lg text-gray-800 dark:text-white">{total.toFixed(1)} kWh</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-96 lg:h-[450px] bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            {Object.entries(currentColors).map(([key, color]) => (
              <linearGradient key={key} id={`gradient${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                <stop offset="95%" stopColor={color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            tickLine={{ stroke: gridColor }}
          />
          <YAxis
            unit=" kWh"
            tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            tickLine={{ stroke: gridColor }}
          />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: textColor, fontWeight: 500 }} iconType="rect" iconSize={12} />
          <Bar
            dataKey="HVAC"
            stackId="a"
            fill={`url(#gradientHVAC)`}
            radius={[0, 0, 0, 0]}
            animationDuration={800}
            stroke={currentColors.HVAC}
            strokeWidth={0.5}
          />
          <Bar
            dataKey="Refrigeration"
            stackId="a"
            fill={`url(#gradientRefrigeration)`}
            radius={[0, 0, 0, 0]}
            animationDuration={900}
            stroke={currentColors.Refrigeration}
            strokeWidth={0.5}
          />
          <Bar
            dataKey="Lighting"
            stackId="a"
            fill={`url(#gradientLighting)`}
            radius={[0, 0, 0, 0]}
            animationDuration={1000}
            stroke={currentColors.Lighting}
            strokeWidth={0.5}
          />
          <Bar
            dataKey="IT Systems"
            stackId="a"
            fill={`url(#gradientIT Systems)`}
            radius={[0, 0, 0, 0]}
            animationDuration={1100}
            stroke={currentColors["IT Systems"]}
            strokeWidth={0.5}
          />
          <Bar
            dataKey="Other"
            stackId="a"
            fill={`url(#gradientOther)`}
            radius={[4, 4, 0, 0]}
            animationDuration={1200}
            stroke={currentColors.Other}
            strokeWidth={0.5}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default EnergyConsumptionBarChart
