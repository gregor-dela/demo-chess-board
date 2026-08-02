import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import GameControls from '../GameControls'
import { GameState, ChessPiece, Move } from '../../types/chess'
import { vi } from 'vitest'

function createEmptyBoard(): (ChessPiece | null)[][] {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null))
}

function baseGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 'white',
    moveHistory: [],
    redoHistory: [],
    gameStatus: 'active',
    selectedSquare: null,
    validMoves: [],
    isInCheck: false,
    castlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    },
    enPassantTarget: null,
    orientation: 'whiteBottom',
    ...overrides,
  }
}

function createMove(partial: Partial<Move>): Move {
  // Provide required defaults; tests only care about notation, from, to
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
      black: { kingSide: true, queenSide: true }
    },
    ...partial,
  }
}

describe('GameControls', () => {
  it('renders the new control panel hierarchy with status content and disabled Undo/Redo actions', () => {
    const onResetGame = vi.fn()
    const onUndoMove = vi.fn()
    const onRedoMove = vi.fn()

    render(
      <GameControls
        gameState={baseGameState({ mode: 'pvp' })}
        onResetGame={onResetGame}
        onUndoMove={onUndoMove}
        onRedoMove={onRedoMove}
      />
    )

    expect(screen.getByRole('heading', { name: 'Game status' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Match settings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'History actions' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Move history' })).toBeInTheDocument()

    const statusSection = screen.getByRole('heading', { name: 'Game status' }).closest('section') as HTMLElement
    expect(within(statusSection).getByText('White to move')).toBeInTheDocument()
    expect(within(statusSection).getByText('Game in progress.')).toBeInTheDocument()
    expect(within(statusSection).getByRole('status')).toHaveTextContent(/active/i)

    const settingsSection = screen.getByRole('heading', { name: 'Match settings' }).closest('section') as HTMLElement
    expect(within(settingsSection).getByText('Player vs Player')).toBeInTheDocument()

    const undoBtn = screen.getByRole('button', { name: /Undo move/i }) as HTMLButtonElement
    const redoBtn = screen.getByRole('button', { name: /Redo move/i }) as HTMLButtonElement
    expect(undoBtn.disabled).toBe(true)
    expect(redoBtn.disabled).toBe(true)
  })

  it('enables Undo/Redo based on moveHistory/redoHistory and shows move history SAN with paths', () => {
    const onResetGame = vi.fn()
    const onUndoMove = vi.fn()
    const onRedoMove = vi.fn()

    const gs = baseGameState({
      moveHistory: [
        createMove({ from: 'e2', to: 'e4', notation: 'e4' }),
        createMove({ from: 'e7', to: 'e5', notation: 'e5', piece: { type: 'pawn', color: 'black', hasMoved: true } as ChessPiece }),
      ],
      redoHistory: [
        createMove({ from: 'g1', to: 'f3', notation: 'Nf3', piece: { type: 'knight', color: 'white', hasMoved: true } as ChessPiece })
      ],
    })

    render(
      <GameControls gameState={gs} onResetGame={onResetGame} onUndoMove={onUndoMove} onRedoMove={onRedoMove} />
    )

    const undoBtn = screen.getByRole('button', { name: /Undo move/i }) as HTMLButtonElement
    const redoBtn = screen.getByRole('button', { name: /Redo move/i }) as HTMLButtonElement
    expect(undoBtn.disabled).toBe(false)
    expect(redoBtn.disabled).toBe(false)

    const history = screen.getByRole('heading', { name: /Move history/i }).closest('section') as HTMLElement
    expect(within(history).getByText('1.')).toBeInTheDocument()
    expect(within(history).getByText('e4')).toBeInTheDocument()
    expect(within(history).getByText('e2 → e4')).toBeInTheDocument()
    expect(within(history).getByText('e5')).toBeInTheDocument()
    expect(within(history).getByText('e7 → e5')).toBeInTheDocument()
  })

  it('shows the AI thinking indicator when pvai mode is active and the AI is thinking', () => {
    render(
      <GameControls
        gameState={baseGameState({ mode: 'pvai', aiThinking: true })}
        onResetGame={() => {}}
        onUndoMove={() => {}}
        onRedoMove={() => {}}
      />
    )

    const statusSection = screen.getByRole('heading', { name: 'Game status' }).closest('section') as HTMLElement
    expect(within(statusSection).getByText('AI is thinking')).toBeInTheDocument()
  })

  it('handles Reset flow: opens dialog, cancel does nothing; confirm calls onResetGame', () => {
    const onResetGame = vi.fn()
    const onUndoMove = vi.fn()
    const onRedoMove = vi.fn()

    render(
      <GameControls
        gameState={baseGameState()}
        onResetGame={onResetGame}
        onUndoMove={onUndoMove}
        onRedoMove={onRedoMove}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Reset game/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Cancel
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(onResetGame).not.toHaveBeenCalled()

    // Open again and confirm (select confirm inside dialog)
    fireEvent.click(screen.getByRole('button', { name: /Reset game/i }))
    const dialog = screen.getByRole('dialog')
    const confirmBtn = within(dialog).getByRole('button', { name: /Reset Game/i })
    fireEvent.click(confirmBtn)

    expect(onResetGame).toHaveBeenCalledTimes(1)
  })
})
