# Parametrizar testes

Dá pra parametrizar testes tanto no nível do teste quanto no nível do projeto.

## Testes parametrizados

```ts
[
  { name: 'Alice', expected: 'Hello, Alice!' },
  { name: 'Bob', expected: 'Hello, Bob!' },
  { name: 'Charlie', expected: 'Hello, Charlie!' },
].forEach(({ name, expected }) => {
  // também dá pra fazer com test.describe() ou vários test(), desde que o nome seja único
  test(`testing with ${name}`, async ({ page }) => {
    await page.goto(`https://example.com/greet?name=${name}`);
    await expect(page.getByRole('heading')).toHaveText(expected);
  });
});
```

### Hooks fora ou dentro do forEach

Hooks `beforeEach`/`afterEach`/`beforeAll`/`afterAll` fora do `forEach` rodam **uma vez só** (não por iteração):

```ts
test.beforeEach(async ({ page }) => { /* ... */ });
test.afterEach(async ({ page }) => { /* ... */ });

[/* ... */].forEach(({ name, expected }) => {
  test(`testing with ${name}`, async ({ page }) => { /* ... */ });
});
```

Para ter hooks **por iteração**, envolva cada teste num `test.describe()`:

```ts
[/* ... */].forEach(({ name, expected }) => {
  test.describe(() => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`https://example.com/greet?name=${name}`);
    });
    test(`testing with ${expected}`, async ({ page }) => {
      await expect(page.getByRole('heading')).toHaveText(expected);
    });
  });
});
```

## Projetos parametrizados

Define uma opção customizada e roda o mesmo teste em várias configs via `projects`.

```ts
// my-test.ts
import { test as base } from '@playwright/test';

export type TestOptions = { person: string };

export const test = base.extend<TestOptions>({
  person: ['John', { option: true }],   // valor padrão, sobrescrito na config
});
```

```ts
// exemplo.spec.ts
import { test } from './my-test';

test('test 1', async ({ page, person }) => {
  await page.goto(`/index.html`);
  await expect(page.locator('#node')).toContainText(person);
});
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import type { TestOptions } from './my-test';

export default defineConfig<TestOptions>({
  projects: [
    { name: 'alice', use: { person: 'Alice' } },
    { name: 'bob', use: { person: 'Bob' } },
  ],
});
```

A opção também pode ser usada dentro de uma fixture (ex: sobrescrevendo a fixture `page` padrão para já entrar autenticado com o nome da pessoa).

> Comportamento de projetos parametrizados mudou na v1.18.

## Variáveis de ambiente

Evite guardar segredos no código-fonte — passe por variável de ambiente:

```ts
test(`example test`, async ({ page }) => {
  await page.getByLabel('User Name').fill(process.env.USER_NAME);
  await page.getByLabel('Password').fill(process.env.PASSWORD);
});
```

```bash
USER_NAME=me PASSWORD=secret npx playwright test
```

A própria config também pode ler env vars:

```ts
export default defineConfig({
  use: {
    baseURL: process.env.STAGING === '1' ? 'http://staging.example.test/' : 'http://example.test/',
  },
});
```

```bash
STAGING=1 npx playwright test
```

### Arquivos `.env`

```ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });
```

```
# .env
STAGING=0
USER_NAME=me
PASSWORD=secret
```

## Gerando testes a partir de um CSV

```ts
import fs from 'fs';
import path from 'path';
import { test } from '@playwright/test';
import { parse } from 'csv-parse/sync';

const records = parse(fs.readFileSync(path.join(__dirname, 'input.csv')), {
  columns: true,
  skip_empty_lines: true,
});

for (const record of records) {
  test(`foo: ${record.test_case}`, async ({ page }) => {
    console.log(record.test_case, record.some_value, record.some_other_value);
  });
}
```

**Relevância para este projeto**: essa é basicamente a abordagem que dá pra usar para os ~650 cenários vindos do Excel gerado pelo n8n — ler a planilha e gerar `test()` dinamicamente por linha, em vez de escrever um `test()` manual por cenário.
