import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useGameState } from '../useGameState'
import { usePieceHandlers } from '../usePieceHandlers'

const useHarness = () => {
  const { gameState, dispatch } = useGameState()
  const handlers = usePieceHandlers(dispatch)
  return { gameState, ...handlers }
}

describe('usePieceHandlers', () => {
  it('klik na lastno figuro jo izbere in izračuna veljavne poteze', () => {
    const { result } = renderHook(() => useHarness())

    act(() => result.current.handleSquareClick('e2'))

    expect(result.current.gameState.selectedSquare).toBe('e2')
    expect(result.current.gameState.validMoves).toContain('e4')
  })

  it('handlePieceDrop izvede veljavno potezo', () => {
    const { result } = renderHook(() => useHarness())

    act(() => {
      result.current.handleSquareClick('e2')
      result.current.handlePieceDrop('e2', 'e4')
    })

    expect(result.current.gameState.moveHistory).toHaveLength(1)
    expect(result.current.gameState.currentPlayer).toBe('black')
  })

  it('neveljavno polje ignorira in ne spremeni stanja', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useHarness())

    act(() => result.current.handleSquareClick('not-a-square'))
    expect(result.current.gameState.selectedSquare).toBeNull()

    act(() => result.current.handlePieceDrop('e2', 'e2'))
    expect(result.current.gameState.moveHistory).toHaveLength(0)

    spy.mockRestore()
  })
})
