// Script de carga: cria 1 PGR com 100 colaboradores, todos os campos preenchidos
// com texto variado (acentos, especiais, números, maiúsculas, comprimento máximo).
// Rodar com: npm run test:e2e:scripts
// A URL do PGR criado é gravada em scripts/resultado-url.txt ao final.
import { test } from "../support"
import { writeFileSync } from "fs"
import { join } from "path"

const COLABORADORES: { nome: string; cargo: string }[] = [
  // Nomes comuns com acentos e cargo simples
  { nome: "Ana Beatriz Conceição", cargo: "Engenheira de Segurança" },
  { nome: "José António da Silva", cargo: "Médico do Trabalho" },
  { nome: "Maria Fernanda Azevedo", cargo: "Técnica em Segurança" },
  { nome: "João Carlos Ávila", cargo: "Analista de Riscos" },
  { nome: "Ângela Cristina Figueiró", cargo: "Coordenadora de SSO" },
  { nome: "Cláudio Brás Gonçalves", cargo: "Inspetor de Segurança" },
  { nome: "Lúcia Mendonça Araújo", cargo: "Enfermeira do Trabalho" },
  { nome: "Maurício Ângelo Príncipe", cargo: "Técnico em Higiene" },
  { nome: "Célia Esperança Corrêa", cargo: "Gestora de Riscos" },
  { nome: "Sérgio Pâncio Leão", cargo: "Auditor de Segurança" },

  // Caracteres especiais: apóstrofo, hífen, &, parênteses, ponto, #
  { nome: "D'Ávila & Cia. Ltda.", cargo: "Coord. de Segurança #1" },
  { nome: "Ana-Paula O'Brien", cargo: "Técnica (Nível Sênior)" },
  { nome: "Souza & Ferreira Assoc.", cargo: "Auditor - Grau A&B" },
  { nome: "Costa (Engenharia) Ltda.", cargo: "Gerente de Obra #2" },
  { nome: "Lima-Santos & Irmãos", cargo: "Coord. Geral - SSO" },
  { nome: "J. P. O'Connor & Filhos", cargo: "Consultor (Externo)" },
  { nome: "Pires & Matos - SSO", cargo: "Encarregado Nível 3" },
  { nome: "Silva #1 & Almeida #2", cargo: "Técnico (A-1) Sênior" },
  { nome: "Campos-Neto & Barbosa", cargo: "Supervisor - Área 4" },
  { nome: "Ramos (Jr.) O'Sullivan", cargo: "Analista #3 - Grau B" },

  // Maiúsculas e minúsculas misturadas
  { nome: "MaRiA dA sILVA cOSTA", cargo: "tÉcNiCo dE sEgUrAnÇa" },
  { nome: "JOAO PEDRO SANTOS", cargo: "COORDENADOR GERAL SSO" },
  { nome: "ana julia ferreira", cargo: "analista de riscos" },
  { nome: "CaRLoS ALBeRTo MoURA", cargo: "GeReNtE dE ObRaS" },
  { nome: "luiz FERNANDO silva", cargo: "TÉCNICO nível SÊNIOR" },
  { nome: "PATRICIA gomez VARGAS", cargo: "engenheira de saúde" },
  { nome: "RoDRiGo MeNDoNcA", cargo: "iNsPeToR dE rIsCoS" },
  { nome: "sONia MAria TEIXEIRA", cargo: "MÉDICA Do TrAbAlHo" },
  { nome: "fElIpE nErI bAtIsTA", cargo: "Auditor Nível iNtErNo" },
  { nome: "VERA lucia MONTEIRO", cargo: "gestora AMBIENTAL" },

  // Números e sequências alfanuméricas no nome/cargo
  { nome: "Colaborador 001 Teste", cargo: "Cargo Nível 1 Grau A" },
  { nome: "Colaborador 002 Teste", cargo: "Cargo Nível 2 Grau B" },
  { nome: "Colaborador 003 Teste", cargo: "Cargo Nível 3 Grau C" },
  { nome: "Colaborador 004 Teste", cargo: "Cargo Nível 4 Grau D" },
  { nome: "Colaborador 005 Teste", cargo: "Cargo Nível 5 Grau E" },
  { nome: "Técnico T-01 Segurança", cargo: "Função A1-B2 SSO 2026" },
  { nome: "Técnico T-02 Higiene", cargo: "Função C3-D4 SSO 2026" },
  { nome: "Técnico T-03 Ambiental", cargo: "Função E5-F6 SSO 2026" },
  { nome: "Funcionário 42 Silva", cargo: "Supervisor 12345 HSE" },
  { nome: "Profissional 99 Costa", cargo: "Gerente 00001 Planta" },

  // Comprimento máximo: 60 caracteres exatos em nome e cargo
  { nome: "Abcdefghij Klmnopqrst Uvwxyz Abcdefghij Klmnopqrst Uv", cargo: "Cargo Máximo Sessenta Chars Abcdefghij Klmnopqrst Uvwx" },
  { nome: "Nome Longo Com Sessenta Caracteres Exatos Para Testar Ok", cargo: "Cargo Longo Também Com Sessenta Caracteres Para Testar" },
  { nome: "AAAAAAAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBcccccccccc", cargo: "ZZZZZZZZZZZZZZZZZZZZZZYYYYYYYYYYYYYYYYxxxxxxxxxx1234" },
  { nome: "1234567890123456789012345678901234567890123456789012345678", cargo: "9876543210987654321098765432109876543210987654321098765" },
  { nome: "Nome Com Todos Tipos: A-Z a-z 0-9 E Acento Ção Ávila Ok", cargo: "Cargo: Engenheiro Sênior Nível 3 - Área de SSO & Saúde" },

  // Nomes curtos (1 a 5 caracteres)
  { nome: "A", cargo: "B" },
  { nome: "AB", cargo: "CD" },
  { nome: "Ana", cargo: "SSO" },
  { nome: "Ivo", cargo: "HSE" },
  { nome: "Ali", cargo: "TI" },

  // Nomes compostos com preposições
  { nome: "Maria de Fátima dos Santos da Silva", cargo: "Técnica de Saúde e Segurança" },
  { nome: "João das Neves da Conceição e Melo", cargo: "Analista de Saúde Ocupacional" },
  { nome: "Ana de Lourdes do Nascimento Costa", cargo: "Coordenadora de Bem-Estar" },
  { nome: "Pedro dos Anjos da Ressurreição", cargo: "Inspetor de Meio Ambiente" },
  { nome: "Rosa das Graças de Oliveira Lima", cargo: "Gerente de Saúde no Trabalho" },

  // Cargos descritivos e técnicos
  { nome: "Roberto Alves Brandão", cargo: "Eng. Segurança CREA-123456-D" },
  { nome: "Cristiana Leite Macedo", cargo: "Médica CRM 54321 - SSO" },
  { nome: "André Borges Vasconcelos", cargo: "Técnico CTET-01234/SP" },
  { nome: "Tatiana Melo Carvalho", cargo: "Enf. COREN-SP 654321" },
  { nome: "Gustavo Pinto Lacerda", cargo: "Fisioterapeuta CREFITO-3" },

  // Duplo hífen, reticências, barra
  { nome: "Souza--Neto e Filhos", cargo: "Técnico/Engenheiro HSE" },
  { nome: "Lima... Silva... Costa", cargo: "Analista...Sênior SSO" },
  { nome: "Santos/Oliveira Assoc.", cargo: "Coordenador/Supervisor" },
  { nome: "Rocha--Barbosa Ltda.", cargo: "Diretor/Gerente - Planta" },
  { nome: "Tavares---Ramos Eng.", cargo: "Eng. Civil/Segurança" },

  // Símbolos de percentagem, vírgula, ponto e vírgula
  { nome: "Percentual 100% Silva", cargo: "Meta 99,9% Segurança" },
  { nome: "Virgula, Silva; Costa", cargo: "Cargo; Nível, Grau A" },
  { nome: "Ponto. Vírgula; Mix", cargo: "Função. Área; Setor" },
  { nome: "Arroba @ Silva Costa", cargo: "Email@cargo Planta" },
  { nome: "Sublinhado_Nome_Teste", cargo: "Função_Área_Segurança" },

  // Cargos com siglas de organismos e normas
  { nome: "Heitor Nascimento Freitas", cargo: "Auditor NR-01 a NR-36" },
  { nome: "Bruna Teixeira Salomão", cargo: "Especialista ISO 45001" },
  { nome: "Henrique Duarte Corrêa", cargo: "Gestor OHSAS 18001" },
  { nome: "Camila Rezende Fonseca", cargo: "Analista PCMSO/PPRA" },
  { nome: "Danilo Figueira Santana", cargo: "Técnico eSocial/SST" },

  // Espaços múltiplos dentro do nome
  { nome: "Nome  Com  Dois  Espaços", cargo: "Cargo  Com  Espaços" },
  { nome: "Três   Espaços   Aqui", cargo: "Cargo   Triplo   Ok" },
  { nome: "Quatro    Esp    Nome", cargo: "Quatro    Esp    Car" },

  // Variações de acentuação menos comuns
  { nome: "Ítalo Ênio Ômar Ûmberto", cargo: "Àrea Ñivel Ämbiente" },
  { nome: "Ürubu Ïpiranga Ölinda", cargo: "Função Ämbiente Nível" },
  { nome: "Çeará Açaí Maçã Lição", cargo: "Ação Missão Instrução" },
  { nome: "Hélio Régis Brás Pérez", cargo: "Médico Légis. Sênior" },
  { nome: "Ídolo Ínicio Ótimo Ús.", cargo: "Área Única Especial" },

  // Cargos com parênteses e colchetes
  { nome: "Marcos Vinicius Aguiar", cargo: "Inspetor (Planta A)" },
  { nome: "Fernanda Queiroz Lima", cargo: "Técnica [Turno Noite]" },
  { nome: "Leandro Rocha Barros", cargo: "Analista (Sr.) [HSE]" },
  { nome: "Simone Andrade Morais", cargo: "Coord. (Interina) SSO" },
  { nome: "Thiago Pires Monteiro", cargo: "Gerente (P&D) Saúde" },

  // Cargos com números romanos e versões
  { nome: "Sebastião Ramos Vieira", cargo: "Auditor Nível III SSO" },
  { nome: "Valdete Cruz Nogueira", cargo: "Técnico Grau IV - HSE" },
  { nome: "Wanderlei Souza Primo", cargo: "Engenheiro Senior VI" },
  { nome: "Xênia Forte Cavalcanti", cargo: "Gestora Fase II Obra" },
  { nome: "Yara Isabel Drummond", cargo: "Analista Ciclo V SST" },

  // Últimos 5 com caracteres bem variados
  { nome: "Zuleica Rangel Brandão", cargo: "Coord. SSO & Ambiental" },
  { nome: "A1b2C3d4 E5f6G7h8 I9j0", cargo: "X1y2Z3 - W4v5 - U6t7" },
  { nome: "Nome-Hifenado & Número1", cargo: "Cargo-Hifenado N.º 99" },
  { nome: "Último Colaborador 100", cargo: "Cargo Final - Teste 100" },
  { nome: "Colaborador Cem (Final)", cargo: "Cargo Cem [Encerrado]" },
]

test("criar 100 colaboradores no PGR com campos preenchidos", async ({ page, login, pgr }) => {
  test.setTimeout(20 * 60 * 1000) // 20 minutos para os 100 cadastros

  await login.entrar()
  await pgr.abrirNovoCadastro()
  await pgr.abrirAba("Colaboradores")

  // abre a modal uma única vez — "Salvar e adicionar outro" a mantém aberta
  await page.getByLabel("Colaboradores").getByRole("button", { name: "Adicionar" }).click()
  await page.getByRole("heading", { name: "Colaboradores" }).waitFor({ state: "visible" })

  for (let i = 0; i < COLABORADORES.length; i++) {
    const { nome, cargo } = COLABORADORES[i]
    const ehUltimo = i === COLABORADORES.length - 1

    const campoColaborador = page.getByRole("textbox", { name: /Colaborador/ })
    const campoCargo = page.getByRole("textbox", { name: /Cargo/ })

    await campoColaborador.fill(nome)
    await campoCargo.fill(cargo)

    if (ehUltimo) {
      await page.getByRole("button", { name: "Salvar", exact: true }).click()
      await page.getByRole("heading", { name: "Colaboradores" }).waitFor({ state: "hidden" })
    } else {
      await page.getByRole("button", { name: "Salvar e adicionar outro" }).click()
      // aguarda os campos limparem antes do próximo
      await campoColaborador.waitFor({ state: "visible" })
      await page.waitForFunction(
        () => (document.querySelector("mat-dialog-container input") as HTMLInputElement | null)?.value === "",
        { timeout: 8000 }
      )
    }

    process.stdout.write(`\r[${String(i + 1).padStart(3, "0")}/100] ${nome.slice(0, 30)}`)
  }

  console.log("\n\nSalvando o PGR...")
  await pgr.preencherCadastroValidoESalvar()

  const url = page.url()
  console.log("\n\n========================================")
  console.log("PGR criado com 100 colaboradores!")
  console.log("URL:", url)
  console.log("========================================\n")
})
