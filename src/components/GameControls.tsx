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
}) => {
  const [showResetDialog, setShowResetDialog] = useState(false)
  const statusCopy = getStatusCopy(gameState)
  const currentModeLabel = gameState.mode === 'pvai' ? 'Player vs AI' : 'Player vs Player'

  const openReset = () => setShowResetDialog(true)
  const handleConfirmReset = () => {
    onResetGame()
    setShowResetDialog(false)
  }
  const handleCancelReset = () => setShowResetDialog(false)

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
