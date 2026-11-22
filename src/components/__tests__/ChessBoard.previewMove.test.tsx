import React from 'react'
import { render } from '@testing-library/react'
import ChessBoard from '../ChessBoard'
import type { ChessBoardProps, MovePreview } from '../../types/chess'
import { baseGameState } from '../../test/chessTestUtils'

const renderBoard = (
  options: { previewMove?: MovePreview | null } & Partial<ChessBoardProps['gameState']> = {},
) => {
  const { previewMove = null, ...stateOverrides } = options
  const props: ChessBoardProps = {
    gameState: baseGameState(stateOverrides),
    previewMove,
    onSquareClick: () => {},
    onPieceDrop: () => {},
  }
  return render(<ChessBoard {...props} />)
}

describe('ChessBoard - predogled poteze (issue #13)', () => {
  it('označi izvorno in ciljno polje predogleda', () => {
    const { container } = renderBoard({ previewMove: { from: 'g1', to: 'f3' } })

    const from = container.querySelector('[data-square="g1"]')
    const to = container.querySelector('[data-square="f3"]')

    expect(from).toHaveClass('chess-square-preview-move')
    expect(to).toHaveClass('chess-square-preview-move')
    expect(container.querySelectorAll('.chess-square-preview-move')).toHaveLength(2)
  })

  it('ne označi nobenega polja, ko predogleda ni', () => {
    const { container } = renderBoard({ previewMove: null })
    expect(container.querySelectorAll('.chess-square-preview-move')).toHaveLength(0)
  })

  it('predogled deluje tudi pri obrnjeni plošči (blackBottom)', () => {
    const { container } = renderBoard({
      previewMove: { from: 'e2', to: 'e4' },
      orientation: 'blackBottom',
    })
    expect(container.querySelector('[data-square="e2"]')).toHaveClass('chess-square-preview-move')
    expect(container.querySelector('[data-square="e4"]')).toHaveClass('chess-square-preview-move')
  })

  it('označeni sta natanko polji predogleda tudi za kotni potezi', () => {
    const { container } = renderBoard({ previewMove: { from: 'a1', to: 'h8' } })
    const previewSquares = container.querySelectorAll('.chess-square-preview-move')
    expect(previewSquares).toHaveLength(2)
    expect(container.querySelector('[data-square="a1"]')).toHaveClass('chess-square-preview-move')
    expect(container.querySelector('[data-square="h8"]')).toHaveClass('chess-square-preview-move')
  })
})
