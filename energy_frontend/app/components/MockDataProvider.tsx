"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { HistoricalDataPoint, Recommendation } from "../types"

// Mock data generators for when API is unavailable
export const generateMockHistoricalData = (days: number): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Generate realistic energy data with some randomness
    const baseConsumption = 150 + Math.random() * 50
    const solarGeneration = 80 + Math.random() * 40
    const electricityPrice = 0.12 + Math.random() * 0.08

    data.push({
      date: date.toISOString().split("T")[0],
      Daily_Total_Energy_Usage_kWh: baseConsumption,
      Daily_Solar_Available_for_Use_kWh: solarGeneration,
      Daily_Avg_Electricity_Price_USD_per_kWh: electricityPrice,
      Daily_HVAC_Energy_kWh: baseConsumption * 0.4 + Math.random() * 10,
      Daily_Refrigeration_Energy_kWh: baseConsumption * 0.25 + Math.random() * 8,
      Daily_Lighting_Energy_kWh: baseConsumption * 0.15 + Math.random() * 5,
      Daily_IT_System_Energy_kWh: baseConsumption * 0.12 + Math.random() * 4,
      Daily_Other_System_Energy_kWh: baseConsumption * 0.08 + Math.random() * 3,
      Daily_Solar_Used_to_Charge_Battery_kWh: solarGeneration * 0.3 + Math.random() * 10,
      Daily_Battery_1_average_charge: 45 + Math.random() * 30,
      Daily_Battery_2_average_charge: 42 + Math.random() * 28,
    })
  }

  return data
}

export const generateMockRecommendations = (): Recommendation[] => {
  return [
    {
      type: "cost_reduction",
      action: "Optimize HVAC scheduling during peak hours to reduce energy costs by 15%",
      financial_impact: "Estimated monthly savings of $180-220 based on current usage patterns",
      profit_in_usd: 200,
    },
    {
      type: "efficiency",
      action: "Implement smart battery charging strategy to maximize solar energy utilization",
      financial_impact: "Increase solar self-consumption by 25%, reducing grid dependency",
      profit_in_usd: 150,
    },
    {
      type: "maintenance",
      action: "Schedule preventive maintenance for Battery 2 - performance degradation detected",
      financial_impact: "Prevent potential 30% capacity loss, maintain optimal performance",
      profit_in_usd: 300,
    },
    {
      type: "cost_reduction",
      action: "Shift non-critical IT operations to off-peak hours when electricity rates are lower",
      financial_impact: "Reduce peak demand charges and take advantage of time-of-use pricing",
      profit_in_usd: 120,
    },
  ]
}

interface MockDataProviderProps {
  children: React.ReactNode
  enableMockData?: boolean
}

export const MockDataProvider = ({ children, enableMockData = false }: MockDataProviderProps) => {
  const [mockEnabled, setMockEnabled] = useState(enableMockData)

  useEffect(() => {
    // Check if we should enable mock data based on API availability
    const checkApiAvailability = async () => {
      try {
        const response = await fetch("https://renergyapi-production-4b89.up.railway.app/api/v1/current-status", {
          method: "HEAD",
          mode: "no-cors",
        })
        setMockEnabled(false)
      } catch {
        console.log("API not available, enabling mock data")
        setMockEnabled(true)
      }
    }

    if (!enableMockData) {
      checkApiAvailability()
    }
  }, [enableMockData])

  return <>{children}</>
}

export default MockDataProvider
