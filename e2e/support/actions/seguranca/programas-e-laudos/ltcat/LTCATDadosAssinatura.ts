import type { Page } from "@playwright/test"

// modal "Dados da assinatura digital" (botão do rodapé, só em LTCAT assinado)
export class LtcatDadosAssinaturaModal {
  constructor(private readonly page: Page) {}

  get modal() {
    return this.page.locator("apollus-ngx-ivy-dados-assinatura")
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Dados da assinatura digital" })
  }

  get alerta() {
    return this.modal.locator(".apls-alerta-content p.apls-gray-7")
  }

  // "Documento", "Assinado por", "Emissor", "Assinado digitalmente em" e "Validade", uma linha cada
  get dados() {
    return this.modal.locator(".apls-alerta-content p.col-12")
  }

  get botaoX() {
    return this.modal.locator(".apls-modal-close-button")
  }

  get botaoFechar() {
    return this.modal.getByRole("button", { name: "Fechar" })
  }

  get botaoAssinarNovamente() {
    return this.modal.getByRole("button", { name: "Assinar novamente" })
  }

  get botaoDownload() {
    return this.modal.getByRole("button", { name: "Download" })
  }
}

// modal "Assinatura digital" (botão Assinar digitalmente): mostra o certificado e pede a senha dele
export class LtcatAssinaturaModal {
  constructor(private readonly page: Page) {}

  get modal() {
    return this.page.locator("apollus-ngx-ivy-modal-assinatura")
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Assinatura digital" })
  }

  get dados() {
    return this.modal.locator(".apls-alerta-content p.col-12")
  }

  get senha() {
    return this.modal.locator("input[type=password]")
  }

  get botaoFechar() {
    return this.modal.getByRole("button", { name: "Fechar" })
  }

  get botaoAssinar() {
    return this.modal.getByRole("button", { name: "Assinar digitalmente" })
  }

  async assinar(senha: string) {
    await this.senha.fill(senha)
    await this.botaoAssinar.click()
  }
}
