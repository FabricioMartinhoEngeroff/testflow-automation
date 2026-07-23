# Executar e depurar testes

Por padrão os testes rodam em paralelo e em modo headless (sem janela de navegador visível), com resultados no terminal.

## Executando testes

**Linha de comando:**
```bash
npx playwright test
```
Roda em todos os navegadores configurados no `playwright.config`.

**Modo UI (recomendado)** — ver passo a passo, antes/depois de cada ação, seletor de localizador, modo de observação:
```bash
npx playwright test --ui
```

**Modo headed** — mostra a janela do navegador durante a execução:
```bash
npx playwright test --headed
```

**Navegador específico:**
```bash
npx playwright test --project webkit
npx playwright test --project webkit --project firefox   # múltiplos
```

**Testes específicos:**
```bash
npx playwright test landing-page.spec.ts          # um arquivo
npx playwright test tests/todo-page/ tests/landing-page/   # diretórios
npx playwright test landing login                 # arquivos que contêm essas palavras no nome
npx playwright test -g "add a todo item"           # por título do teste
```

**Reexecutar só o que falhou:**
```bash
npx playwright test --last-failed
```
Guarda a lista de falhas em `<outputDir>/.last-run.json`. Path customizado: `--last-failed-file=<path>` ou env `PLAYWRIGHT_LAST_RUN_OUTPUT_FILE`.

**No VS Code** — extensão oficial do Playwright: clique no triângulo verde ao lado do teste, ou rode todos pela barra lateral de testes.

## Depurando testes

Como roda em Node.js, dá pra depurar com `console.log`, a extensão do VS Code, ou as ferramentas nativas do Playwright.

**Modo UI (recomendado para depuração):**
```bash
npx playwright test --ui
```
Permite ver localizador escolhido, editar o localizador no ambiente de testes e ver destacado em tempo real na página, copiar o localizador.

**Playwright Inspector:**
```bash
npx playwright test --debug                       # todos os testes
npx playwright test example.spec.ts --debug        # um arquivo
npx playwright test example.spec.ts:10 --debug     # linha específica (via número da linha do test())
```
Abre janela do navegador + Inspector. Botão "Avançar" percorre passo a passo; "Reproduzir" roda do início ao fim; ao terminar, a janela fecha.

## Relatório de testes (HTML Reporter)

Abre automaticamente se algum teste falhar; senão:
```bash
npx playwright show-report
```
Filtra por navegador, aprovados/reprovados/ignorados/instáveis. Clique em um teste para ver erros e cada etapa.
