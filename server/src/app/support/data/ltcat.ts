// Dados mínimos para um LTCAT salvar: campos com * + uma opção de descrição
// das atividades (regra da aba Configurações, descoberta em 2026-10-13)
export type DadosLtcat = {
  regiao: string
  // código da unidade (ex: "711001"); opcional — sem ela o LTCAT vale pra região toda
  unidade?: string
  // trecho que identifica o responsável técnico na lista (ex: CPF); sem ele vale a primeira opção
  responsavelTecnico?: string
  dataBase: string
  vigenciaInicio: string
  vigenciaFim: string
  avaliacaoRealizadaEm: string
  condicoesOperacionais: string
}

export const ltcatValido: DadosLtcat = {
  regiao: "71 - 71-CURITIBA",
  dataBase: "01/10/2026",
  vigenciaInicio: "01/10/2026",
  vigenciaFim: "31/10/2026",
  avaliacaoRealizadaEm: "Avaliação de teste",
  condicoesOperacionais: "Condições operacionais de teste",
}

