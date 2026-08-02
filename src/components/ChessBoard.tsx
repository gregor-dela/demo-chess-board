import React from 'react'
import ChessSquare from './ChessSquare'
import ErrorBoundary from './ErrorBoundary'
import { ChessBoardProps } from '../types/chess'
import { getSquareColor, getCoordinatesFromSquare } from '../utils/chessUtils'

const ChessBoard: React.FC<ChessBoardProps> = ({
  gameState,
  onSquareClick,
  onPieceDrop
}) => {
  const isWhiteBottom = gameState.orientation === 'whiteBottom'
  const files = isWhiteBottom ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
  const ranks = isWhiteBottom ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]

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
                  const lastMove = gameState.moveHistory.length > 0 ? gameState.moveHistory[gameState.moveHistory.length - 1] : null
                  const isLastMove = lastMove ? (lastMove.from === square || lastMove.to === square) : false

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
}

export default ChessBoard
