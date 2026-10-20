import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// carrega o .env (que fica fora do git) para dentro de process.env — caminho
// explícito porque o cwd varia (ex: a extensão do Playwright no VS Code roda
// de outro diretório e não acha o .env com dotenv.config() sem argumento).
// Usa import.meta.url em vez de __dirname porque este arquivo roda como
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../../.env") })

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

// senha única dos usuários QAutomatizador_* (support/usuarios.ts); lida só quando pedida,
// para não exigir a variável de quem roda os demais testes
export function senhaUsuariosQa() {
  return obrigatoria("PGR_SENHA_QA")
}

// PERMISSÕES (desativado):
// // usuário cujas permissões os testes alteram e verificam; lido só quando
// // pedido, para não exigir essas variáveis de quem roda os demais testes
// export function credenciaisPerfil() {
//   return {
//     usuario: obrigatoria("PGR_USUARIO_PERFIL"),
//     senha: obrigatoria("PGR_SENHA_PERFIL"),
//   }
// }
