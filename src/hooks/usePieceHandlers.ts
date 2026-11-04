import { Dispatch, useCallback } from 'react'
import { GameAction, Square } from '../types/chess'
import { isValidSquare } from '../utils/board'

/**
 * Upravlja uporabniške interakcije s figurami prek `dispatch` akcij:
 * klik na polje (izbira/poteza) in spust figure (drag & drop).
 */
export const usePieceHandlers = (dispatch: Dispatch<GameAction>) => {
  const handleSquareClick = useCallback((square: Square) => {
    if (!isValidSquare(square)) return
    dispatch({ type: 'SELECT_SQUARE', square })
  }, [dispatch])

  const handlePieceDrop = useCallback((from: Square, to: Square) => {
    if (!isValidSquare(from) || !isValidSquare(to)) {
      console.error('Invalid move attempt: invalid square format', { from, to })
      return
    }
    if (from === to) {
      console.error('Invalid move attempt: source and destination squares are the same', { from, to })
      return
    }
    dispatch({ type: 'MAKE_MOVE', from, to })
  }, [dispatch])

  return { handleSquareClick, handlePieceDrop }
}
