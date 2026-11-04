import { BOARD_SIZE, getCoordinatesFromSquare } from '../utils/board'
import type { Board, ChessPiece, GameState, Square } from '../types/chess'

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null))
}

export function baseGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 'white',
    moveHistory: [],
    redoHistory: [],
    gameStatus: 'active',
    selectedSquare: null,
    validMoves: [],
    isInCheck: false,
    castlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    },
    enPassantTarget: null,
    orientation: 'whiteBottom',
    ...overrides,
  }
}

export function coordsFromSquare(square: Square): [number, number] {
  return getCoordinatesFromSquare(square)
}

export function setPiece(board: Board, square: Square, piece: ChessPiece | null): void {
  const [r, c] = getCoordinatesFromSquare(square)
  board[r][c] = piece
}

export function getPiece(board: Board, square: Square): ChessPiece | null {
  const [r, c] = getCoordinatesFromSquare(square)
  return board[r][c]
}
