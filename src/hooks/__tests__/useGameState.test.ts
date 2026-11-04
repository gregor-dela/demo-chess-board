import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useGameState } from '../useGameState'
import { initialGameState } from '../gameReducer'
import { createEmptyBoard } from '../../test/chessTestUtils'

describe('useGameState', () => {
  it('vrne začetno stanje z osveženim positionCounts', () => {
    const { result } = renderHook(() => useGameState())

    expect(result.current.gameState.currentPlayer).toBe('white')
    expect(result.current.gameState.board).toHaveLength(8)

    const counts = result.current.gameState.positionCounts ?? {}
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
    expect(total).toBe(1)
  })

  it('dispatch TOGGLE_ORIENTATION preklopi orientacijo', () => {
    const { result } = renderHook(() => useGameState())

    act(() => result.current.dispatch({ type: 'TOGGLE_ORIENTATION' }))

    expect(result.current.gameState.orientation).toBe('blackBottom')
  })

  it('dispatch RESET_GAME vrne začetno stanje', () => {
    const custom = { ...initialGameState, board: createEmptyBoard(), currentPlayer: 'black' as const }
    const { result } = renderHook(() => useGameState(custom))

    act(() => result.current.dispatch({ type: 'RESET_GAME' }))

    expect(result.current.gameState).toEqual(initialGameState)
  })
})
