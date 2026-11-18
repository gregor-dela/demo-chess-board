import type { BoardTheme } from '../types/chess'

// Barvne palete šahovnice (issue #11): izbira svetlih/temnih polj.
export interface BoardThemePalette {
  id: BoardTheme
  label: string
  light: string
  dark: string
}

export const DEFAULT_BOARD_THEME: BoardTheme = 'classic'

export const BOARD_THEMES: BoardThemePalette[] = [
  { id: 'classic', label: 'Classic', light: '#d8c3a5', dark: '#5d4037' },
  { id: 'emerald', label: 'Emerald', light: '#eeeed2', dark: '#769656' },
  { id: 'ocean', label: 'Ocean', light: '#dee3e6', dark: '#4b7399' },
  { id: 'amethyst', label: 'Amethyst', light: '#e8e0f5', dark: '#7c5cbf' },
  { id: 'slate', label: 'Slate', light: '#cbd5e1', dark: '#475569' },
]

const BOARD_THEME_PALETTES: Record<BoardTheme, BoardThemePalette> = BOARD_THEMES.reduce(
  (acc, theme) => {
    acc[theme.id] = theme
    return acc
  },
  {} as Record<BoardTheme, BoardThemePalette>
)

/** Vrne paleto za dano temo; neznana tema pade nazaj na privzeto (classic). */
export const getBoardThemePalette = (id: BoardTheme): BoardThemePalette =>
  BOARD_THEME_PALETTES[id] ?? BOARD_THEME_PALETTES[DEFAULT_BOARD_THEME]
