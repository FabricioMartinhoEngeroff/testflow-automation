# Permissões nos testes: abordagem antiga × atual

Nada disso foi apagado. Este é o levantamento para você decidir o que remover.

## Abordagem antiga (desativada, tudo comentado)

Um único usuário "de perfil" (`PGR_USUARIO_PERFIL`) tinha o perfil de acesso editado em tela pelo usuário principal, e depois entrava para ser verificado.

| Onde | O que é |
|---|---|
| `e2e/support/index.ts` | trechos `PERMISSÕES (desativado)`: tipo `UsuarioPerfil` e fixture `usuarioPerfil` (segundo contexto de navegador, login com `credenciaisPerfil()`) |
| `e2e/shared/env.ts` | função `credenciaisPerfil()` (lê `PGR_USUARIO_PERFIL` e `PGR_SENHA_PERFIL`), comentada |
| `e2e/support/data/perfil.ts` | constante `PERFIL_USUARIO_TESTE` ("Fabricio Ee @Teste08"), arquivo todo comentado |
| `e2e/specs/.../ltcat/permissoes-pesquisa.spec.ts` | spec inteiro comentado (86 linhas), usa `perfilAcessoPage` + `usuarioPerfil` |
| `e2e/__tests__/env.spec.ts` | 2 testes de `credenciaisPerfil` comentados; o `beforeEach` ainda limpa `PGR_USUARIO_PERFIL`/`PGR_SENHA_PERFIL` |
| `e2e/.env.example` | variáveis `PGR_USUARIO_PERFIL` e `PGR_SENHA_PERFIL` |
| `e2e/support/actions/perfis-de-acesso/gerenciar-perfis/PerfilAcesso.ts` + fixture `perfilAcessoPage` | Page Object que edita o perfil em tela; hoje só o spec comentado o usa |
| `e2e/support/urls.ts` | trecho `PERMISSÕES` comentado |
| projeto `perfis-de-acesso` (playwright.config) | aponta para uma pasta que só tem `.gitkeep` |

## Abordagem atual

Vários usuários fixos `QAutomatizador_*`, já cadastrados no Apollus com perfis prontos, cada um com sessão salva.

| Onde | O que é |
|---|---|
| `e2e/specs/auth.setup.ts` | loga cada usuário e salva `.auth/<usuario>.json` |
| `e2e/support/usuarios.ts` | lista `USUARIOS` e `sessao(usuario)` (caminho do JSON) |
| `e2e/shared/env.ts` | `senhaUsuarioQa(login)` (`PGR_SENHA_<login>`) |
| `e2e/specs/.../ltcat/permissoes-ltcat.spec.ts` | 548 linhas, usa `test.use({ storageState: sessao(...) })` |
| projetos `auth` e `ltcat-permissoes` (playwright.config) | `ltcat-permissoes` depende de `auth` |

## Sugestão (a decidir)

Pode remover da antiga: `support/data/perfil.ts`, `permissoes-pesquisa.spec.ts`, os trechos comentados de `index.ts`, `env.ts`, `urls.ts` e `env.spec.ts`, e as duas variáveis `*_PERFIL` do `.env.example`. O cenário "acesso pela URL redireciona para o Meu Apollus" do spec comentado já existe no `permissoes-ltcat.spec.ts` (linha 102), então nada se perde. `PerfilAcesso.ts` e o projeto `perfis-de-acesso` ficam fora dessa lista por você ter pedido para não remover o projeto.
