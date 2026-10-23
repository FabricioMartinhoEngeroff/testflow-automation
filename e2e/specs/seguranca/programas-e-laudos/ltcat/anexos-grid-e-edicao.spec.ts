// LTCAT > aba Anexos (TST1147-TST1191): descrição, inclusão/edição/exclusão, grid, ordem, persistência e auditoria.
// O grid só vai pro banco no Salvar do LTCAT: quase tudo roda num LTCAT novo sem salvar.
import type { Page } from "@playwright/test"
import { test, expect } from "@support"
import { ltcatValido } from "@support/data/ltcat"
import { esperarCriacao, esperarRevisao } from "@support/actions/Revisor"
import {
  abrirEdicaoAnexo as abrirEdicao,
  arquivoDeTeste as arquivo,
  avisoAnexos as aviso,
  incluirAnexo,
  MSG_ANEXOS as MSG,
  salvarLtcat,
} from "@support/actions/seguranca/programas-e-laudos/ltcat/LTCATAnexosFluxos"

const confirmarSaidaSemSalvar = (page: Page) => page.getByRole("button", { name: "Sair sem salvar" }).click()

test.describe("LTCAT - Anexos - grid e edição", () => {
  test.beforeEach(async ({ login, ltcatCadastroPage }) => {
    await login.entrar()
    await ltcatCadastroPage.abrir()
    await ltcatCadastroPage.abrirAba("Anexos")
  })

  test.describe("Descrição", () => {
    test("TST1147 - caracteres especiais são aceitos sem quebrar", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      const texto = `! @ # $ % & * ( ) - _ + = / \\ ç ã õ < > " '`
      await a.abrirModalAdicionar()
      await m.anexar(arquivo("minimo.pdf"))
      await m.descricao.fill(texto)
      await expect(m.descricao).toHaveValue(texto)
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)
      expect(await a.descricoes()).toEqual([texto])
    })

    test("TST1148 - texto longo com quebra de linha mantém a formatação", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await a.abrirModalAdicionar()
      await m.descricao.pressSequentially("linha 1\nlinha 2\nlinha 3")
      await expect(m.descricao).toHaveValue("linha 1\nlinha 2\nlinha 3")
    })
  })

  test.describe("Inclusão e modal", () => {
    test("TST1150 - salva com dados válidos e o anexo entra no grid", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Salvamento válido")
      expect(await a.descricoes()).toEqual(["Salvamento válido"])
      await expect(a.linhasAnexo.first()).toContainText(/minimo.*\.pdf/i)
    })

    test("TST1151 - mensagem de sucesso avisa que falta o Salvar do LTCAT", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await a.abrirModalAdicionar()
      await m.anexar(arquivo("minimo.pdf"))
      await m.descricao.fill("Mensagem")
      await m.botaoSalvar.click()
      await aviso(page, /Registro incluído com sucesso\. Para que a ação seja permanentemente salva/)
    })

    test("TST1178 - 'Salvar e adicionar outro' aparece na inclusão", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await a.abrirModalAdicionar()
      await expect(m.botaoSalvarEAdicionarOutro).toBeVisible()
    })

    test("TST1179 - 'Salvar e adicionar outro' não aparece na edição", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Para editar")
      await abrirEdicao(a, m)
      await expect(m.botaoSalvarEAdicionarOutro).toHaveCount(0)
    })

    // A confirmação "Sair sem salvar" só aparece quando algo foi alterado; sem alteração o Fechar fecha direto.
    test("TST1180 - Fechar sem alterações (inclusão) fecha direto, sem confirmação e sem gravar nada", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await a.abrirModalAdicionar()
      await m.botaoFechar.click()
      await expect(m.titulo).toHaveCount(0)
      await expect(page.getByRole("button", { name: "Sair sem salvar" })).toHaveCount(0)
      await expect(a.linhasAnexo).toHaveCount(0)
    })

    test("TST1180 - Fechar sem alterações (edição) fecha direto, sem confirmação", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Sem alterar")
      await abrirEdicao(a, m)
      await m.botaoFechar.click()
      await expect(m.tituloEdicao).toHaveCount(0)
      await expect(page.getByRole("button", { name: "Sair sem salvar" })).toHaveCount(0)
      expect(await a.descricoes()).toEqual(["Sem alterar"])
    })

    for (const alteracao of ["só o arquivo", "só a descrição", "arquivo e descrição"] as const) {
      test(`TST1180 - Fechar com alteração na inclusão (${alteracao}) pede confirmação e 'Sair sem salvar' descarta`, async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
        await a.abrirModalAdicionar()
        if (alteracao !== "só a descrição") await m.anexar(arquivo("minimo.pdf"))
        if (alteracao !== "só o arquivo") await m.descricao.fill("Alterado")
        await m.botaoFechar.click()
        await expect(page.getByRole("button", { name: "Sair sem salvar" })).toBeVisible()
        await confirmarSaidaSemSalvar(page)
        await expect(m.titulo).toHaveCount(0)
        await expect(a.linhasAnexo).toHaveCount(0)
      })
    }

    test("TST1180 - Fechar com alteração na edição pede confirmação", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Original")
      await abrirEdicao(a, m)
      await m.descricao.fill("Alterada")
      await m.botaoFechar.click()
      await expect(page.getByRole("button", { name: "Sair sem salvar" })).toBeVisible()
      await confirmarSaidaSemSalvar(page)
      expect(await a.descricoes()).toEqual(["Original"])
    })

    test("TST1181 - Salvar com campos vazios emite [campos_obrigatorios]", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await a.abrirModalAdicionar()
      await m.botaoSalvar.click()
      await aviso(page, MSG.obrigatorios)
      await expect(m.titulo).toBeVisible()
    })

    test("TST1182 - Salvar e adicionar outro com campos vazios emite [campos_obrigatorios]", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await a.abrirModalAdicionar()
      await m.botaoSalvarEAdicionarOutro.click()
      await aviso(page, MSG.obrigatorios)
      await expect(m.titulo).toBeVisible()
    })

    test("TST1183 - Salvar grava, emite [info_salvar] e fecha a modal", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await a.abrirModalAdicionar()
      await m.anexar(arquivo("minimo.pdf"))
      await m.descricao.fill("Fecha ao salvar")
      await m.botaoSalvar.click()
      await aviso(page, MSG.incluido)
      await expect(m.titulo).toHaveCount(0)
      expect(await a.descricoes()).toEqual(["Fecha ao salvar"])
    })

    test("TST1184 - Salvar e adicionar outro grava, emite [info_salvar] e mantém a modal aberta", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await a.abrirModalAdicionar()
      await m.anexar(arquivo("minimo.pdf"))
      await m.descricao.fill("Adicionar outro")
      await m.botaoSalvarEAdicionarOutro.click()
      await aviso(page, MSG.incluido)
      await expect(m.titulo).toBeVisible()
      await expect.poll(() => a.descricoes()).toEqual(["Adicionar outro"])
    })

    test("TST1185 - Salvar e adicionar outro devolve a modal ao estado inicial", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await a.abrirModalAdicionar()
      await m.anexar(arquivo("minimo.pdf"))
      await m.descricao.fill("Reset")
      await m.botaoSalvarEAdicionarOutro.click()
      await expect(m.descricao).toHaveValue("")
      await expect(m.areaDeArquivo).toBeVisible()
    })
  })

  test.describe("Edição", () => {
    test.beforeEach(async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Original")
    })

    test("TST1152 - editar abre a modal com os dados preenchidos", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await abrirEdicao(a, m)
      await expect(m.descricao).toHaveValue("Original")
      await expect(m.nomeDoArquivo).toContainText(/minimo.*\.pdf/i)
    })

    test("TST1153 - a descrição pode ser alterada", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await abrirEdicao(a, m)
      await m.descricao.fill("Alterada")
      await expect(m.descricao).toHaveValue("Alterada")
    })

    // a edição do arquivo passa por remover (x + confirmação) e anexar outro
    test("TST1154 - o arquivo pode ser substituído na edição", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await abrirEdicao(a, m)
      await m.botaoLimparArquivo.click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await m.anexar(arquivo("imagem.png"))
      await expect(m.nomeDoArquivo).toContainText(/imagem.*\.png/i)
      await m.botaoSalvar.click()
      await expect(m.tituloEdicao).toHaveCount(0)
      await expect(a.linhasAnexo.first()).toContainText(/imagem.*\.png/i)
    })

    test("TST1155 - salvar a edição atualiza o grid", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await abrirEdicao(a, m)
      await m.descricao.fill("Atualizada")
      await m.botaoSalvar.click()
      await expect(m.tituloEdicao).toHaveCount(0)
      expect(await a.descricoes()).toEqual(["Atualizada"])
    })

    test("TST1156 - cancelar a edição não grava as alterações", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await abrirEdicao(a, m)
      await m.descricao.fill("Descartada")
      await m.botaoFechar.click()
      await confirmarSaidaSemSalvar(page)
      expect(await a.descricoes()).toEqual(["Original"])
    })

    test("TST1174 - substituir o arquivo e sair sem salvar mantém o arquivo antigo", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await abrirEdicao(a, m)
      await m.botaoLimparArquivo.click()
      await page.getByRole("button", { name: "Excluir" }).click()
      await m.anexar(arquivo("imagem.png"))
      await m.botaoFechar.click()
      await confirmarSaidaSemSalvar(page)
      await expect(a.linhasAnexo.first()).toContainText(/minimo.*\.pdf/i)
      await expect(a.linhasAnexo.first()).not.toContainText(/imagem/i)
    })

    test("TST1186 - Salvar na edição sem alteração fica desabilitado", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await abrirEdicao(a, m)
      await expect(m.botaoSalvar).toBeDisabled()
    })

    test("TST1187 - alterar um campo habilita o Salvar", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await abrirEdicao(a, m)
      await m.descricao.fill("Mudou")
      await expect(m.botaoSalvar).toBeEnabled()
    })

    test("TST1188 - salvar a edição atualiza os dados no grid", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await abrirEdicao(a, m)
      await m.descricao.fill("Depois")
      await m.botaoSalvar.click()
      expect(await a.descricoes()).toEqual(["Depois"])
    })
  })

  test.describe("Grid, ordem e exclusão", () => {
    test("TST1157 - anexos seguem a ordem de inserção", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(120000)
      for (const d of ["Primeiro", "Segundo", "Terceiro"]) await incluirAnexo(page, a, m, d)
      expect(await a.descricoes()).toEqual(["Primeiro", "Segundo", "Terceiro"])
    })

    test("TST1158 - texto 'ordem definida abaixo' condiz com o grid (ordem de inserção)", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(120000)
      await expect(a.orientacao).toContainText("ordem definida abaixo")
      for (const d of ["Z - inserido primeiro", "A - inserido depois"]) await incluirAnexo(page, a, m, d)
      // não ordena alfabeticamente: vale a ordem em que foram adicionados
      expect(await a.descricoes()).toEqual(["Z - inserido primeiro", "A - inserido depois"])
    })

    test("TST1159 - vários anexos são listados, cada um com download, nome e ações", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(120000)
      for (const d of ["Um", "Dois", "Três"]) await incluirAnexo(page, a, m, d)
      await expect(a.linhasAnexo).toHaveCount(3)
      for (let i = 0; i < 3; i++) {
        const linha = a.linhasAnexo.nth(i)
        await expect(linha.locator("mat-icon", { hasText: "download" })).toBeVisible()
        await expect(linha).toContainText(/minimo.*\.pdf/i)
        await expect(a.botaoEditar(i)).toBeVisible()
        await expect(a.botaoExcluir(i)).toBeVisible()
      }
    })

    test("TST1161 - excluir remove o anexo do grid", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(120000)
      for (const d of ["Fica", "Sai"]) await incluirAnexo(page, a, m, d)
      await a.botaoExcluir(1).click()
      await expect(a.popupExclusao).toBeVisible()
      await a.popupExclusao.getByRole("button", { name: "Excluir" }).click()
      await expect(a.popupExclusao).toHaveCount(0)
      expect(await a.descricoes()).toEqual(["Fica"])
    })

    test("TST1162 - nome de arquivo longo não quebra o layout", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      const nome = `${"nome_muito_longo_".repeat(10)}.pdf`
      await a.abrirModalAdicionar()
      await m.anexar({ name: nome, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 teste") })
      await expect(m.nomeDoArquivo).toBeVisible()
      await m.descricao.fill("Nome longo")
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)
      await expect(a.linhasAnexo).toHaveCount(1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await expect(a.botaoEditar(0)).toBeInViewport()
    })

    test("TST1163 - tipos de arquivo diferentes aparecem de forma consistente", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(150000)
      const tipos = ["minimo.pdf", "imagem.png", "documento.doc"]
      for (const arq of tipos) await incluirAnexo(page, a, m, `Tipo ${arq}`, arq)
      await expect(a.linhasAnexo).toHaveCount(3)
      for (let i = 0; i < tipos.length; i++) {
        const linha = a.linhasAnexo.nth(i)
        await expect(linha.locator("mat-icon", { hasText: "download" })).toBeVisible()
        await expect(linha).toContainText(new RegExp(tipos[i].split(".")[0]))
      }
    })

    test("TST1165 - cancelar o upload (Fechar > Sair sem salvar) não grava arquivo parcial", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await a.abrirModalAdicionar()
      await m.anexar(arquivo("minimo.pdf")) // espera o upload terminar: só então o formulário conta como alterado
      await m.botaoFechar.click()
      await confirmarSaidaSemSalvar(page)
      await expect(m.titulo).toHaveCount(0)
      await expect(a.linhasAnexo).toHaveCount(0)
    })

    test("TST1166 - várias tentativas de upload seguidas mantêm a tela estável", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      test.setTimeout(120000)
      await a.abrirModalAdicionar()
      for (const arq of ["minimo.pdf", "imagem.png", "documento.doc", "minimo.pdf", "imagem.png"]) {
        await m.anexar(arquivo(arq))
        await expect(m.nomeDoArquivo).toContainText(new RegExp(arq.split(".")[0]))
      }
      await expect(m.titulo).toBeVisible()
    })

    test("TST1169 - clique rápido no Salvar não duplica o registro", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await a.abrirModalAdicionar()
      await m.anexar(arquivo("minimo.pdf"))
      await m.descricao.fill("Clique rápido")
      await m.botaoSalvar.click()
      await m.botaoSalvar.click({ timeout: 1000 }).catch(() => {})
      await m.botaoSalvar.click({ timeout: 1000 }).catch(() => {})
      await page.waitForTimeout(1500)
      await expect(a.linhasAnexo.filter({ hasText: "Clique rápido" })).toHaveCount(1)
    })

    test("TST1170 - vários anexos carregam e listam corretamente", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(240000)
      const total = 8
      for (let i = 1; i <= total; i++) await incluirAnexo(page, a, m, `Anexo ${i}`)
      await expect(a.linhasAnexo).toHaveCount(total)
      expect(await a.descricoes()).toEqual(Array.from({ length: total }, (_, i) => `Anexo ${i + 1}`))
    })
  })

  test.describe("Visual", () => {
    test("TST1172 - modal segue o padrão: Salvar em destaque e Fechar secundário", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await a.abrirModalAdicionar()
      await expect(m.botaoSalvar).toHaveClass(/mat-primary/)
      await expect(m.botaoFechar).toHaveClass(/mat-secondary/)
      await expect(m.botaoSalvarEAdicionarOutro).toHaveClass(/mat-secondary/)
    })

    test("TST1173 - feedback visual ao anexar: nome do arquivo e botão de remover", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m }) => {
      await a.abrirModalAdicionar()
      await m.anexar(arquivo("minimo.pdf"))
      await expect(m.nomeDoArquivo).toContainText(/minimo.*\.pdf/i)
      await expect(m.botaoLimparArquivo).toBeVisible()
      await expect(m.areaDeArquivo).toHaveCount(0)
    })
  })

  test.describe("Auditoria", () => {
    test("TST1189 - tooltip mostra criado por e data; revisor ainda vazio", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, revisor, page }) => {
      await incluirAnexo(page, a, m, "Auditoria")
      const campos = await revisor.camposDoTooltip(revisor.iconeDaLinha(a.linhasAnexo.first()))
      expect(campos.criadoPor).toMatch(/^@\S+ - .+/)
      esperarCriacao(campos)
      esperarRevisao(campos, { editado: false })
    })

    test("TST1190 - editar preenche revisor e data da revisão", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, revisor, page }) => {
      await incluirAnexo(page, a, m, "Antes da revisão")
      await abrirEdicao(a, m)
      await m.descricao.fill("Depois da revisão")
      await m.botaoSalvar.click()
      await expect(m.tituloEdicao).toHaveCount(0)
      const campos = await revisor.camposDoTooltip(revisor.iconeDaLinha(a.linhasAnexo.first()))
      expect(campos.revisadoPor).toMatch(/^@\S+ - .+/)
      esperarRevisao(campos, { editado: true })
    })
  })

  test.describe("Grid de Anexos (TST1192-TST1200)", () => {
    test("TST1192 - anexos incluídos são listados no grid", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Listado no grid")
      await expect(a.linhasAnexo).toHaveCount(1)
      await expect(a.semRegistros).toHaveCount(0)
    })

    test("TST1193 - coluna Anexo: descrição + ícone de download + nome do arquivo", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Coluna anexo")
      const linha = a.linhasAnexo.first()
      await expect(linha.locator("td.cdk-column-descricao")).toHaveText(/Coluna anexo/)
      const celulaArquivo = linha.locator("td.cdk-column-anexo")
      await expect(celulaArquivo.locator("mat-icon", { hasText: "download" })).toBeVisible()
      await expect(celulaArquivo).toContainText(/minimo.*\.pdf/i)
    })

    // o servidor acrescenta um sufixo aleatório ao nome (ex.: minimo_ab12cd.pdf)
    test("TST1194 - o ícone de download baixa o arquivo enviado", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Download")
      const nomeNoGrid = (await a.linhasAnexo.first().locator("td.cdk-column-anexo span").innerText()).trim()
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        a.linhasAnexo.first().locator("td.cdk-column-anexo mat-icon", { hasText: "download" }).click(),
      ])
      expect(download.suggestedFilename()).toBe(nomeNoGrid)
      expect(download.suggestedFilename()).toMatch(/^minimo.*\.pdf$/i)
    })

    // O sistema acrescenta um sufixo aleatório ao nome no upload (aceito pelo time, não é bug): o teste ignora o
    // sufixo e confere o nome-base e a extensão originais. O download sai com o mesmo nome do grid.
    const nomesAlterados: [string, string, string][] = [
      ["minimo.pdf", "minimo", "pdf"],
      ["imagem.png", "imagem", "png"],
      ["foto_e.jpg", "foto_e", "jpg"],
      ["foto_f.jpeg", "foto_f", "jpeg"],
      ["documento.doc", "documento", "doc"],
      ["documento_real.docx", "documento_real", "docx"],
    ]
    for (const [original, base, ext] of nomesAlterados) {
      test(`TST1195 - nome de ${original} no grid e no download (ignorando o sufixo)`, async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
        await incluirAnexo(page, a, m, "Nome", original)

        const nomeNoGrid = (await a.linhasAnexo.first().locator("td.cdk-column-anexo span").innerText()).trim()
        expect(nomeNoGrid).toMatch(new RegExp(`^${base}(_[a-z0-9]+)?\\.${ext}$`))

        const [download] = await Promise.all([
          page.waitForEvent("download"),
          a.linhasAnexo.first().locator("td.cdk-column-anexo mat-icon", { hasText: "download" }).click(),
        ])
        expect(download.suggestedFilename()).toBe(nomeNoGrid)
      })
    }

    test("TST1196 - descrição exibida corresponde ao campo preenchido", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      await incluirAnexo(page, a, m, "Descrição específica 123")
      expect(await a.descricoes()).toEqual(["Descrição específica 123"])
    })

    test("TST1197 - nomes longos (arquivo e descrição) não quebram o layout", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      const nome = `${"nome_muito_longo_".repeat(10)}.pdf`
      const descricao = "descrição muito longa ".repeat(20).trim()
      await a.abrirModalAdicionar()
      await m.anexar({ name: nome, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 teste") })
      await expect(m.nomeDoArquivo).toBeVisible()
      await m.descricao.fill(descricao)
      await m.botaoSalvar.click()
      await expect(m.titulo).toHaveCount(0)

      await expect(a.linhasAnexo).toHaveCount(1)
      // as células cortam com reticências em vez de empurrar as colunas
      // descrição: a própria célula; arquivo: o span do nome (o ícone de download não corta)
      const celulaDescricao = a.linhasAnexo.first().locator("td.cdk-column-descricao")
      const nomeDoArquivo = a.linhasAnexo.first().locator("td.cdk-column-anexo span.mat-tooltip-trigger")
      for (const alvo of [celulaDescricao, nomeDoArquivo]) await expect(alvo).toHaveCSS("text-overflow", "ellipsis")
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await expect(a.botaoEditar(0)).toBeInViewport()
      await expect(a.botaoExcluir(0)).toBeInViewport()
    })

    test("TST1198 - múltiplos anexos são listados, cada um com o seu arquivo", async ({ ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(150000)
      const casos: [string, string, RegExp][] = [
        ["PDF", "minimo.pdf", /minimo.*\.pdf/i],
        ["Imagem", "imagem.png", /imagem.*\.png/i],
        ["Word", "documento.doc", /documento.*\.doc/i],
      ]
      for (const [descricao, arq] of casos) await incluirAnexo(page, a, m, descricao, arq)
      expect(await a.descricoes()).toEqual(["PDF", "Imagem", "Word"])
      for (let i = 0; i < casos.length; i++) await expect(a.linhasAnexo.nth(i)).toContainText(casos[i][2])
    })

    test("TST1200 - grid vazio mostra 'Sem registros para listar.' centralizado, sem erro", async ({ ltcatAnexosPage: a, page }) => {
      await expect(a.semRegistros).toBeVisible()
      await expect(a.linhasAnexo).toHaveCount(0)
      await expect(page.locator("apls-toast")).toHaveCount(0)
      // mede com polling: logo depois de trocar de aba a tela ainda está animando e a posição varia
      await expect
        .poll(async () => {
          const tabela = (await a.tabela.boundingBox())!
          const texto = (await a.semRegistros.boundingBox())!
          return Math.abs(tabela.x + tabela.width / 2 - (texto.x + texto.width / 2))
        })
        .toBeLessThanOrEqual(20)
    })
  })

  // cada teste abaixo cria 1 LTCAT novo no ambiente de homologação (sem rollback)
  test.describe("Persistência (salva o LTCAT)", () => {
    test("TST1199 - grid mantém os dados depois de salvar e reabrir o LTCAT", async ({ ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(240000)
      await c.abrirAba("Referências")
      await c.preencherObrigatorios(ltcatValido)
      await c.preencherConfiguracoesObrigatorias()
      await c.abrirAba("Anexos")
      await incluirAnexo(page, a, m, "Grid persistido", "imagem.png")
      await incluirAnexo(page, a, m, "Segundo persistido", "minimo.pdf")
      await salvarLtcat(c, page)

      await page.reload()
      await c.abrirAba("Anexos")
      expect(await a.descricoes()).toEqual(["Grid persistido", "Segundo persistido"])
      await expect(a.linhasAnexo.nth(0)).toContainText(/imagem.*\.png/i)
      await expect(a.linhasAnexo.nth(1)).toContainText(/minimo.*\.pdf/i)
    })

    test("TST1149/TST1167 - anexo persiste depois de salvar o LTCAT e recarregar a página", async ({ ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(180000)
      await c.abrirAba("Referências")
      await c.preencherObrigatorios(ltcatValido)
      await c.preencherConfiguracoesObrigatorias()
      await c.abrirAba("Anexos")
      await incluirAnexo(page, a, m, "Persistência")
      await salvarLtcat(c, page)

      await page.reload()
      await c.abrirAba("Anexos")
      expect(await a.descricoes()).toEqual(["Persistência"])
      await expect(a.linhasAnexo.first()).toContainText(/minimo.*\.pdf/i)
    })

    test("TST1160 - ordem de inserção persiste depois de salvar e reabrir o LTCAT", async ({ ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
      test.setTimeout(240000)
      await c.abrirAba("Referências")
      await c.preencherObrigatorios(ltcatValido)
      await c.preencherConfiguracoesObrigatorias()
      await c.abrirAba("Anexos")
      for (const d of ["Z - primeiro", "A - segundo", "M - terceiro"]) await incluirAnexo(page, a, m, d)
      await salvarLtcat(c, page)

      await page.reload()
      await c.abrirAba("Anexos")
      expect(await a.descricoes()).toEqual(["Z - primeiro", "A - segundo", "M - terceiro"])
    })

    test("TST1191 - auditoria persiste depois de recarregar", async ({ ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, revisor, page }) => {
      test.setTimeout(180000)
      await c.abrirAba("Referências")
      await c.preencherObrigatorios(ltcatValido)
      await c.preencherConfiguracoesObrigatorias()
      await c.abrirAba("Anexos")
      await incluirAnexo(page, a, m, "Auditoria persistente")
      const antes = await revisor.camposDoTooltip(revisor.iconeDaLinha(a.linhasAnexo.first()))
      await salvarLtcat(c, page)

      await page.reload()
      await c.abrirAba("Anexos")
      const depois = await revisor.camposDoTooltip(revisor.iconeDaLinha(a.linhasAnexo.first()))
      expect(depois.criadoPor).toMatch(/^@\S+ - .+/)
      esperarCriacao(depois)
      expect(depois.criadoPor).toBe(antes.criadoPor)
    })
  })

  test("TST1168 - sair sem salvar descarta os anexos incluídos", async ({ ltcatCadastroPage: c, ltcatAnexosPage: a, ltcatAnexoModal: m, page }) => {
    await incluirAnexo(page, a, m, "Vai ser perdido")
    await c.botaoVoltar.click()
    await confirmarSaidaSemSalvar(page)
    await c.abrir()
    await c.abrirAba("Anexos")
    await expect(a.linhasAnexo).toHaveCount(0)
    await expect(a.semRegistros).toBeVisible()
  })

  // TST1171 (outros navegadores), TST1177 e TST1237 (mockup) foram descartados: os testes rodam só no Edge.
  // Comentado: a tela só valida extensão e tamanho; a EF não define regra para arquivo corrompido.
  // test.fixme("TST1164 - arquivo corrompido", async () => {})

  test.describe("Pendentes (exigem gerar o documento)", () => {
    test.fixme("TST1175 - impacto no documento gerado", async () => {
      // exige gerar o laudo e ler o .docx/.pdf de saída
    })
    test.fixme("TST1176 - título do anexo no documento", async () => {
      // idem TST1175: conferir a descrição como título no arquivo de saída
    })
  })
})
