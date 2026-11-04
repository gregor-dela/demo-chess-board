import { Board, PieceColor, CastlingRights } from '../../types/chess'
import { search, quiescence } from '../search'
import { evaluate } from '../evaluation'

const emptyBoard = (): Board => Array.from({ length: 8 }, () => Array(8).fill(null))
const rc = (sq: string) => [8 - parseInt(sq[1]), sq.charCodeAt(0) - 97]

const place = (b: Board, sq: string, type: string, color: PieceColor) => {
  const [r, c] = rc(sq)
  // @ts-expect-error: test helper constructing piece inline
  b[r][c] = { type, color, hasMoved: false }
}

const NO_RIGHTS: CastlingRights = { white: { kingSide: false, queenSide: false }, black: { kingSide: false, queenSide: false } }

test('quiescence improves score when winning capture exists', () => {
  const b = emptyBoard()
  // white queen on d4, black rook hanging on d5
  place(b, 'd4', 'queen', 'white')
  place(b, 'd5', 'rook', 'black')
  const evalStand = evaluate(b, 'white')
  const s0 = search(b, 'white', NO_RIGHTS, null, 0, -Infinity, Infinity)
  expect(s0.score).toBeGreaterThanOrEqual(evalStand)
})

describe('[CS-010] 50-move pravilo v quiescence()', () => {
  test('halfMoveClock >= 100 vrne remi (score 0)', () => {
    const b = emptyBoard()
    place(b, 'd4', 'queen', 'white')
    place(b, 'd5', 'rook', 'black')
    const res = quiescence(b, 'white', NO_RIGHTS, null, -Infinity, Infinity, 100)
    expect(res.score).toBe(0)
  })

  test('halfMoveClock pod 100 ne sproži lažnega remija', () => {
    const b = emptyBoard()
    place(b, 'd4', 'queen', 'white')
    place(b, 'd5', 'rook', 'black')
    const evalStand = evaluate(b, 'white', 99)
    const res = quiescence(b, 'white', NO_RIGHTS, null, -Infinity, Infinity, 99)
    expect(res.score).toBeGreaterThanOrEqual(evalStand)
  })

  test('zajem resetira halfMoveClock (clock 99 se v otrocih ne prenese naprej)', () => {
    const b = emptyBoard()
    // bela dama d4 lahko zajame črnega topa na d5; po zajemu mora clock pasti na 0,
    // sicer bi otrok (clock 100) vrnil remi in zajem bi bil spregledan
    place(b, 'd4', 'queen', 'white')
    place(b, 'd5', 'rook', 'black')
    place(b, 'h8', 'king', 'black')
    const evalStand = evaluate(b, 'white', 99)
    const res = quiescence(b, 'white', NO_RIGHTS, null, -Infinity, Infinity, 99)
    expect(res.score).toBeGreaterThan(evalStand)
  })
})
