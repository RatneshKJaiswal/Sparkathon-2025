"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  Award,
  Target,
  Calendar,
  DollarSign,
  Zap,
  ChevronRight,
  Trophy,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react"
import useRecommendationActions from "../hooks/useRecommendationActions"

const ProfitDisplaySection = () => {
  const { getTotalCompletedProfit, getProfitByPeriod, getProfitByGoal, getRecommendationsByStatus } =
    useRecommendationActions()

  const [animatedProfit, setAnimatedProfit] = useState(0)
  const totalProfit = getTotalCompletedProfit()
  const profitByPeriod = getProfitByPeriod()
  const profitByGoal = getProfitByGoal()
  const completedRecommendations = getRecommendationsByStatus("completed")

  // Animate profit counter
  useEffect(() => {
    if (totalProfit > 0) {
      const duration = 2000
      const steps = 60
      const increment = totalProfit / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= totalProfit) {
          setAnimatedProfit(totalProfit)
          clearInterval(timer)
        } else {
          setAnimatedProfit(current)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [totalProfit])

  if (totalProfit === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 rounded-2xl p-8 shadow-xl border border-blue-200 dark:border-gray-700">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-sm">💰</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Start Your Profit Journey
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Accept and complete AI recommendations to start earning profits from energy optimizations
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Target className="w-4 h-4" />
            <span>Complete your first recommendation to unlock profit tracking</span>
          </div>
        </div>
      </div>
    )
  }

  const achievements = [
    {
      title: "Energy Optimizer",
      description: "Completed first recommendation",
      icon: CheckCircle2,
      unlocked: completedRecommendations.length >= 1,
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Profit Pioneer",
      description: "Earned $50+ in savings",
      icon: DollarSign,
      unlocked: totalProfit >= 50,
      color: "from-blue-500 to-cyan-600",
    },
    {
      title: "Efficiency Expert",
      description: "Completed 5+ recommendations",
      icon: Trophy,
      unlocked: completedRecommendations.length >= 5,
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Savings Superstar",
      description: "Earned $200+ in savings",
      icon: Award,
      unlocked: totalProfit >= 200,
      color: "from-yellow-500 to-orange-600",
    },
  ]

  const unlockedAchievements = achievements.filter((a) => a.unlocked)
  const nextAchievement = achievements.find((a) => !a.unlocked)

  return (
    <div className="space-y-6">
      {/* Main Profit Display */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl p-8 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjEiPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+CjwvZz4KPC9nPgo8L3N2Zz4K')]"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">Total Profit Earned</h2>
              </div>
            </div>

          </div>

          <div className="text-center mb-6">
            <div className="text-6xl font-black text-white mb-2 tracking-tight">${animatedProfit.toFixed(2)}</div>
            <div className="flex items-center justify-center gap-2 text-emerald-100">
              <span className="text-lg font-medium">
                {totalProfit > 0 ? "+" : ""}
                {(totalProfit / Math.max(1, completedRecommendations.length)).toFixed(2)} avg per recommendation
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white/80 text-sm">This Month</span>
              </div>
              <div className="text-white text-xl font-bold">
                $
                {Object.values(profitByPeriod)
                  .reduce((sum, profit) => sum + profit, 0)
                  .toFixed(2)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-white" />
                <span className="text-white/80 text-sm">Best Category</span>
              </div>
              <div className="text-white text-xl font-bold">
                {Object.entries(profitByGoal).length > 0
                  ? Object.entries(profitByGoal)
                      .reduce((a, b) => (a[1] > b[1] ? a : b))[0]
                      .replace("_", " ")
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Achievements</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Your energy optimization milestones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {unlockedAchievements.map((achievement, index) => {
            const Icon = achievement.icon
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 rounded-xl border border-gray-200 dark:border-gray-600"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${achievement.color} rounded-xl flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 dark:text-white">{achievement.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Next Achievement */}
        {nextAchievement && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Next Achievement</h4>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div
                className={`w-12 h-12 bg-gradient-to-r ${nextAchievement.color} opacity-50 rounded-xl flex items-center justify-center`}
              >
                <nextAchievement.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-gray-800 dark:text-white">{nextAchievement.title}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">{nextAchievement.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* Detailed Breakdown */}
      {(Object.keys(profitByGoal).length > 0 || Object.keys(profitByPeriod).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profit by Goal */}
          {Object.keys(profitByGoal).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Profit by Goal</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(profitByGoal)
                  .sort(([, a], [, b]) => b - a)
                  .map(([goal, profit]) => (
                    <div
                      key={goal}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-gray-600 dark:text-gray-400 capitalize font-medium">
                        {goal.replace("_", " ")}
                      </span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-lg">${profit.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Profit by Period */}
          {Object.keys(profitByPeriod).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Profit by Period</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(profitByPeriod)
                  .sort(([, a], [, b]) => b - a)
                  .map(([period, profit]) => (
                    <div
                      key={period}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-gray-600 dark:text-gray-400 capitalize font-medium">{period}</span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-lg">${profit.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProfitDisplaySection
