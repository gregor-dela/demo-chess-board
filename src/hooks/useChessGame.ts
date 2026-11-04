import { useReducer, useCallback, useEffect, useRef } from 'react'
import { GameState, GameAction, Square } from '../types/chess'
import { createInitialBoard, getPieceAtSquare, isValidSquare, createInitialCastlingRights, generatePositionKey } from '../utils/chessUtils'
import { getValidMoves } from '../utils/moveValidation'
import { applyMoveToState, undoMoveInState, redoMoveInState, createMoveFromState } from './moveStateHelpers'
import { computeBestMove, resetTranspositionTable } from '../engine/ai'

const seedPositionCounts = (state: GameState): GameState => {
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
  aiThinking: false
})

// Game state reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
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
      return applyMoveToState(state, move)
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
      return { ...applyMoveToState(state, move), pendingPromotion: null }
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
      return initialGameState
    
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
      return undoMoveInState(state, lastMove)
    }
    
    case 'REDO_MOVE': {
      if (state.redoHistory.length === 0) return state
      const moveToRedo = state.redoHistory[state.redoHistory.length - 1]
      return redoMoveInState(state, moveToRedo)
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
        aiThinking: action.value
      }
    
    default:
      return state
  }
}

// Custom hook for chess game logic
export const useChessGame = (initialState: GameState = initialGameState) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialState, seedPositionCounts)
  const aiBusyRef = useRef(false)
  const aiVersionRef = useRef(0)

  const bumpAiVersion = useCallback(() => {
    aiVersionRef.current += 1
  }, [])
  
  const handleSquareClick = useCallback((square: Square) => {
    if (!isValidSquare(square)) return
    dispatch({ type: 'SELECT_SQUARE', square })
  }, [])
  
  const handlePieceDrop = useCallback((from: Square, to: Square) => {
    if (!isValidSquare(from) || !isValidSquare(to)) {
      console.error('Invalid move attempt: invalid square format', { from, to })
      return
    }
    if (from === to) {
      console.error('Invalid move attempt: source and destination squares are the same', { from, to })
      return
    }
    dispatch({ type: 'MAKE_MOVE', from, to })
  }, [])
  
  const resetGame = useCallback(() => {
    bumpAiVersion()
    resetTranspositionTable()
    dispatch({ type: 'RESET_GAME' })
  }, [bumpAiVersion])
  
  const undoMove = useCallback(() => {
    bumpAiVersion()
    dispatch({ type: 'UNDO_MOVE' })
  }, [bumpAiVersion])
  
  const redoMove = useCallback(() => {
    bumpAiVersion()
    dispatch({ type: 'REDO_MOVE' })
  }, [bumpAiVersion])

  const completePromotion = useCallback((piece: 'queen' | 'rook' | 'bishop' | 'knight') => {
    bumpAiVersion()
    dispatch({ type: 'COMPLETE_PROMOTION', piece })
  }, [bumpAiVersion])

  const cancelPromotion = useCallback(() => {
    bumpAiVersion()
    dispatch({ type: 'CANCEL_PROMOTION' })
  }, [bumpAiVersion])
  
  const toggleOrientation = useCallback(() => {
    dispatch({ type: 'TOGGLE_ORIENTATION' })
  }, [])

  const toggleMode = useCallback(() => {
    bumpAiVersion()
    resetTranspositionTable()
    dispatch({ type: 'TOGGLE_MODE' })
  }, [bumpAiVersion])

  const setAiSettings = useCallback((settings: Partial<NonNullable<GameState['aiSettings']>>) => {
    bumpAiVersion()
    resetTranspositionTable()
    dispatch({ type: 'SET_AI_SETTINGS', settings })
  }, [bumpAiVersion])
  
  const requestAiMove = useCallback(async () => {
    if (gameState.mode !== 'pvai') return
    if (gameState.gameStatus !== 'active' && gameState.gameStatus !== 'check') return
    if (gameState.currentPlayer !== (gameState.aiSettings?.aiPlays ?? 'black')) return
    if (aiBusyRef.current) return
    const versionAtRequest = aiVersionRef.current
    aiBusyRef.current = true
    dispatch({ type: 'SET_AI_THINKING', value: true })
    try {
      const best = await computeBestMove(gameState, gameState.aiSettings?.depth ?? 3, gameState.aiSettings?.moveTimeMs ?? 1000)
      if (aiVersionRef.current !== versionAtRequest) {
        return
      }
      if (best) {
        dispatch({ type: 'SELECT_SQUARE', square: best.from })
        dispatch({ type: 'MAKE_MOVE', from: best.from, to: best.to })
      }
    } finally {
      if (aiVersionRef.current === versionAtRequest) {
        dispatch({ type: 'SET_AI_THINKING', value: false })
      }
      aiBusyRef.current = false
    }
  }, [gameState])
  
  useEffect(() => {
    requestAiMove()
  }, [requestAiMove])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undoMove()
      } else if ((key === 'y') || (key === 'z' && e.shiftKey)) {
        e.preventDefault()
        redoMove()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undoMove, redoMove])
  
  return {
    gameState,
    handleSquareClick,
    handlePieceDrop,
    resetGame,
    undoMove,
    redoMove,
    completePromotion,
    cancelPromotion,
    toggleOrientation,
    toggleMode,
    setAiSettings,
    requestAiMove,
  }
}
