# Afirmações (Assertions)

`expect(value)` + um comparador (matcher) que reflete a expectativa. Existem comparadores genéricos (`toEqual`, `toContain`, `toBeTruthy`, ...) e comparadores assíncronos "web-first", que aguardam a condição ser atendida antes de falhar.

```ts
expect(success).toBeTruthy();  // genérico, síncrono

await expect(page.getByTestId('status')).toHaveText('Submitted');  // web-first, assíncrono
```

No segundo exemplo, o Playwright busca o elemento repetidamente e testa de novo até o texto bater ou o timeout estourar (padrão: **5s**, configurável globalmente em `testConfig.expect` ou por chamada).

## Asserções com retry automático (`await expect(locator)...`)

Repetem até passar ou até o timeout — **sempre precisam de `await`**.

| Asserção | Descrição |
|---|---|
| `toBeAttached()` | Elemento está no DOM |
| `toBeChecked()` | Checkbox marcada |
| `toBeDisabled()` / `toBeEnabled()` | Desabilitado / habilitado |
| `toBeEditable()` | Editável |
| `toBeEmpty()` | Container vazio |
| `toBeFocused()` | Focado |
| `toBeHidden()` / `toBeVisible()` | Invisível / visível |
| `toBeInViewport()` | Intersecta o viewport |
| `toContainText()` | Contém texto |
| `toContainClass()` | Tem classes CSS específicas |
| `toHaveAccessibleDescription()` / `toHaveAccessibleName()` | Descrição/nome acessível correspondem |
| `toHaveAttribute()` | Tem atributo DOM |
| `toHaveClass()` | Tem propriedade de classe CSS específica |
| `toHaveCount()` | Lista tem N filhos |
| `toHaveCSS()` | Tem propriedade CSS |
| `toHaveId()` | Tem ID |
| `toHaveJSProperty()` | Tem propriedade JS |
| `toHaveRole()` | Tem role ARIA específica |
| `toHaveScreenshot()` | Bate com screenshot (elemento ou `expect(page)`) |
| `toHaveText()` | Texto corresponde |
| `toHaveValue()` / `toHaveValues()` | Input tem valor / select tem opções selecionadas |
| `toMatchAriaSnapshot()` | Bate com snapshot ARIA (elemento ou `expect(page)`) |
| `toHaveTitle()` / `toHaveURL()` | `expect(page)` — título / URL |
| `toBeOK()` | `expect(response)` — status OK |

## Asserções sem retry

Testam qualquer condição, mas **não** re-tentam — usar em páginas assíncronas pode gerar flakiness. Prefira sempre as com retry acima; para casos complexos que precisam de polling, use `expect.poll` ou `expect.toPass` (abaixo).

| Asserção | Descrição |
|---|---|
| `toBe()` | Valor idêntico |
| `toBeCloseTo()` | Número aproximadamente igual |
| `toBeDefined()` / `toBeUndefined()` | Não é / é `undefined` |
| `toBeFalsy()` / `toBeTruthy()` | Falso / verdadeiro em contexto booleano |
| `toBeGreaterThan()` / `toBeGreaterThanOrEqual()` | Comparação numérica |
| `toBeLessThan()` / `toBeLessThanOrEqual()` | Comparação numérica |
| `toBeInstanceOf()` | Instância de uma classe |
| `toBeNaN()` / `toBeNull()` | É `NaN` / é `null` |
| `toContain()` | String contém substring, ou array/set contém elemento |
| `toContainEqual()` | Array/set contém elemento com igualdade profunda |
| `toEqual()` | Igualdade profunda / pattern matching |
| `toHaveLength()` | Array/string tem tamanho X |
| `toHaveProperty()` | Objeto tem propriedade |
| `toMatch()` | String bate com regex |
| `toMatchObject()` | Objeto contém as propriedades especificadas |
| `toStrictEqual()` | Igualdade profunda incluindo tipos |
| `toThrow()` | Função lança erro |

## Combinadores assimétricos

Aninháveis dentro de outras asserções para matching mais flexível.

| Combinador | Descrição |
|---|---|
| `expect.any()` | Qualquer instância de uma classe/primitivo |
| `expect.anything()` | Casa com qualquer coisa |
| `expect.arrayContaining()` | Array contém elementos específicos |
| `expect.closeTo()` | Número aproximadamente igual |
| `expect.objectContaining()` | Objeto contém propriedades específicas |
| `expect.stringContaining()` | String contém substring |
| `expect.stringMatching()` | String bate com regex |

## Negando (`.not`)

```ts
expect(value).not.toEqual(0);
await expect(locator).not.toContainText('some text');
```

## Asserções flexíveis (`expect.soft`)

Uma asserção normal que falha **para o teste imediatamente**. `expect.soft` registra a falha mas **deixa o teste continuar**, marcando-o como falho só no final:

```ts
await expect.soft(page.getByTestId('status')).toHaveText('Success');
await expect.soft(page.getByTestId('eta')).toHaveText('1 day');

await page.getByRole('link', { name: 'next page' }).click();
await expect.soft(page.getByRole('heading', { name: 'Make another order' })).toBeVisible();
```

Pra abortar manualmente se já houve falha soft antes de continuar:
```ts
expect(test.info().errors).toHaveLength(0);
```

> Só funciona com o test runner do Playwright.

## Mensagem de expectativa personalizada

Segundo argumento de `expect()` — aparece no relatório tanto em sucesso quanto em falha, dando contexto:

```ts
await expect(page.getByText('Name'), 'should be logged in').toBeVisible();
```

Sucesso no relatório: `✅ should be logged in`. Falha: a mensagem aparece no erro junto do call log. Funciona também em `expect.soft(value, 'my soft assertion')`.

## `expect.configure`

Cria uma instância de `expect` pré-configurada (timeout, soft, etc.):

```ts
const slowExpect = expect.configure({ timeout: 10000 });
await slowExpect(locator).toHaveText('Submit');

const softExpect = expect.configure({ soft: true });  // sempre soft
await softExpect(locator).toHaveText('Submit');
```

## `expect.poll` — polling assíncrono

Converte qualquer checagem síncrona em polling assíncrono, repetindo até o valor bater:

```ts
await expect.poll(async () => {
  const response = await page.request.get('https://api.example.com');
  return response.status();
}, {
  message: 'make sure API eventually succeeds',  // opcional, aparece no relatório
  timeout: 10000,                                 // padrão: 5s; 0 desabilita
}).toBe(200);
```

Intervalos de polling customizados (padrão: `[100, 250, 500, 1000]` ms):
```ts
await expect.poll(async () => {
  const response = await page.request.get('https://api.example.com');
  return response.status();
}, {
  intervals: [1_000, 2_000, 10_000],
  timeout: 60_000,
}).toBe(200);
```

Combina com `soft`:
```ts
await expect.soft.poll(async () => { /* ... */ }).toBe(200);

// ou reaproveitando uma instância configurada:
const softExpect = expect.configure({ soft: true });
await softExpect.poll(async () => { /* ... */ }).toBe(200);
```

## `expect(...).toPass()` — repetir um bloco de código

Tenta de novo o bloco inteiro até rodar sem lançar erro:

```ts
await expect(async () => {
  const response = await page.request.get('https://api.example.com');
  expect(response.status()).toBe(200);
}).toPass();
```

Intervalos/timeout customizados:
```ts
await expect(async () => {
  const response = await page.request.get('https://api.example.com');
  expect(response.status()).toBe(200);
}).toPass({
  intervals: [1_000, 2_000, 10_000],
  timeout: 60_000,
});
```
> Timeout padrão do `toPass` é **0** (sem limite) e **não** herda o timeout configurado do `expect` global.

## Matchers customizados (`expect.extend`)

Estende o `expect` com comparadores próprios. O matcher deve retornar `{ pass, message }` (`message` é uma função, chamada só quando necessário pro relatório):

```ts
// fixtures.ts
import { expect as baseExpect } from '@playwright/test';
import type { Locator } from '@playwright/test';

export { test } from '@playwright/test';

export const expect = baseExpect.extend({
  async toHaveAmount(locator: Locator, expected: number, options?: { timeout?: number }) {
    const assertionName = 'toHaveAmount';
    let pass: boolean;
    let matcherResult: any;
    try {
      const expectation = this.isNot ? baseExpect(locator).not : baseExpect(locator);
      await expectation.toHaveAttribute('data-amount', String(expected), options);
      pass = true;
    } catch (e: any) {
      matcherResult = e.matcherResult;
      pass = false;
    }
    if (this.isNot) pass = !pass;

    const message = pass
      ? () => this.utils.matcherHint(assertionName, undefined, undefined, { isNot: this.isNot }) +
          `\n\nLocator: ${locator}\nExpected: not ${this.utils.printExpected(expected)}\n` +
          (matcherResult ? `Received: ${this.utils.printReceived(matcherResult.actual)}` : '')
      : () => this.utils.matcherHint(assertionName, undefined, undefined, { isNot: this.isNot }) +
          `\n\nLocator: ${locator}\nExpected: ${this.utils.printExpected(expected)}\n` +
          (matcherResult ? `Received: ${this.utils.printReceived(matcherResult.actual)}` : '');

    return { message, pass, name: assertionName, expected, actual: matcherResult?.actual };
  },
});
```

```ts
// exemplo.spec.ts
import { test, expect } from './fixtures';

test('amount', async () => {
  await expect(page.locator('.cart')).toHaveAmount(4);
});
```

> Não confundir o `expect` do Playwright com a lib standalone `expect` — usar sempre o importado de `@playwright/test`.

## Combinar matchers customizados de vários módulos

```ts
// fixtures.ts
import { mergeTests, mergeExpects } from '@playwright/test';
import { test as dbTest, expect as dbExpect } from 'database-test-utils';
import { test as a11yTest, expect as a11yExpect } from 'a11y-test-utils';

export const expect = mergeExpects(dbExpect, a11yExpect);
export const test = mergeTests(dbTest, a11yTest);
```

```ts
// test.spec.ts
import { test, expect } from './fixtures';

test('passes', async ({ database }) => {
  await expect(database).toHaveDatabaseUser('admin');
});
```
