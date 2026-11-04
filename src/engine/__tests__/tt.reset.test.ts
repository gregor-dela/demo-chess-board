import { describe, it, expect, beforeEach } from 'vitest'
import { resetTranspositionTable } from '../ai'
import { zobristHash } from '../zobrist'
import { createInitialBoard, createInitialCastlingRights } from '../../utils/chessUtils'

describe('Transposition table & zobrist', () => {
  beforeEach(() => {
    resetTranspositionTable()
  })

  it('resetTranspositionTable returns without throwing', () => {
    expect(() => resetTranspositionTable()).not.toThrow()
  })

  it('zobristHash returns stable bigint for initial position', () => {
    const board = createInitialBoard()
    const rights = createInitialCastlingRights()
    const h1 = zobristHash(board, 'white', rights, null)
    const h2 = zobristHash(board, 'white', rights, null)
    expect(typeof h1).toBe('bigint')
    expect(h1).toBe(h2)
  })

  it('zobristHash differs by player to move (side-to-move key included)', () => {
    const board = createInitialBoard()
    const rights = createInitialCastlingRights()
    const w = zobristHash(board, 'white', rights, null)
    const b = zobristHash(board, 'black', rights, null)
    expect(w).not.toBe(b)
  })

  it('zobristHash guards against missing piece type and throws informative error', () => {
    const board = createInitialBoard()
    // Simulate an invalid piece object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    board[0][0] = { hasMoved: true } as any
    const rights = createInitialCastlingRights()
    expect(() => zobristHash(board, 'white', rights, null)).toThrow(/Zobrist missing key/)
  })
})
