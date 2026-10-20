// Aba Configurações do LTCAT herdando a tela "Configuração Geral": Sugerir = preenchido e editável, Bloquear = preenchido e travado.
// A Configuração Geral vale para todos no ambiente, então este arquivo roda sozinho (project ltcat-config-geral) e devolve
// os modos originais no fim de cada teste. Em 2026-10-20 a coluna LTCAT estava toda em Bloquear (aba com campos travados).
import { test, expect } from "../../../../../support"
import type { LinhaConfig, Modo } from "../../../../../support/actions/seguranca/programas-e-laudos/ConfiguracaoGeral"
import type { OpcaoConfiguracoes, OrdenacaoGhes, FatorTroca } from "../../../../../support/actions/seguranca/programas-e-laudos/ltcat/LTCATConfiguracoes"
import { URLS } from "../../../../../support/urls"
import { ltcatValido } from "../../../../../support/data/ltcat"

test.describe.configure({ mode: "serial" })

type Controle = { tipo: "checkbox"; opcao: OpcaoConfiguracoes; marcado: boolean } | { tipo: "radio"; ordenacao?: OrdenacaoGhes; fator?: FatorTroca }

// linha da Configuração Geral -> controles da aba Configurações (as 3 primeiras linhas, de hierarquia, não aparecem na aba)
const EPI_EPC: Record<string, OpcaoConfiguracoes> = { EPI: "EPIs", EPC: "EPCs" }
function controlesDaLinha({ rotulo, valor }: LinhaConfig): Controle[] {
  if (rotulo.startsWith("Listar os GHEs")) return [{ tipo: "radio", ordenacao: valor as OrdenacaoGhes }]
  if (rotulo.startsWith("Selecione o fator de troca")) return [{ tipo: "radio", fator: valor as FatorTroca }]
  const multi: Record<string, OpcaoConfiguracoes[]> = {
    "Incluir a descrição das atividades por": ["Cargo", "GHE"],
    "Incluir riscos das categorias": ["Mecânico/Acidente", "Ergonômico/Psicossocial"],
    "Considerar na conclusão": ["EPIs", "EPCs"],
  }
  if (multi[rotulo]) {
    const escolhidos = valor.split(", ").map((v) => EPI_EPC[v] ?? v)
    return multi[rotulo].map((opcao) => ({ tipo: "checkbox", opcao, marcado: escolhidos.includes(opcao) }))
  }
  if (valor === "true" || valor === "false") return [{ tipo: "checkbox", opcao: rotulo as OpcaoConfiguracoes, marcado: valor === "true" }]
  return []
}

test.describe("Aba Configurações x Configuração Geral", () => {
  test.beforeEach(async ({ login }) => {
    test.setTimeout(240000)
    await login.entrar()
  })

  // aplica o modo em toda a coluna LTCAT, confere a aba e devolve os modos originais
  async function conferirModo(modo: Modo, { configuracaoGeralPage: cg, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c, page }: {
    configuracaoGeralPage: import("../../../../../support/actions/seguranca/programas-e-laudos/ConfiguracaoGeral").ConfiguracaoGeralPage
    ltcatCadastroPage: import("../../../../../support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro").LtcatCadastroPage
    ltcatConfiguracoesPage: import("../../../../../support/actions/seguranca/programas-e-laudos/ltcat/LTCATConfiguracoes").LtcatConfiguracoesPage
    page: import("@playwright/test").Page
  }) {
    await cg.abrir()
    const original = await cg.lerLtcat()
    try {
      await cg.aplicarModoEmTodas(modo)
      await cg.salvar()
      const salva = await cg.lerLtcat()

      await cadastro.abrir()
      await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
      await cadastro.abrirAba("Configurações")
      let conferidos = 0
      for (const linha of salva) {
        for (const controle of linha.modo ? controlesDaLinha(linha) : []) {
          const alvo = controle.tipo === "checkbox" ? c.opcao(controle.opcao) : controle.ordenacao ? c.ordenacao(controle.ordenacao) : c.fatorDeTroca(controle.fator!)
          const entrada = alvo.locator("input")
          if (controle.tipo === "checkbox") await expect(entrada, linha.rotulo).toBeChecked({ checked: controle.marcado })
          else await expect(entrada, linha.rotulo).toBeChecked()
          if (modo === "Bloquear") await expect(entrada, linha.rotulo).toBeDisabled()
          else await expect(entrada, linha.rotulo).toBeEnabled()
          conferidos++
        }
      }
      expect(conferidos).toBeGreaterThan(20)
    } finally {
      await page.goto(URLS.ltcat)
      await cg.abrir()
      await cg.restaurar(original)
      if (await cg.botaoSalvar.isEnabled()) await cg.salvar()
    }
  }

  test("03 - modo Bloquear: campos preenchidos conforme a Configuração Geral e bloqueados", async ({ configuracaoGeralPage, ltcatCadastroPage, ltcatConfiguracoesPage, page }) => {
    await conferirModo("Bloquear", { configuracaoGeralPage, ltcatCadastroPage, ltcatConfiguracoesPage, page })
  })

  test("02 - modo Sugerir: campos preenchidos conforme a Configuração Geral e editáveis", async ({ configuracaoGeralPage, ltcatCadastroPage, ltcatConfiguracoesPage, page }) => {
    await conferirModo("Sugerir", { configuracaoGeralPage, ltcatCadastroPage, ltcatConfiguracoesPage, page })
  })

  // a tela não tem estado "sem configuração": Bloquear e Sugerir são exclusivos e uma das duas está sempre ativa em cada linha
  test.fixme("01 - sem parametrização prévia a aba carrega os valores default da documentação", async () => {})

  test("04 - radio 'Listar os GHEs em ordem alfabética por' vem marcado com o valor da Configuração Geral", async ({ configuracaoGeralPage: cg, ltcatCadastroPage: cadastro, ltcatConfiguracoesPage: c }) => {
    await cg.abrir()
    const linha = (await cg.lerLtcat()).find((l) => l.rotulo.startsWith("Listar os GHEs"))!
    await cadastro.abrir()
    await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
    await cadastro.abrirAba("Configurações")
    await expect(c.ordenacao(linha.valor as OrdenacaoGhes).locator("input")).toBeChecked()
  })
})
