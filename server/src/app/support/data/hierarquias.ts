import { ltcatValido } from "./ltcat"

export const H1 = ltcatValido.regiao
// exato: "711021 - FÁBRICA CURITIBA - CIC" e "711042 - FÁBRICA CURITIBA - HP" são outras unidades
export const H2 = /^\s*711001 - F[AÁ]BRICA CURITIBA\s*$/i

// TODO: regiões que os perfis multi-H1 (Ex. 6, 7 e 8) usam além de Curitiba. Vazio = testes desses usuários ficam pulados.
export const OUTRA_H1 = ""
export const TERCEIRA_H1 = ""
