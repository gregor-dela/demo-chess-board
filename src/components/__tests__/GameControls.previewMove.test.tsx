import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GameControls from '../GameControls'
import { baseGameState } from '../../test/chessTestUtils'
import type { ChessPiece, GameControlsProps, Move } from '../../types/chess'

const createMove = (partial: Partial<Move>): Move => {
  const piece: ChessPiece = { type: 'pawn', color: 'white', hasMoved: true }
  return {
    from: 'e2',
    to: 'e4',
    piece,
    notation: 'e4',
    timestamp: new Date(),
    prevHasMoved: false,
    prevCastlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
    },
    ...partial,
  }
}

const renderControls = (moveHistory: Move[], onPreviewMove = vi.fn()) => {
  const props: GameControlsProps = {
    gameState: baseGameState({ moveHistory }),
    onResetGame: vi.fn(),
    onUndoMove: vi.fn(),
    onRedoMove: vi.fn(),
    onToggleOrientation: vi.fn(),
    onToggleMode: vi.fn(),
    onSetAiSettings: vi.fn(),
    onPreviewMove,
  }
  return { ...render(<GameControls {...props} />), onPreviewMove }
}

describe('GameControls - predogled poteze iz zgodovine (issue #13)', () => {
  it('ob hoveru vrstice sporoči potezo za predogled in ob izhodu počisti', () => {
    const history = [createMove({ from: 'e2', to: 'e4', notation: 'e4' })]
    const { onPreviewMove } = renderControls(history)

    const row = screen.getByRole('button', { name: /Move 1: e4, e2 to e4/i })
    fireEvent.mouseEnter(row)
    expect(onPreviewMove).toHaveBeenLastCalledWith({ from: 'e2', to: 'e4' })

    fireEvent.mouseLeave(row)
    expect(onPreviewMove).toHaveBeenLastCalledWith(null)
  })

  it('ob fokusu vrstice (tipkovnica) sporoči potezo in ob blur počisti', () => {
    const history = [createMove({ from: 'g1', to: 'f3', notation: 'Nf3', piece: { type: 'knight', color: 'white', hasMoved: true } })]
    const { onPreviewMove } = renderControls(history)

    const row = screen.getByRole('button', { name: /Move 1: Nf3, g1 to f3/i })
    fireEvent.focus(row)
    expect(onPreviewMove).toHaveBeenLastCalledWith({ from: 'g1', to: 'f3' })

    fireEvent.blur(row)
    expect(onPreviewMove).toHaveBeenLastCalledWith(null)
  })

  it('vsaka vrstica sporoči svojo lastno potezo', () => {
    const history = [
      createMove({ from: 'e2', to: 'e4', notation: 'e4' }),
      createMove({ from: 'e7', to: 'e5', notation: 'e5', piece: { type: 'pawn', color: 'black', hasMoved: true } }),
    ]
    const { onPreviewMove } = renderControls(history)

    fireEvent.mouseEnter(screen.getByRole('button', { name: /Move 2: e5, e7 to e5/i }))
    expect(onPreviewMove).toHaveBeenLastCalledWith({ from: 'e7', to: 'e5' })
  })

  it('vrstice zgodovine so gumbi z dostopnim imenom', () => {
    const history = [createMove({ from: 'e2', to: 'e4', notation: 'e4' })]
    renderControls(history)

    const row = screen.getByRole('button', { name: /Move 1: e4, e2 to e4/i })
    expect(row.tagName).toBe('BUTTON')
    expect(row).toHaveTextContent('1.')
    expect(row).toHaveTextContent('e4')
    expect(row).toHaveTextContent('e2 → e4')
  })

  it('brez potez ne prikaže vrstic (in ne kliče predogleda)', () => {
    const { onPreviewMove } = renderControls([])
    expect(screen.getByText(/No moves yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Move 1/i })).toBeNull()
    expect(onPreviewMove).not.toHaveBeenCalled()
  })
})
