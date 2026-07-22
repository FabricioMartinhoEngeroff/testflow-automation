export type StatusCenario = "pendente" | "executando" | "passou" | "falhou"

export interface Cenario {
  id: string
  tela: string
  funcionalidade: string
  cenario: string
  resultadoEsperado: string
  status: StatusCenario
  mensagem?: string
  screenshot?: string
}

export interface Credenciais {
  url: string
  usuario: string
  senha: string
}

export interface Permissoes {
  incluir: boolean
  alterar: boolean
  excluir: boolean
  visualizar: boolean
}

export interface PerfilTeste {
  id: string
  nome: string
  usuario: string
  senha: string
  permissoes: Permissoes
}
