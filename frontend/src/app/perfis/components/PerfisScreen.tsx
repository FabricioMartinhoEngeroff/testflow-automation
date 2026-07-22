import { useState } from "react"
import { FiPlus, FiTrash2, FiUser, FiArrowLeft } from "react-icons/fi"
import { listarPerfis, salvarPerfil, removerPerfil } from "../services/perfisService.ts"
import type { Permissoes, PerfilTeste } from "../../shared/types"

// durante a edição o perfil ainda pode não ter id (novo perfil) — por isso
// não reaproveitamos PerfilTeste direto, só ele com o id opcional
type FormPerfil = Omit<PerfilTeste, "id"> & { id: string | null }

const PERMISSOES_VAZIAS: Permissoes = { incluir: false, alterar: false, excluir: false, visualizar: false }

function formVazio(): FormPerfil {
  return { id: null, nome: "", usuario: "", senha: "", permissoes: { ...PERMISSOES_VAZIAS } }
}

interface PerfisScreenProps {
  onVoltar: () => void
}

export default function PerfisScreen({ onVoltar }: PerfisScreenProps) {
  const [perfis, setPerfis] = useState<PerfilTeste[]>(listarPerfis())
  const [form, setForm] = useState<FormPerfil>(formVazio())

  const todasMarcadas = Object.values(form.permissoes).every(Boolean)

  function togglePermissao(chave: keyof Permissoes) {
    setForm(f => ({ ...f, permissoes: { ...f.permissoes, [chave]: !f.permissoes[chave] } }))
  }

  function toggleTodos() {
    const novoValor = !todasMarcadas
    setForm(f => ({
      ...f,
      permissoes: { incluir: novoValor, alterar: novoValor, excluir: novoValor, visualizar: novoValor }
    }))
  }

  function handleSalvar() {
    if (!form.nome || !form.usuario || !form.senha) return
    const perfil: PerfilTeste = { ...form, id: form.id ?? crypto.randomUUID() }
    setPerfis(salvarPerfil(perfil))
    setForm(formVazio())
  }

  function handleRemover(id: string) {
    setPerfis(removerPerfil(id))
  }

  function handleEditar(perfil: PerfilTeste) {
    setForm(perfil)
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      <button onClick={onVoltar} style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
        background: "transparent", border: "none", color: "#6366f1",
        cursor: "pointer", fontWeight: 600, fontSize: 14, padding: 0
      }}>
        <FiArrowLeft size={16} /> Voltar
      </button>

      {/* FORMULÁRIO */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e2e8f0", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <FiUser size={20} color="#6366f1" />
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
            {form.id ? "Editar perfil de teste" : "Novo perfil de teste"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
              Nome do perfil
            </label>
            <input
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Usuário só visualizar"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
            />
          </div>
          <div />
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
              Usuário de teste
            </label>
            <input
              value={form.usuario}
              onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
              placeholder="usuario@empresa.com"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
              Senha
            </label>
            <input
              type="password"
              value={form.senha}
              onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
              placeholder="••••••••"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
            />
          </div>
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 10 }}>
          Permissões deste perfil
        </label>
        <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
          {([
            { chave: "incluir", label: "Incluir (INC)" },
            { chave: "alterar", label: "Alterar (ALT)" },
            { chave: "excluir", label: "Excluir (EXC)" },
            { chave: "visualizar", label: "Visualizar (VIS)" },
          ] as const).map(({ chave, label }) => (
            <label key={chave} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#334155", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.permissoes[chave]}
                onChange={() => togglePermissao(chave)}
                style={{ accentColor: "#6366f1", width: 15, height: 15 }}
              />
              {label}
            </label>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6366f1", fontWeight: 700, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={todasMarcadas}
              onChange={toggleTodos}
              style={{ accentColor: "#6366f1", width: 15, height: 15 }}
            />
            Todos
          </label>
        </div>

        <button
          onClick={handleSalvar}
          disabled={!form.nome || !form.usuario || !form.senha}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
            background: form.nome && form.usuario && form.senha ? "#6366f1" : "#e2e8f0",
            color: form.nome && form.usuario && form.senha ? "#fff" : "#94a3b8",
            border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
            cursor: form.nome && form.usuario && form.senha ? "pointer" : "not-allowed"
          }}
        >
          <FiPlus size={16} /> {form.id ? "Salvar alterações" : "Adicionar perfil"}
        </button>
      </div>

      {/* LISTA */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e2e8f0" }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", display: "block", marginBottom: 16 }}>
          Perfis salvos ({perfis.length})
        </span>

        {perfis.length === 0 && (
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Nenhum perfil cadastrado ainda.</p>
        )}

        {perfis.map(perfil => (
          <div key={perfil.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            border: "1px solid #f1f5f9", borderRadius: 10, marginBottom: 8
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{perfil.nome}</p>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>{perfil.usuario}</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(perfil.permissoes).filter(([, v]) => v).map(([chave]) => (
                <span key={chave} style={{
                  fontSize: 11, fontWeight: 600, color: "#6366f1", background: "#eef2ff",
                  padding: "2px 8px", borderRadius: 99
                }}>
                  {chave.slice(0, 3).toUpperCase()}
                </span>
              ))}
            </div>
            <button onClick={() => handleEditar(perfil)} style={{
              fontSize: 12, color: "#6366f1", background: "transparent", border: "none",
              cursor: "pointer", fontWeight: 600
            }}>
              Editar
            </button>
            <button onClick={() => handleRemover(perfil.id)} style={{
              background: "transparent", border: "none", color: "#ef4444", cursor: "pointer",
              display: "flex", alignItems: "center"
            }}>
              <FiTrash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
