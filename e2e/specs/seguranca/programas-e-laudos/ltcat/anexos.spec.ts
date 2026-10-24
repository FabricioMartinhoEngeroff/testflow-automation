// LTCAT > aba Anexos (TST1121 e TST1123-TST1133): usabilidade da aba e da modal "Adicionar anexo".
// Roda num LTCAT novo sem salvar: o grid só vai pro banco no Salvar do LTCAT.
import path from "path"
import type { Page } from "@playwright/test"
import { test, expect } from "@support"
import type { LtcatAnexosPage } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexos"
import type { LtcatAnexoModal } from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexoModal"
import type { ToastPage } from "@support/actions/Toast"

const arquivo = (nome: string) => path.join(process.cwd(), "support", "arquivos", nome)

test.describe("LTCAT - Anexos", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
    await ltcatCadastroPage.abrirAba("Anexos")
  })

  test("TST1121 - aba Metodologia foi retirada da tela", async ({ ltcatCadastroPage: c }) => {
    await expect(c.aba("Metodologia" as never)).toHaveCount(0)
  })

  test("TST1123 - aba Anexos está visível e ativa", async ({ ltcatCadastroPage: c }) => {
    await expect(c.aba("Anexos")).toBeVisible()
    await expect(c.aba("Anexos")).toHaveAttribute("aria-selected", "true")
  })

  test("TST1124 - texto fixo de orientação", async ({ ltcatAnexosPage: a }) => {
    await expect(a.orientacao).toHaveText(
      "Adicione, na tabela abaixo, os anexos que deverão constar neste LTCAT. Os anexos serão exibidos na ordem definida abaixo.",
    )
  })

  test("TST1125 - subtítulo Anexo", async ({ ltcatAnexosPage: a }) => {
    await expect(a.subtituloAnexo).toBeVisible()
  })

  test("TST1126 - botão Adicionar anexo com ícone de clipe", async ({ ltcatAnexosPage: a }) => {
    await expect(a.botaoAdicionarAnexo).toBeVisible()
    await expect(a.iconeBotaoAdicionarAnexo).toBeVisible()
  })

  test("TST1127 - clicar em Adicionar anexo abre a modal", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
    await a.abrirModalAdicionar()
    await expect(m.titulo).toBeVisible()
  })

  test("TST1128 - título da modal na inclusão", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
    await a.abrirModalAdicionar()
    await expect(m.titulo).toHaveText("Adicionar anexo")
  })

  test("TST1129 - título da modal na edição", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    await a.abrirModalAdicionar()
    await m.anexar(arquivo("minimo.pdf"))
    await m.descricao.fill("Anexo para edição")
    await m.botaoSalvar.click()
    await expect(m.titulo).toHaveCount(0)

    // o clique no ícone às vezes só dispara o tooltip; repete até a modal abrir
    await expect(async () => {
      await a.botaoEditar(0).click()
      await expect(m.tituloEdicao).toBeVisible({ timeout: 1500 })
    }).toPass()
  })

  test("TST1130 - layout da modal: campos visíveis, alinhados e dentro da tela", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
    await a.abrirModalAdicionar()
    const campos = [m.areaDeArquivo, m.descricao, m.botaoFechar, m.botaoSalvarEAdicionarOutro, m.botaoSalvar]
    for (const campo of campos) await expect(campo).toBeInViewport()

    // arquivo acima da descrição, os dois com a mesma margem esquerda
    const arquivoBox = (await m.caixaArquivo.boundingBox())!
    const descricaoBox = (await m.caixaDescricao.boundingBox())!
    expect(arquivoBox.y).toBeLessThan(descricaoBox.y)
    expect(Math.abs(arquivoBox.x - descricaoBox.x)).toBeLessThanOrEqual(4) // folga para arredondamento de subpixel
  })

  test("TST1131 - placeholder do campo de anexo", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
    await a.abrirModalAdicionar()
    await expect(m.areaDeArquivo).toBeVisible()
  })

  test("TST1132 - help do campo de anexo", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
    await a.abrirModalAdicionar()
    expect(await m.textoDoHelpArquivo()).toBe("Permitido arquivos no formato .jpg, .jpeg, .png, .doc, .docx ou .pdf, de até 5MB.")
    // os formatos também ficam no atributo accept do input
    await expect(m.inputArquivo).toHaveAttribute("accept", ".jpg,.jpeg,.png,.doc,.docx,.pdf")
  })

  test("TST1133 - upload via clique: seleciona arquivo e mostra o nome", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
    await a.abrirModalAdicionar()
    // o seletor nativo do SO não é controlável; setInputFiles simula a escolha no input real
    await m.anexar(arquivo("minimo.pdf"))
    await expect(m.nomeDoArquivo).toContainText(/minimo.*\.pdf/i)
  })

  test.describe("Upload e descrição (TST1134-TST1146)", () => {
    test.beforeEach(async ({ ltcatAnexosPage: a }) => {
      await a.abrirModalAdicionar()
    })

    const aceitos = [
      { id: "TST1134", titulo: "pdf válido", arq: "minimo.pdf", nome: /minimo.*\.pdf/i },
      { id: "TST1134", titulo: "pdf real (relatório de LTCAT assinado)", arq: "relatorio_real.pdf", nome: /relatorio_real.*\.pdf/i },
      { id: "TST1135", titulo: "imagem .jpg", arq: "foto_e.jpg", nome: /foto_e.*\.jpg/i },
      { id: "TST1135", titulo: "imagem .jpeg", arq: "foto_f.jpeg", nome: /foto_f.*\.jpeg/i },
      { id: "TST1135", titulo: "imagem .png real", arq: "foto_d.png", nome: /foto_d.*\.png/i },
      { id: "TST1136", titulo: "documento .docx real", arq: "documento_real.docx", nome: /documento_real.*\.docx/i },
      { id: "TST1135", titulo: "imagem .png", arq: "imagem.png", nome: /imagem.*\.png/i },
      { id: "TST1136", titulo: "documento .doc", arq: "documento.doc", nome: /documento.*\.doc/i },
      // o limite de "5MB" é decimal: 5.000.000 bytes (5.242.880 é rejeitado)
      { id: "TST1137", titulo: "exatamente 5MB", arq: "cinco_mb_decimal.pdf", nome: /cinco_mb_decimal.*\.pdf/i },
      { id: "TST1137", titulo: "4,9MB em .pdf (logo abaixo do limite)", arq: "teste_anexo_4_9MB.pdf", nome: /teste_anexo_4_9MB.*\.pdf/i },
      { id: "TST1137", titulo: "4,9MB em .doc (logo abaixo do limite)", arq: "teste_anexo_4_9MB.doc", nome: /teste_anexo_4_9MB.*\.doc/i },
    ]
    for (const { id, titulo, arq, nome } of aceitos) {
      test(`${id} - upload aceito: ${titulo}`, async ({ ltcatAnexoModal: m }) => {
        await m.anexar(arquivo(arq))
        await expect(m.nomeDoArquivo).toContainText(nome)
      })
    }

    const recusados = [
      { id: "TST1138", titulo: "maior que 5MB", arq: "grande.pdf" },
      { id: "TST1138", titulo: "5,1MiB (logo acima do limite)", arq: "teste_anexo_5_1MiB.pdf" },
      // o limite vale para todos os formatos aceitos, não só PDF
      { id: "TST1138", titulo: "imagem .png acima do limite (5,15MiB)", arq: "imagem_5_15MiB.png" },
      { id: "TST1138", titulo: "imagem .jpg acima do limite (5,15MiB)", arq: "imagem_5_15MiB.jpg" },
      { id: "TST1138", titulo: "imagem .jpeg acima do limite (5,15MiB)", arq: "imagem_5_15MiB.jpeg" },
      { id: "TST1139", titulo: "formato inválido (.exe)", arq: "invalido.exe" },
      // .xls/.xlsx valem no catálogo geral da EF ([arquivo_invalido]), mas não no campo da aba Anexos
      { id: "TST1139", titulo: "planilha .xls", arq: "planilha.xls" },
      { id: "TST1139", titulo: "planilha .xlsx", arq: "planilha.xlsx" },
      { id: "TST1139", titulo: "texto .md", arq: "texto.md" },
    ]
    for (const { id, titulo, arq } of recusados) {
      test(`${id} - upload recusado: ${titulo}`, async ({ ltcatAnexoModal: m, toast }) => {
        await m.anexar(arquivo(arq))
        // a mesma mensagem cobre tamanho e extensão
        await toast.temTexto(/Permitido somente arquivos/)
        await expect(m.areaDeArquivo).toBeVisible()
      })
    }

    test("TST1140 - upload múltiplo: o input aceita só 1 arquivo", async ({ ltcatAnexoModal: m }) => {
      await expect(m.inputArquivo).not.toHaveAttribute("multiple")
    })

    test("TST1141 - substituir o arquivo antes de salvar", async ({ ltcatAnexoModal: m }) => {
      await m.anexar(arquivo("minimo.pdf"))
      await expect(m.nomeDoArquivo).toContainText(/minimo.*\.pdf/i)
      await m.anexar(arquivo("imagem.png"))
      await expect(m.nomeDoArquivo).toContainText(/imagem.*\.png/i)
      await expect(m.nomeDoArquivo).not.toContainText(/minimo/i)
    })

    // o arquivo já foi pro servidor, então o "x" pede confirmação de exclusão
    test("TST1142 - remover o arquivo antes de salvar limpa o campo", async ({ ltcatAnexoModal: m, page }) => {
      await m.anexar(arquivo("minimo.pdf"))
      await expect(m.nomeDoArquivo).toContainText(/minimo.*\.pdf/i)
      await m.botaoLimparArquivo.click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await expect(m.areaDeArquivo).toBeVisible()
    })

    test("TST1143 - anexo obrigatório: salvar só com descrição é bloqueado", async ({ ltcatAnexoModal: m, ltcatAnexosPage: a, toast }) => {
      await m.descricao.fill("Sem arquivo")
      await m.botaoSalvar.click()
      await toast.temTexto(/campos obrigatórios/)
      await expect(m.titulo).toBeVisible()
      await expect(a.linhas.filter({ hasText: "Sem arquivo" })).toHaveCount(0)
    })

    test("TST1144 - descrição obrigatória: salvar só com arquivo é bloqueado", async ({ ltcatAnexoModal: m, toast, page }) => {
      await m.anexar(arquivo("minimo.pdf"))
      await m.botaoSalvar.click()
      await toast.temTexto(/campos obrigatórios/)
      await expect(m.titulo).toBeVisible()
      await expect(page.getByText("Registro incluído com sucesso")).toHaveCount(0)
    })

    test("TST1145 - descrição aceita texto de até 500 caracteres", async ({ ltcatAnexoModal: m }) => {
      const texto = "a".repeat(500)
      await m.descricao.fill(texto)
      await expect(m.descricao).toHaveValue(texto)
    })

    test("TST1146 - descrição bloqueia mais de 500 caracteres", async ({ ltcatAnexoModal: m }) => {
      await m.descricao.fill("a".repeat(550))
      expect((await m.descricao.inputValue()).length).toBe(500)
    })
  })

  // Texto real: "Permitido somente arquivos com até 5MB e com extensão .jpg, .jpeg, .png, .doc, .docx ou .pdf. Favor verificar."
  const mensagemArquivoInvalido = async (a: LtcatAnexosPage, m: LtcatAnexoModal, toast: ToastPage) => {
    await a.abrirModalAdicionar()
    await m.anexar(arquivo("teste_anexo_5_1MiB.pdf"))
    const aviso = toast.mensagem.filter({ hasText: /Permitido somente arquivos/ })
    await expect(aviso).toBeVisible()
    return (await aviso.innerText()).replace(/\s+/g, " ")
  }

  test("TST1138/TST1139 - [arquivo_invalido] segue a regra da aba (5MB e extensões do campo)", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, toast }) => {
    const texto = await mensagemArquivoInvalido(a, m, toast)
    expect(texto).toContain("Atenção")
    expect(texto).toContain("Permitido somente arquivos com até 5MB e com extensão .jpg, .jpeg, .png, .doc, .docx ou .pdf. Favor verificar.")
  })

  // DIVERGÊNCIA EF: o catálogo de mensagens da EF define [arquivo_invalido] como "...até 30MB e com extensão JPEG, JPG,
  // PNG, DOC, DOCX, XLS, XLSX e PDF. Favor verificar." (texto genérico de outras telas); a tela exibe 5MB e sem XLS/XLSX.
  // Remover o test.fail se confirmarem que o texto da aba Anexos é o correto.
  test("TST1138/TST1139 - [arquivo_invalido] com o texto do catálogo da EF", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, toast }) => {
    test.fail(true, "a tela exibe 5MB e extensões da aba; o catálogo da EF diz 30MB e inclui XLS/XLSX")
    const texto = await mensagemArquivoInvalido(a, m, toast)
    expect(texto).toContain("Permitido somente arquivos com até 30MB e com extensão JPEG, JPG, PNG, DOC, DOCX, XLS, XLSX e PDF. Favor verificar.")
  })

  // IDs da planilha repetidos: TST1224/1225/1226 também são o tooltip do revisor (anexos-tooltip-revisor.spec.ts); sufixo "(help)" separa.
  test("TST1224 (help) - Help do campo Anexo - passar o mouse sobre o ícone exibe o texto", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
    await a.abrirModalAdicionar()
    await m.helpArquivo.hover()
    await expect(m.tooltipVisivel).toBeVisible()
    await expect(m.tooltipVisivel).toHaveText("Permitido arquivos no formato .jpg, .jpeg, .png, .doc, .docx ou .pdf, de até 5MB.")
  })

  test("TST1225 (help) - Help do campo Descrição/título - passar o mouse sobre o ícone exibe o texto", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
    await a.abrirModalAdicionar()
    await m.helpDescricao.hover()
    await expect(m.tooltipVisivel).toBeVisible()
    await expect(m.tooltipVisivel).toHaveText("O texto inserido aqui será usado como título na página deste anexo, dentro do documento gerado.")
  })

  test("TST1226 (tooltip upload) - Tooltip da área de upload - passar o mouse exibe a orientação", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
    await a.abrirModalAdicionar()
    await m.areaDeArquivo.hover()
    await expect(m.tooltipVisivel).toBeVisible()
    await expect(m.tooltipVisivel).toHaveText("Arraste e solte o arquivo aqui ou clique para procurar um arquivo em seu computador")
  })

  // TST1164 na planilha (repetido: também é "arquivo corrompido"): "Anexar um arquivo com ponto no nome (ex.: relatorio.v2.pdf)".
  // Esperado: bloqueia o upload e mostra aviso laranja temporizado. Vale para todo formato aceito.
  const formatos: [string, string][] = [
    ["pdf", "application/pdf"],
    ["png", "image/png"],
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
    ["doc", "application/msword"],
    ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ]
  for (const [ext, mimeType] of formatos) {
    test(`TST1164 (extensão dupla) - relatorio.v2.${ext} é bloqueado com aviso laranja temporizado`, async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, toast }) => {
      await a.abrirModalAdicionar()
      await m.inputArquivo.setInputFiles({ name: `relatorio.v2.${ext}`, mimeType, buffer: Buffer.from("conteudo de teste") })

      const aviso = toast.mensagem.filter({ hasText: /extensão dupla/ })
      await expect(aviso).toBeVisible()
      const texto = (await aviso.innerText()).replace(/\s+/g, " ")
      expect(texto).toContain("Atenção")
      expect(texto).toContain("Não é permitido carregar arquivos com extensão dupla. Favor remover todos os pontos do nome do arquivo.")

      // laranja: o fundo fica num elemento acima do apls-toast
      const fundo = await aviso.evaluate((el) => {
        for (let e: Element | null = el; e; e = e.parentElement) {
          const c = getComputedStyle(e).backgroundColor
          if (c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c
        }
        return ""
      })
      // cor dos avisos do sistema: amarelo (#ffc107); a diferença para o "laranja" da EF foi aceita pelo time
      expect(fundo).toBe("rgb(255, 193, 7)")

      // o upload é bloqueado: nada fica anexado (o placeholder continua no campo)
      await expect(m.areaDeArquivo).toBeVisible()
      await expect(m.campoArquivo).not.toContainText("relatorio")
      // temporizada: some sozinha
      await expect(aviso).toHaveCount(0, { timeout: 30000 })
    })
  }
})
