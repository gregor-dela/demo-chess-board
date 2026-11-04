import { describe, test, expect } from 'vitest'
import {
  applyMoveToState,
  undoMoveInState,
  redoMoveInState,
  createMoveFromState,
} from '../moveStateHelpers'
import type { GameState, PieceType, Square } from '../../types/chess'
import { createEmptyBoard, setPiece, baseGameState, getPiece } from '../../test/chessTestUtils'
import { generatePositionKey } from '../../utils/chessUtils'

// Apply a move described only by coordinates (mirrors the reducer public path).
const play = (state: GameState, from: Square, to: Square, promotion?: PieceType): GameState => {
  const move = createMoveFromState(state, from, to, promotion)
  if (!move) throw new Error(`No move record for ${from}-${to}`)
  return applyMoveToState(state, move)
}

const keyOf = (state: GameState): string =>
  generatePositionKey(state.board, state.currentPlayer, state.castlingRights, state.enPassantTarget)

const pawnBoard = (): GameState => {
  const board = createEmptyBoard()
  setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
  setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
  setPiece(board, 'e2', { type: 'pawn', color: 'white', hasMoved: false })
  setPiece(board, 'e7', { type: 'pawn', color: 'black', hasMoved: false })
  setPiece(board, 'g8', { type: 'knight', color: 'black', hasMoved: false })
  return baseGameState({ board })
}

describe('createMoveFromState', () => {
  test('returns null when the source square is empty', () => {
    expect(createMoveFromState(pawnBoard(), 'e4', 'e5')).toBeNull()
  })

  test('captures the pre-move state needed for undo', () => {
    const state = pawnBoard()
    const move = createMoveFromState(state, 'e2', 'e4')
    expect(move).not.toBeNull()
    expect(move!.from).toBe('e2')
    expect(move!.to).toBe('e4')
    expect(move!.piece.type).toBe('pawn')
    expect(move!.prevHasMoved).toBe(false)
    expect(move!.prevCastlingRights).toEqual(state.castlingRights)
    expect(move!.prevEnPassantTarget).toBeNull()
    expect(move!.captured).toBeUndefined()
  })

  test('resolves the captured pawn for an en passant move', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
    setPiece(board, 'e5', { type: 'pawn', color: 'white', hasMoved: true })
    setPiece(board, 'd5', { type: 'pawn', color: 'black', hasMoved: true })
    const state = baseGameState({ board, enPassantTarget: 'd6' })

    const move = createMoveFromState(state, 'e5', 'd6')
    expect(move!.isEnPassant).toBe(true)
    expect(move!.enPassantCaptureSquare).toBe('d5')
    expect(move!.captured?.color).toBe('black')
  })
})

describe('applyMoveToState', () => {
  test('moves the piece, toggles the player, records SAN and clears redo history', () => {
    const state = pawnBoard()
    const after = play(state, 'e2', 'e4')

    expect(getPiece(after.board, 'e4')?.type).toBe('pawn')
    expect(getPiece(after.board, 'e4')?.hasMoved).toBe(true)
    expect(getPiece(after.board, 'e2')).toBeNull()
    expect(after.currentPlayer).toBe('black')
    expect(after.enPassantTarget).toBe('e3')
    expect(after.halfMoveClock).toBe(0)
    expect(after.moveHistory).toHaveLength(1)
    expect(after.moveHistory[0].notation).toBe('e4')
    expect(after.redoHistory).toHaveLength(0)
  })

  test('captures an enemy piece', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
    setPiece(board, 'e4', { type: 'pawn', color: 'white', hasMoved: true })
    setPiece(board, 'd5', { type: 'pawn', color: 'black', hasMoved: true })
    const state = baseGameState({ board })

    const after = play(state, 'e4', 'd5')
    expect(getPiece(after.board, 'd5')?.color).toBe('white')
    expect(after.moveHistory[0].captured?.color).toBe('black')
    expect(after.halfMoveClock).toBe(0)
  })

  test('applies en passant by removing the pawn behind the target square', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
    setPiece(board, 'e5', { type: 'pawn', color: 'white', hasMoved: true })
    setPiece(board, 'd5', { type: 'pawn', color: 'black', hasMoved: true })
    const state = baseGameState({ board, enPassantTarget: 'd6' })

    const after = play(state, 'e5', 'd6')
    expect(getPiece(after.board, 'd6')?.color).toBe('white')
    expect(getPiece(after.board, 'd5')).toBeNull()
    expect(getPiece(after.board, 'e5')).toBeNull()
    expect(after.enPassantTarget).toBeNull()
  })

  test('applies castling with the rook move and updated rights', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'h1', { type: 'rook', color: 'white', hasMoved: false })
    setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
    const state = baseGameState({ board })

    const after = play(state, 'e1', 'g1')
    expect(getPiece(after.board, 'g1')?.type).toBe('king')
    expect(getPiece(after.board, 'f1')?.type).toBe('rook')
    expect(getPiece(after.board, 'h1')).toBeNull()
    expect(after.castlingRights.white.kingSide).toBe(false)
    expect(after.castlingRights.white.queenSide).toBe(false)
    expect(after.moveHistory[0].notation).toBe('O-O')
  })

  test('applies promotion by replacing the piece type and resetting the clock', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'h6', { type: 'king', color: 'black', hasMoved: false })
    setPiece(board, 'a7', { type: 'pawn', color: 'white', hasMoved: true })
    const state = baseGameState({ board, halfMoveClock: 20 })

    const after = play(state, 'a7', 'a8', 'queen')
    expect(getPiece(after.board, 'a8')?.type).toBe('queen')
    expect(getPiece(after.board, 'a8')?.color).toBe('white')
    expect(getPiece(after.board, 'a7')).toBeNull()
    expect(after.halfMoveClock).toBe(0)
    expect(after.moveHistory[0].notation).toBe('a8=Q')
  })
})

describe('undoMoveInState', () => {
  test('restores the board, hasMoved, clock and position counts', () => {
    const state = pawnBoard()
    const after = play(state, 'e2', 'e4')
    const back = undoMoveInState(after, after.moveHistory[after.moveHistory.length - 1])

    expect(keyOf(back)).toBe(keyOf(state))
    expect(getPiece(back.board, 'e2')?.hasMoved).toBe(false)
    expect(getPiece(back.board, 'e4')).toBeNull()
    expect(back.currentPlayer).toBe('white')
    expect(back.enPassantTarget).toBeNull()
    expect(back.halfMoveClock).toBe(0)
    expect(back.moveHistory).toHaveLength(0)
    expect(back.redoHistory).toHaveLength(1)
  })

  test('restores a captured piece', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
    setPiece(board, 'e4', { type: 'pawn', color: 'white', hasMoved: true })
    setPiece(board, 'd5', { type: 'pawn', color: 'black', hasMoved: true })
    const state = baseGameState({ board })

    const after = play(state, 'e4', 'd5')
    const back = undoMoveInState(after, after.moveHistory[after.moveHistory.length - 1])
    expect(getPiece(back.board, 'd5')?.color).toBe('black')
    expect(getPiece(back.board, 'e4')?.color).toBe('white')
  })

  test('restores castling rights and both king and rook hasMoved on castling undo', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'h1', { type: 'rook', color: 'white', hasMoved: false })
    setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
    const state = baseGameState({ board })

    const after = play(state, 'e1', 'g1')
    const back = undoMoveInState(after, after.moveHistory[after.moveHistory.length - 1])
    expect(getPiece(back.board, 'e1')?.type).toBe('king')
    expect(getPiece(back.board, 'e1')?.hasMoved).toBe(false)
    expect(getPiece(back.board, 'h1')?.type).toBe('rook')
    expect(getPiece(back.board, 'h1')?.hasMoved).toBe(false)
    expect(back.castlingRights.white.kingSide).toBe(true)
    expect(back.castlingRights.white.queenSide).toBe(true)
  })

  test('restores an en passant capture to the pawn behind the target', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
    setPiece(board, 'e5', { type: 'pawn', color: 'white', hasMoved: true })
    setPiece(board, 'd5', { type: 'pawn', color: 'black', hasMoved: true })
    const state = baseGameState({ board, enPassantTarget: 'd6' })

    const after = play(state, 'e5', 'd6')
    const back = undoMoveInState(after, after.moveHistory[after.moveHistory.length - 1])
    expect(getPiece(back.board, 'd5')?.color).toBe('black')
    expect(getPiece(back.board, 'e5')?.color).toBe('white')
    expect(getPiece(back.board, 'd6')).toBeNull()
    expect(back.enPassantTarget).toBe('d6')
  })
})

describe('redoMoveInState', () => {
  test('re-applies the move and pops the redo stack', () => {
    const state = pawnBoard()
    const after = play(state, 'e2', 'e4')
    const back = undoMoveInState(after, after.moveHistory[after.moveHistory.length - 1])
    expect(back.redoHistory).toHaveLength(1)

    const redone = redoMoveInState(back, back.redoHistory[back.redoHistory.length - 1])
    expect(getPiece(redone.board, 'e4')?.color).toBe('white')
    expect(getPiece(redone.board, 'e2')).toBeNull()
    expect(redone.currentPlayer).toBe('black')
    expect(redone.enPassantTarget).toBe('e3')
    expect(redone.moveHistory).toHaveLength(1)
    expect(redone.redoHistory).toHaveLength(0)
    expect(keyOf(redone)).toBe(keyOf(after))
  })

  test('re-applies a promotion', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
    setPiece(board, 'h6', { type: 'king', color: 'black', hasMoved: false })
    setPiece(board, 'a7', { type: 'pawn', color: 'white', hasMoved: true })
    const state = baseGameState({ board })

    const after = play(state, 'a7', 'a8', 'queen')
    const back = undoMoveInState(after, after.moveHistory[after.moveHistory.length - 1])
    expect(getPiece(back.board, 'a7')?.type).toBe('pawn')

    const redone = redoMoveInState(back, back.redoHistory[back.redoHistory.length - 1])
    expect(getPiece(redone.board, 'a8')?.type).toBe('queen')
    expect(keyOf(redone)).toBe(keyOf(after))
  })
})
