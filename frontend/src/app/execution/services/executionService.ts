import type { Cenario, Credenciais, StatusCenario } from "../../shared/types"

interface ResultadoExecucao {
  status: StatusCenario
  mensagem?: string
}

export async function executarCenario(cenario: Cenario, { url, usuario, senha }: Credenciais): Promise<ResultadoExecucao> {
  try {
    const res = await fetch("http://localhost:3001/api/executar-cenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cenario, url, usuario, senha })
    })
    return await res.json()
  } catch {
    // mock resultado para testar o front sem backend
    await new Promise(r => setTimeout(r, 1200))
    const passou = Math.random() > 0.3
    return {
      status: passou ? "passou" : "falhou",
      mensagem: passou ? "Validação concluída com sucesso" : "Elemento não encontrado ou comportamento inesperado",
    }
  }
}
