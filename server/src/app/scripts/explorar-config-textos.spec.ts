// Script de apoio: lista rótulos e helps da aba Configurações do LTCAT para conferir com a EF 5.3.
// Rodar com: npx playwright test --project=scripts explorar-config-textos
import { test } from "../support"
import { ltcatValido } from "../support/data/ltcat"

test("textos da aba Configurações", async ({ login, ltcatCadastroPage: cadastro, page }) => {
  await login.entrar()
  await cadastro.abrir()
  await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
  await cadastro.abrirAba("Configurações")
  const aba = page.locator("apollus-ngx-ivy-ltcat-aba-configuracoes")
  console.log("TEXTO:\n" + (await aba.innerText()))
  const icones = aba.locator("mat-icon", { hasText: "help_outline" })
  for (let i = 0; i < (await icones.count()); i++) {
    await icones.nth(i).hover()
    const tip = page.locator("mat-tooltip-component")
    await tip.waitFor({ timeout: 3000 }).catch(() => {})
    const dono = await icones.nth(i).evaluate((e) => e.closest("mat-checkbox, mat-radio-button, div")?.textContent?.replace("help_outline", "").trim())
    console.log(`HELP[${dono}]:`, (await tip.allInnerTexts()).join(" | "))
    await page.mouse.move(0, 0)
    await tip.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {})
  }
})
