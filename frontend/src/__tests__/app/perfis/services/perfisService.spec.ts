import { listarPerfis, salvarPerfil, removerPerfil } from "../../../../app/perfis/services/perfisService.ts"
import type { PerfilTeste } from "../../../../app/shared/types"

const SEM_PERMISSAO = { incluir: false, alterar: false, excluir: false, visualizar: false }

describe("perfisService", () => {
  test("deve retornar lista vazia quando não há perfis salvos", () => {
    expect(listarPerfis()).toStrictEqual([])
  })

  test("deve salvar um novo perfil e retorná-lo na listagem", () => {
    const perfil: PerfilTeste = { id: "1", nome: "Só visualizar", usuario: "teste@empresa.com", senha: "123", permissoes: SEM_PERMISSAO }

    salvarPerfil(perfil)

    expect(listarPerfis()).toStrictEqual([perfil])
  })

  test("deve atualizar um perfil existente em vez de duplicar", () => {
    salvarPerfil({ id: "1", nome: "Nome antigo", usuario: "a", senha: "b", permissoes: SEM_PERMISSAO })
    salvarPerfil({ id: "1", nome: "Nome novo", usuario: "a", senha: "b", permissoes: SEM_PERMISSAO })

    const perfis = listarPerfis()
    expect(perfis).toHaveLength(1)
    expect(perfis[0].nome).toBe("Nome novo")
  })

  test("deve remover um perfil pelo id", () => {
    salvarPerfil({ id: "1", nome: "Perfil 1", usuario: "a", senha: "b", permissoes: SEM_PERMISSAO })
    salvarPerfil({ id: "2", nome: "Perfil 2", usuario: "c", senha: "d", permissoes: SEM_PERMISSAO })

    removerPerfil("1")

    const perfis = listarPerfis()
    expect(perfis).toHaveLength(1)
    expect(perfis[0].id).toBe("2")
  })
})
