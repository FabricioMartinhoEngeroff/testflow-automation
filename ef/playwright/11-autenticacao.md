# Autenticação

Testes Playwright rodam em `BrowserContext`s isolados (melhora reprodutibilidade, evita falhas em cascata). Um teste pode carregar um estado autenticado já pronto — evita logar de novo em cada teste e acelera a execução.

## Conceitos básicos

O estado do navegador autenticado normalmente é salvo no filesystem.

```bash
mkdir -p playwright/.auth
echo $'\nplaywright/.auth' >> .gitignore
```

> **Perigo**: o arquivo de estado pode ter cookies/headers sensíveis capazes de personificar a conta de teste — nunca versionar em repo público ou privado.

**Relevância pro projeto**: quando o backend Express existir e a autenticação real no PGR estiver conectada (ver gap em [[project_testes_automatizados_playwright]] sobre `login.ts` ainda usar `.env` fixo), esse padrão de `playwright/.auth/` + `storageState` é o caminho natural para não logar no PGR a cada spec.

## Básico: conta compartilhada em todos os testes

**Quando usar**: testes não mudam estado no servidor — todos podem rodar simultaneamente na mesma conta sem se afetar.
**Quando NÃO usar**: um teste modifica algo que outro teste lê (ex: altera uma config enquanto outro valida a tela dela) rodando em paralelo, ou a autenticação é por navegador.

Crie um script de setup que autentica uma vez e salva o estado:

```ts
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('https://github.com/login');
  await page.getByLabel('Username or email address').fill('username');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  // login pode setar cookies via vários redirects — espere a URL final
  await page.waitForURL('https://github.com/');
  // ou espere um elemento que só existe pós-login
  await expect(page.getByRole('button', { name: 'View profile and more' })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
```

Declare um projeto `setup` na config e torne-o dependência dos projetos de teste:

```ts
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```

```ts
// tests/exemplo.spec.ts
test('test', async ({ page }) => {
  // page já autenticada
});
```

> Lembre de invalidar/regenerar o estado salvo quando expirar. Se não precisa persistir entre execuções, grave em `testProject.outputDir` (limpo automaticamente a cada run).

### Autenticação no Modo UI

O Modo UI **não roda o projeto `setup` por padrão** (por velocidade). Rode `auth.setup.ts` manualmente sempre que a sessão expirar: habilite `setup` nos filtros → clique no play ao lado de `auth.setup.ts` → desabilite `setup` nos filtros de novo.

## Moderado: uma conta por worker paralelo

**Quando usar**: testes modificam estado compartilhado no servidor (ex: um teste vê a tela de config, outro a altera, rodando em paralelo) — precisa de contas separadas por worker pra não colidir.

Autentica uma vez por **worker** (não por teste), via fixture de escopo `worker`, usando `testInfo.parallelIndex` pra diferenciar:

```ts
// playwright/fixtures.ts
import { test as baseTest, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export * from '@playwright/test';
export const test = baseTest.extend<{}, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [async ({ browser }, use) => {
    const id = test.info().parallelIndex;
    const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

    if (fs.existsSync(fileName)) {
      await use(fileName);
      return;
    }

    // importante: começar sem storage state herdado
    const page = await browser.newPage({ storageState: undefined });

    // conta única por worker — evita interferência entre execuções concorrentes
    const account = await acquireAccount(id);

    await page.goto('https://github.com/login');
    await page.getByLabel('Username or email address').fill(account.username);
    await page.getByLabel('Password').fill(account.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('https://github.com/');
    await expect(page.getByRole('button', { name: 'View profile and more' })).toBeVisible();

    await page.context().storageState({ path: fileName });
    await page.close();
    await use(fileName);
  }, { scope: 'worker' }],
});
```

```ts
// tests/exemplo.spec.ts — importar de fixtures, não de @playwright/test
import { test, expect } from '../playwright/fixtures';

test('test', async ({ page }) => {
  // page já autenticada
});
```
Não precisa mudar nada na config.

**Relevância pro projeto**: como `server/playwright.config.ts` roda com **1 worker** (ver [[project_testes_automatizados_playwright]]), essa estratégia "uma conta por worker" atualmente equivale à estratégia básica de conta única — só ganharia relevância se algum dia o projeto passasse a rodar com múltiplos workers contra o PGR real.

## Cenários avançados

### Autenticar via requisição de API

**Quando usar**: a aplicação aceita login via API — mais rápido/confiável que passar pela UI.

```ts
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ request }) => {
  await request.post('https://github.com/login', {
    form: { user: 'user', password: 'password' },
  });
  await request.storageState({ path: authFile });
});
```

Ou por worker, análogo ao padrão de fixture acima mas usando `request.newContext()` em vez de `browser.newPage()`.

### Passkeys (WebAuthn)

**Quando usar**: app autentica via WebAuthn e os testes devem começar já com o usuário cadastrado.

`browserContext.credentials` é um autenticador WebAuthn virtual — como é inicializado via `credentials.create()`/`credentials.install()` (não é cookie/localStorage), vive numa fixture de `context`, não em `storageState`.

Se o backend já provisionou a passkey do usuário de teste, injete direto (sem setup project):
```ts
// playwright/fixtures.ts
export const test = baseTest.extend({
  context: async ({ context }, use) => {
    await context.credentials.create('example.com', {
      id: process.env.PASSKEY_ID,
      userHandle: process.env.PASSKEY_USER_HANDLE,
      privateKey: process.env.PASSKEY_PRIVATE_KEY,
      publicKey: process.env.PASSKEY_PUBLIC_KEY,
    });
    await context.credentials.install();
    await use(context);
  },
});
```

Ou deixe o app registrar a passkey uma vez no setup, capture com `credentials.get()` e salve em disco:
```ts
// tests/passkey.setup.ts
setup('enroll passkey', async ({ context, page }) => {
  await context.credentials.install();
  await page.goto('https://example.com/register');
  await page.getByRole('button', { name: 'Create a passkey' }).click();

  const [credential] = await context.credentials.get({ rpId: 'example.com' });
  fs.writeFileSync('playwright/.auth/passkey.json', JSON.stringify(credential));
});
```
Depois injete a credencial capturada em cada teste (mesmo padrão da fixture acima, lendo de `passkey.json`). Declare o setup como dependência, como no fluxo básico. `passkey.json` tem chave privada — proteger fora do controle de versão.

### Múltiplos papéis (roles) assinados

**Quando usar**: mais de um papel (admin, user) reutilizado entre testes.

Autentica cada papel no setup, salvando arquivos separados:
```ts
// tests/auth.setup.ts
setup('authenticate as admin', async ({ page }) => {
  // ... login como admin ...
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});

setup('authenticate as user', async ({ page }) => {
  // ... login como user ...
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

Especifica o `storageState` por arquivo ou bloco de testes, em vez da config global:
```ts
// tests/exemplo.spec.ts
test.use({ storageState: 'playwright/.auth/admin.json' });

test('admin test', async ({ page }) => { /* autenticado como admin */ });

test.describe(() => {
  test.use({ storageState: 'playwright/.auth/user.json' });
  test('user test', async ({ page }) => { /* autenticado como user */ });
});
```

**Relevância pro projeto**: mapeia diretamente pros **perfis de teste** já implementados no frontend (`app/perfis` — credenciais + permissões INC/ALT/EXC/VIS por perfil). Quando o backend existir, cada perfil salvo poderia virar um `storageState` próprio em vez de reautenticar via UI a cada cenário.

### Testando múltiplos papéis simultaneamente (mesmo teste)

**Quando usar**: precisa ver como dois papéis autenticados interagem dentro do mesmo teste.

```ts
test('admin and user', async ({ browser }) => {
  const adminContext = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
  const adminPage = await adminContext.newPage();

  const userContext = await browser.newContext({ storageState: 'playwright/.auth/user.json' });
  const userPage = await userContext.newPage();

  // ... interage com adminPage e userPage ...

  await adminContext.close();
  await userContext.close();
});
```

### Múltiplos papéis via fixtures de Page Object Model

Mesma ideia acima, mas encapsulada em fixtures que retornam POMs prontos:

```ts
// playwright/fixtures.ts
class AdminPage {
  page: Page;
  greeting: Locator;
  constructor(page: Page) {
    this.page = page;
    this.greeting = page.locator('#greeting');
  }
}
class UserPage { /* ... mesma estrutura ... */ }

type MyFixtures = { adminPage: AdminPage; userPage: UserPage };

export const test = base.extend<MyFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/admin.json' });
    const adminPage = new AdminPage(await context.newPage());
    await use(adminPage);
    await context.close();
  },
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'playwright/.auth/user.json' });
    const userPage = new UserPage(await context.newPage());
    await use(userPage);
    await context.close();
  },
});
```

```ts
// tests/exemplo.spec.ts
import { test, expect } from '../playwright/fixtures';

test('admin and user', async ({ adminPage, userPage }) => {
  await expect(adminPage.greeting).toHaveText('Welcome, Admin');
  await expect(userPage.greeting).toHaveText('Welcome, User');
});
```

## Session Storage

`storageState` cobre cookies, localStorage e IndexedDB — **não** session storage (raramente usado pra estado de login; é por domínio e não persiste entre carregamentos de página). Sem API nativa pra isso, mas dá pra salvar/restaurar manualmente:

```ts
// salvar
const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage));
fs.writeFileSync('playwright/.auth/session.json', sessionStorage, 'utf-8');

// restaurar em novo contexto
const sessionStorage = JSON.parse(fs.readFileSync('playwright/.auth/session.json', 'utf-8'));
await context.addInitScript(storage => {
  if (window.location.hostname === 'example.com') {
    for (const [key, value] of Object.entries(storage))
      window.sessionStorage.setItem(key, value);
  }
}, sessionStorage);
```

## Evitar autenticação em testes específicos

Reseta o storage state num arquivo, ignorando o padrão configurado no projeto:

```ts
// nao-autenticado.spec.ts
test.use({ storageState: { cookies: [], origins: [] } });

test('not signed in test', async ({ page }) => {
  // ...
});
```
