import { Board, ChessPiece, PieceColor, Square } from '../types/chess'

// Board geometry (single source of truth for size and Square <-> coordinate math)
export const BOARD_SIZE = 8

const FILE_A_CODE = 'a'.charCodeAt(0)

// 0-based column index -> file letter (0 -> 'a')
const fileFromCol = (col: number): string => String.fromCharCode(FILE_A_CODE + col)

// File letter -> 0-based column index ('a' -> 0)
const colFromFile = (file: string): number => file.charCodeAt(0) - FILE_A_CODE

// Get square color (light or dark)
// Standard: a1 (white's corner) is dark; queen always starts on its own color
export const getSquareColor = (file: string, rank: number): 'light' | 'dark' => {
  const fileIndex = colFromFile(file)
  return (fileIndex + rank) % 2 === 0 ? 'light' : 'dark'
}

// Convert square notation to [row, col] board-array coordinates
export const getCoordinatesFromSquare = (square: Square): [number, number] => {
  const col = colFromFile(square[0])
  const rank = parseInt(square[1], 10)
  return [BOARD_SIZE - rank, col]
}

// Convert [row, col] board-array coordinates to square notation
export const getSquareFromCoordinates = (row: number, col: number): Square => {
  return `${fileFromCol(col)}${BOARD_SIZE - row}` as Square
}

// Check if a square is within board bounds
export const isValidSquare = (square: Square): boolean => {
  if (square.length !== 2) return false
  const file = square[0]
  const rank = parseInt(square[1], 10)
  const maxFile = fileFromCol(BOARD_SIZE - 1)
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

// Clone the board shallowly (rows + cell references)
export const cloneBoard = (board: Board): Board => board.map(row => row.slice())
