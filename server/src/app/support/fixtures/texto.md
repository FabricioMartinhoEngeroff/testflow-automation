# Pesquisa Ltcat

## 1.Acesso

\* A tela deve ser acessada através do seguinte caminho: Apollus > Segurança > laudos e Laudos > LTCAT.

## 2.Atores

* Permissões conforme [atores e permissões](/doc/ltcat-ghe-HRa1iVUs6W#permissoes)

## 3.Regras gerais

* **RG1** – Usuário com permissão de Incluir, Visualizar, Alterar e Cancelar/Excluir têm acesso a tela, independente da unidade de permissão. Ou seja, basta ter algum perfil de acesso ao módulo para poder acessar essa tela.
* **RG2** - Ao acessar o módulo o sistema verificará se o usuário logado possui o mesmo CPF que um dos profissionais (Gestão de Cadastros > Cadastros Gerais > Profissional) cadastrados. Caso possuir o mesmo CPF e o cadastro do profissional possuir a flag "Responsável Técnico" marcada e o mesmo não possuir certificado digital cadastrado o sistema deverá [exibir modal](/doc/certificado-zLCGhK83x3) solicitando ao usuário se ele deseja realizar o cadastro nesse momento.

## 4.Pesquisa de LTCAT

### Formulário de Pesquisa

Devem ser apresentadas as seguintes opções de filtro:

| Label | Tipo | Função | Intervalo de dados | Controla_componentes? | Obrig? | Opção padrão? | Ordem | Estado_Inicial |
|-------|------|--------|--------------------|-----------------------|--------|---------------|-------|----------------|
| **01. <Título_da_Hierarquia_1>** | Multiselect com pesquisa | Filtrar registros com a hierarquia 1 correspondente em seu cadastro. | Unidades ativas e inativas ------------------------------------------ Exibe as unidades conforme permissão do usuário, as quais o usuário possui ao menos uma permissão Incluir (INC), Alterar (ALT), Visualizar (VIS) ou Cancelar/Excluir (EXC) na funcionalidade Programas e laudos > LTCAT. Conforme detalhamento em [atores e permissões](/doc/ltcat-ghe-HRa1iVUs6W#permissoes) ------------------------------------------ Exibe Código e descrição. | Sim, Hierarquia 2. ---------------------------------------------- Ao selecionar apenas uma opção habilita e atualiza os dados do campo Hierarquia 2. ---------------------------------------------- Ao selecionar mais de uma hierarquia 1 ou nenhuma, o campo hierarquia 2 deve ficar em branco e bloqueado. | Sim    | Caso o usuário possuir permissão de Incluir (INC), Alterar (ALT), Visualizar (VIS) ou Cancelar/Excluir (EXC) para apenas uma unidade, deve exibir a unidade de permissão do usuário. | Ascendente de Código | Habilitado     |
| **02. <Título_da_Hierarquia_2>** | Multiselect com pesquisa | Filtrar registros com a hierarquia 2 correspondente em seu cadastro. Exibe as unidades conforme permissão do usuário, as quais o usuário possui ao menos uma permissão Incluir (INC), Alterar (ALT), Visualizar (VIS) ou Cancelar/Excluir (EXC) na funcionalidade Programas e laudos > LTCAT. Conforme detalhamento em atores e permissões | Hierarquias 2 ativas e inativas conforme opção selecionada em <hierarquia_1>. ------------------------------------------ Exibe Código e descrição. | Sim, hierarquia 3. ---------------------------------------------- Ao selecionar apenas uma opção habilita e atualiza os dados do campo hierarquia 3. ---------------------------------------------- Ao selecionar mais de uma hierarquia 2 ou nenhuma, o campo hierarquia 3 deve ficar em branco e bloqueado. | Não    | -             | Ascendente de Código | Bloqueado. Controlado por outro componente. |
| **03. <Título_da_Hierarquia_3>** | Multiselect com pesquisa | Filtrar registros com a hierarquia 3 correspondente em seu cadastro. | Hierarquias 3 ativas e inativas conforme opção selecionada em <hierarquia_2>. ------------------------------------------ Exibe Código e descrição. | Não                   | Não    | -             | Ascendente de Código | Bloqueado. Controlado por outro componente. |
| **04. Ano** | Select | Filtrar LTCATs que possuam o ano correspondente em um dos campos "Vigência do laudo". | Select exibindo apenas anos. Deve exibir o ano atual, 10 anos anteriores ao atual e 10 anos posteriores ao atual, em ordem crescente numérica. Não deve permitir digitar. | Não                   | Não    | -             | Ascendente de Ano | Habilitado.    |

### Botões de ações

| Botão | Ícone | Tooltip | Ação | Visível? | Regras |
|-------|-------|---------|------|----------|--------|
| **Limpar** | times | "Limpar" | Resetar o formulário de pesquisa para o preenchimento padrão | Apenas quando o formulário tiver ao menos um campo preenchido | -      |
| **Pesquisar** | filter | "Pesquisar" | Realizar a busca conforme dados preenchidos no formulário de pesquisa. | Sempre   | 1. Realiza a validação de campos obrigatórios. Caso os campos obrigatórios não foram preenchidos, o sistema emite a mensagem \[`campos_obrigatorios`\] . |
|       |       |         |      |          | 2. Caso não existam registros para o filtro informado, o sistema emite a mensagem \[`pesquisa_sem_dados`\] |
|       |       |         |      |          | 3. Ação disparada ao selecionar um campo de filtro e clicar em "Enter". |
|       |       |         |      |          | 4. Não diferenciar letras maiúsculas, minúsculas, com acento e caracteres especiais. |
|       |       |         |      |          | 5. Caso esteja tudo ok, deve retornar os registros de acordo com os filtros informados na tela. Traz somente os LTCATs cadastrados na hierarquia 1 ou hierarquia 1 e 2 para as quais o usuário possuir ao menos uma permissão Incluir (INC), Alterar (ALT), Visualizar (VIS) ou Cancelar/Excluir (EXC) na funcionalidade Programas e laudos > LTCAT. Conforme detalhamento em atores e permissões |
| **Recolher/Expandir filtros** | keyboard_arrow_down, keyboard_arrow_up | "Recolher filtros avançados" "Expandir filtros avançados" | Exibir e esconder os filtros adicionais | Sempre: um ou outro | -      |

### Resultado da consulta

* Deve listar os LTCATs cadastrados conforme filtros.
* Apresentados em forma de Grid, permitir ordenar colunas.
* Ordenação padrão: "Data início", descendente (da mais atual pra mais antiga).
* Paginação Padrão: 30 Itens. Podendo selecionar: 5,10,20,30,40,50,60.
* Dados do GRID:

| Coluna | Origem do Dado |
|--------|----------------|
| **1.<titulo_hierarquia_1>** | Campo <hierarquia_1> do cadastro do LTCAT; |
| **2.<titulo_hierarquia_2>** | Campo <hierarquia_2> do cadastro do LTCAT; |
| **3.<titulo_hierarquia_3>** | Campo <hierarquia_3> do cadastro do LTCAT; |
| **4.Responsável** | Campo <responsavel_tecnico> do cadastro do LTCAT; |
| **5.Data Início** | Primeiro campo <vigencia_programa> do cadastro do LTCAT; |
| **6.Data Fim** | Segundo campo <vigencia_programa> do cadastro do LTCAT; |
| **7.Data base** | Campo <data_base> do cadastro do LTCAT; |
| **8.Revisão** | Exibe a opção "sim" se tiver ao menos uma linha não cancelada no "histórico de revisões" no cadastro do LTCAT; |

### Botões de ações da consulta

\* Exibidos ao passar sobre a linha do registro.

| Botão | Ícone | Tooltip | Ação | Visível? | Regras |
|-------|-------|---------|------|----------|--------|
| **Download Assinatura Digital** | file-signature | "Gerar PGR assinado digitalmente" | Gera o relatório em .pdf com a assinatura digital. | ==Visível somente se o arquivo estiver assinado e apenas se o usuário possuir permissão Incluir (INC), Alterar (ALT) ou Visualizar (VIS) para as hierarquias do LTCAT, na funcionalidade Programas e laudos > LTCAT, conforme detalhamento em== [==Atores e permissões==](/doc/ltcat-ghe-HRa1iVUs6W#permissoes) | Ao clicar sistema solicita a geração do relatório em segundo plano. |
| **Gerar LTCAT** | print | "Gerar LTCAT" | Gera o relatório em .pdf ou .docx. | Visível apenas se o usuário possuir permissão Incluir (INC), Alterar (ALT) ou Visualizar (VIS) na funcionalidade Programas e laudos > LTCAT. Conforme detalhamento em [atores e permissões](/doc/ltcat-ghe-HRa1iVUs6W#permissoes) | Ao clicar se comporta conforme botão [da tela de cadastro.](/doc/geracao-ltcat-lxS27UYEf4) |
| **Revisor** | info  | "Revisor: <usuário que alterou o registro> Data <data da alteração no formato: dd/mm/aaaa 23:59:59> | -    | Sempre   | -      |
| **Visualizar** | eye   | "Visualizar" | Redireciona o usuário para a tela de visualização/edição do LTCAT | Visível apenas se o usuário possui permissão "Alterar (ALT)" ou "Visualizar (VIS)" para as hierarquias do LTCAT, na funcionalidade Programas e laudos > LTCAT, conforme detalhamento em [atores e permissões](/doc/ltcat-ghe-HRa1iVUs6W#permissoes) | Ação também disparada por duplo clique |
| **Excluir** | trash-alt | "Excluir" | Abre a modal de exclusão | Visível apenas para usuários com permissão "Cancelar/Excluir (EXC)" para as hierarquias do LTCAT, na funcionalidade Programas e laudos > LTCAT, conforme detalhamento em [atores e permissões](/doc/ltcat-ghe-HRa1iVUs6W#permissoes) | 1.Texto: "Deseja realmente excluir este item?"; Botões: \["Cancelar", "Excluir"; Padrão: "Excluir"\] |
|       |       |         |      |          | 2.Ao clicar em "Excluir" o sistema remove o cadastro do LTCAT e emite a mensagem `sucesso` |
|       |       |         |      |          | 3.Ao clicar em "Cancelar" o sistema fecha a modal e não realiza outra ação |

### Botões de ações no rodapé da tela de pesquisa

\* Exibidos quando o usuário está na tela de pesquisa.

| Botão | Ação | Visível? | Regras |
|-------|------|----------|--------|
| **Novo** | Exibe o formulário de _ghe:geracao<br>_ltcat"> novo cadastro com comportamento default dos componentes. | Visível apenas para usuários que possuem ao menos uma permissão de "Incluir (INC)" na funcionalidade Programas e laudos > LTCAT. Conforme detalhamento em em [atores e permissões](/doc/ltcat-ghe-HRa1iVUs6W#permissoes) | -      |

### Protótipo

 ![](/assets/efs/higiene/ltcat_ghe/tela_pesquisa_ltcat.png)

## Histórico de revisões

| Data | Resumo da Revisão | Local | Responsável | Legenda | Tarefa |
|------|-------------------|-------|-------------|---------|--------|
| 16/03/2026 | Criação           | -     | Júlia       | -       | [Tarefa 45120](https://runrun.it/pt-BR/tasks/45120?isNew=true) |