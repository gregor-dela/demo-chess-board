import { AiProgress, GameState, Square } from '../types/chess'
import { search, resetSearchGlobals, extractPrincipalVariation, type RepetitionContext } from './search'
import { TTEntry } from './zobrist'
import { getBookMove } from './openingBook'
// analysis helpers removed

const GLOBAL_TT: Map<bigint, TTEntry> = new Map()
const TT_MAX_SIZE = 100000

export function resetTranspositionTable(): void {
  GLOBAL_TT.clear()
  resetSearchGlobals()
}

/** Izračuna časovni budžet glede na fazo igre in stil (SRP: ločeno od iskalne zanke). */
const computeTimeBudget = (state: GameState, moveTimeMs: number): number => {
  const earlyGame = state.moveHistory.length < 8
  const inCheck = state.gameStatus === 'check'
  const style = state.aiSettings?.style ?? 'balanced'
  let budget = moveTimeMs
  if (inCheck) budget = Math.floor(moveTimeMs * 1.8)
  else if (earlyGame) budget = Math.floor(moveTimeMs * 0.7)
  if (style === 'aggressive') budget = Math.floor(budget * 1.15)
  if (style === 'positional') budget = Math.floor(budget * 1.0)
  return budget
}

/** Ob prekoračitvi velikosti TT odstrani približno polovico vnosov (CS-008). */
const pruneTranspositionTable = (tt: Map<bigint, TTEntry>): void => {
  if (tt.size <= TT_MAX_SIZE) return
  let count = 0
  const half = Math.floor(tt.size / 2)
  for (const k of tt.keys()) {
    tt.delete(k)
    count++
    if (count >= half) break
  }
}

/**
 * Iterativno poglabljanje z napredkom (issue #14).
 * Za vsako dokončano globino vrne `AiProgress` (globina, ocena, PV, pretečeni čas),
 * zadnji yield pa nosi končno najboljšo potezo. Če je na voljo otvoritvena poteza,
 * vrne en sam zapis z `source: 'book'`.
 */
export async function* computeBestMoveProgress(
  state: GameState,
  depth = 3,
  moveTimeMs = 1000
): AsyncGenerator<AiProgress, void, void> {
  const start = Date.now()
  const book = await getBookMove(state)
  if (book) {
    yield {
      source: 'book',
      depth: 0,
      maxDepth: depth,
      scoreCp: 0,
      pv: [book],
      elapsedMs: Date.now() - start,
      timeBudgetMs: moveTimeMs,
      bestMove: book,
    }
    return
  }

  const style = state.aiSettings?.style ?? 'balanced'
  const budget = computeTimeBudget(state, moveTimeMs)
  const tt = GLOBAL_TT
  const repCtx: RepetitionContext = { history: state.positionCounts ?? {}, path: new Map() }
  // Ocena iz iskanja je z vidika strani na potezi (AI); za UI jo pretvorimo na vidik belih.
  const toWhiteScore = (score: number): number => (state.currentPlayer === 'white' ? score : -score)

  let best: { from: Square, to: Square } | null = null
  let lastScore = 0
  let d = 1
  while (d <= depth && Date.now() - start < budget) {
    const window = style === 'aggressive' ? 150 : style === 'positional' ? 80 : 100
    const alpha = lastScore - window
    const beta = lastScore + window
    let res = search(state.board, state.currentPlayer, state.castlingRights, state.enPassantTarget, d, alpha, beta, tt, 0, state.halfMoveClock ?? 0, repCtx)
    if (!res.move || res.score <= alpha || res.score >= beta) {
      res = search(state.board, state.currentPlayer, state.castlingRights, state.enPassantTarget, d, -Infinity, Infinity, tt, 0, state.halfMoveClock ?? 0, repCtx)
    }
    if (res.move) best = res.move
    lastScore = res.score
    yield {
      source: 'search',
      depth: d,
      maxDepth: depth,
      scoreCp: toWhiteScore(res.score),
      pv: extractPrincipalVariation(state.board, state.currentPlayer, state.castlingRights, state.enPassantTarget, tt, Math.max(1, d)),
      elapsedMs: Date.now() - start,
      timeBudgetMs: budget,
      bestMove: best,
    }
    d++
  }
  pruneTranspositionTable(tt)
}

/**
 * Ohranjena sinhronska oblika: porabi generator in vrne le končno najboljšo potezo.
 */
export async function computeBestMove(state: GameState, depth = 3, moveTimeMs = 1000): Promise<{ from: Square, to: Square } | null> {
  let best: { from: Square, to: Square } | null = null
  for await (const progress of computeBestMoveProgress(state, depth, moveTimeMs)) {
    best = progress.bestMove
  }
  return best
}
