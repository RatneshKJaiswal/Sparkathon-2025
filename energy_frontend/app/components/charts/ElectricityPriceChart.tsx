"use client"

import type { HistoricalDataPoint } from "../../types"
import { useTheme } from "../../contexts/ThemeContext"

interface ElectricityPriceChartProps {
  data: HistoricalDataPoint[]
}

const ElectricityPriceChart = ({ data }: ElectricityPriceChartProps) => {
  const { theme } = useTheme()

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No pricing data available</p>
        </div>
      </div>
    )
  }

  const chartData = data.slice(0, 8).map((d) => ({
    name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Price: Number(d.Daily_Avg_Electricity_Price_USD_per_kWh) || 0,
  }))

  const maxValue = Math.max(...chartData.map((d) => d.Price))
  const minValue = Math.min(...chartData.map((d) => d.Price))
  const avgPrice = chartData.reduce((sum, d) => sum + d.Price, 0) / chartData.length

  return (
    <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="h-full flex flex-col">
        {/* Chart Area */}
        <div className="flex-1 flex items-end justify-between gap-2 mb-4">
          {chartData.map((item, index) => {
            const heightPercent = maxValue > minValue ? ((item.Price - minValue) / (maxValue - minValue)) * 100 : 50
            const isHigh = item.Price > avgPrice * 1.1
            const isLow = item.Price < avgPrice * 0.9

            return (
              <div key={index} className="flex flex-col items-center flex-1 h-full">
                <div className="flex-1 flex items-end w-full">
                  <div
                    className={`w-full rounded-t transition-all duration-500 cursor-pointer ${
                      isHigh
                        ? "bg-red-500 hover:bg-red-600"
                        : isLow
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-amber-500 hover:bg-amber-600"
                    }`}
                    style={{
                      height: `${Math.max(heightPercent, 10)}%`,
                      minHeight: "12px",
                    }}
                    title={`Price: $${item.Price.toFixed(4)}/kWh`}
                  />
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center font-medium">{item.name}</div>
              </div>
            )
          })}
        </div>

        {/* Price Info */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">Min</div>
            <div className="text-sm font-bold text-green-700 dark:text-green-300">${minValue.toFixed(4)}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Avg</div>
            <div className="text-sm font-bold text-blue-700 dark:text-blue-300">${avgPrice.toFixed(4)}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
            <div className="text-xs text-red-600 dark:text-red-400 font-medium">Max</div>
            <div className="text-sm font-bold text-red-700 dark:text-red-300">${maxValue.toFixed(4)}</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Low Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">High Price</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElectricityPriceChart
