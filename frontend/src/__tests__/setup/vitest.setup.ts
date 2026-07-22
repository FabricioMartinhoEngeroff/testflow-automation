import "@testing-library/jest-dom/vitest"

// localStorage é compartilhado entre testes (é o mesmo jsdom o tempo todo) —
// sem isso, um teste que salva um perfil "vaza" pro próximo teste e quebra
// a suposição de estado vazio no início de cada um
beforeEach(() => {
  localStorage.clear()
})
