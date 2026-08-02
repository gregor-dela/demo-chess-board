# Editorial Dark Chess UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the playable chess UI into an editorial dark, board-first experience while preserving gameplay, accessibility, and existing interaction patterns.

**Architecture:** Keep `useChessGame` and the current component tree intact, but strengthen the visual system in three layers: application shell, control panel, and board-square styling. Prefer CSS/token work in `src/index.css` plus focused component markup updates over deeper logic changes so existing tests and semantics remain stable.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, Testing Library, jest-axe

---

## File Map

- Create: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/ChessGame.tsx`
- Modify: `src/components/GameControls.tsx`
- Modify: `src/components/ChessBoard.tsx`
- Modify: `src/components/ChessSquare.tsx`
- Modify: `src/index.css`
- Modify: `src/components/__tests__/GameControls.test.tsx`
- Modify: `src/components/__tests__/ChessBoard.test.tsx`
- Modify: `src/components/__tests__/ChessBoard.a11y.test.tsx`

Notes:
- Do not touch `src/hooks/useChessGame.ts`, engine files, or move validation.
- Keep `role="group"` on the board and `role="button"` on each square.
- Keep `ConfirmationDialog` and `PromotionDialog` behavior unchanged.

### Task 1: Build the editorial dark shell

**Files:**
- Create: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/ChessGame.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing shell test**

Add `src/App.test.tsx`:

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App shell', () => {
  it('renders the editorial header and the live chess board shell', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /modern chess game/i })
    ).toBeInTheDocument()

    expect(
      screen.getByText(/editorial board-first interface/i)
    ).toBeInTheDocument()

    expect(
      screen.getByRole('group', { name: /chess board/i })
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx --runInBand
```

Expected:

```text
FAIL  src/App.test.tsx
TestingLibraryElementError: Unable to find an element with the text: /editorial board-first interface/i
```

- [ ] **Step 3: Implement the new application shell**

Update `src/App.tsx`:

```tsx
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
            Editorial board-first interface with focused controls, clearer state,
            and preserved competitive play flows.
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
```

Update `src/components/ChessGame.tsx`:

```tsx
return (
  <section className="game-layout">
    <div className="game-layout__board">
      <ChessBoard
        gameState={gameState}
        onSquareClick={handleSquareClick}
        onPieceDrop={handlePieceDrop}
      />
    </div>

    <aside className="game-layout__panel">
      <GameControls
        gameState={gameState}
        onResetGame={resetGame}
        onUndoMove={undoMove}
        onRedoMove={redoMove}
        onToggleOrientation={toggleOrientation}
        onToggleMode={toggleMode}
        onSetAiSettings={setAiSettings}
      />
    </aside>

    <PromotionDialog
      isOpen={!!gameState.pendingPromotion}
      color={gameState.pendingPromotion?.color || 'white'}
      onSelect={(p) => completePromotion(p)}
      onCancel={cancelPromotion}
    />
  </section>
)
```

Extend `src/index.css` with the shell classes:

```css
@layer base {
  body {
    @apply font-sans bg-slate-950 text-stone-100;
  }
}

@layer components {
  .app-shell {
    @apply min-h-screen bg-[radial-gradient(circle_at_top,_rgba(180,138,76,0.16),_transparent_28%),linear-gradient(180deg,#09090b_0%,#111318_42%,#16181d_100%)] px-4 py-6 md:px-6 md:py-10;
  }

  .app-shell__glow {
    @apply pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(245,201,120,0.12),_transparent_60%)];
  }

  .app-shell__content {
    @apply relative mx-auto flex w-full max-w-7xl flex-col gap-8;
  }

  .hero-panel {
    @apply rounded-[28px] border border-white/10 bg-white/5 px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur md:px-8;
  }

  .hero-panel__eyebrow {
    @apply mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80;
  }

  .hero-panel__title {
    @apply text-4xl font-semibold tracking-tight text-stone-50 md:text-5xl;
  }

  .hero-panel__subtitle {
    @apply mt-3 max-w-3xl text-sm leading-7 text-stone-300 md:text-base;
  }

  .game-layout {
    @apply grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start;
  }

  .game-layout__board {
    @apply flex justify-center xl:justify-start;
  }

  .game-layout__panel {
    @apply w-full;
  }
}
```

- [ ] **Step 4: Run the shell test to verify it passes**

Run:

```bash
npm test -- src/App.test.tsx --runInBand
```

Expected:

```text
PASS  src/App.test.tsx
1 passed
```

- [ ] **Step 5: Commit the shell foundation**

```bash
git add src/App.tsx src/App.test.tsx src/components/ChessGame.tsx src/index.css
git commit -m "feat(ui): add editorial dark app shell"
```

### Task 2: Rebuild the control panel hierarchy

**Files:**
- Modify: `src/components/GameControls.tsx`
- Modify: `src/components/__tests__/GameControls.test.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing control-panel tests**

Update `src/components/__tests__/GameControls.test.tsx` by replacing the first two tests with:

```tsx
it('renders grouped control sections and disabled action states', () => {
  const onResetGame = vi.fn()
  const onUndoMove = vi.fn()
  const onRedoMove = vi.fn()

  render(
    <GameControls
      gameState={baseGameState()}
      onResetGame={onResetGame}
      onUndoMove={onUndoMove}
      onRedoMove={onRedoMove}
    />
  )

  expect(screen.getByRole('heading', { name: /game status/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /match settings/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /history actions/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /move history/i })).toBeInTheDocument()

  expect(screen.getByText(/white to move/i)).toBeInTheDocument()
  expect(screen.getByText(/game in progress/i)).toBeInTheDocument()

  expect(screen.getByRole('button', { name: /undo move/i })).toBeDisabled()
  expect(screen.getByRole('button', { name: /redo move/i })).toBeDisabled()
})

it('renders ai thinking and move history inside the redesigned panel', () => {
  const gs = baseGameState({
    mode: 'pvai',
    aiThinking: true,
    moveHistory: [
      createMove({ from: 'e2', to: 'e4', notation: 'e4' }),
      createMove({
        from: 'e7',
        to: 'e5',
        notation: 'e5',
        piece: { type: 'pawn', color: 'black', hasMoved: true } as ChessPiece,
      }),
    ],
    redoHistory: [
      createMove({
        from: 'g1',
        to: 'f3',
        notation: 'Nf3',
        piece: { type: 'knight', color: 'white', hasMoved: true } as ChessPiece,
      }),
    ],
  })

  render(
    <GameControls
      gameState={gs}
      onResetGame={vi.fn()}
      onUndoMove={vi.fn()}
      onRedoMove={vi.fn()}
    />
  )

  expect(screen.getByText(/ai is thinking/i)).toBeInTheDocument()
  expect(screen.getByText('e4')).toBeInTheDocument()
  expect(screen.getByText('e2 → e4')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /redo move/i })).toBeEnabled()
})
```

- [ ] **Step 2: Run the control tests to verify they fail**

Run:

```bash
npm test -- src/components/__tests__/GameControls.test.tsx --runInBand
```

Expected:

```text
FAIL  src/components/__tests__/GameControls.test.tsx
Unable to find an accessible element with the role "heading" and name /match settings/i
```

- [ ] **Step 3: Implement the grouped control panel**

Update `src/components/GameControls.tsx`:

```tsx
import React, { useMemo, useState } from 'react'
import { GameControlsProps } from '../types/chess'
import ConfirmationDialog from './ConfirmationDialog'

const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onResetGame,
  onUndoMove,
  onRedoMove,
  onToggleOrientation,
  onToggleMode,
  onSetAiSettings,
}) => {
  const [showResetDialog, setShowResetDialog] = useState(false)

  const statusCopy = useMemo(() => {
    if (gameState.gameStatus === 'checkmate') {
      const winner = gameState.currentPlayer === 'white' ? 'Black' : 'White'
      return { eyebrow: 'Checkmate', body: `${winner} wins the match.`, tone: 'critical' }
    }

    if (gameState.gameStatus === 'stalemate') {
      return { eyebrow: 'Draw', body: 'Stalemate on the board.', tone: 'muted' }
    }

    if (gameState.gameStatus === 'check') {
      return { eyebrow: `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} to move`, body: 'King in check.', tone: 'warning' }
    }

    return { eyebrow: `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} to move`, body: 'Game in progress.', tone: 'active' }
  }, [gameState.currentPlayer, gameState.gameStatus])

  const modeLabel = gameState.mode === 'pvai' ? 'Human vs AI' : 'Human vs Human'

  return (
    <div className="control-panel">
      <section className="control-card control-card--status">
        <p className="control-card__eyebrow">Game status</p>
        <h2 className="control-card__title">{statusCopy.eyebrow}</h2>
        <p className={`status-pill status-pill--${statusCopy.tone}`} role="status" aria-live="polite" aria-atomic="true">
          {statusCopy.body}
        </p>
        {gameState.mode === 'pvai' && gameState.aiThinking && (
          <p className="status-pill status-pill--thinking">AI is thinking</p>
        )}
      </section>

      <section className="control-card">
        <h3 className="control-section-title">Match settings</h3>
        <div className="control-meta-row">
          <span>Mode</span>
          <strong>{modeLabel}</strong>
        </div>
        <div className="control-button-stack">
          <button onClick={onToggleMode} className="control-button control-button--primary">
            Toggle game mode
          </button>
          <button onClick={onToggleOrientation} className="control-button control-button--secondary">
            Flip board
          </button>
        </div>
      </section>

      <section className="control-card">
        <h3 className="control-section-title">History actions</h3>
        <div className="control-button-stack">
          <button
            onClick={onUndoMove}
            disabled={gameState.moveHistory.length === 0}
            className="control-button control-button--secondary"
          >
            Undo move
          </button>
          <button
            onClick={onRedoMove}
            disabled={gameState.redoHistory.length === 0}
            className="control-button control-button--secondary"
          >
            Redo move
          </button>
        </div>
      </section>

      <section className="control-card">
        <h3 className="control-section-title">Move history</h3>
        <div className="history-panel">
          {gameState.moveHistory.length === 0 ? (
            <p className="history-panel__empty">No moves yet</p>
          ) : (
            gameState.moveHistory.map((move, index) => (
              <div key={index} className="history-row">
                <span className="history-row__index">{index + 1}.</span>
                <span className="history-row__notation">{move.notation}</span>
                <span className="history-row__path">
                  {move.from} → {move.to}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="control-card control-card--danger">
        <button onClick={() => setShowResetDialog(true)} className="control-button control-button--danger">
          Reset game
        </button>
      </section>

      <ConfirmationDialog
        isOpen={showResetDialog}
        title="Reset Game?"
        message="This will clear the current board and move history and reset to the starting position."
        confirmText="Reset Game"
        cancelText="Cancel"
        onConfirm={() => {
          onResetGame()
          setShowResetDialog(false)
        }}
        onCancel={() => setShowResetDialog(false)}
      />
    </div>
  )
}

export default GameControls
```

Extend `src/index.css` with panel classes:

```css
.control-panel {
  @apply flex flex-col gap-4;
}

.control-card {
  @apply rounded-[24px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.28)];
}

.control-card--status {
  @apply bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))];
}

.control-card__eyebrow {
  @apply text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/75;
}

.control-card__title {
  @apply mt-3 text-2xl font-semibold text-stone-50;
}

.control-section-title {
  @apply mb-4 text-lg font-semibold text-stone-100;
}

.control-meta-row {
  @apply mb-4 flex items-center justify-between text-sm text-stone-300;
}

.control-button-stack {
  @apply flex flex-col gap-3;
}

.control-button {
  @apply w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-40;
}

.control-button--primary {
  @apply border-amber-300/30 bg-amber-300/15 text-amber-50 hover:bg-amber-300/20;
}

.control-button--secondary {
  @apply border-white/10 bg-white/5 text-stone-100 hover:bg-white/10;
}

.control-button--danger {
  @apply border-red-400/25 bg-red-500/10 text-red-100 hover:bg-red-500/15;
}

.status-pill {
  @apply mt-4 inline-flex rounded-full border px-3 py-1 text-sm font-medium;
}

.status-pill--active {
  @apply border-emerald-400/25 bg-emerald-400/10 text-emerald-100;
}

.status-pill--warning {
  @apply border-amber-400/25 bg-amber-400/10 text-amber-100;
}

.status-pill--critical {
  @apply border-red-400/25 bg-red-400/10 text-red-100;
}

.status-pill--muted {
  @apply border-stone-400/20 bg-stone-400/10 text-stone-200;
}

.status-pill--thinking {
  @apply ml-2 border-sky-400/25 bg-sky-400/10 text-sky-100;
}

.history-panel {
  @apply max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3;
}

.history-panel__empty {
  @apply text-center text-sm italic text-stone-400;
}

.history-row {
  @apply grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2 rounded-xl px-2 py-2 text-sm text-stone-200;
}

.history-row__index {
  @apply text-stone-500;
}

.history-row__notation {
  @apply font-mono text-stone-100;
}

.history-row__path {
  @apply truncate text-stone-400;
}
```

- [ ] **Step 4: Run the control tests to verify they pass**

Run:

```bash
npm test -- src/components/__tests__/GameControls.test.tsx --runInBand
```

Expected:

```text
PASS  src/components/__tests__/GameControls.test.tsx
3 passed
```

- [ ] **Step 5: Commit the control-panel redesign**

```bash
git add src/components/GameControls.tsx src/components/__tests__/GameControls.test.tsx src/index.css
git commit -m "feat(ui): redesign game control panel"
```

### Task 3: Restyle the board stage and square signal hierarchy

**Files:**
- Modify: `src/components/ChessBoard.tsx`
- Modify: `src/components/ChessSquare.tsx`
- Modify: `src/components/__tests__/ChessBoard.test.tsx`
- Modify: `src/components/__tests__/ChessBoard.a11y.test.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing board tests**

Update `src/components/__tests__/ChessBoard.test.tsx`:

```tsx
it('renders the board inside the premium stage shell', () => {
  const props: ChessBoardProps = {
    gameState: baseGameState(),
    onSquareClick: () => {},
    onPieceDrop: () => {},
  }

  const { container } = render(<ChessBoard {...props} />)

  expect(container.querySelector('.board-stage')).toBeTruthy()
  expect(container.querySelector('.board-grid')).toBeTruthy()
  expect(container.querySelectorAll('.chess-square')).toHaveLength(64)
})

it('marks selected, valid-move, and last-move states with explicit classes', () => {
  const props: ChessBoardProps = {
    gameState: baseGameState({
      selectedSquare: 'e4',
      validMoves: ['e5', 'e6'],
      moveHistory: [
        {
          from: 'e2',
          to: 'e4',
          piece: { type: 'pawn', color: 'white', hasMoved: true },
          notation: 'e4',
          timestamp: new Date(),
          prevHasMoved: false,
          prevCastlingRights: {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true },
          },
        },
      ],
    }),
    onSquareClick: () => {},
    onPieceDrop: () => {},
  }

  const { container } = render(<ChessBoard {...props} />)

  expect(container.querySelector('.chess-square-selected')).toBeTruthy()
  expect(container.querySelectorAll('.chess-square-valid-move').length).toBe(2)
  expect(container.querySelectorAll('.chess-square-last-move').length).toBe(1)
})
```

Update `src/components/__tests__/ChessBoard.a11y.test.tsx` to keep the same assertions and add:

```tsx
expect(board).toHaveClass('board-grid')
```

- [ ] **Step 2: Run the board tests to verify they fail**

Run:

```bash
npm test -- src/components/__tests__/ChessBoard.test.tsx src/components/__tests__/ChessBoard.a11y.test.tsx --runInBand
```

Expected:

```text
FAIL  src/components/__tests__/ChessBoard.test.tsx
Expected: truthy
Received: null
```

- [ ] **Step 3: Implement the board stage and square states**

Update `src/components/ChessBoard.tsx`:

```tsx
return (
  <div className="board-stage">
    <div className="board-stage__frame">
      <div className="board-stage__ranks" aria-hidden="true">
        {ranks.map(rank => (
          <div key={rank} className="board-stage__label">
            {rank}
          </div>
        ))}
      </div>

      <div className="board-stage__main">
        <ErrorBoundary>
          <div
            className="board-grid"
            role="group"
            aria-label="Chess board"
          >
            {ranks.map(rank =>
              files.map(file => {
                const square = `${file}${rank}`
                const [row, col] = getCoordinatesFromSquare(square)
                const piece = gameState.board[row][col]
                const isSelected = gameState.selectedSquare === square
                const isValidMove = gameState.validMoves.includes(square)
                const squareColor = getSquareColor(file, rank)
                const lastMove = gameState.moveHistory.length > 0
                  ? gameState.moveHistory[gameState.moveHistory.length - 1]
                  : null
                const isLastMove = lastMove?.to === square

                return (
                  <ChessSquare
                    key={square}
                    square={square}
                    piece={piece}
                    isSelected={isSelected}
                    isValidMove={isValidMove}
                    squareColor={squareColor}
                    onSquareClick={onSquareClick}
                    onPieceDrop={onPieceDrop}
                    currentSelected={gameState.selectedSquare}
                    isLastMove={isLastMove}
                  />
                )
              })
            )}
          </div>

          <div className="board-stage__files" aria-hidden="true">
            {files.map(file => (
              <div key={file} className="board-stage__label">
                {file}
              </div>
            ))}
          </div>
        </ErrorBoundary>
      </div>
    </div>
  </div>
)
```

Update `src/components/ChessSquare.tsx`:

```tsx
const baseClasses = 'chess-square'
const colorClasses = squareColor === 'light' ? 'chess-square-light' : 'chess-square-dark'
const selectedClasses = isSelected ? 'chess-square-selected' : ''
const validMoveClasses = isValidMove ? 'chess-square-valid-move' : ''
const lastMoveClasses = isLastMove ? 'chess-square-last-move' : ''

return (
  <div
    className={`${baseClasses} ${colorClasses} ${selectedClasses} ${validMoveClasses} ${lastMoveClasses}`}
    data-square={square}
    data-square-color={squareColor}
    onClick={handleClick}
    onDragOver={handleDragOver}
    onDrop={handleDrop}
    role="button"
    aria-label={ariaLabel}
    aria-pressed={isSelected || undefined}
    tabIndex={0}
    onKeyDown={handleKeyDown}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
  >
    {piece && (
      <ChessPieceComponent
        piece={piece}
        square={square}
        isSelected={isSelected}
        isValidMove={isValidMove}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    )}
  </div>
)
```

Extend `src/index.css` with board classes:

```css
.board-stage {
  @apply inline-flex rounded-[32px] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.5)];
}

.board-stage__frame {
  @apply flex items-start gap-3;
}

.board-stage__main {
  @apply flex flex-col;
}

.board-stage__ranks {
  @apply flex flex-col pt-[2px];
}

.board-stage__files {
  @apply mt-3 grid grid-cols-8;
}

.board-stage__label {
  @apply flex h-16 w-16 items-center justify-center text-sm font-medium uppercase tracking-[0.18em] text-stone-400;
}

.board-grid {
  @apply grid grid-cols-8 overflow-hidden rounded-[24px] border border-black/30 bg-black/20;
}

.chess-square {
  @apply relative flex h-16 w-16 cursor-pointer items-center justify-center transition-all duration-200 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/80;
}

.chess-square-light {
  @apply bg-[#d8ccb8];
}

.chess-square-dark {
  @apply bg-[#6d5a4b];
}

.chess-square-last-move {
  @apply shadow-[inset_0_0_0_2px_rgba(245,158,11,0.45)];
}

.chess-square-selected {
  @apply z-[1] shadow-[inset_0_0_0_3px_rgba(251,191,36,0.95)];
}

.chess-square-valid-move::after {
  @apply content-[''] absolute inset-0 m-4 rounded-full bg-emerald-300/30;
}

.chess-piece {
  @apply text-4xl text-stone-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.25)] select-none transition-transform duration-200 hover:scale-110;
}
```

- [ ] **Step 4: Run the board tests to verify they pass**

Run:

```bash
npm test -- src/components/__tests__/ChessBoard.test.tsx src/components/__tests__/ChessBoard.a11y.test.tsx --runInBand
```

Expected:

```text
PASS  src/components/__tests__/ChessBoard.test.tsx
PASS  src/components/__tests__/ChessBoard.a11y.test.tsx
```

- [ ] **Step 5: Run the full verification set**

Run:

```bash
npm run lint
npm run test:quick
npm test -- src/App.test.tsx src/components/__tests__/GameControls.test.tsx src/components/__tests__/ChessBoard.test.tsx src/components/__tests__/ChessBoard.a11y.test.tsx --runInBand
```

Expected:

```text
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
PASS  src/App.test.tsx
PASS  src/components/__tests__/GameControls.test.tsx
PASS  src/components/__tests__/ChessBoard.test.tsx
PASS  src/components/__tests__/ChessBoard.a11y.test.tsx
```

- [ ] **Step 6: Commit the board polish**

```bash
git add src/components/ChessBoard.tsx src/components/ChessSquare.tsx src/components/__tests__/ChessBoard.test.tsx src/components/__tests__/ChessBoard.a11y.test.tsx src/index.css
git commit -m "feat(ui): restyle board stage and square states"
```

## Self-Review Checklist

### Spec coverage

- Editorial dark shell: covered by Task 1.
- Board-first two-column layout: covered by Task 1.
- Rebuilt status hierarchy and lighter UX improvements: covered by Task 2.
- Board framing, square hierarchy, and signal cleanup: covered by Task 3.
- Accessibility preservation: covered by Task 3 plus explicit a11y test updates.
- No gameplay/engine/reducer changes: enforced in File Map and task notes.

### Placeholder scan

- No `TBD`, `TODO`, “implement later”, or “write tests for the above”.
- Every task contains exact file paths, code snippets, commands, and expected outcomes.

### Type consistency

- `GameControls` still uses `GameControlsProps`.
- `ChessBoard` still receives `ChessBoardProps`.
- `ChessSquare` prop names stay aligned with current implementation (`isSelected`, `isValidMove`, `isLastMove`, `squareColor`, `currentSelected`).

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-02-editorial-dark-chess-ui.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
