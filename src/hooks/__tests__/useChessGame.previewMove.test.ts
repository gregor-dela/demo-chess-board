import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useChessGame } from '../useChessGame'

/**
 * Predogled poteze iz zgodovine (issue #13) je UI stanje, ki ga hrani `useChessGame`
 * v ločenem `useState` (ne v `gameState`), zato da hover/fokus v zgodovini ne sproži
 * re-renderja celotnega drevesa. Ko se zgodovina spremeni (poteza, undo), se počisti.
 */
describe('useChessGame - predogled poteze (issue #13)', () => {
  it('privzeto nima predogleda', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.previewMove).toBeNull()
  })

  it('setPreviewMove shrani in počisti predogled', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => result.current.setPreviewMove({ from: 'e2', to: 'e4' }))
    expect(result.current.previewMove).toEqual({ from: 'e2', to: 'e4' })

    act(() => result.current.setPreviewMove(null))
    expect(result.current.previewMove).toBeNull()
  })

  it('predogled se počisti, ko se zgodi poteza', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => result.current.setPreviewMove({ from: 'e2', to: 'e4' }))
    expect(result.current.previewMove).not.toBeNull()

    act(() => {
      result.current.handleSquareClick('e2')
      result.current.handlePieceDrop('e2', 'e4')
    })

    expect(result.current.gameState.moveHistory).toHaveLength(1)
    expect(result.current.previewMove).toBeNull()
  })

  it('predogled se počisti ob undo', () => {
    const { result } = renderHook(() => useChessGame())

    act(() => {
      result.current.handleSquareClick('e2')
      result.current.handlePieceDrop('e2', 'e4')
    })

    act(() => result.current.setPreviewMove({ from: 'e2', to: 'e4' }))
    expect(result.current.previewMove).not.toBeNull()

    act(() => result.current.undoMove())

    expect(result.current.gameState.moveHistory).toHaveLength(0)
    expect(result.current.previewMove).toBeNull()
  })
})
