import type { Page } from "@playwright/test"

// tela "Lista de PGRs" — ponto de partida pra abrir um cadastro novo ou
// existente. Fica separado do login.ts porque vai ser reusado por TODOS os
// specs de aba (Configurações, Anexos, Colaboradores, Conclusão) que ainda
// são só test.fixme() — quando formos implementá-los de verdade, é só
// importar essa mesma função em vez de duplicar a navegação em cada arquivo
const URL_LISTA_PGR = "/apollus/seguranca/programas-laudos/pgr"

export async function abrirNovoCadastroPgr(page: Page) {
  await page.goto(URL_LISTA_PGR)
  // TODO: confirmar se a Região já vem selecionada por padrão pro usuário de
  // teste, ou se precisamos selecionar manualmente antes de clicar em "Novo"
  await page.getByRole("button", { name: "Novo" }).click()
}

// as 5 abas do cadastro (Referências, Configurações, Anexos, Colaboradores,
// Conclusão) são mat-tab do Angular Material — confirmado via inspeção real
// que o role acessível é "tab" (2026-07-23)
export async function abrirAba(page: Page, nome: "Referências" | "Configurações" | "Anexos" | "Colaboradores" | "Conclusão") {
  await page.getByRole("tab", { name: nome }).click()
}

// Angular Material renderiza o <input type="checkbox"> real escondido
// (cdk-visually-hidden) atrás da camada visual do componente, que intercepta
// o clique. Clicar direto no input (mesmo com force) não dispara o listener
// do componente — precisa clicar no <label> visível (o texto), que é o que
// o usuário de verdade clica. Confirmado via inspeção real (2026-07-23).
export async function clicarCheckboxMaterial(page: Page, textoLabel: string) {
  await page.getByText(textoLabel, { exact: true }).click()
}

// Preenche os 4 campos obrigatórios do cabeçalho que faltam (Região já vem
// default) e clica em Salvar — deixa o PGR realmente salvo (com idkey na
// URL), destravando tudo que depende de um cadastro válido: persistência,
// "Gerar PGR", "Duplicar", edição, etc. Sempre usa a PRIMEIRA opção
// disponível em cada select — não importa qual profissional/modelo é,
// só que o formulário fique válido. Confirmado funcionando (2026-07-23).
export async function preencherCadastroValidoESalvar(page: Page) {
  // BUG REAL: "Incluir GHEs sem riscos" nasce marcado, mas o texto padrão do
  // textarea obrigatório associado às vezes não carrega a tempo (race
  // condition), bloqueando o Salvar de qualquer PGR novo. Contornado aqui.
  await page.getByRole("tab", { name: "Configurações" }).click()
  const checkboxGheSemRiscos = page.getByRole("checkbox", { name: "Incluir GHEs sem riscos" })
  const textareaGheSemRiscos = page.getByRole("textbox", { name: /Incluir GHEs sem riscos - Descritivo/ })
  if (await checkboxGheSemRiscos.isChecked() && (await textareaGheSemRiscos.inputValue()) === "") {
    await page.getByRole("button", { name: "Restaurar texto padrão" }).click()
  }

  // os campos abaixo ficam na aba "Referências" — se o teste chamou essa
  // função estando em outra aba (Configurações, Anexos...), garante que
  // navega pra lá primeiro, senão os campos não ficam visíveis/clicáveis
  await page.getByRole("tab", { name: "Referências" }).click()

  // Descoberta (2026-07-23): a Região normalmente já vem pré-preenchida e
  // desabilitada (herdada do contexto do usuário), mas raramente aparece
  // vazia e habilitada, exigindo seleção manual — trata defensivamente
  const campoRegiao = page.getByLabel("Região *")
  if (await campoRegiao.isEnabled().catch(() => false)) {
    const valorRegiao = await campoRegiao.inputValue().catch(() => "")
    if (!valorRegiao) {
      await campoRegiao.click()
      await page.locator("mat-option").first().click()
    }
  }

  // Responsável técnico — select com pesquisa
  await page.getByLabel("Responsável técnico *").click()
  await page.locator("mat-option").first().click()

  // Modelo de documento — select com pesquisa
  await page.getByLabel("Modelo de documento *").click()
  await page.locator("mat-option").first().click()

  // Vigência do programa — campo de intervalo de datas: preenche "Início",
  // Tab pra ir pro "Fim" (não tem um segundo campo separado localizável por
  // label, o foco só avança dentro do mesmo componente) e digita a data fim
  await page.getByPlaceholder("Início").fill("01/01/2026")
  await page.keyboard.press("Tab")
  await page.keyboard.type("31/12/2026")

  // Data base
  await page.getByLabel("Data Base").fill("01/01/2026")

  await page.getByRole("button", { name: "Salvar", exact: true }).click()
  await page.getByText("Registro salvo com sucesso").waitFor({ state: "visible" })
}
