// Exploração: o que cada usuário QAutomatizador_* vê no menu de Segurança e ao abrir o LTCAT pela URL
// (exc_h1 e todas_h1 caíam no Meu Apollus; sem_permissao não mostrava Gestão de Ocorrências).
import { test } from "@support"
import { sessao, type Usuario } from "@support/usuarios"
import { URLS } from "@support/urls"

for (const usuario of ["QAutomatizador_sem_permissao", "QAutomatizador_exc_h1", "QAutomatizador_todas_h1", "QAutomatizador_vis_h1"] as Usuario[]) {
  test.describe(usuario, () => {
    test.use({ storageState: sessao(usuario) })

    test(`explorar menu e LTCAT de ${usuario}`, async ({ page, menuLateral }) => {
      await page.goto("/apollus/")
      await page.waitForTimeout(3000)
      console.log(usuario, "| módulos:", await page.locator("apls-nav-item").evaluateAll((els) => els.map((e) => e.getAttribute("path"))))
      if (await menuLateral.modulo("seguranca").count()) {
        await menuLateral.abrirModulo("seguranca")
        await page.waitForTimeout(2000)
        console.log(usuario, "| painel Segurança:", (await page.locator("apls-sub-nav-item").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()).join(" || "))
      }
      await page.goto(URLS.ltcat)
      await page.waitForTimeout(4000)
      console.log(usuario, "| LTCAT pela URL ->", page.url(), "| toasts:", await page.locator("apls-toast").allInnerTexts())
    })
  })
}
