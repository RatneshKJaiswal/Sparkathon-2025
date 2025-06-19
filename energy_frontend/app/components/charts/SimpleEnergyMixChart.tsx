"use client"

import { useTheme } from "../../contexts/ThemeContext"

interface SimpleEnergyMixChartProps {
  data: { name: string; value: number; color: string }[]
}

const SimpleEnergyMixChart = ({ data }: SimpleEnergyMixChartProps) => {
  const { theme } = useTheme()

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
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

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = ((item.value / totalEnergy) * 100).toFixed(1)
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white">{item.value.toFixed(2)} kWh</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{percentage}%</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Total Energy</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">{totalEnergy.toFixed(2)} kWh</span>
        </div>
      </div>
    </div>
  )
}

export default SimpleEnergyMixChart
