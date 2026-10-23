# Paralelismo

Testes rodam em paralelo via múltiplos workers. Por padrão, **arquivos** de teste rodam em paralelo; testes **dentro** do mesmo arquivo rodam em ordem, no mesmo worker.

- `test.describe.configure()` — paraleliza testes dentro de um único arquivo.
- `fullyParallel` (config ou por projeto) — paraleliza tudo, em todos os arquivos.
- Limitar `workers` a 1 desativa o paralelismo.

## Workers

São processos de SO independentes, orquestrados pelo test runner. Ambientes idênticos, cada um sobe seu próprio navegador. **Não há comunicação entre workers.** O runner reutiliza um worker sempre que possível (vários arquivos podem rodar em sequência no mesmo worker). Após uma falha, o worker é encerrado para garantir ambiente limpo para os testes seguintes.

## Limitar número de workers

```bash
npx playwright test --workers 4
```
```ts
export default defineConfig({
  workers: process.env.CI ? 2 : undefined,
});
```

## Desativar paralelismo

```bash
npx playwright test --workers=1
```
Relevante pro projeto atual: `e2e/playwright.config.ts` já usa **1 worker, sem paralelismo**, porque o alvo é o sistema PGR real (ambiente externo compartilhado) — rodar em paralelo poderia causar interferência entre sessões/logins concorrentes.

## Paralelizar testes dentro de um arquivo

```ts
import { test } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });

test('runs in parallel 1', async ({ page }) => { /* ... */ });
test('runs in parallel 2', async ({ page }) => { /* ... */ });
```

Testes paralelos rodam em workers separados e **não compartilham estado**; cada um roda seus próprios `beforeAll`/`afterAll`.

Ou globalmente via config:
```ts
export default defineConfig({ fullyParallel: true });
```

Ou só para um projeto:
```ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] }, fullyParallel: true },
]
```

## Modo serial

Para testes interdependentes — se um falhar, os seguintes do grupo são pulados; todos são re-tentados juntos. **Não recomendado** em geral (prefira isolar testes).

```ts
import { test, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});
test.afterAll(async () => {
  await page.close();
});

test('runs first', async () => {
  await page.goto('https://playwright.dev/');
});
test('runs second', async () => {
  await page.getByText('Get Started').click();
});
```

## Desligar `fullyParallel` para um describe específico

```ts
test.describe('runs in parallel with other describes', () => {
  test.describe.configure({ mode: 'default' });
  test('in order 1', async ({ page }) => {});
  test('in order 2', async ({ page }) => {});
});
```

## Sharding (múltiplas máquinas)

```bash
npx playwright test --shard=2/3
```

## Limitar falhas (fail fast)

```bash
npx playwright test --max-failures=10
```
```ts
export default defineConfig({
  maxFailures: process.env.CI ? 10 : undefined,
});
```
Para quando atinge o número de falhas, ignorando o resto — evita desperdiçar recursos em uma suíte quebrada.

## Índice de worker e índice paralelo

- `workerIndex` — único, começa em 1; muda se o worker reinicia após falha.
- `parallelIndex` — entre `0` e `workers - 1`; mantido após reinício.
- Disponíveis via env (`TEST_WORKER_INDEX`, `TEST_PARALLEL_INDEX`) ou `testInfo.workerIndex` / `testInfo.parallelIndex`.

### Isolar dados de teste entre workers

Útil para não colidir dados/usuários de teste entre workers paralelos:

```ts
// playwright/fixtures.ts
import { test as baseTest, expect } from '@playwright/test';
import { createUserInTestDatabase, deleteUserFromTestDatabase } from './my-db-utils';

export * from '@playwright/test';
export const test = baseTest.extend<{}, { dbUserName: string }>({
  dbUserName: [async ({ }, use) => {
    const userName = `user-${test.info().workerIndex}`;
    await createUserInTestDatabase(userName);
    await use(userName);
    await deleteUserFromTestDatabase(userName);
  }, { scope: 'worker' }],
});
```
```ts
// tests/exemplo.spec.ts
import { test, expect } from '../playwright/fixtures';

test('test', async ({ dbUserName }) => {
  // usa o nome do usuário no teste
});
```

## Controlando a ordem dos testes

Dentro de um arquivo, a ordem é a de declaração (a menos que paralelizado). Entre arquivos, não há garantia de ordem quando roda em paralelo. Para controlar:

- **Nomear arquivos em ordem alfabética** (com paralelismo desativado): `001-user-signin-flow.spec.ts`, `002-create-new-document.spec.ts`, etc.
- **Arquivo de "lista de testes"** (desencorajado — extensão VS Code e trace podem não funcionar direito):

```ts
// feature-a.spec.ts
export default function createTests() {
  test('feature-a example test', async ({ page }) => { /* ... */ });
}
```
```ts
// test.list.ts
import { test } from '@playwright/test';
import featureBTests from './feature-b.spec.ts';
import featureATests from './feature-a.spec.ts';

test.describe(featureBTests);
test.describe(featureATests);
```
```ts
export default defineConfig({
  workers: 1,
  testMatch: 'test.list.ts',
});
```
