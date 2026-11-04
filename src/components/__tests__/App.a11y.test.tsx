import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import App from '../../App'

describe('App a11y (celotno drevo)', () => {
  it('celotna aplikacija nima a11y kršitev', async () => {
    const { container } = render(<App />)

    await waitFor(() => screen.getByRole('group', { name: /chess board/i }))

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('tipkovnica doseže šahovska polja in Enter izbere figuro', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('group', { name: /chess board/i })

    // Tab navigacija privede fokus na šahovsko polje (button)
    await user.tab()
    const focused = document.activeElement as HTMLElement
    expect(focused).toHaveClass('chess-square')
    expect(focused).toHaveAttribute('data-square')

    // Enter na polju s figuro izbere figuro
    const e2 = screen.getByLabelText(/e2\s+white pawn/i)
    e2.focus()
    await user.keyboard('{Enter}')
    expect(e2).toHaveAttribute('aria-pressed', 'true')

    // Enter na ciljnem polju izvede potezo
    const e4 = screen.getByLabelText(/e4\s+empty/i)
    e4.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByLabelText(/e4\s+white pawn/i)).toBeInTheDocument()
  })

  it('potrditveni dialog za reset se odpre in Escape ga zapre', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('group', { name: /chess board/i })

    await user.click(screen.getByRole('button', { name: /reset game/i }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/reset game\?/i)).toBeInTheDocument()

    // Audit tudi z odprtim (portal) dialogom
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('potrditveni dialog reset: Tab navigacija + Enter izvede reset', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('group', { name: /chess board/i })

    // Naredimo potezo, da reset dejansko nekaj spremeni
    await user.click(screen.getByLabelText(/e2\s+white pawn/i))
    await user.click(screen.getByLabelText(/e4\s+empty/i))
    expect(await screen.findByLabelText(/e4\s+white pawn/i)).toBeInTheDocument()

    // Odpremo reset dialog in potrdimo prek tipkovnice
    await user.click(screen.getByRole('button', { name: /reset game/i }))
    await screen.findByRole('dialog')

    await user.tab()
    await user.tab()
    await user.keyboard('{Enter}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByLabelText(/e2\s+white pawn/i)).toBeInTheDocument()
    expect(screen.getByText(/no moves yet/i)).toBeInTheDocument()
  })

  it('promotion dialog (rose na zadnjo vrsto) se odpre in Escape ga zapre', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByRole('group', { name: /chess board/i })

    const click = async (label: RegExp) => {
      await user.click(screen.getByLabelText(label))
    }

    // a-kmet se prebije z zajetji do promocije na b8
    await click(/a2\s+white pawn/i)
    await click(/a4\s+empty/i)
    await click(/b7\s+black pawn/i)
    await click(/b6\s+empty/i)
    await click(/a4\s+white pawn/i)
    await click(/a5\s+empty/i)
    await click(/h7\s+black pawn/i)
    await click(/h6\s+empty/i)
    await click(/a5\s+white pawn/i)
    await click(/b6\s+black pawn/i)
    await click(/h6\s+black pawn/i)
    await click(/h5\s+empty/i)
    await click(/b6\s+white pawn/i)
    await click(/a7\s+black pawn/i)
    await click(/g7\s+black pawn/i)
    await click(/g6\s+empty/i)
    await click(/a7\s+white pawn/i)
    await click(/b8\s+black knight/i)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/promote pawn/i)).toBeInTheDocument()

    // Audit tudi z odprtim promotion dialogom
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
