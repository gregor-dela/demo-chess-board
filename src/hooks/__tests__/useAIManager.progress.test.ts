import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialGameState } from '../gameReducer'
import { useAIManager } from '../useAIManager'
import type { AiProgress, GameAction, GameState } from '../../types/chess'

const mocks = vi.hoisted(() => ({ computeBestMoveProgress: vi.fn() }))

vi.mock('../../engine/ai', () => ({
  computeBestMoveProgress: mocks.computeBestMoveProgress,
}))

const progressAt = (depth: number, bestMove: AiProgress['bestMove']): AiProgress => ({
  source: 'search',
  depth,
  maxDepth: 3,
  scoreCp: 42,
  pv: bestMove ? [bestMove] : [],
  elapsedMs: depth * 100,
  timeBudgetMs: 3000,
  bestMove,
})

function pvAiBlackToMove(): GameState {
  return {
    ...initialGameState,
    currentPlayer: 'black',
    mode: 'pvai',
    aiSettings: { aiPlays: 'black', depth: 3, moveTimeMs: 1000 },
  }
}

const actions = (dispatch: ReturnType<typeof vi.fn>): GameAction[] =>
  (dispatch.mock.calls as [GameAction][]).map(([a]) => a)

const flush = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
})

describe('useAIManager - napredek iskanja (issue #14)', () => {
  beforeEach(() => {
    mocks.computeBestMoveProgress.mockReset()
  })

  it('ob vsakem yieldu objavi SET_AI_PROGRESS in na koncu izvede potezo', async () => {
    mocks.computeBestMoveProgress.mockImplementation(async function* () {
      yield progressAt(1, { from: 'e7', to: 'e5' })
      yield progressAt(2, { from: 'e7', to: 'e5' })
      yield progressAt(3, { from: 'e7', to: 'e5' })
    })

    const dispatch = vi.fn()
    renderHook(() => useAIManager(pvAiBlackToMove(), dispatch))
    await flush()

    const progressDispatches = actions(dispatch)
      .filter((a): a is Extract<GameAction, { type: 'SET_AI_PROGRESS' }> => a.type === 'SET_AI_PROGRESS')
    expect(progressDispatches.map((a) => a.progress.depth)).toEqual([1, 2, 3])

    const thinking = actions(dispatch)
      .filter((a): a is Extract<GameAction, { type: 'SET_AI_THINKING' }> => a.type === 'SET_AI_THINKING')
    expect(thinking.map((a) => a.value)).toEqual([true, false])

    const moves = actions(dispatch).filter((a) => a.type === 'MAKE_MOVE')
    expect(moves).toHaveLength(1)
    expect(moves[0]).toMatchObject({ from: 'e7', to: 'e5' })
  })

  it('zadnji dispatch je SET_AI_THINKING(false), ki počisti napredek', async () => {
    mocks.computeBestMoveProgress.mockImplementation(async function* () {
      yield progressAt(1, { from: 'e7', to: 'e5' })
    })

    const dispatch = vi.fn()
    renderHook(() => useAIManager(pvAiBlackToMove(), dispatch))
    await flush()

    const types = actions(dispatch).map((a) => a.type)
    expect(types[types.length - 1]).toBe('SET_AI_THINKING')
  })

  it('bumpAiVersion med iskanjem prekine iteracijo brez izvedene poteze', async () => {
    mocks.computeBestMoveProgress.mockImplementation(async function* () {
      yield progressAt(1, null)
      await new Promise((resolve) => setTimeout(resolve, 20))
      yield progressAt(2, { from: 'e7', to: 'e5' })
    })

    const dispatch = vi.fn()
    const { result } = renderHook(() => useAIManager(pvAiBlackToMove(), dispatch))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      result.current.bumpAiVersion()
      await new Promise((resolve) => setTimeout(resolve, 40))
    })

    expect(actions(dispatch).filter((a) => a.type === 'MAKE_MOVE')).toHaveLength(0)
  })

  it('v pvp načinu ne zažene iskanja', async () => {
    const dispatch = vi.fn()
    renderHook(() => useAIManager({ ...initialGameState, mode: 'pvp' }, dispatch))
    await flush()

    expect(mocks.computeBestMoveProgress).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
  })
})
