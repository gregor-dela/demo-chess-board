import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GameControls from '../GameControls'
import { baseGameState, createEmptyBoard, setPiece } from '../../test/chessTestUtils'
import type { AiProgress, GameControlsProps, GameState } from '../../types/chess'

const noop = () => {}

const renderControls = (overrides: Partial<GameState>) => {
  const props: GameControlsProps = {
    gameState: baseGameState(overrides),
    onResetGame: noop,
    onUndoMove: noop,
    onRedoMove: noop,
    onToggleOrientation: noop,
    onToggleMode: noop,
    onSetAiSettings: noop,
  }
  return render(<GameControls {...props} />)
}

const searchProgress = (over: Partial<AiProgress> = {}): AiProgress => ({
  source: 'search',
  depth: 3,
  maxDepth: 6,
  scoreCp: 42,
  pv: [],
  elapsedMs: 1200,
  timeBudgetMs: 3000,
  bestMove: { from: 'e2', to: 'e4' },
  ...over,
})

const openingBoard = () => {
  const board = createEmptyBoard()
  setPiece(board, 'e2', { type: 'pawn', color: 'white', hasMoved: false })
  setPiece(board, 'e7', { type: 'pawn', color: 'black', hasMoved: false })
  return board
}

describe('GameControls - kartica napredka AI (issue #14)', () => {
  it('prikaže globino, oceno, PV linijo in čas med razmišljanjem', () => {
    renderControls({
      board: openingBoard(),
      currentPlayer: 'white',
      mode: 'pvai',
      aiThinking: true,
      aiProgress: searchProgress({
        pv: [
          { from: 'e2', to: 'e4' },
          { from: 'e7', to: 'e5' },
        ],
      }),
    })

    const card = screen.getByTestId('ai-progress')
    expect(card).toHaveTextContent('Search depth: 3 / 6')
    expect(card).toHaveTextContent('Eval: +0.42')
    expect(card).toHaveTextContent('PV line: 1. e4 e5')
    expect(card).toHaveTextContent('Elapsed: 1.2s (timeout: 3.0s)')
  })

  it('ne prikaže kartice, ko AI ne razmišlja', () => {
    renderControls({
      mode: 'pvai',
      aiThinking: false,
      aiProgress: searchProgress(),
    })
    expect(screen.queryByTestId('ai-progress')).toBeNull()
  })

  it('ne prikaže kartice brez napredka', () => {
    renderControls({ mode: 'pvai', aiThinking: true, aiProgress: null })
    expect(screen.queryByTestId('ai-progress')).toBeNull()
  })

  it('ne prikaže kartice v pvp načinu', () => {
    renderControls({ mode: 'pvp', aiThinking: true, aiProgress: searchProgress() })
    expect(screen.queryByTestId('ai-progress')).toBeNull()
  })

  it('za potezo iz otvoritvene knjižice prikaže vir namesto globine', () => {
    renderControls({
      mode: 'pvai',
      aiThinking: true,
      aiProgress: searchProgress({
        source: 'book',
        depth: 0,
        pv: [{ from: 'e7', to: 'e5' }],
        bestMove: { from: 'e7', to: 'e5' },
      }),
    })

    const card = screen.getByTestId('ai-progress')
    expect(card).toHaveTextContent('Opening book: e7 → e5')
    expect(card).not.toHaveTextContent('Search depth')
  })

  it('oblikuje negativno in nevtralno oceno', () => {
    const { unmount } = renderControls({
      mode: 'pvai',
      aiThinking: true,
      aiProgress: searchProgress({ scoreCp: -105 }),
    })
    expect(screen.getByTestId('ai-progress')).toHaveTextContent('Eval: -1.05')
    unmount()

    renderControls({
      mode: 'pvai',
      aiThinking: true,
      aiProgress: searchProgress({ scoreCp: 0 }),
    })
    expect(screen.getByTestId('ai-progress')).toHaveTextContent('Eval: 0.00')
  })
})
