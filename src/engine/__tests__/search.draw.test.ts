import { describe, test, expect, beforeEach } from 'vitest'
import { search, resetSearchGlobals } from '../search'
import type { RepetitionContext } from '../search'
import { applyEngineMove, generatePositionKey } from '../../utils/chessUtils'
import { BOARD_SIZE } from '../../utils/board'
import type { Board, Square, ChessPiece, CastlingRights } from '../../types/chess'

beforeEach(() => {
  resetSearchGlobals()
})

const NO_RIGHTS: CastlingRights = {
  white: { kingSide: false, queenSide: false },
  black: { kingSide: false, queenSide: false },
}

const emptyBoard = (): Board =>
  Array(8).fill(null).map(() => Array(8).fill(null)) as Board

const setAt = (board: Board, sq: Square, piece: ChessPiece): void => {
  const row = BOARD_SIZE - parseInt(sq[1])
  const col = sq.charCodeAt(0) - 97
  board[row][col] = piece
}

// Bela K + Q proti črnemu K — strong stran ima veliko prednost (brez remija)
const KQK = (wk: Square, q: Square, bk: Square): Board => {
  const b = emptyBoard()
  setAt(b, wk, { type: 'king', color: 'white', hasMoved: true })
  setAt(b, q, { type: 'queen', color: 'white', hasMoved: true })
  setAt(b, bk, { type: 'king', color: 'black', hasMoved: true })
  return b
}

// Bela K + R proti črnemu K
const KRK = (wk: Square, r: Square, bk: Square): Board => {
  const b = emptyBoard()
  setAt(b, wk, { type: 'king', color: 'white', hasMoved: true })
  setAt(b, r, { type: 'rook', color: 'white', hasMoved: true })
  setAt(b, bk, { type: 'king', color: 'black', hasMoved: true })
  return b
}

describe('[CS-010] 50-move pravilo v search()', () => {
  test('halfMoveClock >= 100 vrne remi (score 0), tudi na korenu', () => {
    const res = search(KQK('e1', 'd1', 'e5'), 'white', NO_RIGHTS, null, 3, -Infinity, Infinity, undefined, 0, 100)
    expect(res.score).toBe(0)
  })

  test('halfMoveClock >= 100 velja pri vsaki globini', () => {
    const res = search(KQK('e1', 'd1', 'e5'), 'white', NO_RIGHTS, null, 1, -Infinity, Infinity, undefined, 0, 150)
    expect(res.score).toBe(0)
  })

  test('halfMoveClock 0 ne sproži lažnega remija (dobljena pozicija ostane pozitivna)', () => {
    const res = search(KQK('e1', 'd1', 'e5'), 'white', NO_RIGHTS, null, 2, -Infinity, Infinity, undefined, 0, 0)
    expect(res.score).toBeGreaterThan(0)
  })

  test('propagacija: clock 99 vodi v clock 100 v otrocih -> vsi premiki so remi (score 0)', () => {
    // v KQ vs K beli nima kmetov niti zajemov, zato vsaka poteza dvigne clock na 100
    const res = search(KQK('e1', 'd1', 'e5'), 'white', NO_RIGHTS, null, 2, -Infinity, Infinity, undefined, 0, 99)
    expect(res.score).toBe(0)
  })
})

describe('[CS-010] trikratno ponavljanje v search()', () => {
  test('engine se izogne potezi, ki bi pripeljala do trikrat ponovljene pozicije', () => {
    const board = KRK('e1', 'a1', 'e8')
    const applied = applyEngineMove(board, 'a1', 'a2', NO_RIGHTS, null)
    expect(applied).not.toBeNull()
    const childKey = generatePositionKey(applied!.board, 'black', NO_RIGHTS, null)

    const repCtx: RepetitionContext = { history: { [childKey]: 2 }, path: new Map() }
    const res = search(board, 'white', NO_RIGHTS, null, 1, -Infinity, Infinity, undefined, 0, 0, repCtx)

    expect(res.move).toBeDefined()
    expect(res.move).not.toEqual({ from: 'a1', to: 'a2' })
    expect(res.score).toBeGreaterThan(0)
  })

  test('brez zastavljene zgodovine remi ni vsiljen (score ostane pozitiven)', () => {
    const board = KRK('e1', 'a1', 'e8')
    const empty: RepetitionContext = { history: {}, path: new Map() }
    const res = search(board, 'white', NO_RIGHTS, null, 2, -Infinity, Infinity, undefined, 0, 0, empty)
    expect(res.move).toBeDefined()
    expect(res.score).toBeGreaterThan(0)
  })

  test('koren ni prisiljen remi (ply 0 je izvzet iz preverjanja ponavljanja)', () => {
    const board = KRK('e1', 'a1', 'e8')
    const rootKey = generatePositionKey(board, 'white', NO_RIGHTS, null)
    const repCtx: RepetitionContext = { history: { [rootKey]: 2 }, path: new Map() }
    const res = search(board, 'white', NO_RIGHTS, null, 2, -Infinity, Infinity, undefined, 0, 0, repCtx)
    expect(res.move).toBeDefined()
  })
})
