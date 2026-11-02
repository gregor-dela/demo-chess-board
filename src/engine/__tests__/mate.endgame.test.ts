import { describe, test, expect, beforeEach } from 'vitest'
import { search, resetSearchGlobals } from '../search'
import { BOARD_SIZE, applyEngineMove } from '../../utils/chessUtils'
import type { Board, Square, ChessPiece, CastlingRights } from '../../types/chess'

const MATE = 100000

const NO_RIGHTS: CastlingRights = {
  white: { kingSide: false, queenSide: false },
  black: { kingSide: false, queenSide: false },
}

const emptyBoard = (): Board => Array(8).fill(null).map(() => Array(8).fill(null)) as Board

const setAt = (board: Board, sq: Square, piece: ChessPiece): void => {
  board[BOARD_SIZE - parseInt(sq[1])][sq.charCodeAt(0) - 97] = piece
}

const place = (entries: Array<[Square, ChessPiece]>): Board => {
  const b = emptyBoard()
  for (const [sq, p] of entries) setAt(b, sq, p)
  return b
}

const K = (color: 'white' | 'black'): ChessPiece => ({ type: 'king', color, hasMoved: true })
const Q = (): ChessPiece => ({ type: 'queen', color: 'white', hasMoved: true })
const R = (): ChessPiece => ({ type: 'rook', color: 'white', hasMoved: true })

const run = (board: Board, turn: 'white' | 'black', depth: number) =>
  search(board, turn, NO_RIGHTS, null, depth, -Infinity, Infinity, new Map(), 0, 0)

const rowOf = (sq: Square): number => BOARD_SIZE - parseInt(sq[1])
const colOf = (sq: Square): number => sq.charCodeAt(0) - 97
const chebyshev = (a: Square, b: Square): number =>
  Math.max(Math.abs(rowOf(a) - rowOf(b)), Math.abs(colOf(a) - colOf(b)))

beforeEach(() => {
  resetSearchGlobals()
})

describe('[mating] zaznava mat v N potezah', () => {
  // Kh8, beli Kg6 + Qa1 -> Qa8# (mat v 1 potezi = 1 polpoteza)
  const MATE_IN_1 = place([
    ['h8', K('black')],
    ['g6', K('white')],
    ['a1', Q()],
  ])

  // Kh8, beli Kf6 + Qa1 -> mat v 2 potezah (3 polpoteze)
  const MATE_IN_2 = place([
    ['h8', K('black')],
    ['f6', K('white')],
    ['a1', Q()],
  ])

  test('mat v 1 potezi: globina 4 vrne mat potezo in MATE-1 (regresija: INF fail-high zaradi null-move)', () => {
    const res = run(MATE_IN_1, 'white', 4)
    expect(res.move).toEqual({ from: 'a1', to: 'a8' })
    expect(res.score).toBe(MATE - 1)
  })

  test('mat v 2 potezah: globina 4 vrne score MATE-3 (ne INF)', () => {
    const res = run(MATE_IN_2, 'white', 4)
    expect(res.move).toBeDefined()
    expect(res.score).toBe(MATE - 3)
  })
})

describe('[mating] KQ vs K: konverzija iz stisnjene pozicije', () => {
  // beli Kc6 + Qd1 proti črnemu Ka8 na potezi — mat v 3 polpotezah
  const board = place([
    ['c6', K('white')],
    ['d1', Q()],
    ['a8', K('black')],
  ])

  test('globina 5 najde vsiljen mat (score blizu MATE)', () => {
    const res = run(board, 'white', 5)
    expect(res.move).toBeDefined()
    expect(res.score).toBeGreaterThan(MATE - 20)
  })

  test('najdena poteza je zakonita (applyEngineMove uspe)', () => {
    const res = run(board, 'white', 5)
    expect(res.move).toBeDefined()
    const applied = applyEngineMove(board, res.move!.from, res.move!.to, NO_RIGHTS, null)
    expect(applied).not.toBeNull()
  })
})

describe('[mating] KR vs K: konverzija iz stisnjene pozicije', () => {
  // beli Kc6 + Ra1 proti črnemu Ka8 na potezi — mat v 1 potezi
  const board = place([
    ['c6', K('white')],
    ['a1', R()],
    ['a8', K('black')],
  ])

  test('globina 6 najde mat (score = MATE-1)', () => {
    const res = run(board, 'white', 6)
    expect(res.move).toBeDefined()
    expect(res.score).toBe(MATE - 1)
  })
})

describe('[mating] mop-up: ni več »treadmill« driblinga', () => {
  // beli Kh1 + Rg6, črni Ka8: pred popravkom je engine kralja odpeljal stran (h1-h2),
  // zdaj se približa šibkemu kralju, da lahko dostavi mat.
  const board = place([
    ['h1', K('white')],
    ['g6', R()],
    ['a8', K('black')],
  ])

  test('strong kralj se približa weak kralju (chebyshev se zmanjša)', () => {
    const res = run(board, 'white', 3)
    expect(res.move).toBeDefined()
    expect(res.move!.from).toBe('h1')
    expect(chebyshev(res.move!.to, 'a8')).toBeLessThan(chebyshev('h1', 'a8'))
  })
})
