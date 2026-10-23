import { expect, type Page } from "@playwright/test"

type FerramentaEditor =
  | "Desfazer"
  | "Refazer"
  | "Negrito"
  | "Itálico"
  | "Sublinhado"
  | "Tachado"
  | "Subscrito"
  | "Sobrescrito"
  | "Alinhamento do texto"
  | "Aumentar recuo"
  | "Diminuir recuo"
  | "Lista com marcadores"
  | "Lista numerada"
  | "Fonte"
  | "Tamanho da fonte"
  | "Cor da Fonte"
  | "Link"
  | "Exibir mais itens"

// aba "Conclusão" do cadastro de LTCAT — editor de texto rico (CKEditor)
export class LtcatConclusaoPage {
  constructor(private readonly page: Page) {}

  private get aba() {
    return this.page.getByRole("tabpanel", { name: "Conclusão" })
  }

  get barraDeFerramentas() {
    return this.aba.getByRole("toolbar", { name: "Ferramentas do Editor" })
  }

  ferramenta(nome: FerramentaEditor) {
    return this.barraDeFerramentas.getByRole("button", { name: nome, exact: true })
  }

  // a área editável do CKEditor é um [contenteditable], não um textarea
  get editor() {
    return this.aba.getByRole("textbox", { name: /Editor de Texto Valioso/ })
  }

  get contadorDeTamanho() {
    return this.aba.getByText(/MB de 10 MB/)
  }

  // Descoberta (SPEC PGR): page.keyboard.type() trava nesse editor,
  // locator.pressSequentially() funciona
  async digitar(texto: string) {
    await this.editor.click()
    await this.editor.pressSequentially(texto)
  }

  // o editor principal; tabelas coladas criam outros .ck-editor__editable dentro dele
  get areaEditavel() {
    return this.page.locator(".ck-editor__editable:not(.ck-editor__nested-editable)")
  }

  get placeholder() {
    return this.areaEditavel.locator("p").first()
  }

  get imagens() {
    return this.areaEditavel.locator("img")
  }

  // HTML que vai para o banco (o mesmo que o editor entrega ao formulário)
  conteudo() {
    return this.areaEditavel.evaluate((e: any) => e.ckeditorInstance.getData() as string)
  }

  // Com conteúdo grande o editor só passa o valor ao formulário quando perde o foco
  // (tooltip do contador: "as alterações serão sincronizadas somente quando o foco deixar o editor"),
  // e setData sozinho não marca o formulário como alterado. Troca pela API, digita e apaga um
  // caractere e sai do editor trocando de aba.
  async definirConteudo(html: string, trocarAba: (nome: "Referências" | "Conclusão") => Promise<void>) {
    await this.areaEditavel.evaluate((e: any, h) => e.ckeditorInstance.setData(h), html)
    await this.editor.click()
    await this.page.keyboard.press("Control+End")
    await this.page.keyboard.type("x")
    await this.page.keyboard.press("Backspace")
    await trocarAba("Referências")
    await trocarAba("Conclusão")
  }

  // cursor num parágrafo novo no fim: com uma imagem selecionada, o próximo upload a substitui
  async cursorNoFim() {
    await this.areaEditavel.evaluate((e: any) => {
      const ck = e.ckeditorInstance
      ck.model.change((w: any) => {
        const p = w.createElement("paragraph")
        w.insert(p, ck.model.document.getRoot(), "end")
        w.setSelection(p, "in")
      })
    })
  }

  // botão "Carregar imagem do computador" (fica em "Exibir mais itens"; o input só existe depois de abrir o menu)
  async inserirImagem(arquivo: string) {
    const antes = await this.imagens.count()
    await this.cursorNoFim()
    await this.ferramenta("Exibir mais itens").click()
    await this.page.keyboard.press("Escape")
    await this.page.locator(".ck input[type=file]").first().setInputFiles(arquivo)
    await expect(this.imagens).toHaveCount(antes + 1, { timeout: 30000 })
  }

  // colagem como vem do Word/navegador: evento paste com text/html
  async colarHtml(html: string, texto = "") {
    await this.editor.click()
    await this.areaEditavel.evaluate(
      (el, [h, t]) => {
        const dt = new DataTransfer()
        dt.setData("text/html", h)
        dt.setData("text/plain", t)
        el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }))
      },
      [html, texto],
    )
  }

  // valor em MB mostrado no contador ("6.87 MB de 10 MB")
  async megabytes() {
    const texto = (await this.contadorDeTamanho.textContent()) ?? ""
    return Number(texto.trim().split(" ")[0])
  }
}
