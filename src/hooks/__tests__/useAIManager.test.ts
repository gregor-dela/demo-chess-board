import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useGameState } from '../useGameState'
import { useAIManager } from '../useAIManager'
import { initialGameState } from '../gameReducer'
import { createEmptyBoard, setPiece } from '../../test/chessTestUtils'
import type { GameState } from '../../types/chess'

const useHarness = (init: GameState) => {
  const { gameState, dispatch } = useGameState(init)
  const ai = useAIManager(gameState, dispatch)
  return { gameState, ...ai }
}

function pvAiBlackToMove(): GameState {
  const board = createEmptyBoard()
  setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
  setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
  setPiece(board, 'e7', { type: 'pawn', color: 'black', hasMoved: false })
  return {
    ...initialGameState,
    board,
    currentPlayer: 'black',
    mode: 'pvai',
    aiSettings: { aiPlays: 'black', depth: 2, moveTimeMs: 100 },
  }
}

describe('useAIManager', () => {
  it('v pvp načinu ne izvede AI poteze', async () => {
    const init: GameState = { ...initialGameState, mode: 'pvp' }
    const { result } = renderHook(() => useHarness(init))

    await act(async () => {
      await result.current.requestAiMove()
    })

    expect(result.current.gameState.moveHistory).toHaveLength(0)
    expect(result.current.gameState.aiThinking).toBe(false)
  })

  it('v pvai načinu (AI na potezi) izvede AI potezo', async () => {
    const { result } = renderHook(() => useHarness(pvAiBlackToMove()))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
    })

    expect(result.current.gameState.moveHistory.length).toBeGreaterThanOrEqual(1)
  })
})
