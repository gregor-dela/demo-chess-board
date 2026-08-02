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
})
