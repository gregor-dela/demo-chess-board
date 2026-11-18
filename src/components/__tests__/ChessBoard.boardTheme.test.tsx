import React from 'react'
import { render } from '@testing-library/react'
import ChessBoard from '../ChessBoard'
import type { BoardTheme, ChessBoardProps } from '../../types/chess'
import { baseGameState } from '../../test/chessTestUtils'
import { getBoardThemePalette } from '../../utils/boardThemes'

const renderBoard = (overrides: Partial<ChessBoardProps['gameState']> = {}) => {
  const props: ChessBoardProps = {
    gameState: baseGameState(overrides),
    onSquareClick: () => {},
    onPieceDrop: () => {},
  }
  return render(<ChessBoard {...props} />)
}

const getGrid = (container: HTMLElement) => container.querySelector('.board-grid') as HTMLElement

describe('ChessBoard - barvna tema plošče (issue #11)', () => {
  it('privzeto uporabi temo classic in izpostavi CSS spremenljivki', () => {
    const { container } = renderBoard()
    const grid = getGrid(container)
    const palette = getBoardThemePalette('classic')

    expect(grid).toHaveAttribute('data-board-theme', 'classic')
    expect(grid.style.getPropertyValue('--board-light')).toBe(palette.light)
    expect(grid.style.getPropertyValue('--board-dark')).toBe(palette.dark)
  })

  it('izbrana tema se odraža v atributu in CSS spremenljivkah', () => {
    const { container } = renderBoard({ boardTheme: 'ocean' })
    const grid = getGrid(container)
    const palette = getBoardThemePalette('ocean')

    expect(grid).toHaveAttribute('data-board-theme', 'ocean')
    expect(grid.style.getPropertyValue('--board-light')).toBe(palette.light)
    expect(grid.style.getPropertyValue('--board-dark')).toBe(palette.dark)
  })

  it('barve palete so uporabljene kot vrednosti CSS spremenljivk', () => {
    const { container } = renderBoard({ boardTheme: 'emerald' })
    const grid = getGrid(container)

    expect(grid.style.getPropertyValue('--board-light')).toBe('#eeeed2')
    expect(grid.style.getPropertyValue('--board-dark')).toBe('#769656')
  })

  it('neznana tema pade nazaj na classic', () => {
    const { container } = renderBoard({ boardTheme: 'unknown' as BoardTheme })
    const grid = getGrid(container)
    const palette = getBoardThemePalette('classic')

    expect(grid).toHaveAttribute('data-board-theme', 'classic')
    expect(grid.style.getPropertyValue('--board-light')).toBe(palette.light)
    expect(grid.style.getPropertyValue('--board-dark')).toBe(palette.dark)
  })
})
