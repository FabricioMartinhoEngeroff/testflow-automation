// Script de apoio: mostra os modos atuais da coluna LTCAT na Configuração Geral e, com MODO=Bloquear|Sugerir, aplica em todas as linhas.
// Rodar com: MODO=Bloquear npx playwright test --project=scripts restaurar-config-geral
import { test } from "@support"
import type { Modo } from "@support/actions/seguranca/programas-e-laudos/ConfiguracaoGeral"

test("estado da Configuração Geral", async ({ login, configuracaoGeralPage: cg }) => {
  await login.entrar()
  await cg.abrir()
  console.log(JSON.stringify(await cg.lerLtcat(), null, 1))
  const modo = process.env.MODO as Modo | undefined
  if (modo) {
    await cg.aplicarModoEmTodas(modo)
    if (await cg.botaoSalvar.isEnabled()) await cg.salvar()
    console.log("aplicado", modo, JSON.stringify((await cg.lerLtcat()).map((l) => l.modo)))
  }
})
