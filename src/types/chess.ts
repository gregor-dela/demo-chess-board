// Core game types
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';
export type Square = string; // e.g., 'e4', 'a1'
export type GameStatus = 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw';
export type BoardOrientation = 'whiteBottom' | 'blackBottom';
export type GameMode = 'pvp' | 'pvai';

// Piece interface
export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean;
}

// Castling rights
export interface CastlingRights {
  white: { kingSide: boolean; queenSide: boolean };
  black: { kingSide: boolean; queenSide: boolean };
}

// Move interface
export interface Move {
  from: Square;
  to: Square;
  piece: ChessPiece;
  notation: string;
  timestamp: Date;
  captured?: ChessPiece;
  // State before the move (for correct undo)
  prevHasMoved: boolean;
  prevCapturedHasMoved?: boolean;
  prevCastlingRights: CastlingRights;
  // En passant tracking
  isEnPassant?: boolean;
  enPassantCaptureSquare?: Square; // Square where captured pawn was located
  prevEnPassantTarget?: Square | null; // Previous en passant target for undo
  // Promotion tracking
  promotion?: PieceType;
  // Draw tracking
  prevHalfMoveClock?: number;
  prevPositionCounts?: Record<string, number>;
}

// Board state (8x8 array)
export type Board = (ChessPiece | null)[][];

// Game state interface
export interface PendingPromotion {
  from: Square;
  to: Square;
  color: PieceColor;
}

export interface GameState {
  board: Board;
  currentPlayer: PieceColor;
  moveHistory: Move[];
  redoHistory: Move[];
  gameStatus: GameStatus;
  selectedSquare: Square | null;
  validMoves: Square[];
  isInCheck: boolean;
  castlingRights: CastlingRights;
  enPassantTarget: Square | null; // Target square for en passant capture
  pendingPromotion: PendingPromotion | null;
  orientation: BoardOrientation;
  halfMoveClock?: number;
  positionCounts?: Record<string, number>;
  mode?: GameMode;
  aiSettings?: {
    aiPlays: PieceColor;
    depth?: number;
    moveTimeMs?: number;
    autoAnalyze?: boolean;
    style?: 'aggressive' | 'positional' | 'balanced';
  };
  aiThinking?: boolean;
}

// Component props interfaces
export interface ChessBoardProps {
  gameState: GameState;
  onSquareClick: (square: Square) => void;
  onPieceDrop: (from: Square, to: Square) => void;
}

export interface ChessPieceProps {
  piece: ChessPiece;
  square: Square;
  isSelected: boolean;
  isValidMove: boolean;
  onDragStart: (square: Square) => void;
  onDragEnd: (from: Square, to: Square) => void;
}

export interface GameControlsProps {
  gameState: GameState;
  onResetGame: () => void;
  onUndoMove: () => void;
  onRedoMove: () => void;
  onToggleOrientation: () => void;
  onToggleMode: () => void;
  onSetAiSettings: (settings: Partial<NonNullable<GameState['aiSettings']>>) => void;
}


// Chess logic utility types
export interface MoveValidationResult {
  isValid: boolean;
  reason?: string;
  wouldBeInCheck?: boolean;
}

export interface SquareInfo {
  file: string; // a-h
  rank: number; // 1-8
  color: 'light' | 'dark';
  coordinates: [number, number]; // [row, col] in array
}

// State management actions
export type GameAction = 
  | { type: 'SELECT_SQUARE'; square: Square }
  | { type: 'MAKE_MOVE'; from: Square; to: Square }
  | { type: 'REQUEST_PROMOTION'; from: Square; to: Square; color: PieceColor }
  | { type: 'COMPLETE_PROMOTION'; piece: Exclude<PieceType, 'king' | 'pawn'> }
  | { type: 'CANCEL_PROMOTION' }
  | { type: 'RESET_GAME' }
  | { type: 'UNDO_MOVE' }
  | { type: 'REDO_MOVE' }
  | { type: 'SET_VALID_MOVES'; moves: Square[] }
  | { type: 'UPDATE_GAME_STATUS'; status: GameStatus }
  | { type: 'SET_AI_THINKING'; value: boolean }
  | { type: 'TOGGLE_ORIENTATION' }
  | { type: 'TOGGLE_MODE' }
  | { type: 'SET_AI_SETTINGS'; settings: Partial<NonNullable<GameState['aiSettings']>> };
  
