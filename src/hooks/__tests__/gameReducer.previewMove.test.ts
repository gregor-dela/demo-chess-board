import { describe, expect, it } from 'vitest'
import { gameReducer, initialGameState } from '../gameReducer'
import type { GameState, MovePreview } from '../../types/chess'

const preview: MovePreview = { from: 'e2', to: 'e4' }

/** Stanje z izbrano figuro e2 in dovoljeno potezo e4 (za sprožitev MAKE_MOVE). */
const stateReadyToMove = (overrides: Partial<GameState> = {}): GameState => ({
  ...initialGameState,
  selectedSquare: 'e2',
  validMoves: ['e4'],
  ...overrides,
})

describe('gameReducer - predogled poteze (issue #13)', () => {
  it('privzeto stanje nima predogleda', () => {
    expect(initialGameState.previewMove).toBeNull()
  })

  it('SET_PREVIEW_MOVE shrani predogled', () => {
    const next = gameReducer(initialGameState, { type: 'SET_PREVIEW_MOVE', move: preview })
    expect(next.previewMove).toEqual(preview)
  })

  it('SET_PREVIEW_MOVE z null počisti predogled', () => {
    const withPreview = gameReducer(initialGameState, { type: 'SET_PREVIEW_MOVE', move: preview })
    const cleared = gameReducer(withPreview, { type: 'SET_PREVIEW_MOVE', move: null })
    expect(cleared.previewMove).toBeNull()
  })

  it('MAKE_MOVE počisti predogled', () => {
    const next = gameReducer(stateReadyToMove({ previewMove: preview }), {
      type: 'MAKE_MOVE',
      from: 'e2',
      to: 'e4',
    })
    expect(next.moveHistory).toHaveLength(1)
    expect(next.previewMove).toBeNull()
  })

  it('UNDO_MOVE počisti predogled', () => {
    const moved = gameReducer(stateReadyToMove(), { type: 'MAKE_MOVE', from: 'e2', to: 'e4' })
    const undone = gameReducer({ ...moved, previewMove: preview }, { type: 'UNDO_MOVE' })
    expect(undone.moveHistory).toHaveLength(0)
    expect(undone.previewMove).toBeNull()
  })

  it('REDO_MOVE počisti predogled', () => {
    const moved = gameReducer(stateReadyToMove(), { type: 'MAKE_MOVE', from: 'e2', to: 'e4' })
    const undone = gameReducer(moved, { type: 'UNDO_MOVE' })
    const redone = gameReducer({ ...undone, previewMove: preview }, { type: 'REDO_MOVE' })
    expect(redone.moveHistory).toHaveLength(1)
    expect(redone.previewMove).toBeNull()
  })

  it('RESET_GAME počisti predogled', () => {
    const withPreview = gameReducer(initialGameState, { type: 'SET_PREVIEW_MOVE', move: preview })
    const reset = gameReducer(withPreview, { type: 'RESET_GAME' })
    expect(reset.previewMove).toBeNull()
  })
})
