import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { vi } from 'vitest'
import GameControls from '../GameControls'
import type { BoardTheme, GameControlsProps } from '../../types/chess'
import { baseGameState } from '../../test/chessTestUtils'
import { BOARD_THEMES, getBoardThemePalette } from '../../utils/boardThemes'

const renderControls = (
  overrides: Partial<GameControlsProps['gameState']> = {},
  onSetBoardTheme: (theme: BoardTheme) => void = () => {}
) => {
  const props: GameControlsProps = {
    gameState: baseGameState(overrides),
    onResetGame: () => {},
    onUndoMove: () => {},
    onRedoMove: () => {},
    onToggleOrientation: () => {},
    onToggleMode: () => {},
    onSetAiSettings: () => {},
    onPreviewMove: () => {},
    onSetBoardTheme,
  }
  return render(<GameControls {...props} />)
}

const getThemeSelect = () => screen.getByLabelText(/board theme/i) as HTMLSelectElement

describe('GameControls - izbira barvne teme plošče (issue #11)', () => {
  it('prikaže izbirnik teme z vsemi paletami', () => {
    renderControls()
    const select = getThemeSelect()

    expect(select.value).toBe('classic')
    const options = within(select).getAllByRole('option')
    expect(options).toHaveLength(BOARD_THEMES.length)
    expect(options.map((option) => option.textContent)).toEqual(
      BOARD_THEMES.map((theme) => theme.label)
    )
  })

  it('oznaka prikaže trenutno izbrano paleto', () => {
    renderControls({ boardTheme: 'emerald' })
    expect(
      screen.getByText(`Board theme: ${getBoardThemePalette('emerald').label}`)
    ).toBeInTheDocument()
  })

  it('izbirnik ima vrednost iz stanja', () => {
    renderControls({ boardTheme: 'amethyst' })
    expect(getThemeSelect().value).toBe('amethyst')
  })

  it('sprememba izbire pokliče onSetBoardTheme z novo temo', () => {
    const onSetBoardTheme = vi.fn()
    renderControls({}, onSetBoardTheme)

    fireEvent.change(getThemeSelect(), { target: { value: 'slate' } })

    expect(onSetBoardTheme).toHaveBeenCalledTimes(1)
    expect(onSetBoardTheme).toHaveBeenCalledWith('slate')
  })
})
