# testflow-automation

Executor automático de cenários de teste: lê planilhas Excel e executa os testes no browser usando Playwright + Claude IA.

O repositório tem duas partes independentes:

| Pasta | O que é |
|---|---|
| [`e2e/`](e2e) | Suíte de testes end-to-end do Apollus (Playwright + TypeScript). É a parte que roda de verdade. |
| [`frontend/`](frontend) | Interface visual do Executor (Vite + React), para carregar a planilha e disparar cenários. |
| [`docs/`](docs) | Estudos, especificações e relatórios. |

---

## 1. Suíte E2E do Apollus (`e2e/`)

### Configuração

```bash
cd e2e
npm install
cp .env.example .env   # preencha PGR_URL, PGR_USUARIO, PGR_SENHA e PGR_SENHA_QA
```

O `.env` fica fora do git. Os testes usam o Edge instalado no Windows (`channel: "msedge"`).

### Estrutura de pastas

As pastas de `specs/` e de `support/actions/` espelham o menu do Apollus.

```
e2e/
├── playwright.config.ts      um project por módulo (ver abaixo)
├── specs/                    os testes
│   ├── auth.setup.ts         loga cada usuário QAutomatizador_* e salva a sessão em .auth/
│   ├── login.spec.ts
│   └── seguranca/
│       ├── gro/profissional/
│       └── programas-e-laudos/{ltcat,pgr}/
├── support/
│   ├── index.ts              fixtures do Playwright (login, menuLateral, ltcatPage, ...)
│   ├── actions/              Page Objects (classes XxxPage), na mesma árvore do menu
│   ├── data/                 massas de dados (ltcat, hierarquias)
│   ├── utils/                helpers (cpf, material)
│   ├── arquivos/             arquivos usados nos uploads (pdf, imagens, planilhas, ...)
│   ├── usuarios.ts           usuários QAutomatizador_* e caminho das sessões salvas
│   └── urls.ts
├── shared/env.ts             leitura e validação do .env
├── scripts/                  não são testes: apoio ao QA (rodam no project "scripts")
│   ├── carga/                criam dados em massa (criar-*)
│   ├── ferramentas/          utilitários (restaurar Configuração Geral, contar anexos, ...)
│   └── explorar/<assunto>/   explorações temporárias da tela, mantidas como referência
└── __tests__/                testes unitários (vitest) da lógica pura
```

Nos specs e actions, importe com os alias `@support/...` e `@shared/...`.

### Projects e comandos

Rode sempre de dentro de `e2e/`.

| Comando | O que roda |
|---|---|
| `npm run test:e2e` | login + ltcat + pgr + profissional |
| `npm run test:e2e:ltcat` | LTCAT (sem permissões e sem Configuração Geral) |
| `npm run test:e2e:ltcat-permissoes` | permissões do LTCAT (depende do project `auth`) |
| `npm run test:e2e:ltcat-config-geral` | testes que alteram a Configuração Geral do ambiente |
| `npm run test:e2e:tudo` | **todos** os projects de teste, com o `ltcat-config-geral` por último |
| `npm run test:e2e:carga` / `:ferramentas` / `:explorar` | grupos de `scripts/` |
| `npm run test:e2e:report` | abre o relatório HTML |
| `npm test` | testes unitários (vitest) |

Para rodar um project direto: `npx playwright test --project=pgr`.

**Dependências entre projects.** `ltcat-permissoes` depende de `auth`, e `ltcat-config-geral` depende de todos os outros projects de teste (ele mexe na Configuração Geral do ambiente e precisa rodar por último). Se um project do qual ele depende falhar, ele é pulado. Use `--no-deps` para rodar só o project pedido, sem os que ele depende:

```bash
npx playwright test --project=ltcat-permissoes --no-deps   # reaproveita a sessão já salva em .auth/
npx playwright test --project=ltcat-config-geral --no-deps --workers=1
```

O Playwright roda com 1 worker e `retries: 1`, porque o alvo é um ambiente real e compartilhado. Vídeo e screenshot são guardados só em falha.

---

## 2. Frontend (`frontend/`)

Interface em Vite + React (`npm run dev`, porta 5174) com três etapas:

1. **Selecionar planilha** `.xlsx` de cenários (gerada pelo workflow "Automatizador de Cenários de Teste", a partir da EF e do chamado do Runrunit).
2. **Configurar a execução**: URL do sistema, usuário e senha (ou um *perfil de teste* salvo no `localStorage`), filtro por tela e máximo de cenários.
3. **Resultados**: cenários executados um a um, com status (pendente, executando, passou, falhou).

> **O backend não está neste repositório.** O frontend chama um backend em `http://localhost:3001` (`POST /api/carregar` e `POST /api/executar-cenario`) que não existe aqui. Sem ele, o frontend cai em dados simulados (5 cenários de exemplo e resultado sorteado). A suíte `e2e/` roda por conta própria pelos comandos acima e não depende do frontend.

A especificação completa do Executor está em [`docs/especificacoes/End-to-End automated tests 1.md`](docs/especificacoes/End-to-End%20automated%20tests%201.md).

---

## 3. Documentação (`docs/`)

- `estudos/playwright/`: anotações de estudo da documentação do Playwright (00 a 13).
- `especificacoes/`: EFs e o resumo de padrões do Ivy.
- `relatorios/`: relatórios de execução (ex.: `doc_testes_passaram_pgr`).
