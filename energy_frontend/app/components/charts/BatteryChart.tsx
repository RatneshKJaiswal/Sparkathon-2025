"use client"

import type { HistoricalDataPoint } from "../../types"
import { useTheme } from "../../contexts/ThemeContext"
import { Battery, Zap, TrendingUp, TrendingDown } from "lucide-react"

interface BatteryChartProps {
  data: HistoricalDataPoint[]
}

const BatteryChart = ({ data }: BatteryChartProps) => {
  const { theme } = useTheme()

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <Battery className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No battery data available</p>
        </div>
      </div>
    )
  }

  const chartData = data.slice(0, 8).map((d) => ({
    name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Battery1: Number(d.Daily_Battery_1_average_charge) || 0,
    Battery2: Number(d.Daily_Battery_2_average_charge) || 0,
  }))

  const maxValue = Math.max(...chartData.flatMap((d) => [d.Battery1, d.Battery2]))
  const avgBattery1 = chartData.reduce((sum, d) => sum + d.Battery1, 0) / chartData.length
  const avgBattery2 = chartData.reduce((sum, d) => sum + d.Battery2, 0) / chartData.length

  // Calculate trends
  const battery1Trend =
    chartData.length > 1
      ? ((chartData[chartData.length - 1].Battery1 - chartData[0].Battery1) / chartData[0].Battery1) * 100
      : 0
  const battery2Trend =
    chartData.length > 1
      ? ((chartData[chartData.length - 1].Battery2 - chartData[0].Battery2) / chartData[0].Battery2) * 100
      : 0

  const getBatteryStatus = (charge: number) => {
    if (charge >= 80)
      return {
        status: "Excellent",
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
      }
    if (charge >= 60)
      return { status: "Good", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" }
    if (charge >= 40)
      return {
        status: "Fair",
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
      }
    if (charge >= 20)
      return { status: "Low", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" }
    return { status: "Critical", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" }
  }

  const battery1Status = getBatteryStatus(avgBattery1)
  const battery2Status = getBatteryStatus(avgBattery2)

  return (
    <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="h-full flex flex-col">
        {/* Header with Battery Status */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Battery 1 Status */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Battery className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white text-sm">Battery 1</h4>
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${battery1Status.bg} ${battery1Status.color} font-medium`}
                  >
                    {battery1Status.status}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{avgBattery1.toFixed(1)} kWh</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
                </div>
                <div
                  className={`flex items-center gap-1 ${battery1Trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {battery1Trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-xs font-medium">{Math.abs(battery1Trend).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Battery 2 Status */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <Battery className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white text-sm">Battery 2</h4>
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${battery2Status.bg} ${battery2Status.color} font-medium`}
                  >
                    {battery2Status.status}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{avgBattery2.toFixed(1)} kWh</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
                </div>
                <div
                  className={`flex items-center gap-1 ${battery2Trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {battery2Trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-xs font-medium">{Math.abs(battery2Trend).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex items-end justify-between gap-2 mb-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 h-full group">
              <div className="flex-1 flex items-end justify-center gap-1 w-full relative">
                {/* Battery 1 Bar */}
                <div className="flex flex-col items-center w-1/2 relative">
                  <div
                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-600 hover:to-green-500 cursor-pointer shadow-lg relative overflow-hidden"
                    style={{
                      height: `${maxValue > 0 ? Math.max((item.Battery1 / maxValue) * 100, 8) : 8}%`,
                      minHeight: "12px",
                    }}
                    title={`Battery 1: ${item.Battery1.toFixed(1)} kWh`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Value label on hover */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      {item.Battery1.toFixed(1)} kWh
                    </div>
                  </div>
                </div>

                {/* Battery 2 Bar */}
                <div className="flex flex-col items-center w-1/2 relative">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg transition-all duration-500 hover:from-cyan-600 hover:to-cyan-500 cursor-pointer shadow-lg relative overflow-hidden"
                    style={{
                      height: `${maxValue > 0 ? Math.max((item.Battery2 / maxValue) * 100, 8) : 8}%`,
                      minHeight: "12px",
                    }}
                    title={`Battery 2: ${item.Battery2.toFixed(1)} kWh`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Value label on hover */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      {item.Battery2.toFixed(1)} kWh
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center font-medium">{item.name}</div>
            </div>
          ))}
        </div>

        {/* Enhanced Legend with Performance Indicators */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-t from-green-500 to-green-400 shadow-sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Battery 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-t from-cyan-500 to-cyan-400 shadow-sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Battery 2</span>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Zap className="w-3 h-3" />
              <span>Max: {maxValue.toFixed(1)} kWh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BatteryChart
