"use client"

import { useState, useCallback, useEffect } from "react"
import { API_BASE_URL } from "../config"

interface AcceptedRecommendation {
  id: string
  type: string
  action: string
  financial_impact: string
  profit_in_usd: number
  accepted_at: string
  completed_at?: string
  status: "pending" | "implemented" | "completed"
  optimization_goal: string
  period: string
}

const useRecommendationActions = () => {
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<AcceptedRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load accepted recommendations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("acceptedRecommendations")
    if (stored) {
      try {
        const parsedRecommendations = JSON.parse(stored)
        setAcceptedRecommendations(parsedRecommendations)
      } catch (e) {
        console.error("Failed to parse stored recommendations:", e)
        localStorage.removeItem("acceptedRecommendations") // Clear corrupted data
      }
    }
  }, [])

  // Save to localStorage whenever acceptedRecommendations changes
  const saveToStorage = useCallback((recommendations: AcceptedRecommendation[]) => {
    try {
      localStorage.setItem("acceptedRecommendations", JSON.stringify(recommendations))
    } catch (e) {
      console.error("Failed to save recommendations to localStorage:", e)
    }
  }, [])

  const acceptRecommendation = useCallback(
    async (recommendation: any, optimizationGoal: string, period: string) => {
      setLoading(true)
      setError(null)

      try {
        // Create accepted recommendation object
        const acceptedRec: AcceptedRecommendation = {
          id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: recommendation.type,
          action: recommendation.action,
          financial_impact: recommendation.financial_impact,
          profit_in_usd: recommendation.profit_in_usd,
          accepted_at: new Date().toISOString(),
          status: "pending",
          optimization_goal: optimizationGoal,
          period: period,
        }

        // Try to send to API first (optional - for backend tracking)
        try {
          const response = await fetch(`${API_BASE_URL}/recommendations/accept`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              recommendation_id: acceptedRec.id,
              type: recommendation.type,
              action: recommendation.action,
              profit_in_usd: recommendation.profit_in_usd,
              accepted_at: acceptedRec.accepted_at,
              optimization_goal: optimizationGoal,
              period: period,
            }),
          })

          if (!response.ok) {
            console.warn("API call failed, storing locally only")
          }
        } catch (apiError) {
          console.warn("API not available, storing locally:", apiError)
        }

        // Store locally regardless of API success
        const updatedRecommendations = [...acceptedRecommendations, acceptedRec]
        setAcceptedRecommendations(updatedRecommendations)
        saveToStorage(updatedRecommendations)

        return acceptedRec
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to accept recommendation"
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [acceptedRecommendations, saveToStorage],
  )

  const updateRecommendationStatus = useCallback(
    async (id: string, status: AcceptedRecommendation["status"]) => {
      setLoading(true)
      setError(null)

      try {
        // Try to update via API
        try {
          const response = await fetch(`${API_BASE_URL}/recommendations/${id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ status }),
          })

          if (!response.ok) {
            console.warn("API status update failed, updating locally only")
          }
        } catch (apiError) {
          console.warn("API not available for status update, updating locally:", apiError)
        }

        // Update locally
        const updatedRecommendations = acceptedRecommendations.map((rec) => {
          if (rec.id === id) {
            const updatedRec = { ...rec, status }
            // Add completion timestamp when marked as completed
            if (status === "completed" && !rec.completed_at) {
              updatedRec.completed_at = new Date().toISOString()
            }
            return updatedRec
          }
          return rec
        })

        setAcceptedRecommendations(updatedRecommendations)
        saveToStorage(updatedRecommendations)
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to update recommendation status"
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [acceptedRecommendations, saveToStorage],
  )

  const deleteRecommendation = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)

      try {
        // Try to delete via API
        try {
          const response = await fetch(`${API_BASE_URL}/recommendations/${id}`, {
            method: "DELETE",
            headers: {
              Accept: "application/json",
            },
          })

          if (!response.ok) {
            console.warn("API delete failed, deleting locally only")
          }
        } catch (apiError) {
          console.warn("API not available for delete, deleting locally:", apiError)
        }

        // Delete locally
        const updatedRecommendations = acceptedRecommendations.filter((rec) => rec.id !== id)
        setAcceptedRecommendations(updatedRecommendations)
        saveToStorage(updatedRecommendations)
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to delete recommendation"
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [acceptedRecommendations, saveToStorage],
  )

  const getTotalAcceptedProfit = useCallback(() => {
    return acceptedRecommendations.reduce((total, rec) => total + rec.profit_in_usd, 0)
  }, [acceptedRecommendations])

  const getTotalCompletedProfit = useCallback(() => {
    return acceptedRecommendations
      .filter((rec) => rec.status === "completed")
      .reduce((total, rec) => total + rec.profit_in_usd, 0)
  }, [acceptedRecommendations])

  const getRecommendationsByStatus = useCallback(
    (status: AcceptedRecommendation["status"]) => {
      return acceptedRecommendations.filter((rec) => rec.status === status)
    },
    [acceptedRecommendations],
  )

  const getProfitByPeriod = useCallback(() => {
    const profitByPeriod = acceptedRecommendations
      .filter((rec) => rec.status === "completed")
      .reduce(
        (acc, rec) => {
          acc[rec.period] = (acc[rec.period] || 0) + rec.profit_in_usd
          return acc
        },
        {} as Record<string, number>,
      )

    return profitByPeriod
  }, [acceptedRecommendations])

  const getProfitByGoal = useCallback(() => {
    const profitByGoal = acceptedRecommendations
      .filter((rec) => rec.status === "completed")
      .reduce(
        (acc, rec) => {
          acc[rec.optimization_goal] = (acc[rec.optimization_goal] || 0) + rec.profit_in_usd
          return acc
        },
        {} as Record<string, number>,
      )

    return profitByGoal
  }, [acceptedRecommendations])

  return {
    acceptedRecommendations,
    acceptRecommendation,
    updateRecommendationStatus,
    deleteRecommendation,
    getTotalAcceptedProfit,
    getTotalCompletedProfit,
    getRecommendationsByStatus,
    getProfitByPeriod,
    getProfitByGoal,
    loading,
    error,
  }
}

export default useRecommendationActions
