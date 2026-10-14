// CPF exige unicidade — cada teste que salva no servidor precisa de um CPF
// diferente. Esta função gera um CPF matematicamente válido a partir de um
// número de 9 dígitos, usando o algoritmo oficial dos dígitos verificadores.
export function gerarCpfValido(base: number): string {
  const b = String(Math.abs(base)).padStart(9, "0").slice(0, 9).split("").map(Number)
  const s1 = b.reduce((acc, d, i) => acc + d * (10 - i), 0)
  const d1 = (s1 * 10) % 11 >= 10 ? 0 : (s1 * 10) % 11
  const s2 = [...b, d1].reduce((acc, d, i) => acc + d * (11 - i), 0)
  const d2 = (s2 * 10) % 11 >= 10 ? 0 : (s2 * 10) % 11
  return `${b[0]}${b[1]}${b[2]}.${b[3]}${b[4]}${b[5]}.${b[6]}${b[7]}${b[8]}-${d1}${d2}`
}

// CPF único por execução (seed em ms garante raridade de colisão entre runs).
// Usar APENAS em testes que precisam salvar no servidor — não tem rollback
// automático de dados de teste.
export function cpfUnico(): string {
  return gerarCpfValido(Date.now() % 1_000_000_000)
}
