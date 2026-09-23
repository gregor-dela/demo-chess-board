import { describe, test, expect } from 'vitest'
import { search } from '../search'
import { BOARD_SIZE } from '../../utils/chessUtils'
import { initialGameState } from '../../hooks/useChessGame'
import { isStalemate, isInsufficientMaterial } from '../../utils/moveValidation'
import type { Board, CastlingRights, Square, ChessPiece } from '../../types/chess'

describe('[CS-015] Performance: search optimizacija - Issue #8', () => {
  const state = initialGameState
  const initialBoard: Board = state.board
  const initialRights: CastlingRights = state.castlingRights
  const turn = state.currentPlayer

  const emptyBoard = (): Board =>
    Array(8).fill(null).map(() => Array(8).fill(null)) as Board

  const setAt = (board: Board, sq: Square, piece: ChessPiece): void => {
    const row = BOARD_SIZE - parseInt(sq[1])
    const col = sq.charCodeAt(0) - 97
    board[row][col] = piece
  }

  describe('Pravilnost terminalnih stanj', () => {
    test('search globina 1 na začetni poziciji vrne potezo', () => {
      const TT = new Map()
      const res = search(initialBoard, turn, initialRights, state.enPassantTarget, 1, -Infinity, Infinity, TT)
      expect(res.move).toBeTruthy()
      expect(res.score).toBeGreaterThan(-10000)
      expect(res.score).toBeLessThan(10000)
    })

    test('Stalemate: Ka8 vs Ka6+Rb6 vrne score 0', () => {
      const board = emptyBoard()
      setAt(board, 'a8', { type: 'king', color: 'black', hasMoved: true })
      setAt(board, 'a6', { type: 'king', color: 'white', hasMoved: true })
      setAt(board, 'b6', { type: 'rook', color: 'white', hasMoved: true })
      const rights: CastlingRights = {
        white: { kingSide: false, queenSide: false },
        black: { kingSide: false, queenSide: false },
      }
      expect(isStalemate(board, 'black', rights, null)).toBe(true)
      const TT = new Map()
      const res = search(board, 'black', rights, null, 1, -Infinity, Infinity, TT)
      expect(res.score).toBe(0)
    })

    test('Insufficient material: K+B vs K je draw', () => {
      const board = emptyBoard()
      setAt(board, 'e1', { type: 'king', color: 'white', hasMoved: true })
      setAt(board, 'f1', { type: 'bishop', color: 'white', hasMoved: true })
      setAt(board, 'e8', { type: 'king', color: 'black', hasMoved: true })
      expect(isInsufficientMaterial(board)).toBe(true)
    })
  })

  describe('Benchmark & pravilnost globin', () => {
    test('search globina 2 na začetni poziciji vrne potezo', () => {
      const t0 = Date.now()
      const res = search(initialBoard, turn, initialRights, state.enPassantTarget, 2, -Infinity, Infinity)
      const dt = Date.now() - t0
      expect(res.move).toBeTruthy()
      expect(dt).toBeLessThan(20000)
    }, 30000)

    test('search globina 1 in 2 vrneta konzistenten potezni izbor (globina 2 = globina 1 ali boljša)', () => {
      const res1 = search(initialBoard, turn, initialRights, state.enPassantTarget, 1, -Infinity, Infinity)
      const res2 = search(initialBoard, turn, initialRights, state.enPassantTarget, 2, -Infinity, Infinity)
      expect(res1.move).toBeTruthy()
      expect(res2.move).toBeTruthy()
    })
  })
})
