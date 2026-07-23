# Configurando CI

Testes Playwright rodam em qualquer provedor de CI. Este resumo cobre GitHub Actions.

## Configurando o GitHub Actions

Ao instalar via `npm init playwright@latest` (ou extensão VS Code), há a opção de adicionar um workflow que cria `.github/workflows/playwright.yml`, rodando os testes a cada push/PR na branch principal:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v5
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
    - uses: actions/upload-artifact@v4
      if: ${{ !cancelled() }}
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

Passos: clona o repo → instala Node.js → instala deps npm → instala browsers do Playwright → roda os testes → sobe o relatório HTML como artifact.

## Repositório e push

Precisa de um repo no GitHub (`git init`, `add`, `commit`, `push`) com o workflow configurado.

## Visualizando execuções

Aba **Actions** do GitHub mostra se os testes passaram ou falharam. Clicar em "Executar fluxo de trabalho" mostra todas as steps; clicar em "Executar testes do Playwright" mostra erros, esperado vs. recebido, e o call log.

## Relatório HTML no CI

Na seção **Artifacts** da run, baixe o relatório (zip). Abrir o `index.html` direto não funciona — precisa de um servidor web:

```bash
npx playwright show-report name-of-my-extracted-playwright-report
```

## Visualizando o Trace

Depois de abrir o relatório com `show-report`, clique no ícone de trace ao lado do nome do arquivo de teste para inspecionar cada ação e investigar falhas.

## Publicando relatório na web (opcional)

Baixar o zip toda vez não é prático — dá pra hospedar o relatório HTML em **Azure Storage (static website hosting)**:

1. Criar conta de Storage no Azure e habilitar hospedagem de site estático.
2. Criar service principal com acesso de **Storage Blob Data Contributor**:
   ```bash
   az ad sp create-for-rbac --name "github-actions" --role "Storage Blob Data Contributor" --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP_NAME>/providers/Microsoft.Storage/storageAccounts/<STORAGE_ACCOUNT_NAME>
   ```
3. Adicionar os secrets no repo GitHub: `AZCOPY_SPA_APPLICATION_ID`, `AZCOPY_SPA_CLIENT_SECRET`, `AZCOPY_TENANT_ID`.
4. Adicionar step de upload no workflow:
   ```yaml
   - name: Upload HTML report to Azure
     shell: bash
     run: |
       REPORT_DIR='run-${{ github.run_id }}-${{ github.run_attempt }}'
       azcopy cp --recursive "./playwright-report/*" "https://<STORAGE_ACCOUNT_NAME>.blob.core.windows.net/\$web/$REPORT_DIR"
       echo "::notice title=HTML report url::https://<STORAGE_ACCOUNT_NAME>.z1.web.core.windows.net/$REPORT_DIR/index.html"
     env:
       AZCOPY_AUTO_LOGIN_TYPE: SPN
       AZCOPY_SPA_APPLICATION_ID: '${{ secrets.AZCOPY_SPA_APPLICATION_ID }}'
       AZCOPY_SPA_CLIENT_SECRET: '${{ secrets.AZCOPY_SPA_CLIENT_SECRET }}'
       AZCOPY_TENANT_ID: '${{ secrets.AZCOPY_TENANT_ID }}'
   ```

> Não funciona para PRs vindos de forks (sem acesso a secrets).

## Cuidado com segredos

Traces, relatórios HTML e logs de console podem conter dados sensíveis (credenciais de teste, tokens, código-fonte). Trate como dado sensível: suba artifacts só pra repositórios confiáveis, ou criptografe antes de subir/compartilhar.
