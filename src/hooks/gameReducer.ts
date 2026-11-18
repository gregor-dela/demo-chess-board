import { GameState, GameAction } from '../types/chess'
import { createInitialBoard, createInitialCastlingRights, generatePositionKey } from '../utils/chessUtils'
import { getPieceAtSquare } from '../utils/board'
import { getValidMoves } from '../utils/moveValidation'
import { DEFAULT_BOARD_THEME } from '../utils/boardThemes'
import { applyMoveToState, undoMoveInState, redoMoveInState, createMoveFromState } from './moveStateHelpers'

/** Zaseje začetno pozicijo v `positionCounts`, da trikratno ponavljanje šteje tudi prvo pozicijo. */
export const seedPositionCounts = (state: GameState): GameState => {
  const key = generatePositionKey(
    state.board,
    state.currentPlayer,
    state.castlingRights,
    state.enPassantTarget
  )

  if (state.positionCounts?.[key]) {
    return state
  }

  return {
    ...state,
    positionCounts: {
      ...(state.positionCounts ?? {}),
      [key]: state.positionCounts?.[key] ?? 1,
    },
  }
}

// Initial game state
export const initialGameState: GameState = seedPositionCounts({
  board: createInitialBoard(),
  currentPlayer: 'white',
  moveHistory: [],
  redoHistory: [],
  gameStatus: 'active',
  selectedSquare: null,
  validMoves: [],
  isInCheck: false,
  castlingRights: createInitialCastlingRights(),
  enPassantTarget: null,
  pendingPromotion: null,
  orientation: 'whiteBottom'
  ,
  halfMoveClock: 0,
  positionCounts: {},
  mode: 'pvp',
  aiSettings: { aiPlays: 'black', depth: 3, moveTimeMs: 1200, autoAnalyze: false, style: 'balanced' },
  aiThinking: false,
  aiProgress: null,
  previewMove: null,
  boardTheme: DEFAULT_BOARD_THEME
})

// Game state reducer
export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SELECT_SQUARE': {
      if (state.gameStatus !== 'active' && state.gameStatus !== 'check') {
        return {
          ...state,
          selectedSquare: null,
          validMoves: []
        }
      }
      const { square } = action
      const piece = getPieceAtSquare(state.board, square)

      // If clicking on empty square or opponent piece while having a selection, try to move
      if (state.selectedSquare && state.validMoves.includes(square)) {
        return gameReducer(state, { type: 'MAKE_MOVE', from: state.selectedSquare, to: square })
      }

      // If clicking on own piece, select it
      if (piece && piece.color === state.currentPlayer) {
        const validMoves = getValidMoves(state.board, square, piece.color, state.castlingRights, state.enPassantTarget)
        return {
          ...state,
          selectedSquare: square,
          validMoves
        }
      }

      // Otherwise, deselect
      return {
        ...state,
        selectedSquare: null,
        validMoves: []
      }
    }

    case 'MAKE_MOVE': {
      if (state.gameStatus !== 'active' && state.gameStatus !== 'check') {
        return state
      }
      const { from, to } = action
      const piece = getPieceAtSquare(state.board, from)

      if (!piece || !state.validMoves.includes(to)) {
        return state
      }

      // Check for promotion candidate: pawn reaching back rank
      const toRank = parseInt(to[1])
      const willPromote = piece.type === 'pawn' && ((piece.color === 'white' && toRank === 8) || (piece.color === 'black' && toRank === 1))
      if (willPromote) {
        // Request promotion instead of finalizing the move now
        return {
          ...state,
          pendingPromotion: { from, to, color: piece.color },
          // Keep selection on from square for clarity
          selectedSquare: from,
        }
      }

      const move = createMoveFromState(state, from, to)
      if (!move) return state
      // Ob izvedbi poteze počisti morebitni predogled iz zgodovine.
      return { ...applyMoveToState(state, move), previewMove: null }
    }

    case 'REQUEST_PROMOTION': {
      const { from, to, color } = action
      // Allow UI to request promotion explicitly (optional entrypoint)
      return {
        ...state,
        pendingPromotion: { from, to, color },
      }
    }

    case 'COMPLETE_PROMOTION': {
      const pp = state.pendingPromotion
      if (!pp) return state
      const move = createMoveFromState(state, pp.from, pp.to, action.piece)
      if (!move) return { ...state, pendingPromotion: null }
      return { ...applyMoveToState(state, move), pendingPromotion: null, previewMove: null }
    }

    case 'CANCEL_PROMOTION': {
      return {
        ...state,
        pendingPromotion: null,
        // Clear any selection/valid moves to reduce confusion
        selectedSquare: null,
        validMoves: [],
      }
    }

    case 'RESET_GAME':
      // Nova igra obdrži izbrano barvno temo plošče (uporabniška nastavitev).
      return { ...initialGameState, boardTheme: state.boardTheme }

    case 'TOGGLE_ORIENTATION': {
      const next = state.orientation === 'whiteBottom' ? 'blackBottom' : 'whiteBottom'
      return { ...state, orientation: next }
    }
    case 'TOGGLE_MODE': {
      const next = (state.mode ?? 'pvp') === 'pvai' ? 'pvp' : 'pvai'
      return { ...state, mode: next }
    }
    case 'SET_AI_SETTINGS': {
      return { ...state, aiSettings: { ...(state.aiSettings ?? { aiPlays: 'black' }), ...action.settings } }
    }

    case 'UNDO_MOVE': {
      if (state.moveHistory.length === 0) return state
      const lastMove = state.moveHistory[state.moveHistory.length - 1]
      // Predogled iz zgodovine ni več smiseln po spremembi zgodovine.
      return { ...undoMoveInState(state, lastMove), previewMove: null }
    }

    case 'REDO_MOVE': {
      if (state.redoHistory.length === 0) return state
      const moveToRedo = state.redoHistory[state.redoHistory.length - 1]
      return { ...redoMoveInState(state, moveToRedo), previewMove: null }
    }

    case 'SET_VALID_MOVES':
      return {
        ...state,
        validMoves: action.moves
      }

    case 'UPDATE_GAME_STATUS':
      return {
        ...state,
        gameStatus: action.status
      }
    case 'SET_AI_THINKING':
      return {
        ...state,
        aiThinking: action.value,
        // Ob koncu razmišljanja počisti napredek, da kartica ne ostane vidna.
        aiProgress: action.value ? state.aiProgress : null
      }
    case 'SET_AI_PROGRESS':
      return {
        ...state,
        aiProgress: action.progress
      }
    case 'SET_PREVIEW_MOVE':
      return {
        ...state,
        previewMove: action.move
      }
    case 'SET_BOARD_THEME':
      return {
        ...state,
        boardTheme: action.theme
      }

    default:
      return state
  }
}
