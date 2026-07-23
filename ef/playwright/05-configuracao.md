# Configuração

Opções de configuração ficam no `playwright.config.ts`. Opções do test runner são de nível superior — não vão dentro de `use{}`.

## Configuração básica

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',                     // pasta com os arquivos de teste
  fullyParallel: true,                  // roda tudo em paralelo
  forbidOnly: !!process.env.CI,         // falha no CI se sobrar test.only()
  retries: process.env.CI ? 2 : 0,      // retries só no CI
  workers: process.env.CI ? 1 : undefined,  // workers paralelos só fora do CI
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',   // usado em page.goto('/')
    trace: 'on-first-retry',            // trace só ao repetir um teste que falhou
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {                          // sobe um servidor local antes dos testes
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

| Opção | Descrição |
|---|---|
| `forbidOnly` | Falha se algum teste estiver marcado `test.only` (útil no CI) |
| `fullyParallel` | Roda tudo em todos os arquivos em paralelo |
| `projects` | Múltiplas configurações/navegadores |
| `reporter` | Reporter a usar |
| `retries` | Máximo de tentativas por teste |
| `testDir` | Diretório com os arquivos de teste |
| `use` | Opções comuns (`baseURL`, `trace`, etc.) |
| `webServer` | Sobe um servidor durante os testes |
| `workers` | Máximo de processos paralelos (número ou `'50%'` dos cores) |

## Filtrando testes

```ts
export default defineConfig({
  testIgnore: '*test-assets',              // ignora esses arquivos
  testMatch: '*todo-tests/*.spec.ts',      // só roda esses (padrão: *.(test|spec).(js|ts|mjs))
});
```

## Configuração avançada

```ts
export default defineConfig({
  outputDir: 'test-results',                          // screenshots, vídeos, traces
  globalSetup: require.resolve('./global-setup'),      // roda antes de tudo
  globalTeardown: require.resolve('./global-teardown'),// roda depois de tudo
  timeout: 30000,                                       // timeout por teste (inclui fixtures + beforeEach)
});
```

## Configuração do `expect`

```ts
export default defineConfig({
  expect: {
    timeout: 5000,   // tempo máx. que expect() espera a condição ser atendida (padrão: 5s, separado do timeout do teste)
    toHaveScreenshot: { maxDiffPixels: 10 },
    toMatchSnapshot: { maxDiffPixelRatio: 0.1 },
  },
});
```
