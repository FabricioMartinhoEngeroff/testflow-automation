// Massa de LTCATs com TODAS as abas preenchidas, na região
// "12 - Teste Fa - Unidade com descrição extensa...", com datas diferentes.
// Quantidade: LTCAT_QTD (padrão 1). Ex.: LTCAT_QTD=100 npm run test:e2e:scripts -- criar-ltcats-completos
import { fileURLToPath } from "node:url"
import path from "node:path"
import { test, expect } from "@support"
import { ltcatValido } from "@support/data/ltcat"

const QTD = Number(process.env.LTCAT_QTD ?? 1)
const INICIO_BASE = Date.UTC(2020, 0, 1)
const ARQUIVO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../support/arquivos/anexo-teste.pdf")

const dd = (n: number) => String(n).padStart(2, "0")
const formatar = (d: Date) => `${dd(d.getUTCDate())}/${dd(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`

// datas espalhadas e fora de ordem: passo de 37 dias módulo ~7 anos
function vigencia(i: number) {
  const inicio = new Date(INICIO_BASE + ((i * 37) % 2500) * 86400000)
  const fim = new Date(inicio.getTime() + 364 * 86400000)
  return { inicio: formatar(inicio), fim: formatar(fim) }
}

test.describe("criar LTCATs completos (região 12)", () => {
  test.setTimeout(240000)

  for (let i = 0; i < QTD; i++) {
    const n = i + 1
    const { inicio, fim } = vigencia(i)

    test(`LTCAT completo ${n}/${QTD} - início ${inicio}`, async ({
      login,
      ltcatCadastroPage: cadastro,
      ltcatReferenciasPage: referencias,
      ltcatConfiguracoesPage: config,
      ltcatAnexosPage: anexos,
      ltcatAnexoModal: anexoModal,
      ltcatColaboradoresPage: colaboradores,
      ltcatColaboradorModal: colaboradorModal,
      ltcatConclusaoPage: conclusao,
      ltcatHistoricoRevisoesModal: revisoes,
      ltcatNotificacoesModal: notificacoes,
      page,
    }) => {
      await login.entrar()
      await cadastro.abrir()

      // Referências (obrigatórios + opcionais)
      await cadastro.preencherObrigatorios({
        ...ltcatValido,
        regiao: "12 - Teste Fa",
        responsavelTecnico: "031.044.320-23",
        dataBase: inicio,
        vigenciaInicio: inicio,
        vigenciaFim: fim,
        avaliacaoRealizadaEm: `Completo ${n} ${inicio}`,
        condicoesOperacionais: `LTCAT completo ${n}/${QTD}, início ${inicio}, fim ${fim}`,
      })
      await referencias.art.fill(`ART-${1000 + n}`)
      await referencias.expostosMulheres.fill(String(n % 20))
      await referencias.expostosHomens.fill(String((n * 3) % 30))
      await referencias.expostosPcds.fill(String(n % 5))
      await referencias.totalExpostos.fill(String((n % 20) + ((n * 3) % 30) + (n % 5)))

      // Revisão (habilita "Incluir histórico de revisões")
      await revisoes.abrir()
      await revisoes.versao.fill(`1.${n}`)
      await revisoes.responsavelTecnico.click()
      await page.getByRole("option", { name: /031\.044\.320-23/ }).first().click()
      await revisoes.digitarData(revisoes.dataRevisao, inicio)
      await revisoes.digitarData(revisoes.dataBase, inicio)
      await revisoes.motivo.fill(`Revisão inicial do LTCAT ${n}`)
      await revisoes.botaoIncluirNaTabela.click()
      await expect(revisoes.linhas).toHaveCount(1)
      await revisoes.botaoSalvar.click()

      // Configurações
      await cadastro.abrirAba("Configurações")
      await config.ordenacao("Descrição do GHE").click()
      await config.marcar("Cargo")
      await config.marcar("GHE")
      await config.marcar("Incluir fotos dos GHEs")
      await config.marcar("Incluir GHEs sem integrantes")
      await config.marcar("Incluir GHEs sem riscos")
      await expect(config.opcao("Incluir GHEs sem riscos")).toHaveClass(/mat-checkbox-checked/, { timeout: 5000 })
      await expect(config.descritivoGhesSemRiscos).toBeEnabled({ timeout: 5000 })
      await config.descritivoGhesSemRiscos.fill(`Sem riscos identificados (${n})`)
      await config.marcar("EPIs")
      await config.marcar("EPCs")
      await config.fatorDeTroca(n % 2 === 0 ? "q3" : "q5").click()

      // Anexos
      await cadastro.abrirAba("Anexos")
      await anexos.abrirModalAdicionar()
      await anexoModal.anexar(ARQUIVO)
      await anexoModal.descricao.fill(`Anexo do LTCAT ${n}`)
      await anexoModal.botaoSalvar.click()

      // Colaboradores
      await cadastro.abrirAba("Colaboradores")
      await colaboradores.abrirModalAdicionar()
      await colaboradorModal.preencher(`Colaborador ${n}`, `Cargo ${n}`)
      await colaboradorModal.botaoSalvar.click()

      // Conclusão
      await cadastro.abrirAba("Conclusão")
      await conclusao.digitar(`Conclusão do LTCAT ${n}, início ${inicio}.`)

      // Notificações
      await notificacoes.abrir()
      await notificacoes.marcarDiasAntes("30")
      await notificacoes.gruposDeEmail.click()
      await page.getByRole("option").first().click()
      await page.keyboard.press("Escape")
      await notificacoes.botaoSalvar.click()
      await expect(notificacoes.titulo).toBeHidden()

      await cadastro.salvar()
      await expect(cadastro.mensagemSalvoComSucesso).toBeVisible()
      console.log(`LTCAT completo ${n} início ${inicio} salvo:`, page.url())
    })
  }
})
