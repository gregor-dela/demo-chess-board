import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChessGame from '../ChessGame'
import type { GameState, ChessPiece } from '../../types/chess'
import { initialGameState } from '../../hooks/useChessGame'

const emptyBoard = (): (ChessPiece | null)[][] => Array(8).fill(null).map(() => Array(8).fill(null))

const pieceOrderLabels = ['White Queen', 'White Rook', 'White Bishop', 'White Knight']

function setupGameWithPromotionPending() {
  const board = emptyBoard()
  // White pawn e7; kings e1 and a8
  board[8 - 7][4] = { type: 'pawn', color: 'white', hasMoved: true }
  board[8 - 1][4] = { type: 'king', color: 'white', hasMoved: false }
  board[8 - 8][0] = { type: 'king', color: 'black', hasMoved: false }

  const init: GameState = {
    ...initialGameState,
    board,
    currentPlayer: 'white',
    gameStatus: 'active',
    moveHistory: [],
    redoHistory: [],
    selectedSquare: null,
    validMoves: [],
    isInCheck: false,
    enPassantTarget: null,
    pendingPromotion: null,
  }
  return init
}

describe('PromotionDialog UI', () => {
  it('opens on promotion attempt and promotes to queen on confirm', async () => {
    const user = userEvent.setup()
    const init = setupGameWithPromotionPending()

    render(<ChessGame initialState={init} />)

    // Perform the move: e7 -> e8 to trigger dialog
    const from = await screen.findByLabelText(/e7\s+white pawn/i)
    const to = await screen.findByLabelText(/e8\s+empty/i)
    await user.click(from)
    await user.click(to)

    // Dialog appears
    const dialog = await screen.findByRole('dialog', { name: /promote pawn/i })
    expect(dialog).toBeInTheDocument()

    // Confirm default queen via Confirm button
    const confirm = within(dialog).getByRole('button', { name: /confirm/i })
    await user.click(confirm)

    // Board shows promoted queen at e8
    expect(await screen.findByLabelText(/e8\s+white queen/i)).toBeInTheDocument()
  })

  it('can cancel promotion and keep pawn at original square', async () => {
    const user = userEvent.setup()
    const init = setupGameWithPromotionPending()

    render(<ChessGame initialState={init} />)

    const from = await screen.findByLabelText(/e7\s+white pawn/i)
    const to = await screen.findByLabelText(/e8\s+empty/i)
    await user.click(from)
    await user.click(to)

    const dialog = await screen.findByRole('dialog', { name: /promote pawn/i })
    const cancel = within(dialog).getByRole('button', { name: /cancel/i })
    await user.click(cancel)

    // Pawn remains on e7, e8 stays empty
    expect(await screen.findByLabelText(/e7\s+white pawn/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e8\s+empty/i)).toBeInTheDocument()
  })
  it('supports keyboard-only selection via Arrow keys and Enter; exposes live status', async () => {
    const user = userEvent.setup()
    const init = setupGameWithPromotionPending()

    render(<ChessGame initialState={init} />)

    // Trigger promotion
    const from = await screen.findByLabelText(/e7\s+white pawn/i)
    const to = await screen.findByLabelText(/e8\s+empty/i)
    await user.click(from)
    await user.click(to)

    const dialog = await screen.findByRole('dialog', { name: /promote pawn/i })

    // Live status present
    expect(within(dialog).getByRole('status')).toHaveTextContent(/promotion/i)

    // ArrowRight twice: Queen -> Rook -> Bishop, then Enter to confirm
    await user.keyboard('{ArrowRight}{ArrowRight}{Enter}')

    // Expect Bishop result
    expect(await screen.findByLabelText(/e8\s+white bishop/i)).toBeInTheDocument()
  })

  it('renders promotion option buttons with readable (dark) text on the white dialog', async () => {
    const user = userEvent.setup()
    const init = setupGameWithPromotionPending()

    render(<ChessGame initialState={init} />)

    const from = await screen.findByLabelText(/e7\s+white pawn/i)
    const to = await screen.findByLabelText(/e8\s+empty/i)
    await user.click(from)
    await user.click(to)

    const dialog = await screen.findByRole('dialog', { name: /promote pawn/i })

    // Dialog uses a white background; the container must set a dark text color
    // so the title and promotion buttons don't inherit the body's light text.
    expect(dialog.className).toMatch(/text-(slate|gray|zinc|neutral)-[89]00/)

    // Each promotion option button must carry an explicit text color class so
    // its label stays readable against the dialog background.
    const optionButtons = pieceOrderLabels.map((label) =>
      within(dialog).getByRole('button', { name: new RegExp(label, 'i') })
    )
    for (const btn of optionButtons) {
      expect(btn.className).toMatch(/text-(slate|gray|zinc|neutral)-[789]00/)
    }
  })

  it('traps focus with Tab/Shift+Tab and closes on Escape', async () => {
    const user = userEvent.setup()
    const init = setupGameWithPromotionPending()

    render(<ChessGame initialState={init} />)

    // Trigger promotion dialog
    const from = await screen.findByLabelText(/e7\s+white pawn/i)
    const to = await screen.findByLabelText(/e8\s+empty/i)
    await user.click(from)
    await user.click(to)

    const dialog = await screen.findByRole('dialog', { name: /promote pawn/i })

    // First focus should be on the first piece button (Queen)
    const queenBtn = within(dialog).getByRole('button', { name: /white queen/i })
    expect(queenBtn).toHaveFocus()

    const buttons = within(dialog).getAllByRole('button')
    const lastBtn = buttons[buttons.length - 1] // Confirm is last

    // Shift+Tab from first should wrap to last
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(lastBtn).toHaveFocus()

    // Tab from last should wrap to first
    await user.tab()
    expect(queenBtn).toHaveFocus()

    // Escape should close the dialog
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /promote pawn/i })).not.toBeInTheDocument()

    // Pawn remains on e7 after cancel
    expect(await screen.findByLabelText(/e7\s+white pawn/i)).toBeInTheDocument()
  })
})
