import type { ReactNode } from "react"
import { FiCheckCircle } from "react-icons/fi"

interface StepCardProps {
  step: number
  done: boolean
  title: string
  children: ReactNode
}

export default function StepCard({ step, done, title, children }: StepCardProps) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 28,
      border: "1px solid #e2e8f0", marginBottom: 20
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: done ? "#22c55e" : "#6366f1",
          color: "#fff", display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 700, fontSize: 13
        }}>
          {done ? <FiCheckCircle size={16} /> : step}
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}
