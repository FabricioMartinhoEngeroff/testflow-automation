import { beforeEach, describe, expect, test, vi } from "vitest"

// evita que um .env real na sua máquina (com credenciais de verdade do PGR)
// interfira nos testes de "variável faltando" abaixo
vi.mock("dotenv", () => ({ default: { config: vi.fn() } }))

function limparVariaveis() {
  delete process.env.PGR_URL
  delete process.env.PGR_USUARIO
  delete process.env.PGR_SENHA
}

describe("env", () => {
  beforeEach(() => {
    // env.ts calcula tudo no momento do import (top-level) — resetModules
    // força o Node a executar esse código de novo em cada teste, lendo o
    // process.env como está naquele momento
    vi.resetModules()
    limparVariaveis()
  })

  test("lança erro claro quando falta PGR_URL", async () => {
    process.env.PGR_USUARIO = "usuario-teste"
    process.env.PGR_SENHA = "senha-teste"

    await expect(import("../../../app/shared/env")).rejects.toThrow(/PGR_URL/)
  })

  test("lança erro claro quando falta PGR_USUARIO", async () => {
    process.env.PGR_URL = "http://localhost:9999"
    process.env.PGR_SENHA = "senha-teste"

    await expect(import("../../../app/shared/env")).rejects.toThrow(/PGR_USUARIO/)
  })

  test("lança erro claro quando falta PGR_SENHA", async () => {
    process.env.PGR_URL = "http://localhost:9999"
    process.env.PGR_USUARIO = "usuario-teste"

    await expect(import("../../../app/shared/env")).rejects.toThrow(/PGR_SENHA/)
  })

  test("retorna os valores corretos quando todas as variáveis estão definidas", async () => {
    process.env.PGR_URL = "http://localhost:9999"
    process.env.PGR_USUARIO = "usuario-teste"
    process.env.PGR_SENHA = "senha-teste"

    const { env } = await import("../../../app/shared/env")

    expect(env).toStrictEqual({
      baseUrl: "http://localhost:9999",
      usuario: "usuario-teste",
      senha: "senha-teste",
    })
  })
})
