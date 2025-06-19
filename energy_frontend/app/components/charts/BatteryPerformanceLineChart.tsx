"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { HistoricalDataPoint } from "../../types"
import { useTheme } from "../../contexts/ThemeContext"
import { Battery } from "lucide-react"

interface BatteryPerformanceLineChartProps {
  data: HistoricalDataPoint[]
}

const BatteryPerformanceLineChart = ({ data }: BatteryPerformanceLineChartProps) => {
  const { theme } = useTheme()

  // Validate data first
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Battery className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No battery performance data available</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "Battery 1": Number(d.Daily_Battery_1_average_charge) || 0,
    "Battery 2": Number(d.Daily_Battery_2_average_charge) || 0,
  }))

  // Theme-aware colors
  const colors = {
    battery1: {
      light: "#10B981",
      dark: "#34D399",
    },
    battery2: {
      light: "#06B6D4",
      dark: "#22D3EE",
    },
    grid: theme === "dark" ? "#374151" : "#E5E7EB",
    text: theme === "dark" ? "#D1D5DB" : "#6B7280",
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600">
          <p className="font-semibold text-gray-800 dark:text-white mb-3 text-center border-b border-gray-200 dark:border-gray-600 pb-2">
            {label}
          </p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{entry.dataKey}:</span>
                </div>
                <span className="font-semibold text-gray-800 dark:text-white text-sm">
                  {entry.value.toFixed(2)} kWh
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, fill } = props
    return <circle cx={cx} cy={cy} r={4} fill={fill} stroke="white" strokeWidth={2} className="drop-shadow-sm" />
  }

  const CustomActiveDot = (props: any) => {
    const { cx, cy, fill } = props
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={fill}
        stroke="white"
        strokeWidth={3}
        className="drop-shadow-lg animate-pulse"
      />
    )
  }

  return (
    <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: colors.text, fontSize: 12 }}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
          />
          <YAxis
            unit=" kWh"
            domain={[0, "auto"]}
            tick={{ fill: colors.text, fontSize: 12 }}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
          />
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} opacity={0.5} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: colors.text }} iconType="line" />
          <Line
            type="monotone"
            dataKey="Battery 1"
            stroke={colors.battery1[theme]}
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={<CustomActiveDot />}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="Battery 2"
            stroke={colors.battery2[theme]}
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={<CustomActiveDot />}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BatteryPerformanceLineChart
