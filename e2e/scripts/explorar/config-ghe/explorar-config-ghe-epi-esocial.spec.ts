// Script de apoio: lê na aba EPC/EPI do GRO o radio "A opção 'Enviar eSocial' para os EPIs deverá estar", que as versões antigas
// do teste 11 alteravam por engano (a action não abria a aba Gerais). Só lê, não grava.
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-epi-esocial
import { test } from "@support"

test("Enviar eSocial dos EPIs", async ({ login, configGheAbaGeraisPage: gro, page }) => {
  await login.entrar()
  await gro.abrir()
  await page.getByRole("tab", { name: "EPC/EPI" }).click()
  const marcado = page.locator("mat-radio-button.mat-radio-checked", { hasText: /^\s*(Visível|Oculta)\s*$/ })
  await marcado.first().waitFor()
  console.log("ENVIAR ESOCIAL EPIs:", (await marcado.allInnerTexts()).map((t) => t.trim()))
  await page.getByRole("tab", { name: "Gerais", exact: true }).click()
  console.log("ATIVIDADES x RISCOS:", await gro.lerExibicao())
})
