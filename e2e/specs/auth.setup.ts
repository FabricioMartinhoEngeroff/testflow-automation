// Faz login de cada usuário de teste pela tela e guarda a sessão em .auth/<usuario>.json,
// para os specs de permissão entrarem já logados (test.use({ storageState })).
import { test } from "@support"
import { USUARIOS, credenciais, sessao, temCredencial, type Usuario } from "@support/usuarios"

for (const usuario of Object.keys(USUARIOS) as Usuario[]) {
  test(`sessão de ${usuario}`, async ({ login, page }) => {
    test.skip(!temCredencial(usuario), "usuário ainda não criado no Apollus")
    await login.entrar(credenciais(usuario))
    await page.context().storageState({ path: sessao(usuario) })
  })
}
