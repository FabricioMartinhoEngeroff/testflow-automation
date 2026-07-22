import type { PerfilTeste } from "../../shared/types"

const CHAVE = "perfis-teste"

export function listarPerfis(): PerfilTeste[] {
  const bruto = localStorage.getItem(CHAVE)
  return bruto ? JSON.parse(bruto) : []
}

function salvarTodos(perfis: PerfilTeste[]) {
  localStorage.setItem(CHAVE, JSON.stringify(perfis))
}

export function salvarPerfil(perfil: PerfilTeste): PerfilTeste[] {
  const perfis = listarPerfis()
  const indice = perfis.findIndex(p => p.id === perfil.id)
  if (indice >= 0) {
    perfis[indice] = perfil
  } else {
    perfis.push(perfil)
  }
  salvarTodos(perfis)
  return perfis
}

export function removerPerfil(id: string): PerfilTeste[] {
  const perfis = listarPerfis().filter(p => p.id !== id)
  salvarTodos(perfis)
  return perfis
}
