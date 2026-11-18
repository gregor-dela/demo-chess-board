import { describe, expect, it } from 'vitest'
import { BOARD_THEMES, DEFAULT_BOARD_THEME, getBoardThemePalette } from '../boardThemes'
import type { BoardTheme } from '../../types/chess'

describe('boardThemes - palete šahovnice (issue #11)', () => {
  it('privzeta tema je classic', () => {
    expect(DEFAULT_BOARD_THEME).toBe('classic')
  })

  it('ponuja pet palet z edinstvenimi id-ji in veljavnimi barvami', () => {
    expect(BOARD_THEMES).toHaveLength(5)
    expect(new Set(BOARD_THEMES.map((theme) => theme.id)).size).toBe(BOARD_THEMES.length)

    for (const theme of BOARD_THEMES) {
      expect(theme.light).toMatch(/^#[0-9a-f]{6}$/i)
      expect(theme.dark).toMatch(/^#[0-9a-f]{6}$/i)
      expect(theme.light).not.toBe(theme.dark)
      expect(theme.label.length).toBeGreaterThan(0)
    }
  })

  it('vsebuje pričakovane id-je palet', () => {
    expect(BOARD_THEMES.map((theme) => theme.id)).toEqual([
      'classic',
      'emerald',
      'ocean',
      'amethyst',
      'slate',
    ])
  })

  it('getBoardThemePalette vrne paleto, ki ustreza podanemu id-ju', () => {
    for (const theme of BOARD_THEMES) {
      const palette = getBoardThemePalette(theme.id)
      expect(palette).toBe(theme)
      expect(palette.id).toBe(theme.id)
    }
  })

  it('getBoardThemePalette za classic vrne pričakovane barve', () => {
    const palette = getBoardThemePalette('classic')
    expect(palette.light).toBe('#d8c3a5')
    expect(palette.dark).toBe('#5d4037')
    expect(palette.label).toBe('Classic')
  })

  it('getBoardThemePalette za neznano temo pade nazaj na classic', () => {
    const palette = getBoardThemePalette('unknown' as BoardTheme)
    expect(palette.id).toBe(DEFAULT_BOARD_THEME)
    expect(palette).toEqual(getBoardThemePalette('classic'))
  })
})
