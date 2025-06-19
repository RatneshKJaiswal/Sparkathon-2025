"use client"

import type { HistoricalDataPoint } from "../../types"
import { useTheme } from "../../contexts/ThemeContext"

interface EnergyTrendsChartProps {
  data: HistoricalDataPoint[]
}

const EnergyTrendsChart = ({ data }: EnergyTrendsChartProps) => {
  const { theme } = useTheme()

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
        </div>
      </div>
    )
  }

  const chartData = data.slice(0, 8).map((d) => ({
    name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Consumption: Number(d.Daily_Total_Energy_Usage_kWh) || 0,
    Solar: Number(d.Daily_Solar_Available_for_Use_kWh) || 0,
  }))

  const maxValue = Math.max(...chartData.flatMap((d) => [d.Consumption, d.Solar]))

  return (
    <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="h-full flex flex-col">
        {/* Chart Area */}
        <div className="flex-1 relative mb-4">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="40"
                y1={40 + i * 32}
                x2="360"
                y2={40 + i * 32}
                stroke={theme === "dark" ? "#374151" : "#E5E7EB"}
                strokeDasharray="2,2"
              />
            ))}

            {/* Consumption Line */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              points={chartData
                .map((d, i) => {
                  const x = 40 + i * (320 / (chartData.length - 1))
                  const y = 200 - 40 - (d.Consumption / maxValue) * 120
                  return `${x},${y}`
                })
                .join(" ")}
            />

            {/* Solar Line */}
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3"
              points={chartData
                .map((d, i) => {
                  const x = 40 + i * (320 / (chartData.length - 1))
                  const y = 200 - 40 - (d.Solar / maxValue) * 120
                  return `${x},${y}`
                })
                .join(" ")}
            />

            {/* Data points */}
            {chartData.map((d, i) => {
              const x = 40 + i * (320 / (chartData.length - 1))
              const consumptionY = 200 - 40 - (d.Consumption / maxValue) * 120
              const solarY = 200 - 40 - (d.Solar / maxValue) * 120

              return (
                <g key={i}>
                  <circle cx={x} cy={consumptionY} r="4" fill="#3B82F6" />
                  <circle cx={x} cy={solarY} r="4" fill="#F59E0B" />
                </g>
              )
            })}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2 px-10">
            {chartData.map((item, index) => (
              <span key={index} className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {item.name}
              </span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Consumption</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Solar</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnergyTrendsChart
