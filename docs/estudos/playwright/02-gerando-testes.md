# Gerando testes (Codegen)

O Playwright pode gerar testes automaticamente: o Codegen abre uma janela do navegador para interação junto com o Playwright Inspector, que grava, copia e gerencia os testes gerados.

## Executando o Codegen

```bash
npx playwright codegen demo.playwright.dev/todomvc
```

A URL é opcional — pode ser digitada depois, direto na janela do navegador.

## Gravando um teste

O Codegen analisa a página renderizada e recomenda o melhor localizador, priorizando role, texto e test-id. Quando vários elementos casam com um localizador, ele o refina para identificar o alvo unicamente (menos flakiness).

Com o gerador dá pra gravar:
- **Ações** — clicar, preencher, etc., interagindo direto com a página.
- **Asserções** — clicando no ícone da toolbar e depois em um elemento da página:
  - `assert visibility` — elemento está visível
  - `assert text` — elemento contém um texto específico
  - `assert value` — elemento tem um valor específico

Ao terminar: botão **record** para parar a gravação, botão **copy** para copiar o código gerado pro editor. Botão **clear** limpa e reinicia a gravação. Fechar o Inspector ou encerrar o comando no terminal encerra a sessão.

## Geração de localizadores

1. Clique em **Record** para parar a gravação — aparece o botão **Pick Locator**.
2. Clique em **Pick Locator** e passe o cursor sobre elementos na página — cada um é destacado.
3. Clique no elemento desejado — o código do localizador aparece na área de seleção.
4. Edite o localizador ali mesmo e veja o elemento correspondente destacado em tempo real na página.
5. Use o botão de copiar para colar o localizador no código.

## Emulação

Dá pra gerar testes com emulação de: tamanho de tela, dispositivo, esquema de cores, geolocalização, idioma, fuso horário. O Codegen também pode preservar estado de autenticação.
