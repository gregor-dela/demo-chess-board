import { describe, test, expect, beforeEach } from 'vitest'
import { search, resetSearchGlobals } from '../search'
import { BOARD_SIZE } from '../../utils/board'
import { evaluate } from '../evaluation'
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

const KQK = (wk: Square, q: Square, bk: Square): Board => {
  const b = emptyBoard()
  setAt(b, wk, { type: 'king', color: 'white', hasMoved: true })
  setAt(b, q, { type: 'queen', color: 'white', hasMoved: true })
  setAt(b, bk, { type: 'king', color: 'black', hasMoved: true })
  return b
}

const KRK = (wk: Square, r: Square, bk: Square): Board => {
  const b = emptyBoard()
  setAt(b, wk, { type: 'king', color: 'white', hasMoved: true })
  setAt(b, r, { type: 'rook', color: 'white', hasMoved: true })
  setAt(b, bk, { type: 'king', color: 'black', hasMoved: true })
  return b
}

const KBK = (wk: Square, bsh: Square, bk: Square): Board => {
  const b = emptyBoard()
  setAt(b, wk, { type: 'king', color: 'white', hasMoved: true })
  setAt(b, bsh, { type: 'bishop', color: 'white', hasMoved: true })
  setAt(b, bk, { type: 'king', color: 'black', hasMoved: true })
  return b
}

describe('[CS-015] search(): alpha-beta z +/-Infinity oknom vrne končno oceno (regresija null-move bug)', () => {
  test.each([3, 4, 5])('depth %i: score je končno število in poteza je definirana', (depth) => {
    const board = KQK('e1', 'd1', 'e5')
    const res = search(board, 'white', NO_RIGHTS, null, depth, -Infinity, Infinity, new Map(), 0, 0)
    expect(Number.isFinite(res.score)).toBe(true)
    expect(res.move).toBeDefined()
  })

  test('vyhodna ocena pri globini >= 3 ni Infinity (po odpravi napake)', () => {
    const board = KQK('e1', 'd1', 'e5')
    const res = search(board, 'white', NO_RIGHTS, null, 3, -Infinity, Infinity, new Map(), 0, 0)
    expect(res.score).not.toBe(Infinity)
    expect(res.score).not.toBe(-Infinity)
  })
})

describe('[CS-009] KQ vs K: evaluacijske hevristike (mat pred 50-move draw)', () => {
  test('materialna ocena: K+Q vs K je bistveno pozitivna za strong stran (>700cp)', () => {
    expect(evaluate(KQK('e1', 'd1', 'e5'), 'white')).toBeGreaterThan(700)
  })

  test('strong kralj blizu weak kralja (mat approach) da višjo oceno kot oddaljen', () => {
    // weak king and queen fiksirana; premakne se samo strong king
    const close = evaluate(KQK('e3', 'h8', 'd5'), 'white')
    const far = evaluate(KQK('a1', 'h8', 'd5'), 'white')
    expect(close).toBeGreaterThan(far)
  })

  test('simetrija: evaluate(bela) === -evaluate(črna) pri clock=0', () => {
    const board = KQK('e1', 'd1', 'e5')
    expect(evaluate(board, 'white', 0)).toBe(-evaluate(board, 'black', 0))
  })
})

describe('[CS-009] KR vs K: evaluacijske hevristike', () => {
  test('materialna ocena: K+R vs K je pozitivna za strong stran (>400cp)', () => {
    expect(evaluate(KRK('e1', 'h1', 'e5'), 'white')).toBeGreaterThan(400)
  })

  test('strong kralj blizu weak kralja da višjo oceno kot oddaljen', () => {
    const close = evaluate(KRK('e3', 'a8', 'd5'), 'white')
    const far = evaluate(KRK('a1', 'a8', 'd5'), 'white')
    expect(close).toBeGreaterThan(far)
  })
})

describe('[CS-010] regresija: evaluacija se ne zacikli, ko je slabi kralj sosed major figure', () => {
  test('KR vs K: weak kralj na sosednjem polju do trdnjave vrne končno oceno', () => {
    // črn kralj e6 je v šahu od trdnjave e5 (sosednje polje) — nekoč neskončna zanka v forcedMateEndgameHeuristic
    const board = KRK('a1', 'e5', 'e6')
    const score = evaluate(board, 'black', 0)
    expect(Number.isFinite(score)).toBe(true)
  })

  test('KR vs K: weak kralj sosed major figure v vseh smereh vrne končno oceno', () => {
    for (const sq of ['d5', 'e5', 'f5', 'd6', 'f6', 'd7', 'e7', 'f7'] as const) {
      expect(Number.isFinite(evaluate(KRK('a1', 'e6', sq), 'black', 0))).toBe(true)
    }
  })
})

describe('[CS-005] halfMoveClock: stagnacijski tlak v endgamu', () => {
  test('KQ vs K: visok halfMoveClock zniža oceno, ko je strong stran na potezi', () => {
    const board = KQK('e1', 'd1', 'e5')
    const low = evaluate(board, 'white', 0)
    const high = evaluate(board, 'white', 60)
    expect(high).toBeLessThan(low)
  })

  test('KQ vs K: visok halfMoveClock NE zniža ocene, ko je weak stran na potezi', () => {
    const board = KQK('e1', 'd1', 'e5')
    expect(evaluate(board, 'black', 60)).toBe(evaluate(board, 'black', 0))
  })

  test('stagnacijski penal je omejen (cap), ne divergira pri zelo visokem clocku', () => {
    const board = KQK('e1', 'd1', 'e5')
    expect(evaluate(board, 'white', 1000)).toBe(evaluate(board, 'white', 60))
  })

  test('KB vs K nima mate hevristike -> clock ne vpliva na oceno', () => {
    const board = KBK('e1', 'd1', 'e5')
    expect(evaluate(board, 'white', 60)).toBe(evaluate(board, 'white', 0))
  })
})
