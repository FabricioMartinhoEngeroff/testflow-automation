# Testes de redação (Writing Tests)

Testes Playwright executam ações e afirmam o estado em relação a expectativas. O Playwright aguarda automaticamente as verificações de viabilidade antes de cada ação — sem esperas manuais, sem condições de corrida.

## Primeiro teste

```ts
// tests/exemplo.spec.ts
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
```

> Em JS no VS Code, adicione `// @ts-check` no topo do arquivo para checagem de tipos automática.

## Ações

**Navegação** — `await page.goto(url)` aguarda o carregamento da página antes de continuar.

**Interações** — localizam elementos via Locators, que representam "como encontrar" um elemento a qualquer momento. O Playwright espera o elemento ficar "acionável" (actionable) antes de agir.

```ts
const getStarted = page.getByRole('link', { name: 'Get started' });
await getStarted.click();
// ou, na forma mais comum, tudo em uma linha:
await page.getByRole('link', { name: 'Get started' }).click();
```

### Ações básicas

| Ação | Descrição |
|---|---|
| `locator.check()` | Marca a checkbox |
| `locator.click()` | Clica no elemento |
| `locator.uncheck()` | Desmarca a checkbox |
| `locator.hover()` | Passa o mouse sobre o elemento |
| `locator.fill()` | Preenche o campo com texto |
| `locator.focus()` | Foca no elemento |
| `locator.press()` | Pressiona uma tecla |
| `locator.setInputFiles()` | Seleciona arquivos para upload |
| `locator.selectOption()` | Seleciona opção em um dropdown |

## Asserções

`expect()` com comparadores assíncronos que aguardam a condição ser atendida — elimina timeouts instáveis.

```ts
await expect(page).toHaveTitle(/Playwright/);
```

| Asserção | Descrição |
|---|---|
| `expect(locator).toBeChecked()` | Checkbox marcada |
| `expect(locator).toBeEnabled()` | Controle habilitado |
| `expect(locator).toBeVisible()` | Elemento visível |
| `expect(locator).toContainText()` | Elemento contém texto |
| `expect(locator).toHaveAttribute()` | Elemento tem atributo |
| `expect(locator).toHaveCount()` | Lista tem X elementos |
| `expect(locator).toHaveText()` | Elemento corresponde ao texto |
| `expect(locator).toHaveValue()` | Input tem valor |
| `expect(page).toHaveTitle()` | Página tem título |
| `expect(page).toHaveURL()` | Página tem URL |

Comparadores genéricos síncronos (sem `await`): `toEqual`, `toContain`, `toBeTruthy`, etc. — usados para checar valores já disponíveis.

```ts
expect(success).toBeTruthy();
```

## Isolamento de teste

Cada teste roda em um `BrowserContext` novo (equivalente a um perfil de navegador do zero) — testes não compartilham estado entre si, mesmo rodando no mesmo worker.

```ts
import { test } from '@playwright/test';

test('example test', async ({ page }) => {
  // "page" pertence a um BrowserContext isolado, criado só para este teste
});

test('another test', async ({ page }) => {
  // "page" aqui é totalmente isolado do teste anterior
});
```

## Hooks de teste

- `test.describe()` — agrupa testes
- `test.beforeEach()` / `test.afterEach()` — antes/depois de **cada** teste
- `test.beforeAll()` / `test.afterAll()` — uma vez por **worker**, antes/depois de todos os testes

```ts
import { test, expect } from '@playwright/test';

test.describe('navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://playwright.dev/');
  });

  test('main navigation', async ({ page }) => {
    await expect(page).toHaveURL('https://playwright.dev/');
  });
});
```
