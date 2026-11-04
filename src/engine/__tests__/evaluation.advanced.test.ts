import { evaluate } from '../evaluation'
import { createEmptyBoard } from '../../test/chessTestUtils'

test('doubled pawns penalize white', () => {
  const b = createEmptyBoard()
  b[7][4] = { type: 'king', color: 'white', hasMoved: false }
  b[0][4] = { type: 'king', color: 'black', hasMoved: false }
  b[6][2] = { type: 'pawn', color: 'white', hasMoved: false }
  b[5][2] = { type: 'pawn', color: 'white', hasMoved: false }
  const s = evaluate(b, 'white', { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }, null)
  // baseline with same material but without doubled structure
  b[5][2] = null
  b[5][3] = { type: 'pawn', color: 'white', hasMoved: false }
  const s2 = evaluate(b, 'white', { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }, null)
  expect(s).toBeLessThan(s2)
})

test('passed pawn bonus increases eval', () => {
  const b = createEmptyBoard()
  b[7][4] = { type: 'king', color: 'white', hasMoved: false }
  b[0][4] = { type: 'king', color: 'black', hasMoved: false }
  b[6][4] = { type: 'pawn', color: 'white', hasMoved: false }
  const s = evaluate(b, 'white', { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }, null)
  b[1][3] = { type: 'pawn', color: 'black', hasMoved: false } // add blocking pawn diagonally ahead
  const s2 = evaluate(b, 'white', { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }, null)
  expect(s).toBeGreaterThanOrEqual(s2)
})

test('rook on open file has bonus', () => {
  const b = createEmptyBoard()
  b[7][4] = { type: 'king', color: 'white', hasMoved: false }
  b[0][4] = { type: 'king', color: 'black', hasMoved: false }
  b[7][0] = { type: 'rook', color: 'white', hasMoved: false }
  b[6][1] = { type: 'pawn', color: 'white', hasMoved: false } // same material, rook file remains open
  const s = evaluate(b, 'white', { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }, null)
  b[6][1] = null
  b[6][0] = { type: 'pawn', color: 'white', hasMoved: false } // same material, rook file becomes closed
  const s2 = evaluate(b, 'white', { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }, null)
  expect(s).toBeGreaterThan(s2)
})

test('bishop pair bonus applies', () => {
  const b = createEmptyBoard()
  b[7][4] = { type: 'king', color: 'white', hasMoved: false }
  b[0][4] = { type: 'king', color: 'black', hasMoved: false }
  b[7][2] = { type: 'bishop', color: 'white', hasMoved: false }
  b[7][5] = { type: 'bishop', color: 'white', hasMoved: false }
  const s = evaluate(b, 'white', { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }, null)
  b[7][5] = null
  const s2 = evaluate(b, 'white', { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }, null)
  expect(s).toBeGreaterThan(s2)
})
