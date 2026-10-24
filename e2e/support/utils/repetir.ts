// executa a ação N vezes em sequência (cada uma espera a anterior), recebendo o índice da vez
export const repetir = async (vezes: number, acao: (vez: number) => Promise<unknown>) => {
  for (let vez = 0; vez < vezes; vez++) await acao(vez)
}
