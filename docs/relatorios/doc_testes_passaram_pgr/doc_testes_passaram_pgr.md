# Testes que passaram (PGR real)

Testes E2E rodados de verdade contra `apollus.dev.apollusehs.com.br` (ambiente de homologação), com Playwright. Só entram aqui os que **realmente passaram** — o resto dos ~416 cenários da planilha continua como `test.fixme()` nos specs, sem rodar ainda.

Última atualização: 2026-07-24 (lote completo da aba Referências).

## Aba Referências — completa (123 testes)
`e2e/specs/seguranca/programas-e-laudos/pgr/aba-referencias.spec.ts` — cobre os cenários TST659-TST1012 da planilha (Responsável Técnico, Observações, ART, Expostos mulheres/homens/PCDs, Equipe modal+grid, Configurações gerais), mais 6 cenários extras (EXTRA1-6) fora da planilha original, encontrados comparando a EF com o comportamento real.

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST659/660 | Campos antigos de CPF/Nome (Responsável Técnico e Equipe) | Não existem mais no DOM — confirmado |
| TST662-665 | Campo "Responsável Técnico": presença, formato das opções | Select único, formato "CPF - Nome - Registro conselho" |
| TST663 | Validar "valor padrão" do campo | **Ambiguidade da planilha**: "Profissional responsável" é o *placeholder* do campo vazio, não um valor pré-selecionado |
| TST672, 675-677 | Selecionar, salvar, reabrir, editar responsável técnico | Comportamento padrão de persistência, igual às outras abas |
| TST681 | Ordenação da lista | Ordenada por **nome** (2º segmento da opção), não pela string inteira — cuidado ao comparar, o CPF (1º segmento) domina a ordenação alfabética se comparar a linha toda |
| TST682/684 | Duplicidade / máscara de CPF | Sem CPF duplicado na amostra (35 opções); todos no formato `000.000.000-00` |
| TST689 | Ausência de referências antigas (CPF/Nome separados) | Confirmado — nenhum resquício no frontend |
| TST691-709 | Campo "Observações": estado inicial, limite de 400 caracteres, persistência, independência de outros campos | Comportamento padrão (igual ao textarea de Configurações) |
| TST717-736, 739 | Campo "ART": limite de 30 caracteres, aceita letras/números/especiais, persistência, foco | Confirmado |
| TST745-773 | Campo "Expostos - Mulheres": estado inicial, validação de entrada, persistência, help | Ver bug de zeros à esquerda abaixo |
| TST776-800 | Campo "Expostos - Homens": mesma bateria | Mesmo comportamento (mesmo componente) |
| TST751/782/815, 752/783/816 | Número negativo / decimal nos campos "Expostos" | O caractere `-`/`.` é descartado, mas os dígitos ao redor continuam entrando (ex: "-5"→"5", "10.5"→"105") — não é bem "bloqueado", é filtrado caractere a caractere |
| TST803-808 | Cenários extras de consistência entre "Expostos homens/mulheres" | Aceitos normalmente, sem regra de consistência entre os campos |
| TST809-824, 830 | Campo "Expostos - PCDs": bateria completa | Confirmado |
| TST825/826 | Help do campo "Expostos - PCDs" + ortografia | Texto real: *"Informe a quantidade de pessoas com deficiência expostas neste PGR"* — **inclui "de" corretamente**. A suspeita do próprio cenário TST826 ("falta o 'de'") está desatualizada/incorreta; só ficou parecendo confirmada numa 1ª exploração via hover manual, que capturou o texto truncado |
| TST843-849, 864, 895 | Seção "Equipe": help, botão "Adicionar", modal "Adicionar equipe", botão "Fechar", cancelamento | Confirmado, modal com título/campo/botões batendo com a EF |
| TST903 | Grid de Equipe vazio | "Sem registros para listar." (mesmo texto de Anexos/Colaboradores) |
| TST954-956, 958, 961, 967-969, 971-972, 980-990, 1001, 1003, 1005, 1008, 1010-1011 | "Configurações gerais": presença/ordem dos 6 campos, formato do Modelo de documento, vigência, os 4 checkboxes, persistência | Confirmado — os 6 componentes da EF batem com o que a planilha espera (ver achado sobre o 7º item abaixo) |
| TST989/990 | Checkbox "Incluir histórico de revisões" sem dados | Nasce desabilitado e desmarcado; tooltip bate com a EF |

### Bug real confirmado: "Salvar" bloqueado por race condition (qualquer PGR novo)
O checkbox "Incluir GHEs sem riscos" (aba Configurações) nasce marcado, mas o textarea obrigatório associado ("Incluir GHEs sem riscos - Descritivo") às vezes não carrega o texto padrão a tempo (parece carregamento assíncrono). Quando isso acontece, o "Salvar" fica bloqueado silenciosamente (campo obrigatório vazio, sem mensagem de erro clara), e o app navega sozinho pra aba Configurações destacando o campo em vermelho. Reproduzido em ~15-20% das tentativas em specs diferentes (Configurações e Referências) — não é específico de nenhuma aba, afeta o salvamento de qualquer PGR novo. `preencherCadastroValidoESalvar()` (`support/pgr.ts`) agora contorna isso checando e restaurando o texto padrão antes de prosseguir.

### Bug real confirmado: zeros à esquerda nos campos "Expostos"
Os 3 campos ("Expostos - Mulheres", "Expostos - Homens", "Expostos - PCDs") **colapsam para `"0"`** ao digitar qualquer valor com zero à esquerda (ex: `"010"`, `"00025"`, `"007"`), descartando os dígitos seguintes — reproduzido tanto digitando caractere a caractere quanto preenchendo o valor de uma vez, nos 3 campos. Isso contraria o próprio cenário da planilha (TST757/TST788: "Sistema deve aceitar e manter ou normalizar valor") — o sistema real não faz nenhuma das duas coisas, só perde a informação digitada. Mantidos como `test.fixme()` com o bug documentado (TST757, TST788, EXTRA6), seguindo o mesmo critério já usado para o bug de duplicação de Colaboradores (TST1213).

### Achados fora da planilha (EXTRA1-6)
- **EXTRA1** — o campo "Observações" tem um ícone de assistente de IA ("revisar e aprimorar o texto" / "corrigir ortografia automaticamente") não documentado em nenhum lugar da EF da aba Referências e sem nenhum cenário correspondente na planilha de 354 itens.
- **EXTRA2** — a EF documenta uma modal inteira "Gravar/Limpar Configuração" atrelada ao campo "Modelo de documento" (permite ao perfil Corporativo bloquear a configuração pros demais perfis); nenhum cenário da planilha testa essa modal. No ambiente real ela não aparece em nenhum estado (a config "Perfil Corporativo poderá bloquear..." parece desligada no painel admin).
- **EXTRA3** — a EF documenta regras de abrangência hierárquica pro catálogo de "Modelo de documento" (modelo corporativo sempre lista; mesma hierarquia 1 sem hierarquia 2; mesma hierarquia 1 e 2) sem cenário dedicado na planilha.
- **EXTRA4 (confirmado)** — a EF de "Configurações gerais" documenta um 7º componente, o checkbox "Incluir AEP e/ou AET" (libera a aba "Análises ergonômicas"). A própria planilha já limita TST955 a "6 componentes" sem explicar a ausência do 7º — confirmado ao vivo que esse checkbox não existe no DOM deste ambiente.
- **EXTRA5** — a EF diz que um profissional com múltiplas linhas no GRID de registro conselho deve aparecer uma vez para cada linha na lista de "Responsável Técnico"; não há cenário na planilha pra esse caso.
- **EXTRA6 (bug)** — mesmo bug de zeros à esquerda também confirmado no campo "Expostos - PCDs" (a planilha só tinha esse cenário explícito pra Mulheres/Homens).

## Descobertas técnicas adicionais (Aba Referências)
- Tooltips do Material (`matTooltip`) neste app são **flaky/não confiáveis via hover** em execução automatizada — `.hover()` seguido de esperar `.mat-mdc-tooltip` aparecer falha intermitentemente (mesmo problema já visto no ícone de Anexos). Alternativa confiável descoberta: o CDK sempre registra o texto do tooltip estaticamente num elemento `#cdk-describedby-message-...`, referenciado via `aria-describedby` num ancestral do `mat-icon` — dá pra ler o texto direto (helper `textoTooltipDoIcone()` no spec), sem precisar de hover.
- Ordenação de listas no formato "CPF - Nome - Registro": comparar a *string inteira* ordena pelo CPF (1º segmento, numérico), não pelo nome — extrair o 2º segmento antes de comparar.
- O help text da seção "Equipe" existe 2x no DOM (texto visível + cópia de acessibilidade escondida via `aria-describedby`) — `getByText().toBeVisible()` pode resolver pra cópia errada; usar `.toHaveCount(1)` (existência) em vez de exigir visibilidade, quando a duplicidade não dá pra evitar.
- No modal "Adicionar equipe", depois de selecionar uma opção no multiselect, o painel de opções continua sobrepondo o rodapé da modal — a "tag"/tooltip do item recém-selecionado intercepta o clique no botão "Fechar". Precisa de um `Escape` (fecha o painel) antes de clicar em "Fechar".
- Os campos "Expostos - Mulheres/Homens/PCDs" são `type="text"` (não `type="number"`), `maxlength=10`, com filtro de caractere: letra é rejeitada totalmente; `-` e `.` são descartados mas os dígitos ao redor continuam entrando.

## Aba Configurações — Persistência (Salvar/Reabrir)
`e2e/specs/seguranca/programas-e-laudos/pgr/aba-configuracoes.spec.ts` — usa `preencherCadastroValidoESalvar()` (`support/pgr.ts`) pra gerar um cadastro real e salvo, destravando cenários de "salvar e recarregar"/"salvar e reabrir".

TST1014, 1020, 1021, 1022, 1045, 1052, 1060, 1061, 1062

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST1014 | Acessar aba com dados padrão (cadastro novo) | "Cargo", "GHE", campo 11 e "Incluir GHEs sem riscos" vêm marcados por padrão; textarea do campo 06 habilitada |
| TST1020 | Alterar 3 checkboxes e salvar | Cada um persiste no estado oposto ao inicial após `reload()` (ver descoberta sobre defaults abaixo) |
| TST1021 | Alterar sem salvar e atualizar a página | Reverte pro último estado salvo (perde a alteração em memória) |
| TST1022 | Salvar e reabrir a tela (navega pra Lista e volta pela URL com `idkey`) | Estado salvo é mantido |
| TST1045 | Validar persistência de "Ergonômico/Psicossocial" | Persiste no estado oposto ao inicial após `reload()` |
| TST1052 | Salvar com campo 11 habilitado e depois desabilitar GHE | Campo 11 desabilita e desmarca |
| TST1060 | Clicar em "Salvar" várias vezes seguidas (edita ART e salva 2x) | Continua sendo o mesmo registro (mesma URL/`idkey`), sem duplicar |
| TST1061 | Atualizar a página após salvar | Checkbox "Incluir CAS number" persiste no estado oposto ao inicial |
| TST1062 | Limpar navegação (sai e volta pela URL) e acessar novamente | Responsável técnico salvo continua preenchido |

## Cabeçalho — Campo Data Base
`e2e/specs/seguranca/programas-e-laudos/pgr/cabecalho-campo-data-base.spec.ts`

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST244 | Tentar salvar sem preencher a Data Base | Botão "Salvar" fica desabilitado com o formulário vazio |
| TST245 | Inserir uma data válida manualmente | Campo aceita e mantém o valor `15/04/2026` |
| TST248 | Inserir texto não numérico no campo | Campo não aceita `"abc"` como valor |

## Aba Configurações — Campo 02 → Campo 11
`e2e/specs/seguranca/programas-e-laudos/pgr/aba-configuracoes.spec.ts`

TST1027, 1028, 1029, 1031 — campo 02 = "Exibir a descrição das atividades por: Cargo/GHE"; campo 11 = "Incluir riscos associados às atividades do GHE" (confirmado com a EF). Ambos vêm marcados por padrão num cadastro novo.

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST1027-1028 | Marcar/desmarcar "GHE" | Campo 11 habilita/desabilita e desmarca junto |
| TST1029 | Só "Cargo" marcado (GHE desmarcado) | Campo 11 permanece desabilitado |
| TST1031 | Ambos marcados | Sistema permite, sem erro |

## Aba Configurações — Campo 05 → Campo 06 + Botão 07
`e2e/specs/seguranca/programas-e-laudos/pgr/aba-configuracoes.spec.ts`

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST1033 | Marcar "Incluir GHEs sem riscos" | Textarea habilita e volta ao texto padrão (389 caracteres) |
| TST1034 | Desmarcar campo 05 | Textarea desabilita e fica vazia (`""`) |
| TST1035 | Editar texto do campo 06 | Aceita edição normalmente |
| TST1036 | Inserir texto acima de 400 caracteres | Bloqueado pelo próprio campo — só entram os 400 primeiros |
| TST1038 | Clicar em "Restaurar Texto Padrão" | Sempre volta pro texto padrão, mesmo após editar |
| TST1039 | Clicar no botão com campo desabilitado | Botão fica desabilitado (não clicável) quando o checkbox está desmarcado |
| TST1040 | Alterar texto e salvar (cadastro completo) | Texto persiste após `page.reload()` |
| TST1041 | Restaurar texto padrão e salvar | Texto padrão persiste após `page.reload()` |

## Aba Configurações — Cenários gerais
`e2e/specs/seguranca/programas-e-laudos/pgr/aba-configuracoes.spec.ts`

TST1050, 1051, 1053, 1054

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST1050 | Clicar 6x seguidas no checkbox do campo 05 | Estado final do checkbox e da textarea sempre consistentes entre si |
| TST1051 | Alterar campo 02 (GHE) 4x seguidas | Campo 11 sempre reflete o estado final do GHE |
| TST1053 | Alterar config, trocar de aba e voltar | Alteração continua lá — o formulário mantém estado em memória entre abas |
| TST1054 | Alterar campos em Configurações E Referências, navegar entre as abas | Ambas as alterações persistem simultaneamente |

## Aba Configurações — Checkboxes independentes
`e2e/specs/seguranca/programas-e-laudos/pgr/aba-configuracoes.spec.ts`

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST1042 | Marcar e desmarcar qualquer checkbox | Reflete corretamente a cada clique |
| TST1043 | Marcar múltiplos checkboxes | Cada um muda de forma independente, sem afetar os outros |
| TST1047 | Validar combinação de vários checkboxes | Marcar vários ao mesmo tempo não gera conflito |
| TST1048 | Todos os 18 checkboxes independentes desmarcados | Tela continua funcional |
| TST1049 | Todos os 18 checkboxes independentes marcados | Tela suporta sem erro |

## Aba Anexos — completa (61 testes)
`e2e/specs/seguranca/programas-e-laudos/pgr/aba-anexos.spec.ts` — usa os helpers locais `preencherModalAnexo()`, `salvarEFecharModalAnexo()` e `abrirEdicaoAnexo()` (ver descobertas técnicas abaixo).

**Usabilidade + Regras + Validações (28):** TST1066, 1069, 1070, 1071, 1074, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1088, 1089, 1090, 1091, 1092, 1093, 1094, 1095, 1096, 1098, 1099
**Modal + Grid + Botões + Ordenação (11):** TST1121, 1122, 1123, 1124, 1125, 1126, 1127, 1128, 1129, 1130, 1131
**Grid de Anexos (7):** TST1135, 1136, 1138, 1139, 1141, 1142, 1143
**Botões do Grid (12):** TST1152, 1153, 1154, 1155, 1156, 1157, 1159, 1160, 1161, 1162, 1163, 1164
**Cenários gerais (3):** TST1170, 1171, 1177

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST1066 | Acessar aba "Anexos" | Aba visível |
| TST1069 | Validar botão "Adicionar anexo" | Visível |
| TST1070-1071 | Clicar em "Adicionar anexo" | Abre a modal, título "Adicionar anexo" |
| TST1074 | Validar placeholder do campo de anexo | Mostra "Arraste e solte o arquivo aqui ou clique para pesquisar" |
| TST1077-1079 | Upload .pdf / imagem / .doc válidos | Aceita; servidor renomeia o arquivo com sufixo aleatório ao salvar (ex: `minimo_op4guv.pdf`) |
| TST1080 | Upload de exatos 5.000.000 bytes | Aceito — **o limite "5MB" é calculado em bytes decimais**, não binários |
| TST1081 | Upload >5MB | Rejeitado, toast "Permitido somente arquivos com até 5MB e com extensão .jpg, .jpeg, .png, .doc, .docx ou .pdf" |
| TST1082 | Upload de formato inválido (.exe) | Mesma mensagem do TST1081 — uma mensagem cobre tamanho E formato |
| TST1083 | Tentativa de upload múltiplo | O `<input>` nem tem o atributo `multiple` — o próprio Playwright recusa passar 2 arquivos de uma vez |
| TST1084 | Substituir arquivo antes de salvar | Segundo upload substitui o primeiro |
| TST1085 | Remover arquivo antes de salvar | Clicar no "x" abre confirmação ("Deseja realmente excluir este item?") — só remove depois de confirmar |
| TST1086-1087 | Obrigatoriedade de anexo/descrição | Salvar com campo(s) vazio(s) exibe toast de campo obrigatório e não fecha a modal |
| TST1088-1091 | Descrição: preencher, limite 500 caracteres, especiais, quebra de linha | Textarea aceita normalmente, bloqueada em 500 caracteres |
| TST1092 | Persistência após salvar e reabrir (navega pra Lista e volta pela URL) | Anexo continua no grid |
| TST1093-1094 | Salvar com dados válidos / mensagem de sucesso | Toast de info "Registro incluído com sucesso..." (ver descoberta do fluxo de 3 cliques) |
| TST1095-1096 | Botão editar no grid / editar a descrição | Modal "Visualizar anexo" abre pré-preenchida; edição salva e reflete no grid |
| TST1098-1099 | Salvar edição / cancelar edição (Fechar + "Sair sem salvar") | Edição salva reflete no grid; cancelar mantém o valor original |
| TST1121-1122 | "Salvar e Adicionar outro" só na inclusão | Visível na modal de inclusão; ausente na modal de edição |
| TST1123 | Clicar em "Fechar" na modal (sem alterações) | Fecha direto, sem confirmação |
| TST1124-1125 | "Salvar" / "Salvar e Adicionar outro" com campos vazios | Toast "campos obrigatórios", modal continua aberta |
| TST1126-1128 | Salvar / Salvar e Adicionar outro / reset da modal | Toast de info, modal continua aberta; campos NÃO resetam após "Salvar e Adicionar outro" |
| TST1129-1130 | "Salvar" da edição sem/com alteração | Desabilitado sem alteração; habilita ao alterar um campo (bate com a EF) |
| TST1131 | Salvar edição de anexo | Grid reflete o novo valor |
| TST1135-1136 | Inserir anexo / validar coluna "Anexo" | Grid mostra ícone de download + nome do arquivo |
| TST1138-1139 | Nome do arquivo exibido / descrição exibida | Correspondem ao que foi enviado |
| TST1141 | Múltiplos anexos | Todos listados corretamente |
| TST1142 | Persistência após salvar e reabrir (reload) | Anexo continua no grid |
| TST1143 | Grid vazio | Mostra "Sem registros para listar." |
| TST1152-1157 | Botões Editar/Excluir visíveis, clicáveis, texto da modal de exclusão | *"Deseja realmente excluir este item?"* — mesmo padrão de Colaboradores |
| TST1159-1164 | Fechar sem excluir / confirmar exclusão / remoção / exclusão sequencial / último item / exclusão+inclusão | Comportamento consistente em todos os casos |
| TST1170 | Clicar "Salvar" 3x seguidas na modal | Não duplica a linha no grid (ver descoberta abaixo) |
| TST1171 | Editar anexo e não salvar | Descarta a alteração |
| TST1177 | Alterar arquivo/descrição na edição e cancelar | Mantém o anexo original |

## Aba Colaboradores — completa (76 testes)
`e2e/specs/seguranca/programas-e-laudos/pgr/aba-colaboradores.spec.ts` — validada contra a EF (Especificação Funcional) do PGR, além do ambiente real.

**Modal + Regras + Usabilidade (30):** TST1182, 1184, 1185, 1186, 1187, 1188, 1190, 1191, 1192, 1193, 1194, 1195, 1196, 1197, 1198, 1199, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1209, 1210, 1211, 1214, 1215, 1219, 1220
**Grid de Colaboradores (12):** TST1226, 1227, 1228, 1229, 1230, 1231, 1232, 1233, 1234, 1235, 1236, 1237
**Botão Editar (11):** TST1238, 1239, 1240, 1241, 1242, 1243, 1244, 1245, 1246, 1247, 1249
**Botão Excluir (11):** TST1250, 1251, 1252, 1254, 1255, 1256, 1257, 1258, 1259, 1260, 1261
**Cenários gerais (12):** TST1262, 1263, 1264, 1265, 1266, 1267, 1268, 1270, 1271, 1272, 1273, 1274

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST1184 | Validar clareza do texto | Texto bate literalmente com a EF: *"Informe abaixo os representantes da organização que acompanharam o trabalho realizado. Caso não insira nenhuma informação, o capítulo sobre Colaboradores não será exibido no laudo."* |
| TST1193 | Preencher ambos e salvar | Modal fecha, colaborador aparece no grid |
| TST1194-1196 | Limite de 60 caracteres (Colaborador/Cargo) | Bloqueado pelo campo — só entram os 60 primeiros (confirma a EF: "Máximo de caracteres: 60") |
| TST1197-1199 | Especiais / maiúsc-minúsc / espaços | Todos aceitos (confirma a EF) |
| TST1204 | Persistência após salvar e reabrir (navega pra fora e volta pela URL) | Colaborador continua no grid |
| TST1205-1206 | "Salvar e Adicionar outro" / limpeza da modal | Modal continua aberta; campos RESETAM (diferente de Anexos) |
| TST1208 | "Salvar e Adicionar outro" em edição | Não aparece (só existe na modal de inclusão) |
| TST1209-1210 | Fechar sem/com alteração | Fecha direto sem alteração; pede confirmação "Sair sem salvar" com alteração |
| TST1214-1215 | Nomes/cargos iguais | Sistema permite duplicatas, sem regra de bloqueio |
| TST1219-1220 | Persistência via reload / perda sem salvar | `preencherCadastroValidoESalvar()` + reload mantém; sem salvar, reload perde tudo |
| TST1230 | Grid sem registros | Mostra "Sem registros para listar." |
| TST1231-1235 | Ordem de inserção, editar/excluir do meio | Mantém ordem de inserção; sem ordenação por coluna (confirma a EF) |
| TST1236-1237 | Ordenação por coluna | Coluna "Colaborador" tem `mat-sort-header-disabled`; clicar no cabeçalho não reordena |
| TST1240 | Dados carregados ao editar | Modal de edição vem pré-preenchida com os valores salvos |
| TST1244 | Mensagem de sucesso ao editar | Toast "Operação realizada com sucesso..." |
| TST1245 | Editar e fechar sem salvar | Descarta alteração (confirma diálogo "Existem informações que não foram salvas...") |
| TST1246 | Remover conteúdo obrigatório e salvar | Toast de campo obrigatório, modal não fecha |
| TST1249 | Editar e recarregar sem salvar | Descarta a alteração (cargo volta ao valor original) |
| TST1252 | Texto da modal de exclusão | *"Deseja realmente excluir este item?"* (idêntico à EF) |
| TST1255 | Confirmar exclusão | **Diferença da EF**: a EF documenta a mensagem `[info_excluir]` = "Registro excluído com sucesso..."; o sistema real mostra "Operação realizada com sucesso..." (mensagem `[info_sucesso]`, igual à de salvar). Testamos contra o comportamento real. |
| TST1259-1261 | Exclusão rápida de vários / exclusão persistente | Não corrompe o grid; exclusão só persiste de verdade após o Salvar PRINCIPAL do cadastro (ver descoberta abaixo) |
| TST1262-1268 | Cenário completo (inserir+editar+excluir), duplicados, espaços, especiais, acentos, nome curto, cargo numérico | Todos aceitos e refletidos corretamente no grid |
| TST1270-1274 | Navegar entre abas, perder sem salvar, salvar e reabrir, muitos registros, cliques múltiplos em excluir | Comportamento consistente em todos os casos |

## Aba Conclusão (11 testes)
`e2e/specs/seguranca/programas-e-laudos/pgr/aba-conclusao.spec.ts`

TST1280, 1281, 1282, 1286, 1291, 1294, 1295, 1296, 1297, 1298, 1302

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST1280 | Acessar aba Conclusão | Editor `[contenteditable="true"]` visível e habilitado |
| TST1281 | Validar placeholder | `data-placeholder` do CKEditor bate literalmente com a EF |
| TST1282 | Campo vazio por padrão | Sem texto |
| TST1286 | Preencher texto simples | Aceita digitação |
| TST1291 | Negrito | Envolve o texto em `<strong>` |
| TST1294 | Lista com marcadores | Cria `<ul><li>` |
| TST1295-1296 | Quebra de linha / múltiplos parágrafos | Cada Enter cria um novo `<p>` |
| TST1297 | Caracteres especiais (`& < > " ' # @ % *`) | Aceita normalmente |
| TST1298 | Acentuação | Aceita normalmente |
| TST1302 | Caracteres incomuns (`§ ± × ÷ € £ ¥`) | Aceita normalmente |

## Botões do Cadastro (16 testes)
`e2e/specs/seguranca/programas-e-laudos/pgr/botoes-cadastro.spec.ts`

TST1332, 1333, 1334, 1336, 1339, 1342, 1359, 1362, 1363, 1366, 1367, 1373, 1376, 1377, 1379, 1385

| ID | Ação | Resultado confirmado |
|---|---|---|
| TST1332 | "Voltar" sem alterações | Volta direto pra Lista de PGRs, sem confirmação |
| TST1333-1334 | "Voltar" com alteração pendente | Modal "Atenção": *"Existem informações que não foram salvas. Deseja salvá-las antes de sair?"* |
| TST1336 | "Sair sem salvar" | Descarta e volta pra Lista de PGRs |
| TST1339 | Fechar a modal pelo "x" | Modal fecha, usuário continua no cadastro (nada é descartado nem salvo) |
| TST1342 | "Dados da Assinatura Digital" num cadastro novo | Botão nem existe no DOM (oculto) |
| TST1359 | "Salvar" visível pro usuário com permissão | Visível |
| TST1362-1363 | "Salvar" com campos obrigatórios vazios | Toast de campo obrigatório + navega sozinho pra "Referências" (primeira aba com pendência) |
| TST1366 | Salvar cadastro 100% válido | Toast verde exato da EF: *"Sucesso — Registro salvo com sucesso."* |
| TST1367 | Persistência após salvar | `page.reload()` mantém Responsável técnico e Data base preenchidos |
| TST1373 | "Gerar PGR" num cadastro não salvo | **Ajuste da EF**: a EF diz "desabilitado"; o comportamento real é **nem aparecer no DOM** (oculto), não só desabilitado |
| TST1376-1377 | "Gerar PGR" com cadastro salvo, filtro de GHE do cabeçalho vazio | Funciona normalmente — toast *"Seu relatório está sendo gerado..."* ([relatorio_gerando] da EF, texto exato) |
| TST1379 | Permanência na tela após gerar | URL não muda |
| TST1385 | "Duplicar" num cadastro não salvo | Oculto (bate com a EF) |

## Descobertas técnicas que sustentam esses testes
- **`preencherCadastroValidoESalvar()`** (`support/pgr.ts`) — helper que preenche os 4 campos obrigatórios que faltam no cabeçalho e salva de verdade (idkey aparece na URL), destravando qualquer teste que precise de um PGR realmente salvo:
  - Responsável técnico / Modelo de documento: selects com busca — clica no campo, clica na primeira `mat-option` da lista (não importa qual, só precisa de alguma).
  - Vigência do programa: **não é dois campos separados** — é um único componente de intervalo. Preenche o placeholder "Início" com `fill()`, aperta `Tab`, e digita a data fim direto com `page.keyboard.type()` (não tem um segundo campo "Fim" localizável por label/placeholder).
  - Data base: campo normal, `fill()` direto.
- O campo "GHE" do cabeçalho (ao lado de Região/Unidade/Setor) é um **filtro opcional** pra "Gerar PGR", não uma seleção obrigatória — deixá-lo vazio não impede a geração do relatório (ao contrário do que a planilha de cenários sugeria pro TST1375).
- Locale do Playwright precisa ser `pt-BR` (`playwright.config.ts`) — sem isso o PGR abre em inglês.
- Login: `page.goto("/apollus/login")` + labels `"Usuário"`/`"Senha"`/botão `"Entrar"` (confirmados iguais à tela real).
- Depois do login cai no dashboard, não no cadastro — precisa `abrirNovoCadastroPgr()` (`support/pgr.ts`).
- Abas do cadastro usam `role="tab"` (Angular Material).
- Checkboxes do Angular Material: o `<input>` real fica escondido atrás da camada visual — clicar nele (mesmo com `force`) não funciona; precisa clicar no `<label>` de texto (`clicarCheckboxMaterial()` em `support/pgr.ts`).
- Botão "Salvar" **principal do cadastro**: fica desabilitado só enquanto o formulário está intocado ("pristine"). Basta UMA alteração em qualquer aba (ex: adicionar um colaborador) pra habilitar — mesmo com outros campos obrigatórios vazios. Ao clicar nesse estado "sujo mas inválido", ele **navega sozinho pra primeira aba com erro** (ex: Referências) e destaca os campos faltando em vermelho — mesmo padrão de toast "campos obrigatórios" dos modais.
- Botões "Salvar" **de modal** (Anexos, Colaboradores) são diferentes: já vêm habilitados desde o início, e a validação acontece só no clique (toast + borda vermelha no campo), nunca ficam desabilitados.
- Botão "Fechar" de modal (Anexos, Colaboradores): fecha direto se nada foi alterado; se algo foi digitado, pede confirmação ("Existem informações que não foram salvas. Deseja salvá-las antes de sair?").
- Grids com tooltip (Material `matTooltip`): o texto da célula aparece **duas vezes** no DOM (célula + `div[role=tooltip]` escondido) — `getByText()` quebra o modo estrito; usar `getByRole("cell", { name })` em vez disso.
- Botões "Adicionar" podem existir em mais de uma aba ao mesmo tempo no DOM (ex: Referências → Equipe, Colaboradores → lista) — escopar com `getByLabel("<nome da aba>").getByRole("button", { name: "Adicionar" })` antes de usar.
- Toasts de sucesso ("Operação realizada com sucesso...") aparecem **duas vezes** no DOM (o elemento visível + uma cópia dentro de um `cdk-overlay`) — usar `.first()` na asserção, senão quebra o modo estrito.
- Botão "Editar"/"Excluir" de linha de grid: o `<tr>` não tem `role="row"` explícito, então `getByRole('row')` não funciona — escopar com `page.locator("tr", { has: page.getByText(nome, { exact: true }) })` e localizar o botão pelo `<mat-icon>` interno (`edit_outline`/`delete_outline`).
- **Instabilidade de rede é real e esperada**: contra o ambiente de homologação real, ~15-20% dos testes falham na primeira tentativa por timeout simples (login, clique em "Novo", modal demorando a abrir) sem nenhum problema no teste em si — sempre vale rodar de novo antes de assumir bug.
- A EF (Especificação Funcional) confirmou quase tudo que descobrimos por exploração ao vivo, com uma exceção: a mensagem de exclusão documentada (`[info_excluir]`) não bate com o que o sistema real mostra (usa `[info_sucesso]` genérico) — nesses casos, testamos o comportamento real, não o documentado.
- **Fix importante em `login.ts`**: `page.waitForLoadState("networkidle")` depois do clique em "Entrar" não é confiável — o login pode levar bem mais que alguns segundos (chegou a ~8s numa investigação) e "networkidle" às vezes resolve numa pausa momentânea de rede antes do redirect de verdade, devolvendo o controle pro teste ainda na tela de login (o formulário aparece vazio, parecendo erro de credenciais, mas na verdade é só timing). Trocado por `page.waitForURL(url => !url.pathname.includes("/login"))`, que espera o sinal real de autenticação.
- Aba Conclusão usa **CKEditor** (`[contenteditable="true"]`), não textarea comum. `page.keyboard.type()` trava nesse editor por algum motivo não identificado — usar `locator.pressSequentially()` em vez disso. O placeholder fica no atributo `data-placeholder` de um `<p>` interno (renderizado via CSS, não é texto real — `getByText` não encontra). Botões de formatação tipo "Lista com marcadores" são *split buttons* (ação + seta dropdown com o mesmo texto) — precisa `.first()`.
- Botão de fechar modal ("×"): não é `<button>`, é o próprio `<mat-icon>` clicável (texto "close"). `getByRole('img', { name })` não funciona pra localizá-lo (nome acessível de `role=img` não considera o texto/ligature do ícone) — usar `page.locator("mat-icon", { hasText: "close" })`.
- Upload de arquivo (`input[type="file"]`): `setInputFiles` funciona normalmente pra simular a escolha do usuário (não dá pra interagir com o seletor nativo do SO, mas não precisa). O ícone "x" pra **remover** um arquivo já anexado é `"clear"` — diferente do `"close"` que fecha a modal inteira. Se o arquivo já foi enviado ao servidor (o que acontece assim que `setInputFiles` roda, antes até de clicar em Salvar), remover pede confirmação numa modal "Deseja realmente excluir este item?", igual à exclusão de um item já salvo no grid. O nome do arquivo aparece 2x no DOM (um `<mat-label>` visível + um `cdk-describedby-message-container` escondido de acessibilidade) — escopar por `mat-label` evita violação do modo estrito.
- **Limite de "5MB" em upload é calculado em bytes decimais** (5.000.000), não binários (5×1024×1024 = 5.242.880) — um arquivo de exatos 5.242.880 bytes é rejeitado.
- Campo 02 (Cargo/GHE): desmarcar as duas opções ao mesmo tempo **não é bloqueado no clique** — o clique em si sempre funciona. A regra "obrigatório pelo menos uma marcada" (EF) provavelmente só é validada no Salvar do formulário inteiro, não no toggle do checkbox isoladamente.
- **Checkboxes independentes da aba Configurações não têm todos o mesmo default**: alguns vêm marcados de fábrica, outros desmarcados (varia por campo, sem padrão óbvio por coluna). Testes de persistência que assumiam "sempre desmarcado → clica → vira marcado" (TST1020, TST1045, TST1061) davam falso-negativo. Fix: capturar `await checkbox.isChecked()` **antes** de clicar e comparar contra o oposto (`toBeChecked({ checked: !estadoInicial })`), em vez de assumir um estado fixo — mesmo padrão que o TST1042 já usava.
- Clicar em "Salvar" abre um overlay `<div class="screen-locker">` enquanto a requisição está em andamento; ele intercepta cliques (e o próprio botão fica `disabled`) até a resposta voltar. Clicar em "Salvar" de novo logo em seguida (ex: salvar 2x seguidas) trava se não esperar o overlay sumir — usar `page.locator(".screen-locker").waitFor({ state: "hidden" })` entre um Salvar e o próximo.
- **Erro de invocação (não é bug do produto)**: rodar `npx playwright test` fora da pasta `e2e/` (onde está o `playwright.config.ts`) faz o Playwright não achar a config real (sem `baseURL`/`locale`) — todo `page.goto()` relativo (ex: `/apollus/login`) quebra com `Cannot navigate to invalid URL`. Sempre rodar de dentro de `e2e/` (scripts `npm run test:e2e*`) ao rodar specs isolados.
- **Fluxo de "salvar" da modal de Anexo é diferente de Colaboradores**: clicar em "Salvar" NÃO fecha a modal sozinho — mostra um toast de INFO ("Registro incluído com sucesso. Para que a ação seja permanentemente salva, clique no botão \"Salvar\".") e continua aberta. Pra fechar de verdade é um fluxo de 3 cliques: "Salvar" → "Fechar" → aparece um diálogo genérico "Atenção: Existem informações que não foram salvas. Deseja salvá-las antes de sair?" (porque os campos ainda têm conteúdo) → "Salvar e sair". Já a modal de **edição** ("Visualizar anexo") é diferente: fecha sozinha ao clicar "Salvar", sem esse fluxo de 3 cliques.
- **"Salvar e Adicionar outro" não reseta os campos da modal** — a descrição e o arquivo do anexo recém-salvo continuam preenchidos, exigindo troca manual antes de adicionar o próximo (diferente do que a EF sugeria).
- O ícone `info_outline` da linha do grid de Anexos (candidato a mostrar auditoria/revisor) não retornou tooltip legível no hover durante a exploração — existem ~70 elementos de tooltip escondidos no DOM da página (templates do Angular Material não populados). TST1132-1134 e TST1165-1169 continuam `fixme` por esse motivo.
- Clicar no ícone `edit_outline` da linha do grid de Anexos é **inconsistente** — em boa parte das tentativas só dispara o tooltip "Editar" (hover) sem abrir a modal, mesmo com o elemento visível/clicável segundo o Playwright. O helper `abrirEdicaoAnexo()` faz até 3 tentativas (clique normal, depois `force: true` repetido) antes de desistir — o ícone de excluir (`delete_outline`) nunca teve esse problema.
- **Grid vazio mostra "Sem registros para listar."** dentro do próprio `tbody` (não é uma mensagem separada fora da tabela) — mas essa mensagem aparece em mais de uma grid da tela ao mesmo tempo (ex: também na lista de "Equipe" da aba Referências) — `getByText()` sem escopo quebra o modo estrito; usar `getByRole("tabpanel", { name: "<aba>" }).getByText(...)`.
- Clicar em "Salvar" várias vezes seguidas na modal de Anexo (ex: 3x rápido) parece disparar requisições em paralelo — clicar em "Fechar" logo em seguida pode ser **ignorado silenciosamente** (nenhum erro, só não fecha) enquanto ainda há alguma pendente; preciso esperar decantar e tentar de novo. Além disso, o diálogo "Atenção" que abre por cima (com um `cdk-overlay-backdrop`) precisa ser verificado **antes** de insistir no "Fechar" de baixo, senão o retry fica preso tentando clicar num botão bloqueado pelo backdrop.
- Diferente da modal de **inclusão** de anexo (cujo "Salvar" já vem habilitado desde o início, igual Colaboradores), a modal de **edição** ("Visualizar anexo") tem o "Salvar" **desabilitado** enquanto nada foi alterado — esse caso específico bate com o que a EF previa (confirmado em 3 execuções consecutivas).
- Toasts de info (não só os de sucesso) também deixam uma **cópia de acessibilidade duplicada** em outro `cdk-overlay`, que pode ter o mesmo texto de um botão de uma modal aberta em seguida (ex: dois "Fechar" simultâneos — um da modal ativa, outro da cópia do toast anterior) — sempre usar `.first()` nesses casos, mesmo quando não é óbvio que existe duplicação.
- **A "Região" do cabeçalho normalmente vem pré-preenchida e desabilitada** (herdada do contexto/perfil do usuário), mas raramente aparece vazia e habilitada, exigindo seleção manual — se não for preenchida, o Salvar principal falha silenciosamente (o campo fica com borda vermelha, sem toast de erro visível de imediato). Como `preencherCadastroValidoESalvar()` (`support/pgr.ts`) é usado por **todos** os specs do projeto, ela agora trata isso defensivamente: se o campo estiver habilitado e vazio, seleciona a primeira opção — sem afetar o caso normal (validado sem regressão contra Configurações e Botões do Cadastro).
- **"Salvar e Adicionar outro" em Colaboradores RESETA os campos da modal** — diferente de Anexos (onde os campos ficam preenchidos), aqui a modal fica realmente limpa depois de salvar, pronta pra digitar o próximo colaborador (confirmado por exploração ao vivo).
- Grid vazia de Colaboradores mostra a mesma mensagem de Anexos: **"Sem registros para listar."** — e tem o mesmo risco de duplicidade na tela (outra grid vazia, tipo a de "Equipe" em Referências) exigindo escopar por `getByRole("tabpanel", { name: "Colaboradores" })`.
- A coluna "Colaborador" do grid tem a classe CSS `mat-sort-header-disabled` (Angular Material CDK) no próprio DOM, confirmando que a ordenação por coluna está desligada — clicar no cabeçalho não reordena as linhas.
- **Enquanto uma modal (CDK) está aberta, o Angular Material marca o conteúdo de fundo como `aria-hidden`** — `getByRole()` não encontra elementos atrás da modal mesmo que existam normalmente no DOM (ex: checar uma linha do grid enquanto a modal "Salvar e Adicionar outro" continua aberta). Nesses casos, usar um locator CSS puro (`page.locator("td", { hasText })`), que ignora `aria-hidden`.
- **BUG real do sistema (2026-07-23)**: clicar em "Salvar" da modal de Colaboradores 2x bem rápido (antes do 1º clique fechar a modal) **duplica o colaborador** no grid — confirmado por screenshot mostrando 2 linhas idênticas após um duplo clique disparado com `Promise.all`. TST1213 ficou como `test.fixme()` por causa disso: o cenário espera "não deve duplicar", mas o sistema real duplica, então não faz sentido reportar como teste passando.
- **Excluir um colaborador na grid só remove localmente** — igual ao padrão já visto em Anexos, precisa clicar no "Salvar" **principal** do cadastro pra persistir de verdade no backend. Um `reload()` logo após confirmar a exclusão (sem esse Salvar) traz o colaborador de volta, porque o servidor nunca recebeu a exclusão.
- Toasts de sucesso em Colaboradores ("Operação realizada com sucesso...") podem ser **rápidos demais** — o toast já pode ter sumido no momento em que o teste tenta checá-lo (flaky). Preferir esperar uma mudança de estado real e determinística (ex: a linha sumir do grid) em vez do toast transitório, antes de fazer `reload()` ou navegar.
- Clicar num elemento que já não existe mais (ex: um botão de confirmação de uma modal já fechada, usado só pra testar "clique extra não gera erro"), mesmo dentro de um `.catch()`, pode **travar o teste até o timeout padrão de ação (~30s)** — o `.catch()` só engole o erro, não acelera a espera. Sempre passar um `timeout` curto explícito (ex: `{ timeout: 2000 }`) nesses cliques "extras" de teste de estabilidade.
