import { Dispatch, useReducer } from 'react'
import { GameAction, GameState } from '../types/chess'
import { gameReducer, initialGameState, seedPositionCounts } from './gameReducer'

/**
 * Ovoj okoli `useReducer` za stanje igre. Skrbi izključno za inicializacijo
 * (z zasejanjem `positionCounts`) in izpostavi stanje ter `dispatch`.
 */
export const useGameState = (initialState: GameState = initialGameState): {
  gameState: GameState
  dispatch: Dispatch<GameAction>
} => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState, seedPositionCounts)
  return { gameState, dispatch }
}
