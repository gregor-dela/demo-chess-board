import { GameState, GameStatus, Move, PieceColor, PieceType, Square } from '../types/chess'
import {
  buildMoveRecord,
  computeEnPassantTarget,
  cloneBoard,
  generateAlgebraicNotation,
  generatePositionKey,
  getCoordinatesFromSquare,
  getPieceAtSquare,
  getSquareFromCoordinates,
  applyCastlingRookMove,
  undoCastlingRookMove,
  updateCastlingRightsForMove,
} from '../utils/chessUtils'
import { computeGameStatus, isEnPassantMove } from '../utils/moveValidation'

/**
 * Zgradi popoln zapis poteze (Move) iz trenutnega stanja in koordinat.
 * Vsebuje vse `prevXxx` vrednosti, potrebne za kasnejši undo.
 * Vrne `null`, kadar na izvornem polju ni figure.
 */
export const createMoveFromState = (
  state: GameState,
  from: Square,
  to: Square,
  promotion?: PieceType
): Move | null => {
  const piece = getPieceAtSquare(state.board, from)
  if (!piece) return null

  const isEnPassant = isEnPassantMove(state.board, from, to, state.enPassantTarget)
  const [fromRow] = getCoordinatesFromSquare(from)
  const [toRow, toCol] = getCoordinatesFromSquare(to)
  const enPassantCaptureSquare = isEnPassant ? getSquareFromCoordinates(fromRow, toCol) : undefined
  const captured = isEnPassant
    ? (enPassantCaptureSquare ? getPieceAtSquare(state.board, enPassantCaptureSquare) : null)
    : state.board[toRow][toCol]

  return buildMoveRecord({
    from,
    to,
    piece,
    captured: captured || undefined,
    prevHasMoved: piece.hasMoved,
    prevCapturedHasMoved: captured ? captured.hasMoved : undefined,
    prevCastlingRights: state.castlingRights,
    prevEnPassantTarget: state.enPassantTarget,
    isEnPassant: isEnPassant || undefined,
    enPassantCaptureSquare,
    promotion,
    prevHalfMoveClock: state.halfMoveClock,
    prevPositionCounts: state.positionCounts,
  })
}

/**
 * Skupna jedrna logika premika: premakne figuro, izvede castling/en passant/promocijo,
 * posodobi pravice, pol ure, števec ponovitev in status. Uporabljata jo apply in redo.
 */
const applyMoveCore = (state: GameState, move: Move): GameState => {
  const board = cloneBoard(state.board)
  const [fromRow, fromCol] = getCoordinatesFromSquare(move.from)
  const [toRow, toCol] = getCoordinatesFromSquare(move.to)
  const isCastling = move.piece.type === 'king' && Math.abs(toCol - fromCol) === 2

  // En passant: odstrani zajetega kmeta z njegovega (ne ciljnega) polja
  if (move.isEnPassant && move.enPassantCaptureSquare) {
    const [capRow, capCol] = getCoordinatesFromSquare(move.enPassantCaptureSquare)
    board[capRow][capCol] = null
  }

  const placedType = move.promotion ?? move.piece.type
  board[toRow][toCol] = { type: placedType, color: move.piece.color, hasMoved: true }
  board[fromRow][fromCol] = null

  if (isCastling) {
    applyCastlingRookMove(board, fromRow, fromCol, toCol)
  }

  const nextEnPassantTarget = move.piece.type === 'pawn'
    ? computeEnPassantTarget(fromRow, toRow, fromCol)
    : null
  const nextCastlingRights = updateCastlingRightsForMove(
    state.castlingRights,
    move.piece,
    move.from,
    move.to,
    move.captured ?? null
  )

  const opponent: PieceColor = state.currentPlayer === 'white' ? 'black' : 'white'
  const computedStatus = computeGameStatus(board, opponent, nextCastlingRights, nextEnPassantTarget)
  const didCapture = !!move.captured
  const newHalfMoveClock = move.piece.type === 'pawn' || move.promotion || didCapture
    ? 0
    : (state.halfMoveClock ?? 0) + 1

  const key = generatePositionKey(board, opponent, nextCastlingRights, nextEnPassantTarget)
  const newCounts = { ...(state.positionCounts ?? {}) }
  newCounts[key] = (newCounts[key] ?? 0) + 1
  const isDraw = newCounts[key] >= 3 || newHalfMoveClock >= 100
  const finalStatus: GameStatus = isDraw ? 'draw' : computedStatus
  const notation = generateAlgebraicNotation(state.board, move, finalStatus)

  return {
    ...state,
    board,
    currentPlayer: opponent,
    moveHistory: [...state.moveHistory, { ...move, notation }],
    redoHistory: [],
    selectedSquare: null,
    validMoves: [],
    isInCheck: computedStatus === 'check' || computedStatus === 'checkmate',
    gameStatus: finalStatus,
    castlingRights: nextCastlingRights,
    enPassantTarget: nextEnPassantTarget,
    halfMoveClock: newHalfMoveClock,
    positionCounts: newCounts,
  }
}

/** Izvede potezo na stanju (kot MAKE_MOVE / COMPLETE_PROMOTION). */
export const applyMoveToState = (state: GameState, move: Move): GameState => applyMoveCore(state, move)

/**
 * Inverz apply: restori vse vrednosti iz `move.prevXxx` in premakne potezo v redo zgodovino.
 */
export const undoMoveInState = (state: GameState, move: Move): GameState => {
  const board = cloneBoard(state.board)
  const [fromRow, fromCol] = getCoordinatesFromSquare(move.from)
  const [toRow, toCol] = getCoordinatesFromSquare(move.to)
  const wasCastling = move.piece.type === 'king' && Math.abs(toCol - fromCol) === 2

  board[fromRow][fromCol] = { ...move.piece, hasMoved: move.prevHasMoved }

  if (move.isEnPassant && move.enPassantCaptureSquare && move.captured) {
    board[toRow][toCol] = null
    const [capRow, capCol] = getCoordinatesFromSquare(move.enPassantCaptureSquare)
    board[capRow][capCol] = { ...move.captured, hasMoved: move.prevCapturedHasMoved ?? move.captured.hasMoved }
  } else if (move.captured) {
    board[toRow][toCol] = { ...move.captured, hasMoved: move.prevCapturedHasMoved ?? move.captured.hasMoved }
  } else {
    board[toRow][toCol] = null
  }

  if (wasCastling) {
    undoCastlingRookMove(board, fromRow, fromCol, toCol)
  }

  const previousPlayer: PieceColor = state.currentPlayer === 'white' ? 'black' : 'white'
  const prevRights = move.prevCastlingRights
  const prevEnPassant = move.prevEnPassantTarget ?? null
  const statusBase = computeGameStatus(board, previousPlayer, prevRights, prevEnPassant)

  const key = generatePositionKey(board, previousPlayer, prevRights, prevEnPassant)
  const counts = move.prevPositionCounts ?? {}
  const isDraw = (counts[key] ?? 0) >= 3 || (move.prevHalfMoveClock ?? 0) >= 100
  const finalStatus: GameStatus = isDraw ? 'draw' : statusBase

  return {
    ...state,
    board,
    currentPlayer: previousPlayer,
    moveHistory: state.moveHistory.slice(0, -1),
    redoHistory: [...state.redoHistory, move],
    selectedSquare: null,
    validMoves: [],
    isInCheck: statusBase === 'check' || statusBase === 'checkmate',
    gameStatus: finalStatus,
    castlingRights: prevRights,
    enPassantTarget: prevEnPassant,
    halfMoveClock: move.prevHalfMoveClock ?? 0,
    positionCounts: move.prevPositionCounts ?? {},
  }
}

/** Ponovno izvede potezo iz redo zgodovine (inverz undo). */
export const redoMoveInState = (state: GameState, move: Move): GameState => ({
  ...applyMoveCore(state, move),
  redoHistory: state.redoHistory.slice(0, -1),
})
