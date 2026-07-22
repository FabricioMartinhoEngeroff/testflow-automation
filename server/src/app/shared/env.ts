import dotenv from "dotenv"

// carrega o .env (que fica fora do git) para dentro de process.env
dotenv.config()

function obrigatoria(nome: string): string {
  const valor = process.env[nome]
  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não definida. Copie server/.env.example para server/.env e preencha.`)
  }
  return valor
}

// config tipada e validada, lida uma vez só na primeira importação
export const env = {
  baseUrl: obrigatoria("PGR_URL"),
  usuario: obrigatoria("PGR_USUARIO"),
  senha: obrigatoria("PGR_SENHA"),
}
