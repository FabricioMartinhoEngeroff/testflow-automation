import { useRef, type ChangeEvent } from "react"
import { FiUpload, FiCheckCircle, FiRefreshCw } from "react-icons/fi"
import StepCard from "../../shared/components/StepCard.tsx"
import type { Cenario } from "../../shared/types"

interface UploadStepProps {
  arquivo: File | null
  cenarios: Cenario[]
  carregando: boolean
  done: boolean
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void
}

export default function UploadStep({ arquivo, cenarios, carregando, done, onUpload }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <StepCard step={1} done={done} title="Selecionar planilha de cenários">
      {!arquivo ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2px dashed #c7d2fe", borderRadius: 12,
            padding: "40px 20px", textAlign: "center", cursor: "pointer",
            background: "#f8faff", transition: "all .2s"
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#c7d2fe"}
        >
          {carregando ? (
            <div style={{ color: "#6366f1" }}>
              <FiRefreshCw size={32} style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: 12, fontSize: 14 }}>Carregando cenários...</p>
            </div>
          ) : (
            <>
              <FiUpload size={32} color="#6366f1" />
              <p style={{ marginTop: 12, fontWeight: 600, color: "#334155" }}>
                Clique para carregar o Excel
              </p>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                Arquivo .xlsx gerado pelo Automatizador de Cenários
              </p>
            </>
          )}
          <input
            ref={inputRef} type="file" accept=".xlsx,.xls"
            style={{ display: "none" }} onChange={onUpload}
          />
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 10, padding: "12px 16px"
        }}>
          <FiCheckCircle size={20} color="#22c55e" />
          <div>
            <p style={{ fontWeight: 600, color: "#166534", fontSize: 14 }}>{arquivo.name}</p>
            <p style={{ fontSize: 12, color: "#16a34a" }}>
              {cenarios.length} cenários carregados
            </p>
          </div>
        </div>
      )}
    </StepCard>
  )
}
