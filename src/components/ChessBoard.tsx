import React, { useRef, useState } from 'react'
import ChessSquare from './ChessSquare'
import ErrorBoundary from './ErrorBoundary'
import { CapturedPiecesTop, CapturedPiecesBottom } from './CapturedPieces'
import { ChessBoardProps, Square } from '../types/chess'
import { getSquareColor, getCoordinatesFromSquare } from '../utils/board'
import { getBoardThemePalette } from '../utils/boardThemes'

const ChessBoard: React.FC<ChessBoardProps> = ({
  gameState,
  onSquareClick,
  onPieceDrop,
  onDeselect
}) => {
  const isWhiteBottom = gameState.orientation === 'whiteBottom'
  const files = isWhiteBottom ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
  const ranks = isWhiteBottom ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]
  const themePalette = getBoardThemePalette(gameState.boardTheme)

  // Vrstni red polj v DOM (za roving tabindex in navigacijo s puščicami).
  const renderedOrder = ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square))

  // Roving tabindex: v zaporedju Tab je le eno polje; med polji se premikamo s puščicami.
  const [activeSquare, setActiveSquare] = useState<Square | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const tabbableSquare = activeSquare ?? renderedOrder[0]

  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    if (!arrowKeys.includes(e.key)) return
    const from = (e.target as HTMLElement).getAttribute('data-square')
    if (!from) return
    const index = renderedOrder.indexOf(from as Square)
    if (index === -1) return

    const col = index % 8
    let next = index
    if (e.key === 'ArrowRight' && col < 7) next = index + 1
    else if (e.key === 'ArrowLeft' && col > 0) next = index - 1
    else if (e.key === 'ArrowDown' && index + 8 < 64) next = index + 8
    else if (e.key === 'ArrowUp' && index - 8 >= 0) next = index - 8
    else return

    e.preventDefault()
    const target = renderedOrder[next]
    setActiveSquare(target)
    gridRef.current?.querySelector<HTMLElement>(`[data-square="${target}"]`)?.focus()
  }

  const handleGridFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const square = (e.target as HTMLElement).getAttribute('data-square')
    if (square) setActiveSquare(square as Square)
  }

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
              ref={gridRef}
              onKeyDown={handleGridKeyDown}
              onFocus={handleGridFocus}
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
                      onDeselect={onDeselect}
                      onSquarePointerDown={handleSquarePointerDown}
                      currentSelected={gameState.selectedSquare}
                      isLastMove={isLastMove}
                      isPreviewMove={isPreviewMove}
                      tabIndex={square === tabbableSquare ? 0 : -1}
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
