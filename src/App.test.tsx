import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the editorial dark shell with board-first content', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /modern chess game/i, level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/editorial board-first interface/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: /chess board/i }),
    ).toBeInTheDocument()
  })
})
