import { test as base, expect } from "@playwright/test"
import { Login } from "./actions/Login"
import { Pgr } from "./actions/Pgr"
import { LtcatPage } from "./actions/LTCAT/LTCAT"
import { LtcatCadastroPage } from "./actions/LTCAT/LTCATCadastro"
import { LtcatReferenciasPage } from "./actions/LTCAT/LTCATReferencias"
import { LtcatConfiguracoesPage } from "./actions/LTCAT/LTCATConfiguracoes"
import { LtcatAnexosPage } from "./actions/LTCAT/LTCATAnexos"
import { LtcatAnexoModal } from "./actions/LTCAT/LTCATAnexoModal"
import { LtcatColaboradoresPage } from "./actions/LTCAT/LTCATColaboradores"
import { LtcatColaboradorModal } from "./actions/LTCAT/LTCATColaboradorModal"
import { LtcatConclusaoPage } from "./actions/LTCAT/LTCATConclusao"
import { LtcatHistoricoRevisoesModal } from "./actions/LTCAT/LTCATHistoricoRevisoes"
import { LtcatNotificacoesModal } from "./actions/LTCAT/LTCATNotificacoes"
import { ProfissionalPage } from "./actions/Profissional"
import { Toast } from "./actions/Toast"

type Pages = {
  login: Login
  pgr: Pgr
  profissionalPage: ProfissionalPage
  ltcatPage: LtcatPage
  ltcatCadastroPage: LtcatCadastroPage
  ltcatReferenciasPage: LtcatReferenciasPage
  ltcatConfiguracoesPage: LtcatConfiguracoesPage
  ltcatAnexosPage: LtcatAnexosPage
  ltcatAnexoModal: LtcatAnexoModal
  ltcatColaboradoresPage: LtcatColaboradoresPage
  ltcatColaboradorModal: LtcatColaboradorModal
  ltcatConclusaoPage: LtcatConclusaoPage
  ltcatHistoricoRevisoesModal: LtcatHistoricoRevisoesModal
  ltcatNotificacoesModal: LtcatNotificacoesModal
  toast: Toast
}

// cada page é instanciada sob demanda, só nos testes que a pedem no argumento
export const test = base.extend<Pages>({
  login: async ({ page }, use) => {
    await use(new Login(page))
  },
  pgr: async ({ page }, use) => {
    await use(new Pgr(page))
  },
  profissionalPage: async ({ page }, use) => {
    await use(new ProfissionalPage(page))
  },
  ltcatPage: async ({ page }, use) => {
    await use(new LtcatPage(page))
  },
  ltcatCadastroPage: async ({ page }, use) => {
    await use(new LtcatCadastroPage(page))
  },
  ltcatReferenciasPage: async ({ page }, use) => {
    await use(new LtcatReferenciasPage(page))
  },
  ltcatConfiguracoesPage: async ({ page }, use) => {
    await use(new LtcatConfiguracoesPage(page))
  },
  ltcatAnexosPage: async ({ page }, use) => {
    await use(new LtcatAnexosPage(page))
  },
  ltcatAnexoModal: async ({ page }, use) => {
    await use(new LtcatAnexoModal(page))
  },
  ltcatColaboradoresPage: async ({ page }, use) => {
    await use(new LtcatColaboradoresPage(page))
  },
  ltcatColaboradorModal: async ({ page }, use) => {
    await use(new LtcatColaboradorModal(page))
  },
  ltcatConclusaoPage: async ({ page }, use) => {
    await use(new LtcatConclusaoPage(page))
  },
  ltcatHistoricoRevisoesModal: async ({ page }, use) => {
    await use(new LtcatHistoricoRevisoesModal(page))
  },
  ltcatNotificacoesModal: async ({ page }, use) => {
    await use(new LtcatNotificacoesModal(page))
  },
  toast: async ({ page }, use) => {
    await use(new Toast(page))
  },
})

export { expect }
