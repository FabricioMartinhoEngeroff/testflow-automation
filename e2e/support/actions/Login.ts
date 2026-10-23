import { expect, type Page } from "@playwright/test"
import { URLS } from "../urls"
import { env } from "@shared/env"

export class LoginPage {
  constructor(private readonly page: Page) {}

  // Conferido contra a tela real (apollus/login) — os labels batem
  private get campoUsuario() {
    return this.page.getByLabel("Usuário")
  }

  private get campoSenha() {
    return this.page.getByLabel("Senha")
  }

  private get botaoEntrar() {
    return this.page.getByRole("button", { name: "Entrar" })
  }

  async visitar() {
    // PGR_URL guarda só a origem; o caminho do login é fixo
    await this.page.goto(URLS.login)
    await expect(this.campoUsuario).toBeVisible()
  }

  async enviarFormulario(usuario: string, senha: string) {
    await this.campoUsuario.fill(usuario)
    await this.campoSenha.fill(senha)
    await this.botaoEntrar.click()
  }

  // Descoberta (2026-07-23): "networkidle" não é confiável — o login chega a
  // levar ~8s e networkidle resolve numa pausa de rede antes do redirect.
  // Esperar a URL sair de "/login" é o sinal real de que autenticou.
  async estaLogado() {
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 })
    await expect(this.page.getByText(/seja bem-vindo/)).toBeVisible()
  }

  // atalho do "do()" do curso: visita, envia as credenciais (do .env por padrão) e confirma
  async entrar(credenciais = { usuario: env.usuario, senha: env.senha }) {
    await this.visitar()
    await this.enviarFormulario(credenciais.usuario, credenciais.senha)
    await this.estaLogado()
  }
}
