import React, { useState } from 'react'
import { GameControlsProps } from '../types/chess'
import ConfirmationDialog from './ConfirmationDialog'

const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onResetGame,
  onUndoMove,
  onRedoMove,
  onToggleOrientation,
  onToggleMode,
}) => {
  const winnerLabel = gameState.currentPlayer === 'white' ? '⚫ Black' : '⚪ White'
  const [showResetDialog, setShowResetDialog] = useState(false)

  const openReset = () => setShowResetDialog(true)
  const handleConfirmReset = () => {
    onResetGame()
    setShowResetDialog(false)
  }
  const handleCancelReset = () => setShowResetDialog(false)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Game Status */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-gray-800">Game Status</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Current Player:</span>
            <span className={`font-semibold ${
              gameState.currentPlayer === 'white' ? 'text-gray-800' : 'text-gray-600'
            }`}>
              {gameState.currentPlayer === 'white' ? '⚪ White' : '⚫ Black'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            {gameState.gameStatus === 'checkmate' ? (
              <span className="font-semibold text-red-600" role="status" aria-live="polite" aria-atomic="true">
                ♟️ Checkmate — {winnerLabel} Wins!
              </span>
            ) : gameState.gameStatus === 'stalemate' ? (
              <span className="font-semibold text-yellow-600" role="status" aria-live="polite" aria-atomic="true">
                🤝 Stalemate — Draw!
              </span>
            ) : gameState.gameStatus === 'check' ? (
              <span className="font-semibold text-orange-600" role="status" aria-live="polite" aria-atomic="true">
                ⚠️ Check!
              </span>
            ) : (
              <span className="font-semibold capitalize text-blue-600" role="status" aria-live="polite" aria-atomic="true">
                {gameState.gameStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2 mb-3">
          <span className="text-gray-600">Način igre:</span>
          <span className="font-semibold">{gameState.mode === 'pvai' ? 'Človek vs AI' : 'Človek vs Človek'}</span>
        </div>
        {gameState.mode === 'pvai' && gameState.aiThinking && (
          <div className="w-full bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg p-2 text-center">
            🤖 AI razmišlja...
          </div>
        )}
        <button
          onClick={onToggleMode}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          🤖 Preklopi način igre
        </button>
        <button
          onClick={onToggleOrientation}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          🔁 Obrni ploščo
        </button>
        <button
          onClick={openReset}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          🔄 Reset Game
        </button>
        <button
          onClick={onUndoMove}
          disabled={gameState.moveHistory.length === 0}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          ↶ Undo Move
        </button>
        <button
          onClick={onRedoMove}
          disabled={gameState.redoHistory.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          ↷ Redo Move
        </button>
      </div>


      {/* Move History */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-gray-800">Move History</h3>
        <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-3">
          {gameState.moveHistory.length === 0 ? (
            <p className="text-gray-500 text-center italic">No moves yet</p>
          ) : (
            <div className="space-y-1">
              {gameState.moveHistory.map((move, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{index + 1}.</span>
                  <span className="font-mono">{move.notation}</span>
                  <span className="text-gray-500">
                    {move.from} → {move.to}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
