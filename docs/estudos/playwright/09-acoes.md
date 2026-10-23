# Ações

O Playwright interage com inputs HTML: texto, checkbox, radio, select, cliques, teclado, atalhos, upload de arquivo, drag and drop, scroll.

## Entrada de texto (`locator.fill()`)

Forma mais fácil de preencher campos — foca o elemento e dispara um evento `input` com o texto. Funciona em `<input>`, `<textarea>`, `[contenteditable]`.

```ts
await page.getByRole('textbox').fill('Peter');
await page.getByLabel('Birth date').fill('2020-02-02');           // date
await page.getByLabel('Appointment time').fill('13:15');          // time
await page.getByLabel('Local time').fill('2020-03-02T05:15');     // local datetime
```

## Checkbox e radio (`locator.setChecked()`)

Forma mais fácil de marcar/desmarcar `input[type=checkbox]`, `input[type=radio]`, `[role=checkbox]`.

```ts
await page.getByLabel('I agree to the terms above').check();
expect(page.getByLabel('Subscribe to newsletter')).toBeChecked();
await page.getByLabel('XL').check();  // radio
```

## Select (`locator.selectOption()`)

Seleciona uma ou mais opções em `<select>`, por `value` ou `label`.

```ts
await page.getByLabel('Choose a color').selectOption('blue');               // por value ou label
await page.getByLabel('Choose a color').selectOption({ label: 'Blue' });    // só por label
await page.getByLabel('Choose multiple colors').selectOption(['red', 'green', 'blue']);  // múltiplas
```

## Clique do mouse

```ts
await page.getByRole('button').click();                                        // clique simples
await page.getByText('Item').dblclick();                                       // duplo clique
await page.getByText('Item').click({ button: 'right' });                       // botão direito
await page.getByText('Item').click({ modifiers: ['Shift'] });                  // Shift+click
await page.getByText('Item').click({ modifiers: ['ControlOrMeta'] });          // Ctrl (Win/Linux) ou Meta (macOS)
await page.getByText('Item').hover();                                          // hover
await page.getByText('Item').click({ position: { x: 0, y: 0 } });              // ponto específico
```

Nos bastidores, antes de agir o Playwright: espera o elemento estar no DOM → espera ficar visível (não `display:none`/`visibility:hidden`) → espera parar de se mover (ex: fim de transição CSS) → rola até ficar visível → espera receber eventos de ponteiro no ponto de ação (não obscurecido por outro elemento) → repete as checagens se o elemento for desanexado durante o processo.

### Forçar o clique

Quando um elemento sobreposto intercepta o clique por design (não é bug) e você sabe disso, pula as verificações de actionability:

```ts
await page.getByRole('button').click({ force: true });
```

### Clique programático

Dispara o evento `click` direto, sem simular interação real de usuário:

```ts
await page.getByRole('button').dispatchEvent('click');
```

## Digitar caractere por caractere (`locator.pressSequentially()`)

> Use `fill()` na maioria dos casos (seção acima). Só use isto se a página tem tratamento especial de teclado (ex: autocomplete que reage a cada tecla).

```ts
await page.locator('#area').pressSequentially('Hello World!');
```
Emite todos os eventos de teclado (`keydown`, `keyup`, `keypress`). Aceita `delay` opcional entre teclas pra simular digitação real.

## Teclas e atalhos (`locator.press()`)

Foca o elemento e executa uma única tecla/atalho.

```ts
await page.getByText('Submit').press('Enter');
await page.getByRole('textbox').press('Control+ArrowRight');
await page.getByRole('textbox').press('$');
```

Nomes de tecla lógicos (via `keyboardEvent.key`): `Backquote`, `Minus`, `Equal`, `Backslash`, `Backspace`, `Tab`, `Delete`, `Escape`, `ArrowDown`, `End`, `Enter`, `Home`, `Insert`, `PageDown`, `PageUp`, `ArrowRight`, `ArrowUp`, `F1`-`F12`, `Digit0`-`Digit9`, `KeyA`-`KeyZ`, etc. Também aceita um caractere único (`"a"`, `"#"`). Modificadores suportados: `Shift`, `Control`, `Alt`, `Meta`.

```ts
await page.locator('#name').press('Shift+A');          // "A" maiúsculo — case sensitive
await page.locator('#name').press('Shift+ArrowLeft');
```

> `Shift+A` produz "A" maiúsculo; `Shift+a` produz "a" minúsculo (como se CapsLock estivesse ligado) — a capitalização do caractere é o que importa, não só o modificador.

## Upload de arquivos (`locator.setInputFiles()`)

Aponta pra um `<input type="file">`. Aceita array para múltiplos arquivos. Paths relativos resolvem a partir do cwd. Array vazio limpa a seleção.

```ts
await page.getByLabel('Upload file').setInputFiles(path.join(__dirname, 'myfile.pdf'));

await page.getByLabel('Upload files').setInputFiles([
  path.join(__dirname, 'file1.txt'),
  path.join(__dirname, 'file2.txt'),
]);

await page.getByLabel('Upload directory').setInputFiles(path.join(__dirname, 'mydir'));

await page.getByLabel('Upload file').setInputFiles([]);  // limpa

// upload de buffer em memória, sem arquivo físico
await page.getByLabel('Upload file').setInputFiles({
  name: 'file.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('this is test'),
});
```

Quando o `<input>` é criado dinamicamente (não existe até a ação disparar), trate o evento `filechooser`:

```ts
const fileChooserPromise = page.waitForEvent('filechooser');  // sem await antes do click
await page.getByLabel('Upload file').click();
const fileChooser = await fileChooserPromise;
await fileChooser.setFiles(path.join(__dirname, 'myfile.pdf'));
```

**Relevância pro projeto**: o upload do Excel de cenários no frontend (`app/upload`) provavelmente usa esse padrão de `setInputFiles()` quando for testado via Playwright.

## Foco (`locator.focus()`)

```ts
await page.getByLabel('Password').focus();
```

## Drag and drop

**Alto nível** (`locator.dragTo()`) — hover no elemento origem → mousedown → move até o destino → mouseup:

```ts
await page.locator('#item-to-be-dragged').dragTo(page.locator('#item-to-drop-at'));
```

**Manual** (controle fino, com `hover()` + `mouse.down()`/`move()`/`up()`):

```ts
await page.locator('#item-to-be-dragged').hover();
await page.mouse.down();
await page.locator('#item-to-drop-at').hover();
await page.mouse.up();
```

> Se a página depende do evento `dragover`, alguns navegadores só disparam após o **segundo** movimento do mouse — repita o `hover()`/`mouse.move()` duas vezes antes do `mouse.up()`.

## Rolagem (scroll)

Na maioria dos casos o Playwright já rola a página automaticamente antes de qualquer ação — não precisa fazer manual:

```ts
await page.getByRole('button').click();  // rola sozinho até o botão ficar visível
```

Casos raros que precisam de scroll manual (ex: forçar carregamento de "lista infinita", posicionar pra screenshot):

```ts
await page.getByText('Footer text').scrollIntoViewIfNeeded();
```

Controle mais preciso via mouse wheel ou avaliação direta no elemento:

```ts
await page.getByTestId('scrolling-container').hover();
await page.mouse.wheel(0, 10);

await page.getByTestId('scrolling-container').evaluate(e => e.scrollTop += 100);
```
