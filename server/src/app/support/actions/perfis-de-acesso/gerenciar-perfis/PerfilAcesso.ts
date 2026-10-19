// DESATIVADO (2026-10-14): testes de permissão pausados para focar nos testes que rodam em paralelo.
// Para reativar, descomente este arquivo e os trechos marcados "PERMISSÕES" em support/index.ts, shared/env.ts, support/urls.ts e __tests__/app/shared/env.spec.ts.
// import { expect, type Page } from "@playwright/test"
// import { URLS } from "../urls"

// export type Permissoes = { incluir?: boolean; alterar?: boolean; visualizar?: boolean; excluir?: boolean }

// // colunas da matriz "Programas e laudos" (o ngrid usa mat-column-permissao_N)
// const COLUNAS = { todos: "todos", incluir: "permissao_1", alterar: "permissao_2", visualizar: "permissao_3", excluir: "permissao_4" } as const

// export class PerfilAcessoPage {
//   constructor(private readonly page: Page) {}

//   get abaProgramasELaudos() {
//     return this.page.getByRole("tab", { name: /Programas e laudos/ })
//   }

//   get botaoSalvar() {
//     return this.page.getByRole("button", { name: "Salvar", exact: true })
//   }

//   // a 1ª tabela da aba é "Programas e laudos"; a 2ª é "Configurações gerais"
//   private checkbox(programa: string, coluna: keyof typeof COLUNAS) {
//     return this.page
//       .locator("table")
//       .first()
//       .locator("tbody tr", { hasText: programa })
//       .locator(`td.mat-column-${COLUNAS[coluna]} mat-checkbox`)
//   }

//   async abrir(idkey: number) {
//     await this.page.goto(`${URLS.perfilAcessoCadastro}?idkey=${idkey}`)
//     await this.abaProgramasELaudos.click()
//   }

//   async estaMarcada(programa: string, coluna: keyof typeof COLUNAS) {
//     const classes = (await this.checkbox(programa, coluna).getAttribute("class")) ?? ""
//     return classes.includes("mat-checkbox-checked")
//   }

//   // o input real fica escondido atrás do componente: o clique vai no <label>
//   // As permissões não informadas ficam desmarcadas — não há dependência entre elas
//   async definir(programa: string, permissoes: Permissoes) {
//     for (const coluna of ["incluir", "alterar", "visualizar", "excluir"] as const) {
//       const desejada = permissoes[coluna] ?? false
//       if ((await this.estaMarcada(programa, coluna)) !== desejada) {
//         await this.checkbox(programa, coluna).locator("label").click()
//       }
//     }
//   }

//   // o Salvar só habilita quando algo mudou; sem mudança não há o que salvar
//   async salvar() {
//     if (await this.botaoSalvar.isDisabled()) return
//     await this.botaoSalvar.click()
//     await expect(this.page.getByText("Registro salvo com sucesso")).toBeVisible()
//   }
// }
