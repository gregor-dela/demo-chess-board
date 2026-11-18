import { describe, it, expect } from 'vitest'
import { BOARD_SIZE, getCoordinatesFromSquare } from '../../utils/board'
import { formatPrincipalVariation, generateAlgebraicNotation } from '../../utils/notation'
import type { Board, CastlingRights, ChessPiece, Move, Square } from '../../types/chess'

const emptyBoard = (): Board => Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))

describe('generateAlgebraicNotation - promotion, en passant, castling, disambiguation, check', () => {
  it('generates default promotion to queen when no promotion piece specified', () => {
    const board = emptyBoard()
    const from = 'e7'
    const to = 'e8'
    const [fr, fc] = getCoordinatesFromSquare(from)
    const pawn: ChessPiece = { type: 'pawn', color: 'white', hasMoved: true }
    board[fr][fc] = pawn

    const move: Move = {
      piece: pawn,
      from,
      to,
      captured: undefined,
      prevHasMoved: false,
      prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      notation: '',
      timestamp: new Date()
    }
    const san = generateAlgebraicNotation(board, move, 'active')
    expect(san).toBe('e8=Q')
  })

  it('generates explicit promotion piece when provided', () => {
    const board = emptyBoard()
    const from = 'e7'
    const to = 'e8'
    const [fr, fc] = getCoordinatesFromSquare(from)
    const pawn: ChessPiece = { type: 'pawn', color: 'white', hasMoved: true }
    board[fr][fc] = pawn

    const move: Move = {
      piece: pawn,
      from,
      to,
      captured: undefined,
      prevHasMoved: false,
      prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      promotion: 'rook',
      notation: '',
      timestamp: new Date()
    }
    const san = generateAlgebraicNotation(board, move, 'active')
    expect(san).toBe('e8=R')
  })

  it('marks en passant captures with e.p.', () => {
    const board = emptyBoard()
    const from = 'e5'
    const to = 'd6'
    const [fr, fc] = getCoordinatesFromSquare(from)
    const pawn: ChessPiece = { type: 'pawn', color: 'white', hasMoved: true }
    board[fr][fc] = pawn

    const capturedPawn: ChessPiece = { type: 'pawn', color: 'black', hasMoved: true }
    const move: Move = {
      piece: pawn,
      from,
      to,
      captured: capturedPawn,
      prevHasMoved: false,
      prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      isEnPassant: true,
      enPassantCaptureSquare: 'd5',
      notation: '',
      timestamp: new Date()
    }
    const san = generateAlgebraicNotation(board, move, 'active')
    expect(san).toBe('exd6 e.p.')
  })
  it('formats king-side and queen-side castling as O-O and O-O-O', () => {
    const board = emptyBoard()
    const whiteKing: ChessPiece = { type: 'king', color: 'white', hasMoved: false }
    const blackKing: ChessPiece = { type: 'king', color: 'black', hasMoved: false }

    const moveK = (from: string, to: string, piece: ChessPiece, status?: 'active' | 'check' | 'checkmate') => {
      const move: Move = {
        piece,
        from,
        to,
        captured: undefined,
        prevHasMoved: false,
        prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
        notation: '',
        timestamp: new Date()
      }
      return generateAlgebraicNotation(board, move, status)
    }

    expect(moveK('e1','g1', whiteKing)).toBe('O-O')
    expect(moveK('e8','c8', blackKing, 'check')).toBe('O-O-O+')
  })

  it('adds disambiguation by file and by rank for identical pieces', () => {
    const board = emptyBoard()
    // Knights on b1 and d1, both can reach c3 -> file disambiguation expected: Nbc3 when moving from b1
    const knight1: ChessPiece = { type: 'knight', color: 'white', hasMoved: false }
    const knight2: ChessPiece = { type: 'knight', color: 'white', hasMoved: false }
    const [rB1, cB1] = getCoordinatesFromSquare('b1')
    const [rD1, cD1] = getCoordinatesFromSquare('d1')
    board[rB1][cB1] = knight1
    board[rD1][cD1] = knight2

    const move1: Move = {
      piece: knight1,
      from: 'b1',
      to: 'c3',
      captured: undefined,
      prevHasMoved: false,
      prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      notation: '',
      timestamp: new Date()
    }
    expect(generateAlgebraicNotation(board, move1, 'active')).toBe('Nbc3')

    // Rooks on a1 and a3 both can reach a2 -> rank disambiguation expected: R1a2 when moving from a1
    const board2 = emptyBoard()
    const rook1: ChessPiece = { type: 'rook', color: 'white', hasMoved: false }
    const rook2: ChessPiece = { type: 'rook', color: 'white', hasMoved: false }
    const [rA1, cA1] = getCoordinatesFromSquare('a1')
    const [rA3, cA3] = getCoordinatesFromSquare('a3')
    board2[rA1][cA1] = rook1
    board2[rA3][cA3] = rook2

    const move2: Move = {
      piece: rook1,
      from: 'a1',
      to: 'a2',
      captured: undefined,
      prevHasMoved: false,
      prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      notation: '',
      timestamp: new Date()
    }
    expect(generateAlgebraicNotation(board2, move2, 'active')).toBe('R1a2')
  })

  it('[CS-014] ne razločuje, če je edini kandidat pripet (pinned)', () => {
    const board = emptyBoard()
    // Beli lovec na b1 (se premika) in beli lovec na b3 (pripet po diagonali c4-b3-a2).
    const movingBishop: ChessPiece = { type: 'bishop', color: 'white', hasMoved: true }
    const pinnedBishop: ChessPiece = { type: 'bishop', color: 'white', hasMoved: true }
    const whiteKing: ChessPiece = { type: 'king', color: 'white', hasMoved: true }
    const blackBishop: ChessPiece = { type: 'bishop', color: 'black', hasMoved: true }

    const set = (square: string, p: ChessPiece) => {
      const [r, c] = getCoordinatesFromSquare(square)
      board[r][c] = p
    }
    set('b1', movingBishop)
    set('b3', pinnedBishop)
    set('a2', whiteKing)
    set('c4', blackBishop)

    const move: Move = {
      piece: movingBishop,
      from: 'b1',
      to: 'c2',
      captured: undefined,
      prevHasMoved: false,
      prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      notation: '',
      timestamp: new Date()
    }
    // Brez preverjanja legalnosti bi pripeti lovec na b3 silil v "B1c2".
    expect(generateAlgebraicNotation(board, move, 'active')).toBe('Bc2')
  })

  it('formats pawn capture and promotion with capture', () => {
    const board = emptyBoard()
    // Pawn capture: e2x d3 -> 'exd3'
    const pawn: ChessPiece = { type: 'pawn', color: 'white', hasMoved: true }
    const [rE2, cE2] = getCoordinatesFromSquare('e2')
    board[rE2][cE2] = pawn

    const captured: ChessPiece = { type: 'bishop', color: 'black', hasMoved: true }
    const moveCap: Move = {
      piece: pawn,
      from: 'e2',
      to: 'd3',
      captured,
      prevHasMoved: false,
      prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      notation: '',
      timestamp: new Date()
    }
    expect(generateAlgebraicNotation(board, moveCap, 'active')).toBe('exd3')

    // Promotion with capture: e7xd8=Q
    const board2 = emptyBoard()
    const pawn2: ChessPiece = { type: 'pawn', color: 'white', hasMoved: true }
    const [rE7, cE7] = getCoordinatesFromSquare('e7')
    board2[rE7][cE7] = pawn2

    const captured2: ChessPiece = { type: 'rook', color: 'black', hasMoved: true }
    const movePromo: Move = {
      piece: pawn2,
      from: 'e7',
      to: 'd8',
      captured: captured2,
      prevHasMoved: false,
      prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      promotion: 'queen',
      notation: '',
      timestamp: new Date()
    }
    expect(generateAlgebraicNotation(board2, movePromo, 'active')).toBe('exd8=Q')
  })

  it('appends + for check and # for checkmate', () => {
    const board = emptyBoard()
    const queen: ChessPiece = { type: 'queen', color: 'white', hasMoved: true }
    const [rD1, cD1] = getCoordinatesFromSquare('d1')
    board[rD1][cD1] = queen

    const move: Move = {
      piece: queen,
      from: 'd1',
      to: 'h5',
      captured: undefined,
      prevHasMoved: false,
      prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } },
      notation: '',
      timestamp: new Date()
    }
    expect(generateAlgebraicNotation(board, move, 'check')).toBe('Qh5+')
    expect(generateAlgebraicNotation(board, move, 'checkmate')).toBe('Qh5#')
  })
})

describe('formatPrincipalVariation', () => {
  const noRights: CastlingRights = {
    white: { kingSide: false, queenSide: false },
    black: { kingSide: false, queenSide: false },
  }

  const place = (board: Board, sq: string, piece: ChessPiece) => {
    const [r, c] = getCoordinatesFromSquare(sq)
    board[r][c] = piece
  }

  it('vrne prazen niz za prazno PV', () => {
    expect(formatPrincipalVariation([], emptyBoard(), 'white', noRights, null)).toBe('')
  })

  it('oštevilči poteze obeh strani od 1', () => {
    const board = emptyBoard()
    place(board, 'e2', { type: 'pawn', color: 'white', hasMoved: false })
    place(board, 'e7', { type: 'pawn', color: 'black', hasMoved: false })
    place(board, 'g1', { type: 'knight', color: 'white', hasMoved: false })
    place(board, 'b8', { type: 'knight', color: 'black', hasMoved: false })

    const pv: Array<{ from: Square; to: Square }> = [
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e5' },
      { from: 'g1', to: 'f3' },
      { from: 'b8', to: 'c6' },
    ]

    expect(formatPrincipalVariation(pv, board, 'white', noRights, null)).toBe('1. e4 e5 2. Nf3 Nc6')
  })

  it('označi začetek s črnim kot "1..."', () => {
    const board = emptyBoard()
    place(board, 'e7', { type: 'pawn', color: 'black', hasMoved: false })
    expect(formatPrincipalVariation([{ from: 'e7', to: 'e5' }], board, 'black', noRights, null)).toBe('1... e5')
  })

  it('uporabi podano začetno številko polpoteze', () => {
    const board = emptyBoard()
    place(board, 'e2', { type: 'pawn', color: 'white', hasMoved: false })
    expect(formatPrincipalVariation([{ from: 'e2', to: 'e4' }], board, 'white', noRights, null, 12)).toBe('12. e4')
  })

  it('prikaže zajem, rokado in promocijo', () => {
    const captureBoard = emptyBoard()
    place(captureBoard, 'e4', { type: 'pawn', color: 'white', hasMoved: true })
    place(captureBoard, 'd5', { type: 'pawn', color: 'black', hasMoved: true })
    expect(formatPrincipalVariation([{ from: 'e4', to: 'd5' }], captureBoard, 'white', noRights, null)).toBe('1. exd5')

    const castleBoard = emptyBoard()
    place(castleBoard, 'e1', { type: 'king', color: 'white', hasMoved: false })
    place(castleBoard, 'h1', { type: 'rook', color: 'white', hasMoved: false })
    const rights: CastlingRights = {
      white: { kingSide: true, queenSide: false },
      black: { kingSide: false, queenSide: false },
    }
    expect(formatPrincipalVariation([{ from: 'e1', to: 'g1' }], castleBoard, 'white', rights, null)).toBe('1. O-O')

    const promoBoard = emptyBoard()
    place(promoBoard, 'e7', { type: 'pawn', color: 'white', hasMoved: true })
    expect(formatPrincipalVariation([{ from: 'e7', to: 'e8' }], promoBoard, 'white', noRights, null)).toBe('1. e8=Q')
  })

  it('se ustavi ob prvi neveljavni potezi', () => {
    const board = emptyBoard()
    // Polje e4 je prazno -> prva poteza ni veljavna, rezultat je prazen.
    expect(formatPrincipalVariation([{ from: 'e4', to: 'e5' }], board, 'white', noRights, null)).toBe('')
  })
})
