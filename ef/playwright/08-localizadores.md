# Localizadores

Localizadores são a peça central da espera automática e repetição do Playwright: representam "uma forma de encontrar" um elemento na página a qualquer momento (não uma referência fixa a um elemento específico).

## Guia rápido — localizadores integrados recomendados

| Método | Uso |
|---|---|
| `page.getByRole()` | Por atributos de acessibilidade explícitos/implícitos |
| `page.getByText()` | Pelo conteúdo de texto |
| `page.getByLabel()` | Controle de formulário pelo texto do rótulo associado |
| `page.getByPlaceholder()` | Campo de input pelo placeholder |
| `page.getByAltText()` | Elemento (geralmente imagem) pelo alt text |
| `page.getByTitle()` | Pelo atributo `title` |
| `page.getByTestId()` | Pelo atributo `data-testid` (configurável) |

```ts
await page.getByLabel('User Name').fill('John');
await page.getByLabel('Password').fill('secret-password');
await page.getByRole('button', { name: 'Sign in' }).click();
await expect(page.getByText('Welcome, John!')).toBeVisible();
```

## Localizando elementos

Priorize atributos voltados ao usuário e contratos explícitos, como `getByRole()`:

```html
<button>Sign in</button>
```
```ts
await page.getByRole('button', { name: 'Sign in' }).click();
```

> Dica: use o codegen pra gerar o localizador e depois ajustá-lo manualmente.

Cada uso de um localizador em uma ação busca o elemento DOM **atualizado** na página — se o DOM mudar entre chamadas, a próxima ação pega o elemento novo:

```ts
const locator = page.getByRole('button', { name: 'Sign in' });
await locator.hover();
await locator.click();  // busca o elemento de novo, já atualizado
```

Todos os métodos `getBy...` também existem em `Locator` e `FrameLocator`, permitindo encadear e refinar:

```ts
const locator = page
  .frameLocator('#my-frame')
  .getByRole('button', { name: 'Sign in' });
await locator.click();
```

## Localizar por função (`getByRole`) — recomendado

Reflete como usuários e tecnologias assistivas percebem a página (é um botão? uma checkbox?). Passar o nome acessível junto ajuda a identificar o elemento exato.

```html
<h3>Sign up</h3>
<label><input type="checkbox" /> Subscribe</label>
<button>Submit</button>
```
```ts
await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
await page.getByRole('checkbox', { name: 'Subscribe' }).check();
await page.getByRole('button', { name: /submit/i }).click();
```

Segue as specs W3C de role ARIA, atributos ARIA e nome acessível. Muitos elementos HTML já têm role implícita reconhecida (`<button>`, `<div>` etc). **Não substitui** auditoria de acessibilidade, mas dá um feedback inicial. É a opção prioritária na maioria dos casos.

## Localizar por rótulo (`getByLabel`)

```html
<label>Password <input type="password" /></label>
```
```ts
await page.getByLabel('Password').fill('secret');
```
Use para campos de formulário.

## Localizar por placeholder (`getByPlaceholder`)

```html
<input type="email" placeholder="name@example.com" />
```
```ts
await page.getByPlaceholder('name@example.com').fill('playwright@microsoft.com');
```
Use quando o campo não tem label mas tem placeholder.

## Localizar por texto (`getByText`)

```html
<span>Welcome, John</span>
```
```ts
await expect(page.getByText('Welcome, John')).toBeVisible();
await expect(page.getByText('Welcome, John', { exact: true })).toBeVisible();
await expect(page.getByText(/welcome, [A-Za-z]+$/i)).toBeVisible();
```
> Matching de texto sempre normaliza espaços em branco (múltiplos espaços viram um, quebras de linha viram espaço, trim nas pontas) — mesmo em `exact`.

Use para elementos **não interativos** (`div`, `span`, `p`). Para interativos (`button`, `a`, `input`), prefira `getByRole`. Também dá pra usar como filtro dentro de listas.

## Localizar por texto alternativo (`getByAltText`)

```html
<img alt="playwright logo" src="/img/playwright-logo.svg" width="100" />
```
```ts
await page.getByAltText('playwright logo').click();
```
Use em elementos que suportam alt text (`img`, `area`, etc).

## Localizar por título (`getByTitle`)

```html
<span title='Issues count'>25 issues</span>
```
```ts
await expect(page.getByTitle('Issues count')).toHaveText('25 issues');
```
Use quando o elemento tem atributo `title`.

## Localizar por Test ID (`getByTestId`)

A forma mais **resiliente** — sobrevive a mudanças de texto/role. Deve ser definido explicitamente pelo time (QA + dev). Trade-off: não é "voltado ao usuário" — se texto/role importam pro teste, prefira role/texto.

```html
<button data-testid="directions">Itinéraire</button>
```
```ts
await page.getByTestId('directions').click();
```

### Atributo de test id customizado

```ts
// playwright.config.ts
export default defineConfig({
  use: { testIdAttribute: 'data-pw' },
});
```
```html
<button data-pw="directions">Itinéraire</button>
```
```ts
await page.getByTestId('directions').click();  // continua igual, só muda o attr lido
```

## Localizar por CSS ou XPath (`page.locator()`)

```ts
await page.locator('css=button').click();
await page.locator('xpath=//button').click();
await page.locator('button').click();   // prefixo detectado automaticamente
await page.locator('//button').click();
```

**Evite** — seletores CSS/XPath longos ficam presos à estrutura do DOM e quebram fácil:

```ts
// ✖ má prática — frágil a qualquer mudança de estrutura
await page.locator('#tsf > div:nth-child(2) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input').click();
```

Prefira `getByRole` ou test IDs explícitos.

## Localizar no Shadow DOM

Localizadores do Playwright atravessam Shadow DOM por padrão. Exceções: **XPath não atravessa** raízes shadow, e **shadow root em modo `closed` não é suportado**.

```html
<x-details role=button aria-expanded=true aria-controls=inner-details>
  <div>Title</div>
  #shadow-root
    <div id=inner-details>Details</div>
</x-details>
```
```ts
await page.getByText('Details').click();                          // clica no <div> dentro do shadow root
await page.locator('x-details', { hasText: 'Details' }).click();  // clica no <x-details>
await expect(page.locator('x-details')).toContainText('Details'); // asserção no <x-details>
```

## Filtrando localizadores

```html
<ul>
  <li><h3>Product 1</h3><button>Add to cart</button></li>
  <li><h3>Product 2</h3><button>Add to cart</button></li>
</ul>
```

**Por texto** (`hasText` — busca substring/case-insensitive em qualquer descendente, ou regex):
```ts
await page.getByRole('listitem').filter({ hasText: 'Product 2' })
  .getByRole('button', { name: 'Add to cart' }).click();
await page.getByRole('listitem').filter({ hasText: /Product 2/ })
  .getByRole('button', { name: 'Add to cart' }).click();
```

**Por ausência de texto** (`hasNotText`):
```ts
await expect(page.getByRole('listitem').filter({ hasNotText: 'Out of stock' })).toHaveCount(5);
```

**Por filho/descendente** (`has` — filtra por ter um descendente que casa outro localizador):
```ts
await page.getByRole('listitem')
  .filter({ has: page.getByRole('heading', { name: 'Product 2' }) })
  .getByRole('button', { name: 'Add to cart' }).click();
```
> O localizador de filtro é **relativo ao original** — a busca começa a partir do elemento já encontrado, não da raiz do documento. Por isso `filter({ has: page.getByRole('list').getByText(...) })` dentro de um `listitem` **não funciona** (o `list` está fora do `li`).

**Por não ter filho/descendente** (`hasNot`):
```ts
await expect(page.getByRole('listitem').filter({ hasNot: page.getByText('Product 2') })).toHaveCount(1);
```

## Operadores de localização

**Encadear (`.getBy...` dentro de um locator)** — restringe a busca a uma parte da página:
```ts
const product = page.getByRole('listitem').filter({ hasText: 'Product 2' });
await product.getByRole('button', { name: 'Add to cart' }).click();
await expect(product).toHaveCount(1);
```
Ou encadear dois locators via `.locator()`:
```ts
const saveButton = page.getByRole('button', { name: 'Save' });
const dialog = page.getByTestId('settings-dialog');
await dialog.locator(saveButton).click();
```

**`.and()`** — combina dois localizadores, precisa casar ambos:
```ts
const button = page.getByRole('button').and(page.getByTitle('Subscribe'));
```

**`.or()`** — casa um OU outro (útil quando não se sabe qual vai aparecer):
```ts
const newEmail = page.getByRole('button', { name: 'New' });
const dialog = page.getByText('Confirm security settings');
await expect(newEmail.or(dialog).first()).toBeVisible();
if (await dialog.isVisible())
  await page.getByRole('button', { name: 'Dismiss' }).click();
await newEmail.click();
```
> Se ambos aparecerem na tela, `.or()` casa os dois e pode violar modo estrito — use `.first()`.

**`filter({ visible: true })`** — casa só elementos visíveis (preferir um localizador único é mais confiável que checar visibilidade):
```ts
await page.locator('button').filter({ visible: true }).click();
```

## Listas

**Contar itens:**
```ts
await expect(page.getByRole('listitem')).toHaveCount(3);
```

**Checar todo o texto:**
```ts
await expect(page.getByRole('listitem')).toHaveText(['apple', 'banana', 'orange']);
```

**Pegar um item específico** — por texto, filtro, test id ou índice:
```ts
await page.getByText('orange').click();
await page.getByRole('listitem').filter({ hasText: 'orange' }).click();
await page.getByTestId('orange').click();
const banana = await page.getByRole('listitem').nth(1);  // último recurso — frágil a mudanças de ordem
```
`.first()` / `.last()` / `.nth()` funcionam mas não são recomendados — prefira um localizador que identifique o elemento unicamente.

**Filtros encadeados** — refina progressivamente:
```ts
const rowLocator = page.getByRole('listitem');
await rowLocator
  .filter({ hasText: 'Mary' })
  .filter({ has: page.getByRole('button', { name: 'Say goodbye' }) })
  .screenshot({ path: 'screenshot.png' });
```

**Iterar sobre cada elemento:**
```ts
for (const row of await page.getByRole('listitem').all())
  console.log(await row.textContent());

// ou com for regular + count()
const rows = page.getByRole('listitem');
const count = await rows.count();
for (let i = 0; i < count; ++i)
  console.log(await rows.nth(i).textContent());
```

**Avaliar direto na página** (`evaluateAll` — roda no browser, dá pra usar qualquer API de DOM):
```ts
const rows = page.getByRole('listitem');
const texts = await rows.evaluateAll(list => list.map(el => el.textContent));
```

## Rigidez (strict mode)

Localizadores são **estritos**: qualquer operação que implica em UM elemento alvo lança exceção se mais de um elemento casar.

```ts
await page.getByRole('button').click();  // ✖ erro se houver mais de um botão
await page.getByRole('button').count();  // ✔ ok — count() lida bem com múltiplos
```

Para sair do modo estrito explicitamente: `.first()`, `.last()`, `.nth()` — **não recomendado**, porque se a página mudar o Playwright pode agir sobre um elemento diferente do esperado. Prefira sempre construir um localizador que identifique o elemento de forma única.
