import { useCallback, useEffect, useState } from 'react'
import { BoardTheme, GameState, MovePreview } from '../types/chess'
import { resetTranspositionTable } from '../engine/ai'
import { initialGameState } from './gameReducer'
import { useGameState } from './useGameState'
import { usePieceHandlers } from './usePieceHandlers'
import { useUndoRedo } from './useUndoRedo'
import { useAIManager } from './useAIManager'

export { initialGameState }

/**
 * Kompozicija štirih specializiranih hookov (SRP):
 * `useGameState`, `usePieceHandlers`, `useUndoRedo`, `useAIManager`.
 * Tu ostanejo le še tanki `dispatch` ovoji za akcije, ki ne sodijo v nobenega od njih.
 */
export const useChessGame = (initialState: GameState = initialGameState) => {
  const { gameState, dispatch } = useGameState(initialState)
  const { requestAiMove, bumpAiVersion } = useAIManager(gameState, dispatch)
  const { handleSquareClick, handlePieceDrop, handleDeselect } = usePieceHandlers(dispatch)
  const { undoMove, redoMove, canUndo, canRedo } = useUndoRedo(gameState, dispatch, bumpAiVersion)

  // Predogled poteze iz zgodovine (issue #13) je čisto UI stanje: hranimo ga ločeno
  // od `gameState`, da hover/fokus vrstice v zgodovini ne sproži re-renderja celotnega
  // drevesa (plošče in kontrolnega panela) — osvežita se le plošča in prizadeti polji.
  const [previewMove, setPreviewMoveState] = useState<MovePreview | null>(null)

  // Predogled ni več smiseln, ko se zgodovina spremeni (poteza, undo, redo, nova igra).
  useEffect(() => {
    setPreviewMoveState(null)
  }, [gameState.moveHistory])

  const resetGame = useCallback(() => {
    bumpAiVersion()
    resetTranspositionTable()
    dispatch({ type: 'RESET_GAME' })
  }, [bumpAiVersion, dispatch])

  const completePromotion = useCallback((piece: 'queen' | 'rook' | 'bishop' | 'knight') => {
    bumpAiVersion()
    dispatch({ type: 'COMPLETE_PROMOTION', piece })
  }, [bumpAiVersion, dispatch])

  const cancelPromotion = useCallback(() => {
    bumpAiVersion()
    dispatch({ type: 'CANCEL_PROMOTION' })
  }, [bumpAiVersion, dispatch])

  const toggleOrientation = useCallback(() => {
    dispatch({ type: 'TOGGLE_ORIENTATION' })
  }, [dispatch])

  const toggleMode = useCallback(() => {
    bumpAiVersion()
    resetTranspositionTable()
    dispatch({ type: 'TOGGLE_MODE' })
  }, [bumpAiVersion, dispatch])

  const setAiSettings = useCallback((settings: Partial<NonNullable<GameState['aiSettings']>>) => {
    bumpAiVersion()
    resetTranspositionTable()
    dispatch({ type: 'SET_AI_SETTINGS', settings })
  }, [bumpAiVersion, dispatch])

  const setPreviewMove = useCallback((move: MovePreview | null) => {
    setPreviewMoveState(move)
  }, [])

  const setBoardTheme = useCallback((theme: BoardTheme) => {
    dispatch({ type: 'SET_BOARD_THEME', theme })
  }, [dispatch])

  return {
    gameState,
    previewMove,
    handleSquareClick,
    handlePieceDrop,
    handleDeselect,
    resetGame,
    undoMove,
    redoMove,
    canUndo,
    canRedo,
    completePromotion,
    cancelPromotion,
    toggleOrientation,
    toggleMode,
    setAiSettings,
    setPreviewMove,
    setBoardTheme,
    requestAiMove,
  }
}
