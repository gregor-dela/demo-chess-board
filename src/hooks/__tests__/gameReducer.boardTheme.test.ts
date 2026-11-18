import { describe, expect, it } from 'vitest'
import { gameReducer, initialGameState } from '../gameReducer'
import type { BoardTheme } from '../../types/chess'

describe('gameReducer - barvna tema plošče (issue #11)', () => {
  it('začetno stanje uporabi privzeto temo', () => {
    expect(initialGameState.boardTheme).toBe('classic')
  })

  it('SET_BOARD_THEME nastavi izbrano temo', () => {
    const next = gameReducer(initialGameState, { type: 'SET_BOARD_THEME', theme: 'ocean' })
    expect(next.boardTheme).toBe('ocean')
  })

  it('SET_BOARD_THEME ne spremeni ostalih delov stanja', () => {
    const next = gameReducer(initialGameState, { type: 'SET_BOARD_THEME', theme: 'emerald' })
    expect(next.board).toBe(initialGameState.board)
    expect(next.moveHistory).toBe(initialGameState.moveHistory)
    expect(next.currentPlayer).toBe(initialGameState.currentPlayer)
    expect(next.orientation).toBe(initialGameState.orientation)
  })

  it('RESET_GAME obdrži izbrano barvno temo', () => {
    const themed = gameReducer(initialGameState, { type: 'SET_BOARD_THEME', theme: 'amethyst' })
    const reset = gameReducer(themed, { type: 'RESET_GAME' })

    expect(reset.boardTheme).toBe('amethyst')
    expect(reset.moveHistory).toHaveLength(0)
    expect(reset.selectedSquare).toBeNull()
  })

  it('RESET_GAME brez predhodne izbire ohrani privzeto temo', () => {
    const reset = gameReducer(initialGameState, { type: 'RESET_GAME' })
    expect(reset.boardTheme).toBe('classic')
  })

  it('temo lahko zamenjamo večkrat zapored', () => {
    let state = initialGameState
    for (const theme of ['slate', 'classic', 'ocean'] as BoardTheme[]) {
      state = gameReducer(state, { type: 'SET_BOARD_THEME', theme })
      expect(state.boardTheme).toBe(theme)
    }
  })
})
