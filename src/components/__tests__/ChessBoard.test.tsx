import React from 'react'
import { render, screen } from '@testing-library/react'
import ChessBoard from '../ChessBoard'
import { ChessPiece, ChessBoardProps, GameState } from '../../types/chess'

function createEmptyBoard(): (ChessPiece | null)[][] {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null))
}

function baseGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 'white',
    moveHistory: [],
    redoHistory: [],
    gameStatus: 'active',
    selectedSquare: null,
    validMoves: [],
    isInCheck: false,
    castlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    },
    enPassantTarget: null,
    orientation: 'whiteBottom',
    ...overrides,
  }
}

describe('ChessBoard', () => {
  it('renders board stage wrappers, labels and 64 squares', () => {
    const props: ChessBoardProps = {
      gameState: baseGameState(),
      onSquareClick: () => {},
      onPieceDrop: () => {},
    }

    const { container } = render(<ChessBoard {...props} />)

    expect(container.querySelector('.board-stage')).toBeInTheDocument()
    expect(container.querySelector('.board-grid')).toBeInTheDocument()

    // Rank labels 8..1
    for (let r = 8; r >= 1; r--) {
      expect(screen.getByText(String(r))).toBeInTheDocument()
    }
    // File labels a..h
    ['a','b','c','d','e','f','g','h'].forEach(f => {
      expect(screen.getByText(f)).toBeInTheDocument()
    })

    // 64 squares
    const squares = container.querySelectorAll('.chess-square')
    expect(squares.length).toBe(64)
  })

  it('applies selected and valid move classes when provided', () => {
    const props: ChessBoardProps = {
      gameState: baseGameState({ selectedSquare: 'e4', validMoves: ['e5', 'e6'] }),
      onSquareClick: () => {},
      onPieceDrop: () => {},
    }

    const { container } = render(<ChessBoard {...props} />)

    const selected = container.querySelector('[data-square="e4"]')
    const validE5 = container.querySelector('[data-square="e5"]')
    const validE6 = container.querySelector('[data-square="e6"]')

    expect(selected).toHaveClass('chess-square-selected')
    expect(validE5).toHaveClass('chess-square-valid-move')
    expect(validE6).toHaveClass('chess-square-valid-move')
  })

  it('applies last move classes to both from and to squares of the latest move', () => {
    const pawn: ChessPiece = { type: 'pawn', color: 'white', hasMoved: true }
    const props: ChessBoardProps = {
      gameState: baseGameState({
        moveHistory: [
          {
            from: 'e2',
            to: 'e4',
            piece: pawn,
            notation: 'e4',
            timestamp: new Date('2026-08-02T12:00:00Z'),
            prevHasMoved: false,
            prevCastlingRights: {
              white: { kingSide: true, queenSide: true },
              black: { kingSide: true, queenSide: true }
            }
          }
        ]
      }),
      onSquareClick: () => {},
      onPieceDrop: () => {},
    }

    const { container } = render(<ChessBoard {...props} />)

    const lastMoveSquares = container.querySelectorAll('.chess-square-last-move')
    expect(lastMoveSquares).toHaveLength(2)
    expect(container.querySelector('[data-square="e2"]')).toHaveClass('chess-square-last-move')
    expect(container.querySelector('[data-square="e4"]')).toHaveClass('chess-square-last-move')
  })
})
