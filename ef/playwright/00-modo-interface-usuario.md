# Modo de Interface do Usuário (UI Mode)

Explora, executa e depura testes com experiência imersiva tipo "viagem no tempo", incluindo watch mode. Todos os arquivos de teste ficam na barra lateral — expanda cada arquivo/bloco `describe` pra rodar, ver, observar e depurar cada teste individualmente. Filtra por nome, projeto (do `playwright.config`), `@tag` ou status (aprovado/reprovado/ignorado). Trace completo por teste, com hover em cada ação mostrando o que acontecia naquele momento; snapshot do DOM pode abrir numa janela separada pra debug.

## Abrindo

```bash
npx playwright test --ui
```

## Executando testes

Ícone de triângulo na barra lateral roda tudo; hover num arquivo/bloco/teste específico mostra o triângulo pra rodar só aquilo.

## Filtrando testes

Por texto, `@tag`, status (aprovado/reprovado/ignorado) ou projeto. Se usa **dependências de projeto** (ex: um projeto `setup`, ver [[11-autenticacao]]), o Modo UI **não roda os testes de setup automaticamente** — precisa rodar manualmente antes.

## Timeline

Linha do tempo no topo do trace, com cores diferentes pra navegação vs. ações. Hover mostra a screenshot de cada ação; duplo clique numa ação mostra o intervalo de tempo correspondente. O slider seleciona múltiplas ações — a aba Actions e os logs de console/rede filtram automaticamente pra mostrar só o range selecionado.

## Aba Actions

Mostra o localizador usado e o tempo de cada ação. Hover muda o snapshot do DOM visualmente. Abas **Before**/**After** mostram o estado antes/depois de cada ação.

### Inspecionar o DOM

Botão de janela separada acima do snapshot abre o DOM numa janela própria com DevTools completo (inspecionar HTML/CSS/Console). Dá pra comparar duas ações lado a lado voltando ao Modo UI, clicando em outra ação e reabrindo.

### Seletor de localizador (Pick Locator)

Hover no snapshot mostra o localizador de cada elemento. Clicar adiciona ao playground de teste do localizador, onde dá pra editar e ver se ainda casa com o elemento certo no snapshot — depois é só copiar pro spec.

## Aba Source

Hover numa ação destaca a linha correspondente no código-fonte. Botão "Abrir no VS Code" no canto superior direito abre o teste exatamente naquela linha.

## Aba Call

Detalhes da ação: tempo que levou, localizador usado, se estava em modo estrito, qual tecla foi usada (quando aplicável).

## Aba Log

Log completo do que o Playwright fez nos bastidores — scroll até o elemento, esperar visível/habilitado/estável (ver [[12-espera-automatica]]), executar a ação (click, fill, press...).

## Aba Errors

Mensagens de erro por teste quando falha; a timeline marca em vermelho onde o erro ocorreu. A aba Source mostra a linha exata do erro.

## Aba Console

Logs de console do navegador e do próprio arquivo de teste, com ícones diferentes pra cada origem.

## Aba Network

Todas as requisições feitas durante o teste — ordenáveis por tipo, status, método, content-type, duração, tamanho. Clicar numa requisição mostra headers de request/response e os bodies.

## Aba Attachments

Anexos do teste. Pra regressão visual: compara screenshots (diff, atual, esperada) — clicando na esperada dá pra usar um slider e sobrepor as imagens.

## Aba Metadata

Ao lado de Actions: navegador, tamanho do viewport, duração do teste, etc.

## Watch mode

Ícone de olho ao lado de cada teste ativa o watch mode — reexecuta o teste automaticamente ao salvar alterações. Dá pra observar vários testes ao mesmo tempo (ícone de olho em cada um) ou todos de uma vez (ícone de olho no topo da barra lateral).

## Docker e GitHub Codespaces

Pra expor a porta fora do container, vincule em `0.0.0.0`:
```bash
npx playwright test --ui-host=0.0.0.0
```
No Codespaces a porta é encaminhada automaticamente (link aparece no terminal). Porta estática customizada:
```bash
npx playwright test --ui-port=8080 --ui-host=0.0.0.0
```

> **Atenção**: com `--ui-host=0.0.0.0`, senhas e segredos nos traces ficam acessíveis a outras máquinas na sua rede. No Codespaces, portas ficam restritas à sua conta por padrão.
