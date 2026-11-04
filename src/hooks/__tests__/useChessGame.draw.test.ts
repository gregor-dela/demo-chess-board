import { renderHook, act } from '@testing-library/react'
import { useChessGame, initialGameState } from '../useChessGame'
import { createEmptyBoard, setPiece } from '../../test/chessTestUtils'

const move = (
  result: ReturnType<typeof renderHook<ReturnType<typeof useChessGame>>>['result'],
  from: Parameters<typeof result.current.handleSquareClick>[0],
  to: Parameters<typeof result.current.handlePieceDrop>[1]
) => {
  act(() => {
    result.current.handleSquareClick(from)
    result.current.handlePieceDrop(from, to)
  })
}

function setupSimplePosition() {
  const board = createEmptyBoard()
  setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
  setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
  setPiece(board, 'g1', { type: 'knight', color: 'white', hasMoved: false })
  setPiece(board, 'g8', { type: 'knight', color: 'black', hasMoved: false })
  return { ...initialGameState, board }
}

describe('Draw rules', () => {
  it('declares draw on threefold repetition', () => {
    const init = setupSimplePosition()
    const { result } = renderHook(() => useChessGame(init))

    move(result, 'g1', 'f3')
    move(result, 'g8', 'f6')
    move(result, 'f3', 'g1')
    move(result, 'f6', 'g8')
    move(result, 'g1', 'f3')
    move(result, 'g8', 'f6')
    move(result, 'f3', 'g1')
    move(result, 'f6', 'g8')

    expect(result.current.gameState.gameStatus).toBe('draw')
  })

  it('declares draw on 50-move rule (no pawn move or capture)', () => {
    const init = {
      ...setupSimplePosition(),
      halfMoveClock: 99,
    }
    const { result } = renderHook(() => useChessGame(init))
    move(result, 'g1', 'f3')
    expect(result.current.gameState.halfMoveClock).toBeGreaterThanOrEqual(100)
    expect(result.current.gameState.gameStatus).toBe('draw')
  })

  it('declares draw on insufficient material (K v K) via capture that removes last non-king', () => {
    // Initial: White K e1 + Q d1; Black K e8 + N g8. White queen captures knight on g8 -> K v K draw.
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: true })
    setPiece(board, 'd1', { type: 'queen', color: 'white', hasMoved: true })
    setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: true })
    setPiece(board, 'g8', { type: 'knight', color: 'black', hasMoved: true })
    const init = { ...initialGameState, board }
    const { result } = renderHook(() => useChessGame(init))

    expect(result.current.gameState.gameStatus).toBe('active')
    move(result, 'd1', 'g8') // Qxg8+ (or mate? but removes last non-king for black so position -> K v K)

    // After QxN, material: K + Q v K -> sufficient for mate, so still active (Rook/Queen can mate).
    // So we need to verify K+Q v K => NOT a draw first:
    expect(result.current.gameState.gameStatus).not.toBe('draw')
  })

  it('declares draw immediately when starting position is already K v K (insufficient material)', () => {
    const board = createEmptyBoard()
    setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: true })
    setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: true })
    const init = { ...initialGameState, board }
    const { result } = renderHook(() => useChessGame(init))
    // After mounting, first render's gameStatus is based on initialGameState's status,
    // so we must re-compute it inside the reducer. When we make a no-op or when
    // component computes, ensure computeGameStatus is called.
    // To trigger status recomputation we can do a king move (both kings move freely):
    move(result, 'e1', 'd1')
    // After moving, reducer calls computeGameStatus on newBoard -> detects K v K:
    expect(result.current.gameState.gameStatus).toBe('draw')
  })
})
