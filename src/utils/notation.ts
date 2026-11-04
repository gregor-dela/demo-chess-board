import { Board, ChessPiece, GameStatus, Move, PieceType, Square } from '../types/chess'
import { BOARD_SIZE, getSquareFromCoordinates } from './board'
import { getValidMoves } from './moveValidation'

export const getPieceNotationSymbol = (type: PieceType): string => {
  switch (type) {
    case 'king':
      return 'K'
    case 'queen':
      return 'Q'
    case 'rook':
      return 'R'
    case 'bishop':
      return 'B'
    case 'knight':
      return 'N'
    case 'pawn':
    default:
      return ''
  }
}

export const isCastlingMove = (piece: ChessPiece, from: Square, to: Square): 'O-O' | 'O-O-O' | null => {
  if (piece.type !== 'king') return null
  // Standard king-side and queen-side destinations from initial squares
  if (from === 'e1' && to === 'g1') return 'O-O'
  if (from === 'e1' && to === 'c1') return 'O-O-O'
  if (from === 'e8' && to === 'g8') return 'O-O'
  if (from === 'e8' && to === 'c8') return 'O-O-O'
  return null
}

// Determine if any other same-type piece (same color) can also move to `to` (legal move),
// requiring disambiguation in algebraic notation.
const getOtherCandidateFromSquares = (board: Board, piece: ChessPiece, from: Square, to: Square): Square[] => {
  const others: Square[] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c]
      if (!p) continue
      if (p.color !== piece.color) continue
      if (p.type !== piece.type) continue
      const sq = getSquareFromCoordinates(r, c)
      if (sq === from) continue
      const moves = getValidMoves(board, sq, p.color)
      if (moves.includes(to)) others.push(sq)
    }
  }
  return others
}

const getDisambiguationString = (from: Square, conflictSquares: Square[]): string => {
  if (conflictSquares.length === 0) return ''
  const fromFile = from[0]
  const fromRank = from[1]
  const files = conflictSquares.map(s => s[0])
  const ranks = conflictSquares.map(s => s[1])
  const fileUnique = !files.includes(fromFile)
  const rankUnique = !ranks.includes(fromRank)
  if (fileUnique) return fromFile
  if (rankUnique) return fromRank
  return `${fromFile}${fromRank}`
}

// Generate SAN (Standard Algebraic Notation) for a move
export const generateAlgebraicNotation = (
  board: Board,
  move: Move,
  resultStatus?: GameStatus
): string => {
  const { piece, from, to, captured, isEnPassant, promotion } = move

  // Castling
  const castle = isCastlingMove(piece, from, to)
  if (castle) {
    return castle + (resultStatus === 'checkmate' ? '#' : resultStatus === 'check' ? '+' : '')
  }

  const pieceSymbol = getPieceNotationSymbol(piece.type)

  // Pawn moves
  if (piece.type === 'pawn') {
    const isEp = !!isEnPassant
    const isCapture = !!captured || isEp
    const captureMark = isCapture ? 'x' : ''
    const base = isCapture ? `${from[0]}${captureMark}${to}` : `${to}`

    // Promotion support
    const isPromotion =
      (piece.color === 'white' && to[1] === '8') ||
      (piece.color === 'black' && to[1] === '1')
    const promoPiece = isPromotion ? (promotion ?? 'queen') : undefined
    const promoSuffix = promoPiece ? `=${getPieceNotationSymbol(promoPiece)}` : ''

    const epMark = isEp ? ' e.p.' : ''
    const suffix = resultStatus === 'checkmate' ? '#' : resultStatus === 'check' ? '+' : ''
    return base + promoSuffix + epMark + suffix
  }

  // Pieces other than pawn
  const conflicts = piece.type === 'king' ? [] : getOtherCandidateFromSquares(board, piece, from, to)
  const disamb = getDisambiguationString(from, conflicts)
  const captureMark = captured ? 'x' : ''
  const base = `${pieceSymbol}${disamb}${captureMark}${to}`
  const suffix = resultStatus === 'checkmate' ? '#' : resultStatus === 'check' ? '+' : ''
  return base + suffix
}
