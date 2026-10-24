// Exploração temporária da modal Notificações: o rótulo "Grupos de e-mail" só ganha o * depois de marcar algum "dias"?
// Resultado (2026-10-24): o campo nem existe ao abrir; só aparece ao marcar um "dias", e já com o *.
import { test } from "@support"

test("explorar seletores da modal Notificações", async ({ login, ltcatCadastroPage: c, page }) => {
  test.setTimeout(120000)
  await login.entrar()
  await c.abrir()
  await c.botaoNotificacoes.click()

  const modal = page.locator("apollus-ngx-ivy-ltcat-modal-notificacoes")
  await modal.getByRole("heading", { name: "Notificações" }).waitFor()
  const grupos = modal.locator("apls-autocomplete[formcontrolname=gruposEmail] input")
  const estado = async (momento: string) => console.log(momento, {
    dialogs: await page.getByRole("dialog").count(),
    comAsterisco: await modal.getByRole("combobox", { name: "Grupos de e-mail *" }).count(),
    semAsterisco: await modal.getByRole("combobox", { name: "Grupos de e-mail", exact: true }).count(),
    css: await grupos.count(),
    habilitado: await grupos.isEnabled(),
    checado: Object.fromEntries(await Promise.all(["15", "30"].map(async (d) => [d, await modal.getByRole("checkbox", { name: `${d} dias` }).isChecked()]))),
  })

  await estado("ao abrir:")
  await modal.getByText("30 dias", { exact: true }).click()
  await estado("depois de marcar 30 dias:")
})
