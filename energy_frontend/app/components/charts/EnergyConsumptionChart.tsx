"use client"

import type { HistoricalDataPoint } from "../../types"
import { useTheme } from "../../contexts/ThemeContext"

interface EnergyConsumptionChartProps {
  data: HistoricalDataPoint[]
}

const EnergyConsumptionChart = ({ data }: EnergyConsumptionChartProps) => {
  const { theme } = useTheme()

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No consumption data available</p>
        </div>
      </div>
    )
  }

  const chartData = data.slice(0, 8).map((d) => ({
    name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    HVAC: Number(d.Daily_HVAC_Energy_kWh) || 0,
    Refrigeration: Number(d.Daily_Refrigeration_Energy_kWh) || 0,
    Lighting: Number(d.Daily_Lighting_Energy_kWh) || 0,
    IT: Number(d.Daily_IT_System_Energy_kWh) || 0,
    Other: Number(d.Daily_Other_System_Energy_kWh) || 0,
  }))

  const colors = {
    HVAC: "#3B82F6",
    Refrigeration: "#10B981",
    Lighting: "#F59E0B",
    IT: "#8B5CF6",
    Other: "#EF4444",
  }

  const categories = ["HVAC", "Refrigeration", "Lighting", "IT", "Other"]
  const maxValue = Math.max(...chartData.flatMap((d) => [d.HVAC, d.Refrigeration, d.Lighting, d.IT, d.Other]))

  return (
    <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="h-full flex flex-col">
        {/* Chart Area */}
        <div className="flex-1 flex items-end justify-between gap-2 mb-4">
          {chartData.map((item, index) => {
            const total = item.HVAC + item.Refrigeration + item.Lighting + item.IT + item.Other
            const heightPercent = maxValue > 0 ? (total / maxValue) * 100 : 0

            return (
              <div key={index} className="flex flex-col items-center flex-1 h-full">
                <div className="flex-1 flex flex-col justify-end w-full">
                  <div
                    className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden flex flex-col-reverse"
                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                  >
                    {categories.map((category, catIndex) => {
                      const value = item[category as keyof typeof item] as number
                      const categoryPercent = total > 0 ? (value / total) * 100 : 0
                      return categoryPercent > 0 ? (
                        <div
                          key={catIndex}
                          className="w-full transition-all duration-500 hover:opacity-80 cursor-pointer"
                          style={{
                            height: `${categoryPercent}%`,
                            backgroundColor: colors[category as keyof typeof colors],
                          }}
                          title={`${category}: ${value.toFixed(1)} kWh`}
                        />
                      ) : null
                    })}
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center font-medium">{item.name}</div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[category as keyof typeof colors] }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EnergyConsumptionChart
