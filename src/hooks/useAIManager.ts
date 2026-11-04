import { Dispatch, useCallback, useEffect, useRef } from 'react'
import { GameAction, GameState } from '../types/chess'
import { computeBestMove } from '../engine/ai'

/**
 * Upravlja življenjski cikel AI poteze:
 * - samodejno zahteva potezo, ko je v pvai načinu na potezi AI
 * - `aiVersionRef` (prek `bumpAiVersion`) prepreči izvajanje zastarelih potez
 *   po Undo/Redo/Reset/spremembi nastavitev
 */
export const useAIManager = (gameState: GameState, dispatch: Dispatch<GameAction>) => {
  const aiBusyRef = useRef(false)
  const aiVersionRef = useRef(0)

  const bumpAiVersion = useCallback(() => {
    aiVersionRef.current += 1
  }, [])

  const requestAiMove = useCallback(async () => {
    if (gameState.mode !== 'pvai') return
    if (gameState.gameStatus !== 'active' && gameState.gameStatus !== 'check') return
    if (gameState.currentPlayer !== (gameState.aiSettings?.aiPlays ?? 'black')) return
    if (aiBusyRef.current) return
    const versionAtRequest = aiVersionRef.current
    aiBusyRef.current = true
    dispatch({ type: 'SET_AI_THINKING', value: true })
    try {
      const best = await computeBestMove(gameState, gameState.aiSettings?.depth ?? 3, gameState.aiSettings?.moveTimeMs ?? 1000)
      if (aiVersionRef.current !== versionAtRequest) {
        return
      }
      if (best) {
        dispatch({ type: 'SELECT_SQUARE', square: best.from })
        dispatch({ type: 'MAKE_MOVE', from: best.from, to: best.to })
      }
    } finally {
      if (aiVersionRef.current === versionAtRequest) {
        dispatch({ type: 'SET_AI_THINKING', value: false })
      }
      aiBusyRef.current = false
    }
  }, [gameState, dispatch])

  useEffect(() => {
    requestAiMove()
  }, [requestAiMove])

  return { requestAiMove, bumpAiVersion }
}
