// LTCAT > aba Colaboradores (TST1239-TST1318): modal, regras, grid, Editar e Excluir.
// A maioria roda num LTCAT novo sem salvar (o grid só vai pro banco no Salvar do LTCAT).
// Volume, várias abas e atualizar página usam o LTCAT existente (LTCAT_IDKEY, padrão 145) com pelo menos 50 colaboradores.
import type { Page } from "@playwright/test"
import { test, expect } from "@support"
import { URLS } from "@support/urls"
import { ltcatValido } from "@support/data/ltcat"
import { LtcatCadastroPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro"
import { LtcatColaboradoresPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradores"
import { LtcatColaboradorModal } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradorModal"
import { salvarLtcat } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"
import {
  MSG_COLABORADORES,
  abrirEdicaoColaborador,
  avisoColaboradores,
  cliqueRapidoDuplo,
  colaboradoresDeCarga,
  corDeFundo,
  corDestaque,
  corDoTexto,
  excluirColaborador,
  fecharSemSalvar,
  incluirColaborador,
  incluirColaboradoresEmLote,
  INTERVALO_CLIQUE_MS,
  popupExclusao,
  semAlfa,
} from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradoresFluxos"

const IDKEY = process.env.LTCAT_IDKEY ?? "145"
const URL_EXISTENTE = `${URLS.ltcatCadastro}?idkey=${IDKEY}`
const ORIENTACAO =
  "Informe abaixo os representantes da organização que acompanharam o trabalho realizado. Caso não insira nenhuma informação, o capítulo sobre Colaboradores não será exibido no laudo."
const MSG_INCLUIDO = 'Operação realizada com sucesso. Para que a alteração seja permanentemente salva, clique no botão "Salvar".'
const MSG_DESATUALIZADO = "Os dados foram atualizados por outro usuário. Favor visualizar novamente o registro."
const AMARELO = "rgb(255, 193, 7)" // #ffc107, toast de Atenção

// fora de ordem alfabética de propósito: se o grid ordenasse sozinho, a ordem mudaria
const TRES = [
  { nome: "Zeca Primeiro", cargo: "Cargo C" },
  { nome: "Ana Segunda", cargo: "Cargo A" },
  { nome: "Maria Terceira", cargo: "Cargo B" },
]
const NOMES = TRES.map((c) => c.nome)

const incluirTres = async (a: LtcatColaboradoresPage, m: LtcatColaboradorModal) => {
  for (const c of TRES) await incluirColaborador(a, m, c.nome, c.cargo)
}

const abrirExistente = async (page: Page, c: LtcatCadastroPage, a: LtcatColaboradoresPage) => {
  await page.goto(URL_EXISTENTE)
  await c.titulo.waitFor()
  await c.abrirAba("Colaboradores")
  await expect(a.linhasColaborador.first()).toBeVisible()
}

test.describe("LTCAT - Colaboradores", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage: c }) => {
    await login.entrar()
    await c.abrir()
    await c.abrirAba("Colaboradores")
  })

  test.describe("Modal + Regras + Usabilidade", () => {
    test("TST1239 - aba Colaboradores visível e ativa", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a }) => {
      await expect(c.aba("Colaboradores")).toHaveAttribute("aria-selected", "true")
      await expect(a.botaoAdicionar).toBeVisible()
      await expect(page.locator("apls-toast")).toHaveCount(0) // sem erro ao abrir
    })

    test("TST1240 - texto fixo da tela", async ({ ltcatColaboradoresPage: a }) => {
      await expect(a.orientacao).toHaveText(ORIENTACAO)
    })

    test("TST1241 - texto deixa claro o impacto no laudo", async ({ ltcatColaboradoresPage: a }) => {
      await expect(a.orientacao).toContainText("o capítulo sobre Colaboradores não será exibido no laudo")
    })

    test("TST1242 - botão Adicionar visível com ícone (+)", async ({ ltcatColaboradoresPage: a }) => {
      await expect(a.botaoAdicionar).toBeVisible()
      await expect(a.botaoAdicionar.locator("mat-icon")).toHaveText("add_circle_outline")
    })

    test("TST1243/TST1244 - Adicionar abre a modal com título Colaboradores", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await expect(m.titulo).toHaveText("Colaboradores")
    })

    test("TST1245 - modal exibe Colaborador e Cargo", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await expect(m.colaborador).toBeVisible()
      await expect(m.cargo).toBeVisible()
    })

    test("TST1246 - layout: Colaborador acima de Cargo, alinhados", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      for (const el of [m.colaborador, m.cargo, m.botaoFechar, m.botaoSalvarEAdicionarOutro, m.botaoSalvar]) await expect(el).toBeInViewport()
      const col = (await m.colaborador.boundingBox())!
      const car = (await m.cargo.boundingBox())!
      expect(col.y).toBeLessThan(car.y)
      expect(Math.abs(col.x - car.x)).toBeLessThanOrEqual(4)
      expect(Math.abs(col.width - car.width)).toBeLessThanOrEqual(4)
    })

    test("TST1247 - Colaborador vazio impede salvar", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await m.cargo.fill("Analista")
      await m.botaoSalvar.click()
      await avisoColaboradores(page, MSG_COLABORADORES.obrigatorios)
      await expect(m.titulo).toBeVisible()
    })

    test("TST1248 - Cargo vazio impede salvar", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await m.colaborador.fill("Fulano de Tal")
      await m.botaoSalvar.click()
      await avisoColaboradores(page, MSG_COLABORADORES.obrigatorios)
      await expect(m.titulo).toBeVisible()
    })

    test("TST1249 - salvar sem preencher exibe [campos_obrigatorios]", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await m.botaoSalvar.click()
      await avisoColaboradores(page, MSG_COLABORADORES.obrigatorios)
      await expect(a.linhasColaborador).toHaveCount(0)
    })

    test("TST1250 - ambos preenchidos permite salvar", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Fulano de Tal", "Analista de Testes")
      await expect(a.celula("Fulano de Tal")).toBeVisible()
    })

    test("TST1251 - Colaborador aceita 60 caracteres", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await m.colaborador.fill("a".repeat(60))
      await expect(m.colaborador).toHaveValue("a".repeat(60))
    })

    test("TST1252 - Colaborador bloqueia acima de 60", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await expect(m.colaborador).toHaveAttribute("maxlength", "60")
      await m.colaborador.fill("a".repeat(70))
      await expect(m.colaborador).toHaveValue("a".repeat(60))
    })

    test("TST1253 - Cargo aceita 60 e bloqueia acima", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await expect(m.cargo).toHaveAttribute("maxlength", "60")
      await m.cargo.fill("b".repeat(70))
      await expect(m.cargo).toHaveValue("b".repeat(60))
    })

    // valores que precisam chegar intactos ao grid
    const formatos = [
      { id: "TST1254", caso: "caracteres especiais", nome: "D'Ávila & Cia. (Ltda.) #1 @ 100%", cargo: "Téc. [Sênior] /SSO; ção ñ Ü" },
      { id: "TST1255", caso: "maiúsculas e minúsculas", nome: "MaRiA dA sILVA", cargo: "tÉcNiCo SSO" },
      { id: "TST1256", caso: "espaços", nome: "Maria   da   Silva", cargo: "Cargo  com  espaços" },
    ]
    for (const f of formatos) {
      test(`${f.id} - aceita ${f.caso}`, async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        await incluirColaborador(a, m, f.nome, f.cargo)
        await abrirEdicaoColaborador(a, m, 0)
        await expect(m.colaborador).toHaveValue(f.nome)
        await expect(m.cargo).toHaveValue(f.cargo)
      })
    }

    test.describe("Colagem", () => {
      test.beforeEach(async ({ context }) => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"])
      })

      const colar = async (page: Page, campo: import("@playwright/test").Locator, texto: string) => {
        await page.evaluate((t) => navigator.clipboard.writeText(t), texto)
        await campo.focus()
        await page.keyboard.press("Control+V")
      }

      test("TST1257 - permite colar texto", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        await a.abrirModalAdicionar()
        await colar(page, m.colaborador, "Colado Da Área")
        await colar(page, m.cargo, "Cargo Colado")
        await expect(m.colaborador).toHaveValue("Colado Da Área")
        await expect(m.cargo).toHaveValue("Cargo Colado")
      })

      test("TST1258 - colagem longa respeita o limite de 60", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        await a.abrirModalAdicionar()
        await colar(page, m.colaborador, "C".repeat(80))
        await colar(page, m.cargo, "D".repeat(80))
        await expect(m.colaborador).toHaveValue("C".repeat(60))
        await expect(m.cargo).toHaveValue("D".repeat(60))
      })
    })

    test("TST1259 - Salvar com dados válidos grava e fecha a modal", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await m.preencher("Ciclano de Souza", "Técnico de Segurança")
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)
      await expect(a.linhasColaborador).toHaveCount(1)
    })

    test("TST1260 - mensagem de sucesso [info_sucesso]", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await m.preencher("Beltrano Souza", "Engenheiro")
      await m.botaoSalvar.click()
      await avisoColaboradores(page, MSG_INCLUIDO)
    })

    test("TST1261 - dados aparecem no grid e na reabertura da modal", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Persistência Grid", "Cargo Grid")
      await expect(a.linhasColaborador.first()).toContainText("Persistência Grid")
      await expect(a.linhasColaborador.first()).toContainText("Cargo Grid")
      await abrirEdicaoColaborador(a, m, 0)
      await expect(m.colaborador).toHaveValue("Persistência Grid")
      await expect(m.cargo).toHaveValue("Cargo Grid")
    })

    test("TST1262/TST1263 - Salvar e adicionar outro grava, mantém a modal e limpa os campos", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await m.preencher("Primeiro da Sequência", "Cargo 1")
      await m.botaoSalvarEAdicionarOutro.click()
      await avisoColaboradores(page, MSG_INCLUIDO)
      await expect(a.linhasColaborador).toHaveCount(1)
      await expect(m.titulo).toBeVisible()
      await expect(m.colaborador).toHaveValue("")
      await expect(m.cargo).toHaveValue("")
    })

    test("TST1264 - Salvar e adicionar outro visível na inclusão", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await expect(m.botaoSalvarEAdicionarOutro).toBeVisible()
    })

    test("TST1265 - Salvar e adicionar outro não aparece na edição", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Para Editar", "Cargo")
      await abrirEdicaoColaborador(a, m, 0)
      await expect(m.titulo).toHaveText("Colaboradores")
      await expect(m.botaoSalvar).toBeVisible()
      await expect(m.botaoSalvarEAdicionarOutro).toHaveCount(0)
    })

    test("TST1266 - Fechar sem dados fecha direto", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await m.botaoFechar.click()
      await expect(m.titulo).toHaveCount(0)
      await expect(a.linhasColaborador).toHaveCount(0)
    })

    test("TST1267 - preencher e fechar não grava os dados", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await a.abrirModalAdicionar()
      await m.preencher("Não Deve Gravar", "Cargo Descartado")
      await fecharSemSalvar(page, m)
      await expect(a.linhasColaborador).toHaveCount(0)
      await expect(a.semRegistros).toBeVisible()
    })

    test("TST1268 - vários cadastros seguidos (50)", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      test.setTimeout(400000)
      const lista = colaboradoresDeCarga(50, "Seq")
      await incluirColaboradoresEmLote(a, m, lista)
      await expect(a.linhasColaborador).toHaveCount(50)
      await expect(a.linhasColaborador.first()).toContainText(lista[0].nome)
      await expect(a.linhasColaborador.last()).toContainText(lista[49].nome)
    })

    test("TST1269 - grid com 50+ colaboradores abre e aceita inclusão sem travar", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await page.goto(URL_EXISTENTE)
      await c.titulo.waitFor()
      const inicio = Date.now()
      await c.abrirAba("Colaboradores")
      await expect(a.linhasColaborador.first()).toBeVisible()
      const antes = await a.linhasColaborador.count()
      expect(antes, `rode scripts/criar-colaboradores-ltcat-existente com LTCAT_IDKEY=${IDKEY}`).toBeGreaterThanOrEqual(50)
      expect(Date.now() - inicio).toBeLessThan(5000)

      const t = Date.now()
      await incluirColaborador(a, m, "Inclusão Com Volume", "Cargo")
      expect(Date.now() - t).toBeLessThan(5000)
      await expect(a.linhasColaborador.last()).toContainText("Inclusão Com Volume")
    })

    // dois cliques com intervalo humano: muito rápido, normal e lento
    for (const ms of [80, 150, 300]) {
      test(`TST1270 - dois cliques em Salvar (${ms} ms) não duplicam o registro`, async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        await a.abrirModalAdicionar()
        await m.preencher("Clique Duplo", "Cargo Duplo")
        await cliqueRapidoDuplo(page, m.botaoSalvar, ms)
        await expect(m.titulo).toHaveCount(0)
        await expect(a.linhasColaborador).toHaveCount(1)
      })

      test(`TST1270 - dois cliques em Salvar e adicionar outro (${ms} ms) não duplicam`, async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        await a.abrirModalAdicionar()
        await m.preencher("Clique Duplo Outro", "Cargo Duplo")
        await cliqueRapidoDuplo(page, m.botaoSalvarEAdicionarOutro, ms)
        await expect(a.linhasColaborador).toHaveCount(1)
        await expect(a.celula("Clique Duplo Outro")).toHaveCount(1)
      })

      test(`TST1278 - dois cliques em Adicionar (${ms} ms) abrem uma modal só`, async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        await cliqueRapidoDuplo(page, a.botaoAdicionar, ms)
        await expect(m.titulo).toBeVisible()
        await expect(page.getByRole("dialog")).toHaveCount(1)
      })
    }

    test("TST1271/TST1272 - permite nome e cargo repetidos", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Nome Repetido", "Cargo Repetido")
      await incluirColaborador(a, m, "Nome Repetido", "Cargo Repetido")
      await expect(a.linhasColaborador).toHaveCount(2)
    })

    test("TST1273 - sem colaboradores o grid mostra Sem registros para listar.", async ({ ltcatColaboradoresPage: a }) => {
      await expect(a.semRegistros).toBeVisible()
      await expect(a.linhasColaborador).toHaveCount(0)
    })

    test("TST1275 - adicionar e remover todos volta ao grid vazio", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Remover 1", "Cargo")
      await incluirColaborador(a, m, "Remover 2", "Cargo")
      await excluirColaborador(page, a, 0)
      await excluirColaborador(page, a, 0)
      await expect(a.semRegistros).toBeVisible()
    })

    // o conteúdo do laudo gerado (docx/pdf via painel Relatórios) ainda não é lido pela automação
    test.fixme("TST1273/TST1274/TST1275 - capítulo Colaboradores aparece no laudo só com ao menos 1 colaborador", async () => {})

    // cria 1 LTCAT novo no ambiente (sem rollback), já com 50 colaboradores
    test("TST1276 - colaboradores permanecem depois de salvar e reabrir o LTCAT", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      test.setTimeout(480000)
      await c.abrirAba("Referências")
      await c.preencherObrigatorios(ltcatValido)
      await c.preencherConfiguracoesObrigatorias()
      await c.abrirAba("Colaboradores")
      await incluirColaboradoresEmLote(a, m, colaboradoresDeCarga(50))
      await incluirColaborador(a, m, "Persistido Após Salvar", "Cargo Persistido")
      await salvarLtcat(c, page)

      await page.reload()
      await c.abrirAba("Colaboradores")
      await expect(a.linhasColaborador).toHaveCount(51)
      await expect(a.linhasColaborador.last()).toContainText("Persistido Após Salvar")
    })

    test("TST1277 - atualizar a página sem salvar perde os dados", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await abrirExistente(page, c, a)
      const antes = await a.linhasColaborador.count()
      await incluirColaborador(a, m, "Some No Reload", "Cargo")
      await page.reload()
      await c.abrirAba("Colaboradores")
      await expect(a.linhasColaborador).toHaveCount(antes)
      await expect(a.celula("Some No Reload")).toHaveCount(0)
    })

    // grava no LTCAT existente e limpa no final (remove os "Concorrência" e salva)
    test("TST1279 - duas abas: a que ficou desatualizada não salva e mostra aviso amarelo", async ({ page, context }) => {
      test.setTimeout(240000)
      const abas = [page, await context.newPage()].map((p) => ({ p, c: new LtcatCadastroPage(p), a: new LtcatColaboradoresPage(p), m: new LtcatColaboradorModal(p) }))
      for (const { p, c, a } of abas) await abrirExistente(p, c, a)
      const [A, B] = abas

      try {
        await incluirColaborador(B.a, B.m, "Concorrência B", "Cargo B")
        await salvarLtcat(B.c, B.p)

        await incluirColaborador(A.a, A.m, "Concorrência A", "Cargo A")
        await A.c.salvar()
        const aviso = A.p.locator("apls-toast").filter({ hasText: MSG_DESATUALIZADO }).first()
        await expect(aviso).toBeVisible()
        await expect(aviso).toContainText("Atenção")
        // o fundo amarelo fica no container do snackbar, pai do apls-toast
        const fundo = await aviso.evaluate((el) => getComputedStyle(el.closest("snack-bar-container")!).backgroundColor)
        expect(fundo, "toast de Atenção deve ser amarelo (#ffc107)").toBe(AMARELO)

        // só a alteração da aba B ficou gravada
        await A.p.reload()
        await A.c.abrirAba("Colaboradores")
        await expect(A.a.celula("Concorrência B")).toHaveCount(1)
        await expect(A.a.celula("Concorrência A")).toHaveCount(0)
      } finally {
        await A.p.goto(URL_EXISTENTE)
        await A.c.abrirAba("Colaboradores")
        await expect(A.a.linhasColaborador.first()).toBeVisible()
        let limpou = false
        for (let i = (await A.a.linhasColaborador.count()) - 1; i >= 0; i--) {
          if (/Concorrência/.test((await A.a.linhasColaborador.nth(i).textContent()) ?? "")) {
            await excluirColaborador(A.p, A.a, i)
            limpou = true
          }
        }
        if (limpou) await salvarLtcat(A.c, A.p)
        await B.p.close()
      }
    })

    // resoluções comuns de notebook (1536x864 = tela 1920x1080 com zoom de 125% do Windows)
    const notebooks = [
      { width: 1280, height: 720 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
    ]
    for (const tela of notebooks) {
      test(`TST1280 - aba e modal cabem numa tela de notebook ${tela.width}x${tela.height}`, async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        await page.setViewportSize(tela)
        await expect(a.orientacao).toBeInViewport()
        await expect(a.botaoAdicionar).toBeInViewport()
        // sem barra de rolagem horizontal na página
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

        await a.abrirModalAdicionar()
        for (const el of [m.titulo, m.colaborador, m.cargo, m.botaoFechar, m.botaoSalvarEAdicionarOutro, m.botaoSalvar]) {
          await expect(el).toBeInViewport({ ratio: 1 }) // inteiro na tela, não só um pedaço
        }
      })
    }

    test("TST1281 - só Salvar tem a cor de destaque; Fechar e Salvar e adicionar outro não", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      const destaque = await corDestaque(page)
      expect(await corDoTexto(a.botaoAdicionar)).toBe(destaque)
      await a.abrirModalAdicionar()
      expect(await corDeFundo(m.botaoSalvar)).toBe(destaque)
      expect(await corDeFundo(m.botaoFechar)).not.toBe(destaque)
      expect(await corDeFundo(m.botaoSalvarEAdicionarOutro)).not.toBe(destaque)
    })

    // comparação com o mockup do chamado é visual/manual
    test.fixme("TST1282 - modal conforme mockup do chamado", async () => {})
  })

  test.describe("Grid de Colaboradores (Listagem + Ações + Regras)", () => {
    test("TST1283 - inserir um colaborador: aparece no grid", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Fulano Único", "Cargo Único")
      await expect(a.linhasColaborador).toHaveCount(1)
      await expect(a.semRegistros).toHaveCount(0)
    })

    test("TST1284 - inserir múltiplos colaboradores: todos listados", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      test.setTimeout(120000)
      const lista = Array.from({ length: 10 }, (_, i) => ({ nome: `Múltiplo ${i + 1}`, cargo: `Cargo ${i + 1}` }))
      await incluirColaboradoresEmLote(a, m, lista)
      expect(await a.valoresColuna("colaborador")).toEqual(lista.map((c) => c.nome))
      expect(await a.valoresColuna("cargo")).toEqual(lista.map((c) => c.cargo))
    })

    // o valor tem que chegar ao grid sem corte, sem trim e sem trocar maiúsculas
    const exatos = [
      { id: "TST1285", titulo: "Colaborador", coluna: "colaborador" as const, valor: "D'Ávila & Cia. <b>ção</b> ñ Ü %$#" },
      { id: "TST1286", titulo: "Cargo", coluna: "cargo" as const, valor: "tÉcNiCo  [SSO] /\\|~^° \"aspas\"" },
    ]
    for (const { id, titulo, coluna, valor } of exatos) {
      test(`${id} - coluna ${titulo} exibe exatamente o valor informado`, async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        const outro = "Valor Simples"
        await incluirColaborador(a, m, coluna === "colaborador" ? valor : outro, coluna === "cargo" ? valor : outro)
        expect(await a.valoresColuna(coluna)).toEqual([valor])
      })
    }

    test("TST1287 - grid sem registros: mensagem central Sem registros para listar.", async ({ page, ltcatColaboradoresPage: a }) => {
      await expect(a.semRegistros).toBeVisible()
      await expect(a.linhasColaborador).toHaveCount(0)
      // mede de novo até a animação da troca de aba terminar
      await expect(async () => {
        const tabela = (await a.tabela.boundingBox())!
        const msg = (await a.semRegistros.boundingBox())!
        expect(Math.abs(tabela.x + tabela.width / 2 - (msg.x + msg.width / 2))).toBeLessThanOrEqual(20)
      }).toPass({ timeout: 5000 })
      await expect(page.locator("apls-toast")).toHaveCount(0)
    })

    test("TST1288 - ordem de inserção: primeiro inserido aparece primeiro", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Zeca Primeiro", "Cargo")
      await incluirColaborador(a, m, "Ana Segunda", "Cargo")
      expect(await a.valoresColuna("colaborador")).toEqual(["Zeca Primeiro", "Ana Segunda"])
    })

    test("TST1289 - 3 colaboradores em sequência mantêm a ordem", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      expect(await a.valoresColuna("colaborador")).toEqual(NOMES)
      expect(await a.valoresColuna("cargo")).toEqual(TRES.map((c) => c.cargo))
    })

    test("TST1290 - editar o colaborador do meio não muda a ordem", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      await abrirEdicaoColaborador(a, m, 1)
      await m.preencher("Ana Editada", "Cargo Editado")
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)
      expect(await a.valoresColuna("colaborador")).toEqual(["Zeca Primeiro", "Ana Editada", "Maria Terceira"])
    })

    test("TST1291 - excluir o colaborador do meio: os demais mantêm a ordem", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      await excluirColaborador(page, a, 1)
      expect(await a.valoresColuna("colaborador")).toEqual(["Zeca Primeiro", "Maria Terceira"])
    })

    test("TST1292 - novo colaborador depois de uma exclusão entra no final", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      await excluirColaborador(page, a, 1)
      await incluirColaborador(a, m, "Bia Depois Da Exclusão", "Cargo D")
      expect(await a.valoresColuna("colaborador")).toEqual(["Zeca Primeiro", "Maria Terceira", "Bia Depois Da Exclusão"])
    })

    test("TST1293 - não existe ação de ordenação nas colunas", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Qualquer", "Cargo")
      for (const coluna of ["colaborador", "cargo"] as const) {
        const cab = a.cabecalho(coluna)
        await expect(cab.locator(".mat-sort-header")).toHaveClass(/mat-sort-header-disabled/)
        await expect(cab.locator(".mat-sort-header")).toHaveAttribute("aria-sort", "none")
        await expect(cab.locator(".mat-sort-header-arrow")).toHaveCount(0)
      }
    })

    test("TST1294 - clicar no cabeçalho não ordena", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      for (const [coluna, texto] of [["colaborador", "Colaborador"], ["cargo", "Cargo"]] as const) {
        // dois cliques: o 1º seria crescente e o 2º decrescente se ordenasse
        for (let i = 0; i < 2; i++) {
          await a.cabecalho(coluna).getByText(texto).click()
          expect(await a.valoresColuna("colaborador")).toEqual(NOMES)
        }
      }
    })
  })

  test.describe("Botão Editar", () => {
    test("TST1295 - botão Editar em todas as linhas", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      for (let i = 0; i < TRES.length; i++) await expect(a.botaoEditar(i)).toBeVisible()
    })

    test("TST1296/TST1297 - Editar abre a modal com os dados salvos", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      for (let i = 0; i < TRES.length; i++) {
        await abrirEdicaoColaborador(a, m, i)
        await expect(m.titulo).toHaveText("Colaboradores")
        await expect(m.colaborador).toHaveValue(TRES[i].nome)
        await expect(m.cargo).toHaveValue(TRES[i].cargo)
        await m.botaoFechar.click()
        await expect(m.titulo).toHaveCount(0)
      }
    })

    test("TST1298 - permite alterar o nome", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Nome Antigo", "Cargo Fixo")
      await abrirEdicaoColaborador(a, m, 0)
      await m.colaborador.fill("Nome Novo")
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)
      expect(await a.valoresColuna("colaborador")).toEqual(["Nome Novo"])
      expect(await a.valoresColuna("cargo")).toEqual(["Cargo Fixo"])
    })

    test("TST1299 - permite alterar o cargo", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Nome Fixo", "Cargo Antigo")
      await abrirEdicaoColaborador(a, m, 0)
      await m.cargo.fill("Cargo Novo")
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)
      expect(await a.valoresColuna("colaborador")).toEqual(["Nome Fixo"])
      expect(await a.valoresColuna("cargo")).toEqual(["Cargo Novo"])
    })

    test("TST1300/TST1301 - salvar edição atualiza o grid e exibe [info_sucesso]", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Antes da Edição", "Cargo Antes")
      await abrirEdicaoColaborador(a, m, 0)
      await m.preencher("Depois da Edição", "Cargo Depois")
      await m.botaoSalvar.click()
      await avisoColaboradores(page, MSG_COLABORADORES.incluido)
      await expect(m.titulo).toHaveCount(0)
      await expect(a.linhasColaborador).toHaveCount(1)
      await expect(a.linhasColaborador.first()).toContainText("Depois da Edição")
      await expect(a.linhasColaborador.first()).toContainText("Cargo Depois")
    })

    test("TST1302 - editar e fechar sem salvar não altera os dados", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Original", "Cargo Original")
      await abrirEdicaoColaborador(a, m, 0)
      await m.preencher("Alterado Sem Salvar", "Cargo Alterado")
      await fecharSemSalvar(page, m)
      expect(await a.valoresColuna("colaborador")).toEqual(["Original"])
      expect(await a.valoresColuna("cargo")).toEqual(["Cargo Original"])
    })

    for (const campo of ["colaborador", "cargo"] as const) {
      test(`TST1303 - edição sem ${campo === "colaborador" ? "Colaborador" : "Cargo"} é bloqueada`, async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        await incluirColaborador(a, m, "Obrigatório Nome", "Obrigatório Cargo")
        await abrirEdicaoColaborador(a, m, 0)
        await m[campo].fill("")
        await m.botaoSalvar.click()
        await avisoColaboradores(page, MSG_COLABORADORES.obrigatorios)
        await expect(m.titulo).toBeVisible()
        await fecharSemSalvar(page, m)
        expect(await a.valoresColuna("colaborador")).toEqual(["Obrigatório Nome"])
        expect(await a.valoresColuna("cargo")).toEqual(["Obrigatório Cargo"])
      })
    }

    test("TST1304 - edição corta os campos em 60 caracteres", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Curto", "Curto")
      await abrirEdicaoColaborador(a, m, 0)
      await m.preencher("N".repeat(70), "C".repeat(70))
      await expect(m.colaborador).toHaveValue("N".repeat(60))
      await expect(m.cargo).toHaveValue("C".repeat(60))
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)
      expect(await a.valoresColuna("colaborador")).toEqual(["N".repeat(60)])
      expect(await a.valoresColuna("cargo")).toEqual(["C".repeat(60)])
    })

    test("TST1305 - editar vários registros em sequência rápida mantém a consistência", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      for (let i = 0; i < TRES.length; i++) {
        await abrirEdicaoColaborador(a, m, i)
        await m.preencher(`Rápido ${i + 1}`, `Cargo Rápido ${i + 1}`)
        await m.botaoSalvar.click()
      }
      await expect(m.titulo).toHaveCount(0)
      expect(await a.valoresColuna("colaborador")).toEqual(["Rápido 1", "Rápido 2", "Rápido 3"])
      expect(await a.valoresColuna("cargo")).toEqual(["Cargo Rápido 1", "Cargo Rápido 2", "Cargo Rápido 3"])
    })

    test("TST1306 - editar e atualizar a página sem salvar descarta a alteração", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await abrirExistente(page, c, a)
      const original = await a.valoresColuna("colaborador")
      await abrirEdicaoColaborador(a, m, 0)
      await m.colaborador.fill("Editado Sem Salvar LTCAT")
      await m.botaoSalvar.click()
      await expect(a.celula("Editado Sem Salvar LTCAT")).toHaveCount(1)
      await page.reload()
      await c.abrirAba("Colaboradores")
      await expect(a.linhasColaborador.first()).toBeVisible()
      expect(await a.valoresColuna("colaborador")).toEqual(original)
    })
  })

  test.describe("Botão Excluir", () => {
    test("TST1307 - botão Excluir em todas as linhas", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      for (let i = 0; i < TRES.length; i++) await expect(a.botaoExcluir(i)).toBeVisible()
    })

    test("TST1308/TST1309 - Excluir abre a confirmação com o texto correto", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Para Excluir", "Cargo")
      await a.botaoExcluir(0).click()
      const popup = popupExclusao(page)
      await expect(popup).toBeVisible()
      await expect(popup).toContainText("Atenção")
      await expect(popup).toContainText("Deseja realmente excluir este item?")
      await expect(popup.getByRole("button", { name: "Fechar" })).toBeVisible()
      await expect(popup.getByRole("button", { name: "Excluir" })).toBeVisible()
    })

    test("TST1310 - botão Excluir da confirmação em destaque", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Para Excluir", "Cargo")
      await a.botaoExcluir(0).click()
      const popup = popupExclusao(page)
      const destaque = await corDestaque(page)
      expect(semAlfa(await corDeFundo(popup.getByRole("button", { name: "Excluir" })))).toBe(destaque)
      expect(semAlfa(await corDeFundo(popup.getByRole("button", { name: "Fechar" })))).not.toBe(destaque)
    })

    test("TST1311 - Fechar na confirmação não exclui", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Não Excluir", "Cargo")
      await a.botaoExcluir(0).click()
      const popup = popupExclusao(page)
      await popup.getByRole("button", { name: "Fechar" }).click()
      await expect(popup).toHaveCount(0)
      await expect(a.linhasColaborador).toHaveCount(1)
      await expect(a.celula("Não Excluir")).toHaveCount(1)
    })

    test("TST1312/TST1313 - confirmar remove o item do grid e exibe [info_excluir]", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      await excluirColaborador(page, a, 0)
      await avisoColaboradores(page, MSG_COLABORADORES.excluido)
      await expect(a.celula("Zeca Primeiro")).toHaveCount(0)
      expect(await a.valoresColuna("colaborador")).toEqual(["Ana Segunda", "Maria Terceira"])
    })

    test("TST1314 - excluir o último item deixa o grid vazio", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Único", "Cargo")
      await excluirColaborador(page, a, 0)
      await expect(a.linhasColaborador).toHaveCount(0)
      await expect(a.semRegistros).toBeVisible()
    })

    test("TST1315 - excluir todos deixa o grid vazio", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      for (let i = 0; i < TRES.length; i++) await excluirColaborador(page, a, 0)
      await expect(a.semRegistros).toBeVisible()
    })

    test("TST1316 - excluir vários em sequência rápida mantém a consistência", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      await incluirColaborador(a, m, "Fica No Grid", "Cargo")
      const popup = popupExclusao(page)
      // sem esperar o grid atualizar entre uma exclusão e outra
      for (let i = 0; i < TRES.length; i++) {
        await a.botaoExcluir(0).click()
        await popup.getByRole("button", { name: "Excluir" }).click()
      }
      await expect(a.linhasColaborador).toHaveCount(1)
      expect(await a.valoresColuna("colaborador")).toEqual(["Fica No Grid"])
    })

    test("TST1317 - excluir e incluir um novo funciona normalmente", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "Excluído", "Cargo")
      await excluirColaborador(page, a, 0)
      await incluirColaborador(a, m, "Novo Depois", "Cargo Novo")
      expect(await a.valoresColuna("colaborador")).toEqual(["Novo Depois"])
    })

    // cria 1 LTCAT novo no ambiente (sem rollback)
    test("TST1318 - item excluído e salvo não volta depois de atualizar a página", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      test.setTimeout(240000)
      await c.abrirAba("Referências")
      await c.preencherObrigatorios(ltcatValido)
      await c.preencherConfiguracoesObrigatorias()
      await c.abrirAba("Colaboradores")
      await incluirColaborador(a, m, "Vai Ser Excluído", "Cargo")
      await incluirColaborador(a, m, "Continua", "Cargo")
      await salvarLtcat(c, page)

      await excluirColaborador(page, a, 0)
      await salvarLtcat(c, page)
      await page.reload()
      await c.abrirAba("Colaboradores")
      await expect(a.linhasColaborador.first()).toBeVisible()
      expect(await a.valoresColuna("colaborador")).toEqual(["Continua"])
    })
  })

  test.describe("Cenários gerais", () => {
    test("TST1319 - inserir, editar e excluir em sequência mantém a consistência", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      await abrirEdicaoColaborador(a, m, 2)
      await m.preencher("Maria Editada", "Cargo B2")
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)
      await excluirColaborador(page, a, 0)
      await incluirColaborador(a, m, "Quarto Incluído", "Cargo D")
      expect(await a.valoresColuna("colaborador")).toEqual(["Ana Segunda", "Maria Editada", "Quarto Incluído"])
      expect(await a.valoresColuna("cargo")).toEqual(["Cargo A", "Cargo B2", "Cargo D"])
    })

    test("TST1320 - permite duplicados (mesmo nome e cargo)", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      for (let i = 0; i < 3; i++) await incluirColaborador(a, m, "Duplicado Igual", "Cargo Igual")
      expect(await a.valoresColuna("colaborador")).toEqual(Array(3).fill("Duplicado Igual"))
      expect(await a.valoresColuna("cargo")).toEqual(Array(3).fill("Cargo Igual"))
    })

    // valores que precisam aparecer no grid como foram digitados
    const exibicao = [
      { id: "TST1321", caso: "espaços extras no meio", nome: "Nome   Com   Espaços", cargo: "Cargo    Largo" },
      { id: "TST1322", caso: "caracteres especiais", nome: "!@#$%&*()-_=+[]{};:'\",.<>/?\\|~^", cargo: "C&A <tag> 50% #1" },
      { id: "TST1323", caso: "acentos", nome: "Ângela Gonçalves Müller Ñúñez", cargo: "Técnica de Segurança Sênior" },
      { id: "TST1324", caso: "nome muito curto", nome: "A", cargo: "B" },
      { id: "TST1325", caso: "cargo com números", nome: "Número No Cargo", cargo: "Técnico 2 - Nível 3 / 2026" },
    ]
    for (const e of exibicao) {
      test(`${e.id} - ${e.caso} exibidos corretamente`, async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
        await incluirColaborador(a, m, e.nome, e.cargo)
        expect(await a.valoresColuna("colaborador")).toEqual([e.nome])
        expect(await a.valoresColuna("cargo")).toEqual([e.cargo])
      })
    }

    test("TST1321 - espaços no início e no fim: grid mostra o texto sem quebrar", async ({ ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirColaborador(a, m, "   Nome Com Bordas   ", "  Cargo Com Bordas  ")
      // a regra de corte das bordas não está na EF: o teste só exige o conteúdo visível intacto
      expect((await a.valoresColuna("colaborador"))[0].trim()).toBe("Nome Com Bordas")
      expect((await a.valoresColuna("cargo"))[0].trim()).toBe("Cargo Com Bordas")
    })

    test("TST1326 - texto colado com quebra de linha vira uma linha só", async ({ page, context, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"])
      await a.abrirModalAdicionar()
      for (const [campo, texto] of [[m.colaborador, "Linha Um\nLinha Dois"], [m.cargo, "Cargo Um\r\nCargo Dois"]] as const) {
        await page.evaluate((t) => navigator.clipboard.writeText(t), texto)
        await campo.focus()
        await page.keyboard.press("Control+V")
      }
      const nome = await m.colaborador.inputValue()
      const cargo = await m.cargo.inputValue()
      expect(nome).not.toMatch(/[\r\n]/)
      expect(cargo).not.toMatch(/[\r\n]/)
      expect(nome).toMatch(/Linha Um\s?Linha Dois/)
      expect(cargo).toMatch(/Cargo Um\s?Cargo Dois/)
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)
      expect(await a.valoresColuna("colaborador")).toEqual([nome])
    })

    test("TST1327 - registros continuam ao navegar entre as abas", async ({ ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      for (const aba of ["Referências", "Configurações", "Anexos", "Conclusão", "Colaboradores"] as const) await c.abrirAba(aba)
      expect(await a.valoresColuna("colaborador")).toEqual(NOMES)
      expect(await a.valoresColuna("cargo")).toEqual(TRES.map((x) => x.cargo))
    })

    test("TST1328 - inserir e atualizar a página sem salvar perde os dados", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      await page.reload()
      await c.titulo.waitFor()
      await c.abrirAba("Colaboradores")
      await expect(a.semRegistros).toBeVisible()
      await expect(a.linhasColaborador).toHaveCount(0)
    })

    // cria 1 LTCAT novo no ambiente (sem rollback)
    test("TST1329 - salvar e reabrir o cadastro pela tela de pesquisa mantém os dados", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      test.setTimeout(240000)
      await c.abrirAba("Referências")
      await c.preencherObrigatorios(ltcatValido)
      await c.preencherConfiguracoesObrigatorias()
      await c.abrirAba("Colaboradores")
      await incluirTres(a, m)
      await salvarLtcat(c, page)
      const urlSalvo = page.url()

      await page.goto(URLS.ltcat) // sai do cadastro de verdade
      await page.goto(urlSalvo)
      await c.titulo.waitFor()
      await c.abrirAba("Colaboradores")
      await expect(a.linhasColaborador).toHaveCount(TRES.length)
      expect(await a.valoresColuna("colaborador")).toEqual(NOMES)
      expect(await a.valoresColuna("cargo")).toEqual(TRES.map((x) => x.cargo))
    })

    test("TST1330 - com muitos registros, abrir, editar e excluir continuam rápidos", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await page.goto(URL_EXISTENTE)
      await c.titulo.waitFor()
      let t = Date.now()
      await c.abrirAba("Colaboradores")
      await expect(a.linhasColaborador.first()).toBeVisible()
      expect(Date.now() - t, "abrir a aba").toBeLessThan(5000)
      const total = await a.linhasColaborador.count()
      expect(total, `rode scripts/criar-colaboradores-ltcat-existente com LTCAT_IDKEY=${IDKEY}`).toBeGreaterThanOrEqual(50)

      // nada é salvo no LTCAT: as alterações ficam só na tela
      t = Date.now()
      await abrirEdicaoColaborador(a, m, total - 1)
      await m.colaborador.fill("Último Editado")
      await m.botaoSalvar.click()
      await expect(a.linhasColaborador.last()).toContainText("Último Editado")
      expect(Date.now() - t, "editar o último").toBeLessThan(5000)

      t = Date.now()
      await excluirColaborador(page, a, total - 1)
      expect(Date.now() - t, "excluir o último").toBeLessThan(5000)
    })

    test("TST1331 - vários cliques em Excluir não geram erro nem excluem a mais", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      const popup = popupExclusao(page)
      // dois cliques no ícone da linha: no máximo uma confirmação e nada excluído
      // (o 2º clique cai no fundo escuro e a confirmação fecha ao clicar fora)
      await cliqueRapidoDuplo(page, a.botaoExcluir(0))
      await page.waitForTimeout(500)
      expect(await popup.count()).toBeLessThanOrEqual(1)
      await expect(a.linhasColaborador).toHaveCount(3)
      if ((await popup.count()) === 0) await a.botaoExcluir(0).click()
      await expect(popup).toHaveCount(1)
      // dois cliques no Excluir da confirmação: só um item sai
      await cliqueRapidoDuplo(page, popup.getByRole("button", { name: "Excluir" }))
      await expect(popup).toHaveCount(0)
      await expect(a.linhasColaborador).toHaveCount(2)
      expect(await a.valoresColuna("colaborador")).toEqual(["Ana Segunda", "Maria Terceira"])
      await expect(page.locator("apls-toast").filter({ hasText: /erro/i })).toHaveCount(0)
    })

    test("TST1332 - clique rápido em Editar e Excluir não corrompe o grid", async ({ page, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      await incluirTres(a, m)
      await a.botaoEditar(1).click({ trial: true }) // espera o grid parar de se mexer
      const editar = (await a.botaoEditar(1).boundingBox())!
      const excluir = (await a.botaoExcluir(1).boundingBox())!
      await page.mouse.click(editar.x + editar.width / 2, editar.y + editar.height / 2)
      await page.waitForTimeout(INTERVALO_CLIQUE_MS)
      await page.mouse.click(excluir.x + excluir.width / 2, excluir.y + excluir.height / 2)

      // seja qual for a janela que abriu, fecha sem confirmar nada
      const popup = popupExclusao(page)
      if (await popup.isVisible()) await popup.getByRole("button", { name: "Fechar" }).click()
      if (await m.titulo.isVisible()) await fecharSemSalvar(page, m)
      await expect(m.titulo).toHaveCount(0)
      await expect(popup).toHaveCount(0)

      expect(await a.valoresColuna("colaborador")).toEqual(NOMES)
      expect(await a.valoresColuna("cargo")).toEqual(TRES.map((x) => x.cargo))
    })

    // grava no LTCAT existente e limpa no final (o "Voltar Navegador" sai e o LTCAT volta ao que era)
    test("TST1333 - excluir, salvar e voltar no navegador não restaura o item", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      test.setTimeout(240000)
      const TEMP = "Voltar Navegador"
      await page.goto(URLS.ltcat)
      await abrirExistente(page, c, a)
      try {
        await incluirColaborador(a, m, TEMP, "Cargo Temporário")
        await salvarLtcat(c, page)
        await excluirColaborador(page, a, (await a.linhasColaborador.count()) - 1)
        await salvarLtcat(c, page)

        await page.goBack()
        await page.goForward()
        await c.titulo.waitFor()
        await c.abrirAba("Colaboradores")
        await expect(a.linhasColaborador.first()).toBeVisible()
        await expect(a.celula(TEMP)).toHaveCount(0)
      } finally {
        await abrirExistente(page, c, a)
        if ((await a.celula(TEMP).count()) > 0) {
          for (let i = (await a.linhasColaborador.count()) - 1; i >= 0; i--) {
            if ((await a.linhasColaborador.nth(i).textContent())?.includes(TEMP)) await excluirColaborador(page, a, i)
          }
          await salvarLtcat(c, page)
        }
      }
    })

    test("TST1334 - grid com 100+ itens (stress) continua respondendo", async ({ page, ltcatCadastroPage: c, ltcatColaboradoresPage: a, ltcatColaboradorModal: m }) => {
      test.setTimeout(480000)
      // LTCAT existente (50+) com mais 50 na tela, sem salvar
      await abrirExistente(page, c, a)
      const antes = await a.linhasColaborador.count()
      await incluirColaboradoresEmLote(a, m, colaboradoresDeCarga(50, "Stress"))
      const total = antes + 50
      await expect(a.linhasColaborador).toHaveCount(total)

      let t = Date.now()
      await a.linhasColaborador.last().scrollIntoViewIfNeeded()
      await expect(a.linhasColaborador.last()).toBeInViewport()
      expect(Date.now() - t, "rolar até o fim").toBeLessThan(3000)

      t = Date.now()
      await incluirColaborador(a, m, "Depois Do Stress", "Cargo")
      expect(Date.now() - t, "incluir com o grid cheio").toBeLessThan(5000)
      await expect(a.linhasColaborador.last()).toContainText("Depois Do Stress")

      t = Date.now()
      await excluirColaborador(page, a, 0)
      expect(Date.now() - t, "excluir com o grid cheio").toBeLessThan(5000)
      await expect(a.linhasColaborador).toHaveCount(total)
    })

    // comparação com o mockup do chamado é visual/manual
    test.fixme("TST1335 - grid, colunas, botões e modais conforme mockup do chamado", async () => {})
  })
})
