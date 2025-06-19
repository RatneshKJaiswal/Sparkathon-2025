"use client"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { HistoricalDataPoint } from "../../types"
import { useTheme } from "../../contexts/ThemeContext"
import { TrendingUp } from "lucide-react"

interface EnergyTrendsAreaChartProps {
  data: HistoricalDataPoint[]
}

const EnergyTrendsAreaChart = ({ data }: EnergyTrendsAreaChartProps) => {
  const { theme } = useTheme()

  // Validate data first
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-96 lg:h-[450px] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
        </div>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Consumption: Number(d.Daily_Total_Energy_Usage_kWh) || 0,
    Solar: Number(d.Daily_Solar_Available_for_Use_kWh) || 0,
  }))

  // Theme-aware colors
  const colors = {
    consumption: {
      light: "#3B82F6",
      dark: "#60A5FA",
    },
    solar: {
      light: "#F59E0B",
      dark: "#FBBF24",
    },
    grid: theme === "dark" ? "#374151" : "#E5E7EB",
    text: theme === "dark" ? "#D1D5DB" : "#6B7280",
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600">
          <p className="font-semibold text-gray-800 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {entry.name}:{" "}
                <span className="font-semibold text-gray-800 dark:text-white">{entry.value.toFixed(2)} kWh</span>
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-96 lg:h-[450px] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.consumption[theme]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors.consumption[theme]} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.solar[theme]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors.solar[theme]} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fill: colors.text, fontSize: 12 }}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
          />
          <YAxis
            unit=" kWh"
            tick={{ fill: colors.text, fontSize: 12 }}
            axisLine={{ stroke: colors.grid }}
            tickLine={{ stroke: colors.grid }}
          />
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} opacity={0.5} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: colors.text }} iconType="circle" />
          <Area
            type="monotone"
            dataKey="Consumption"
            stroke={colors.consumption[theme]}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorConsumption)"
            isAnimationActive={true}
            animationDuration={1000}
            dot={{ fill: colors.consumption[theme], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: colors.consumption[theme], strokeWidth: 2, fill: "white" }}
          />
          <Area
            type="monotone"
            dataKey="Solar"
            stroke={colors.solar[theme]}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSolar)"
            isAnimationActive={true}
            animationDuration={1000}
            dot={{ fill: colors.solar[theme], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: colors.solar[theme], strokeWidth: 2, fill: "white" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default EnergyTrendsAreaChart
