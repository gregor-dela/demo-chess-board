import { renderHook, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useChessGame } from '../useChessGame'
import { createEmptyBoard, setPiece } from '../../test/chessTestUtils'
import { initialGameState } from '../useChessGame'

function setupSimple() {
  const board = createEmptyBoard()
  setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
  setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
  setPiece(board, 'e2', { type: 'pawn', color: 'white', hasMoved: false })
  setPiece(board, 'e7', { type: 'pawn', color: 'black', hasMoved: false })
  return { ...initialGameState, board }
}

const doMove = (
  result: ReturnType<typeof renderHook<ReturnType<typeof useChessGame>>>['result'],
  from: string,
  to: string
) => {
  act(() => {
    result.current.handleSquareClick(from)
    result.current.handlePieceDrop(from, to)
  })
}

describe('useChessGame - keyboard shortcuts for undo/redo', () => {
  beforeEach(() => {
    // Clear any leftover listeners from prior tests
    act(() => {
      // Just a guard - hooks register on effect
    })
  })

  it('Ctrl+Z triggers undoMove; Ctrl+Y triggers redoMove', () => {
    const init = setupSimple()
    const { result, unmount } = renderHook(() => useChessGame(init))

    doMove(result, 'e2', 'e4')
    doMove(result, 'e7', 'e5')
    expect(result.current.gameState.moveHistory.length).toBe(2)
    expect(result.current.gameState.redoHistory.length).toBe(0)

    // Undo via Ctrl+Z
    act(() => {
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    })
    expect(result.current.gameState.moveHistory.length).toBe(1)
    expect(result.current.gameState.redoHistory.length).toBe(1)

    // Redo via Ctrl+Y
    act(() => {
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    })
    expect(result.current.gameState.moveHistory.length).toBe(2)
    expect(result.current.gameState.redoHistory.length).toBe(0)

    unmount()
  })

  it('Ctrl+Shift+Z also triggers redoMove (alternative to Ctrl+Y)', () => {
    const init = setupSimple()
    const { result, unmount } = renderHook(() => useChessGame(init))

    doMove(result, 'e2', 'e4')
    act(() => {
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    })
    expect(result.current.gameState.moveHistory.length).toBe(0)
    expect(result.current.gameState.redoHistory.length).toBe(1)

    act(() => {
      fireEvent.keyDown(window, { key: 'Z', ctrlKey: true, shiftKey: true })
    })
    expect(result.current.gameState.moveHistory.length).toBe(1)
    expect(result.current.gameState.redoHistory.length).toBe(0)

    unmount()
  })

  it('Meta+Z (Cmd) and Meta+Y also trigger undo/redo (macOS)', () => {
    const init = setupSimple()
    const { result, unmount } = renderHook(() => useChessGame(init))

    doMove(result, 'e2', 'e4')
    expect(result.current.gameState.moveHistory.length).toBe(1)

    act(() => {
      fireEvent.keyDown(window, { key: 'z', metaKey: true })
    })
    expect(result.current.gameState.moveHistory.length).toBe(0)
    expect(result.current.gameState.redoHistory.length).toBe(1)

    act(() => {
      fireEvent.keyDown(window, { key: 'y', metaKey: true })
    })
    expect(result.current.gameState.moveHistory.length).toBe(1)

    unmount()
  })
})
