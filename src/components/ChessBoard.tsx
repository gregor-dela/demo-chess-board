import React from 'react'
import ChessSquare from './ChessSquare'
import ErrorBoundary from './ErrorBoundary'
import { CapturedPiecesTop, CapturedPiecesBottom } from './CapturedPieces'
import { ChessBoardProps, Square } from '../types/chess'
import { getSquareColor, getCoordinatesFromSquare } from '../utils/board'
import { getBoardThemePalette } from '../utils/boardThemes'

const ChessBoard: React.FC<ChessBoardProps> = ({
  gameState,
  onSquareClick,
  onPieceDrop
}) => {
  const isWhiteBottom = gameState.orientation === 'whiteBottom'
  const files = isWhiteBottom ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
  const ranks = isWhiteBottom ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]
  const themePalette = getBoardThemePalette(gameState.boardTheme)

  // Takojšnja izbira (issue: hitrejše vlečenje): ob pritisku z miško se figura
  // izbere in prikažejo se veljavne poteze, še preden se sproži nativni drag —
  // tako se odzivnost približa chess.com.
  const handleSquarePointerDown = (square: Square, e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const [row, col] = getCoordinatesFromSquare(square)
    const piece = gameState.board[row][col]
    if (piece && piece.color === gameState.currentPlayer) {
      onSquareClick(square)
    }
  }

  return (
    <div className="board-stage">
      <CapturedPiecesTop
        moveHistory={gameState.moveHistory}
        orientation={gameState.orientation}
      />
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
              data-board-theme={themePalette.id}
              style={{
                '--board-light': themePalette.light,
                '--board-dark': themePalette.dark,
              } as React.CSSProperties}
            >
              {ranks.map(rank =>
                files.map(file => {
                  const square = `${file}${rank}` as Square
                  const [row, col] = getCoordinatesFromSquare(square)
                  const piece = gameState.board[row][col]
                  const isSelected = gameState.selectedSquare === square
                  const isValidMove = gameState.validMoves.includes(square)
                  const squareColor = getSquareColor(file, rank)
                  const lastMove = gameState.moveHistory.length > 0 ? gameState.moveHistory[gameState.moveHistory.length - 1] : null
                  const isLastMove = lastMove ? (lastMove.from === square || lastMove.to === square) : false
                  const preview = gameState.previewMove
                  const isPreviewMove = preview ? (preview.from === square || preview.to === square) : false

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
                      onSquarePointerDown={handleSquarePointerDown}
                      currentSelected={gameState.selectedSquare}
                      isLastMove={isLastMove}
                      isPreviewMove={isPreviewMove}
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
      <CapturedPiecesBottom
        moveHistory={gameState.moveHistory}
        orientation={gameState.orientation}
      />
    </div>
  )
}

export default ChessBoard
