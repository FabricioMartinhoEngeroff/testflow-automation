// Script de apoio: mostra o valor atual de "Por padrão, a aba Atividades x Fatores de risco deverá estar" em GRO > Configurações - GHE > Gerais.
// Rodar com: npx playwright test --project=scripts explorar-config-ghe-gerais
import { test } from "../support"

test("valor atual do GRO", async ({ login, configGheAbaGeraisPage: gro }) => {
  await login.entrar()
  await gro.abrir()
  console.log("EXIBICAO:", await gro.lerExibicao())
})
