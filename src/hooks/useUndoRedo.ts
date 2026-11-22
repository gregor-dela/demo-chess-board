import { Dispatch, useCallback, useEffect } from 'react'
import { GameAction, GameState } from '../types/chess'

/**
 * Skrbi za undo/redo potez:
 * - `undoMove` / `redoMove` (ob vsakem klicu invalidirajo morebitno AI zahtevo prek `bumpAiVersion`)
 * - `canUndo` / `canRedo` izpeljana iz zgodovine
 * - globalni poslušalec tipkovnice (Ctrl/Cmd+Z, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z)
 */
export const useUndoRedo = (
  gameState: GameState,
  dispatch: Dispatch<GameAction>,
  bumpAiVersion: () => void
) => {
  const undoMove = useCallback(() => {
    bumpAiVersion()
    dispatch({ type: 'UNDO_MOVE' })
    // V pvai načinu: če je zadnjo potezo odigral AI, bi po enem Undo spet prišel na vrsto
    // AI in takoj ponovno odigral (poteza se uporabniku "ne bi vrnila"). Zato v tem primeru
    // odstranimo še človekovo potezo, da uporabnik dobi svoj položaj nazaj.
    const aiColor = gameState.aiSettings?.aiPlays ?? 'black'
    const lastMover = gameState.currentPlayer === 'white' ? 'black' : 'white'
    if ((gameState.mode ?? 'pvp') === 'pvai' && lastMover === aiColor && gameState.moveHistory.length > 1) {
      dispatch({ type: 'UNDO_MOVE' })
    }
  }, [dispatch, bumpAiVersion, gameState])

  const redoMove = useCallback(() => {
    bumpAiVersion()
    dispatch({ type: 'REDO_MOVE' })
  }, [dispatch, bumpAiVersion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undoMove()
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redoMove()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undoMove, redoMove])

  return {
    undoMove,
    redoMove,
    canUndo: gameState.moveHistory.length > 0,
    canRedo: gameState.redoHistory.length > 0,
  }
}
