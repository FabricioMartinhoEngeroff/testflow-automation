// Login do Apollus. Mensagens conferidas na tela real (2026-10-13): o sistema
// não valida formato de usuário (não é e-mail) e usa a mesma mensagem de
// "campos obrigatórios" para usuário vazio, senha vazia ou ambos vazios.
import { test } from "../../support"
import { env } from "../../shared/env"

const MSG_CREDENCIAIS_INVALIDAS = "Usuário ou senha incorretos. Favor verificar."
const MSG_CAMPOS_OBRIGATORIOS = "Existe um ou mais campos obrigatórios que não foram preenchidos."

test.describe("Login (E2E)", () => {
  test.beforeEach(async ({ login }) => {
    await login.visitar()
  })

  test("deve logar com usuário e senha válidos", async ({ login }) => {
    await login.enviarFormulario(env.usuario, env.senha)
    await login.estaLogado()
  })

  test("não deve logar com senha incorreta", async ({ login, toast }) => {
    await login.enviarFormulario(env.usuario, "senha-incorreta")
    await toast.temTexto(MSG_CREDENCIAIS_INVALIDAS)
  })

  test("não deve logar com usuário inexistente", async ({ login, toast }) => {
    await login.enviarFormulario("usuario-inexistente", env.senha)
    await toast.temTexto(MSG_CREDENCIAIS_INVALIDAS)
  })

  test("não deve logar quando o usuário não é preenchido", async ({ login, toast }) => {
    await login.enviarFormulario("", env.senha)
    await toast.temTexto(MSG_CAMPOS_OBRIGATORIOS)
  })

  test("não deve logar quando a senha não é preenchida", async ({ login, toast }) => {
    await login.enviarFormulario(env.usuario, "")
    await toast.temTexto(MSG_CAMPOS_OBRIGATORIOS)
  })

  test("não deve logar quando nenhum campo é preenchido", async ({ login, toast }) => {
    await login.enviarFormulario("", "")
    await toast.temTexto(MSG_CAMPOS_OBRIGATORIOS)
  })
})
