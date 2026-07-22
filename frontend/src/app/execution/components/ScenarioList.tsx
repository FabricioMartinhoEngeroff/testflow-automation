import { FiList } from "react-icons/fi"
import type { Cenario } from "../../shared/types"

interface ScenarioListProps {
  cenarios: Cenario[]
  selecionados: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onSelectNone: () => void
}

export default function ScenarioList({ cenarios, selecionados, onToggle, onSelectAll, onSelectNone }: ScenarioListProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
          <FiList size={14} /> Cenários selecionados ({selecionados.length})
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onSelectAll}
            style={{
              fontSize: 12, color: "#6366f1", background: "transparent",
              border: "none", cursor: "pointer", fontWeight: 600
            }}
          >
            Todos
          </button>
          <span style={{ color: "#e2e8f0" }}>|</span>
          <button
            onClick={onSelectNone}
            style={{
              fontSize: 12, color: "#ef4444", background: "transparent",
              border: "none", cursor: "pointer", fontWeight: 600
            }}
          >
            Nenhum
          </button>
        </div>
      </div>

      <div style={{
        maxHeight: 240, overflowY: "auto",
        border: "1px solid #e2e8f0", borderRadius: 10
      }}>
        {cenarios.map((c, i) => (
          <label
            key={c.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", cursor: "pointer",
              borderBottom: i < cenarios.length - 1 ? "1px solid #f1f5f9" : "none",
              background: selecionados.includes(c.id) ? "#f8f9ff" : "#fff",
              transition: "background .15s"
            }}
          >
            <input
              type="checkbox"
              checked={selecionados.includes(c.id)}
              onChange={() => onToggle(c.id)}
              style={{ accentColor: "#6366f1", width: 15, height: 15 }}
            />
            <span style={{ fontWeight: 700, color: "#6366f1", fontSize: 12, minWidth: 64 }}>
              {c.id}
            </span>
            <span style={{ fontSize: 13, color: "#475569", flex: 1 }}>
              {c.cenario}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{c.tela}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
