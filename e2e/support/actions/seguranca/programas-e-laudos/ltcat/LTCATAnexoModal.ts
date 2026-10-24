import { expect, type Page } from "@playwright/test"
import { tooltipDe } from "@support/utils/material"

const TEMPO_UPLOAD_MS = Number(process.env.UPLOAD_MS ?? 2500)

// modal "Adicionar anexo" (aba Anexos)
export class LtcatAnexoModal {
  constructor(private readonly page: Page) {}

  private get modal() {
    return this.page.getByRole("dialog")
  }

  get titulo() {
    return this.modal.getByRole("heading", { name: "Adicionar anexo" })
  }

  // a mesma modal abre como "Visualizar anexo" ao editar uma linha do grid
  get tituloEdicao() {
    return this.modal.getByRole("heading", { name: "Visualizar anexo" })
  }

  get campoArquivo() {
    return this.modal.locator("apls-file-input")
  }

  // ícone "?" do rótulo "Anexo"; o texto do help fica num tooltip (aria-describedby)
  // caixas visíveis (tracejado do arquivo e contorno da descrição), usadas pra conferir alinhamento
  get caixaArquivo() {
    return this.campoArquivo.locator(".files-container")
  }

  get caixaDescricao() {
    return this.modal.locator("apls-input .mat-form-field-outline").first()
  }

  get helpArquivo() {
    return this.campoArquivo.locator("mat-icon.help")
  }

  // ícone "?" no canto do campo Descrição/título
  get helpDescricao() {
    return this.modal.locator("apls-input mat-icon", { hasText: "help_outline" })
  }

  // tooltip do Material aberto na tela (só existe enquanto o mouse está sobre o elemento)
  get tooltipVisivel() {
    return this.page.locator(".mat-tooltip")
  }

  async textoDoHelpArquivo() {
    return (await (await tooltipDe(this.helpArquivo)).textContent())?.trim()
  }

  get areaDeArquivo() {
    return this.modal.getByText("Arraste e solte o arquivo aqui ou clique para pesquisar")
  }

  // input type=file escondido atrás da área de arraste
  get inputArquivo() {
    return this.modal.locator('input[type="file"]')
  }

  get descricao() {
    return this.modal.getByRole("textbox", { name: "Descrição/título" })
  }

  get botaoFechar() {
    return this.modal.getByRole("button", { name: "Fechar" })
  }

  get botaoSalvarEAdicionarOutro() {
    return this.modal.getByRole("button", { name: "Salvar e adicionar outro" })
  }

  get botaoSalvar() {
    return this.modal.getByRole("button", { name: "Salvar", exact: true })
  }

  // nome do arquivo exibido no campo depois do upload (o servidor acrescenta um sufixo aleatório)
  get nomeDoArquivo() {
    return this.campoArquivo.locator("mat-label")
  }

  // "x" ao lado do nome do arquivo anexado (diferente do "close" que fecha a modal)
  get botaoLimparArquivo() {
    return this.campoArquivo.locator("mat-icon", { hasText: "clear" })
  }

  // O upload demora a terminar: o nome aparece no campo antes de o sistema liberar o Salvar, e clicar antes disso
  // não faz nada (e fechar antes não conta como alteração). Por isso, depois de um arquivo aceito, espera o botão
  // habilitar e dá um tempo extra (UPLOAD_MS, padrão 2500). Arquivo recusado volta assim que o aviso aparece.
  async anexar(caminhoArquivo: string | { name: string; mimeType: string; buffer: Buffer }) {
    await this.inputArquivo.setInputFiles(caminhoArquivo)
    const aviso = this.page.locator("apls-toast").filter({ hasText: "Atenção" })
    const limite = Date.now() + 8000
    while (Date.now() < limite) {
      if (!(await this.areaDeArquivo.isVisible().catch(() => true))) {
        await expect(this.botaoSalvar).toBeEnabled()
        await this.page.waitForTimeout(TEMPO_UPLOAD_MS)
        return
      }
      if ((await aviso.count()) > 0) return // recusado: nada a esperar
      await this.page.waitForTimeout(100)
    }
  }
}
