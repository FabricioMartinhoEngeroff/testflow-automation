// DESATIVADO (2026-10-14): testes de permissão pausados para focar nos testes que rodam em paralelo.
// Para reativar, descomente este arquivo e os trechos marcados "PERMISSÕES" em support/index.ts, shared/env.ts, support/urls.ts e __tests__/env.spec.ts.
// // Permissões na pesquisa de LTCAT. O usuário do .env (PGR_USUARIO) edita o perfil de
// // acesso do usuário PGR_USUARIO_PERFIL, que então entra e é verificado.
// // Cada teste altera o perfil real do ambiente e o devolve a "todas as permissões" no fim.
// import { test, expect } from "@support"
// import { PERFIL_USUARIO_TESTE } from "@support/data/perfil"
// import { ltcatValido } from "@support/data/ltcat"
// import { URLS } from "@support/urls"
// import type { Permissoes } from "@support/actions/perfis-de-acesso/gerenciar-perfis/PerfilAcesso"

// const REGIAO = ltcatValido.regiao
// // a EF diz "esse cadastro", mas o sistema exibe "este cadastro" (conferido em 2026-10-14)
// const MSG_SEM_PERMISSAO = "Você não possui permissão para acessar este cadastro."
// const TODAS: Permissoes = { incluir: true, alterar: true, visualizar: true, excluir: true }

// const PERFIS: { nome: string; permissoes: Permissoes }[] = [
//   { nome: "só Incluir", permissoes: { incluir: true } },
//   { nome: "só Alterar", permissoes: { alterar: true } },
//   { nome: "só Visualizar", permissoes: { visualizar: true } },
//   { nome: "só Excluir", permissoes: { excluir: true } },
//   { nome: "todas", permissoes: TODAS },
// ]

// test.describe("LTCAT - Permissões na pesquisa (E2E)", () => {
//   // 2 logins + 2 salvamentos do perfil em cada teste passam dos 60s do projeto
//   test.describe.configure({ timeout: 180_000 })

//   test.beforeEach(async ({ login, perfilAcessoPage }) => {
//     await login.entrar()
//     await perfilAcessoPage.abrir(PERFIL_USUARIO_TESTE)
//   })

//   test.afterEach(async ({ perfilAcessoPage }) => {
//     await perfilAcessoPage.abrir(PERFIL_USUARIO_TESTE)
//     await perfilAcessoPage.definir("LTCAT", TODAS)
//     await perfilAcessoPage.salvar()
//   })

//   test("sem nenhuma permissão no LTCAT, o link direto é bloqueado e redireciona para o Meu Apollus", async ({ perfilAcessoPage, usuarioPerfil }) => {
//     await perfilAcessoPage.definir("LTCAT", {})
//     await perfilAcessoPage.salvar()

//     await usuarioPerfil.entrar()
//     await usuarioPerfil.page.goto(URLS.ltcat)
//     await usuarioPerfil.toast.temTexto(MSG_SEM_PERMISSAO)
//     // o Meu Apollus é a home do app com o dashboard na query (/apollus/?data={"dashboard":...})
//     await expect(usuarioPerfil.page).toHaveURL(/\/apollus\/\?data=.*dashboard/)
//   })

//   for (const { nome, permissoes } of PERFIS) {
//     test.describe(`perfil ${nome}`, () => {
//       test.beforeEach(async ({ perfilAcessoPage, usuarioPerfil }) => {
//         await perfilAcessoPage.definir("LTCAT", permissoes)
//         await perfilAcessoPage.salvar()

//         await usuarioPerfil.entrar()
//         await usuarioPerfil.ltcat.abrir()
//       })

//       test("abre a tela e mostra o botão Novo só com Incluir", async ({ usuarioPerfil }) => {
//         await expect(usuarioPerfil.ltcat.titulo).toBeVisible()
//         if (permissoes.incluir) await expect(usuarioPerfil.ltcat.botaoNovo).toBeVisible()
//         else await expect(usuarioPerfil.ltcat.botaoNovo).toBeHidden()
//       })

//       test("o menu da linha respeita as permissões", async ({ usuarioPerfil }) => {
//         const { ltcat } = usuarioPerfil
//         // BUG REAL (2026-10-14): só com Incluir o menu mostra "Gerar LTCAT" mas não "Visualizar",
//         // e a EF diz que ambos aparecem com INC, ALT ou VIS. Remover este test.fail quando corrigido.
//         test.fail(Boolean(permissoes.incluir && !permissoes.alterar && !permissoes.visualizar && !permissoes.excluir), "Visualizar não aparece só com Incluir")
//         await ltcat.limpar()
//         await ltcat.selecionarOpcao(ltcat.regiao, REGIAO)
//         await ltcat.pesquisar()
//         await ltcat.abrirMenuDaLinha()

//         const veLaudo = Boolean(permissoes.incluir || permissoes.alterar || permissoes.visualizar)
//         const itens = (await ltcat.menuDaLinha.allInnerTexts()).join(" | ")
//         for (const [item, deveAparecer] of [["Visualizar", veLaudo], ["Gerar LTCAT", veLaudo], ["Excluir", Boolean(permissoes.excluir)]] as const) {
//           if (deveAparecer) expect(itens, `menu: ${itens}`).toContain(item)
//           else expect(itens, `menu: ${itens}`).not.toContain(item)
//         }
//       })
//     })
//   }
// })
