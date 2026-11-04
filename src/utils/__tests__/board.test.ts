import { describe, it, expect } from 'vitest'
import {
  BOARD_SIZE,
  getSquareColor,
  getCoordinatesFromSquare,
  getSquareFromCoordinates,
  isValidSquare,
  isValidDragData,
  sanitizeSquareInput,
  getPieceAtSquare,
  isOpponentPiece,
  isOwnPiece,
  isEmptySquare,
  cloneBoard,
} from '../board'
import { createInitialBoard } from '../chessUtils'
import type { ChessPiece, Square } from '../../types/chess'

const ALL_SQUARES: Square[] = Array.from({ length: BOARD_SIZE }, (_, r) =>
  Array.from({ length: BOARD_SIZE }, (_, c) => getSquareFromCoordinates(r, c))
).flat()

const piece = (type: ChessPiece['type'], color: ChessPiece['color']): ChessPiece => ({ type, color, hasMoved: false })

describe('board - Square <-> coordinates', () => {
  it('round-trips every square through coordinates', () => {
    for (const square of ALL_SQUARES) {
      const [row, col] = getCoordinatesFromSquare(square)
      expect(getSquareFromCoordinates(row, col)).toBe(square)
    }
  })

  it('maps a1 to bottom-left and h8 to top-right', () => {
    expect(getCoordinatesFromSquare('a1')).toEqual([7, 0])
    expect(getCoordinatesFromSquare('h8')).toEqual([0, 7])
    expect(getSquareFromCoordinates(7, 0)).toBe('a1')
    expect(getSquareFromCoordinates(0, 7)).toBe('h8')
  })
})

describe('board - square validity', () => {
  it('accepts valid squares and rejects invalid input', () => {
    expect(isValidSquare('e4')).toBe(true)
    expect(isValidSquare('a1')).toBe(true)
    expect(isValidSquare('h8')).toBe(true)
    expect(isValidSquare('i9')).toBe(false)
    expect(isValidSquare('e0')).toBe(false)
    expect(isValidSquare('e')).toBe(false)
  })

  it('validates and sanitizes raw drag input', () => {
    expect(isValidDragData(' e4 ')).toBe(true)
    expect(isValidDragData('z9')).toBe(false)
    expect(isValidDragData(null)).toBe(false)
    expect(sanitizeSquareInput(' E4 ')).toBe('e4')
    expect(sanitizeSquareInput('bad')).toBeNull()
    expect(sanitizeSquareInput(undefined)).toBeNull()
  })
})

describe('board - square color', () => {
  it('marks a1 as dark and b1 as light', () => {
    expect(getSquareColor('a', 1)).toBe('dark')
    expect(getSquareColor('b', 1)).toBe('light')
    expect(getSquareColor('h', 8)).toBe('dark')
  })
})

describe('board - occupancy helpers', () => {
  it('reads pieces and classifies occupancy from the initial board', () => {
    const board = createInitialBoard()
    expect(getPieceAtSquare(board, 'e1')?.type).toBe('king')
    expect(getPieceAtSquare(board, 'e4')).toBeNull()
    expect(isOwnPiece(board, 'e2', 'white')).toBe(true)
    expect(isOpponentPiece(board, 'e7', 'white')).toBe(true)
    expect(isEmptySquare(board, 'e4')).toBe(true)
    expect(getPieceAtSquare(board, 'z9')).toBeNull()
  })
})

describe('board - cloneBoard', () => {
  it('copies rows and cells independently of the source', () => {
    const board = createInitialBoard()
    const copy = cloneBoard(board)
    expect(copy).not.toBe(board)
    expect(copy[0]).not.toBe(board[0])
    copy[0][0] = piece('queen', 'black')
    expect(board[0][0]?.type).toBe('rook')
  })
})
