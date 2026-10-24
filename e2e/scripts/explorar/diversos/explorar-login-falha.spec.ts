// Exploração temporária: resposta do servidor no login quando a tela não sai de /login.
import { test } from "@support"

test("explorar falha de login", async ({ login, page }) => {
  page.on("response", async (r) => {
    if (!["xhr", "fetch"].includes(r.request().resourceType())) return
    console.log(r.status(), r.request().method(), r.url().replace(/^https:\/\/[^/]+/, "").slice(0, 120), (await r.text().catch(() => "")).slice(0, 200))
  })
  await login.entrar().catch((e) => console.log("ERRO:", String(e).slice(0, 120)))
  console.log("toasts:", await page.locator("apls-toast, snack-bar-container, mat-error").allInnerTexts())
})
