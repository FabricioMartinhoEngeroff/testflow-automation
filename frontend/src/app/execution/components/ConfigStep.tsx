import type { Dispatch, SetStateAction } from "react"
import { FiPlay, FiRefreshCw } from "react-icons/fi"
import StepCard from "../../shared/components/StepCard.tsx"
import ScenarioList from "./ScenarioList.tsx"
import type { Cenario, PerfilTeste } from "../../shared/types"

interface ConfigStepProps {
  done: boolean
  url: string
  setUrl: Dispatch<SetStateAction<string>>
  usuario: string
  setUsuario: Dispatch<SetStateAction<string>>
  senha: string
  setSenha: Dispatch<SetStateAction<string>>
  telas: string[]
  filtroTela: string
  setFiltroTela: Dispatch<SetStateAction<string>>
  maximo: number
  setMaximo: Dispatch<SetStateAction<number>>
  totalCenarios: number
  cenariosFiltrados: Cenario[]
  selecionados: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onSelectNone: () => void
  onExecutar: () => void
  executando: boolean
  perfis: PerfilTeste[]
  perfilId: string
  onSelecionarPerfil: (id: string) => void
}

export default function ConfigStep({
  done, url, setUrl, usuario, setUsuario, senha, setSenha,
  telas, filtroTela, setFiltroTela, maximo, setMaximo,
  totalCenarios, cenariosFiltrados, selecionados,
  onToggle, onSelectAll, onSelectNone, onExecutar, executando,
  perfis, perfilId, onSelecionarPerfil
}: ConfigStepProps) {
  return (
    <StepCard step={2} done={done} title="Configurar execução">
      {perfis.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
            Perfil de teste (preenche usuário/senha automaticamente)
          </label>
          <select
            value={perfilId}
            onChange={e => onSelecionarPerfil(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", background: "#fff"
            }}
          >
            <option value="">Selecionar manualmente</option>
            {perfis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
            URL do sistema
          </label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://sistema.apollus.com.br/..."
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b"
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
            Usuário de teste
          </label>
          <input
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            placeholder="usuario@empresa.com"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b"
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
            Senha
          </label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="••••••••"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b"
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
            Filtrar por tela
          </label>
          <select
            value={filtroTela}
            onChange={e => setFiltroTela(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b",
              background: "#fff"
            }}
          >
            <option value="">Todas as telas</option>
            {telas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* SLIDER MÁXIMO */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
            Máximo de cenários
          </label>
          <span style={{
            fontWeight: 700, color: "#6366f1", fontSize: 18,
            minWidth: 32, textAlign: "right"
          }}>
            {maximo}
          </span>
        </div>
        <input
          type="range" min={1} max={totalCenarios || 50}
          value={maximo}
          onChange={e => setMaximo(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#6366f1" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
          <span>1</span>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>
            A IA não precisa atingir o limite — para quando a cobertura estiver completa
          </span>
          <span>{totalCenarios || 50}</span>
        </div>
      </div>

      <ScenarioList
        cenarios={cenariosFiltrados}
        selecionados={selecionados}
        onToggle={onToggle}
        onSelectAll={onSelectAll}
        onSelectNone={onSelectNone}
      />

      <button
        onClick={onExecutar}
        disabled={!selecionados.length || executando}
        style={{
          width: "100%", padding: "14px 0",
          background: selecionados.length && !executando ? "#6366f1" : "#e2e8f0",
          color: selecionados.length && !executando ? "#fff" : "#94a3b8",
          border: "none", borderRadius: 10, fontWeight: 700,
          fontSize: 15, cursor: selecionados.length && !executando ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all .2s"
        }}
      >
        {executando
          ? <><FiRefreshCw style={{ animation: "spin 1s linear infinite" }} size={18} /> Executando testes...</>
          : <><FiPlay size={18} /> Executar {selecionados.length} testes com IA</>
        }
      </button>
    </StepCard>
  )
}
