import { useState } from "react"
import { FiImage, FiChevronDown, FiChevronUp } from "react-icons/fi"
import StatusBadge from "./StatusBadge.tsx"
import type { Cenario } from "../../shared/types"

interface ResultItemProps {
  item: Cenario
}

export default function ResultItem({ item }: ResultItemProps) {
  const [aberto, setAberto] = useState(false)
  return (
    <div style={{
      border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden",
      background: "#fff", marginBottom: 8
    }}>
      <div
        onClick={() => setAberto(!aberto)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", cursor: "pointer",
          background: aberto ? "#f8fafc" : "#fff"
        }}
      >
        <span style={{ fontWeight: 700, color: "#6366f1", minWidth: 72, fontSize: 13 }}>
          {item.id}
        </span>
        <span style={{ flex: 1, fontSize: 13, color: "#334155" }}>
          {item.cenario}
        </span>
        <StatusBadge status={item.status} />
        {item.screenshot && (
          <span style={{ color: "#94a3b8", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <FiImage size={14} /> foto
          </span>
        )}
        <span style={{ color: "#94a3b8" }}>
          {aberto ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </div>

      {aberto && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                TELA / FUNCIONALIDADE
              </p>
              <p style={{ fontSize: 13, color: "#334155" }}>
                {item.tela} → {item.funcionalidade}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 12, marginBottom: 4, fontWeight: 600 }}>
                RESULTADO ESPERADO
              </p>
              <p style={{ fontSize: 13, color: "#334155" }}>{item.resultadoEsperado}</p>
            </div>
            <div>
              {item.mensagem && (
                <>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                    OBSERVAÇÃO DO TESTE
                  </p>
                  <p style={{
                    fontSize: 13, color: item.status === "falhou" ? "#ef4444" : "#334155",
                    background: item.status === "falhou" ? "#fef2f2" : "#f0fdf4",
                    padding: "8px 12px", borderRadius: 6
                  }}>
                    {item.mensagem}
                  </p>
                </>
              )}
              {item.screenshot && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                    SCREENSHOT
                  </p>
                  <img
                    src={item.screenshot}
                    alt="screenshot"
                    style={{ width: "100%", borderRadius: 6, border: "1px solid #e2e8f0" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
