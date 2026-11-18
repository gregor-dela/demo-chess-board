import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'
import ChessGame from '../ChessGame'

const square = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-square="${name}"]`) as HTMLElement

const playMove = (from: RegExp, to: RegExp) => {
  fireEvent.click(screen.getByLabelText(from))
  fireEvent.click(screen.getByLabelText(to))
}

describe('predogled poteze iz zgodovine (issue #13) - integracija', () => {
  it('hover nad vrstico zgodovine označi potezo na plošči in jo ob izhodu počisti', () => {
    const { container } = render(<ChessGame />)

    playMove(/e2\s+white pawn/i, /e4\s+empty/i)

    const row = screen.getByRole('button', { name: /Move 1: e4, e2 to e4/i })

    fireEvent.mouseEnter(row)
    expect(square(container, 'e2')).toHaveClass('chess-square-preview-move')
    expect(square(container, 'e4')).toHaveClass('chess-square-preview-move')

    fireEvent.mouseLeave(row)
    expect(container.querySelectorAll('.chess-square-preview-move')).toHaveLength(0)
  })

  it('fokus na vrstici prek tipkovnice proži predogled', () => {
    const { container } = render(<ChessGame />)

    playMove(/d2\s+white pawn/i, /d4\s+empty/i)

    const row = screen.getByRole('button', { name: /Move 1: d4, d2 to d4/i })
    fireEvent.focus(row)
    expect(square(container, 'd2')).toHaveClass('chess-square-preview-move')
    expect(square(container, 'd4')).toHaveClass('chess-square-preview-move')

    fireEvent.blur(row)
    expect(container.querySelectorAll('.chess-square-preview-move')).toHaveLength(0)
  })

  it('undo med predogledom počisti oznako', () => {
    const { container } = render(<ChessGame />)

    playMove(/e2\s+white pawn/i, /e4\s+empty/i)

    fireEvent.mouseEnter(screen.getByRole('button', { name: /Move 1/i }))
    expect(container.querySelectorAll('.chess-square-preview-move')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: /Undo move/i }))
    expect(container.querySelectorAll('.chess-square-preview-move')).toHaveLength(0)
    expect(screen.getByText(/No moves yet/i)).toBeInTheDocument()
  })

  it('vrstice zgodovine so dostopne (axe brez kršitev)', async () => {
    const { container } = render(<ChessGame />)

    playMove(/e2\s+white pawn/i, /e4\s+empty/i)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
