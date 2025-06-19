"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { HistoricalDataPoint } from "../../types"
import { useTheme } from "../../contexts/ThemeContext"

interface ElectricityPriceBarChartProps {
  data: HistoricalDataPoint[]
}

const ElectricityPriceBarChart = ({ data }: ElectricityPriceBarChartProps) => {
  const { theme } = useTheme()

  // Ensure data exists and has the required field
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No electricity price data available</p>
        </div>
      </div>
    )
  }

  const chartData = data
    .filter(
      (d) => d.Daily_Avg_Electricity_Price_USD_per_kWh != null && !isNaN(d.Daily_Avg_Electricity_Price_USD_per_kWh),
    )
    .map((d) => ({
      name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Price: Number(d.Daily_Avg_Electricity_Price_USD_per_kWh),
      date: d.date,
    }))

  if (chartData.length === 0) {
    return (
      <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No valid electricity price data found</p>
        </div>
      </div>
    )
  }

  // Enhanced theme-aware colors with gradients
  const barColor = theme === "dark" ? "#FBBF24" : "#F59E0B" // Amber
  const barColorSecondary = theme === "dark" ? "#F59E0B" : "#D97706"
  const gridColor = theme === "dark" ? "#374151" : "#E5E7EB"
  const textColor = theme === "dark" ? "#D1D5DB" : "#6B7280"

  // Calculate price statistics
  const prices = chartData.map((d) => d.Price)
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const price = payload[0].value
      const isHigh = price > avgPrice * 1.1
      const isLow = price < avgPrice * 0.9

      return (
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 min-w-[200px]">
          <p className="font-semibold text-gray-800 dark:text-white mb-3 text-center border-b border-gray-200 dark:border-gray-600 pb-2">
            {label}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: barColor }} />
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Price:</span>
              </div>
              <span className="font-bold text-gray-800 dark:text-white text-lg">${price.toFixed(4)}/kWh</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">vs Average:</span>
                <span
                  className={`font-semibold ${
                    isHigh
                      ? "text-red-600 dark:text-red-400"
                      : isLow
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {(((price - avgPrice) / avgPrice) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500 dark:text-gray-400">Period Avg:</span>
                <span className="text-gray-600 dark:text-gray-300">${avgPrice.toFixed(4)}/kWh</span>
              </div>
            </div>

            {isHigh && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">
                <span>⚠️</span>
                <span>High price period</span>
              </div>
            )}
            {isLow && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded px-2 py-1">
                <span>💡</span>
                <span>Good time to consume</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
      {/* Header with statistics */}
      <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-800 dark:text-white">Electricity Pricing Trends</h4>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <div className="text-green-600 dark:text-green-400 font-bold">${minPrice.toFixed(4)}</div>
              <div className="text-gray-500 dark:text-gray-400">Min</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 dark:text-blue-400 font-bold">${avgPrice.toFixed(4)}</div>
              <div className="text-gray-500 dark:text-gray-400">Avg</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 dark:text-red-400 font-bold">${maxPrice.toFixed(4)}</div>
              <div className="text-gray-500 dark:text-gray-400">Max</div>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={barColor} stopOpacity={0.9} />
              <stop offset="50%" stopColor={barColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={barColorSecondary} stopOpacity={0.6} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            tickLine={{ stroke: gridColor }}
          />
          <YAxis
            unit=" $/kWh"
            domain={["dataMin * 0.95", "dataMax * 1.05"]}
            tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }}
            axisLine={{ stroke: gridColor, strokeWidth: 1 }}
            tickLine={{ stroke: gridColor }}
            tickFormatter={(value) => `$${value.toFixed(3)}`}
          />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: textColor, fontWeight: 500 }}
            iconType="rect"
            formatter={() => "Electricity Price"}
          />
          <Bar
            dataKey="Price"
            fill="url(#priceGradient)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
            stroke={barColor}
            strokeWidth={1}
            filter="url(#glow)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ElectricityPriceBarChart
