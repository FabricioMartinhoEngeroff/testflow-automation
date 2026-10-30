// Exploração: LTCATs de Curitiba que os testes de permissão deixaram nos anos 2029–2035 (vigência 01/02/<ano>),
// quando a limpeza pelo QAutomatizador_todas_h1 falha. Só lista, não exclui.
import { test } from "@support"
import { H1 } from "@support/data/hierarquias"

test("explorar sobras dos testes de permissão", async ({ login, ltcatPage }) => {
  test.setTimeout(300000)
  await login.entrar()
  for (let ano = 2029; ano <= 2035; ano++) {
    await ltcatPage.abrir()
    await ltcatPage.filtrarPorRegiao(H1)
    if (!(await ltcatPage.selecionarAno(ano))) {
      console.log(ano, "| ano não está no filtro (sem LTCAT)")
      continue
    }
    await ltcatPage.pesquisar()
    const inicios = (await ltcatPage.mensagemSemRegistros.isVisible()) ? [] : await ltcatPage.celulas("dataInicio")
    console.log(ano, "| início das vigências:", inicios.join(", "), "| do teste:", inicios.filter((d) => d === `01/02/${ano}`).length)
  }
})
