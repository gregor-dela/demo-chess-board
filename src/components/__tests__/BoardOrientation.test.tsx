import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ChessGame from '../ChessGame'

describe('Board orientation toggle', () => {
  it('renders white bottom by default and flips to black bottom on toggle', () => {
    const { container } = render(<ChessGame />)
    const squares = Array.from(container.querySelectorAll('.chess-square')) as HTMLElement[]
    const firstSquare = squares[0]
    expect(firstSquare.getAttribute('aria-label')?.startsWith('a8')).toBe(true)

    const flipBtn = screen.getByRole('button', { name: /Flip board/i })
    fireEvent.click(flipBtn)

    const squaresAfter = Array.from(container.querySelectorAll('.chess-square')) as HTMLElement[]
    const firstAfter = squaresAfter[0]
    expect(firstAfter.getAttribute('aria-label')?.startsWith('h1')).toBe(true)

    expect(screen.getByText(/White to move/i)).toBeInTheDocument()
  })
})
