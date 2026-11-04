import { describe, it, expect } from 'vitest'
import {
  createInitialCastlingRights,
  updateCastlingRightsForMove,
  isKingMove,
  isRookMove,
  applyEngineMove,
  cloneBoard,
  buildMoveRecord,
} from '../chessUtils'
import { createInitialBoard } from '../chessUtils'
import { createEmptyBoard, setPiece } from '../../test/chessTestUtils'

const makePiece = (type: 'king'|'queen'|'rook'|'bishop'|'knight'|'pawn', color: 'white'|'black', hasMoved = false) => ({ type, color, hasMoved })

describe('chessUtils - castling rights', () => {
  it('createInitialCastlingRights returns all true', () => {
    const rights = createInitialCastlingRights()
    expect(rights.white.kingSide).toBe(true)
    expect(rights.white.queenSide).toBe(true)
    expect(rights.black.kingSide).toBe(true)
    expect(rights.black.queenSide).toBe(true)
  })

  it('isKingMove and isRookMove helpers work', () => {
    expect(isKingMove(makePiece('king','white'))).toBe(true)
    expect(isKingMove(makePiece('queen','white'))).toBe(false)
    expect(isRookMove(makePiece('rook','black'))).toBe(true)
    expect(isRookMove(makePiece('bishop','black'))).toBe(false)
  })

  it('king move disables both castling sides for that color', () => {
    const rights = createInitialCastlingRights()
    const piece = makePiece('king', 'white')
    const next = updateCastlingRightsForMove(rights, piece, 'e1', 'e2')
    expect(next.white.kingSide).toBe(false)
    expect(next.white.queenSide).toBe(false)
    // Black unchanged
    expect(next.black.kingSide).toBe(true)
    expect(next.black.queenSide).toBe(true)
  })

  it('rook move from a1 disables white queen-side; from h1 disables king-side', () => {
    const rights = createInitialCastlingRights()
    const rook = makePiece('rook', 'white')
    const qSide = updateCastlingRightsForMove(rights, rook, 'a1', 'a2')
    expect(qSide.white.queenSide).toBe(false)
    expect(qSide.white.kingSide).toBe(true)

    const kSide = updateCastlingRightsForMove(rights, rook, 'h1', 'h2')
    expect(kSide.white.kingSide).toBe(false)
    expect(kSide.white.queenSide).toBe(true)
  })

  it('rook move from a8/h8 disables black sides appropriately', () => {
    const rights = createInitialCastlingRights()
    const rook = makePiece('rook', 'black')
    const qSide = updateCastlingRightsForMove(rights, rook, 'a8', 'a7')
    expect(qSide.black.queenSide).toBe(false)
    const kSide = updateCastlingRightsForMove(rights, rook, 'h8', 'h7')
    expect(kSide.black.kingSide).toBe(false)
  })

  it('capturing a rook on corner squares disables correct castling side', () => {
    const rights = createInitialCastlingRights()
    const whiteQueen = makePiece('queen', 'white')

    // Capture black rook on a8
    let next = updateCastlingRightsForMove(rights, whiteQueen, 'e4', 'a8', makePiece('rook','black'))
    expect(next.black.queenSide).toBe(false)

    // Capture black rook on h8
    next = updateCastlingRightsForMove(rights, whiteQueen, 'e4', 'h8', makePiece('rook','black'))
    expect(next.black.kingSide).toBe(false)

    // Capture white rook on a1
    next = updateCastlingRightsForMove(rights, whiteQueen, 'e4', 'a1', makePiece('rook','white'))
    expect(next.white.queenSide).toBe(false)

    // Capture white rook on h1
    next = updateCastlingRightsForMove(rights, whiteQueen, 'e4', 'h1', makePiece('rook','white'))
    expect(next.white.kingSide).toBe(false)
  })
})

describe('chessUtils - applyEngineMove unified helper', () => {
  it('returns null if source square is empty', () => {
    const board = createEmptyBoard()
    const rights = createInitialCastlingRights()
    const res = applyEngineMove(board, 'e2', 'e4', rights, null)
    expect(res).toBeNull()
  })

  it('applies a simple pawn move correctly', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e2', { type: 'pawn', color: 'white', hasMoved: false })
    const rights = createInitialCastlingRights()
    const res = applyEngineMove(board, 'e2', 'e4', rights, null)
    expect(res).not.toBeNull()
    expect(res!.board[6][4]).toBeNull()
    expect(res!.board[4][4]?.type).toBe('pawn')
    expect(res!.board[4][4]?.hasMoved).toBe(true)
    expect(res!.nextEnPassant).toBe('e3')
    expect(res!.captured).toBeNull()
  })

  it('handles castling: white king side moves king+rook+flags', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'h1', { type: 'rook', color: 'white', hasMoved: false })
    const rights = createInitialCastlingRights()
    const res = applyEngineMove(board, 'e1', 'g1', rights, null)
    expect(res).not.toBeNull()
    expect(res!.isCastling).toBe(true)
    expect(res!.board[7][6]?.type).toBe('king')
    expect(res!.board[7][5]?.type).toBe('rook')
    expect(res!.board[7][4]).toBeNull()
    expect(res!.board[7][7]).toBeNull()
    expect(res!.nextRights.white.kingSide).toBe(false)
    expect(res!.nextRights.white.queenSide).toBe(false)
  })

  it('handles en passant capture: removes captured pawn from correct square', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e5', { type: 'pawn', color: 'white', hasMoved: true })
    setPiece(board, 'd5', { type: 'pawn', color: 'black', hasMoved: true })
    const rights = createInitialCastlingRights()
    const res = applyEngineMove(board, 'e5', 'd6', rights, 'd6')
    expect(res).not.toBeNull()
    expect(res!.isEnPassant).toBe(true)
    expect(res!.captured?.type).toBe('pawn')
    expect(res!.captured?.color).toBe('black')
    expect(res!.board[4][3]).toBeNull()
    expect(res!.board[2][3]?.type).toBe('pawn')
    expect(res!.board[2][3]?.color).toBe('white')
  })

  it('applies promotion when applyPromotion=true; leaves as pawn when applyPromotion=false', () => {
    const board = createEmptyBoard()
    setPiece(board, 'a7', { type: 'pawn', color: 'white', hasMoved: true })
    const rights = createInitialCastlingRights()

    const noPromo = applyEngineMove(board, 'a7', 'a8', rights, null)
    expect(noPromo).not.toBeNull()
    expect(noPromo!.board[0][0]?.type).toBe('pawn')
    expect(noPromo!.promotedTo).toBe('queen')

    const withPromo = applyEngineMove(board, 'a7', 'a8', rights, null, { applyPromotion: true, promotionPiece: 'knight' })
    expect(withPromo).not.toBeNull()
    expect(withPromo!.board[0][0]?.type).toBe('knight')
    expect(withPromo!.promotedTo).toBe('knight')
  })
})

describe('chessUtils - buildMoveRecord timestamp determinism', () => {
  it('uses provided timestamp when passed (determinism support)', () => {
    const fixed = new Date('2025-01-01T00:00:00Z')
    const move = buildMoveRecord({
      from: 'e2',
      to: 'e4',
      piece: makePiece('pawn', 'white'),
      prevHasMoved: false,
      prevCastlingRights: createInitialCastlingRights(),
      prevEnPassantTarget: null,
      timestamp: fixed,
    })
    expect(move.timestamp.getTime()).toBe(fixed.getTime())
  })

  it('falls back to new Date() when no timestamp provided', () => {
    const before = Date.now()
    const move = buildMoveRecord({
      from: 'e2',
      to: 'e4',
      piece: makePiece('pawn', 'white'),
      prevHasMoved: false,
      prevCastlingRights: createInitialCastlingRights(),
      prevEnPassantTarget: null,
    })
    const after = Date.now()
    expect(move.timestamp.getTime()).toBeGreaterThanOrEqual(before - 10)
    expect(move.timestamp.getTime()).toBeLessThanOrEqual(after + 10)
  })
})

describe('chessUtils - cloneBoard helper', () => {
  it('produces independent deep-ish clone (rows and pieces distinct)', () => {
    const original = createInitialBoard()
    const clone = cloneBoard(original)
    expect(clone).not.toBe(original)
    expect(clone[0]).not.toBe(original[0])
    clone[6][4] = null
    expect(original[6][4]?.type).toBe('pawn')
  })
})

