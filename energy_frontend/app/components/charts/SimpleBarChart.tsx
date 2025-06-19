"use client"

import type { HistoricalDataPoint } from "../../types"
import { useTheme } from "../../contexts/ThemeContext"

interface SimpleBarChartProps {
  data: HistoricalDataPoint[]
  title: string
}

const SimpleBarChart = ({ data, title }: SimpleBarChartProps) => {
  const { theme } = useTheme()

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No data available for {title}</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    HVAC: Number(d.Daily_HVAC_Energy_kWh) || 0,
    Refrigeration: Number(d.Daily_Refrigeration_Energy_kWh) || 0,
    Lighting: Number(d.Daily_Lighting_Energy_kWh) || 0,
    IT: Number(d.Daily_IT_System_Energy_kWh) || 0,
    Other: Number(d.Daily_Other_System_Energy_kWh) || 0,
  }))

  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"]
  const categories = ["HVAC", "Refrigeration", "Lighting", "IT", "Other"]

  const maxValue = Math.max(...chartData.flatMap((d) => [d.HVAC, d.Refrigeration, d.Lighting, d.IT, d.Other]))

  return (
    <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>

      <div className="flex justify-between items-end h-64 gap-2">
        {chartData.map((item, index) => {
          const total = item.HVAC + item.Refrigeration + item.Lighting + item.IT + item.Other
          const heightPercent = (total / maxValue) * 100

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden"
                style={{ height: `${Math.max(heightPercent, 5)}%` }}
              >
                {categories.map((category, catIndex) => {
                  const value = item[category as keyof typeof item] as number
                  const categoryPercent = total > 0 ? (value / total) * 100 : 0
                  return categoryPercent > 0 ? (
                    <div
                      key={catIndex}
                      className="w-full transition-all duration-500"
                      style={{
                        height: `${categoryPercent}%`,
                        backgroundColor: colors[catIndex],
                      }}
                      title={`${category}: ${value.toFixed(1)} kWh`}
                    />
                  ) : null
                })}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">{item.name}</div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {categories.map((category, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{category}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SimpleBarChart
