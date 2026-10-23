# Melhores práticas

## Filosofia de teste

**Teste o comportamento visível ao usuário.** Verifique se o app funciona para o usuário final, não detalhes de implementação (nome de função, se algo é array, classe CSS). O usuário só vê/interage com a saída renderizada — o teste deve fazer o mesmo.

**Isole os testes ao máximo.** Cada teste com seu próprio localStorage, sessionStorage, dados, cookies. Isolamento melhora reprodutibilidade, facilita debug e evita falhas em cascata. Use `beforeEach`/`afterEach` pra não repetir setup (ex: login) em cada teste — mas duplicação simples também é aceitável se deixar o teste mais claro:

```ts
test.beforeEach(async ({ page }) => {
  await page.goto('https://github.com/login');
  await page.getByLabel('Username or email address').fill('username');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
});

test('first', async ({ page }) => { /* já logado */ });
test('second', async ({ page }) => { /* já logado */ });
```
Melhor ainda: reusar estado de login via projeto de setup (ver [[11-autenticacao]]) — loga uma vez só, pula o passo em todos os testes.

**Evite testar dependências de terceiros.** Teste só o que você controla — não links pra sites externos. Além de deixar o teste lento, você não controla o conteúdo, banners de cookies, overlays etc. da página de terceiros. Em vez disso, mocke a rede:

```ts
await page.route('**/api/fetch_data_third_party_dependency', route => route.fulfill({
  status: 200,
  body: testData,
}));
await page.goto('https://example.com');
```

**Testando com banco de dados**: controle os dados, teste em ambiente de staging que não muda. Pra regressão visual, garanta mesma versão de SO e navegador entre execuções.

## Boas práticas de localizadores

**Use localizadores nativos** (espera automática + retry embutidos), priorizando atributos voltados ao usuário:
```ts
// 👍
page.getByRole('button', { name: 'submit' });
```

**Encadeie e filtre** pra restringir a busca:
```ts
const product = page.getByRole('listitem').filter({ hasText: 'Product 2' });

await page.getByRole('listitem')
  .filter({ hasText: 'Product 2' })
  .getByRole('button', { name: 'Add to cart' })
  .click();
```

**Prefira atributos visíveis ao usuário a CSS/XPath** — o DOM muda fácil e quebra o teste:
```ts
// 👎 — se a classe CSS mudar (ex: refactor de design), o teste quebra
page.locator('button.buttonIcon.episode-actions-later');

// 👍 — resiliente a mudanças de implementação
page.getByRole('button', { name: 'submit' });
```

**Gerar localizadores com Codegen** — analisa a página e prioriza role/texto/test-id, refinando automaticamente quando há ambiguidade:
```bash
npx playwright codegen playwright.dev
```
Clique "Record" pra parar a gravação → "Pick Locator" fica disponível → hover nos elementos mostra o marcador → clique adiciona o localizador ao inspector, editável ali mesmo. A extensão do VS Code oferece o mesmo fluxo integrado ao editor.

## Use asserções "web-first"

Aguardam a condição ser atendida, evitando flakiness:
```ts
// 👍 — espera e re-tenta se necessário
await expect(page.getByText('welcome')).toBeVisible();

// 👎 — checa uma vez, na hora, sem esperar nada (o await está dentro do isVisible(), não antes do expect)
expect(await page.getByText('welcome').isVisible()).toBe(true);
```

## Depuração

**Local**: extensão do VS Code — clique com botão direito na linha do teste → rodar em modo debug (abre navegador, pausa no breakpoint); editar um localizador no editor já destaca ele (e outros matches) na página em tempo real.

Ou via Inspector:
```bash
npx playwright test --debug
npx playwright test example.spec.ts:9 --debug   # arquivo + linha específica
```
Percorre passo a passo, mostra call log, permite editar localizador em tempo real vendo quantos elementos casam.

**CI**: prefira o **trace viewer** a vídeo/screenshot — dá timeline completa, snapshot do DOM por ação (inspecionável com devtools), requests de rede, tudo num PWA local compartilhável. Configure trace pra rodar só na **primeira retry de um teste que falhou** (`on-first-retry`) — **não** use `on` pra todos os testes, o overhead de performance não compensa.
```bash
npx playwright test --trace on     # trace local, todos os testes (uso pontual em dev)
npx playwright show-report         # abre o relatório HTML com os traces
```
Abrir o trace: ícone ao lado do nome do arquivo no relatório, ou rolar até a seção de traces dentro de cada teste.

## Ferramentas do Playwright

- **Extensão VS Code** — escrever/rodar/depurar direto no editor.
- **Codegen** — gera testes e localizadores.
- **Trace viewer** — registro completo, PWA local compartilhável.
- **Modo UI** — exploração imersiva com "viagem no tempo" e watch mode (ver [[00-modo-interface-usuario]]).
- **TypeScript** — funciona sem config extra, melhor autocomplete/erros na IDE; não precisa saber TS de verdade, só usar extensão `.ts`.

## Teste em todos os navegadores

```ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```
Garante que o app funcione pra todo mundo, independente da plataforma.

## Manter o Playwright atualizado

```bash
npm install -D @playwright/test@latest
npx playwright --version
```
Versão atualizada = testar contra os navegadores mais recentes e pegar regressões antes do release público. Ver release notes pra saber o que mudou.

## Rodando em CI

Configure CI/CD e rode a cada commit/PR — quanto mais frequente, melhor. O Playwright já vem com workflow pronto do GitHub Actions (ver [[04-configurando-ci]]), mas funciona em qualquer provedor.

- **Use Linux no CI** (mais barato) — localmente qualquer SO serve.
- **Sharding** acelera o CI: `npx playwright test --shard=1/3`.
- **Instale só os navegadores que usa** — economiza tempo/disco:
  ```bash
  # em vez de instalar tudo
  npx playwright install --with-deps
  # instale só o necessário
  npx playwright install chromium --with-deps
  ```

## Lint

TypeScript + ESLint pra pegar erro cedo. Regra `@typescript-eslint/no-floating-promises` pega `await` faltando antes de chamadas assíncronas da API do Playwright — bug comum e sutil (parece o exemplo do `isVisible()` acima). No CI, rode também `tsc --noEmit` pra garantir assinatura de função correta.

## Paralelismo e sharding

Por padrão já roda em paralelo (ver [[07-paralelismo]]). Pra paralelizar testes dentro de um mesmo arquivo:
```ts
test.describe.configure({ mode: 'parallel' });
test('runs in parallel 1', async ({ page }) => { /* ... */ });
test('runs in parallel 2', async ({ page }) => { /* ... */ });
```
Sharding entre máquinas: `npx playwright test --shard=1/3`.

> **Nota do projeto**: `e2e/playwright.config.ts` roda deliberadamente com `workers: 1` / sem paralelismo, porque o alvo é o sistema PGR real e concorrência poderia causar interferência entre sessões — ver [[07-paralelismo]] e [[project_testes_automatizados_playwright]]. Boa parte das dicas de paralelismo/sharding aqui não se aplicam a esse projeto por enquanto.

## Produtividade: asserções flexíveis (soft)

```ts
await expect.soft(page.getByTestId('status')).toHaveText('Success');
await page.getByRole('link', { name: 'next page' }).click();
// continua mesmo se a asserção soft acima falhou; falhas soft aparecem juntas no final
```
Ver detalhes completos em [[10-afirmacoes]].
