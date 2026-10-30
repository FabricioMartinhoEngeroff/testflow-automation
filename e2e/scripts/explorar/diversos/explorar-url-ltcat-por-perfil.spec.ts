// Exploração: o que cada usuário QAutomatizador_* com login vê ao abrir a pesquisa do LTCAT direto pela URL
// (tela, toast ou redirecionamento). Print em test-results/.
import { test } from "@support"
import { USUARIOS, sessao, temCredencial, type Usuario } from "@support/usuarios"
import { URLS } from "@support/urls"

for (const usuario of (Object.keys(USUARIOS) as Usuario[]).filter(temCredencial)) {
  test.describe(usuario, () => {
    test.use({ storageState: sessao(usuario) })

    test(`URL do LTCAT com ${usuario}`, async ({ page }, info) => {
      const toasts: string[] = []
      page.on("framenavigated", (f) => f === page.mainFrame() && console.log(usuario, "| navegou ->", f.url()))
      await page.goto(URLS.ltcat)
      // toast some em poucos segundos: coleta enquanto espera a tela assentar
      for (let i = 0; i < 8; i++) {
        toasts.push(...(await page.locator("apls-toast").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()))
        await page.waitForTimeout(1000)
      }
      const titulo = (await page.locator("h1, h2, .page-title, apls-page-header").allInnerTexts()).map((t) => t.trim()).filter(Boolean)
      console.log(usuario, "| final:", page.url(), "| toasts:", [...new Set(toasts)].filter(Boolean), "| títulos:", titulo.slice(0, 3))
      await page.screenshot({ path: info.outputPath(`${usuario}.png`) })
    })
  })
}
