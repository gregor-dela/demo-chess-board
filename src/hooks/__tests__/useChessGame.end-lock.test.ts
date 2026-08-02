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

function setupDrawByRepetition() {
  const board = createEmptyBoard()
  setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
  setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
  setPiece(board, 'g1', { type: 'knight', color: 'white', hasMoved: false })
  setPiece(board, 'g8', { type: 'knight', color: 'black', hasMoved: false })
  return { ...initialGameState, board }
}

describe('End-of-game lock', () => {
  it('blocks further moves after draw status', () => {
    const init = setupDrawByRepetition()
    const { result } = renderHook(() => useChessGame(init))

    move(result, 'g1', 'f3')
    move(result, 'g8', 'f6')
    move(result, 'f3', 'g1')
    move(result, 'f6', 'g8')
    move(result, 'g1', 'f3')
    move(result, 'g8', 'f6')
    move(result, 'f3', 'g1')
    move(result, 'f6', 'g8')

    const historyLen = result.current.gameState.moveHistory.length
    expect(result.current.gameState.gameStatus).toBe('draw')

    // Attempt another move should be ignored
    move(result, 'g1', 'f3')
    expect(result.current.gameState.moveHistory.length).toBe(historyLen)
    // Still in draw
    expect(result.current.gameState.gameStatus).toBe('draw')
  })
})
