# Resumo Ivy

```none
Após as especificações individuais terem sido ajustadas esta página poderá ser removida.
Atualmente a tela de cadastro de pessoas é a tela que foi validada e está conforme os padrões definidos pela equipe que está trabalhando no IVY. Ela pode ser usada como base para testes em relação ao layout.
Talvez essa especificação será usada no futuro como especificação geral dos componentes. Por essa razão, estamos aos poucos editando ela incluindo regras gerais de componentes.
```

# Padrões definidos para o IVY

* **IMPORTANTE**: nem todos estes itens já estão contemplados em todas as telas do IVY. Alguns estão sendo definidos conforme desenvolvemos novos módulos e por isso ainda não foram implantados em todas as telas antigas. Conforme as telas forem sendo testadas podemos ir abrindo os chamados para que elas sejam adequadas ao novo padrão.

## Regras Gerais

* O cadastro de pessoas possui alguns campos de 'matrícula', conforme abaixo. Nas especificações sempre utilizamos o nome do campo visível na tela, ou então chamamos de ID quando se trata do ID do registro.
  * Campo 'Matrícula' da tela é o campo <matricula_manual> do banco de dados.
  * Campo 'Matrícula eSocial' da tela é o campo <matricula_esocial> do banco de dados.
  * O 'ID' do cadastro (não visível na tela), no banco de dados é chamado de matrícula.
* Em toda a especificação, caso houver exceções nos itens, as exceções serão descritas na especificação da tela de origem.
* Navegadores: no contrato informamos aos clientes que indicamos a utilização do navegador Google Chrome para utilização do Apollus. Sendo assim, para erros ocasionados em outros navegadores a instrução é que seja utilizado o Chrome. Pode ser aberto chamado para ajuste quando o cliente reportar, mas não será prioritário.

## 1.Telas de pesquisa

### Filtros fixos

* Os filtros fixos das telas de pesquisa de cadastros básicos ou configurações mais corporativas será:
  * Campo que norteia o cadastro (geralmente é o campo de 'Descrição' do cadastro);
* Além do campo descrito acima, para os demais cadastros os campos fixos das telas de pesquisa serão:
  * Hierarquia 1;
  * Hierarquia 2 (somente para empresas que possuírem a configuração nivelObrigatoriedadedeArea igual a 1 no painel admin).
* A ordenação esperada é: "Hierarquia 1", "Hierarquia 2"(se visível) e "Campo que norteia o cadastro".
* Ao sair da tela e retornar deve-se manter os filtro aplicados anteriormente.
* Exemplo. ![](/assets/efs/filtros.png)

### Filtros avançados

* Os filtros avançados das telas de pesquisa são os filtros que não são exibidos imediatamente ao acessar a tela. É necessário clicar botão 'Expandir filtros avançados' para que sejam exibidos. Exemplo.
* Ao sair da tela e retornar deve-se manter os filtro aplicados anteriormente.

### Filtros rápidos

* Os filtros rápidos serão definidos individualmente por tela, uma vez que cada tela possui filtros diferentes.
* O filtro rápido que tiver selecionado deve estar em tom cinza um pouco mais escuro que o tom normal do componente.
* Ao sair da tela e retornar deve-se manter os filtro aplicados anteriormente.
* Exemplo. ![](/assets/efs/filtros_rapidos.png)

### Componente Chips

* O componente somente aparecerá quando a tela estiver com os filtros avançados recolhidos (uma vez que quando estão expandidos todos já são exibidos) ou quando não houver filtros avançados.
* Ao utilizar qualquer filtro na tela de pesquisa o sistema adicionará logo acima do cabeçalho um componente 'chips' para cada filtro utilizado, que exibe o nome do filtro e a informação inserida no filtro.
* Ao clicar no ícone *times* de um 'chips' este componente será removido assim como o filtro aplicado na tela de pesquisa. O 'chips' é exibido individualmente por filtro utilizado.
* Exemplo. ![](/assets/efs/chips.png)

### Menu de colunas

* O novo menu de colunas possibilita ocultar e re-exibir colunas da tela de pesquisa.
* O novo menu também possibilita congelar a visualização da primeira coluna que está sendo exibida na tela de pesquisa. Congelar a coluna significa que quando houver scroll na tela, essa coluna se manterá fixa, ou seja, ao rolar o scroll para as laterais as demais colunas serão ocultas por trás desta congelada (idêntico ao funcionamento de congelar colunas do excel).
* O cabeçalho possui a funcionalidade de redimensionar a largura da coluna.
* A maioria das colunas permite ordenação (descrita na especificação individual), porém a regra deve ser de acordo com o contexto:
  * Ordenação de texto: Sempre se atentar que a ordenação alfabética não deve diferenciar maiúsculas e minúsculas.
  * Ordenação de data: 10/05/2025; 02/04/2026; 05/06/2026;
  * Ordenação de dados cuja origem é exclusivamente numérica: 0,00000999; 3; 10; 52,6;
  * Ordenação de campos cuja origem é um catalogo limitado que remete a intervalo de tempo: semanal, 15 dias, mensal, anual.
  * Ordenação de dias da semana: iniciar em domingo, ordem de calendário;
  * Ordenação de meses: iniciar em janeiro, ordem do calendário;
* Importante: quando o usuário realizar logout e login OU realizar limpeza de cache, essas configurações acima se manterão conforme definido pelo usuário.
* Exemplo. ![](/assets/efs/menu_colunas.png) ![](/assets/efs/redimensionar.png)

### Botões de ações tela de pesquisa

* O botão da ação principal da tela de pesquisa (**pesquisar**...) deverá ser preenchido. Os botões de ação secundária deverão ser vazados (**limpar**,**expandir**...).
* Importante: na tela de pesquisa tanto o botão de filtrar quanto o botão de novo registro são principais. Portanto ambos estarão preenchidos. Exemplo.
* Os botões de exibir e ocultar filtros avançados deverá possuir tooltip 'Recolher filtros avançados' e 'Expandir filtros avançados'. Exemplo.
* O botão de limpar filtros deverá:
  * Possuir tooltip 'Limpar'.
  * Limpar os filtros;
  * Atualizar a pesquisa quando não houver campos obrigatórios a serem preenchidos;
* Ficou definido que nas telas de pesquisa os botões de ação (visualizar, revisor, excluir, cancelar) seguirão a seguinte regra:
  * Caso houver somente uma ação: exibe o botão na lista. Exemplo.
  * Caso houver mais que uma ação: exibe o menu dropdown. Exemplo.

### Grid de pesquisa de cadastros

* Quando não houver resultados para o filtro inserido, o sistema deverá exibir a mensagem fixa no centro da tela 'Sem registros para listar.' Não deve mais exibir a mensagem temporizada amarela. Exemplo.
* Quando uma coluna for pequena para a informação existente em uma linha, a linha não deve ser quebrada ou aumentada para exibir a totalidade da informação. Deverá exibir o texto possível na linha e em seguida acrescentar três pontos (...). Ao passar o mouse por cima o sistema exibirá tooltip com o texto completo. Exemplo.
* Os ícones de grids e telas de pesquisa devem ser vazados (quando existir e for legivel) e devem ficar dentro de um menu na linha.
* Os Grids de pesquisa terão por padrão:
  * Coluna ordenada por default conforme descrito no item a seguir;
  * Paginador conforme descrito a seguir;
  * Ajuste de largura das colunas;
  * Função de fixar/ocultar/exibir colunas;
  * Função de mover colunas exibidas;

#### Ordenação Grid

* Possibilita selecionar por qual coluna a lista será ordenada.
* Por default a tela será ordenada conforme descrito na EF de origem.
* Ao lado do título de cada coluna haverá uma seta para cima e com cor opaca (visível somente ao passar o mouse).
* Quando o usuário selecionar uma coluna para ordenação a seta dessa coluna ficará com cor nítida para identificar a ordenação selecionada (ascendente ou descendente) e atualizará a lista conforme essa ordenação.
* Para colunas com informações descritivas a ordenação será por ordem ascendente alfabética;
  * **Exceção**: Para colunas com pessoas deverá ser ordenado por "Nome" e não por matrícula (para listas e campos);
* Para colunas com informações de data a ordenação será por ordem ascendente da data;
* Ao clicar na mesma coluna a ordenação será alternada de ordem crescente para decrescente e vice e versa, conforme ordenação atual;
* Permitir somente uma coluna ordenada.
* Já existe coluna diferente ordenada?
  * **SIM**: A coluna anterior volta ao estado sem ordenação, e a coluna nova selecionada será ordenada em ordem crescente;
  * **NÃO**: A coluna selecionada será ordenada em ordem crescente;

 ![](/assets/efs/sem_registros.png)

 ![](/assets/efs/tooltip_lista_pesquisa.png)

#### Paginador

* O paginador completo exibe as seguintes informações:
  * Número de itens por página.
  * Informação de intervalo de itens que estão sendo exibidos na página.
  * Número total de itens filtrados.
  * Navegação para página anterior e posterior.
* O novo padrão de paginador possui as seguintes opções: 5, 10, 20, 30, 40, 50, 60.
* Por default a opção padrão é 30 itens por página.
* O paginador deve estar sempre no canto inferior direito do rodapé do fundo branco da tela. O mesmo serve para quando houver somente a informação de quantidade de itens na tela.
* Exemplo. ![](/assets/efs/paginador.png)

### Fundo da tela

* O fundo branco da tela de pesquisa deve sempre ir até o final da tela, e não somente até onde houver registros.
* Exemplo. ![](/assets/efs/fundo_branco.png)

### Tipos de campos

* **Input descritivo**: todo input descritivo possibilitará filtrar utilizando o enter.

### Idioma sem descrição - pesquisa de parâmetros

* **Ícone:** info;
* **Tooltip:** "Cadastro sem descrição para o idioma selecionado."
* **Funcionamento:** quando não houver descrição cadastrada no idioma do usuário logado, o sistema exibirá o ícone na coluna "Descrição". Ao passar o mouse sobre o ícone, será exibida a mensagem informando que o cadastro não possui descrição para o idioma selecionado. A mensagem será exibida no idioma do usuário.
* **OBS:** o ícone apenas estará disponível na tela de pesquisa/listagem dos parâmetros dos módulos.

## 2.Telas de cadastro

### Tipos de campos

* **Input descritivo**:
  * Permite todos os tipos de caracteres, como por exemplo números, letras, caracteres especiais, caixa alta e baixa, permite colar. Exceções serão mencionadas nas especificações individuais.
  * Este componente sempre deverá possuir contador de caracteres.
  * Ao informar um dado que não é permitido para o campo, manter a informação na tela para que o usuário possa enxergar o que informou, sinalizar em vermelho e exibir mensagem temporizada individualmente relativa ao erro específico da tela. Exemplo de erro: campo não permite o numeral 0 e o usuário informou o numeral 0.
  * Importante: não abrir chamados ocasionados em função de erros por inserção de emojis nos campos desse tipo; por padrão, no negócio o cliente não utilizará emojis no sistema e, caso utilizar, será informado que não tratamos erros originados por este motivo.
* **Select com pesquisa**: quando o sistema não encontrar resultado para o texto digitado, o componente exibe o texto 'Nenhum registro encontrado'. Esse é um comportamento padrão desse componente. Este componente também pode trazer resultado somente a partir da digitação de 3 caracteres, caso estiver descrito na especificação de origem. Isso ocorrerá quando for identificado que o campo pode possuir muitos resultados. Quando o campo tiver este comportamento, também possui um comportamento em que o resultado da busca não é apagado ao desfocar o campo.
* **Multiselect com pesquisa**: quando o sistema não encontrar resultado para o texto digitado, o componente exibe o texto 'Nenhum registro encontrado'. Esse é um comportamento padrão desse componente. Este componente também pode trazer resultado somente a partir da digitação de 3 caracteres, caso estiver descrito na especificação de origem. Isso ocorrerá quando for identificado que o campo pode possuir muitos resultados. Quando o campo tiver este comportamento, também possui um comportamento em que o resultado da busca não é apagado ao desfocar o campo.

### Largura da tela

* A largura será definida individualmente por tela. Durante os testes, caso julgar que a tela está apertada para a quantia de campos ou então que ela está muito grande para a quantia de campos pode ser aberto chamado para que seja avaliado. Neste exemplo, a tela está muito apertada para a quantia de campos, dessa forma ela pode ser ajustada para que ocupe toda a largura da tela.
* Já os cadastros básicos que possuem poucos campos (cadastro de catálogos, por exemplo), não precisam ocupar toda a tela.

 ![](/assets/efs/largura.png)

### Botões tela de cadastro

* Cadastros que possuírem collapse (bloco que pode ser expandido), o ícone para expansão deve estar no final da linha, e não logo após a label. Exemplo.
* Caso o cadastro possua uma lista dentro dele (grid) a tela:
  * Pode possuir um campo para pesquisa. Neste caso, os botões da pesquisa (**pesquisar**,**limpar**) deverão ser vazados. Exemplos.
  * O formulário para o cadastro deverá estar em uma modal. Exemplo.
  * O acesso à modal será um ícone (*plus*) + label (geralmente se chamará "Adicionar").
  * Exceções:
    * Quando o formulário estiver dentro de um cadastro que já está em uma modal, manter no padrão antigo (NGX e JS), sendo um botão preenchido com ícone *plus* e tooltip 'Adicionar' e um botão vazado com ícone *times* e tooltip 'Limpar'.
    * As modais de cadastros básicos que existem no GHE reaproveitam o código da tela de cadastros gerais. Por essa razão, tanto os cadastros básicos no GHE como em cadastros gerais possuem o formato descrito acima.
    * Caso houver outras exceções deverão estar listadas na EF específica da tela.
* Ficou definido que nas telas de cadastro os botões de ação (revisor, excluir, editar) sempre estarão visíveis na lista. Exemplo.
* Também possuem ícone padrão as seguintes funções:
  * Revisor: Info ("i" com círculo)
  * Excluir: Delete (lixeira)
  * Editar: Edit (lápis)
  * Visualizar: eye
* Poderá ser avaliado em casos de listas grandes, e nao for algo de muita gravidade, de colocar uma função de permitir excluir varios dentro do cadastro.
* O botão 'Salvar' das telas somente deve estar habilitado caso algum campo da tela tenha sido alterado, salvo registros com status 'Iniciado' e casos mencionados na especificação própria da tela. Obs.: se atentar bem às regras individuais de cada tela.
  * Exceção: caso esteja ocorrendo um upload de documento o qual não foi concluído, ao clicar , o sistema deve emitir a seguinte mensagem: *__\[upload_pendente\]__*
* O botão salvar e criar outro, ou salvar e adicionar outro, só estará visível na criação de novos cadastros; Deverá ser habilitado somente ao editar um campo (exceção: caso todos os campos obrigatórios tiverem sido preenchidos automaticamente pelo sistema, como hierarquia 1 quando só há uma permissão, o botão deverá estar habilitado por default). Na edição de um cadastro já existente, o botão permanece oculto.
  * Deverá se chamar "Salvar e criar outro" nos casos em que o cadastro é acessado pelo botão "novo"
  * Deverá se chamar "Salvar e adicionar outro" nos casos em que o cadastro é acessado pelo botão adicionar

 ![](/assets/efs/listanatela.png)

 ![](/assets/efs/fechar_modais.png)

 ![](/assets/efs/collapse.png)

 ![](/assets/efs/botoes_lista.png)

 ![](/assets/efs/acesso_modal.png)  ![](/assets/efs/modelo_modal.png)

 ![](/assets/efs/cabecalho_pesquisa.png)

 ![](/assets/efs/menu_lista.png)

 ![](/assets/efs/menu_dropdown.png)

 ![](/assets/efs/expandir_recolher.png)

### Navegação/redirecionamento após salvar

* O botão de salvar (diferente do salvar e criar/adicionar outro), possui 2 comportamentos diferentes a depender do tamanho do cadastro:
  * **Tamanho P/M**: Após salvar, direcionar o usuário para a tela de pesquisa;
  * **Tamanho G/GG**: Após salvar, manter o usuário para a tela do cadastro salvo;
* **Entende-se por cadastros P/M:**
  * Cadastros compostos por componentes de formulários (inputs de texto, data, hora, de seleção simples ou multi, radio buttons, checkboxes) que numa página do cadastro principal não geram uma rolagem na menor resolução validada : 1024\*768
* **Entende-se por cadastros G/GG:**
  * Cadastros que possuem no mínimo um dos componentes:
    * Abas
    * Grids
    * collapses
    * Modais
    * geração de relatório
    * botão de duplicar
    * ou que os componentes de formulário já geram uma rolagem na menor resolução validada : 1024\*768
    * telas de configurações

### Revisor

* Os dados de revisor do cadastro estarão na tela de pesquisa e na aba de 'Informações' do cadastro **salvo**, que é acessada na aba retrátil clicando no ícone *info* no canto superior direito do cadastro.
* As regras para o layout do revisor na tela de pesquisa estão descritas no tópico "Revisor (telas de pesquisa)"
* Observação: para registros que possuem a possibilidade de salvar como rascunho, a informação de qual dado inserir na criação e revisão deverão ser verificadas nas EFs individuais. O formato se manterá o descrito abaixo.
* As telas de configurações deverão possuir também os dados de revisor. Os dados existirão a partir do primeiro usuário que salvar a modal. Pode ser que este dado não exista no banco de dados para registros anteriores à inclusão do revisor. Para estes casos, ele estará vazio, até que um usuário salve novamente a configuração.
* Os registros que possuírem dados extras, como dados do cancelamento e dados da assinatura digital, terão blocos para exibir estes dados no revisor disponível na aba retrátil.
* **Importante**: o ícone somente estará visível quando o cadastro já tiver sido salvo ao menos uma vez.
* Formato de revisor para parâmetros:
  * Criado por: + quebra de linha + <matricula> - <nome> (dados do usuário que criou o registro; não possuindo matrícula exibir somente <nome>; não havendo informação de criação no banco de dados exibir um traço ( - )); Uma quebra de linha;
  * Uma quebra de linha;
  * Data da criação: + quebra de linha + dd/mm/aaaa, hh/mm/ss (dados da momento em que o registro foi salvo pela primeira vez; não havendo informação de criação no banco de dados exibir um traço ( - ));
  * Uma quebra de linha;
  * ⦁ Revisado por: + quebra de linha + <matricula> - <nome> (dados do último usuário que salvou o registro; não possuindo matrícula exibir somente <nome>); exibir um traço caso o registro não tenha sido editado (somente criado); Uma quebra de linha;
  * Uma quebra de linha;
  * Data da revisão: + quebra de linha + dd/mm/aaaa, hh/mm/ss (dados da momento em que o registro foi salvo pela última vez); exibir um traço caso o registro não tenha sido editado (somente criado); Uma quebra de linha;
  * Exemplos de exibição dos dados, podendo haver diferenças de layout.
* Modelo dos parâmetros [revisor_parametros.png?nolink](/assets/efs/revisor_parametros.png?nolink)
* Formato de revisor para registros:
  * Criação
  * Criado por:+ quebra de linha + <matricula> - <nome> (dados do usuário que criou o registro; não possuindo matrícula exibir somente <nome>; não havendo informação de criação no banco de dados exibir um traço ( - ));
  * Uma quebra de linha;
  * Data da criação: + quebra de linha + dd/mm/aaaa, hh/mm/ss (dados da momento em que o registro foi salvo pela primeira vez; não havendo informação de criação no banco de dados exibir um traço ( - ));
  * Revisão
  * Revisador por: + quebra de linha + <matricula> - <nome> (dados do usuário que revisou o registro; não possuindo matrícula exibir somente <nome>; não havendo informação de revisão no banco de dados exibir um traço ( - ));
  * Uma quebra de linha;
  * Data da revisão:  + quebra de linha + dd/mm/aaaa, hh/mm/ss (dados da momento em que o registro foi revisado pela última vez; não havendo informação de revisão no banco de dados exibir um traço ( - ));
  * Justificativa: quando houver a informação de justificativa, imprimir o dado informado na justificativa, caso não houver justificativa no banco de dados exibir um -.
  * Registro (específico ASO)
  * Registrado por: + quebra de linha + <matricula> - <nome> (dados do usuário que registrou o ASO; não possuindo matrícula exibir somente <nome>; não havendo informação de registro no banco de dados exibir um traço ( - )); Uma quebra de linha;
  * Uma quebra de linha;
  * Data de cancelamento:  + quebra de linha + dd/mm/aaaa, hh/mm/ss (dados da momento em que o registro foi registrado; não havendo informação de registro no banco de dados exibir um traço ( - ));
  * Uma quebra de linha;
  * Número do registro: número gerado ao registrar o ASO, caso não houver informações de número de registro em banco de dados exibir um -.
  * Cancelamento
  * Cancelado por: + quebra de linha + <matricula> - <nome> (dados do usuário que cancelou o registro; não possuindo matrícula exibir somente <nome>; não havendo informação de cancelamento no banco de dados exibir um traço ( - ));
  * Uma quebra de linha;
  * Data de cancelamento:  + quebra de linha + dd/mm/aaaa, hh/mm/ss (dados da momento em que o registro foi cancelado; não havendo informação de cancelamento no banco de dados exibir um traço ( - )); Uma quebra de linha;
  * Uma quebra de linha;
  * Justificativa: + quebra de linha + justificativa inserida no cancelamento, não havendo informação de justificativa no banco de dados exibir um traço ( - )); Uma quebra de linha;
  * Exemplos de exibição dos revisores de cadastros, podendo haver diferenças de layout.
* Modelo dos cadastros [Revisor de criação](/assets/efs/revisor_criacao.png?nolink) [Revisor de revisão](/assets/efs/revisor_revisao.png?nolink) [Revisor de cancelamento](/assets/efs/revisor_cancelamento.png?nolink) [registro_aso.png?nolink](/assets/efs/registro_aso.png?nolink)

### Grids dentro de cadastro/ou tela de configuração

* Os Grids dentro de cadastros terão por padrão:
  * Coluna ordenada por default conforme definição da ef (pois podem haver casos de ordenação manual do usuário como:ordem de alternativas, questões );
  * Ajuste de largura das colunas;
  * ícones de ação visíveis (sem necessidade de acesso por um menu);
  * Paginação se informada na ef;
  * Mesmas caracteristicas do grid de pesquisa:
    * Quando não houver resultados para o filtro inserido, o sistema deverá exibir a mensagem fixa no centro da tela 'Sem registros para listar.' Não deve mais exibir a mensagem temporizada amarela.
    * Quando uma coluna for pequena para a informação existente em uma linha, a linha não deve ser quebrada ou aumentada para exibir a totalidade da informação. Deverá exibir o texto possível na linha e em seguida acrescentar três pontos (…). Ao passar o mouse por cima o sistema exibirá tooltip com o texto completo.
    * Os ícones de grids e telas de pesquisa devem ser vazados (quando existir e for legível).
* Os Grids dentro de cadastros **não** possuem por padrão (caso possuir , deverá constar na ef , ou consultar analista para ajuste):
  * Função de fixar/ocultar/exibir colunas;
  * Função de mover colunas exibidas;

## 3.Telas de visualização de cadastro

* Na visualização de um cadastro, sistema deverá trazer os dados conforme foram inseridos no cadastro, mesmo que determinada opção selecionada esteja com status "Inativo" no seu cadastro básico.

## 4.Componentes diversos

### Componentes de select

* Os componentes de select não deverão possuir mais a opção em branco ou opção 'Todos', que existia anteriormente, quando o campo não era obrigatório. Conforme for possível, abrir chamados para remover as opções. Geralmente quando existia uma opção em branco ou 'Todos' no select, era porque o campo era obrigatório e essa opção era utilizada; Atualmente quando existir uma opção em branco ou 'Todos' no campo será porque ele não é obrigatório, portanto basta deixar o campo vazio. Casos de exceção serão mencionados na EF específica.

### Componentes de hierarquia

* Os componentes de hierarquia devem exibir sempre o código e a descrição no intervalo de dados. Por essa razão, as opções deverão ser ordenadas em ordem alfabética por código e em seguida da descrição.

### Componentes de select e multiselect (regras comuns)

* Em componentes de select ou multiselect com pesquisa, o componente deve permitir realizar a pesquisa pela informação que está sendo exibida no campo. Exemplo: Se no componente está exibindo a informação de Código + Descrição de um cadastro, deve ser permitido realizar a pesquisa pelo código OU pela descrição. Caso esteja exibindo apenas descrição, permite pesquisar apenas por descrição, e assim por diante
* Para os campos que trazem cadastros ativos e inativos, deve concatenar a informação de status "(inativo) do cadastro junto da descrição

### Data

* Os campos de data não devem ser limpos quando o usuário informar um dado incorreto. Manter a informação na tela para que o usuário possa enxergar o que informou. O campo ficará sinalizado em vermelho e exibirá mensagem temporizada individualmente relativa ao erro específico da tela.
* Os campos de data ao serem preenchidos com datas que precisam de formatação, conforme o exemplo abaixo, serão formatos automaticamente ao preencher o campo, sem a necessidade de clicar fora do mesmo para a formatação acontecer.
* Caso o ano do campo de data não seja preenchido em sua totalidade, o sistema realizará o seguinte ajuste:
  * Usuário preenche 01/01/1, sistema ajusta para 01/01/0001 (ao informar um caractere, completa com três zeros à esquerda)
  * Usuário preenche 01/01/101, sistema ajusta para 01/01/0101 (ao informar três caracteres, completa com um zero à esquerda)
  * Usuário preenche 01/01/24, sistema ajusta para 01/01/2024
  * Usuário preenche 01/01/25, sistema ajusta para 01/01/2025
  * Usuário preenche 01/01/60, sistema ajusta para 01/01/2060
  * Usuário preenche 01/01/70, sistema ajusta para 01/01/1970
  * **Importante**: no exemplo dos anos 60 e 70 o auto preenchimento considera o ano atual para fazer o ajuste. Sendo assim, o resultado pode mudar de 1960 para 2060 e de 1970 para 2070 considerando o ano atual.
* ~~Não permitir informar datas menores que 01/01/1900, sistema deverá limpar o campo, exceto se algum caso excepcional o negócio definir que deve ser permitido. De regra geral, deve limpar.~~ Regra removida pela Jana no dia 11/07/24, por entendermos que esse ajuste não ocasiona ganhos tão relevantes para o cliente que valham o trabalho que os analistas, DEVs e testers terão para ajustar todos os campos de data do sistema. Essa limitação de data é uma regra antiga em bancos de dados, excel e sistemas operacionais e essa foi a forma de tratarmos (no passado). Atualmente não tivemos mais erros ocasionados por essa limitação e o sistema preenche as datas conforme detalhamento acima. Caso voltar a ocorrer, podemos tratar incluindo essa regra somente nas telas em que ocorrer o problema, mas aí deve ser alinhado com analista e DEVs. Solicitamos aos testers que realizem os testes utilizando datas reais e comuns para o negócio.

### Modais

* O acesso às modais será sempre um ícone + label (ícone será informado na especificação). Exemplo.

### Componentes pequenos

* Os ícones, checkboxes, radiobuttons, helps, ícones de revisor, de modo geral, não devem estar coloridos, a cor padrão deve ser cinza.
* Modelo de tamanho e cor: exemplo. ![](/assets/efs/tooltips.png)

### Fontes

* Observar sempre a fonte e o tamanho da fonte, pois ela é padrão nas telas e não deve possuir mais que uma.

### Margens

* Observar as margens, para que não fiquem grandes demais nem pequenas demais nas telas e modais.

### Placeholder

* O placeholder dos campos deve ser igual à label, pois no IVY, ao clicar no campo, o placeholder sobe para o topo do campo, passando a ser a label.
* As exceções (campos que deverão possuir placeholder diferente), serão mencionadas nas EFs específicas.
* Exceção: os componentes do tipo select ou multiselect com pesquisa, que trazem resultados a partir da digitação de 3 letras, deverão continuar com placeholder ('Digite 3 letras ou a matrícula'), uma vez que ao clicar no campo essa é a única forma de o usuário saber que as três letras são obrigatórias para iniciar a busca.
* Campos obrigatórios devem ser sinalizados com um ' \* ', para indicar a obrigatoriedade. Nos casos em que o campo obrigatório for sinalizado em vermelho, o ' \* ' também deve ser sinalizado em vermelho

### Multi-idioma

* Os campos sinalizados como multi-idioma possuirão o seguinte comportamento:
  * Para clientes com a opção ativa:
    * Exibir os 3 idiomas padrão e habilitar campos para cadastros nesses idiomas;
    * Caso algum idioma não estiver preenchido (ao criar ou editar, via interface ou API), deverá ser preenchido com o texto informado para o idioma do usuário logado. Evitando assim, desconforto de campo em branco em algum idioma ou bug de excesso de caracteres causados por sufixo adicional. Itens já desenvolvidos não serão percorridos em massa, porém quando tiver oportunidade, pode-se abrir chamado de melhoria.
  * Para clientes com a opção inativa, ocultar a possibilidade de preenchimento em outros idiomas, porém salvar para o idioma "Português - Brasil";
* Idiomas:
  * Português - Brasil
  * Espanhol
  * Inglês

### Componente de edição de texto

* Possui o objetivo de permitir a inserção de texto e formatações de acordo com os requisitos de negócio x possibilidades que componente estudado possui. Para que seja possível inserir o mesmo texto e formatação nas saídas de relatórios em .docx do Apollus.
* Estudo realizado por Guvão em 09/2024, Chamado 33807 : [estudo_formatacao_editor_e_doc_1_.pdf](/assets/efs/cadastro/cadastros/estudo_formatacao_editor_e_doc_1_.pdf)
* Dez/2024 em função de algumas limitações a lib foi alterada para: https://stackblitz.com/edit/nmfgqh?embed=1&file=src%2Fapp%2Fapp.component.html&view=preview
* Definições Padrão:
  * Fonte: Arial
  * Tamanho da fonte: 12
  * Tipo de texto: Normal
  * Alinhamento: alinhado à esquerda (não é possivel utilizar outro tipo de alinhamento por default, motivo: limitação do componente).

| Nome | Componente/Ícone | Tooltip | Atalho | Obs |
|------|------------------|---------|--------|-----|
| Desfazer | Undo             | Desfazer (Ctrl + Z) | Ctrl + z |     |
| Refazer | Redo             | Refazer (Ctrl + Y) | Ctrl + Y |     |
| Negrito | Format bold      | Negrito (Ctrl + B) | Ctrl + B |     |
| Itálico | Format italic    | Itálico (Ctrl + I) | Ctrl + I |     |
| Sublinhado | Format underlined | Sublinhado (Ctrl + U) | Ctrl + U |     |
| Tachado | strikethrough s  | Tachado (Ctrl + Shift + X) | Ctrl + Shift + X |     |
| Subscrito | subscript        | Subscrito | -      |     |
| Sobrescrito | superscript      | Sobrescrito | -      |     |
| Alinhamento do texto | Select com as opções: | Alinhamento de texto | -      |     |
|      | format align left | Alinhar à esquerda | -      |     |
|      | format align right | Alinhar à direita | -      |     |
|      | format align center | Centralizar | -      |     |
|      | format align justify | Justificar | -      |     |
| Aumentar recuo | format indent increase | Aumentar recuo | -      |     |
| Diminuir recuo | format indent decrease | Diminuir recuo | -      |     |
| Marcadores | format list bulleted | Lista com marcadores | -      | Possibilidade de escolher 3 tipos. |
| Numeração | format list numbered | Lista numerada | -      | Possibilidade de escolher 5 tipos. |
| Tipo de Texto | Select com as opções: "Título 1", "Título 2", "Título 3" e "Normal". | -       | -      | Formatação ao selecionar, porém permite alterações: - Título 1 : Maiúsculas; Fonte 12; Negrito; com quebra de linha; - Título 2 : Fonte 12; Negrito; com quebra de linha; - Título 3 : Fonte 12; com quebra de linha; - Normal: Fonte 12; Além das formatações deve ser reconhecido como título nos documentos de saída para fins de construção de sumário no laudo, por exemplo. |
| Fonte | Select com as opções: "Arial", "Calibri", "Lucida Sans Unicode", "Sourse Sans Pro", "Tahoma", "Times New Roman" e "Verdana" | -       | -      |     |
| Tamanho da fonte | Select com as opções: "8", "9", "10", "11", "Padrão"(12), "14", "16", "18", "20", "22", "24", "26", "28", "36", "48" e "72". <br> | Tamanho da fonte | -      |     |
| Selecionar cor do texto | Format color text | Selecionar cor do texto | -      | Seleção de cor conforme componente, permite selecionar em HEX. |
| Inserir link | Insert link      | Inserir link | -      | Exibe campo para inserção de link, nativo do componente. Com controladores de edição e remoção do link |
| Inserir tabela | table            | Inserir tabela | -      | Permite selecionar linhas, colunas, até 10x10. Após inclusão, permite formatações basicas, como: cor de fundo, margem interna, alinhamento do texto horizontal e vertical, inserir linhas acima e abaixo, exluir linha, indicar linha de cabeçalho, mesclar e dividir células. |
| Inserir imagem | Insert photo     | Inserir imagem | -      | Abre a busca de imagem no dispositivo ou por URL, nativo do componente. Permite selecionar alinhamento, largura da imagem, e ajuste manual de dimensões. Texto de ajuda exibido sempre: "A largura máxima recomendada é 650px". |
| Remover formatação | Format clear     | Remover formatação | -      | Limpa a formatação do trecho selecionado, exceto o tipo de texto, nativo do componente. |
| Expandir | up right and down left from center solid | Expandir | -      | Visível quando recolhido, realiza a ação de recolher o menu, campos e botões para expandir o campo de texto e seus componentes de formatação. |
| Minimizar | close fullscreen | Minimizar | -      | Visível quando expandido, realiza a ação de exibir o menu, campos e botões para o estado inicial. |

* Obs:
  * Várias formatações não possuem atalho, testei atalhos conhecidos, porém os mesmos possuem funções reservadas para o navegador e não funcionam no componente de texto via web.
  * Ao mudar para o modo escuro, o componente de edição de texto continuará com fundo branco, pois conforme comentário dos desenvolvedores em 2025, no momento não é possível ajustar para o modo escuro, por motivo de desenvolvimento.
  * Caso não houver limite menor de tamanho do conteúdo, o máximo suportado neste componente é até 10MB no total (somatório incluindo texto, imagens e etc.)

## 5.Diversos

### Relatórios

* Caso o relatório tenha necessidade de filtros de preenchimento obrigatório, ele deverá estar disposto no menu lateral, . Exemplo: relatório de pessoas (campo de hierarquia 1 é obrigatório), relatório de GHEs (campo de hierarquia 1 é obrigatório). Exemplo.
  * A tela de filtros para geração do relatório deverá ficar em uma modal. Por isso, observar sempre os seguintes detalhes:
    * Cuidar as labels dos campos, para que estejam totalmente visíveis. O campo deve ser do comprimento necessário para que o usuário enxergue a label toda sem precisar clicar no campo ou então visualizar tooltip.
    * Junto a isso, cuidar para que os campos que controlam outros sempre estejam numa posição anterior ao campo controlado (nunca um campo controlador estar após o campo controlado).
* Caso o relatório seja gerado diretamente ao clicar em 'Gerar', sem necessidade de preenchimento de filtros obrigatórios, será um botão de 'Exportar' na tela. Exemplo: relatório de riscos, relatório de programação em inspeção de equipamentos. Exemplo.
* Caso o relatório seja um relatório dentro do registro, sem necessidade de filtro, será um botão 'Imprimir' (geralmente a extensão é docx ou pdf). O botão poderá estar dentro do registro ou na tela de pesquisa, conforme regra individual do módulo. Exemplo: relatório de ASO individual e relatório da ocorrência. Exemplo.
* Relatórios poderão ser baixados de duas maneiras: Relatórios gerados e baixados diretamente na tela de geração, ao clicar no botão de download ou de impressão, e relatórios gerados em segundo plano e baixados através da modal de relatórios. Apenas uma alternativa estará disponível para cada relatório. Portanto, relatórios gerados e baixados em primeiro plano não devem gerar uma nova linha na modal de relatórios em segundo plano e vice e versa.

#### Arquivo

Tanto o relatório gerado em segundo plano como o de geração imediata devem possuir as seguintes características documentadas:

| Informação | Regra |
|------------|-------|
| Formato    | Informar a extensão utilizada. Exemplo: DOCX (WORD), PDF, XLSX (Excel) |
| Modelo     | Informar o link do protótipo do relatório, exemplo: [relatorio_documentos.xlsx](/assets/efs/terceiros/relatorio_documentos.xlsx) |
| Nome arquivo | Todos os nomes deverão ter um "Hash" no final, exemplo: REL_GFT_EXCEL_DOCUMENTOS_\[hash\] , independente de tipo de geração de relatório. |
| Células sem informação | Exemplo: "Inserir "-"" (Há casos em que a label deve ser oculta, como em docx ou pdf, por isso, deverá constar na ef do relatório). |
| Considerar idioma do usuário ao gerar o relatório. | (Infomar sempre, exceções de legislação brasileira devem ser validadas se precisam de tradução para ES ou EN com o Product Owner) |
| Realiza a busca nos registros de : | Informar os objetos/cadastros envolvidos na saída do relatório. |

 ![](/assets/efs/imprimir_rodape.png)

 ![](/assets/efs/relatorio_cabecalho.png)

 ![](/assets/efs/relatorio_menu.png)

### Regras de botões que valem para todas as telas

* Os botãos de voltar que redirecionam para menus principais de módulos, quando acionados em telas que ainda não foram migradas para o IVY, deverão redirecionar para o Meu Apollus. Obs.: caso seja possível, pedimos que retorne com o menu lateral aberto no módulo, como por exemplo, se usuário acessou 'Gestão de ações' em 'Ergonomia Participativa' e clicou em 'Menu Ergonomia Participativa', o sistema redireciona para o Meu Apollus, e mantém o menu lateral aberto em Segurança > Ergonomia Participativa.
* Nas modais, além do botão 'Fechar' incluir também o botão 'x' (ícone *times*) para fechar a modal. Exemplo.
* Os botões de ações comuns à todas as telas devem ser quadrados, não retangulares (filtrar, expandir, limpar, adicionar...).
* O botão da ação principal da tela de pesquisa ou do grid (**adicionar**,**pesquisar**,**incluir**,**pesquisar**,**salvar**...) deve vir sempre antes do botão de ação secundária (botão da ação principal à esquerda do botão da ação secundária).

### Regras de logout e login

* Quando o logout for realizado automaticamente pelo Apollus em função de inatividade, ao realizar login novamente o sistema deve redirecionar o usuário para a tela que o mesmo estava no momento do logout.
* Quando o logout for realizado pelo usuário, ao realizar login novamente o sistema deve redirecionar o usuário para o Meu Apollus.

### Regras de campos preenchidos com dados inválidos

* Quando algum campo for preenchido com algum dado inválido, ao realizar a ação da tela, seja ela pesquisa ou salvar, sistema deve apresentar a mensagem prevista no módulo, manter o campo preenchido e sinaliza-lo em vermelho.
* A validação deve ser inclusa no botão de salvar dos módulos também.

### Menu lateral

* O menu lateral pode ser aumentado, diminuído e fechado.
* No menu lateral, o botão da tela que estou acessando deve ficar 'apertado' e o botão do menu que está aberto deve ficar vermelho. Exemplo.
* Os botões do menu lateral de módulos e funcionalidades que o cliente não possui permissão deverão ser ocultos.
* Os botões do menu lateral de módulos e funcionalidades que o usuário não possui permissão deverão ser ocultos.

 ![](/assets/efs/botoes_menu_lateral.png)

### Componentes de reordenação de lista

* Os componentes atuais que permitem reordenar listas deverão ser alterados para o formato 'Arraste para reordenar'.
* Ao passar o mouse por cima da linha o ícone será alterado para o ícone *up-down-left-right*.
* A ordenação deve sempre desconsiderar letras maiúsculas, minúsculas e acentos.

### Cabeçalho Geral

* A modal de geração de relatórios em segundo plano deve estar visível sempre no cabeçalho, mesmo que a tela que está sendo visualizada não possua relatórios para gerar. Exemplo.

 ![](/assets/efs/modal_segundo_plano.png)

### Itens diversos para abertura de chamado

* Os termos abaixo devem ser escritos sempre assim, no que diz respeito às maiúsculas e minúsculas:
  * eSocial
  * EPI
  * EPC
  * EPIs
  * EPCs
  * CAT
  * ASO
  * CNAE
  * CNAEs
  * PGR
  * PPRA
  * LTCAT
  * LTAQ
  * PCMSO
* Abrir chamado para palavras que possuem iniciais maiúsculas desnecessariamente. Maiúsculas são somente para inicial de frase, palavras próprias, palavras específicas do negócio, entre outros.
  * Exceção:
    * Itens do menu lateral (exemplo:Consultar e Registrar, Relatório Analítico, Gestão de Ocorrências, Gestão de Treinamentos...).
    * Nomes de módulos. Exemplos: Gestão de Ocorrências, Gestão de Treinamentos.
* Quando o usuário está num cadastro e duplicar uma guia no chrome a guia deve ser reaberta dentro do cadastro. Sendo assim, sempre testar:
  * Dupla edição: editar os cadastros simultaneamente nas duas abas; Nesses casos, ao tentar salvar o cadastro 'desatualizado' o sistema deve exibir mensagem temporizada em amarelo *"Os dados foram atualizados por outro usuário. Favor visualizar novamente o registro."*.
  * Testar permissões: abrir o link da tela com um usuário que não deve possuir acesso; Nesses casos, assim que o usuário carregar o link o sistema deve exibir mensagem temporizada em amarelo *"Você não possui permissão para acessar esse cadastro."* e redirecionar o usuário para o 'Meu Apollus'. Nesse caso específico, se for necessário abrir chamado, solicitar que o DEV realize a validação incluindo as requisições GET para o endpoint.
  * Caso ocorrer esses dois itens, favor inserir no chamado a frase mencionada acima (realizar a validação incluindo as requisições GET para o endpoint) e também solicitar ao DEV que inclua a revalidação do front-end no back-end.
  * **Importante**: essa regra não é válida para GHE e Prontuário Eletrônico.
* Quando o prontuário no IVY subir para PRD o Meu Apollus subirá junto.
  * Dessa forma, toda vez que o usuário clicar em 'Voltar', 'Menu Principal' ou na logo (nas funcionalidades que antigamente redirecionavam para a mandala), o sistema deve redirecionar para o Meu Apollus.

# Componentes

## Duplo clique

* Sempre que existir a seguinte condição:
  * Existir botão de editar/ou visualizar numa lista (em pesquisa ou cadastro);
  * O usuário possuir permissão
  * Clicar 2x seguidas no item
* O sistema fará a ação de visualizar/editar.

## Revisor (telas de pesquisa)

* Deverá seguir o seguinte formato:
  * Criado por: <matricula> - <nome> (dados do usuário que criou o registro; não possuindo matrícula exibir somente <nome>; não havendo informação de criação no banco de dados exibir um traço ( - )); Uma quebra de linha;
  * Data da criação: dd/mm/aaaa, hh/mm/ss (dados do momento em que o registro foi salvo pela primeira vez; não havendo informação de criação no banco de dados exibir um traço ( - ))
  * Uma quebra de linha.
  * Revisado por: <matricula> - <nome> (dados do último usuário que editou e salvou o registro; não possuindo matrícula exibir somente <nome>); exibir um traço caso o registro não tenha sido editado (somente criado). Uma quebra de linha;
  * Data da revisão: dd/mm/aaaa, hh/mm/ss (dados do momento em que o registro foi editado e salvo pela última vez); exibir um traço caso o registro não tenha sido editado (somente criado); Uma quebra de linha;

## Revisor (grid dentro de cadastros)

* Deverá seguir o seguinte formato:
  * Criado por: <matricula> - <nome> (dados do usuário que incluiu a linha no grid; não possuindo matrícula exibir somente <nome>; não havendo informação de criação no banco de dados exibir um traço ( - )); Uma quebra de linha;
  * Data da criação: dd/mm/aaaa, hh/mm/ss (dados do momento em que a linha foi incluída no grid pela primeira vez; não havendo informação de criação no banco de dados exibir um traço ( - ))
  * Uma quebra de linha.
  * Revisado por: <matricula> - <nome> (dados do último usuário que editou e salvou a linha no grid; não possuindo matrícula exibir somente <nome>); exibir um traço caso o registro não tenha sido editado (somente criado). Uma quebra de linha;
  * Data da revisão: dd/mm/aaaa, hh/mm/ss (dados do momento em que a linha do grid foi editada e salva pela última vez); exibir um traço caso o registro não tenha sido editado (somente criado); Uma quebra de linha;

## Voltar/Fechar

* O botão para retornar à tela anterior se chamará 'Voltar' em telas e 'Fechar' em modais.
* Ao clicar no botão 'Voltar' ou 'Fechar', caso a tela possua poucos campos (avaliar individualmente), ela não possuirá validação de alterações não salvas. Essa exceção existe pois existem alguns cadastros com poucos campos em que não é necessário avisar o usuário pois, caso ele perca o que já selecionou, ainda assim não é muita informação para ele preencher novamente.
* Ao clicar no botão 'Voltar' ou 'Fechar', sistema verificará:
  * Registro possui poucos campos editáveis?
    * Poucos campos editáveis ou é geração de relatório: somente retorna para a tela de pesquisa ou somente fecha a modal (dependendo da tela).
    * Muitos campos editáveis: algum dado pendente para salvar?
      * Nenhum dado pendente para salvar: somente retorna para a tela de pesquisa ou somente fecha a modal (dependendo da tela).
      * Há dado pendente para salvar: exibe modal de confirmação, conforme abaixo:
        * Título: Atenção!
        * Texto: Existem informações que não foram salvas. Deseja salvá-las antes de sair?
        * Botões: Sair sem salvar; Salvar e sair; Fechar.
          * Botão Fechar: somente fecha a modal de confirmação e mantém o usuário na tela.
          * Botão Sair sem salvar: descarta as alterações realizadas e retorna para a tela de pesquisa ou fecha a modal (dependendo da tela).
          * Botão Salvar e sair: realiza as validações do botão Salvar da tela ou da modal, conforme especificação individual.
* Especificidades novo framework (IVY):
  * As telas de pesquisa não possuirão o botão 'Voltar'. Ele somente estará visível na criação e visualização de um registro.
  * O botão 'Voltar' sempre será um botão de ação secundária, portanto, não será preenchido com cor.

## Botões Gravar visão

* O botão de gravar visão será um ícone *eye*, com tooltip 'Gravar Visão'. Ao clicar exibe mensagem \[visao_gravada\] e o ícone é alterado para *eye-slash* (botão 'Gravar visão' é substituído pelo botão 'Limpar visão'). O ícone deverá ser cinza e sempre no canto esquerdo do rodapé, salvo exceções mencionadas nas EFs individuais.
* O sistema gravará visão dos campos mencionados nas EFs individuais.
* As informações são gravadas no usuário. Por exemplo:
  * O usuário seleciona o Profissional Responsável e clica em "Gravar Visão", após realiza login em outro computador, cria uma nova consulta e virá com o campo profissional Responsável preenchido com a opção que teve a Visão gravada.
* Não é obrigatório preencher todos os campos para gravar visão;
* Somente em novos cadastros, os campos deverão vir preenchidos para o mesmo usuário;
* Caso algum campo estiver em branco, grava a informação de que esse campo ficará em branco;
* Caso algum cadastro ligado a um dos campos gravados seja excluído do sistema, deve trazer o campo em branco;
  * OBS: Caso o campo não estiver em branco, deve estar tratado no backend para gerar relatorios, ou salvar. Cenário que ocorre no chamado 45341 do rr, onde a h1 manteve-se selecionada mesmo perdendo a permissão(ela não fica como opção para selecionar mas fica gravada no campo). O dev alinhou com o time e esse tratamento no front seria bem complicado, pois se é campo de multiselect eu preciso validar permissão pra multiplas areas, e essas areas podem controlar outros campos que dependem dela e etc.
* Especificidades novo framework (IVY):
  * Este botão sempre será um botão de ação secundária, portanto, não será preenchido com cor.

## Botões Limpar visão

* O botão de limpar visão será um ícone *eye-slash*, com tooltip 'Limpar Visão'. Ao clicar exibe mensagem \[visao_limpa\] e o ícone é alterado para *eye* (botão 'Limpar visão' é substituído pelo botão 'Gravar visão'). O ícone deverá ser cinza e sempre no canto esquerdo do rodapé da tela, salvo exceções mencionadas nas EFs especificas.
* A ação de limpar visão não deve limpar os campos da tela, ela deve apenas apagar o registro da visão do banco de dados.
* Especificidades novo framework (IVY):
  * Este botão sempre será um botão de ação secundária, portanto, não será preenchido com cor.

## Modais de confirmação

* O sistema possuirá dois modelos de modais de confirmação, que se comportarão conforme abaixo:

### Modal de confirmação simples

* As modais de confirmação que possuem somente um texto e os botões de confirmação deverão ser pequenas, que abrem junto ao botão que abriu a modal.
* Exemplo.
* Modelo:
  * Cabeçalho:
    * Exibido com fundo cinza
    * Exibe ícone "alert" na cor do sistema
    * Exibe texto "Atenção"
    * Exibe ícone "times" responsável por fechar a modal e cancelar a ação
  * Centro:
    * Exibe fundo branco
    * Exibe texto com a mensagem principal da modal, como por exemplo: "Deseja realmente excluir este item?"
  * Rodapé:
    * Exibe fundo branco
    * Exibe geralmente dois botões, sendo:
      * "Fechar": botão responsável por fechar a modal e cancelar a ação
      * <acao_principal>: botão responsável por realizar a ação principal da modal (podendo ser excluir, cancelar, salvar uma alteração não salva...)

### Modal de confirmação com justificativa

* As modais de confirmação que possuem um campo de justificativa deverão ser abertas no centro da tela.
* Exemplo.
* Modelo:
  * Cabeçalho:
    * Exibido com fundo branco
    * Exibe texto resumindo a ação, como por exemplo: "Editar ASO", "Cancelar Evento"
    * Exibe ícone "times" responsável por fechar a modal e cancelar a ação
  * Centro:
    * Exibe fundo branco
    * Exibe texto com a mensagem principal da modal, como por exemplo: "Deseja prosseguir com o cancelamento? Essa ação não poderá ser desfeita."
    * Exibe o campo para inserção de justificativa.
    * Exibe os demais campos pertinentes à modal, como usuário que está cancelando, data do cancelamento, entre outros.
  * Rodapé:
    * Exibe fundo branco
    * Exibe geralmente dois botões, sendo:
      * "Fechar": botão responsável por fechar a modal e cancelar a ação
      * <acao_principal>: botão responsável por realizar a ação principal da modal (podendo ser cancelar, prosseguir, editar ...)

### Inteligência artificial/OCR

* Nota: a pedido dos devs, foi solicitado cautela nos testes de arquivo no OCR devido ao alto custo financeiro.

## Anexos

* Os componentes de anexos serão da seguinte forma:
  * Multiarquivos: exemplo.
  * Arquivo único: exemplo.
* Placeholder:
  * Componente de tela comum: *Arraste e solte o arquivo aqui ou clique para pesquisar.*
  * Componente de tela em formato de lista (quando não houver espaço para o placeholder acima): *Clique para pesquisar*
* Ao adicionar um arquivo com sucesso emite mensagem temporizada \[`arquivo_sucesso`\], `edicao_inclusao_grid_sucesso` ou \[`operacao_sucesso`\].
* Após inserido, ao passar com o mouse na área do nome, sistema deve mostrar o nome do arquivo num tooltip.
* Os componentes não devem aceitar inserção de arquivos inválidos. Caso o usuário selecionar um arquivo inválido o sistema não adiciona o arquivo no componente e exibe mensagem temporizada no modelo \[`formato_anexo`\]: 'Atenção! Permitido somente arquivos nos formatos <exibir formatos permitidos na tela de origem> com até <exibir o tamanho máximo permitido na tela de origem>.'. Exemplo: Atenção! Permitido somente arquivos nos formatos .xls, .xlsx, .doc, .docx, .pdf, .jpg, .jpeg ou .png com até 10 MB.'
  * Formatos válidos (na EF informar se utiliza todos ou apenas alguns específicos e citá-los):
    * .jpg,
    * .jpeg,
    * .png,
    * .csv,
    * .txt,
    * .xls,
    * .xlsx,
    * .ods,
    * .doc,
    * .docx,
    * .odt,
    * .ppt,
    * .pptx,
    * .pdf,
    * .odp,
    * .mp4
  * Tamanho padrão (na EF informar tamanho máximo por arquivo):
    * Caso o anexo é usado em outras saidas/relatórios: 5MB;
    * Caso o anexo não é usado em outras saidas/relatórios, e serve apenas para estar "arquivado": 10MB;
    * Exceções e tamanhos maiores: validar com responsáveis pela infra.
* Cada arquivo adicionado possui um botão para excluir o arquivo. Ao clicar, exibe modal de confirmação:
  * **Texto**: "Atenção! Deseja realmente excluir este item?"
  * **Botões**:
    * Excluir: fecha a modal de confirmação, emite mensagem temporizada \[`info_excluir`\].
    * Cancelar: fecha a modal de confirmação e não exclui o arquivo.
* É possível adicionar o anexo clicando no ícone *attachment* ou arrastando o arquivo desejado para dentro do componente.
* Ao clicar no ícone *attachment* abre o explorador de arquivos para selecionar o arquivo e realizar upload;
* Ao clicar no arquivo ele será aberto no navegador ou então realizado download, conforme configuração individual do navegador do usuário.
* Importante: mesmo para as telas que permitem a inserção de todos os formatos de arquivos, os arquivos executáveis não devem ser permitidos.
* Não é permitido carregar arquivos com pontos no nome, o único ponto permitido é o que separa o nome do arquido da extensão, quando usuário carregar arquivos com ponto no nome, sistema exibirá a mensagem temporizada \[arquivo_extensao_dupla\]
* Sistema valida se o arquivo não está corrompido, se estiver emite a mensagem \[arquivo_corrompido\]

 ![](/assets/efs/multiarquivos.png)

 ![](/assets/efs/confirmacao_pequena.png)

 ![](/assets/efs/confirmacao_grande.png)

 ![](/assets/efs/arquivo_unico.png)

# Telas do sistema no ambiente de dev/qa

* Deve-se exibir no topo com fundo amarelo laranja (FDA416) uma linha para identificar que o ambiente é de desenvolvimento.
* Não deve aparecer em ambiente de produção.

# Mensagens temporizadas

* As mensagens temporizadas deverão ser nas seguintes cores:
  * Verde, para mensagens de sucesso;
  * Amarela, para mensagens de alerta;
  * Vermelha, para mensagens de erro;
  * Azul, para mensagens de informação;
* As janelas de mensagens temporizadas são exibidas por cerca de 3 a 4 segundos.
* As janelas de mensagens temporizadas deverão possuir um ícone 'times' que permite fechar a mensagem antes desse tempo.
* Modelo da mensagem:
  * **Título**: conforme tabela abaixo.
  * **Texto**: conforme tabela abaixo.
* As mensagens temporizadas devem ser mais genéricas e seguir um mesmo padrão para avisos comuns à todas as telas, conforme tabela abaixo (abaixo são somente exemplos de onde as frases poderão ser usadas, pois pela quantidade de possibilidades no sistema não é possível listar todas elas; sendo assim, avaliar a mais correta para cada caso).
  * `dispositivo_nao_encontrado`: utilizada quando o leitor biométrico não foi encontrado.
  * `schema_invalido`: utilizada quando ocorre a validação do backend e o objeto enviado para salvar viola as regras de negócio/preenchimento.
  * `msg_descricao_unica`: utilizada quando a descrição do cadastro é igual à descrição de outro cadastro existente.
  * `msg_codigo_unico`: utilizada quando o código do cadastro é igual ao código de outro cadastro existente.
  * \[`campos_obrigatorios`\]: utilizada sempre que um campo obrigatório para a ação selecionada não estiver preenchido.
  * \[`possui_vinculo`\]: utilizada sempre que o usuário estiver tentando excluir um registro e ele possuir vínculo com outros cadastros do sistema.
  * `edicao_andamento`: utilizada sempre que houver uma edição em andamento que impede que o usuário realize a ação desejada.
  * `formato_anexo`: utilizada sempre que o formato do arquivo que o usuário está tentando anexar não é permitido no respectivo campo.
  * \[`registro_desatualizado`\]: utilizada sempre que o usuário estiver tentando salvar a edição de um registro o qual já foi editado entre o momento em que ele visualizou e salvou o registro.
  * \[`sem_permissao`\]: utilizada sempre que o usuário estiver tentando acessar uma tela para a qual não possui permissão. Essa mensagem geralmente será exibida quando o usuário tentar acessar a tela via link, uma vez que, de modo geral, as telas para as quais o usuário não possui permissão não são exibidas para ele.
  * `relatorio_gerando`: utilizado sempre que o usuário gerar um relatório que vai para a modal de geração de relatórios em segundo plano.
  * `arquivo_sucesso`: utilizado sempre que o sistema tiver inserido o anexo enviado pelo usuário com sucesso.
  * `info_excluir`: utilizada sempre que uma linha do grid foi removida com sucesso e também é utilizada quando um anexo for removido com sucesso.
  * `edicao_inclusao_grid_sucesso`: utilizada sempre que uma linha do grid foi adicionada ou editada com sucesso e também é utilizada quando um anexo for inserido com sucesso.
  * `operacao_sucesso`: outra opção para quando um registro ou alteração tiver sido realizada com sucesso. Exemplo: tela que não possui botão "Salvar", ao adicionar um anexo ou remover um anexo.
  * `cancelamento_sucesso`: utilizada sempre que um registro for cancelado com sucesso.
  * `exclusao`: utilizada sempre que um registro for excluído com sucesso.
  * `sucesso`: utilizada sempre que o registro for salvo com sucesso.

| Identificador | Tipo | Cor | Título | Texto |
|---------------|------|-----|--------|-------|
|               |      |     |        |       |

|     |     |     |     |     |
|-----|-----|-----|-----|-----|
| `dispositivo_nao_encontrado` | Erro | ==Vermelho== | Erro | Não foi possível localizar o dispositivo biométrico. Favor verificar. |
| `schema_invalido` | Aviso | ==Amarelo== | Atenção! | Os dados informados não estão em conformidade com as parametrizações da organização. Atualize a página e tente novamente. Caso o erro persistir, entre em contato com o suporte. |
| `msg_descricao_unica` | Aviso | ==Amarelo== | Atenção! | Já existe um cadastro com a mesma descrição. Favor verificar. |
| `msg_codigo_unico` | Aviso | ==Amarelo== | Atenção! | Já existe um cadastro com o mesmo código. Favor verificar. |
| \[`upload_pendente`\] | Aviso | ==Amarelo== | Atenção! | Existe um upload de anexo não concluído, aguarde finalizar ou remova o anexo para prosseguir. |
| `campos_obrigatorios` | Aviso | ==Amarelo== | Atenção! | Existe um ou mais campos obrigatórios que não foram preenchidos. |
| \[`possui_vinculo`\] | Aviso | ==Amarelo== | Atenção! | Este registro possui vínculo com outros cadastros do sistema e não pode ser excluído. |
| `edicao_andamento` | Aviso | ==Amarelo== | Atenção! | Para prosseguir é necessário Salvar/Cancelar a edição em andamento. |
| `formato_anexo` | Aviso | ==Amarelo== | Atenção! | Permitido somente arquivos com até 5MB e com extensão .doc, .docx, .png, .jpg ou .jpeg. Favor verificar. |
| \[`registro_desatualizado`\] | Aviso | ==Amarelo== | Atenção! | Os dados foram atualizados por outro usuário. Favor visualizar novamente o registro. |
| \[`sem_permissao`\] | Aviso | ==Amarelo== | Atenção! | Você não possui permissão para acessar esse cadastro. |
| \[`arquivo_corrompido`\] | Aviso | ==Amarelo== | Atenção! | Não foi possível processar o arquivo. Verifique se ele está corrompido e tente enviá-lo novamente. |
| \[`arquivo_extensao_dupla`\] | Aviso | ==Amarelo== | Atenção! | Não é permitido carregar arquivos com extensão dupla. Favor remover todos os pontos do nome do arquivo. |
| `relatorio_gerando` | Aviso | ==Azul== | Informação | Seu relatório está sendo gerado e assim que for finalizado você poderá baixá-lo na janela de consulta relatórios. |
| `arquivo_sucesso` | Aviso | ==Azul== | Informação | Registro incluído com sucesso. Para que a alteração seja permanentemente salva, clique no botão "Salvar". |
| `info_excluir` | Aviso | ==Azul== | Sucesso | Registro excluído com sucesso. Para que a alteração seja permanentemente salva, clique no botão "Salvar". |
| `edicao_inclusao_grid_sucesso` | Aviso | ==Azul== | Sucesso | Operação realizada com sucesso. Para que a alteração seja permanentemente salva, clique no botão "Salvar". |
| `operacao_sucesso` | Aviso | ==Azul== | Sucesso | Operação realizada com sucesso. |
| `cancelamento_sucesso` | Sucesso | ==Verde== | Sucesso | Registro cancelado com sucesso. |
| `exclusao` | Sucesso | ==Verde== | Sucesso | Registro excluído com sucesso. |
| `sucesso` | Sucesso | ==Verde== | Sucesso | Registro salvo com sucesso. |