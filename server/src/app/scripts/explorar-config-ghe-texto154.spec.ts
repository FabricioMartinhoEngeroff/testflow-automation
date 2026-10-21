// Script de apoio: imprime o texto da aba Configurações do LTCAT idkey=154 e do cadastro novo, para ver se a flag "Incluir riscos associados..." está na tela.
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-texto154
import { test } from "../support"
import { URLS } from "../support/urls"
import { ltcatValido } from "../support/data/ltcat"

test("texto da aba", async ({ login, ltcatCadastroPage: cadastro, page }) => {
  await login.entrar()
  await page.goto(`${URLS.ltcatCadastro}?idkey=154`)
  await cadastro.titulo.waitFor()
  await cadastro.abrirAba("Configurações")
  await page.waitForTimeout(3000)
  console.log("154:\n", (await page.locator("apollus-ngx-ivy-ltcat-aba-configuracoes").innerText()).split("\n").filter((l) => /riscos/i.test(l)).join(" | "))
  await cadastro.abrir()
  await cadastro.selecionarOpcao(cadastro.regiao, ltcatValido.regiao)
  await cadastro.abrirAba("Configurações")
  await page.waitForTimeout(3000)
  console.log("novo:\n", (await page.locator("apollus-ngx-ivy-ltcat-aba-configuracoes").innerText()).split("\n").filter((l) => /riscos/i.test(l)).join(" | "))
})
