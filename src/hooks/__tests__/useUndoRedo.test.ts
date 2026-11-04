import { renderHook, act, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useGameState } from '../useGameState'
import { usePieceHandlers } from '../usePieceHandlers'
import { useUndoRedo } from '../useUndoRedo'

const useHarness = () => {
  const { gameState, dispatch } = useGameState()
  const { undoMove, redoMove, canUndo, canRedo } = useUndoRedo(gameState, dispatch, () => {})
  const { handleSquareClick, handlePieceDrop } = usePieceHandlers(dispatch)
  return { gameState, undoMove, redoMove, canUndo, canRedo, handleSquareClick, handlePieceDrop }
}

type Harness = ReturnType<typeof useHarness>

const playMove = (result: { current: Harness }, from: string, to: string) => {
  act(() => {
    result.current.handleSquareClick(from)
    result.current.handlePieceDrop(from, to)
  })
}

describe('useUndoRedo', () => {
  it('canUndo/canRedo odražata zgodovino potez', () => {
    const { result } = renderHook(() => useHarness())

    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)

    playMove(result, 'e2', 'e4')
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)

    act(() => result.current.undoMove())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.redoMove())
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('Ctrl+Z izvede undo, Ctrl+Y pa redo prek poslušalca tipkovnice', () => {
    const { result, unmount } = renderHook(() => useHarness())

    playMove(result, 'e2', 'e4')

    act(() => {
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    })
    expect(result.current.gameState.moveHistory).toHaveLength(0)

    act(() => {
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    })
    expect(result.current.gameState.moveHistory).toHaveLength(1)

    unmount()
  })

  it('poslušalec tipkovnice se odstrani ob unmount (brez napak)', () => {
    const { unmount } = renderHook(() => useHarness())

    unmount()

    expect(() => fireEvent.keyDown(window, { key: 'z', ctrlKey: true })).not.toThrow()
  })
})
