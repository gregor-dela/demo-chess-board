import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import GameControls from '../GameControls'
import { baseGameState } from '../../test/chessTestUtils'
import { vi } from 'vitest'

describe('GameControls actions', () => {
  it('invokes onUndoMove and onRedoMove when enabled', () => {
    const onResetGame = vi.fn()
    const onUndoMove = vi.fn()
    const onRedoMove = vi.fn()

    const gs = baseGameState({
      moveHistory: [{
        piece: { type: 'pawn', color: 'white', hasMoved: true },
        from: 'e2', to: 'e4', notation: 'e4', timestamp: new Date(), prevHasMoved: false,
        prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }
      }],
      redoHistory: [{
        piece: { type: 'knight', color: 'white', hasMoved: true },
        from: 'g1', to: 'f3', notation: 'Nf3', timestamp: new Date(), prevHasMoved: false,
        prevCastlingRights: { white: { kingSide: true, queenSide: true }, black: { kingSide: true, queenSide: true } }
      }]
    })

    render(<GameControls gameState={gs} onResetGame={onResetGame} onUndoMove={onUndoMove} onRedoMove={onRedoMove} />)

    const undoBtn = screen.getByRole('button', { name: /Undo Move/i })
    const redoBtn = screen.getByRole('button', { name: /Redo Move/i })

    fireEvent.click(undoBtn)
    fireEvent.click(redoBtn)

    expect(onUndoMove).toHaveBeenCalledTimes(1)
    expect(onRedoMove).toHaveBeenCalledTimes(1)
  })

  it('does not invoke Undo/Redo when disabled', () => {
    const onResetGame = vi.fn()
    const onUndoMove = vi.fn()
    const onRedoMove = vi.fn()

    const gs = baseGameState({ moveHistory: [], redoHistory: [] })
    render(<GameControls gameState={gs} onResetGame={onResetGame} onUndoMove={onUndoMove} onRedoMove={onRedoMove} />)

    const undoBtn = screen.getByRole('button', { name: /Undo Move/i }) as HTMLButtonElement
    const redoBtn = screen.getByRole('button', { name: /Redo Move/i }) as HTMLButtonElement

    expect(undoBtn.disabled).toBe(true)
    expect(redoBtn.disabled).toBe(true)

    fireEvent.click(undoBtn)
    fireEvent.click(redoBtn)

    expect(onUndoMove).not.toHaveBeenCalled()
    expect(onRedoMove).not.toHaveBeenCalled()
  })

  it('renders AI settings in pvai mode and fires onSetAiSettings on change', () => {
    const onResetGame = vi.fn()
    const onUndoMove = vi.fn()
    const onRedoMove = vi.fn()
    const onToggleOrientation = vi.fn()
    const onToggleMode = vi.fn()
    const onSetAiSettings = vi.fn()

    const gs = baseGameState({
      mode: 'pvai',
      aiSettings: { aiPlays: 'black', depth: 3, moveTimeMs: 1200, autoAnalyze: false, style: 'balanced' },
    })

    render(
      <GameControls
        gameState={gs}
        onResetGame={onResetGame}
        onUndoMove={onUndoMove}
        onRedoMove={onRedoMove}
        onToggleOrientation={onToggleOrientation}
        onToggleMode={onToggleMode}
        onSetAiSettings={onSetAiSettings}
      />
    )

    const depthSelect = screen.getByRole('combobox', { name: /AI Difficulty/i }) as HTMLSelectElement
    const styleSelect = screen.getByRole('combobox', { name: /AI Play Style/i }) as HTMLSelectElement
    const sideSelect = screen.getByRole('combobox', { name: /AI Side/i }) as HTMLSelectElement
    expect(depthSelect).toBeInTheDocument()
    expect(styleSelect).toBeInTheDocument()
    expect(sideSelect).toBeInTheDocument()

    fireEvent.change(depthSelect, { target: { value: '5' } })
    expect(onSetAiSettings).toHaveBeenLastCalledWith(expect.objectContaining({ depth: 5 }))

    fireEvent.change(styleSelect, { target: { value: 'aggressive' } })
    expect(onSetAiSettings).toHaveBeenLastCalledWith(expect.objectContaining({ style: 'aggressive' }))

    fireEvent.change(sideSelect, { target: { value: 'white' } })
    expect(onSetAiSettings).toHaveBeenLastCalledWith(expect.objectContaining({ aiPlays: 'white' }))
  })

  it('does not render AI settings in pvp mode', () => {
    const onResetGame = vi.fn()
    const onUndoMove = vi.fn()
    const onRedoMove = vi.fn()
    const onToggleOrientation = vi.fn()
    const onToggleMode = vi.fn()
    const onSetAiSettings = vi.fn()

    const gs = baseGameState({ mode: 'pvp' })

    render(
      <GameControls
        gameState={gs}
        onResetGame={onResetGame}
        onUndoMove={onUndoMove}
        onRedoMove={onRedoMove}
        onToggleOrientation={onToggleOrientation}
        onToggleMode={onToggleMode}
        onSetAiSettings={onSetAiSettings}
      />
    )

    expect(screen.queryByRole('combobox', { name: /AI Difficulty/i })).not.toBeInTheDocument()
  })
})
