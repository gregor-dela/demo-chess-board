import React from 'react'
import { render, screen } from '@testing-library/react'
import { CapturedPiecesTop, CapturedPiecesBottom } from '../CapturedPieces'
import { ChessPiece, Move, CastlingRights } from '../../types/chess'

const baseCastling: CastlingRights = {
  white: { kingSide: true, queenSide: true },
  black: { kingSide: true, queenSide: true }
}

function piece(type: ChessPiece['type'], color: ChessPiece['color']): ChessPiece {
  return { type, color, hasMoved: true }
}

function buildMove(overrides: Partial<Move> = {}): Move {
  return {
    from: 'e2',
    to: 'e4',
    piece: piece('pawn', 'white'),
    notation: 'e4',
    timestamp: new Date('2026-08-02T12:00:00Z'),
    prevHasMoved: false,
    prevCastlingRights: baseCastling,
    ...overrides,
  }
}

describe('CapturedPieces (empty history)', () => {
  it('Top renders empty state, no listitems, no advantage badge, role=list', () => {
    const { container } = render(<CapturedPiecesTop moveHistory={[]} orientation="whiteBottom" />)

    const list = container.querySelector('.captured-bar')
    expect(list).toHaveAttribute('role', 'list')
    expect(list).toHaveAttribute('aria-label', 'Pieces captured by black')
    expect(container.querySelector('.captured-bar__empty')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(container.querySelector('.captured-bar__advantage')).not.toBeInTheDocument()
  })

  it('Bottom renders empty state with aria-label for white', () => {
    const { container } = render(<CapturedPiecesBottom moveHistory={[]} orientation="whiteBottom" />)

    expect(container.querySelector('.captured-bar'))
      .toHaveAttribute('aria-label', 'Pieces captured by white')
    expect(container.querySelector('.captured-bar__empty')).toBeInTheDocument()
    expect(container.querySelector('.captured-bar__advantage')).not.toBeInTheDocument()
  })

  it('Top with blackBottom orientation shows correct aria-label (white captured)', () => {
    const { container } = render(<CapturedPiecesTop moveHistory={[]} orientation="blackBottom" />)
    expect(container.querySelector('.captured-bar'))
      .toHaveAttribute('aria-label', 'Pieces captured by white')
  })

  it('Bottom with blackBottom orientation shows correct aria-label (black captured)', () => {
    const { container } = render(<CapturedPiecesBottom moveHistory={[]} orientation="blackBottom" />)
    expect(container.querySelector('.captured-bar'))
      .toHaveAttribute('aria-label', 'Pieces captured by black')
  })
})

describe('CapturedPieces (sorting + grouping, whiteBottom)', () => {
  it('Top (whiteBottom) = white captures. Queen + 2 pawns sort: pawn, pawn, queen', () => {
    const history: Move[] = [
      buildMove({ piece: piece('queen', 'white'), captured: piece('queen', 'black') }),
      buildMove({ piece: piece('pawn', 'white'), captured: piece('pawn', 'black') }),
      buildMove({ piece: piece('bishop', 'white'), captured: piece('pawn', 'black') }),
    ]

    render(<CapturedPiecesTop moveHistory={history} orientation="whiteBottom" />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveClass('captured-bar__piece--black')
    expect(items[0]).toHaveAttribute('aria-label', 'black pawn')
    expect(items[1]).toHaveAttribute('aria-label', 'black pawn')
    expect(items[2]).toHaveAttribute('aria-label', 'black queen')
  })

  it('Bottom (whiteBottom) = black captures. Rook + knight sort: knight, rook', () => {
    const history: Move[] = [
      buildMove({ piece: piece('rook', 'black'), captured: piece('rook', 'white') }),
      buildMove({ piece: piece('knight', 'black'), captured: piece('knight', 'white') }),
    ]

    render(<CapturedPiecesBottom moveHistory={history} orientation="whiteBottom" />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveClass('captured-bar__piece--white')
    expect(items[0]).toHaveAttribute('aria-label', 'white knight')
    expect(items[1]).toHaveAttribute('aria-label', 'white rook')
  })
})

describe('CapturedPieces (advantage badge + orientation swap)', () => {
  it('No advantage badge when captured values are equal (queen each = 9 vs 9)', () => {
    const history: Move[] = [
      buildMove({ piece: piece('queen', 'white'), captured: piece('queen', 'black') }),
      buildMove({ piece: piece('queen', 'black'), captured: piece('queen', 'white') }),
    ]

    const top = render(<CapturedPiecesTop moveHistory={history} orientation="whiteBottom" />)
    expect(top.container.querySelector('.captured-bar__advantage')).not.toBeInTheDocument()
    const bot = render(<CapturedPiecesBottom moveHistory={history} orientation="whiteBottom" />)
    expect(bot.container.querySelector('.captured-bar__advantage')).not.toBeInTheDocument()
  })

  it('White leads +12 (queen + knight vs 0): Top (by black) shows +12 badge', () => {
    const history: Move[] = [
      buildMove({ piece: piece('pawn', 'white'), captured: piece('queen', 'black') }),
      buildMove({ piece: piece('bishop', 'white'), captured: piece('knight', 'black') }),
    ]

    const { container } = render(<CapturedPiecesTop moveHistory={history} orientation="whiteBottom" />)
    const adv = container.querySelector('.captured-bar__advantage')
    expect(adv).toBeInTheDocument()
    expect(adv).toHaveTextContent('+12')
  })

  it('Black leads +2 (2x knight vs 1x bishop): Bottom (by white) shows +2 badge', () => {
    // capturedByWhite = [knight=3], capturedByBlack = [rook=5]
    // diff = 3 - 5 = -2. Bottom color='white' → advantage = -diff = 2.
    const history: Move[] = [
      buildMove({ piece: piece('knight', 'white'), captured: piece('knight', 'black') }),
      buildMove({ piece: piece('rook', 'black'), captured: piece('rook', 'white') }),
    ]

    const { container } = render(<CapturedPiecesBottom moveHistory={history} orientation="whiteBottom" />)
    const adv = container.querySelector('.captured-bar__advantage')
    expect(adv).toBeInTheDocument()
    // diff = 3 - 5 = -2. Bottom color='white' → advantage = -diff = 2.
    expect(adv).toHaveTextContent('+2')
  })

  it('Orientation blackBottom swaps Top and Bottom captures', () => {
    const history: Move[] = [
      buildMove({ piece: piece('pawn', 'white'), captured: piece('rook', 'black') }),
    ]
    // capturedByWhite = [rook=5], capturedByBlack = []
    // diff = 5 - 0 = 5.
    // Top blackBottom: color=white, captures=capturedByBlack=[].
    const top = render(<CapturedPiecesTop moveHistory={history} orientation="blackBottom" />)
    expect(top.container.querySelector('.captured-bar__empty')).toBeInTheDocument()

    // Bottom blackBottom: color=black, captures=capturedByWhite=[rook].
    // advantage = color==='black' ? diff : -diff → diff=5 → +5
    const { container } = render(<CapturedPiecesBottom moveHistory={history} orientation="blackBottom" />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveAttribute('aria-label', 'black rook')
    expect(container.querySelector('.captured-bar__advantage')!).toHaveTextContent('+5')
  })
})
