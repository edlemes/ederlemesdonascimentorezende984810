import { useEffect, useState } from "react"

type ApiStatusState = "online" | "offline" | "checking";

const API_URL =
  import.meta.env.VITE_API_URL || "https://pet-manager-api.geia.vip"
const CHECK_INTERVAL = 30000

export function ApiStatus() {
  const [status, setStatus] = useState<ApiStatusState>("checking")

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(`${API_URL}/q/health`, {
          method: "GET",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        setStatus(response.ok ? "online" : "offline")
      } catch {
        setStatus("offline")
      }
    }

    checkApiHealth()

    const intervalId = setInterval(checkApiHealth, CHECK_INTERVAL)

    return () => clearInterval(intervalId)
  }, [])

  const statusConfig = {
    online: {
      color: "bg-green-500",
      pulse: "animate-pulse",
      label: "API Online",
      ring: "ring-green-400/30",
    },
    offline: {
      color: "bg-red-500",
      pulse: "",
      label: "API Offline",
      ring: "ring-red-400/30",
    },
    checking: {
      color: "bg-yellow-500",
      pulse: "animate-pulse",
      label: "Verificando API...",
      ring: "ring-yellow-400/30",
    },
  }

  const config = statusConfig[status]

  return (
    <div className="relative group">
      <div
        className={`w-3 h-3 rounded-full ${config.color} ${config.pulse} ring-4 ${config.ring} cursor-pointer`}
        aria-label={config.label}
      />

      <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
        {config.label}
        <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    </div>
  )
}
