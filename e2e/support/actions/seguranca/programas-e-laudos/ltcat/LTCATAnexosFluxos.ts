// fluxos compartilhados pelas specs da aba Anexos do LTCAT (inclusão, edição, exclusão)
import path from "path"
import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"
import type { LtcatAnexosPage } from "./LTCATAnexos"
import type { LtcatAnexoModal } from "./LTCATAnexoModal"
import type { LtcatCadastroPage } from "./LTCATCadastro"
import { ToastPage } from "../../../Toast"
import { repetir } from "@support/utils/repetir"

export const arquivoDeTeste = (nome: string) => path.join(process.cwd(), "support", "arquivos", nome)

export const MSG_ANEXOS = {
  obrigatorios: "Existem um ou mais campos obrigatórios que não foram preenchidos.",
  incluido: "Registro incluído com sucesso",
  // texto de [info_excluir] visto no sistema (Equipe usa "Registro excluído com sucesso.")
  excluido: /Registro excluído com sucesso|Operação realizada com sucesso/,
}

export const avisoAnexos = (page: Page, texto: string | RegExp) => new ToastPage(page).temTexto(texto)

// o toast [info_salvar] some rápido e às vezes não é capturado; o que vale aqui é o anexo entrar no grid
export const incluirAnexo = async (a: LtcatAnexosPage, m: LtcatAnexoModal, descricao: string, arq = "minimo.pdf") => {
  const antes = await a.linhasAnexo.count()
  await a.abrirModalAdicionar()
  await m.anexar(arquivoDeTeste(arq))
  await m.descricao.fill(descricao)
  // o botão fica bloqueado enquanto o upload é processado; clicar antes disso não faz nada
  await expect(m.botaoSalvar).toBeEnabled()
  await m.botaoSalvar.click()
  // no LTCAT o Salvar grava e fecha a modal sozinho
  await expect(m.titulo).toHaveCount(0)
  await expect(a.linhasAnexo).toHaveCount(antes + 1)
}

// o clique no ícone às vezes só dispara o tooltip; repete até a modal abrir
export const abrirEdicaoAnexo = async (a: LtcatAnexosPage, m: LtcatAnexoModal, linha = 0) => {
  await expect(async () => {
    await a.botaoEditar(linha).click()
    await expect(m.tituloEdicao).toBeVisible({ timeout: 1500 })
  }).toPass()
}

export const excluirAnexo = async (a: LtcatAnexosPage, linha: number) => {
  await a.botaoExcluir(linha).click()
  await a.botaoPopupExclusao("Excluir").click()
  await expect(a.popupExclusao).toHaveCount(0)
}

export const nomesDeAnexo = (total: number, prefixo = "Anexo") =>
  Array.from({ length: total }, (_, i) => `${prefixo} ${String(i + 1).padStart(3, "0")}`)

// mesma regra do grid: tira o item de "de" e encaixa na posição "para"
export const mover = <T>(lista: T[], de: number, para: number) => {
  const copia = [...lista]
  copia.splice(para, 0, copia.splice(de, 1)[0])
  return copia
}

// o "Salvar e adicionar outro" limpa arquivo e descrição (conforme a EF): anexa de novo a cada volta
export const incluirAnexosEmLote = async (page: Page, a: LtcatAnexosPage, m: LtcatAnexoModal, descricoes: string[]) => {
  await a.abrirModalAdicionar()
  for (const [i, descricao] of descricoes.entries()) {
    await expect(m.areaDeArquivo).toBeVisible() // formulário limpo da volta anterior
    await m.anexar(arquivoDeTeste("minimo.pdf"))
    await expect(m.nomeDoArquivo).toBeVisible() // upload terminou
    await m.descricao.fill(descricao)
    await expect(m.botaoSalvarEAdicionarOutro).toBeEnabled() // bloqueado durante o upload
    // raramente o clique não salva mesmo com o botão habilitado: repete até o anexo entrar no grid
    await expect(async () => {
      await m.botaoSalvarEAdicionarOutro.click()
      await expect(a.linhasAnexo).toHaveCount(i + 1, { timeout: 4000 })
    }).toPass({ timeout: 40000, intervals: [0] })
  }
  await m.botaoFechar.click()
  const atencao = page.getByRole("heading", { name: "Atenção" })
  if (await atencao.isVisible().catch(() => false)) await page.getByRole("button", { name: "Salvar e sair" }).click()
  await expect(m.titulo).toHaveCount(0)
}

// Ícone "open_with" da linha "de" arrastado até o centro da linha "para". O CDK só reordena com movimento gradual;
// em passos pequenos com pausa (como uma pessoa) o arrasto fica estável: o rápido às vezes não era reconhecido.
export const arrastarAnexo = async (page: Page, a: LtcatAnexosPage, de: number, para: number) => {
  const alca = a.linhasAnexo.nth(de).locator("mat-icon", { hasText: "open_with" })
  await alca.scrollIntoViewIfNeeded()
  const origem = (await alca.boundingBox())!
  const destino = (await a.linhasAnexo.nth(para).boundingBox())!
  const x = origem.x + origem.width / 2
  const y0 = origem.y + origem.height / 2
  const y1 = destino.y + destino.height / 2
  await page.mouse.move(x, y0)
  await page.mouse.down()
  const passos = 30
  await repetir(passos, async (vez) => {
    await page.mouse.move(x, y0 + ((y1 - y0) * (vez + 1)) / passos)
    await page.waitForTimeout(25)
  })
  await page.waitForTimeout(200)
  await page.mouse.up()
  // espera a animação do CDK e tira o mouse de cima do "Ordenar" (o tooltip atrapalha o próximo clique)
  await page.waitForTimeout(800)
  await page.mouse.move(640, 650)
}

export const salvarLtcat = async (cadastro: LtcatCadastroPage, page: Page) => {
  await cadastro.salvar()
  await expect(cadastro.mensagemSalvoComSucesso).toBeVisible({ timeout: 15000 })
  await expect(page).toHaveURL(/idkey=\d+/)
}
