import { beforeEach, describe, test, expect } from 'vitest'
import { computeBestMove, resetTranspositionTable } from '../ai'
import { initialGameState } from '../../hooks/useChessGame'
import { applyEngineMove, generatePositionKey, BOARD_SIZE } from '../../utils/chessUtils'
import type { Board, Square, ChessPiece, CastlingRights, GameState } from '../../types/chess'

const NO_RIGHTS: CastlingRights = {
  white: { kingSide: false, queenSide: false },
  black: { kingSide: false, queenSide: false },
}

const emptyBoard = (): Board => Array(8).fill(null).map(() => Array(8).fill(null)) as Board

const setAt = (board: Board, sq: Square, piece: ChessPiece): void => {
  const row = BOARD_SIZE - parseInt(sq[1])
  const col = sq.charCodeAt(0) - 97
  board[row][col] = piece
}

const KQK = (wk: Square, q: Square, bk: Square): Board => {
  const b = emptyBoard()
  setAt(b, wk, { type: 'king', color: 'white', hasMoved: true })
  setAt(b, q, { type: 'queen', color: 'white', hasMoved: true })
  setAt(b, bk, { type: 'king', color: 'black', hasMoved: true })
  return b
}

const KPvK = (wk: Square, p: Square, bk: Square): Board => {
  const b = emptyBoard()
  setAt(b, wk, { type: 'king', color: 'white', hasMoved: true })
  setAt(b, p, { type: 'pawn', color: 'white', hasMoved: false })
  setAt(b, bk, { type: 'king', color: 'black', hasMoved: true })
  return b
}

const makeState = (over: Partial<GameState>): GameState => ({
  ...initialGameState,
  mode: 'pvai',
  gameStatus: 'active',
  isInCheck: false,
  castlingRights: NO_RIGHTS,
  enPassantTarget: null,
  moveHistory: [],
  redoHistory: [],
  halfMoveClock: 0,
  positionCounts: {},
  aiSettings: { aiPlays: 'white', depth: 2, moveTimeMs: 1000, autoAnalyze: false, style: 'balanced' },
  ...over,
})

beforeEach(() => {
  resetTranspositionTable()
})

describe('[CS-010] computeBestMove upošteva remi pravila', () => {
  test('AI se izogne potezi, ki bi ustvarila trikrat ponovljeno pozicijo', async () => {
    const board = KQK('e1', 'd1', 'e8')
    // ključ otroške pozicije po potezi Qd1-d2 (črn na potezi) je že viden dvakrat
    const applied = applyEngineMove(board, 'd1', 'd2', NO_RIGHTS, null)
    expect(applied).not.toBeNull()
    const childKey = generatePositionKey(applied!.board, 'black', NO_RIGHTS, null)

    const state = makeState({
      board,
      currentPlayer: 'white',
      positionCounts: { [childKey]: 2 },
    })

    const mv = await computeBestMove(state, 2, 1000)
    expect(mv).toBeTruthy()
    expect(mv).not.toEqual({ from: 'd1', to: 'd2' })
  })

  test('pri halfMoveClock 99 AI izbere potezo, ki resetira števec (kmeta), ne tihe poteze', async () => {
    // Bela je kmet gor; tihe poteze vodijo v clock 100 (remi, score 0),
    // poteza kmeta pa resetira clock in obdrži prednost.
    const board = KPvK('e1', 'e2', 'e8')
    const state = makeState({
      board,
      currentPlayer: 'white',
      halfMoveClock: 99,
    })

    const mv = await computeBestMove(state, 2, 1000)
    expect(mv).toBeTruthy()
    expect(mv!.from).toBe('e2')
  })

  test('pri halfMoveClock 100 engine vrne null (remi, brez izbrane poteze)', async () => {
    const board = KQK('e1', 'd1', 'e8')
    const state = makeState({
      board,
      currentPlayer: 'white',
      halfMoveClock: 100,
    })

    const mv = await computeBestMove(state, 2, 1000)
    expect(mv).toBeNull()
  })
})
