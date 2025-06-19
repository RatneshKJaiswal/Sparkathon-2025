"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react"

const ApiStatusIndicator = () => {
  const [status, setStatus] = useState<"checking" | "online" | "offline" | "error">("checking")
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkApiStatus = async () => {
    setStatus("checking")
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000))

      const fetchPromise = fetch("https://renergyapi-production-4b89.up.railway.app/api/v1/current-status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response

      if (response.ok) {
        setStatus("online")
      } else {
        setStatus("error")
      }
    } catch (error) {
      if (error instanceof Error && error.message === "timeout") {
        setStatus("offline")
      } else {
        setStatus("offline")
      }
    } finally {
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkApiStatus()
    const interval = setInterval(checkApiStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusConfig = () => {
    switch (status) {
      case "online":
        return {
          icon: CheckCircle,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          text: "API Online",
          description: "All systems operational",
        }
      case "offline":
        return {
          icon: WifiOff,
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          text: "API Offline",
          description: "Using cached data",
        }
      case "error":
        return {
          icon: AlertCircle,
          color: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200 dark:border-yellow-800",
          text: "API Issues",
          description: "Limited functionality",
        }
      default:
        return {
          icon: Wifi,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          text: "Checking...",
          description: "Verifying connection",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-3 mb-4`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${config.color} ${status === "checking" ? "animate-pulse" : ""}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`font-medium ${config.color}`}>{config.text}</span>
            {lastChecked && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{lastChecked.toLocaleTimeString()}</span>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{config.description}</p>
        </div>
        <button
          onClick={checkApiStatus}
          className={`p-1 rounded ${config.color} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
          title="Check API status"
        >
          <Wifi className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default ApiStatusIndicator
