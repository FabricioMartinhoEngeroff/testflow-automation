# Executor de Testes Automatizados

Automatizador de execução de cenários de teste — Playwright + Excel
Componente: App (frontend) / server (Playwright)

## 1. Acesso

Aplicação local (ambiente de desenvolvimento), sem autenticação. Duas partes independentes, rodadas na máquina do QA/desenvolvedor:

- **Frontend** (`frontend/`, Vite + React) — interface visual, acessada via `npm run dev` (porta 5174).
- **Backend/execução** (`server/`, Node + TypeScript + Playwright) — ainda não expõe API HTTP; hoje é acionado manualmente via `npm run test:e2e*` de dentro de `server/`.

## 2. Conceito

Um colega criou um workflow (n8n + Claude) que gera planilhas Excel de cenários de teste a partir da EF e do chamado do Runrunit ("Automatizador de Cenários de Teste"). Este sistema é o lado complementar: **lê** essa planilha e **executa de verdade**, via Playwright, os cenários mais simples (validação de campo único, numa tela só, sem fluxo complexo) contra o sistema real da empresa (PGR), reportando passou/falhou com screenshot.

## 3. Atores e Permissões

| Perfil | Acesso |
|---|---|
| QA/Desenvolvedor (usuário único, local) | Acesso total — não há login nem controle de permissão no próprio Executor |

Importante não confundir com os **Perfis de teste** (seção 5.5): são credenciais do usuário **do sistema PGR sendo testado**, não do Executor em si.

## 4. Regras Gerais

RG1 – O fluxo principal segue 3 etapas sequenciais: (1) carregar planilha, (2) configurar e selecionar cenários, (3) executar e ver resultados. A etapa 2 só aparece após a 1 ser concluída, e a 3 só após clicar em "Executar".

RG2 – Ao carregar o Excel, o sistema tenta enviar para o backend (`POST /api/carregar`). **Esse endpoint ainda não existe** — em caso de falha na chamada, o sistema usa uma lista fixa de 5 cenários de exemplo (mock), para o frontend continuar funcionável enquanto o backend não é implementado.

RG3 – Cada cenário carregado tem: id, tela, funcionalidade, cenário (descrição), resultado esperado e status. Esse formato já reflete as colunas reais da planilha do colega (ID, Tela, Funcionalidade, Cenário, ..., Resultado Esperado, ..., Status).

RG4 – O campo "Filtrar por tela" é populado dinamicamente com os valores únicos de "tela" presentes nos cenários carregados.

RG5 – O slider "Máximo de cenários" limita quantos cenários (dos filtrados) ficam disponíveis para seleção; o valor máximo do slider acompanha o total de cenários carregados (ou 50, se não houver carregamento).

RG6 – A execução processa os cenários selecionados **um de cada vez, sequencialmente** (não em paralelo), atualizando o status de cada um em tempo real (pendente → executando → passou/falhou).

RG7 – Para cada cenário, o sistema tenta enviar para o backend (`POST /api/executar-cenario`). **Esse endpoint ainda não existe** — em caso de falha, o sistema simula um resultado (aguarda ~1,2s e sorteia passou/falhou), apenas para exercitar a interface enquanto o motor de execução real não está pronto.

RG8 – **Perfis de teste** (usuário/senha do sistema PGR + flags de permissão INC/ALT/EXC/VIS) podem ser cadastrados e ficam salvos no `localStorage` do navegador. Ao selecionar um perfil na Etapa 2, usuário e senha são preenchidos automaticamente.

RG8.1 – *(Divergência conhecida)* Os perfis cadastrados ainda **não chegam ao Playwright**. O usuário/senha digitados no frontend são enviados no corpo da chamada de execução, mas como o backend (`/api/executar-cenario`) ainda não existe, o login real do Playwright (`server/src/app/execution/support/login.ts`) hoje usa sempre o usuário/senha fixos do `server/.env` — não o perfil escolhido na tela. Conectar as duas pontas é o próximo passo planejado.

RG9 – O checkbox "Todos" na tela de Perfis é um atalho de UI: marca as 4 permissões (Incluir, Alterar, Excluir, Visualizar) de uma vez; não é um 5º valor armazenado separadamente.

RG10 – Perfis de teste são armazenados em texto simples no `localStorage` (decisão deliberada, aceitável por ora por ser ambiente de desenvolvimento local e single-user; migração para armazenamento no backend fica para quando o sistema for além do uso individual).

## 5. Tela

### 5.1 Cabeçalho
Título "Executor de Testes Automáticos" / subtítulo "Playwright + Claude + Excel". Botão à direita alterna entre a tela de execução e a tela de Perfis de teste. Quando há uma planilha carregada (na tela de execução), aparece também o botão "Nova execução" (limpa todo o estado e volta à Etapa 1).

### 5.2 Etapa 1 — Selecionar planilha de cenários
Área de upload (clique para escolher arquivo `.xlsx`). Enquanto carrega, exibe spinner "Carregando cenários...". Após carregar, mostra nome do arquivo e quantidade de cenários carregados.

### 5.3 Etapa 2 — Configurar execução
Campos: Perfil de teste (só aparece se houver perfil salvo), URL do sistema, Usuário de teste, Senha, Filtrar por tela, slider Máximo de cenários. Lista de cenários filtrados com checkbox individual + atalhos "Todos"/"Nenhum". Botão "Executar N testes com IA" (desabilitado sem seleção ou durante execução).

### 5.4 Etapa 3 — Resultados
Aparece após clicar em Executar. Mostra: contador Total/Passou/Falhou/Executando, barra de progresso enquanto executa, botão "Baixar Excel com resultados" (visual apenas — sem ação real ainda), e lista de resultados expansível por cenário (tela/funcionalidade, resultado esperado, observação do teste, screenshot quando houver).

### 5.5 Perfis de teste
Formulário (nome, usuário, senha, checkboxes de permissão + atalho "Todos") e lista de perfis salvos com badge de permissão, ações Editar/Excluir.

## 6. Mensagens do Sistema

| Identificador | Tipo | Texto |
|---|---|---|
| [upload_vazio] | Instrução | "Clique para carregar o Excel — Arquivo .xlsx gerado pelo Automatizador de Cenários" |
| [upload_ok] | Sucesso | "{N} cenários carregados" |
| [limite_ia] | Informação | "A IA não precisa atingir o limite — para quando a cobertura estiver completa" |
| [sem_perfis] | Informação | "Nenhum perfil cadastrado ainda." |
| [status_passou] / [status_falhou] / [status_executando] / [status_pendente] | Badge de status | "Passou" / "Falhou" / "Executando" / "Pendente" |

## 7. Especificação Técnica — Backend (Playwright)

RG11 – O motor de execução real (`server/`) é um projeto Node/TypeScript independente, com Playwright configurado (`playwright.config.ts`): 1 worker (sem paralelismo, pois os testes mexem no PGR real ao vivo), screenshot automático em falha, relatório HTML sem abrir sozinho.

RG12 – Existe hoje **1 spec de prova de conceito** (`tst244-data-base-obrigatoria.spec.ts`), cobrindo o cenário TST244 da planilha real ("Tentar salvar sem preencher a Data Base"). Login extraído em helper reutilizável (`support/login.ts`). Seletores ainda são genéricos/placeholder (marcados `// TODO`), pendentes de validação contra a tela real do PGR (sem acesso/credenciais até o momento).

RG13 – *(Decisão em aberto)* Ainda não foi definido como o motor vai generalizar a execução dos ~650 cenários da planilha real: specs fixos escritos à mão (confiável, não escala sozinho) vs. execução guiada por IA lendo o texto do cenário (escala, mais complexo). Ideia em avaliação: um "migrador" que classifica automaticamente cenários fáceis (padrão repetido: campo obrigatório / mensagem de erro / habilita-desabilita campo) e só executa esses, deixando o resto para revisão humana.

## 8. Divergências e Pendências Conhecidas

- Backend Express (`/api/carregar`, `/api/executar-cenario`) não existe — frontend usa mocks como fallback.
- Perfis de teste (frontend) não conectados ao login do Playwright (backend usa `.env` fixo).
- Parser real do Excel não implementado.
- Botão "Baixar Excel com resultados" é só visual, sem geração de arquivo.
- Seletores do spec TST244 não validados contra o sistema real.
