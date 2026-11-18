import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ChessBoard from '../ChessBoard'
import ChessGame from '../ChessGame'
import type { Square, ChessBoardProps, GameState } from '../../types/chess'
import { baseGameState, createEmptyBoard } from '../../test/chessTestUtils'

/**
 * jsdom ne podpira PointerEvent, zato zgradimo MouseEvent in mu ročno dodamo
 * `pointerType`, da React-ov sintetični pointer dogodek dobi pravo vrednost.
 */
const firePointerDown = (el: Element, init: { pointerType?: string; button?: number } = {}) => {
  const event = new MouseEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    button: init.button ?? 0,
  })
  if (init.pointerType !== undefined) {
    Object.defineProperty(event, 'pointerType', { value: init.pointerType, configurable: true })
  }
  fireEvent(el, event)
}

const boardWithPieces = () => {
  const board = createEmptyBoard()
  board[6][4] = { type: 'pawn', color: 'white', hasMoved: false } // e2 (beli)
  board[3][4] = { type: 'pawn', color: 'black', hasMoved: false } // e5 (črni)
  return board
}

const renderBoard = (
  onSquareClick: (square: Square) => void,
  overrides: Partial<GameState> = {}
) => {
  const props: ChessBoardProps = {
    gameState: baseGameState({ board: boardWithPieces(), ...overrides }),
    onSquareClick,
    onPieceDrop: () => {},
  }
  return render(<ChessBoard {...props} />)
}

describe('Takojšnja izbira ob pritisku (hitrejše vlečenje)', () => {
  it('ob pritisku z levim gumbom miške na figuro trenutnega igralca takoj izbere polje', () => {
    const onSquareClick = vi.fn()
    const { container } = renderBoard(onSquareClick)

    firePointerDown(container.querySelector('[data-square="e2"]') as Element, {
      pointerType: 'mouse',
      button: 0,
    })

    expect(onSquareClick).toHaveBeenCalledTimes(1)
    expect(onSquareClick).toHaveBeenCalledWith('e2')
  })

  it('ne izbere praznega polja', () => {
    const onSquareClick = vi.fn()
    const { container } = renderBoard(onSquareClick)

    firePointerDown(container.querySelector('[data-square="e4"]') as Element, {
      pointerType: 'mouse',
      button: 0,
    })

    expect(onSquareClick).not.toHaveBeenCalled()
  })

  it('ne izbere figure nasprotnika', () => {
    const onSquareClick = vi.fn()
    const { container } = renderBoard(onSquareClick)

    firePointerDown(container.querySelector('[data-square="e5"]') as Element, {
      pointerType: 'mouse',
      button: 0,
    })

    expect(onSquareClick).not.toHaveBeenCalled()
  })

  it('ne izbere ob dotiku (touch) — dotik ima ločeno pot prek touchStart', () => {
    const onSquareClick = vi.fn()
    const { container } = renderBoard(onSquareClick)

    firePointerDown(container.querySelector('[data-square="e2"]') as Element, {
      pointerType: 'touch',
      button: 0,
    })

    expect(onSquareClick).not.toHaveBeenCalled()
  })

  it('ne izbere ob pritisku z desnim gumbom miške', () => {
    const onSquareClick = vi.fn()
    const { container } = renderBoard(onSquareClick)

    firePointerDown(container.querySelector('[data-square="e2"]') as Element, {
      pointerType: 'mouse',
      button: 2,
    })

    expect(onSquareClick).not.toHaveBeenCalled()
  })

  it('integracija: pritisk na figuro v igri takoj prikaže veljavne poteze', async () => {
    render(<ChessGame />)

    const e2 = await screen.findByLabelText(/e2\s+white pawn/i)
    firePointerDown(e2, { pointerType: 'mouse', button: 0 })

    expect(e2.className).toContain('chess-square-selected')

    const e4 = await screen.findByLabelText(/e4\s+empty/i)
    expect(e4.className).toContain('chess-square-valid-move')
  })
})
