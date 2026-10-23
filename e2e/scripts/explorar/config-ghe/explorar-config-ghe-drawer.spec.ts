// Script de apoio: depois de navegar pelo menu lateral, por que o ✓ do filtro de Região não recebe o clique?
// Achado: logo após navegar pelo menu existem dois "Região *" no DOM (a tela que sai ainda está na animação de rota).
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-drawer
import { expect } from "@playwright/test"
import { test } from "@support"
import { URLS } from "@support/urls"
import { ltcatValido } from "@support/data/ltcat"

test.setTimeout(120000)
test("drawer depois do menu", async ({ login, menuLateral: menu, ltcatPage: lista, page }) => {
  await login.entrar()
  await page.goto(URLS.ltcatCadastro)
  await menu.abrirModulo("seguranca")
  const item = menu.item(/LTCAT/).locator("visible=true")
  if (!(await item.isVisible())) await menu.grupo("Programas e Laudos").click()
  await item.click()
  await lista.titulo.waitFor()
  await expect(lista.regiao).toHaveCount(1, { timeout: 15000 })
  console.log("drawer aberto:", await page.locator("mat-drawer.mat-drawer-opened").count(), "backdrop:", await page.locator(".mat-drawer-backdrop.mat-drawer-shown").count())
  await lista.regiao.click()
  await lista.opcao(ltcatValido.regiao).click()
  console.log("paineis:", await lista.painelMultiplo.count(), "botoes ✓:", await lista.botaoConfirmarSelecao.count())
  console.log("topo:", (await lista.painelMultiplo.innerHTML()).replace(/<!---->|_ngcontent-[a-z0-9-]+=""|class="[^"]*"/g, "").slice(0, 1500))
  await lista.botaoConfirmarSelecao.click({ timeout: 5000 }).catch((e) => console.log("clique ✓ falhou:", e.message.split("\n").slice(0, 12).join(" | ")))
})
