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
  }, [dispatch, bumpAiVersion])

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
