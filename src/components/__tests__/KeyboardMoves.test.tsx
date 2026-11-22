import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChessGame from '../ChessGame'

describe('Keyboard-only moves', () => {
  it('allows selecting a piece and moving to a valid square with Enter key', async () => {
    const user = userEvent.setup()

    render(<ChessGame />)

    const from = await screen.findByLabelText(/e2\s+white pawn/i)
    const to = await screen.findByLabelText(/e4\s+empty/i)

    // Select the pawn at e2
    from.focus()
    await user.keyboard('{Enter}')

    // Move to e4
    to.focus()
    await user.keyboard('{Enter}')

    // Assert board updated
    expect(await screen.findByLabelText(/e4\s+white pawn/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e2\s+empty/i)).toBeInTheDocument()
  })

  it('also works with Space key', async () => {
    const user = userEvent.setup()

    render(<ChessGame />)

    const from = await screen.findByLabelText(/d2\s+white pawn/i)
    const to = await screen.findByLabelText(/d4\s+empty/i)

    from.focus()
    await user.keyboard(' ')
    to.focus()
    await user.keyboard(' ')

    expect(await screen.findByLabelText(/d4\s+white pawn/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/d2\s+empty/i)).toBeInTheDocument()
  })

  it('deselects the selected piece with Escape', async () => {
    const user = userEvent.setup()

    render(<ChessGame />)

    const from = await screen.findByLabelText(/e2\s+white pawn/i)

    from.focus()
    await user.keyboard('{Enter}')
    expect(from).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{Escape}')
    expect(from).not.toHaveAttribute('aria-pressed')
  })

  it('exposes only one tab stop on the board (roving tabindex)', async () => {
    render(<ChessGame />)
    await screen.findByLabelText(/e2\s+white pawn/i)

    const squares = Array.from(document.querySelectorAll('[data-square]'))
    const tabbable = squares.filter((s) => s.getAttribute('tabindex') === '0')

    expect(squares).toHaveLength(64)
    expect(tabbable).toHaveLength(1)
  })

  it('moves focus between squares with arrow keys', async () => {
    const user = userEvent.setup()

    render(<ChessGame />)

    const a1 = await screen.findByLabelText(/a1\s+white rook/i)
    act(() => a1.focus())
    await user.keyboard('{ArrowRight}')

    expect(screen.getByLabelText(/b1\s+white knight/i)).toHaveFocus()
  })
})
