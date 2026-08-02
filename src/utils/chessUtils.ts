import { PieceType, PieceColor, Square, ChessPiece, Board, CastlingRights, GameStatus, Move } from '../types/chess'
import { getValidMoves } from './moveValidation'

// Board configuration
export const BOARD_SIZE = 8

// Get piece Unicode symbol
export const getPieceSymbol = (type: PieceType, color: PieceColor): string => {
  const pieces = {
    white: {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙'
    },
    black: {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟'
    }
  }
  return pieces[color][type]
}

// Get square color (light or dark)
// Standard: a1 (white's corner) is dark; queen always starts on its own color
export const getSquareColor = (file: string, rank: number): 'light' | 'dark' => {
  const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0)
  return (fileIndex + rank) % 2 === 0 ? 'light' : 'dark'
}

// Convert square notation to coordinates
export const getCoordinatesFromSquare = (square: Square): [number, number] => {
  const file = square[0]
  const rank = parseInt(square[1])
  const col = file.charCodeAt(0) - 'a'.charCodeAt(0)
  const row = BOARD_SIZE - rank
  return [row, col]
}

// Convert coordinates to square notation
export const getSquareFromCoordinates = (row: number, col: number): Square => {
  const file = String.fromCharCode('a'.charCodeAt(0) + col)
  const rank = BOARD_SIZE - row
  return `${file}${rank}`
}

// Create initial chess board
export const createInitialBoard = (): Board => {
  const board: Board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  
  // Place pawns
  for (let col = 0; col < BOARD_SIZE; col++) {
    board[1][col] = { type: 'pawn', color: 'black', hasMoved: false }
    board[BOARD_SIZE - 2][col] = { type: 'pawn', color: 'white', hasMoved: false }
  }
  
  // Place other pieces
  const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
  
  for (let col = 0; col < BOARD_SIZE; col++) {
    board[0][col] = { type: pieceOrder[col], color: 'black', hasMoved: false }
    board[BOARD_SIZE - 1][col] = { type: pieceOrder[col], color: 'white', hasMoved: false }
  }
  
  return board
}

// Check if a square is within board bounds
export const isValidSquare = (square: Square): boolean => {
  if (square.length !== 2) return false
  const file = square[0]
  const rank = parseInt(square[1])
  const maxFile = String.fromCharCode('a'.charCodeAt(0) + (BOARD_SIZE - 1))
  return file >= 'a' && file <= maxFile && rank >= 1 && rank <= BOARD_SIZE
}

// Validate drag data format (e.g., 'e2')
export const isValidDragData = (data: string | null | undefined): boolean => {
  if (typeof data !== 'string') return false
  const value = data.trim().toLowerCase()
  if (value.length !== 2) return false
  return isValidSquare(value as Square)
}

// Sanitize and validate potential square input
export const sanitizeSquareInput = (input: string | null | undefined): Square | null => {
  if (typeof input !== 'string') return null
  const value = input.trim().toLowerCase()
  return isValidSquare(value as Square) ? (value as Square) : null
}

// Get piece at square
export const getPieceAtSquare = (board: Board, square: Square): ChessPiece | null => {
  if (!isValidSquare(square)) return null
  const [row, col] = getCoordinatesFromSquare(square)
  return board[row][col]
}

// Check if square is occupied by opponent
export const isOpponentPiece = (board: Board, square: Square, playerColor: PieceColor): boolean => {
  const piece = getPieceAtSquare(board, square)
  return piece !== null && piece.color !== playerColor
}

// Check if square is occupied by own piece
export const isOwnPiece = (board: Board, square: Square, playerColor: PieceColor): boolean => {
  const piece = getPieceAtSquare(board, square)
  return piece !== null && piece.color === playerColor
}

// Check if square is empty
export const isEmptySquare = (board: Board, square: Square): boolean => {
  return getPieceAtSquare(board, square) === null
}

// Castling helpers and rights management
export const createInitialCastlingRights = (): CastlingRights => ({
  white: { kingSide: true, queenSide: true },
  black: { kingSide: true, queenSide: true }
})

export const isKingMove = (piece: ChessPiece | null): boolean => piece?.type === 'king'
export const isRookMove = (piece: ChessPiece | null): boolean => piece?.type === 'rook'

// Update castling rights based on a move (king moves disable both sides; rook moves disable side from original corner)
export const updateCastlingRightsForMove = (
  currentRights: CastlingRights,
  piece: ChessPiece,
  from: Square,
  to: Square,
  captured?: ChessPiece | null
): CastlingRights => {
  // Deep clone to avoid mutating input rights (tests expect immutability)
  const newRights: CastlingRights = {
    white: { ...currentRights.white },
    black: { ...currentRights.black }
  }
  const movingPlayer = piece.color

  // If the king moves, disable both sides for that color
  if (piece.type === 'king') {
    newRights[movingPlayer] = { kingSide: false, queenSide: false }
  }

  // If a rook moves from its original corner (and it hadn't moved before), disable that side
  if (piece.type === 'rook' && !piece.hasMoved) {
    if (from === (movingPlayer === 'white' ? 'a1' : 'a8')) {
      newRights[movingPlayer].queenSide = false
    } else if (from === (movingPlayer === 'white' ? 'h1' : 'h8')) {
      newRights[movingPlayer].kingSide = false
    }
  }

  // If a rook is captured on a corner square, disable the appropriate side for the color of the captured rook
  if (captured?.type === 'rook') {
    const capturedColor = captured.color
    if (to === (capturedColor === 'white' ? 'a1' : 'a8')) {
      newRights[capturedColor].queenSide = false
    } else if (to === (capturedColor === 'white' ? 'h1' : 'h8')) {
      newRights[capturedColor].kingSide = false
    }
  }

  return newRights
};

// Apply rook movement that accompanies a castling king move.
// Mutates the provided board row in-place (expected on a cloned board in reducers).
export const applyCastlingRookMove = (
  board: Board,
  row: number,
  kingFromCol: number,
  kingToCol: number
): void => {
  const isKingSide = kingToCol > kingFromCol
  const rookFromCol = isKingSide ? 7 : 0 // h-file or a-file
  const rookToCol = isKingSide ? 5 : 3   // f-file or d-file
  const rook = board[row][rookFromCol]
  if (rook) {
    board[row][rookToCol] = { ...rook, hasMoved: true }
    board[row][rookFromCol] = null
  }
}

// Undo rook movement from a previous castling move.
export const undoCastlingRookMove = (
  board: Board,
  row: number,
  kingFromCol: number,
  kingToCol: number
): void => {
  const isKingSide = kingToCol > kingFromCol
  const rookFromCol = isKingSide ? 7 : 0
  const rookToCol = isKingSide ? 5 : 3
  const rook = board[row][rookToCol]
  if (rook) {
    board[row][rookFromCol] = { ...rook, hasMoved: false }
    board[row][rookToCol] = null
  }
}

// Compute en passant target square given a two-step pawn move.
export const computeEnPassantTarget = (
  fromRow: number,
  toRow: number,
  fromCol: number
): Square | null => {
  if (Math.abs(toRow - fromRow) !== 2) return null
  const enPassantRow = (fromRow + toRow) / 2
  return `${String.fromCharCode('a'.charCodeAt(0) + fromCol)}${BOARD_SIZE - enPassantRow}` as Square
}

// Build a Move record consistently (SRP/DRY helper)
export const buildMoveRecord = (args: {
  from: Square
  to: Square
  piece: ChessPiece
  captured?: ChessPiece | null
  prevHasMoved: boolean
  prevCapturedHasMoved?: boolean
  prevCastlingRights: CastlingRights
  prevEnPassantTarget: Square | null
  isEnPassant?: boolean
  enPassantCaptureSquare?: Square
  promotion?: PieceType
  prevHalfMoveClock?: number
  prevPositionCounts?: Record<string, number>
}): Move => {
  const {
    from, to, piece, captured,
    prevHasMoved, prevCapturedHasMoved,
    prevCastlingRights, prevEnPassantTarget,
    isEnPassant, enPassantCaptureSquare, promotion,
    prevHalfMoveClock, prevPositionCounts
  } = args
  return {
    from,
    to,
    piece,
    notation: '',
    timestamp: new Date(),
    captured: captured || undefined,
    prevHasMoved,
    prevCapturedHasMoved,
    prevCastlingRights,
    prevEnPassantTarget,
    isEnPassant,
    enPassantCaptureSquare,
    promotion,
    prevHalfMoveClock,
    prevPositionCounts,
  }
}

// Notation helpers
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

export const generatePositionKey = (
  board: Board,
  player: PieceColor,
  rights: CastlingRights,
  enPassant: Square | null
): string => {
  const rows: string[] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    const cols: string[] = []
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c]
      if (!p) { cols.push('.') } else {
        const t = p.type
        const code = t === 'king' ? 'k' : t === 'queen' ? 'q' : t === 'rook' ? 'r' : t === 'bishop' ? 'b' : t === 'knight' ? 'n' : 'p'
        cols.push(p.color === 'white' ? code.toUpperCase() : code)
      }
    }
    rows.push(cols.join(''))
  }
  const castling = `${rights.white.kingSide ? 'K' : ''}${rights.white.queenSide ? 'Q' : ''}${rights.black.kingSide ? 'k' : ''}${rights.black.queenSide ? 'q' : ''}` || '-'
  const ep = enPassant || '-'
  const turn = player === 'white' ? 'w' : 'b'
  return `${rows.join('/')}:${turn}:${castling}:${ep}`
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
