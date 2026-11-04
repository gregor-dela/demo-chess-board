import { PieceType, PieceColor, Square, ChessPiece, Board, CastlingRights, Move } from '../types/chess'
import { BOARD_SIZE, getCoordinatesFromSquare, getSquareFromCoordinates, cloneBoard } from './board'
import { isEnPassantMove } from './moveValidation'

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
  return getSquareFromCoordinates(enPassantRow, fromCol)
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
  timestamp?: Date
}): Move => {
  const {
    from, to, piece, captured,
    prevHasMoved, prevCapturedHasMoved,
    prevCastlingRights, prevEnPassantTarget,
    isEnPassant, enPassantCaptureSquare, promotion,
    prevHalfMoveClock, prevPositionCounts, timestamp,
  } = args
  return {
    from,
    to,
    piece,
    notation: '',
    timestamp: timestamp ?? new Date(),
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

export interface EngineMoveResult {
  board: Board
  captured: ChessPiece | null
  moved: ChessPiece
  nextRights: CastlingRights
  nextEnPassant: Square | null
  isEnPassant: boolean
  isCastling: boolean
  promotedTo?: PieceType
}

export const applyEngineMove = (
  board: Board,
  from: Square,
  to: Square,
  rights: CastlingRights,
  enPassantTarget: Square | null,
  opts?: { promotionPiece?: PieceType; applyPromotion?: boolean }
): EngineMoveResult | null => {
  const promotionPiece = opts?.promotionPiece ?? 'queen'
  const applyPromotion = opts?.applyPromotion ?? false
  const b = cloneBoard(board)
  const [fr, fc] = getCoordinatesFromSquare(from)
  const [tr, tc] = getCoordinatesFromSquare(to)
  const originalMoved = b[fr][fc]
  if (!originalMoved) return null
  const moved = { ...originalMoved }
  let captured = b[tr][tc]
  let isEnPassant = false
  let promotedTo: PieceType | undefined
  const isCastling = moved.type === 'king' && Math.abs(tc - fc) === 2

  if (isCastling) {
    applyCastlingRookMove(b, fr, fc, tc)
  }

  if (moved.type === 'pawn' && enPassantTarget && isEnPassantMove(board, from, to, enPassantTarget)) {
    const [epRow, epCol] = getCoordinatesFromSquare(enPassantTarget)
    const capRow = moved.color === 'white' ? epRow + 1 : epRow - 1
    const capCol = epCol
    captured = b[capRow][capCol]
    b[capRow][capCol] = null
    isEnPassant = true
  }

  let newPiece: ChessPiece = { ...moved, hasMoved: true }
  const willPromote =
    moved.type === 'pawn' &&
    ((moved.color === 'white' && tr === 0) || (moved.color === 'black' && tr === 7))
  if (willPromote) {
    promotedTo = promotionPiece
    if (applyPromotion) {
      newPiece = { ...newPiece, type: promotionPiece }
    }
  }

  b[tr][tc] = newPiece
  b[fr][fc] = null

  const nextRights = updateCastlingRightsForMove(rights, moved, from, to, captured || undefined)
  const nextEnPassant =
    moved.type === 'pawn' ? computeEnPassantTarget(fr, tr, fc) : null

  return {
    board: b,
    captured: captured ?? null,
    moved,
    nextRights,
    nextEnPassant,
    isEnPassant,
    isCastling,
    promotedTo,
  }
}

// Position key for repetition detection (board + turn + castling + en passant)
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
