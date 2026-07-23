# Espera automática (Auto-waiting)

Antes de executar uma ação, o Playwright faz uma série de verificações de "acionabilidade" (actionability) no elemento e só age depois que todas passarem. Se as checagens necessárias não passarem dentro do `timeout`, a ação falha com `TimeoutError`.

Exemplo — `locator.click()` garante que:
- o localizador resolve para **exatamente um** elemento;
- o elemento está **visível**;
- o elemento está **estável** (não está em animação, ou a animação já terminou);
- o elemento **recebe eventos** (não está obscurecido por outro elemento);
- o elemento está **habilitado**.

## Checagens por ação

| Ação | Visível | Estável | Recebe eventos | Habilitado | Editável |
|---|:---:|:---:|:---:|:---:|:---:|
| `check()` | ✓ | ✓ | ✓ | ✓ | – |
| `click()` | ✓ | ✓ | ✓ | ✓ | – |
| `dblclick()` | ✓ | ✓ | ✓ | ✓ | – |
| `setChecked()` | ✓ | ✓ | ✓ | ✓ | – |
| `tap()` | ✓ | ✓ | ✓ | ✓ | – |
| `uncheck()` | ✓ | ✓ | ✓ | ✓ | – |
| `hover()` | ✓ | ✓ | ✓ | – | – |
| `dragTo()` | ✓ | ✓ | ✓ | – | – |
| `screenshot()` | ✓ | ✓ | – | – | – |
| `fill()` | ✓ | – | – | ✓ | ✓ |
| `clear()` | ✓ | – | – | ✓ | ✓ |
| `selectOption()` | ✓ | – | – | ✓ | – |
| `selectText()` | ✓ | – | – | – | – |
| `scrollIntoViewIfNeeded()` | – | ✓ | – | – | – |
| `blur()` | – | – | – | – | – |
| `dispatchEvent()` | – | – | – | – | – |
| `focus()` | – | – | – | – | – |
| `press()` | – | – | – | – | – |
| `pressSequentially()` | – | – | – | – | – |
| `setInputFiles()` | – | – | – | – | – |

## Ações forçadas

Algumas ações (ex: `click()`) aceitam a opção `force`, que desliga checagens não essenciais — `{ force: true }` no `click()` pula a checagem de que o elemento realmente recebe o evento de clique (útil quando você sabe que há uma sobreposição intencional, ver [[09-acoes]]).

## Asserções com retry automático

Mesmo princípio da espera automática, aplicado a `expect()` — repete até a condição bater ou o timeout estourar (ver [[10-afirmacoes]] pra lista completa e detalhes de cada uma): `toBeAttached`, `toBeChecked`, `toBeDisabled`, `toBeEditable`, `toBeEmpty`, `toBeEnabled`, `toBeFocused`, `toBeHidden`, `toBeInViewport`, `toBeVisible`, `toContainText`, `toHaveAttribute`, `toHaveClass`, `toHaveCount`, `toHaveCSS`, `toHaveId`, `toHaveJSProperty`, `toHaveText`, `toHaveValue`, `toHaveValues`, `toHaveTitle` / `toHaveURL` (em `page`), `toBeOK` (em `response`).

## Definições das checagens

**Visível** — tem bounding box não vazia e não tem `visibility:hidden` computado.
- Elemento de tamanho zero → **não** é visível.
- `display:none` → **não** é visível.
- `opacity:0` → **é considerado visível** (opacidade não conta pra essa checagem).

**Estável** — mantém a mesma bounding box por pelo menos **dois frames de animação consecutivos**.

**Habilitado** — não está desabilitado. Está desabilitado quando:
- é `<button>`, `<select>`, `<input>`, `<textarea>`, `<option>` ou `<optgroup>` com atributo `[disabled]`;
- é um desses elementos dentro de um `<fieldset>` com `[disabled]`;
- é descendente de um elemento com `[aria-disabled=true]`.

**Editável** — está habilitado **e** não é somente leitura. É somente leitura quando:
- é `<select>`, `<input>` ou `<textarea>` com `[readonly]`;
- tem `[aria-readonly=true]` numa role ARIA que suporta esse atributo.

**Recebe eventos** — é o alvo real do evento de ponteiro no ponto exato da ação. Ex: ao clicar em `(10,10)`, o Playwright confere se nenhum outro elemento (ex: uma sobreposição/modal) vai capturar o clique ali antes do elemento alvo.

Exemplo de por que isso importa: um botão "Sign Up" está desabilitado enquanto a página valida se o username é único; assim que o servidor responde, o botão desabilitado é substituído por um habilitado. Se `locator.click()` for chamado durante a validação, o Playwright **espera** — não falha nem clica no botão errado — porque a checagem de "habilitado" só passa depois da substituição.

**Relevância pro projeto**: isso é diretamente relevante pros cenários PGR do tipo "campo obrigatório" / "habilita-desabilita campo" mencionados como categoria de cenário "fácil" em [[project_testes_automatizados_playwright]] — o Playwright já espera esses estados mudarem sozinho, sem precisar de wait manual no spec.
