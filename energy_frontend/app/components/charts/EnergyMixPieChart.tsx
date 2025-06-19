"use client"

import { useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { useTheme } from "../../contexts/ThemeContext"

interface EnergyMixChartProps {
  data: { name: string; value: number; color: string }[]
}

const EnergyMixPieChart = ({ data }: EnergyMixChartProps) => {
  const { theme } = useTheme()
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  // Validate and ensure data exists
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No energy data available</p>
        </div>
      </div>
    )
  }

  const totalEnergy = data.reduce((sum, item) => sum + (item.value || 0), 0)

  if (totalEnergy === 0) {
    return (
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No energy consumption data</p>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / totalEnergy) * 100).toFixed(1)
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="font-semibold text-gray-800 dark:text-white">{data.name}</span>
          </div>
          <div className="space-y-1">
            <div className="text-gray-900 dark:text-white font-bold">{data.value.toFixed(2)} kWh</div>
            <div className="text-blue-600 dark:text-blue-400 font-medium">{percentage}%</div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={0}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EnergyMixPieChart
