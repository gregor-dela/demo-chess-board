import { beforeEach, describe, expect, it } from 'vitest'
import { computeBestMove, computeBestMoveProgress, resetTranspositionTable } from '../ai'
import { initialGameState } from '../../hooks/useChessGame'
import { createInitialBoard } from '../../utils/chessUtils'
import { getPieceAtSquare, BOARD_SIZE } from '../../utils/board'
import type { AiProgress, Board, CastlingRights, ChessPiece, GameState, Square } from '../../types/chess'

const NO_RIGHTS: CastlingRights = {
  white: { kingSide: false, queenSide: false },
  black: { kingSide: false, queenSide: false },
}

const emptyBoard = (): Board =>
  Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null))

const setAt = (board: Board, sq: Square, piece: ChessPiece): void => {
  const row = BOARD_SIZE - parseInt(sq[1])
  const col = sq.charCodeAt(0) - 97
  board[row][col] = piece
}

/** Kralj + dama na strani `color` – dovolj za hitro iskanje v testih. */
const queenBoard = (color: 'white' | 'black'): Board => {
  const board = emptyBoard()
  setAt(board, 'e1', { type: 'king', color: 'white', hasMoved: true })
  setAt(board, 'e8', { type: 'king', color: 'black', hasMoved: true })
  setAt(board, color === 'white' ? 'd1' : 'd8', { type: 'queen', color, hasMoved: true })
  return board
}

const collect = async (state: GameState, depth: number, ms: number): Promise<AiProgress[]> => {
  const out: AiProgress[] = []
  for await (const p of computeBestMoveProgress(state, depth, ms)) out.push(p)
  return out
}

const baseState = (over: Partial<GameState> = {}): GameState => ({
  ...initialGameState,
  mode: 'pvai',
  gameStatus: 'active',
  castlingRights: NO_RIGHTS,
  enPassantTarget: null,
  moveHistory: [],
  redoHistory: [],
  halfMoveClock: 0,
  positionCounts: {},
  // aiPlays 'black' prepreči, da bi getBookMove ponudil e2e4 iz prazne zgodovine.
  aiSettings: { aiPlays: 'black', depth: 2, moveTimeMs: 1000, autoAnalyze: false, style: 'balanced' },
  ...over,
})

beforeEach(() => {
  resetTranspositionTable()
})

describe('computeBestMoveProgress (issue #14)', () => {
  it('vrne po en zapis na dokončano globino z naraščajočo globino', async () => {
    const state = baseState({ board: queenBoard('white'), currentPlayer: 'white' })
    const progress = await collect(state, 2, 2000)

    expect(progress.length).toBe(2)
    expect(progress.map((p) => p.depth)).toEqual([1, 2])
    for (const p of progress) {
      expect(p.source).toBe('search')
      expect(p.maxDepth).toBe(2)
      expect(p.bestMove).not.toBeNull()
      expect(Array.isArray(p.pv)).toBe(true)
      expect(p.pv.length).toBeGreaterThan(0)
      expect(p.elapsedMs).toBeGreaterThanOrEqual(0)
      expect(typeof p.timeBudgetMs).toBe('number')
    }
  })

  it('najboljša poteza v napredku pripada strani na potezi', async () => {
    const state = baseState({
      board: queenBoard('black'),
      currentPlayer: 'black',
      aiSettings: { aiPlays: 'black', depth: 1, moveTimeMs: 1000, style: 'balanced' },
    })
    const progress = await collect(state, 1, 1000)
    const move = progress.at(-1)?.bestMove
    expect(move).not.toBeNull()
    const piece = getPieceAtSquare(state.board, move!.from)
    expect(piece?.color).toBe('black')
  })

  it('oceno pretvori na vidik belih (prednost belega -> pozitivno)', async () => {
    const whiteBetter = baseState({ board: queenBoard('white'), currentPlayer: 'white' })
    const whiteProgress = await collect(whiteBetter, 2, 2000)
    expect(whiteProgress.at(-1)!.scoreCp).toBeGreaterThan(0)

    resetTranspositionTable()

    const blackBetter = baseState({
      board: queenBoard('black'),
      currentPlayer: 'black',
      aiSettings: { aiPlays: 'black', depth: 2, moveTimeMs: 2000, style: 'balanced' },
    })
    const blackProgress = await collect(blackBetter, 2, 2000)
    expect(blackProgress.at(-1)!.scoreCp).toBeLessThan(0)
  })

  it('poteza iz otvoritvene knjižnice vrne en zapis z source="book"', async () => {
    const board = createInitialBoard()
    const state = baseState({
      board,
      currentPlayer: 'black',
      moveHistory: [
        {
          from: 'e2',
          to: 'e4',
          piece: { type: 'pawn', color: 'white', hasMoved: true },
          notation: 'e4',
          timestamp: new Date(),
          prevHasMoved: false,
          prevCastlingRights: NO_RIGHTS,
        },
      ],
      aiSettings: { aiPlays: 'black', depth: 3, moveTimeMs: 500, autoAnalyze: false, style: 'balanced' },
    })

    const progress = await collect(state, 3, 500)
    expect(progress).toHaveLength(1)
    expect(progress[0].source).toBe('book')
    expect(progress[0].depth).toBe(0)
    expect(progress[0].maxDepth).toBe(3)
    expect(progress[0].bestMove).not.toBeNull()
    expect(progress[0].pv).toEqual([progress[0].bestMove])
  })

  it('ob remiju po 50-poteznem pravilu (halfMoveClock 100) ne izbere poteze', async () => {
    const state = baseState({
      board: queenBoard('white'),
      currentPlayer: 'white',
      halfMoveClock: 100,
    })
    const progress = await collect(state, 2, 2000)

    expect(progress.length).toBeGreaterThanOrEqual(1)
    for (const p of progress) {
      expect(p.bestMove).toBeNull()
    }
    expect(await computeBestMove(state, 2, 2000)).toBeNull()
  })

  it('computeBestMove porabi generator in vrne najboljšo potezo', async () => {
    const state = baseState({ board: queenBoard('white'), currentPlayer: 'white' })
    const move = await computeBestMove(state, 2, 2000)
    expect(move).not.toBeNull()
    expect(getPieceAtSquare(state.board, move!.from)?.color).toBe('white')
  })

  describe('časovni budžet', () => {
    it('zgodnja faza igre zniža budžet na 70 %', async () => {
      const state = baseState({
        board: queenBoard('white'),
        currentPlayer: 'white',
        moveHistory: [],
        aiSettings: { aiPlays: 'black', depth: 1, moveTimeMs: 1000, style: 'balanced' },
      })
      const progress = await collect(state, 1, 1000)
      expect(progress.at(-1)!.timeBudgetMs).toBe(700)
    })

    it('po 8 potezah uporabi poln budžet', async () => {
      const history = Array.from({ length: 8 }, (_, i) => ({
        from: 'a2' as Square,
        to: 'a3' as Square,
        piece: { type: 'pawn' as const, color: 'white' as const, hasMoved: true },
        notation: `${i + 1}`,
        timestamp: new Date(),
        prevHasMoved: false,
        prevCastlingRights: NO_RIGHTS,
      }))
      const state = baseState({
        board: queenBoard('white'),
        currentPlayer: 'white',
        moveHistory: history,
        aiSettings: { aiPlays: 'black', depth: 1, moveTimeMs: 1000, style: 'balanced' },
      })
      const progress = await collect(state, 1, 1000)
      expect(progress.at(-1)!.timeBudgetMs).toBe(1000)
    })

    it('šah podvoji budžet (1.8x), aggressive doda 15 %, positional ohrani osnovo', async () => {
      const check = baseState({
        board: queenBoard('white'),
        currentPlayer: 'white',
        moveHistory: [],
        gameStatus: 'check',
        aiSettings: { aiPlays: 'black', depth: 1, moveTimeMs: 1000, style: 'balanced' },
      })
      expect((await collect(check, 1, 1000)).at(-1)!.timeBudgetMs).toBe(1800)

      const aggressive = baseState({
        board: queenBoard('white'),
        currentPlayer: 'white',
        moveHistory: [],
        aiSettings: { aiPlays: 'black', depth: 1, moveTimeMs: 1000, style: 'aggressive' },
      })
      // floor(700 * 1.15) zaradi plavajoče vejice znaša 804.
      expect((await collect(aggressive, 1, 1000)).at(-1)!.timeBudgetMs).toBe(804)

      const positional = baseState({
        board: queenBoard('white'),
        currentPlayer: 'white',
        moveHistory: [],
        aiSettings: { aiPlays: 'black', depth: 1, moveTimeMs: 1000, style: 'positional' },
      })
      expect((await collect(positional, 1, 1000)).at(-1)!.timeBudgetMs).toBe(700)
    })
  })
})
