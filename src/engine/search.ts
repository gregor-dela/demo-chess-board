import { Board, PieceColor, CastlingRights, Square, ChessPiece } from '../types/chess'
import { getValidMoves, isKingInCheck, isEnPassantMove, isInsufficientMaterial, findKingPosition } from '../utils/moveValidation'
import { evaluate, detectSimpleEndgame, pieceValues } from './evaluation'
import { applyEngineMove, BOARD_SIZE, cloneBoard, generatePositionKey } from '../utils/chessUtils'
import { zobristHash, TTEntry } from './zobrist'


function isViennaGambitPattern(board: Board): boolean {
  const pe4 = pieceAt(board, 'e4')
  const pc3 = pieceAt(board, 'c3')
  const pf4 = pieceAt(board, 'f4')
  const pe5 = pieceAt(board, 'e5')
  const nf6 = pieceAt(board, 'f6')
  return !!(pe4 && pe4.color === 'white' && pe4.type === 'pawn'
    && pe5 && pe5.color === 'black' && pe5.type === 'pawn'
    && pc3 && pc3.color === 'white' && pc3.type === 'knight'
    && nf6 && nf6.color === 'black' && nf6.type === 'knight'
    && pf4 && pf4.color === 'white' && pf4.type === 'pawn')
}

function genMoves(board: Board, color: PieceColor, rights: CastlingRights, enPassant: Square | null): Array<{ from: Square, to: Square }> {
  const moves: Array<{ from: Square, to: Square }> = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (!p || p.color !== color) continue
      const from = `${String.fromCharCode(97 + c)}${BOARD_SIZE - r}` as Square
      const valids = getValidMoves(board, from, color, rights, enPassant)
      for (const to of valids) moves.push({ from, to })
    }
  }
  return moves
}

function genCaptureMoves(board: Board, color: PieceColor, rights: CastlingRights, enPassant: Square | null): Array<{ from: Square, to: Square }> {
  const moves: Array<{ from: Square, to: Square }> = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (!p || p.color !== color) continue
      const from = `${String.fromCharCode(97 + c)}${BOARD_SIZE - r}` as Square
      const valids = getValidMoves(board, from, color, rights, enPassant)
      for (const to of valids) {
        const [tr, tc] = [BOARD_SIZE - parseInt(to[1]), to.charCodeAt(0) - 97]
        const target = board[tr][tc]
        if ((target && target.color !== color) || (enPassant && isEnPassantMove(board, from, to, enPassant))) {
          moves.push({ from, to })
        }
      }
    }
  }
  return moves
}

// CS-015 Optimization #2: zgradi attack map enkrat na node in ga reuse-aj za SEE,
// namesto ponovnega skeniranja vseh figur pri vsakem zajemu.
function buildAttackerMap(board: Board, color: PieceColor, rights: CastlingRights, enPassant: Square | null): Map<Square, Array<{ from: Square, val: number }>> {
  const map = new Map<Square, Array<{ from: Square, val: number }>>()
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (!p || p.color !== color) continue
      const from = `${String.fromCharCode(97 + c)}${BOARD_SIZE - r}` as Square
      const val = pieceValues[p.type]
      for (const to of getValidMoves(board, from, color, rights, enPassant)) {
        const arr = map.get(to)
        if (arr) arr.push({ from, val })
        else map.set(to, [{ from, val }])
      }
    }
  }
  for (const arr of map.values()) arr.sort((a, b) => a.val - b.val)
  return map
}

function attackersToSquare(board: Board, square: Square, color: PieceColor, rights: CastlingRights, enPassant: Square | null): Array<{ from: Square, val: number }> {
  return buildAttackerMap(board, color, rights, enPassant).get(square) ?? []
}

function seeGain(board: Board, from: Square, to: Square, turn: PieceColor, rights: CastlingRights, enPassant: Square | null, oppAttackerMap?: Map<Square, Array<{ from: Square, val: number }>>): number {
  const [tr, tc] = [BOARD_SIZE - parseInt(to[1]), to.charCodeAt(0) - 97]
  const captured = board[tr][tc]
  if (!captured) return 0
  const [fr, fc] = [BOARD_SIZE - parseInt(from[1]), from.charCodeAt(0) - 97]
  const mover = board[fr][fc]!
  const base = pieceValues[captured.type] - pieceValues[mover.type]
  const opp = turn === 'white' ? 'black' : 'white'
  const oppAttackers = oppAttackerMap ? (oppAttackerMap.get(to) ?? []) : attackersToSquare(board, to, opp, rights, enPassant)
  if (oppAttackers.length === 0) return base
  // subtract cheapest recapture value (approximate SEE)
  return base - oppAttackers[0].val
}

const MATE = 100000
const INF = 1000000000
let killers: Record<number, { from: Square, to: Square }[]> = {}
let history: Map<string, number> = new Map()

export function resetSearchGlobals(): void {
  killers = {}
  history = new Map()
}

function historyKey(m: { from: Square, to: Square }, color: PieceColor) {
  return `${color}:${m.from}->${m.to}`
}

export interface RepetitionContext {
  history: Record<string, number>
  path: Map<string, number>
}

export function search(board: Board, turn: PieceColor, rights: CastlingRights, enPassant: Square | null, depth: number, alpha: number, beta: number, tt?: Map<bigint, TTEntry>, ply: number = 0, halfMoveClock: number = 0, repCtx?: RepetitionContext): { score: number, move?: { from: Square, to: Square } } {
  // 50-move rule: draw at 100 half-moves (applies at every depth incl. root)
  if (halfMoveClock >= 100) return { score: 0 }
  let result: { score: number, move?: { from: Square, to: Square } }
  if (repCtx) {
    const posKey = generatePositionKey(board, turn, rights, enPassant)
    // Threefold repetition: draw when this position has already occurred twice.
    // Exclude the root (ply 0) so the engine may still choose a move.
    if (ply > 0) {
      const seen = (repCtx.history[posKey] || 0) + (repCtx.path.get(posKey) || 0)
      if (seen >= 2) return { score: 0 }
    }
    repCtx.path.set(posKey, (repCtx.path.get(posKey) || 0) + 1)
    try {
      result = searchNode(board, turn, rights, enPassant, depth, alpha, beta, tt, ply, halfMoveClock, repCtx)
    } finally {
      const remaining = (repCtx.path.get(posKey) || 1) - 1
      if (remaining <= 0) repCtx.path.delete(posKey)
      else repCtx.path.set(posKey, remaining)
    }
  } else {
    result = searchNode(board, turn, rights, enPassant, depth, alpha, beta, tt, ply, halfMoveClock, repCtx)
  }
  // Normalize a negated zero (-0) to +0 so draw scores compare equal
  return result.score === 0 ? { score: 0, move: result.move } : result
}

function searchNode(board: Board, turn: PieceColor, rights: CastlingRights, enPassant: Square | null, depth: number, alpha: number, beta: number, tt?: Map<bigint, TTEntry>, ply: number = 0, halfMoveClock: number = 0, repCtx?: RepetitionContext): { score: number, move?: { from: Square, to: Square } } {
  alpha = Math.max(alpha, -INF)
  beta = Math.min(beta, INF)
  if (isInsufficientMaterial(board)) return { score: 0 }
  const inCheck = isKingInCheck(board, turn)
  if (inCheck) depth = Math.max(0, depth + 1)
  if (depth === 0) {
    return quiescence(board, turn, rights, enPassant, alpha, beta, halfMoveClock)
  }
  if (!inCheck && depth >= 3 && detectSimpleEndgame(board).kind === 'none') {
    const R = depth >= 5 ? 2 : 1
    const nullTurn = turn === 'white' ? 'black' : 'white'
    const nullRes = search(board, nullTurn, rights, enPassant, depth - 1 - R, -beta, -beta + 1, tt, ply + 1, halfMoveClock + 1, repCtx)
    const nullScore = -nullRes.score
    if (nullScore >= beta) {
      return { score: beta }
    }
  }
  const key = zobristHash(board, turn, rights, enPassant)
  const ttEntry = tt?.get(key)
  if (ttEntry) {
    // CS-015 Optimization #3: terminalnost (mat/pat) je odvisna le od pozicije,
    // zato jo vrnemo takoj ne glede na depth; score se izračuna iz trenutnega ply.
    if (ttEntry.terminal) return { score: inCheck ? -(MATE - ply) : 0 }
    if (ttEntry.depth >= depth) return { score: ttEntry.score, move: ttEntry.move }
  }
  const moves = genMoves(board, turn, rights, enPassant)
  if (moves.length === 0) {
    if (tt) tt.set(key, { depth, score: 0, terminal: true })
    return inCheck ? { score: -(MATE - ply) } : { score: 0 }
  }
  const pvMove = ttEntry?.move
  // CS-015 Optimization #2: attack map nasprotnika zgradimo največ enkrat na node
  const oppColor = turn === 'white' ? 'black' : 'white'
  const oppKingSquare = findKingPosition(board, oppColor)
  let oppAttackerMap: Map<Square, Array<{ from: Square, val: number }>> | undefined
  const ordered = moves.map(m => {
    const target = board[BOARD_SIZE - parseInt(m.to[1])][m.to.charCodeAt(0) - 97]
    let base = 0
    if (target) {
      if (!oppAttackerMap) oppAttackerMap = buildAttackerMap(board, oppColor, rights, enPassant)
      base = 1000 + seeGain(board, m.from, m.to, turn, rights, enPassant, oppAttackerMap)
    }
    const hist = history.get(historyKey(m, turn)) || 0
    const kill = (killers[depth] || []).some(k => k.from === m.from && k.to === m.to) ? 500 : 0
    const appliedBoard = applyEngineMove(board, m.from, m.to, rights, enPassant)?.board ?? cloneBoard(board)
    // Nasprotnikov kralj se med našo potezo ne premakne → uporabimo znano polje (brez skena)
    const checkBonus = isKingInCheck(appliedBoard, oppColor, oppKingSquare) ? 300 : 0
    const pv = pvMove && pvMove.from === m.from && pvMove.to === m.to ? 2000 : 0
    const friedLiverPenalty = (turn === 'black' && m.from === 'f6' && m.to === 'd5' && isFriedLiverPattern(board)) ? -5000 : 0
    const viennaPenalty = (turn === 'black' && m.from === 'f8' && m.to === 'b4' && isViennaGambitPattern(board)) ? -1500 : 0
    const viennaBoost = (turn === 'black' && m.from === 'd7' && m.to === 'd5' && isViennaGambitPattern(board)) ? 1500 : 0
    return { m, score: base + hist + kill + checkBonus + pv + friedLiverPenalty + viennaPenalty + viennaBoost }
  })
  ordered.sort((A, B) => (B.score - A.score))
  const sortedMoves = ordered.map(o => o.m)
  let best: { score: number, move?: { from: Square, to: Square } } = { score: -Infinity }
  let first = true
  for (let i = 0; i < sortedMoves.length; i++) {
    const m = sortedMoves[i]
    const applied = applyEngineMove(board, m.from, m.to, rights, enPassant)
    if (!applied) continue
    const nextTurn = turn === 'white' ? 'black' : 'white'
    const movingPiece = board[BOARD_SIZE - parseInt(m.from[1])][m.from.charCodeAt(0) - 97]
    const isPawnMove = !!(movingPiece && movingPiece.type === 'pawn')
    const nextClock = (applied.captured || isPawnMove) ? 0 : halfMoveClock + 1
    if (!first) {
      const pvs = search(applied.board, nextTurn, applied.nextRights, applied.nextEnPassant, depth - 1, -alpha - 1, -alpha, tt, ply + 1, nextClock, repCtx)
      let score = -pvs.score
      const isCapture = !!applied.captured
      if (!isCapture && depth >= 4 && i > 6) {
        const reduced = search(applied.board, nextTurn, applied.nextRights, applied.nextEnPassant, depth - 3, -alpha - 1, -alpha, tt, ply + 1, nextClock, repCtx)
        score = -reduced.score
      }
      if (score > alpha && score < beta) {
        const full = search(applied.board, nextTurn, applied.nextRights, applied.nextEnPassant, depth - 1, -beta, -alpha, tt, ply + 1, nextClock, repCtx)
        score = -full.score
      }
      if (score > best.score) best = { score, move: m }
      if (score > alpha) {
        alpha = score
        killers[depth] = [m, ...((killers[depth] || []).filter(k => k.from !== m.from || k.to !== m.to)).slice(0, 1)]
        history.set(historyKey(m, turn), (history.get(historyKey(m, turn)) || 0) + depth * depth)
      }
      if (alpha >= beta) break
      continue
    }
    const res = search(applied.board, nextTurn, applied.nextRights, applied.nextEnPassant, depth - 1, -beta, -alpha, tt, ply + 1, nextClock, repCtx)
    const score = -res.score
    if (score > best.score) best = { score, move: m }
    if (score > alpha) alpha = score
    if (alpha >= beta) break
    first = false
  }
  if (tt) tt.set(key, { depth, score: best.score, move: best.move })
  return best
}

export function quiescence(board: Board, turn: PieceColor, rights: CastlingRights, enPassant: Square | null, alpha: number, beta: number, halfMoveClock: number = 0): { score: number } {
  // 50-move rule tudi v quiescence (dosežemo jo na pol potezah, npr. iz globine 0)
  if (halfMoveClock >= 100) return { score: 0 }
  alpha = Math.max(alpha, -INF)
  beta = Math.min(beta, INF)
  const standPat = evaluate(board, turn, halfMoveClock)
  if (standPat >= beta) return { score: beta }
  if (alpha < standPat) alpha = standPat
  const caps = genCaptureMoves(board, turn, rights, enPassant)
  for (const m of caps) {
    const applied = applyEngineMove(board, m.from, m.to, rights, enPassant)
    if (!applied) continue
    const nextTurn = turn === 'white' ? 'black' : 'white'
    const nextClock = (applied.captured || applied.moved.type === 'pawn') ? 0 : halfMoveClock + 1
    const score = -quiescence(applied.board, nextTurn, applied.nextRights, applied.nextEnPassant, -beta, -alpha, nextClock).score
    if (score >= beta) return { score: beta }
    if (score > alpha) alpha = score
  }
  return { score: alpha }
}
function sqToRC(sq: Square): [number, number] {
  return [BOARD_SIZE - parseInt(sq[1]), sq.charCodeAt(0) - 97]
}

function pieceAt(board: Board, sq: Square): ChessPiece | null {
  const [r, c] = sqToRC(sq)
  return board[r][c]
}

function isFriedLiverPattern(board: Board): boolean {
  const wg5 = pieceAt(board, 'g5')
  const wc4 = pieceAt(board, 'c4')
  const bf6 = pieceAt(board, 'f6')
  const wd5 = pieceAt(board, 'd5')
  return !!(wg5 && wg5.color === 'white' && wg5.type === 'knight'
    && wc4 && wc4.color === 'white' && wc4.type === 'bishop'
    && bf6 && bf6.color === 'black' && bf6.type === 'knight'
    && wd5 && wd5.color === 'white' && wd5.type === 'pawn')
}
