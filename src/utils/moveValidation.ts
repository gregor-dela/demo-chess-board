import { Board, ChessPiece, Square, PieceColor, CastlingRights, GameStatus } from '../types/chess'
import {
  getCoordinatesFromSquare,
  getSquareFromCoordinates,
  isValidSquare,
  isEmptySquare,
  isOpponentPiece,
  isOwnPiece,
  BOARD_SIZE,
  getPieceAtSquare
} from './chessUtils'

// Get all valid moves for a piece at a given square
export const getValidMoves = (board: Board, square: Square, color: PieceColor, castlingRights?: CastlingRights, enPassantTarget?: Square | null): Square[] => {
  if (!board) return []
  if (!isValidSquare(square)) return []
  
  const piece = getPieceAtSquare(board, square)
  if (!piece || piece.color !== color) return []

  let moves: Square[] = []
  switch (piece.type) {
    case 'pawn':
      moves = getPawnMoves(board, square, piece.color, enPassantTarget)
      break
    case 'rook':
      moves = getRookMoves(board, square, piece.color)
      break
    case 'knight':
      moves = getKnightMoves(board, square, piece.color)
      break
    case 'bishop':
      moves = getBishopMoves(board, square, piece.color)
      break
    case 'queen':
      moves = getQueenMoves(board, square, piece.color)
      break
    case 'king':
      moves = getKingMoves(board, square, piece.color, castlingRights)
      break
    default:
      moves = []
  }

  // Filter out moves that would leave own king in check
  return moves.filter((to) => isMoveLegal(board, square, to, piece.color, enPassantTarget))
}

// Pawn movement logic with en passant support
export const getPawnMoves = (board: Board, square: Square, color: PieceColor, enPassantTarget?: Square | null): Square[] => {
  const piece = getPieceAtSquare(board, square)
  if (!piece || piece.color !== color || piece.type !== 'pawn') {
    return []
  }
  
  const moves: Square[] = []
  const [row, col] = getCoordinatesFromSquare(square)
  const direction = piece.color === 'white' ? -1 : 1
  const startRow = piece.color === 'white' ? 6 : 1
  
  // Forward move
  const oneForward = getSquareFromCoordinates(row + direction, col)
  if (isValidSquare(oneForward) && isEmptySquare(board, oneForward)) {
    moves.push(oneForward)
    
    // Two squares forward from starting position
    if (row === startRow) {
      const twoForward = getSquareFromCoordinates(row + 2 * direction, col)
      if (isValidSquare(twoForward) && isEmptySquare(board, twoForward)) {
        moves.push(twoForward)
      }
    }
  }
  
  // Diagonal captures
  const captureLeft = getSquareFromCoordinates(row + direction, col - 1)
  const captureRight = getSquareFromCoordinates(row + direction, col + 1)
  
  if (isValidSquare(captureLeft) && isOpponentPiece(board, captureLeft, piece.color)) {
    moves.push(captureLeft)
  }
  
  if (isValidSquare(captureRight) && isOpponentPiece(board, captureRight, piece.color)) {
    moves.push(captureRight)
  }
  
  // En passant capture
  if (enPassantTarget) {
    const enPassantRank = piece.color === 'white' ? 3 : 4 // 5th rank for white (index 3), 4th rank for black (index 4)
    if (row === enPassantRank) {
      const [enPassantRow, enPassantCol] = getCoordinatesFromSquare(enPassantTarget)
      // Check if en passant target is diagonally adjacent
      if (enPassantRow === row + direction && Math.abs(enPassantCol - col) === 1) {
        moves.push(enPassantTarget)
      }
    }
  }
  
  return moves
}

// Pawn attack generator (for check detection): diagonals only, occupancy-agnostic
const getPawnAttacks = (square: Square, piece: ChessPiece): Square[] => {
  const attacks: Square[] = []
  const [row, col] = getCoordinatesFromSquare(square)
  const direction = piece.color === 'white' ? -1 : 1
  const diagLeft = getSquareFromCoordinates(row + direction, col - 1)
  const diagRight = getSquareFromCoordinates(row + direction, col + 1)
  if (isValidSquare(diagLeft)) attacks.push(diagLeft)
  if (isValidSquare(diagRight)) attacks.push(diagRight)
  return attacks
}

// Sliding piece movement core (DRY for rook/bishop/queen)
export const slidingMoves = (
  board: Board,
  square: Square,
  color: PieceColor,
  directions: Array<[number, number]>
): Square[] => {
  const out: Square[] = []
  const [row, col] = getCoordinatesFromSquare(square)
  for (const [dRow, dCol] of directions) {
    for (let i = 1; i < BOARD_SIZE; i++) {
      const s = getSquareFromCoordinates(row + i * dRow, col + i * dCol)
      if (!isValidSquare(s)) break
      if (isEmptySquare(board, s)) {
        out.push(s)
        continue
      }
      if (isOpponentPiece(board, s, color)) out.push(s)
      break
    }
  }
  return out
}

// Rook movement logic
export const getRookMoves = (board: Board, square: Square, color: PieceColor): Square[] => {
  const piece = getPieceAtSquare(board, square)
  if (!piece || piece.color !== color || piece.type !== 'rook') {
    return []
  }
  return slidingMoves(board, square, piece.color, [[0, 1], [0, -1], [1, 0], [-1, 0]])
}

// Knight movement logic
export const getKnightMoves = (board: Board, square: Square, color: PieceColor): Square[] => {
  const piece = getPieceAtSquare(board, square)
  if (!piece || piece.color !== color || piece.type !== 'knight') {
    return []
  }
  
  const moves: Square[] = []
  const [row, col] = getCoordinatesFromSquare(square)
  
  // Knight moves in L-shape
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ]
  
  for (const [dRow, dCol] of knightMoves) {
    const newSquare = getSquareFromCoordinates(row + dRow, col + dCol)
    
    if (isValidSquare(newSquare) && !isOwnPiece(board, newSquare, piece.color)) {
      moves.push(newSquare)
    }
  }
  
  return moves
}

// Bishop movement logic
export const getBishopMoves = (board: Board, square: Square, color: PieceColor): Square[] => {
  const piece = getPieceAtSquare(board, square)
  if (!piece || piece.color !== color || piece.type !== 'bishop') {
    return []
  }
  return slidingMoves(board, square, piece.color, [[1, 1], [1, -1], [-1, 1], [-1, -1]])
}

// Queen movement logic (combination of rook and bishop)
export const getQueenMoves = (board: Board, square: Square, color: PieceColor): Square[] => {
  const piece = getPieceAtSquare(board, square)
  if (!piece || piece.color !== color || piece.type !== 'queen') {
    return []
  }
  return slidingMoves(
    board,
    square,
    piece.color,
    [
      [0, 1], [0, -1], [1, 0], [-1, 0], // rook directions
      [1, 1], [1, -1], [-1, 1], [-1, -1] // bishop directions
    ]
  )
}

// King movement logic with castling support
export const getKingMoves = (board: Board, square: Square, color: PieceColor, castlingRights?: CastlingRights): Square[] => {
  const piece = getPieceAtSquare(board, square)
  if (!piece || piece.color !== color || piece.type !== 'king') {
    return []
  }
  
  const moves: Square[] = []
  const [row, col] = getCoordinatesFromSquare(square)
  
  // King moves one square in any direction
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ]
  
  for (const [dRow, dCol] of directions) {
    const newSquare = getSquareFromCoordinates(row + dRow, col + dCol)
    
    if (isValidSquare(newSquare) && !isOwnPiece(board, newSquare, piece.color)) {
      moves.push(newSquare)
    }
  }
  
  // Add castling moves if castling rights are provided and king hasn't moved
  if (castlingRights && !piece.hasMoved) {
    const color = piece.color
    const kingRow = color === 'white' ? 7 : 0
    const kingCol = 4 // e-file
    
    // Verify king is on starting square
    if (row === kingRow && col === kingCol) {
      // King-side castling
      if (castlingRights[color].kingSide) {
        const rookSquare = color === 'white' ? 'h1' : 'h8'
        const rook = getPieceAtSquare(board, rookSquare)
        
        if (rook && rook.type === 'rook' && rook.color === color && !rook.hasMoved) {
          // Check if squares between king and rook are empty
          const f = getSquareFromCoordinates(kingRow, 5) // f-file
          const g = getSquareFromCoordinates(kingRow, 6) // g-file
          
          if (isEmptySquare(board, f) && isEmptySquare(board, g)) {
            // Check if king doesn't move through check
            if (!isKingInCheck(board, color, square) && 
                !isKingInCheck(board, color, f) && 
                !isKingInCheck(board, color, g)) {
              moves.push(g) // King moves to g-file for king-side castling
            }
          }
        }
      }
      
      // Queen-side castling
      if (castlingRights[color].queenSide) {
        const rookSquare = color === 'white' ? 'a1' : 'a8'
        const rook = getPieceAtSquare(board, rookSquare)
        
        if (rook && rook.type === 'rook' && rook.color === color && !rook.hasMoved) {
          // Check if squares between king and rook are empty
          const b = getSquareFromCoordinates(kingRow, 1) // b-file
          const c = getSquareFromCoordinates(kingRow, 2) // c-file
          const d = getSquareFromCoordinates(kingRow, 3) // d-file
          
          if (isEmptySquare(board, b) && isEmptySquare(board, c) && isEmptySquare(board, d)) {
            // Check if king doesn't move through check
            if (!isKingInCheck(board, color, square) && 
                !isKingInCheck(board, color, d) && 
                !isKingInCheck(board, color, c)) {
              moves.push(c) // King moves to c-file for queen-side castling
            }
          }
        }
      }
    }
  }
  
  return moves
}

// Helper: locate king position for a given color
export const findKingPosition = (board: Board, color: PieceColor): Square | null => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c]
      if (cell && cell.type === 'king' && cell.color === color) {
        return getSquareFromCoordinates(r, c)
      }
    }
  }
  return null
}

// Helper functions for attack detection (no piece validation)
const getKnightAttacks = (board: Board, square: Square, color: PieceColor): Square[] => {
  const moves: Square[] = []
  const [row, col] = getCoordinatesFromSquare(square)
  
  // Knight moves in L-shape
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ]
  
  for (const [dRow, dCol] of knightMoves) {
    const newSquare = getSquareFromCoordinates(row + dRow, col + dCol)
    
    if (isValidSquare(newSquare) && !isOwnPiece(board, newSquare, color)) {
      moves.push(newSquare)
    }
  }
  
  return moves
}

const getKingAttacks = (board: Board, square: Square, color: PieceColor): Square[] => {
  const moves: Square[] = []
  const [row, col] = getCoordinatesFromSquare(square)
  
  // King moves one square in any direction
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ]
  
  for (const [dRow, dCol] of directions) {
    const newSquare = getSquareFromCoordinates(row + dRow, col + dCol)
    
    if (isValidSquare(newSquare) && !isOwnPiece(board, newSquare, color)) {
      moves.push(newSquare)
    }
  }
  
  return moves
}

// Determine if a king of a given color is in check
export const isKingInCheck = (board: Board, color: PieceColor, kingSquare?: Square | null): boolean => {
  const kingPos = kingSquare ?? findKingPosition(board, color)
  if (!kingPos) return false

  // Scan opponent pieces and see if any attack the king square using pseudo-legal move generators
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c]
      if (!piece || piece.color === color) continue
      const from = getSquareFromCoordinates(r, c)
      let attacks: Square[] = []
      switch (piece.type) {
        case 'pawn':
          attacks = getPawnAttacks(from, piece)
          break
        case 'rook':
          attacks = slidingMoves(board, from, piece.color, [[0, 1], [0, -1], [1, 0], [-1, 0]])
          break
        case 'knight':
          attacks = getKnightAttacks(board, from, piece.color)
          break
        case 'bishop':
          attacks = slidingMoves(board, from, piece.color, [[1, 1], [1, -1], [-1, 1], [-1, -1]])
          break
        case 'queen':
          attacks = slidingMoves(board, from, piece.color, [
            [0, 1], [0, -1], [1, 0], [-1, 0], // rook directions
            [1, 1], [1, -1], [-1, 1], [-1, -1] // bishop directions
          ])
          break
        case 'king':
          attacks = getKingAttacks(board, from, piece.color)
          break
      }
      if (attacks.includes(kingPos)) return true
    }
  }
  return false
}

// Validate that making a move does not leave own king in check
export const isMoveLegal = (board: Board, from: Square, to: Square, color: PieceColor, enPassantTarget?: Square | null): boolean => {
  const piece = getPieceAtSquare(board, from)
  if (!piece || piece.color !== color) return false
  
  // Simulate the move on a shallow-cloned board
  const temp: Board = board.map(row => row.map(cell => (cell ? { ...cell } : null)))
  const [fromRow, fromCol] = getCoordinatesFromSquare(from)
  const [toRow, toCol] = getCoordinatesFromSquare(to)

  // Handle en passant capture removal in simulation
  if (enPassantTarget && piece.type === 'pawn' && isEnPassantMove(board, from, to, enPassantTarget)) {
    const [epRow, epCol] = getCoordinatesFromSquare(enPassantTarget)
    const captureRow = piece.color === 'white' ? epRow + 1 : epRow - 1
    // Remove the captured pawn from its original square
    temp[captureRow][epCol] = null
  }

  temp[toRow][toCol] = { ...piece }
  temp[fromRow][fromCol] = null
  return !isKingInCheck(temp, piece.color)
}

// New: determine if a player has any legal moves available
export const hasAnyLegalMoves = (board: Board, color: PieceColor, castlingRights?: CastlingRights, enPassantTarget?: Square | null): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c]
      if (!piece || piece.color !== color) continue
      const from = getSquareFromCoordinates(r, c)
      const moves = getValidMoves(board, from, piece.color, castlingRights, enPassantTarget)
      if (moves.length > 0) return true
    }
  }
  return false
}

// New: checkmate detection
export const isCheckmate = (board: Board, color: PieceColor, castlingRights?: CastlingRights, enPassantTarget?: Square | null): boolean => {
  if (!isKingInCheck(board, color)) return false
  return !hasAnyLegalMoves(board, color, castlingRights, enPassantTarget)
}

// New: stalemate detection
export const isStalemate = (board: Board, color: PieceColor, castlingRights?: CastlingRights, enPassantTarget?: Square | null): boolean => {
  if (isKingInCheck(board, color)) return false
  return !hasAnyLegalMoves(board, color, castlingRights, enPassantTarget)
}

// FIDE dead position rule: insufficient mating material -> draw (Article 5.2.b / 9.6)
// Cases: K v K; K+B v K; K+N v K; K+B v K+B same square color bishops only
// If any pawn/rook/queen remains OR >2 minor pieces OR bishops on different colors -> NOT dead
export const isInsufficientMaterial = (board: Board): boolean => {
  const nonKings: { piece: ChessPiece; row: number; col: number }[] = []

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c]
      if (!p) continue
      if (p.type === 'king') continue
      // Pawn, rook, queen can mate (or promote) -> never dead draw by material
      if (p.type === 'pawn' || p.type === 'rook' || p.type === 'queen') return false
      nonKings.push({ piece: p, row: r, col: c })
    }
  }

  const n = nonKings.length
  if (n === 0) return true // K v K
  if (n === 1) return true // K+B v K ali K+N v K
  if (n === 2) {
    // K+B v K+B na isti barvi kvadratov -> draw
    const bishopsOnly = nonKings.every(x => x.piece.type === 'bishop')
    if (bishopsOnly) {
      const [a, b] = nonKings
      const sqColorA = (a.row + a.col) % 2 === 0 ? 'light' : 'dark'
      const sqColorB = (b.row + b.col) % 2 === 0 ? 'light' : 'dark'
      if (sqColorA === sqColorB) return true
    }
  }
  return false
}

// Centralized game status computation (active/check/checkmate/stalemate/draw)
export const computeGameStatus = (
  board: Board,
  nextToMove: PieceColor,
  castlingRights?: CastlingRights,
  enPassantTarget?: Square | null
): GameStatus => {
  // FIDE dead position: insufficient material -> always draw, regardless of turn/check
  if (isInsufficientMaterial(board)) return 'draw'

  const inCheck = isKingInCheck(board, nextToMove)
  const base = isCheckmate(board, nextToMove, castlingRights, enPassantTarget)
    ? 'checkmate'
    : isStalemate(board, nextToMove, castlingRights, enPassantTarget)
      ? 'stalemate'
      : 'active'
  return base !== 'active' ? base : (inCheck ? 'check' : 'active')
}

// En passant utility function
export const isEnPassantMove = (board: Board, from: Square, to: Square, enPassantTarget: Square | null): boolean => {
  if (!enPassantTarget || to !== enPassantTarget) return false
  
  const piece = getPieceAtSquare(board, from)
  if (!piece || piece.type !== 'pawn') return false
  
  const [fromRow, fromCol] = getCoordinatesFromSquare(from)
  const [toRow, toCol] = getCoordinatesFromSquare(to)
  const direction = piece.color === 'white' ? -1 : 1
  const enPassantRank = piece.color === 'white' ? 3 : 4
  
  // Verify pawn is on correct rank and moving diagonally
  return fromRow === enPassantRank && 
         toRow === fromRow + direction && 
         Math.abs(toCol - fromCol) === 1
}
