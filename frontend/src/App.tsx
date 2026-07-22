import { useState, type ChangeEvent } from "react"
import { FiTrash2, FiUser } from "react-icons/fi"
import { RiRobot2Line } from "react-icons/ri"
import UploadStep from "./app/upload/components/UploadStep.tsx"
import { carregarCenarios } from "./app/upload/services/uploadService.ts"
import ConfigStep from "./app/execution/components/ConfigStep.tsx"
import { executarCenario } from "./app/execution/services/executionService.ts"
import ResultsStep from "./app/reports/components/ResultsStep.tsx"
import PerfisScreen from "./app/perfis/components/PerfisScreen.tsx"
import { listarPerfis } from "./app/perfis/services/perfisService.ts"
import type { Cenario } from "./app/shared/types"

type Tela = "execucao" | "perfis"

export default function App() {
  const [tela, setTela]                 = useState<Tela>("execucao")
  const [arquivo, setArquivo]           = useState<File | null>(null)
  const [cenarios, setCenarios]         = useState<Cenario[]>([])
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [resultados, setResultados]     = useState<Cenario[]>([])
  const [executando, setExecutando]     = useState(false)
  const [etapa, setEtapa]               = useState(1)
  const [url, setUrl]                   = useState("")
  const [usuario, setUsuario]           = useState("")
  const [senha, setSenha]               = useState("")
  const [perfilId, setPerfilId]         = useState("")
  const [maximo, setMaximo]             = useState(20)
  const [filtroTela, setFiltroTela]     = useState("")
  const [carregando, setCarregando]     = useState(false)

  const telas = [...new Set(cenarios.map(c => c.tela))].filter(Boolean)

  const cenariosFiltrados = cenarios.filter(c => {
    if (filtroTela && c.tela !== filtroTela) return false
    return true
  }).slice(0, maximo)

  const stats = {
    total:      resultados.length,
    passou:     resultados.filter(r => r.status === "passou").length,
    falhou:     resultados.filter(r => r.status === "falhou").length,
    executando: resultados.filter(r => r.status === "executando").length,
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivo(file)
    setCarregando(true)

    const lista = await carregarCenarios(file)
    setCenarios(lista)
    setSelecionados(lista.map(c => c.id))
    setEtapa(2)
    setCarregando(false)
  }

  async function executarTestes() {
    if (!selecionados.length) return
    setExecutando(true)
    setEtapa(3)

    const lista = cenariosFiltrados.filter(c => selecionados.includes(c.id))
    setResultados(lista.map(c => ({ ...c, status: "pendente" })))

    for (const cenario of lista) {
      setResultados(prev => prev.map(r =>
        r.id === cenario.id ? { ...r, status: "executando" } : r
      ))

      const resultado = await executarCenario(cenario, { url, usuario, senha })
      setResultados(prev => prev.map(r =>
        r.id === cenario.id ? { ...r, ...resultado } : r
      ))
    }

    setExecutando(false)
  }

  function selecionarPerfil(id: string) {
    setPerfilId(id)
    if (!id) return
    const perfil = listarPerfis().find(p => p.id === id)
    if (!perfil) return
    setUsuario(perfil.usuario)
    setSenha(perfil.senha)
  }

  function toggleCenario(id: string) {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function limpar() {
    setArquivo(null)
    setCenarios([])
    setSelecionados([])
    setResultados([])
    setEtapa(1)
    setUrl("")
    setUsuario("")
    setSenha("")
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <div style={{
        background: "#1e1b4b", color: "#fff",
        padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <RiRobot2Line size={28} color="#818cf8" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Executor de Testes Automáticos</div>
            <div style={{ fontSize: 12, color: "#a5b4fc" }}>Playwright + Claude + Excel</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setTela(tela === "perfis" ? "execucao" : "perfis")} style={{
            background: "transparent", border: "1px solid #4338ca",
            color: "#a5b4fc", padding: "6px 14px", borderRadius: 8,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13
          }}>
            <FiUser size={14} /> {tela === "perfis" ? "Voltar à execução" : "Perfis de teste"}
          </button>
          {tela === "execucao" && arquivo && (
            <button onClick={limpar} style={{
              background: "transparent", border: "1px solid #4338ca",
              color: "#a5b4fc", padding: "6px 14px", borderRadius: 8,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13
            }}>
              <FiTrash2 size={14} /> Nova execução
            </button>
          )}
        </div>
      </div>

      {tela === "perfis" ? (
        <PerfisScreen onVoltar={() => setTela("execucao")} />
      ) : (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
          <UploadStep
            arquivo={arquivo}
            cenarios={cenarios}
            carregando={carregando}
            done={etapa > 1}
            onUpload={handleUpload}
          />

          {etapa >= 2 && (
            <ConfigStep
              done={etapa > 2}
              url={url} setUrl={setUrl}
              usuario={usuario} setUsuario={setUsuario}
              senha={senha} setSenha={setSenha}
              perfis={listarPerfis()}
              perfilId={perfilId}
              onSelecionarPerfil={selecionarPerfil}
              telas={telas}
              filtroTela={filtroTela} setFiltroTela={setFiltroTela}
              maximo={maximo} setMaximo={setMaximo}
              totalCenarios={cenarios.length}
              cenariosFiltrados={cenariosFiltrados}
              selecionados={selecionados}
              onToggle={toggleCenario}
              onSelectAll={() => setSelecionados(cenariosFiltrados.map(c => c.id))}
              onSelectNone={() => setSelecionados([])}
              onExecutar={executarTestes}
              executando={executando}
            />
          )}

          {etapa >= 3 && resultados.length > 0 && (
            <ResultsStep resultados={resultados} executando={executando} stats={stats} />
          )}
        </div>
      )}
    </div>
  )
}
