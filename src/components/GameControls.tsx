import React, { useState } from 'react'
import { GameControlsProps } from '../types/chess'
import ConfirmationDialog from './ConfirmationDialog'

function getStatusCopy(gameState: GameControlsProps['gameState']) {
  const playerToMove = gameState.currentPlayer === 'white' ? 'White to move' : 'Black to move'
  const winner = gameState.currentPlayer === 'white' ? 'Black' : 'White'

  switch (gameState.gameStatus) {
    case 'check':
      return {
        title: playerToMove,
        description: 'King in check.',
        badgeLabel: '⚠️ Check!',
        badgeClassName: 'status-pill--warning',
      }
    case 'checkmate':
      return {
        title: 'Checkmate',
        description: `Checkmate — ${winner} wins!`,
        badgeLabel: 'Checkmate',
        badgeClassName: 'status-pill--critical',
      }
    case 'stalemate':
      return {
        title: 'Draw',
        description: 'Stalemate — Draw!',
        badgeLabel: 'Draw',
        badgeClassName: 'status-pill--muted',
      }
    case 'draw':
      return {
        title: 'Draw',
        description: 'Draw reached.',
        badgeLabel: 'Draw',
        badgeClassName: 'status-pill--muted',
      }
    case 'active':
    default:
      return {
        title: playerToMove,
        description: 'Game in progress.',
        badgeLabel: 'Active',
        badgeClassName: 'status-pill--active',
      }
  }
}

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
  const statusCopy = getStatusCopy(gameState)
  const currentModeLabel = gameState.mode === 'pvai' ? 'Player vs AI' : 'Player vs Player'
  const aiSettings = gameState.aiSettings

  const openReset = () => setShowResetDialog(true)
  const handleConfirmReset = () => {
    onResetGame()
    setShowResetDialog(false)
  }
  const handleCancelReset = () => setShowResetDialog(false)

  const difficultyLabel = (depth: number): string => {
    if (depth <= 1) return 'Easy'
    if (depth === 2) return 'Easy-Medium'
    if (depth === 3) return 'Medium'
    if (depth === 4) return 'Medium-Hard'
    if (depth === 5) return 'Hard'
    return 'Master'
  }

  const styleLabel = (style: 'aggressive' | 'positional' | 'balanced' | undefined): string => {
    if (style === 'aggressive') return 'Aggressive'
    if (style === 'positional') return 'Positional'
    return 'Balanced'
  }

  return (
    <div className="control-panel">
      <section className="control-card control-card--status" aria-labelledby="game-status-title">
        <p className="control-card__eyebrow">Live overview</p>
        <h2 id="game-status-title" className="control-section-title">Game status</h2>
        <div role="status" aria-live="polite" aria-atomic="true">
          <div className="control-meta-row">
            <span className={`status-pill ${statusCopy.badgeClassName}`}>
              {statusCopy.badgeLabel}
            </span>
            {gameState.mode === 'pvai' && gameState.aiThinking && (
              <span className="status-pill status-pill--thinking">
                AI is thinking
              </span>
            )}
          </div>
          <h3 className="control-card__title">{statusCopy.title}</h3>
          <p>{statusCopy.description}</p>
        </div>
      </section>

      <section className="control-card" aria-labelledby="match-settings-title">
        <p className="control-card__eyebrow">Session setup</p>
        <h2 id="match-settings-title" className="control-section-title">Match settings</h2>
        <div className="control-meta-row">
          <span className="status-pill status-pill--muted">Current mode</span>
          <span className="control-card__title">{currentModeLabel}</span>
        </div>
        <div className="control-button-stack">
          <button
            onClick={onToggleMode}
            className="control-button control-button--primary"
          >
            Toggle game mode
          </button>
          <button
            onClick={onToggleOrientation}
            className="control-button control-button--secondary"
          >
            Flip board
          </button>
        </div>

        {gameState.mode === 'pvai' && aiSettings && (
          <div className="ai-settings-stack" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="control-card__eyebrow" style={{ marginTop: '0.25rem' }}>AI difficulty &amp; style</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label htmlFor="ai-depth" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Difficulty: {difficultyLabel(aiSettings.depth ?? 3)}
              </label>
              <select
                id="ai-depth"
                aria-label="AI Difficulty"
                value={aiSettings.depth ?? 3}
                onChange={(e) => onSetAiSettings({ depth: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value={1}>Easy (depth 1)</option>
                <option value={2}>Easy-Medium (depth 2)</option>
                <option value={3}>Medium (depth 3)</option>
                <option value={4}>Medium-Hard (depth 4)</option>
                <option value={5}>Hard (depth 5)</option>
                <option value={6}>Master (depth 6)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label htmlFor="ai-style" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Play style: {styleLabel(aiSettings.style)}
              </label>
              <select
                id="ai-style"
                aria-label="AI Play Style"
                value={aiSettings.style ?? 'balanced'}
                onChange={(e) => onSetAiSettings({ style: e.target.value as 'aggressive' | 'positional' | 'balanced' })}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
                <option value="positional">Positional</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label htmlFor="ai-side" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                AI plays as: {aiSettings.aiPlays === 'white' ? 'White' : 'Black'}
              </label>
              <select
                id="ai-side"
                aria-label="AI Side"
                value={aiSettings.aiPlays}
                onChange={(e) => onSetAiSettings({ aiPlays: e.target.value as 'white' | 'black' })}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="black">Black (you play White)</option>
                <option value="white">White (you play Black)</option>
              </select>
            </div>
          </div>
        )}
      </section>

      <section className="control-card" aria-labelledby="history-actions-title">
        <p className="control-card__eyebrow">Timeline controls</p>
        <h2 id="history-actions-title" className="control-section-title">History actions</h2>
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

      <section className="control-card" aria-labelledby="move-history-title">
        <p className="control-card__eyebrow">Notation log</p>
        <h2 id="move-history-title" className="control-section-title">Move history</h2>
        <div className="history-panel">
          {gameState.moveHistory.length === 0 ? (
            <p className="history-panel__empty">No moves yet</p>
          ) : (
            gameState.moveHistory.map((move, index) => (
              <div key={`${move.from}-${move.to}-${index}`} className="history-row">
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
        <p className="control-card__eyebrow">Danger zone</p>
        <h2 className="control-card__title">Reset current match</h2>
        <button
          onClick={openReset}
          className="control-button control-button--danger"
        >
          Reset game
        </button>
      </section>

      <ConfirmationDialog
        isOpen={showResetDialog}
        title="Reset Game?"
        message="This will clear the current board and move history and reset to the starting position."
        confirmText="Reset Game"
        cancelText="Cancel"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </div>
  )
}

export default GameControls
