import { GameState, Square } from '../types/chess'
import { updateCastlingRightsForMove, computeEnPassantTarget, BOARD_SIZE } from '../utils/chessUtils'
import { search } from './search'

type LineMove = { from: Square, to: Square }
type BookLine = { moves: LineMove[], side: 'white'|'black', style: 'aggressive'|'positional'|'balanced' }

let jsonLines: BookLine[] | null = null
const lines: BookLine[] = [
  {
    moves: [
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e5' },
      { from: 'g1', to: 'f3' },
      { from: 'b8', to: 'c6' },
      { from: 'f1', to: 'c4' },
      { from: 'g8', to: 'f6' },
    ],
    side: 'black',
    style: 'balanced',
  },
  {
    moves: [
      { from: 'e2', to: 'e4' },
      { from: 'c7', to: 'c5' }, // Sicilijka
      { from: 'g1', to: 'f3' },
      { from: 'd7', to: 'd6' },
      { from: 'd2', to: 'd4' },
      { from: 'c5', to: 'd4' },
      { from: 'f3', to: 'd4' },
    ],
    side: 'black',
    style: 'aggressive',
  },
  {
    moves: [
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e6' }, // Francoska
      { from: 'd2', to: 'd4' },
      { from: 'd7', to: 'd5' },
      { from: 'b1', to: 'c3' },
    ],
    side: 'black',
    style: 'positional',
  },
  {
    moves: [
      { from: 'e2', to: 'e4' },
      { from: 'c7', to: 'c6' }, // Karo-Kann
      { from: 'd2', to: 'd4' },
      { from: 'd7', to: 'd5' },
      { from: 'b1', to: 'c3' },
    ],
    side: 'black',
    style: 'positional',
  },
  {
    moves: [
      { from: 'd2', to: 'd4' },
      { from: 'd7', to: 'd5' },
      { from: 'c2', to: 'c4' },
      { from: 'e7', to: 'e6' },
      { from: 'g1', to: 'f3' },
    ],
    side: 'black',
    style: 'positional',
  },
  {
    moves: [
      { from: 'c2', to: 'c4' },
      { from: 'e7', to: 'e5' },
      { from: 'g2', to: 'g3' },
      { from: 'f8', to: 'c5' },
    ],
    side: 'black',
    style: 'aggressive',
  },
  {
    moves: [
      { from: 'd2', to: 'd4' },
      { from: 'g8', to: 'f6' }, // Indijska obramba
      { from: 'c2', to: 'c4' },
      { from: 'g7', to: 'g6' },
      { from: 'b1', to: 'c3' },
      { from: 'f8', to: 'g7' },
    ],
    side: 'black',
    style: 'aggressive',
  },
]

type RawBookLine = { moves: string[]; side: 'white'|'black'; style?: string }
async function ensureJsonLoaded(): Promise<void> {
  if (jsonLines !== null) return
  try {
    const res = await fetch('/opening-book.json')
    const data: { lines?: RawBookLine[] } = await res.json()
    jsonLines = (data.lines || []).map((l) => ({
      moves: l.moves.map((m: string) => ({ from: m.slice(0,2), to: m.slice(2,4) })),
      side: l.side,
      style: (l.style === 'aggressive' || l.style === 'positional' || l.style === 'balanced') ? l.style : 'balanced'
    }))
  } catch {
    jsonLines = []
  }
}

export async function getBookMove(state: GameState): Promise<{ from: Square, to: Square } | null> {
  await ensureJsonLoaded()
  const played: LineMove[] = state.moveHistory.map(m => ({ from: m.from, to: m.to }))
  const source: BookLine[] = (jsonLines && jsonLines.length > 0)
    ? jsonLines!
    : lines
  const candidates: Array<{ next: LineMove, weight: number }> = []
  for (const line of source) {
    let ok = true
    for (let i = 0; i < played.length && i < line.moves.length; i++) {
      const a = played[i]
      const b = line.moves[i]
      if (a.from !== b.from || a.to !== b.to) { ok = false; break }
    }
    if (!ok) continue
    if (played.length < line.moves.length) {
      const next = line.moves[played.length]
      const aiColor = state.aiSettings?.aiPlays ?? 'black'
      const aiStyle = state.aiSettings?.style ?? 'balanced'
      const moveIndexColor = played.length % 2 === 0 ? 'white' : 'black'
      if (moveIndexColor !== aiColor) continue
      const weight = line.style === aiStyle ? 3 : line.style === 'balanced' ? 2 : 1
      candidates.push({ next, weight })
    }
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.weight - a.weight)
  for (const c of candidates) {
    const b = state.board.map(row => [...row])
    const [fr, fc] = [BOARD_SIZE - parseInt(c.next.from[1]), c.next.from.charCodeAt(0) - 97]
    const [tr, tc] = [BOARD_SIZE - parseInt(c.next.to[1]), c.next.to.charCodeAt(0) - 97]
    const moved = b[fr][fc]
    if (!moved) {
      continue
    }
    const captured = b[tr][tc]
    b[tr][tc] = { ...moved, hasMoved: true }
    b[fr][fc] = null
    const nextRights = updateCastlingRightsForMove(state.castlingRights, moved, c.next.from, c.next.to, captured || undefined)
    const nextEP = moved.type === 'pawn' ? computeEnPassantTarget(fr, tr, fc) : null
    const nextTurn = state.currentPlayer === 'white' ? 'black' : 'white'
    const res = search(b, nextTurn, nextRights, nextEP, 2, -Infinity, Infinity)
    const scoreForAi = -res.score
    if (scoreForAi > -150) return c.next
  }
  return null
}
