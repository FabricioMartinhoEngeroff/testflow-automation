import type { Cenario } from "../../shared/types"

const MOCK_CENARIOS: Cenario[] = [
  { id: "TST017", tela: "PGR - Tela de Pesquisa", funcionalidade: "Campo Hierarquia 1", cenario: "Validar obrigatoriedade sem seleção", resultadoEsperado: "Sistema deve impedir pesquisa sem selecionar ao menos uma unidade", status: "pendente" },
  { id: "TST049", tela: "PGR - Tela de Pesquisa", funcionalidade: "Campo Hierarquia 2", cenario: "Acessar tela sem selecionar Hierarquia 1", resultadoEsperado: "Campo Hierarquia 2 deve iniciar bloqueado", status: "pendente" },
  { id: "TST114", tela: "PGR - Tela de Pesquisa", funcionalidade: "Botões de ações de pesquisa", cenario: 'Clicar no botão "Pesquisar" com campos obrigatórios não preenchidos', resultadoEsperado: "Sistema deve exibir mensagem e não realizar a busca", status: "pendente" },
  { id: "TST244", tela: "Cabeçalho", funcionalidade: "Campo Data Base", cenario: "Tentar salvar o formulário sem preencher a Data Base", resultadoEsperado: "Sistema deve bloquear o salvamento e exibir mensagem de obrigatoriedade clara", status: "pendente" },
  { id: "TST302", tela: "Modal Histórico de Revisões", funcionalidade: "Campo Versão", cenario: 'Tentar salvar sem preencher o campo "Versão"', resultadoEsperado: "Sistema deve bloquear salvamento e exibir mensagem de obrigatoriedade", status: "pendente" },
]

export async function carregarCenarios(file: File): Promise<Cenario[]> {
  const form = new FormData()
  form.append("excel", file)

  try {
    const res = await fetch("http://localhost:3001/api/carregar", { method: "POST", body: form })
    const data = await res.json()
    return data.cenarios
  } catch {
    // mock para testar o front sem backend
    return MOCK_CENARIOS
  }
}
