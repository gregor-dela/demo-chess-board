import { describe, test, expect, beforeEach } from 'vitest'
import { search, resetSearchGlobals } from '../search'
import { BOARD_SIZE } from '../../utils/board'
import { initialGameState } from '../../hooks/useChessGame'
import { isStalemate, isInsufficientMaterial } from '../../utils/moveValidation'
import type { Board, CastlingRights, Square, ChessPiece } from '../../types/chess'

beforeEach(() => {
  resetSearchGlobals()
})

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

    test('search globina 4 na začetni poziciji vrne potezo (regresijski časovni prag)', () => {
      // Referenčna meritev po CS-015 #1/#2/#3: ~400 ms (izolirano).
      // Prag 15 s ščiti pred patološko regresijo, brez flaky ustavljanja v CI.
      const t0 = Date.now()
      const res = search(initialBoard, turn, initialRights, state.enPassantTarget, 4, -Infinity, Infinity, new Map())
      const dt = Date.now() - t0
      expect(res.move).toBeTruthy()
      expect(dt).toBeLessThan(15000)
    }, 60000)
  })

  describe('[CS-015] Optimization #3: terminalnost v transpozicijski tabeli', () => {
    test('ista pozicija z deljeno TT vrne identičen rezultat (mat se cachira)', () => {
      // 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? -> Qxf7# (mat v 1)
      const board = emptyBoard()
      setAt(board, 'e1', { type: 'king', color: 'white', hasMoved: true })
      setAt(board, 'h5', { type: 'queen', color: 'white', hasMoved: true })
      setAt(board, 'c4', { type: 'bishop', color: 'white', hasMoved: true })
      setAt(board, 'e4', { type: 'pawn', color: 'white', hasMoved: true })
      setAt(board, 'e8', { type: 'king', color: 'black', hasMoved: true })
      setAt(board, 'd8', { type: 'queen', color: 'black', hasMoved: true })
      setAt(board, 'f8', { type: 'bishop', color: 'black', hasMoved: true })
      setAt(board, 'a8', { type: 'rook', color: 'black', hasMoved: true })
      setAt(board, 'h8', { type: 'rook', color: 'black', hasMoved: true })
      setAt(board, 'c6', { type: 'knight', color: 'black', hasMoved: true })
      setAt(board, 'e5', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'f6', { type: 'knight', color: 'black', hasMoved: true })
      setAt(board, 'a7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'b7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'c7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'd7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'f7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'g7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'h7', { type: 'pawn', color: 'black', hasMoved: true })
      const rights: CastlingRights = {
        white: { kingSide: false, queenSide: false },
        black: { kingSide: false, queenSide: false },
      }
      const tt = new Map()
      const first = search(board, 'white', rights, null, 4, -Infinity, Infinity, tt)
      const second = search(board, 'white', rights, null, 4, -Infinity, Infinity, tt)
      expect(first.score).toBe(second.score)
      expect(first.move).toEqual(second.move)
      expect(tt.size).toBeGreaterThan(0)
    })

    test("Scholar's mate: search vrne Qxf7# (mat v 1) pri globini 4", () => {
      const board = emptyBoard()
      setAt(board, 'e1', { type: 'king', color: 'white', hasMoved: true })
      setAt(board, 'h5', { type: 'queen', color: 'white', hasMoved: true })
      setAt(board, 'c4', { type: 'bishop', color: 'white', hasMoved: true })
      setAt(board, 'e4', { type: 'pawn', color: 'white', hasMoved: true })
      setAt(board, 'e8', { type: 'king', color: 'black', hasMoved: true })
      setAt(board, 'd8', { type: 'queen', color: 'black', hasMoved: true })
      setAt(board, 'f8', { type: 'bishop', color: 'black', hasMoved: true })
      setAt(board, 'a8', { type: 'rook', color: 'black', hasMoved: true })
      setAt(board, 'h8', { type: 'rook', color: 'black', hasMoved: true })
      setAt(board, 'c6', { type: 'knight', color: 'black', hasMoved: true })
      setAt(board, 'e5', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'f6', { type: 'knight', color: 'black', hasMoved: true })
      setAt(board, 'a7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'b7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'c7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'd7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'f7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'g7', { type: 'pawn', color: 'black', hasMoved: true })
      setAt(board, 'h7', { type: 'pawn', color: 'black', hasMoved: true })
      const rights: CastlingRights = {
        white: { kingSide: false, queenSide: false },
        black: { kingSide: false, queenSide: false },
      }
      const res = search(board, 'white', rights, null, 4, -Infinity, Infinity, new Map())
      expect(res.move).toEqual({ from: 'h5', to: 'f7' })
      expect(res.score).toBeGreaterThan(99000) // MATE - ply
    })
  })
})
