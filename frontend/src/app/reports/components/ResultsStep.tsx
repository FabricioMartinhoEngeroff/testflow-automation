import { FiDownload, FiCheckCircle, FiCpu } from "react-icons/fi"
import ResultItem from "./ResultItem.tsx"
import type { Cenario } from "../../shared/types"

interface Stats {
  total: number
  passou: number
  falhou: number
  executando: number
}

interface ResultsStepProps {
  resultados: Cenario[]
  executando: boolean
  stats: Stats
}

export default function ResultsStep({ resultados, executando, stats }: ResultsStepProps) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 28,
      border: "1px solid #e2e8f0"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: executando ? "#6366f1" : "#22c55e",
            color: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: 700, fontSize: 13
          }}>
            {executando
              ? <FiCpu size={14} style={{ animation: "spin 2s linear infinite" }} />
              : <FiCheckCircle size={16} />
            }
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
            {executando ? "Executando testes..." : "Resultados"}
          </span>
        </div>

        {!executando && (
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            color: "#16a34a", padding: "8px 16px", borderRadius: 8,
            cursor: "pointer", fontWeight: 600, fontSize: 13
          }}>
            <FiDownload size={14} /> Baixar Excel com resultados
          </button>
        )}
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total", valor: stats.total, color: "#6366f1", bg: "#eef2ff" },
          { label: "Passou", valor: stats.passou, color: "#22c55e", bg: "#f0fdf4" },
          { label: "Falhou", valor: stats.falhou, color: "#ef4444", bg: "#fef2f2" },
          { label: "Executando", valor: stats.executando, color: "#f59e0b", bg: "#fffbeb" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 10, padding: "12px 16px",
            textAlign: "center", border: `1px solid ${s.color}22`
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.valor}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* BARRA DE PROGRESSO */}
      {executando && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ background: "#f1f5f9", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, background: "#6366f1",
              width: `${((stats.passou + stats.falhou) / stats.total) * 100}%`,
              transition: "width .5s"
            }} />
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, textAlign: "right" }}>
            {stats.passou + stats.falhou} de {stats.total} concluídos
          </p>
        </div>
      )}

      {/* LISTA */}
      {resultados.map(item => (
        <ResultItem key={item.id} item={item} />
      ))}
    </div>
  )
}
