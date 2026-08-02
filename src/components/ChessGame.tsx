import React from 'react'
import ChessBoard from './ChessBoard'
import GameControls from './GameControls'
import { useChessGame } from '../hooks/useChessGame'

import PromotionDialog from './PromotionDialog'
import type { GameState } from '../types/chess'

interface ChessGameProps {
  initialState?: GameState
}

const ChessGame: React.FC<ChessGameProps> = ({ initialState }) => {
  const {
    gameState,
    handleSquareClick,
    handlePieceDrop,
    resetGame,
    undoMove,
    redoMove,
    completePromotion,
    cancelPromotion,
    toggleOrientation,
    toggleMode,
    setAiSettings,
  } = useChessGame(initialState)

  return (
    <div className="game-layout">
      <div className="game-layout__board">
        <ChessBoard
          gameState={gameState}
          onSquareClick={handleSquareClick}
          onPieceDrop={handlePieceDrop}
        />
      </div>
      <div className="game-layout__panel">
        <GameControls
          gameState={gameState}
          onResetGame={resetGame}
          onUndoMove={undoMove}
          onRedoMove={redoMove}
          onToggleOrientation={toggleOrientation}
          onToggleMode={toggleMode}
          onSetAiSettings={setAiSettings}
        />
      </div>

      {/* Promotion dialog */}
      <PromotionDialog
        isOpen={!!gameState.pendingPromotion}
        color={gameState.pendingPromotion?.color || 'white'}
        onSelect={(p) => completePromotion(p)}
        onCancel={cancelPromotion}
      />
    </div>
  )
}

export default ChessGame
