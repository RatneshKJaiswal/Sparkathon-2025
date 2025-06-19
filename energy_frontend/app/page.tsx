"use client"

import type React from "react"
import { useState, useEffect, Suspense, lazy } from "react"
import { Sun, Moon, BarChart2, Home, Menu, X, Zap, TrendingUp, Lightbulb } from "lucide-react"
import { ThemeProvider, useTheme } from "./contexts/ThemeContext"
import ApiStatusIndicator from "./components/ApiStatusIndicator"

// Lazy load components for better performance
const HistoricalDataView = lazy(() => import("./components/HistoricalDataView"))
const CurrentStatusDashboard = lazy(() => import("./components/CurrentStatusDashboard"))
const ForecastDashboard = lazy(() => import("./components/ForecastDashboard"))
const RecommendationsDashboard = lazy(() => import("./components/RecommendationsDashboard"))

const AppContent = () => {
  const { theme, toggleTheme } = useTheme()
  const [activeView, setActiveView] = useState("dashboard")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setIsSidebarOpen(false)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleViewChange = (viewName: string) => {
    setActiveView(viewName)
    if (isMobile) setIsSidebarOpen(false)
  }

  const NavLink = ({ viewName, label, icon: Icon }: { viewName: string; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => handleViewChange(viewName)}
      className={`group flex items-center w-full px-4 py-3 text-left rounded-xl transition-all duration-300 transform hover:scale-[0.98] ${
        activeView === viewName
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      <Icon
        className={`w-5 h-5 mr-3 transition-transform duration-300 ${activeView === viewName ? "scale-110" : "group-hover:scale-105"}`}
      />
      <span className="font-medium">{label}</span>
      {activeView === viewName && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />}
    </button>
  )

  const LoadingSpinner = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-500 dark:border-t-blue-400 mx-auto mb-4"></div>
          <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 dark:text-blue-400 animate-pulse" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 animate-pulse">{message}</p>
      </div>
    </div>
  )

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-8">
            <ApiStatusIndicator />
            <Suspense fallback={<LoadingSpinner message="Loading Dashboard..." />}>
              <CurrentStatusDashboard />
            </Suspense>
          </div>
        )
      case "history":
        return (
          <div className="space-y-6">
            <ApiStatusIndicator />
            <Suspense fallback={<LoadingSpinner message="Loading Historical Data..." />}>
              <HistoricalDataView />
            </Suspense>
          </div>
        )
      case "forecast":
        return (
          <div className="space-y-6">
            <ApiStatusIndicator />
            <Suspense fallback={<LoadingSpinner message="Loading Forecast..." />}>
              <ForecastDashboard />
            </Suspense>
          </div>
        )
      case "recommendations":
        return (
          <div className="space-y-6">
            <ApiStatusIndicator />
            <Suspense fallback={<LoadingSpinner message="Loading Recommendations..." />}>
              <RecommendationsDashboard />
            </Suspense>
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Page not found</p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">

            <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              WALMART ENERGY HUB
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600" />
              )}
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <aside
        className={`
                ${isMobile ? "fixed" : "relative"}
                ${isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"}
                w-72 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
                border-r border-gray-200 dark:border-gray-700
                flex flex-col transition-all duration-300 ease-out
                ${isMobile ? "z-50 h-full shadow-2xl" : "h-screen shadow-xl"}
            `}
      >
        {/* Desktop Header */}
        <div className="hidden md:flex items-center mb-8 px-6 pt-6">
          <div className="p-3 bg-gradient-to-r rounded-xl shadow-lg">
            <Sun className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="ml-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              WALMART ENERGY HUB
            </h1>
          </div>
        </div>

        {/* Mobile sidebar header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">

            <h1 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              WALMART ENERGY HUB
            </h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-2 px-4 py-4">
          <NavLink viewName="dashboard" label="Dashboard" icon={Home} />
          <NavLink viewName="history" label="Historical Data" icon={BarChart2} />
          <NavLink viewName="forecast" label="Forecast" icon={TrendingUp} />
          <NavLink viewName="recommendations" label="Recommendations" icon={Lightbulb} />
        </nav>

        {/* Desktop Theme Toggle */}
        <div className="hidden md:block mt-auto px-4 pb-6">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-4 py-3 text-left rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 hover:scale-[0.98] group"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5 mr-3 text-yellow-500 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 mr-3 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
                flex-1 overflow-y-auto
                ${isMobile ? "pt-16" : "pt-0"}
                p-6 lg:p-8
                transition-all duration-300
            `}
      >
        <div className="max-w-7xl mx-auto w-full">
          {/* Page Title - Mobile */}
          <div className="md:hidden mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent capitalize">
              {activeView === "dashboard" ? "Dashboard" : activeView.replace(/([A-Z])/g, " $1").trim()}
            </h2>
          </div>

          {/* Content */}
          <div className="min-h-0">{renderView()}</div>
        </div>
      </main>
    </div>
  )
}

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
