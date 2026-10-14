// Massa para a ordenação padrão da lista de LTCAT (por "Data início" descendente):
// 5 LTCATs do responsável técnico 031.044.320-23, criados FORA da ordem
// cronológica, com uma data repetida (01/03/2026) para o cenário de datas iguais.
// Rodar com: npm run test:e2e:scripts -- criar-ltcats-ordenacao
import { test, expect } from "../support"
import { ltcatValido } from "../support/data/ltcat"

const RESPONSAVEL_TECNICO = "031.044.320-23"

// [início, fim] — criados nesta ordem, de propósito
const VIGENCIAS: [string, string][] = [
  ["01/03/2026", "28/02/2027"],
  ["01/01/2024", "31/12/2024"],
  ["01/09/2026", "31/08/2027"],
  ["01/06/2025", "31/05/2026"],
  ["01/03/2026", "28/02/2027"],
]

test.describe("criar LTCATs para o teste de ordenação", () => {
  test.setTimeout(120000)

  VIGENCIAS.forEach(([inicio, fim], i) => {
    const n = i + 1
    test(`LTCAT ${n}/${VIGENCIAS.length} - início ${inicio}`, async ({ login, ltcatCadastroPage: cadastro, page }) => {
      await login.entrar()
      await cadastro.abrir()
      await cadastro.preencherObrigatorios({
        ...ltcatValido,
        responsavelTecnico: RESPONSAVEL_TECNICO,
        dataBase: inicio,
        vigenciaInicio: inicio,
        vigenciaFim: fim,
        avaliacaoRealizadaEm: `Ordenação ${inicio} (${n}/${VIGENCIAS.length})`,
        condicoesOperacionais: `Massa de ordenação, início ${inicio}`,
      })
      await cadastro.preencherConfiguracoesObrigatorias(n % 2 === 0 ? "q3" : "q5")
      await cadastro.salvar()
      await expect(cadastro.mensagemSalvoComSucesso).toBeVisible()
      console.log(`LTCAT ${n} início ${inicio} salvo:`, page.url())
    })
  })
})
