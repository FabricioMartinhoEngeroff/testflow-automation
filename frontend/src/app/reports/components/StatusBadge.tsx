import type { ReactNode } from "react"
import { FiCheckCircle, FiXCircle, FiClock, FiRefreshCw } from "react-icons/fi"
import type { StatusCenario } from "../../shared/types"

interface StatusInfo {
  icon: ReactNode
  label: string
  color: string
  bg: string
}

const STATUS_MAP: Record<StatusCenario, StatusInfo> = {
  passou:     { icon: <FiCheckCircle />, label: "Passou",     color: "#22c55e", bg: "#f0fdf4" },
  falhou:     { icon: <FiXCircle />,     label: "Falhou",     color: "#ef4444", bg: "#fef2f2" },
  executando: { icon: <FiRefreshCw />,   label: "Executando", color: "#6366f1", bg: "#eef2ff" },
  pendente:   { icon: <FiClock />,       label: "Pendente",   color: "#94a3b8", bg: "#f8fafc" },
}

interface StatusBadgeProps {
  status: StatusCenario
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_MAP[status] || STATUS_MAP.pendente
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
      color: s.color, background: s.bg, border: `1px solid ${s.color}33`
    }}>
      <span style={{ animation: status === "executando" ? "spin 1s linear infinite" : "none" }}>
        {s.icon}
      </span>
      {s.label}
    </span>
  )
}
