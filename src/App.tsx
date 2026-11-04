import ChessGame from './components/ChessGame'

function App() {
  return (
    <div className="app-shell">
      <div className="app-shell__glow" aria-hidden="true" />
      <div className="app-shell__content">
        <header className="hero-panel">
          <p className="hero-panel__eyebrow">Tournament Room</p>
          <h1 className="hero-panel__title">Modern Chess Game</h1>
          <p className="hero-panel__subtitle">
            Editorial board-first interface for focused play, clear analysis,
            and a more modern tournament-room presentation.
          </p>
        </header>
        <main>
          <ChessGame />
        </main>
      </div>
    </div>
  )
}

export default App
