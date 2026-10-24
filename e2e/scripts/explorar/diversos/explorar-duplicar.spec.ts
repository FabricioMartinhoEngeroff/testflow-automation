// Exploração temporária: o que o Duplicar do LTCAT 145 copia (não salva nada).
import { test, expect } from "@support"
import type { LtcatCadastroPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro"
import type { LtcatReferenciasPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATReferencias"

async function ler(c: LtcatCadastroPage, r: LtcatReferenciasPage) {
  const v = async (l: { inputValue: () => Promise<string> }) => l.inputValue().catch(() => "?")
  return {
    regiao: await v(c.regiao), unidade: await v(c.unidade), setor: await v(c.setor), ghe: await v(c.ghe), dataBase: await v(c.dataBase),
    responsavel: await v(r.responsavelTecnico), art: await v(r.art), avaliacao: await v(r.avaliacaoRealizadaEm),
    condicoes: (await v(r.condicoesOperacionais)).slice(0, 40), modelo: await v(r.modeloDocumento),
    vigencia: `${await v(r.vigenciaInicio)} - ${await v(r.vigenciaFim)}`,
    expostos: [await v(r.expostosMulheres), await v(r.expostosHomens), await v(r.expostosPcds)],
    equipe: await r.profissionaisDaEquipe().catch(() => "?"),
    revisoesBadge: await c.botaoRevisoes.locator(".mat-badge-content").textContent().catch(() => "?"),
  }
}

test("explorar duplicar", async ({ login, ltcatCadastroPage: c, ltcatReferenciasPage: r, page }) => {
  test.setTimeout(240000)
  await login.entrar()
  await page.goto("/apollus/seguranca/programas-laudos/ltcat/cadastro?idkey=145")
  await c.titulo.waitFor()
  await expect(c.botaoDuplicar).toBeVisible()
  console.log("ORIGINAL", JSON.stringify(await ler(c, r), null, 1))

  await c.botaoDuplicar.click()
  const popup = page.locator("apls-popup")
  console.log("botões popup:", await popup.locator("button").evaluateAll((bs) => bs.map((b) => `${b.textContent?.trim()} [${b.className.includes("primary") ? "primary" : "secondary"}${b === document.activeElement ? ",foco" : ""}]`)))
  await popup.getByRole("button", { name: "Não" }).click()
  await page.waitForTimeout(800)
  console.log("após Não -> popups:", await popup.count(), "| url:", page.url())

  await c.botaoDuplicar.click()
  await popup.getByRole("button", { name: "Sim" }).click()
  await page.waitForTimeout(4000)
  console.log("após Sim -> url:", page.url(), "| toasts:", await page.locator("apls-toast").allInnerTexts())
  console.log("rodapé:", await page.locator(".apls-form-footer button:visible").allInnerTexts())
  console.log("DUPLICADO", JSON.stringify(await ler(c, r), null, 1))
  await c.abrirAba("Anexos")
  await page.waitForTimeout(1000)
  console.log("anexos linhas:", await page.locator("apollus-ngx-ivy-ltcat-aba-anexos tbody tr, apollus-ngx-ivy-ltcat-aba-anexo tbody tr").count())
  await c.abrirAba("Colaboradores")
  await page.waitForTimeout(1000)
  console.log("colaboradores texto:", (await page.locator("mat-tab-body:visible, .mat-tab-body-active").first().innerText()).slice(0, 200))
  await c.abrirAba("Conclusão")
  await page.waitForTimeout(1000)
  console.log("conclusão:", (await page.locator(".ck-editor__editable").first().innerText()).slice(0, 100))
})
