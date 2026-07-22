import type { Page } from "@playwright/test"
import { env } from "../../shared/env"

// nomes dos campos da tela de login centralizados aqui — igual aos helpers
// getHeading/getInput da aula, mas login é o único "elemento" que se repete
// em TODO spec que vamos escrever daqui pra frente (todo cenário começa logando)
// TODO: ajustar esses 3 nomes pros campos reais da tela de login do PGR
const LABEL_USUARIO = "Usuário"
const LABEL_SENHA = "Senha"
const BOTAO_ENTRAR = "Entrar"

export async function login(page: Page) {
  await page.goto("/")
  await page.getByLabel(LABEL_USUARIO).fill(env.usuario)
  await page.getByLabel(LABEL_SENHA).fill(env.senha)
  await page.getByRole("button", { name: BOTAO_ENTRAR }).click()
}
