import type { Page } from "@playwright/test"
import { env } from "../../shared/env"

// nomes dos campos da tela de login centralizados aqui — igual aos helpers
// getHeading/getInput da aula, mas login é o único "elemento" que se repete
// em TODO spec que vamos escrever daqui pra frente (todo cenário começa logando)
// Conferido contra a tela real (apollus/login) em 2026-07-23 — os labels batem
const LABEL_USUARIO = "Usuário"
const LABEL_SENHA = "Senha"
const BOTAO_ENTRAR = "Entrar"

export async function login(page: Page) {
  // PGR_URL guarda só a origem (https://apollus.dev.apollusehs.com.br) — o
  // caminho da tela de login é fixo, por isso vai explícito aqui
  await page.goto("/apollus/login")
  await page.getByLabel(LABEL_USUARIO).fill(env.usuario)
  await page.getByLabel(LABEL_SENHA).fill(env.senha)
  await page.getByRole("button", { name: BOTAO_ENTRAR }).click()
  // Descoberta (2026-07-23): "networkidle" não é confiável aqui — o login
  // pode levar bem mais que alguns segundos (variação real do servidor,
  // chegou a levar ~8s numa investigação), e "networkidle" às vezes resolve
  // numa pausa momentânea de rede antes do redirect de verdade acontecer,
  // devolvendo o controle pro teste enquanto ainda está na tela de login.
  // Esperar a URL sair de "/login" é o sinal real de que autenticou.
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 })
}
