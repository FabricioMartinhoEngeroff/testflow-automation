// Faz login de cada usuário de teste pela tela e guarda a sessão em .auth/<usuario>.json,
// para os specs de permissão entrarem já logados (test.use({ storageState })).
import { test } from "../support"
import { USUARIOS, sessao, type Usuario } from "../support/usuarios"
import { senhaUsuariosQa } from "../shared/env"

for (const usuario of Object.keys(USUARIOS) as Usuario[]) {
  test(`sessão de ${usuario}`, async ({ login, page }) => {
    await login.entrar({ usuario, senha: senhaUsuariosQa() })
    await page.context().storageState({ path: sessao(usuario) })
  })
}
