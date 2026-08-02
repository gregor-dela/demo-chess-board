import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import ChessBoard from '../ChessBoard'
import { ChessBoardProps, ChessPiece } from '../../types/chess'
import { baseGameState, setPiece } from '../../test/chessTestUtils'

function makeBoardWithPieces() {
  const gs = baseGameState()
  // Place a couple of pieces to verify accessible names
  const whitePawn: ChessPiece = { type: 'pawn', color: 'white', hasMoved: false }
  const whiteRook: ChessPiece = { type: 'rook', color: 'white', hasMoved: false }
  setPiece(gs.board, 'e2', whitePawn)
  setPiece(gs.board, 'a1', whiteRook)
  return gs
}

describe('ChessBoard a11y', () => {
  it('exposes a grid with 64 gridcells and accessible labels for squares', async () => {
    const props: ChessBoardProps = {
      gameState: makeBoardWithPieces(),
      onSquareClick: () => {},
      onPieceDrop: () => {},
    }

    const { container } = render(<ChessBoard {...props} />)

    const board = screen.getByRole('group', { name: /chess board/i })
    expect(board).toBeInTheDocument()
    expect(board).toHaveClass('board-grid')

    const cells = within(board).getAllByRole('button')
    expect(cells).toHaveLength(64)

    // Check accessible names
    expect(screen.getByLabelText(/e2\s+white pawn/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/a1\s+white rook/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e4\s+empty/i)).toBeInTheDocument()

    // Basic axe check
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
