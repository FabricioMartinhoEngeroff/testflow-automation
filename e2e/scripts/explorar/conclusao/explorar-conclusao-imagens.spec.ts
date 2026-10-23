// Exploração temporária: quais uploads de imagem a Conclusão aceita (LTCAT novo, nada é salvo)
import { test, expect } from "@support"
import { arquivoDeTeste } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

const casos: [string, string[]][] = [
  ["png grande sozinho", ["imagem_5_15MiB.png"]],
  ["jpg grande + png pequeno", ["imagem_5_15MiB.jpg", "imagem.png"]],
  ["jpg grande + jpeg grande", ["imagem_5_15MiB.jpg", "imagem_5_15MiB.jpeg"]],
  ["3 pequenas", ["imagem.png", "foto_e.jpg", "foto_f.jpeg"]],
]

for (const [nome, arquivos] of casos) {
  test(`imagens: ${nome}`, async ({ login, ltcatCadastroPage: c, ltcatConclusaoPage: co, page }) => {
    test.setTimeout(180000)
    await login.entrar()
    await c.abrir()
    await c.abrirAba("Conclusão")
    await expect(co.editor).toBeVisible()
    const ed = page.locator(".ck-editor__editable:not(.ck-editor__nested-editable)")
    for (const arq of arquivos) {
      // tira a seleção da imagem anterior: cursor no fim, parágrafo novo
      await ed.evaluate((e: any) => { const ck = e.ckeditorInstance; ck.model.change((w: any) => { const root = ck.model.document.getRoot(); const p = w.createElement("paragraph"); w.insert(p, root, "end"); w.setSelection(p, "in") }) })
      await co.ferramenta("Exibir mais itens").click()
      await page.keyboard.press("Escape")
      await page.locator(".ck input[type=file]").first().setInputFiles(arquivoDeTeste(arq))
      await page.waitForTimeout(arq.includes("5_15") ? 12000 : 3000)
      console.log(`${nome} | após ${arq}: imgs ${await ed.locator("img").count()} | contador ${await co.contadorDeTamanho.textContent()} | toasts ${await page.locator("apls-toast").allTextContents()}`)
    }
  })
}
