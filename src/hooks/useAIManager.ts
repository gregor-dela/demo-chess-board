import { Dispatch, useCallback, useEffect, useRef } from 'react'
import { GameAction, GameState, Square } from '../types/chess'
import { computeBestMoveProgress } from '../engine/ai'

/**
 * Upravlja življenjski cikel AI poteze:
 * - samodejno zahteva potezo, ko je v pvai načinu na potezi AI
 * - med iskanjem sproti objavlja napredek (`SET_AI_PROGRESS`) za UI (issue #14)
 * - `aiVersionRef` (prek `bumpAiVersion`) prepreči izvajanje zastarelih potez
 *   po Undo/Redo/Reset/spremembi nastavitev
 */
export const useAIManager = (gameState: GameState, dispatch: Dispatch<GameAction>) => {
  const aiBusyRef = useRef(false)
  const aiVersionRef = useRef(0)
  const aiThinkingTokenRef = useRef(0)

  const bumpAiVersion = useCallback(() => {
    aiVersionRef.current += 1
  }, [])

  const requestAiMove = useCallback(async () => {
    if (gameState.mode !== 'pvai') return
    if (gameState.gameStatus !== 'active' && gameState.gameStatus !== 'check') return
    if (gameState.currentPlayer !== (gameState.aiSettings?.aiPlays ?? 'black')) return
    if (aiBusyRef.current) return
    const versionAtRequest = aiVersionRef.current
    const thinkingToken = ++aiThinkingTokenRef.current
    aiBusyRef.current = true
    dispatch({ type: 'SET_AI_THINKING', value: true })
    try {
      let best: { from: Square; to: Square } | null = null
      const progressStream = computeBestMoveProgress(
        gameState,
        gameState.aiSettings?.depth ?? 3,
        gameState.aiSettings?.moveTimeMs ?? 1000
      )
      for await (const progress of progressStream) {
        if (aiVersionRef.current !== versionAtRequest) return
        dispatch({ type: 'SET_AI_PROGRESS', progress })
        best = progress.bestMove
      }
      if (aiVersionRef.current !== versionAtRequest) {
        return
      }
      if (best) {
        dispatch({ type: 'SELECT_SQUARE', square: best.from })
        dispatch({ type: 'MAKE_MOVE', from: best.from, to: best.to })
      }
    } finally {
      // Indikator ugasnemo, dokler ta zahteva še "poseduje" žeton razmišljanja.
      // Tako ob preklicu (Undo/Reset/sprememba nastavitev) AI ne pusti viseti
      // "AI is thinking"; nova zahteva pa prevzame nov žeton in ponovno prižge indikator.
      if (aiThinkingTokenRef.current === thinkingToken) {
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
