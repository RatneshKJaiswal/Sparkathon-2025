"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { API_BASE_URL } from "../config"

const useApi = <T,>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const paramsString = useMemo(() => JSON.stringify(params), [params])

  const fetchData = useCallback(
    async (isRetry = false) => {
      if (!isRetry) {
        setLoading(true)
        setRetryCount(0)
      }
      setError(null)

      try {
        const url = new URL(`${API_BASE_URL}${endpoint}`)

        // Add query parameters if they exist
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.append(key, String(value))
            }
          })
        }

        console.log(`Fetching: ${url.toString()}`)

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        console.log(`Response status: ${response.status} ${response.statusText}`)

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`

          try {
            const contentType = response.headers.get("content-type")
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json()
              console.log("Error response data:", errorData)

              // Handle FastAPI error format
              if (errorData.detail) {
                if (Array.isArray(errorData.detail)) {
                  errorMessage = errorData.detail
                    .map((d: any) => {
                      if (typeof d === "string") return d
                      if (d.msg) return d.msg
                      if (d.message) return d.message
                      return JSON.stringify(d)
                    })
                    .join(", ")
                } else if (typeof errorData.detail === "string") {
                  errorMessage = errorData.detail
                }
              } else if (errorData.message) {
                errorMessage = errorData.message
              }
            } else {
              const textResponse = await response.text()
              if (textResponse) {
                errorMessage = `${errorMessage}: ${textResponse.substring(0, 200)}`
              }
            }
          } catch (parseError) {
            console.warn("Failed to parse error response:", parseError)
          }

          // Retry logic for 5xx errors
          if (response.status >= 500 && retryCount < 2) {
            console.log(`Retrying request (attempt ${retryCount + 1})...`)
            setRetryCount((prev) => prev + 1)
            setTimeout(() => fetchData(true), 2000 * (retryCount + 1))
            return
          }

          throw new Error(errorMessage)
        }

        // Parse JSON response
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON response, got ${contentType}`)
        }

        const result = await response.json()
        console.log(`Successfully fetched data for ${endpoint}:`, result)

        // Handle different API response structures based on endpoint
        if (endpoint === "/historical-data") {
          // Historical data API returns: { data: [...], query_start_date: ..., query_end_date: ..., aggregation_level: ... }
          if (result && result.data && Array.isArray(result.data)) {
            setData(result.data as T)
          } else {
            console.warn("Historical data endpoint returned unexpected structure:", result)
            setData([] as T)
          }
        } else if (endpoint === "/recommendations") {
          // Recommendations API returns: { suggestions: [...], recommendation_timestamp: ..., optimization_goal: ..., period: ... }
          if (result && result.suggestions && Array.isArray(result.suggestions)) {
            setData(result.suggestions as T)
          } else {
            console.warn("Recommendations endpoint returned unexpected structure:", result)
            setData([] as T)
          }
        } else {
          // For other endpoints (current-status, forecast), return the result directly
          setData(result)
        }
      } catch (e: unknown) {
        let userFriendlyError = "An unexpected error occurred."

        if (e instanceof Error) {
          if (e.name === "TypeError" && e.message === "Failed to fetch") {
            userFriendlyError = `Network error: Unable to connect to the API server. Please check your internet connection.`
          } else {
            userFriendlyError = e.message
          }
        } else {
          userFriendlyError = String(e)
        }

        setError(userFriendlyError)
        console.error(`API Error for ${endpoint}:`, {
          error: e,
          url: `${API_BASE_URL}${endpoint}`,
          params,
          retryCount,
          userFriendlyError,
        })
      } finally {
        setLoading(false)
      }
    },
    [endpoint, paramsString, retryCount],
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: () => fetchData(false), retryCount }
}

export default useApi
