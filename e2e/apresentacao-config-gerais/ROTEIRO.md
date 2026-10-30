# Apresentação — LTCAT > Referências > Configurações Gerais

Suíte completa: `specs/seguranca/programas-e-laudos/ltcat/referencias-configuracoes-gerais.spec.ts`
(127 testes, gerados a partir da EF 5.1). Para a apresentação foi gravada uma seleção de 13.

## Como abrir no dia (nada roda no Apollus, não trava)

No Git Bash:

```
cd "/c/Users/PC/Desktop/Testes Automatizados/e2e"
npx playwright show-report apresentacao-config-gerais/relatorio
```

- Abre no navegador o relatório com os 13 testes. Clique num teste → vídeo, print e **trace**.
- O trace (linha do tempo com cada passo e a tela antes/depois) também abre sozinho:
  `npx playwright show-trace "apresentacao-config-gerais/resultados/<pasta do teste>/trace.zip"`
- Para fechar o relatório: Ctrl+C no terminal.

Para gravar de novo (leva ~30 min, PC fica ocupado; apaga a gravação anterior):
`npx playwright test -c playwright.apresentacao-config-gerais.config.ts`
Pausa entre ações: `SLOWMO=1500 npx playwright test -c ...` (padrão 800 ms).

## Roteiro (~20 min)

### 1. Abertura (2 min)
- O que é a seção: Modelo de documento, Vigência do laudo, 4 checkboxes + histórico de revisões, Expostos.
- Números: **127 testes** só nesta seção, cada um ligado a um TST da planilha; 24 arquivos de teste no LTCAT, ~570 testes.

### 2. Como o Playwright funciona (3 min) — mostrar no código
- **Abre um navegador de verdade** e faz o que o usuário faria. Cada teste começa fazendo login e abrindo um LTCAT novo (`test.beforeEach`, linha 60).
- **Acha os campos pelo que aparece na tela**, não por código interno:
  `getByRole("combobox", { name: "Modelo de documento *" })` (`LTCATReferencias.ts:140`).
  Se mudarem o nome do campo na tela, o teste percebe.
- **Espera sozinho**: `expect(...).toBeVisible()` tenta de novo até a tela ficar pronta. Nada de "esperar 5 segundos".
- **Digita como gente**: `pressSequentially("31122026")` digita tecla por tecla, e a máscara do campo reage igual reagiria a uma pessoa.

### 3. Seção (2 min)
| Teste | O que falar |
|---|---|
| TST885/TST886 — todos os componentes visíveis | O teste mais simples: confere que tudo da EF está na tela. |
| TST888 — resolução reduzida | O teste **diminui a janela** para 768px (`setViewportSize`) e mede se surgiu rolagem horizontal executando JavaScript dentro da página (`page.evaluate`). Isso ninguém confere à mão em todo build. |

### 4. Modelo de documento (4 min) — a parte mais difícil (só código, sem vídeo)
Na gravação de 29/10 os dois TST891 **não chegaram a testar o modelo**: o cabeçalho do cadastro abriu com os nomes
Região/Unidade/Setor em branco (`*` e `undefined`) e ficou assim por 10 minutos (ver "Problema do Apollus" no fim).
Não mostre esses vídeos; explique pelo código (linhas 142-169):

| Teste | O que falar |
|---|---|
| TST891 — Argentina + Unidade 7003 traz o modelo | Regra de **abrangência**: o modelo QA-AUT-57265 só deve aparecer para algumas Unidades. O catálogo carrega em etapas (primeiro os corporativos), então o teste usa `expect.poll` (função `opcoesEstaveis`, linha 45): fica olhando a lista até ela parar de mudar. Sem isso o teste leria a lista pela metade. |
| 🐞 TST891 — Curitiba + Unidade 711001 | **Bug encontrado em 20/10**: o modelo com abrangência só na 711005 aparece na 711001. Pela EF não deveria. Marcado com `test.fail`: o teste "espera falhar" enquanto o bug existir. |

### 5. Vigência do laudo (3 min)
| Teste | O que falar |
|---|---|
| TST905 — fim menor que o início | Digita 31/12/2026 e 01/01/2026, sai do campo com TAB e confere o alerta com o texto exato da EF e o campo vermelho. |
| TST908 — data inválida 32/13/2026 | Mesmo padrão: alerta de data inválida + campo vermelho. |
| TST910 — período pelo teclado | O mais bonito de assistir: abre o calendário e **só usa o teclado** (Enter, seta, seta, Enter). Confere que o período virou hoje → hoje+2, com a data calculada pelo próprio teste. |

### 6. Checkboxes (3 min)
| Teste | O que falar |
|---|---|
| TST939 — cliques rápidos | Clica 5 vezes seguidas e confere que o estado final é consistente. Obs.: no vídeo os cliques ficam lentos por causa da pausa da gravação; na execução normal são instantâneos. |
| TST922/923/924 — histórico habilita | Antes do teste, abre a modal **Revisões**, inclui uma revisão e salva (`beforeEach` da linha 442). Só então o checkbox "Incluir histórico de revisões" libera. Mostra o teste atravessando modal → seção. |
| TST925 — volta a bloquear | Marca o histórico, volta na modal, **exclui a revisão** e salva: o checkbox volta desmarcado e bloqueado. Regra de negócio entre duas partes da tela. |

### 7. Expostos (3 min)
| Teste | O que falar |
|---|---|
| TST969/TST997 — TAB na ordem | Acessibilidade: o TAB passa Mulheres → Homens → PCDs. |
| ✅ TST1025 — help de PCDs | Em 20/10 o help dizia "quantidade pessoas com deficiência" (faltava o "de") e o teste ficou marcado com `test.fail`. **Em 29/10 o texto foi corrigido** e o Playwright avisou sozinho: "Expected to fail, but passed". |
| ✅ TST971/TST999 — 9999999999 | Em 20/10: a EF permite 10 dígitos, a tela aceitava, mas a API só aguentava até 2147483647 e o salvar dava "Ocorreu um erro inesperado" (400). **Em 29/10 salvou**: no trace → aba **Network**, o PUT `/higiene-ltcat/ltcat_ghe/ltcat` responde **200** com `"expostosHomens": 9999999999`. Esse é o momento "uau": o teste registrou o bug e avisou quando foi corrigido. |

Os outros campos de Expostos são testados com 12 entradas diferentes (negativo, decimal, letras, colar...) geradas
em laço (linha 576): mostrar a tabela `ENTRADAS` para explicar como 1 bloco de código vira dezenas de testes.

### 8. Fechamento (1 min)
- Trace: abrir um teste e mostrar a linha do tempo (antes/depois de cada clique, console, rede).
- Bugs: 1 ainda registrado (TST891), 2 que a automação detectou como corrigidos (TST1025, TST971).
- Pergunta para a equipe: quais telas automatizar depois.

## Resultado da gravação de 29/10 (27,8 min)
- 9 passaram: TST885/886, TST888, TST905, TST908, TST910, TST939, TST922-924, TST925, TST969/997.
- 2 TST891 falharam por timeout esperando o campo "Região *" (problema do Apollus abaixo).
- TST1025 e TST971/999 aparecem como **failed** no relatório com "Expected to fail, but passed":
  é o `test.fail` avisando que os bugs foram corrigidos. O `test.fail` desses dois ainda precisa ser retirado do spec.

## Problema do Apollus: cabeçalho sem os nomes dos campos
Ao abrir um LTCAT novo, às vezes o cabeçalho mostra `*` no lugar de "Região *" e `undefined` no lugar de Unidade
e Setor, e não se recupera (10 min na gravação). As chamadas ao servidor são as mesmas de quando funciona.
Visto 3 vezes em 29/10 (TST1149 dos Anexos e os dois TST891). Vídeos em
`resultados/referencias-configuracoes--ec5be--Unidade-7003-traz-o-modelo-ltcat/video.webm`.

## Se algo der errado
- Relatório não abre → conferir se está na pasta `e2e` (prompt termina em `/e2e`).
- Não rode testes ao vivo nesse PC; se quiser, rode só um com `--ui` e tenha o vídeo como reserva.
