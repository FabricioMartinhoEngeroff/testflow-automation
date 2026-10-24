// Permissões do LTCAT (EF "LTCAT GHE" > Permissões) com usuários fixos já logados (projeto "auth").
// Os blocos de leitura usam os LTCATs de Curitiba que já existem; o bloco "registro próprio"
// cria e exclui LTCATs num ano só dele, para não tocar nos demais.
import type { Browser } from "@playwright/test"
import { test, expect } from "@support"
import { sessao, type Usuario } from "@support/usuarios"
import { H1, H2, OUTRA_H1 } from "@support/data/hierarquias"
import { ltcatValido, type DadosLtcat } from "@support/data/ltcat"
import { URLS } from "@support/urls"
import { env, senhaUsuariosQa } from "@shared/env"
import { LtcatPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCAT"
import { LtcatCadastroPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro"

type Permissao = "INC" | "ALT" | "VIS" | "EXC"

// tabela "Ação/Botão x permissão" + EF "Pesquisa LTCAT" (botões da consulta), sem os INC* (só valem logo após criar e salvar)
const MATRIZ = {
  Novo: ["INC"],
  Visualizar: ["ALT", "VIS"],
  "Gerar LTCAT": ["INC", "ALT", "VIS"],
  Revisor: ["INC", "ALT", "VIS", "EXC"],
  Excluir: ["EXC"],
} satisfies Record<string, Permissao[]>

const libera = (acao: keyof typeof MATRIZ, permissoes: Permissao[]) => MATRIZ[acao].some((p) => permissoes.includes(p))

// a mensagem [sem_permissao] da EF; texto conferido em 2026-10-14
const MSG_SEM_PERMISSAO = "Você não possui permissão para acessar este cadastro."

const PERFIS_H1: { usuario: Usuario; permissoes: Permissao[] }[] = [
  { usuario: "QAutomatizador_inc_h1", permissoes: ["INC"] },
  { usuario: "QAutomatizador_alt_h1", permissoes: ["ALT"] },
  { usuario: "QAutomatizador_vis_h1", permissoes: ["VIS"] },
  { usuario: "QAutomatizador_exc_h1", permissoes: ["EXC"] },
  { usuario: "QAutomatizador_todas_h1", permissoes: ["INC", "ALT", "VIS", "EXC"] },
  { usuario: "QAutomatizador_vis_alt_2perfis", permissoes: ["ALT", "VIS"] },
]

// cada cenário que grava usa uma vigência num ano só dele: o filtro Ano acha só o registro do teste.
// O Ano só lista o ano atual ±10 (EF), por isso 2029–2035, que hoje não têm LTCAT em Curitiba
const ltcatDoAno = (ano: number, unidade?: string): DadosLtcat => ({
  ...ltcatValido,
  unidade,
  dataBase: ltcatValido.dataBase,
  vigenciaInicio: `01/02/${ano}`,
  vigenciaFim: `28/02/${ano}`,
  avaliacaoRealizadaEm: `Teste de permissão ${ano}`,
  condicoesOperacionais: `Registro do teste de permissão ${ano}`,
})

// browser.newContext não herda o "use" do config
const novoContexto = (browser: Browser, usuario: Usuario) =>
  browser.newContext({ baseURL: env.baseUrl, locale: "pt-BR", storageState: sessao(usuario) })

const pesquisarCuritiba = async (ltcatPage: LtcatPage) => {
  await ltcatPage.abrir()
  await ltcatPage.filtrarPorRegiao(H1)
  await ltcatPage.pesquisar()
}

async function pesquisarAno(ltcatPage: LtcatPage, ano: number) {
  await ltcatPage.abrir()
  await ltcatPage.filtrarPorRegiao(H1)
  if (!(await ltcatPage.selecionarAno(ano))) return false
  await ltcatPage.pesquisar()
  return true
}

async function criar(cadastro: LtcatCadastroPage, dados: DadosLtcat) {
  await cadastro.preencherObrigatorios(dados)
  await cadastro.preencherConfiguracoesObrigatorias()
  await cadastro.salvar()
  await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
}

// preparar e limpar com o QAutomatizador_todas_h1, em contexto próprio: o usuário do teste
// pode não ter Incluir nem Excluir
async function comoTodas(browser: Browser, acao: (ltcatPage: LtcatPage, cadastro: LtcatCadastroPage) => Promise<void>) {
  const context = await novoContexto(browser, "QAutomatizador_todas_h1")
  const page = await context.newPage()
  try {
    await acao(new LtcatPage(page), new LtcatCadastroPage(page))
  } finally {
    await context.close()
  }
}

async function excluirLinha(ltcatPage: LtcatPage, indice: number) {
  const antes = await ltcatPage.totalDeRegistros()
  await ltcatPage.abrirMenuDaLinha(indice)
  await ltcatPage.itemDoMenu("Excluir").click()
  await ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" }).click()
  await expect.poll(async () => ((await ltcatPage.mensagemSemRegistros.isVisible()) ? 0 : ltcatPage.totalDeRegistros())).toBe(antes - 1)
}

// só apaga o que tem a vigência criada pelo ltcatDoAno (início 01/02/ano), nunca um LTCAT real do mesmo ano
async function excluirTodosDoAno(browser: Browser, ano: number) {
  await comoTodas(browser, async (ltcatPage) => {
    if (!(await pesquisarAno(ltcatPage, ano))) return
    for (let i = 0; i < 5 && !(await ltcatPage.mensagemSemRegistros.isVisible()); i++) {
      const indice = (await ltcatPage.celulas("dataInicio")).indexOf(`01/02/${ano}`)
      if (indice < 0) break
      await excluirLinha(ltcatPage, indice)
    }
  })
}

test.describe("LTCAT - Permissões (E2E)", () => {
  test.describe("sem permissão no LTCAT (Ex. 1)", () => {
    test.use({ storageState: sessao("QAutomatizador_sem_permissao") })

    test("TST002 - acesso pela URL mostra [sem_permissao] e redireciona para o Meu Apollus", async ({ page, toast }) => {
      await page.goto(URLS.ltcat)
      await toast.temTexto(MSG_SEM_PERMISSAO)
      // o Meu Apollus é a home com o dashboard na query (/apollus/?data={"dashboard":...})
      await expect(page).toHaveURL(/\/apollus\/\?data=.*dashboard/)
    })

    test("TST001 - item LTCAT não aparece no menu lateral", async ({ page, menuLateral }) => {
      await page.goto("/apollus/")
      await menuLateral.abrirModulo("seguranca")
      // o perfil tem Gestão de Ocorrências: garante que o painel de Segurança abriu
      await expect(menuLateral.item("Gestão de Ocorrências").first()).toBeVisible()
      await expect(menuLateral.item(/LTCAT/)).toHaveCount(0)
    })
  })

  // qualquer uma das 4 permissões mostra o item, dentro de Segurança > Programas e Laudos
  for (const usuario of ["QAutomatizador_vis_h1", "QAutomatizador_inc_h1", "QAutomatizador_alt_h1", "QAutomatizador_exc_h1"] as const) {
    test.describe(`${usuario} no menu lateral`, () => {
      test.use({ storageState: sessao(usuario) })

      test("TST008 - item LTCAT aparece em Programas e Laudos, com o nome certo, e abre a pesquisa", async ({ page, menuLateral, ltcatPage }) => {
        await page.goto("/apollus/")
        await menuLateral.abrirModulo("seguranca")
        if (!(await menuLateral.item(/LTCAT/).isVisible())) await menuLateral.grupo("Programas e Laudos").click()
        await expect(menuLateral.itemDentroDoGrupo("Programas e Laudos", /LTCAT/)).toBeVisible()
        await expect(menuLateral.item(/LTCAT/)).toHaveText(/LTCAT\s*[–-]\s*Laudo Técnico das Condições Ambientais de Trabalho/)
        await menuLateral.item(/LTCAT/).click()
        await expect(ltcatPage.titulo).toBeVisible()
      })
    })
  }

  for (const { usuario, permissoes } of PERFIS_H1) {
    test.describe(`${usuario} (${permissoes.join("+")} em Curitiba)`, () => {
      test.use({ storageState: sessao(usuario) })

      test.beforeEach(async ({ ltcatPage }) => pesquisarCuritiba(ltcatPage))

      // "Atalho/filtros" da matriz: toda permissão vê e usa os filtros e botões da pesquisa
      test("TST011 (pesquisa) - tela carrega sem erro, com filtros e botões, e a pesquisa traz LTCATs", async ({ ltcatPage, page }) => {
        await expect(ltcatPage.titulo).toBeVisible()
        await expect(page.locator("apls-toast")).toHaveCount(0)
        for (const campo of [ltcatPage.regiao, ltcatPage.unidade, ltcatPage.setor, ltcatPage.ano]) await expect(campo).toBeVisible()
        await expect(ltcatPage.botaoPesquisar).toBeVisible()
        await expect(ltcatPage.botaoRecolherFiltros).toBeVisible()
        expect(await ltcatPage.totalDeRegistros()).toBeGreaterThan(0)
      })

      test("TST040 - Região (H1) oferece só Curitiba", async ({ ltcatPage, page }) => {
        await ltcatPage.regiao.fill("")
        const opcoes = (await ltcatPage.opcoesDe(ltcatPage.regiao)).map((o) => o.trim())
        await page.keyboard.press("Escape")
        expect(opcoes).toEqual([H1])
      })

      test(`TST009/TST010 - botão Novo ${libera("Novo", permissoes) ? "aparece e abre o cadastro" : "não aparece"}`, async ({ ltcatPage, ltcatCadastroPage: cadastro }) => {
        if (!libera("Novo", permissoes)) return await expect(ltcatPage.botaoNovo).toBeHidden()
        await ltcatPage.botaoNovo.click()
        await expect(cadastro.titulo).toBeVisible()
      })

      if (libera("Visualizar", permissoes)) {
        test("TST004 - Visualizar do menu da linha abre o LTCAT", async ({ ltcatPage, ltcatCadastroPage: cadastro, page }) => {
          await ltcatPage.abrirMenuDaLinha()
          await ltcatPage.itemDoMenu("Visualizar").click()
          await expect(cadastro.titulo).toBeVisible()
          await expect(page).toHaveURL(/idkey=\d+/)
        })
      }

      test("TST003/TST004/TST005/TST006/TST007 - menu da linha segue a matriz", async ({ ltcatPage }) => {
        await ltcatPage.abrirMenuDaLinha()
        await expect(ltcatPage.menuDaLinha.first()).toBeVisible()
        const itens = (await ltcatPage.menuDaLinha.allInnerTexts()).join(" | ")
        for (const acao of ["Visualizar", "Gerar LTCAT", "Revisor", "Excluir"] as const) {
          await expect(ltcatPage.itemDoMenu(acao), `menu: ${itens}`).toHaveCount(libera(acao, permissoes) ? 1 : 0)
        }
      })

      test("TST004/TST005 - duplo clique abre o registro só com ALT ou VIS; editar só com ALT", async ({ ltcatPage, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r }) => {
        await ltcatPage.linhas.first().dblclick()
        if (!libera("Visualizar", permissoes)) {
          await expect(ltcatPage.titulo).toBeVisible()
          await expect(cadastro.titulo).toBeHidden()
          return
        }
        await expect(cadastro.titulo).toBeVisible()
        await expect(cadastro.botaoGerarLaudo).toBeVisible()
        // o Salvar de um registro aberto fica desabilitado até alguma alteração (visto com o admin),
        // por isso a edição é conferida pelo campo
        if (permissoes.includes("ALT")) {
          await expect(r.condicoesOperacionais).toBeEditable()
        } else {
          // Ex. 8: só com VIS os campos ficam bloqueados e o Salvar some ou fica desabilitado
          await expect(r.condicoesOperacionais).not.toBeEditable()
          if (await cadastro.botaoSalvar.isVisible()) await expect(cadastro.botaoSalvar).toBeDisabled()
        }
        // Duplicar é INC*; sem Incluir não aparece em registro já existente
        if (!permissoes.includes("INC")) await expect(cadastro.botaoDuplicar).toBeHidden()
      })
    })
  }

  // planilha: INC e EXC não abrem cadastro salvo pela URL; sem INC não abre cadastro novo pela URL
  test.describe("acesso direto pela URL do cadastro", () => {
    let idkey = ""

    test.beforeAll(async ({ browser }) => {
      await comoTodas(browser, async (ltcatPage, cadastro) => {
        await pesquisarCuritiba(ltcatPage)
        await ltcatPage.linhas.first().dblclick()
        await expect(cadastro.titulo).toBeVisible()
        idkey = ltcatPage.urlAtual().match(/idkey=(\d+)/)?.[1] ?? ""
      })
    })

    for (const { usuario, permissoes } of PERFIS_H1) {
      test.describe(usuario, () => {
        test.use({ storageState: sessao(usuario) })

        test(`TST003/TST006 (URL) - cadastro salvo pela URL ${libera("Visualizar", permissoes) ? "abre" : "é bloqueado com [sem_permissao]"}`, async ({ page, ltcatCadastroPage: cadastro, toast }) => {
          expect(idkey, "idkey de um LTCAT de Curitiba").not.toBe("")
          await page.goto(`${URLS.ltcatCadastro}?idkey=${idkey}`)
          if (libera("Visualizar", permissoes)) return await expect(cadastro.titulo).toBeVisible()
          await toast.temTexto(MSG_SEM_PERMISSAO)
          await expect(cadastro.titulo).toBeHidden()
        })

        test(`TST010 (URL) - cadastro novo pela URL ${libera("Novo", permissoes) ? "abre" : "é bloqueado com [sem_permissao]"}`, async ({ page, ltcatCadastroPage: cadastro, toast }) => {
          await page.goto(URLS.ltcatCadastro)
          if (libera("Novo", permissoes)) return await expect(cadastro.titulo).toBeVisible()
          await toast.temTexto(MSG_SEM_PERMISSAO)
          await expect(cadastro.titulo).toBeHidden()
        })
      })
    }
  })

  test.describe("registro próprio (cria e exclui)", () => {
    test.setTimeout(180_000)

    test.describe("QAutomatizador_inc_h1 (Ex. 2)", () => {
      const ANO = 2029
      test.use({ storageState: sessao("QAutomatizador_inc_h1") })
      test.afterEach(async ({ browser }) => excluirTodosDoAno(browser, ANO))

      test("TST006 - cria pelo Novo e, logo após salvar, vê Duplicar e Gerar laudo; depois não abre nem exclui", async ({ ltcatPage, ltcatCadastroPage: cadastro, page }) => {
        await ltcatPage.abrir()
        await ltcatPage.botaoNovo.click()
        await expect(cadastro.titulo).toBeVisible()
        await criar(cadastro, ltcatDoAno(ANO))

        await expect(cadastro.botaoDuplicar).toBeVisible()
        await expect(cadastro.botaoGerarLaudo).toBeVisible()

        expect(await pesquisarAno(ltcatPage, ANO), `ano ${ANO} no filtro`).toBe(true)
        await ltcatPage.abrirMenuDaLinha()
        await expect(ltcatPage.itemDoMenu("Visualizar")).toHaveCount(0)
        await expect(ltcatPage.itemDoMenu("Excluir")).toHaveCount(0)
        await page.keyboard.press("Escape")
        await ltcatPage.linhas.first().dblclick()
        await expect(cadastro.titulo).toBeHidden()
      })
    })

    const EDITAM: { usuario: Usuario; ano: number; unidade?: string }[] = [
      { usuario: "QAutomatizador_alt_h1", ano: 2030 },
      { usuario: "QAutomatizador_alt_h1_h2", ano: 2031, unidade: "711001" },
    ]

    for (const { usuario, ano, unidade } of EDITAM) {
      test.describe(`${usuario} (Ex. 3)`, () => {
        test.use({ storageState: sessao(usuario) })
        test.beforeEach(async ({ browser }) => comoTodas(browser, async (_, cadastro) => {
          await cadastro.abrir()
          await criar(cadastro, ltcatDoAno(ano, unidade))
        }))
        test.afterEach(async ({ browser }) => excluirTodosDoAno(browser, ano))

        test("TST005 - abre o registro, altera e salva; não tem Duplicar", async ({ ltcatPage, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, page }) => {
          expect(await pesquisarAno(ltcatPage, ano), `ano ${ano} no filtro`).toBe(true)
          await ltcatPage.linhas.first().dblclick()
          await expect(cadastro.titulo).toBeVisible()
          await expect(cadastro.botaoDuplicar).toBeHidden()

          await r.condicoesOperacionais.fill(`Alterado pelo ${usuario}`)
          await cadastro.salvar()
          await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
          await page.reload()
          await expect(r.condicoesOperacionais).toHaveValue(`Alterado pelo ${usuario}`)
        })
      })
    }

    test.describe("QAutomatizador_vis_h1 (Ex. 5)", () => {
      const ANO = 2032
      test.use({ storageState: sessao("QAutomatizador_vis_h1") })
      test.beforeEach(async ({ browser }) => comoTodas(browser, async (_, cadastro) => {
        await cadastro.abrir()
        await criar(cadastro, ltcatDoAno(ANO))
      }))
      test.afterEach(async ({ browser }) => excluirTodosDoAno(browser, ANO))

      test("TST004 - abre o registro só para leitura, com Gerar laudo e sem Salvar nem Duplicar", async ({ ltcatPage, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r }) => {
        expect(await pesquisarAno(ltcatPage, ANO), `ano ${ANO} no filtro`).toBe(true)
        await ltcatPage.linhas.first().dblclick()
        await expect(cadastro.titulo).toBeVisible()
        await expect(r.condicoesOperacionais).not.toBeEditable()
        await expect(cadastro.botaoGerarLaudo).toBeVisible()
        await expect(cadastro.botaoDuplicar).toBeHidden()
        if (await cadastro.botaoSalvar.isVisible()) await expect(cadastro.botaoSalvar).toBeDisabled()
      })
    })

    const EXCLUEM: { usuario: Usuario; ano: number; unidade?: string }[] = [
      { usuario: "QAutomatizador_exc_h1", ano: 2033 },
      { usuario: "QAutomatizador_exc_h1_h2", ano: 2034, unidade: "711001" },
    ]

    for (const { usuario, ano, unidade } of EXCLUEM) {
      test.describe(`${usuario} (Ex. 4)`, () => {
        test.use({ storageState: sessao(usuario) })
        test.beforeEach(async ({ browser }) => comoTodas(browser, async (_, cadastro) => {
          await cadastro.abrir()
          await criar(cadastro, ltcatDoAno(ano, unidade))
        }))
        test.afterEach(async ({ browser }) => excluirTodosDoAno(browser, ano))

        test("TST003 - fechar o modal não remove; Excluir remove o registro pela pesquisa", async ({ ltcatPage, toast }) => {
          expect(await pesquisarAno(ltcatPage, ano), `ano ${ano} no filtro`).toBe(true)
          await ltcatPage.abrirMenuDaLinha()
          await ltcatPage.itemDoMenu("Excluir").click()
          await ltcatPage.modalExclusao.getByRole("button", { name: "Fechar" }).click()
          await expect(ltcatPage.modalExclusao).toBeHidden()
          await expect(ltcatPage.linhas.first()).toContainText(`01/02/${ano}`)

          await ltcatPage.abrirMenuDaLinha()
          await ltcatPage.itemDoMenu("Excluir").click()
          await expect(ltcatPage.modalExclusao).toBeVisible()
          await ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" }).click()
          await toast.temTexto(/sucesso/i)
          await expect(ltcatPage.mensagemSemRegistros).toBeVisible()
        })
      })
    }

    test.describe("QAutomatizador_todas_h1", () => {
      const ANO = 2035
      test.use({ storageState: sessao("QAutomatizador_todas_h1") })
      test.afterEach(async ({ browser }) => excluirTodosDoAno(browser, ANO))

      test("TST007 - ciclo completo: cria pelo Novo, abre pela pesquisa, altera, salva e exclui", async ({ ltcatPage, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r, toast }) => {
        await ltcatPage.abrir()
        await ltcatPage.botaoNovo.click()
        await criar(cadastro, ltcatDoAno(ANO))
        await expect(cadastro.botaoDuplicar).toBeVisible()

        expect(await pesquisarAno(ltcatPage, ANO), `ano ${ANO} no filtro`).toBe(true)
        await ltcatPage.linhas.first().dblclick()
        await expect(cadastro.titulo).toBeVisible()
        await r.condicoesOperacionais.fill("Alterado pelo QAutomatizador_todas_h1")
        await cadastro.salvar()
        await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })

        await pesquisarAno(ltcatPage, ANO)
        await ltcatPage.abrirMenuDaLinha()
        await ltcatPage.itemDoMenu("Excluir").click()
        await ltcatPage.modalExclusao.getByRole("button", { name: "Excluir" }).click()
        await toast.temTexto(/sucesso/i)
        await expect(ltcatPage.mensagemSemRegistros).toBeVisible()
      })
    })
  })

  // planilha "Campo - hierarquia 1/2": o que a permissão muda nos filtros
  test.describe("hierarquias conforme a permissão", () => {
    // EF H1: "permissão para apenas uma unidade: deve exibir a unidade de permissão do usuário"
    for (const usuario of ["QAutomatizador_vis_h1", "QAutomatizador_vis_h1_h2"] as const) {
      test.describe(usuario, () => {
        test.use({ storageState: sessao(usuario) })

        test("TST040 - a Região já vem preenchida com Curitiba (única unidade com permissão)", async ({ ltcatPage }) => {
          await ltcatPage.abrir()
          await expect(ltcatPage.regiao).toHaveValue(H1)
        })
      })
    }

    test("TST056 - dois usuários ao mesmo tempo veem só as Unidades da própria permissão", async ({ browser }) => {
      const abrir = async (usuario: Usuario) => {
        const context = await novoContexto(browser, usuario)
        const ltcatPage = new LtcatPage(await context.newPage())
        await ltcatPage.abrir()
        await ltcatPage.filtrarPorRegiao(H1)
        return { context, ltcatPage }
      }
      const [h1, h1h2] = await Promise.all([abrir("QAutomatizador_vis_h1"), abrir("QAutomatizador_vis_h1_h2")])
      try {
        const [unidadesH1, unidadesH2] = await Promise.all([h1.ltcatPage.opcoesDe(h1.ltcatPage.unidade), h1h2.ltcatPage.opcoesDe(h1h2.ltcatPage.unidade)])
        expect(unidadesH1.length, "Curitiba inteira vê várias unidades").toBeGreaterThan(1)
        expect(unidadesH2.length).toBeGreaterThan(0)
        for (const u of unidadesH2) expect(u).toMatch(H2)
      } finally {
        await Promise.all([h1.context.close(), h1h2.context.close()])
      }
    })

    // sessão nova (sem .auth): entra com um usuário, filtra, sai e entra com outro no mesmo navegador
    test.describe("troca de usuário no mesmo navegador", () => {
      test.use({ storageState: { cookies: [], origins: [] } })

      test("TST056 (troca de usuário) - o filtro de um usuário não aparece para o próximo", async ({ login, ltcatPage, page }) => {
        const ano = String(new Date().getFullYear())
        await login.entrar({ usuario: "QAutomatizador_vis_h1", senha: senhaUsuariosQa() })
        await ltcatPage.abrir()
        await ltcatPage.filtrarPorRegiao(H1)
        await ltcatPage.selecionarOpcao(ltcatPage.ano, ano)
        await ltcatPage.pesquisar()

        await login.sair()
        await login.entrar({ usuario: "QAutomatizador_alt_h1", senha: senhaUsuariosQa() })
        await ltcatPage.abrir()
        expect(await ltcatPage.anoSelecionado(), "o Ano escolhido pelo outro usuário").toBe("")
      })
    })

    test.fixme("TST060 - usuário com permissão em várias H2 da mesma H1 vê todas elas na Unidade", async () => {
      // falta um usuário com 2+ unidades de Curitiba (ex.: Fábrica Curitiba e ADM Curitiba)
    })
    test.fixme("TST088 - perder a permissão de uma H2 durante a sessão tira o acesso depois de recarregar/novo login", async () => {
      // exige alterar o perfil durante o teste; os testes de permissão usam perfis fixos
    })
  })

  // depende dos LTCATs de Curitiba já cadastrados: sem unidade, Fábrica Curitiba e outras unidades
  test.describe("abrangência por hierarquia", () => {
    const H1_INTEIRA: Usuario[] = ["QAutomatizador_vis_h1", "QAutomatizador_vis_h1_mais_h1_h2"]
    const SO_H2: Usuario[] = ["QAutomatizador_vis_h1_h2", "QAutomatizador_alt_h1_h2", "QAutomatizador_exc_h1_h2"]

    for (const usuario of H1_INTEIRA) {
      test.describe(usuario, () => {
        test.use({ storageState: sessao(usuario) })

        test("TST039 - vê LTCATs de Curitiba com e sem unidade", async ({ ltcatPage }) => {
          await pesquisarCuritiba(ltcatPage)
          const unidades = await ltcatPage.celulasDeTodasAsPaginas("unidade")
          expect(unidades.some((u) => !u.trim()), "algum LTCAT sem unidade").toBe(true)
          expect(unidades.some((u) => u.trim() && !H2.test(u)), "algum LTCAT de outra unidade").toBe(true)
        })
      })
    }

    for (const usuario of SO_H2) {
      test.describe(usuario, () => {
        test.use({ storageState: sessao(usuario) })

        test("TST062 - Unidade (H2) oferece só a Fábrica Curitiba", async ({ ltcatPage, page }) => {
          await ltcatPage.abrir()
          await ltcatPage.filtrarPorRegiao(H1)
          const opcoes = await ltcatPage.opcoesDe(ltcatPage.unidade)
          await page.keyboard.press("Escape")
          expect(opcoes.length).toBeGreaterThan(0)
          for (const o of opcoes) expect(o).toMatch(H2)
        })

        test("TST062 (pesquisa) - vê só LTCATs da Fábrica Curitiba", async ({ ltcatPage }) => {
          await pesquisarCuritiba(ltcatPage)
          const unidades = await ltcatPage.celulasDeTodasAsPaginas("unidade")
          expect(unidades.length).toBeGreaterThan(0)
          for (const u of unidades) expect(u).toMatch(H2)
        })
      })
    }
  })

  test.describe("vários perfis somados (Ex. 6, 7 e 8)", () => {
    test.skip(!OUTRA_H1, "defina OUTRA_H1 em support/data/hierarquias.ts")

    test.describe("QAutomatizador_multiperfil (Ex. 6)", () => {
      test.use({ storageState: sessao("QAutomatizador_multiperfil") })

      for (const [regiao, excluiAqui] of [[H1, false], [OUTRA_H1, true]] as const) {
        test(`TST041 - em ${regiao} o menu ${excluiAqui ? "tem" : "não tem"} Excluir`, async ({ ltcatPage }) => {
          await ltcatPage.abrir()
          await expect(ltcatPage.botaoNovo).toBeVisible()
          await ltcatPage.filtrarPorRegiao(regiao)
          await ltcatPage.pesquisar()
          await ltcatPage.abrirMenuDaLinha()
          await expect(ltcatPage.itemDoMenu("Visualizar")).toBeVisible()
          await expect(ltcatPage.itemDoMenu("Excluir")).toHaveCount(excluiAqui ? 1 : 0)
        })
      }
    })

    test.describe("QAutomatizador_H1_H2 (Ex. 7)", () => {
      test.use({ storageState: sessao("QAutomatizador_H1_H2") })

      test("TST062 (excluir) - em Curitiba vê e exclui só LTCATs da Fábrica Curitiba", async ({ ltcatPage }) => {
        await pesquisarCuritiba(ltcatPage)
        for (const u of await ltcatPage.celulasDeTodasAsPaginas("unidade")) expect(u).toMatch(H2)
        await ltcatPage.abrirMenuDaLinha()
        await expect(ltcatPage.itemDoMenu("Excluir")).toBeVisible()
      })
    })

    test.describe("QAutomatizador_multiunidade (Ex. 8)", () => {
      test.use({ storageState: sessao("QAutomatizador_multiunidade") })

      test("TST004 (multiunidade) - LTCAT de Curitiba (só VIS) abre com os campos bloqueados", async ({ ltcatPage, ltcatCadastroPage: cadastro, ltcatReferenciasPage: r }) => {
        await pesquisarCuritiba(ltcatPage)
        await ltcatPage.linhas.first().dblclick()
        await expect(cadastro.titulo).toBeVisible()
        await expect(r.condicoesOperacionais).not.toBeEditable()
        await expect(cadastro.botaoVoltar).toBeEnabled()
      })

      test.fixme("TST041 (ALT) - com ALT em duas H1, a Região só oferece essas duas", async () => {
        // falta mapear a TERCEIRA_H1
      })
    })
  })

  // TST1405 comentado: permissão já é coberta por outra suíte de permissões
  // // EF: "Dados da assinatura e download: INC*, ALT, VIS". Precisa de um LTCAT de Curitiba assinado (ver tela-cadastro-botoes.spec.ts)
  // test.describe("Dados da assinatura digital", () => {
  //   const idkey = process.env.LTCAT_ASSINADO_IDKEY
  //   test.skip(!idkey, "defina LTCAT_ASSINADO_IDKEY com um LTCAT de Curitiba assinado digitalmente")

  //   for (const usuario of ["QAutomatizador_vis_h1", "QAutomatizador_alt_h1"] as const) {
  //     test.describe(usuario, () => {
  //       test.use({ storageState: sessao(usuario) })

  //       test("TST1405 - vê o botão e abre os dados da assinatura", async ({ page, ltcatCadastroPage: cadastro, ltcatDadosAssinaturaModal: m }) => {
  //         await page.goto(`${URLS.ltcatCadastro}?idkey=${idkey}`)
  //         await expect(cadastro.botaoDadosAssinatura).toBeVisible()
  //         await cadastro.botaoDadosAssinatura.click()
  //         await expect(m.titulo).toBeVisible()
  //         await expect(m.botaoDownload).toBeVisible()
  //       })
  //     })
  //   }

  //   for (const usuario of ["QAutomatizador_inc_h1", "QAutomatizador_exc_h1"] as const) {
  //     test.describe(usuario, () => {
  //       test.use({ storageState: sessao(usuario) })

  //       test("TST1405 - sem VIS/ALT não abre o LTCAT assinado, então não chega ao botão", async ({ page, ltcatCadastroPage: cadastro, toast }) => {
  //         await page.goto(`${URLS.ltcatCadastro}?idkey=${idkey}`)
  //         await toast.temTexto(MSG_SEM_PERMISSAO)
  //         await expect(cadastro.botaoDadosAssinatura).toBeHidden()
  //       })
  //     })
  //   }
  // })

  test.describe("pendências", () => {
    test.fixme("SEM-ID - Assinatura digital (Assinar: INC*, ALT; Dados da assinatura e download: INC*, ALT, VIS)", async () => {
      // fica para a suíte de assinatura
    })
    test.fixme("SEM-ID - Configurações gerais: ALT e VIS", async () => {
      // a EF não diz o que cada uma muda na tela
    })
  })
})
