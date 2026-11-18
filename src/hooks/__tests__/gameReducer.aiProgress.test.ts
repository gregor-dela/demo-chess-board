import { describe, expect, it } from 'vitest'
import { gameReducer, initialGameState } from '../gameReducer'
import type { AiProgress } from '../../types/chess'

const sample: AiProgress = {
  source: 'search',
  depth: 3,
  maxDepth: 6,
  scoreCp: 42,
  pv: [{ from: 'e2', to: 'e4' }],
  elapsedMs: 1200,
  timeBudgetMs: 3000,
  bestMove: { from: 'e2', to: 'e4' },
}

describe('gameReducer - AI napredek (issue #14)', () => {
  it('privzeto stanje nima napredka in ne razmišlja', () => {
    expect(initialGameState.aiThinking).toBe(false)
    expect(initialGameState.aiProgress).toBeNull()
  })

  it('SET_AI_PROGRESS shrani napredek', () => {
    const next = gameReducer(initialGameState, { type: 'SET_AI_PROGRESS', progress: sample })
    expect(next.aiProgress).toEqual(sample)
  })

  it('SET_AI_PROGRESS z null počisti napredek', () => {
    const withProgress = gameReducer(initialGameState, { type: 'SET_AI_PROGRESS', progress: sample })
    const cleared = gameReducer(withProgress, { type: 'SET_AI_PROGRESS', progress: null })
    expect(cleared.aiProgress).toBeNull()
  })

  it('SET_AI_THINKING(true) ohrani obstoječi napredek', () => {
    const withProgress = gameReducer(initialGameState, { type: 'SET_AI_PROGRESS', progress: sample })
    const next = gameReducer(withProgress, { type: 'SET_AI_THINKING', value: true })
    expect(next.aiThinking).toBe(true)
    expect(next.aiProgress).toEqual(sample)
  })

  it('SET_AI_THINKING(false) počisti napredek, da kartica ne ostane vidna', () => {
    const withProgress = gameReducer(initialGameState, { type: 'SET_AI_PROGRESS', progress: sample })
    const next = gameReducer(withProgress, { type: 'SET_AI_THINKING', value: false })
    expect(next.aiThinking).toBe(false)
    expect(next.aiProgress).toBeNull()
  })
})
