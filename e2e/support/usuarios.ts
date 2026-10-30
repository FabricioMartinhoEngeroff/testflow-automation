import path from "path"
import { fileURLToPath } from "url"
import { senhaUsuarioQa } from "@shared/env"

// Usuários fixos de teste, criados à mão em Perfis de Acesso. A chave é o nome usado nos specs;
// o login real está em LOGINS e a senha em PGR_SENHA_<login> no .env. Servem a qualquer tela, não só ao LTCAT.
// H1 = Região "71 - CURITIBA"; H2 = Unidade "Fábrica Curitiba"; OUTRA H1 = ver data/hierarquias.ts
export const USUARIOS = {
  QAutomatizador_sem_permissao: "Gestão de Ocorrências e Gestão de Ações completas, nada em LTCAT (Ex. 1)",
  QAutomatizador_inc_h1: "INC em Curitiba (Ex. 2)",
  QAutomatizador_alt_h1: "ALT em Curitiba (Ex. 3)",
  QAutomatizador_exc_h1: "EXC em Curitiba (Ex. 4)",
  QAutomatizador_vis_h1: "VIS em Curitiba (Ex. 5)",
  QAutomatizador_todas_h1: "INC+ALT+VIS+EXC em Curitiba",
  QAutomatizador_vis_alt_2perfis: "P1 VIS Curitiba; P2 ALT Curitiba",
  QAutomatizador_vis_h1_h2: "VIS em Curitiba > Fábrica Curitiba",
  QAutomatizador_alt_h1_h2: "ALT em Curitiba > Fábrica Curitiba",
  QAutomatizador_exc_h1_h2: "EXC em Curitiba > Fábrica Curitiba",
  QAutomatizador_inc_h1_h2: "INC em Curitiba > Fábrica Curitiba",
  QAutomatizador_todas_h1_h2: "INC+ALT+VIS+EXC em Curitiba > Fábrica Curitiba",
  QAutomatizador_vis_h1_mais_h1_h2: "P1 VIS Curitiba; P2 VIS Curitiba > Fábrica Curitiba",
  QAutomatizador_multiperfil: "P1 VIS Corporativo; P2 INC+ALT Curitiba; P3 EXC outra H1 (Ex. 6)",
  QAutomatizador_H1_H2: "P1 VIS outra H1; P2 INC+VIS outra H1 > H2; P3 EXC+VIS Curitiba > Fábrica Curitiba (Ex. 7)",
  QAutomatizador_multiunidade: "P1 VIS Curitiba; P2 ALT outra H1 e terceira H1 (Ex. 8 reduzido)",
} as const

export type Usuario = keyof typeof USUARIOS

// login real de cada usuário no Apollus; null = ainda não criado (os specs dele ficam pulados)
const LOGINS: Record<Usuario, string | null> = {
  QAutomatizador_sem_permissao: "QAUTO01",
  QAutomatizador_inc_h1: "QAUTO02",
  QAutomatizador_alt_h1: "QAUTO03",
  QAutomatizador_exc_h1: "QAUTO04",
  QAutomatizador_vis_h1: "QAUTO05",
  QAutomatizador_todas_h1: "QAUTO06",
  QAutomatizador_vis_alt_2perfis: "QAUTO07",
  QAutomatizador_vis_h1_h2: "QAUTO08",
  QAutomatizador_alt_h1_h2: "QAUTO09",
  QAutomatizador_exc_h1_h2: "QAUTO10",
  QAutomatizador_inc_h1_h2: "QAUTO11",
  QAutomatizador_todas_h1_h2: "QAUTH01",
  QAutomatizador_vis_h1_mais_h1_h2: null,
  QAutomatizador_multiperfil: null,
  QAutomatizador_H1_H2: null,
  QAutomatizador_multiunidade: null,
}

export const temCredencial = (usuario: Usuario) => LOGINS[usuario] !== null

// { usuario, senha } para login.entrar; a senha vem do .env
export function credenciais(usuario: Usuario) {
  const login = LOGINS[usuario]
  if (!login) throw new Error(`${usuario} ainda não tem login criado (ver LOGINS em support/usuarios.ts).`)
  return { usuario: login, senha: senhaUsuarioQa(login) }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// e2e/.auth/<usuario>.json — gerado pelo projeto "auth" antes dos testes de permissão
export function sessao(usuario: Usuario) {
  return path.resolve(__dirname, "../.auth", `${usuario}.json`)
}
