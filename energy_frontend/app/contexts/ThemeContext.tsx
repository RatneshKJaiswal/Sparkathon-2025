"use client"

import React from "react"
import { createContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const savedTheme = localStorage.getItem("theme") as Theme
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const initialTheme = savedTheme || systemTheme

    setThemeState(initialTheme)
    applyTheme(initialTheme)

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light"
        setThemeState(newTheme)
        applyTheme(newTheme)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement

    if (newTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    root.style.transition = "background-color 0.3s ease, color 0.3s ease"
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
  }

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 dark:bg-gray-900 min-h-screen" />
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
