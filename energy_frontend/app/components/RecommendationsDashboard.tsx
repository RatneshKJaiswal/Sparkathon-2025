"use client"
import { useState } from "react"
import {
  Lightbulb,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Check,
  RefreshCw,
  Settings,
  Play,
  Trash2,
  Award,
  Calendar,
} from "lucide-react"
import useApi from "../hooks/useApi"
import useRecommendationActions from "../hooks/useRecommendationActions"
import type { Recommendation } from "../types"
import ProfitDisplaySection from "./ProfitDisplaySection"

const RecommendationsDashboard = () => {
  const [optimizationGoal, setOptimizationGoal] = useState("cost_reduction")
  const [period, setPeriod] = useState("hourly")
  const [activeTab, setActiveTab] = useState<"new" | "pending" | "completed">("new")

  const {
    data: recommendations,
    loading,
    error,
    refetch,
  } = useApi<Recommendation[]>("/recommendations", {
    optimization_goal: optimizationGoal,
    period: period,
  })

  const {
    acceptedRecommendations,
    acceptRecommendation,
    updateRecommendationStatus,
    deleteRecommendation,
    getTotalAcceptedProfit,
    getTotalCompletedProfit,
    getRecommendationsByStatus,
    getProfitByPeriod,
    getProfitByGoal,
    loading: actionLoading,
  } = useRecommendationActions()

  const [processingId, setProcessingId] = useState<string | null>(null)

  // Filter out recommendations that have already been accepted
  const acceptedRecommendationActions = acceptedRecommendations.map((rec) => rec.action)
  const safeRecommendations = Array.isArray(recommendations)
    ? recommendations.filter((rec) => !acceptedRecommendationActions.includes(rec.action))
    : []

  const pendingRecommendations = getRecommendationsByStatus("pending")
  const implementedRecommendations = getRecommendationsByStatus("implemented")
  const completedRecommendations = getRecommendationsByStatus("completed")

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              AI Recommendations
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Loading smart optimization suggestions...</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Generating AI Recommendations</h3>
          </div>
          <p className="text-blue-700 dark:text-blue-300">
            Analyzing energy patterns for {optimizationGoal.replace("_", " ")} optimization ({period} period)...
          </p>
        </div>

        <div className="animate-pulse">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleAcceptRecommendation = async (recommendation: Recommendation, index: number) => {
    const recId = `temp_${index}`
    setProcessingId(recId)

    try {
      await acceptRecommendation(recommendation, optimizationGoal, period)
      // Show success feedback and refresh recommendations
      setTimeout(() => {
        refetch()
      }, 1000)
    } catch (error) {
      console.error("Failed to accept recommendation:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleStatusUpdate = async (id: string, status: "pending" | "implemented" | "completed") => {
    setProcessingId(id)
    try {
      await updateRecommendationStatus(id, status)
    } catch (error) {
      console.error("Failed to update recommendation status:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteRecommendation = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this recommendation?")) {
      setProcessingId(id)
      try {
        await deleteRecommendation(id)
      } catch (error) {
        console.error("Failed to delete recommendation:", error)
      } finally {
        setProcessingId(null)
      }
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "battery management":
        return TrendingUp
      case "device control":
        return Settings
      case "load shifting":
        return Clock
      case "strategic planning":
        return CheckCircle
      case "carbon reduction":
        return Lightbulb
      case "operational efficiency":
        return DollarSign
      default:
        return Info
    }
  }

  const getRecommendationColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "battery management":
        return {
          bg: "bg-gradient-to-r from-green-500 to-green-600",
          border: "border-green-200 dark:border-green-800",
          bgLight: "bg-green-50 dark:bg-green-900/20",
          text: "text-green-700 dark:text-green-300",
          hover: "hover:from-green-600 hover:to-green-700",
        }
      case "device control":
        return {
          bg: "bg-gradient-to-r from-blue-500 to-blue-600",
          border: "border-blue-200 dark:border-blue-800",
          bgLight: "bg-blue-50 dark:bg-blue-900/20",
          text: "text-blue-700 dark:text-blue-300",
          hover: "hover:from-blue-600 hover:to-blue-700",
        }
      case "strategic planning":
        return {
          bg: "bg-gradient-to-r from-purple-500 to-purple-600",
          border: "border-purple-200 dark:border-purple-800",
          bgLight: "bg-purple-50 dark:bg-purple-900/20",
          text: "text-purple-700 dark:text-purple-300",
          hover: "hover:from-purple-600 hover:to-purple-700",
        }
      default:
        return {
          bg: "bg-gradient-to-r from-gray-500 to-gray-600",
          border: "border-gray-200 dark:border-gray-800",
          bgLight: "bg-gray-50 dark:bg-gray-900/20",
          text: "text-gray-700 dark:text-gray-300",
          hover: "hover:from-gray-600 hover:to-gray-700",
        }
    }
  }

  const NewRecommendationCard = ({ recommendation, index }: { recommendation: Recommendation; index: number }) => {
    const Icon = getRecommendationIcon(recommendation.type)
    const colors = getRecommendationColor(recommendation.type)
    const isPositiveImpact = recommendation.profit_in_usd > 0
    const recId = `temp_${index}`
    const isProcessing = processingId === recId

    return (
      <div
        className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border ${colors.border} hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group`}
      >
        <div className="flex flex-col gap-4 w-full">
          {/* Icon + Heading always in one line */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`p-3 rounded-xl ${colors.bg} shadow-lg flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white break-words">
              {recommendation.type}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bgLight} ${colors.text} animate-pulse break-words`}
            >
              {optimizationGoal.replace("_", " ").toUpperCase()}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed break-words">
            {recommendation.action}
          </p>

          {/* Financial Impact */}
          <div
            className={`p-4 rounded-lg ${colors.bgLight} border ${colors.border} transition-all duration-300 hover:shadow-md w-full overflow-hidden`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Financial Impact</span>
              <div
                className={`flex items-center gap-1 ${isPositiveImpact
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
                  }`}
              >
                {isPositiveImpact ? <TrendingUp className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span className="text-lg font-bold truncate max-w-[120px] sm:max-w-none">
                  ${Math.abs(recommendation.profit_in_usd).toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{recommendation.financial_impact}</p>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 w-full">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 break-words">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="break-words">Ready to implement</span>
            </div>

            <button
              onClick={() => handleAcceptRecommendation(recommendation, index)}
              disabled={isProcessing || actionLoading}
              className={`px-4 py-2 rounded-lg ${colors.bg} ${colors.hover} text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 shadow-lg hover:shadow-xl text-sm w-full sm:w-auto`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Accept
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    )
  }

  const AcceptedRecommendationCard = ({
    recommendation,
    showActions = true,
  }: {
    recommendation: any
    showActions?: boolean
  }) => {
    const Icon = getRecommendationIcon(recommendation.type)
    const colors = getRecommendationColor(recommendation.type)
    const isPositiveImpact = recommendation.profit_in_usd > 0
    const isProcessing = processingId === recommendation.id

    const getStatusColor = (status: string) => {
      switch (status) {
        case "pending":
          return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800"
        case "implemented":
          return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800"
        case "completed":
          return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800"
        default:
          return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800"
      }
    }

    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 sm:p-6 shadow-lg border ${colors.border}`}>
        <div className="flex flex-col gap-4 w-full">
          {/* Icon + Heading always on same row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`p-3 rounded-xl ${colors.bg} shadow-lg flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white break-words">{recommendation.type}</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(recommendation.status)} break-words`}
            >
              {recommendation.status.toUpperCase()}
            </span>
            <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 break-words">
              {recommendation.optimization_goal.replace("_", " ")} • {recommendation.period}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed break-words">
            {recommendation.action}
          </p>

          {/* Financial Impact */}
          <div className={`p-4 rounded-lg ${colors.bgLight} border ${colors.border} w-full`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Financial Impact</span>
              <div
                className={`flex items-center gap-1 ${isPositiveImpact
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
                  }`}
              >
                {isPositiveImpact ? <TrendingUp className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span className="text-lg font-bold truncate max-w-[120px] sm:max-w-none">
                  ${Math.abs(recommendation.profit_in_usd).toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{recommendation.financial_impact}</p>
          </div>

          {/* Dates and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 w-full">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 break-words">
              <Calendar className="w-4 h-4" />
              <span>
                Accepted: {new Date(recommendation.accepted_at).toLocaleDateString()}
                {recommendation.completed_at && (
                  <span className="ml-2">
                    • Completed: {new Date(recommendation.completed_at).toLocaleDateString()}
                  </span>
                )}
              </span>
            </div>

            {showActions && (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {recommendation.status === "pending" && (
                  <button
                    onClick={() => handleStatusUpdate(recommendation.id, "implemented")}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Implement
                  </button>
                )}

                {recommendation.status === "implemented" && (
                  <button
                    onClick={() => handleStatusUpdate(recommendation.id, "completed")}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Complete
                  </button>
                )}

                {recommendation.status !== "completed" && (
                  <button
                    onClick={() => handleDeleteRecommendation(recommendation.id)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm disabled:opacity-50 w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const totalSavings = safeRecommendations.reduce((sum, rec) => sum + Math.max(0, rec.profit_in_usd), 0)
  const totalRecommendations = safeRecommendations.length
  const totalAcceptedProfit = getTotalAcceptedProfit()
  const totalCompletedProfit = getTotalCompletedProfit()
  const profitByPeriod = getProfitByPeriod()
  const profitByGoal = getProfitByGoal()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 flex-nowrap overflow-x-auto">
        <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
          <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
            AI Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-base truncate">
            Smart optimization suggestions for your energy system
          </p>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-32">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
            <h3 className="text-base sm:text-lg font-semibold">Pending</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{pendingRecommendations.length}</p>
          <p className="text-blue-100 text-sm">Awaiting implementation</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-32">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8" />
            <h3 className="text-base sm:text-lg font-semibold">In Progress</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{implementedRecommendations.length}</p>
          <p className="text-purple-100 text-sm">Currently implementing</p>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-5 sm:p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-32">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8" />
            <h3 className="text-base sm:text-lg font-semibold">Completed</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{completedRecommendations.length}</p>
          <p className="text-green-100 text-sm">Implemented</p>
        </div>
      </div>


      {/* Enhanced Profit Display Section */}
      {totalCompletedProfit > 0 && <ProfitDisplaySection />}

      {/* Settings Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recommendation Settings</h3>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Optimization Goal</label>
            <select
              value={optimizationGoal}
              onChange={(e) => setOptimizationGoal(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cost_reduction">Cost Reduction</option>
              <option value="carbon_footprint">Carbon Footprint</option>
              <option value="battery_longevity">Battery Longevity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab("new")}
          className={`flex-1 min-w-[40%] sm:min-w-0 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "new"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
        >
          New Recommendations ({totalRecommendations})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 min-w-[40%] sm:min-w-0 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "pending"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
        >
          Pending Implementation ({pendingRecommendations.length + implementedRecommendations.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 min-w-[40%] sm:min-w-0 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "completed"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
        >
          Completed ({completedRecommendations.length})
        </button>
      </div>


      {/* Content based on active tab */}
      <div className="space-y-6">
        {activeTab === "new" && (
          <>
            {error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                    Unable to Load Recommendations
                  </h3>
                </div>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            ) : safeRecommendations.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 max-w-md mx-auto">
                  <Lightbulb className="w-16 h-16 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No New Recommendations</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    All available recommendations have been accepted or your system is operating optimally.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {safeRecommendations.map((recommendation, index) => (
                  <NewRecommendationCard key={index} recommendation={recommendation} index={index} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "pending" && (
          <div className="space-y-6">
            {pendingRecommendations.length === 0 && implementedRecommendations.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-2xl p-8 max-w-md mx-auto">
                  <Clock className="w-16 h-16 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Pending Recommendations</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Accept some recommendations to start tracking their implementation.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {pendingRecommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      Awaiting Implementation ({pendingRecommendations.length})
                    </h3>
                    <div className="space-y-4">
                      {pendingRecommendations.map((recommendation) => (
                        <AcceptedRecommendationCard key={recommendation.id} recommendation={recommendation} />
                      ))}
                    </div>
                  </div>
                )}

                {implementedRecommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      In Progress ({implementedRecommendations.length})
                    </h3>
                    <div className="space-y-4">
                      {implementedRecommendations.map((recommendation) => (
                        <AcceptedRecommendationCard key={recommendation.id} recommendation={recommendation} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="space-y-6">
            {completedRecommendations.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8 max-w-md mx-auto">
                  <Award className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Completed Recommendations</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete some recommendations to start tracking your profit and achievements.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {completedRecommendations.map((recommendation) => (
                  <AcceptedRecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecommendationsDashboard
