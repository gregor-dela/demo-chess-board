import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPawnMoves,
  getRookMoves,
  getKnightMoves,
  getBishopMoves,
  getQueenMoves,
  getKingMoves,
  getValidMoves,
  isKingInCheck,
  isMoveLegal,
  isCheckmate,
  isStalemate,
  hasAnyLegalMoves,
  computeGameStatus,
  isInsufficientMaterial,
} from '../moveValidation';
import { Board, ChessPiece, PieceType, PieceColor, CastlingRights } from '../../types/chess';
import { createInitialBoard, getSquareFromCoordinates } from '../chessUtils';

// Helper function to create a custom board
function createCustomBoard(pieces: Array<{ position: [number, number]; piece: ChessPiece }>): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  pieces.forEach(({ position, piece }) => {
    board[position[0]][position[1]] = piece;
  });
  return board;
}

// Helper function to create a piece
function createPiece(type: PieceType, color: PieceColor, hasMoved = false): ChessPiece {
  return { type, color, hasMoved };
}

// Helper function to create position
function pos(row: number, col: number): [number, number] {
  return [row, col];
}

describe('moveValidation', () => {
  let emptyCastlingRights: CastlingRights;

  beforeEach(() => {
    emptyCastlingRights = {
      white: { kingSide: false, queenSide: false },
      black: { kingSide: false, queenSide: false }
    };
  });

  describe('getPawnMoves', () => {
    it('should return correct moves for white pawn on starting position', () => {
      const board = createInitialBoard();
      const moves = getPawnMoves(board, getSquareFromCoordinates(6, 4), 'white');
      expect(moves).toHaveLength(2);
      expect(moves).toContain('e3');
      expect(moves).toContain('e4');
    });

    it('includes en passant target when eligible', () => {
      // White pawn on e5 (row 3, col 4), black pawn just moved d7->d5, so enPassantTarget is d6
      const board = createCustomBoard([
        { position: pos(3, 4), piece: createPiece('pawn', 'white', true) }, // e5
        { position: pos(3, 3), piece: createPiece('pawn', 'black', true) }  // d5
      ]);
      const moves = getPawnMoves(board, getSquareFromCoordinates(3, 4), 'white', 'd6');
      expect(moves).toContain('d6');
    });

    it('does not include en passant when not eligible', () => {
      const board = createCustomBoard([
        { position: pos(3, 4), piece: createPiece('pawn', 'white', true) }, // e5
        { position: pos(3, 3), piece: createPiece('pawn', 'black', true) }  // d5
      ]);
      const moves = getPawnMoves(board, getSquareFromCoordinates(3, 4), 'white');
      expect(moves).not.toContain('d6');
    });

    it('should return correct moves for black pawn on starting position', () => {
      const board = createInitialBoard();
      const moves = getPawnMoves(board, getSquareFromCoordinates(1, 4), 'black');
      expect(moves).toHaveLength(2);
      expect(moves).toContain('e6');
      expect(moves).toContain('e5');
    });

    it('should return single move for pawn that has moved', () => {
      const board = createCustomBoard([
        { position: pos(5, 4), piece: createPiece('pawn', 'white', true) }
      ]);
      const moves = getPawnMoves(board, getSquareFromCoordinates(5, 4), 'white');
      expect(moves).toHaveLength(1);
      expect(moves).toContain('e4');
    });

    it('should return capture moves for white pawn', () => {
      const board = createCustomBoard([
        { position: pos(5, 4), piece: createPiece('pawn', 'white') },
        { position: pos(4, 3), piece: createPiece('pawn', 'black') },
        { position: pos(4, 5), piece: createPiece('pawn', 'black') }
      ]);
      const moves = getPawnMoves(board, getSquareFromCoordinates(5, 4), 'white');
      expect(moves).toHaveLength(3);
      expect(moves).toContain('e4'); // forward
      expect(moves).toContain('d4'); // capture left
      expect(moves).toContain('f4'); // capture right
    });

    it('should not capture own pieces', () => {
      const board = createCustomBoard([
        { position: pos(5, 4), piece: createPiece('pawn', 'white') },
        { position: pos(4, 3), piece: createPiece('pawn', 'white') },
        { position: pos(4, 5), piece: createPiece('pawn', 'white') }
      ]);
      const moves = getPawnMoves(board, getSquareFromCoordinates(5, 4), 'white');
      expect(moves).toHaveLength(1);
      expect(moves).toContain('e4'); // only forward
    });

    it('should be blocked by piece in front', () => {
      const board = createCustomBoard([
        { position: pos(5, 4), piece: createPiece('pawn', 'white') },
        { position: pos(4, 4), piece: createPiece('pawn', 'black') }
      ]);
      const moves = getPawnMoves(board, getSquareFromCoordinates(5, 4), 'white');
      expect(moves).toHaveLength(0);
    });

    it('should handle edge of board', () => {
      const board = createCustomBoard([
        { position: pos(0, 4), piece: createPiece('pawn', 'white') }
      ]);
      const moves = getPawnMoves(board, getSquareFromCoordinates(0, 4), 'white');
      expect(moves).toHaveLength(0);
    });
  });

  describe('getRookMoves', () => {
    it('should return correct moves for rook in center of empty board', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('rook', 'white') }
      ]);
      const moves = getRookMoves(board, getSquareFromCoordinates(4, 4), 'white');
      expect(moves).toHaveLength(14); // 7 horizontal + 7 vertical
    });

    it('should be blocked by own pieces', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('rook', 'white') },
        { position: pos(4, 6), piece: createPiece('pawn', 'white') },
        { position: pos(2, 4), piece: createPiece('pawn', 'white') }
      ]);
      const moves = getRookMoves(board, getSquareFromCoordinates(4, 4), 'white');
      expect(moves).not.toContain('h4'); // blocked by own pawn
      expect(moves).not.toContain('e7'); // blocked by own pawn
      expect(moves).toContain('f4'); // can move to square before own piece
      expect(moves).toContain('e5'); // can move to square before own piece
    });

    it('should capture enemy pieces', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('rook', 'white') },
        { position: pos(4, 6), piece: createPiece('pawn', 'black') }
      ]);
      const moves = getRookMoves(board, getSquareFromCoordinates(4, 4), 'white');
      expect(moves).toContain('g4'); // can capture enemy
      expect(moves).not.toContain('h4'); // cannot move past captured piece
    });
  });

  describe('getKnightMoves', () => {
    it('should return correct moves for knight in center', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('knight', 'white') }
      ]);
      const moves = getKnightMoves(board, getSquareFromCoordinates(4, 4), 'white');
      expect(moves).toHaveLength(8);
      const expectedMoves = [
        'd6', 'f6', 'c5', 'g5',
        'c3', 'g3', 'd2', 'f2'
      ];
      expectedMoves.forEach(move => {
        expect(moves).toContain(move);
      });
    });

    it('should handle edge of board', () => {
      const board = createCustomBoard([
        { position: pos(0, 0), piece: createPiece('knight', 'white') }
      ]);
      const moves = getKnightMoves(board, getSquareFromCoordinates(0, 0), 'white');
      expect(moves).toHaveLength(2);
      expect(moves).toContain('c7');
      expect(moves).toContain('b6');
    });

    it('should not capture own pieces', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('knight', 'white') },
        { position: pos(2, 3), piece: createPiece('pawn', 'white') }
      ]);
      const moves = getKnightMoves(board, getSquareFromCoordinates(4, 4), 'white');
      expect(moves).not.toContain('d6');
    });
  });

  describe('getBishopMoves', () => {
    it('should return correct moves for bishop in center', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('bishop', 'white') }
      ]);
      const moves = getBishopMoves(board, getSquareFromCoordinates(4, 4), 'white');
      expect(moves).toHaveLength(13); // 4 diagonals
    });

    it('should be blocked by pieces', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('bishop', 'white') },
        { position: pos(2, 2), piece: createPiece('pawn', 'black') }
      ]);
      const moves = getBishopMoves(board, getSquareFromCoordinates(4, 4), 'white');
      expect(moves).toContain('c6'); // can capture
      expect(moves).not.toContain('b7'); // cannot move past
    });
  });

  describe('getQueenMoves', () => {
    it('should combine rook and bishop moves', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('queen', 'white') }
      ]);
      const moves = getQueenMoves(board, getSquareFromCoordinates(4, 4), 'white');
      expect(moves).toHaveLength(27); // 14 rook + 13 bishop
    });
  });

  describe('getKingMoves', () => {
    it('should return basic king moves', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') }
      ]);
      const moves = getKingMoves(board, getSquareFromCoordinates(4, 4), 'white', emptyCastlingRights);
      expect(moves).toHaveLength(8);
    });

    it('should include castling moves when available', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white', false) },
        { position: pos(7, 0), piece: createPiece('rook', 'white', false) },
        { position: pos(7, 7), piece: createPiece('rook', 'white', false) }
      ]);
      const castlingRights = {
        white: { kingSide: true, queenSide: true },
        black: { kingSide: false, queenSide: false }
      };
      const moves = getKingMoves(board, getSquareFromCoordinates(7, 4), 'white', castlingRights);
      expect(moves).toContain('g1'); // king-side castling
      expect(moves).toContain('c1'); // queen-side castling
    });

    it('should not castle through check', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white', false) },
        { position: pos(7, 7), piece: createPiece('rook', 'white', false) },
        { position: pos(0, 5), piece: createPiece('rook', 'black') } // attacking f1
      ]);
      const castlingRights = {
        white: { kingSide: true, queenSide: false },
        black: { kingSide: false, queenSide: false }
      };
      const moves = getKingMoves(board, getSquareFromCoordinates(7, 4), 'white', castlingRights);
      expect(moves).not.toContain('g1'); // cannot castle through check
    });
  });

  describe('getValidMoves', () => {
    it('should return all valid moves for a piece', () => {
      const board = createInitialBoard();
      const moves = getValidMoves(board, getSquareFromCoordinates(6, 4), 'white', emptyCastlingRights);
      expect(moves).toHaveLength(2); // pawn can move 1 or 2 squares
    });

    it('should return empty array for empty square', () => {
       const board = createCustomBoard([]);
       const moves = getValidMoves(board, getSquareFromCoordinates(4, 4), 'white', emptyCastlingRights);
       expect(moves).toHaveLength(0);
     });

    it('should return empty array for opponent piece', () => {
      const board = createInitialBoard();
      const moves = getValidMoves(board, getSquareFromCoordinates(1, 4), 'white', emptyCastlingRights); // black pawn
      expect(moves).toHaveLength(0);
    });
  });

  describe('isKingInCheck', () => {
    it('should detect check from rook', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(4, 0), piece: createPiece('rook', 'black') }
      ]);
      expect(isKingInCheck(board, 'white')).toBe(true);
    });

    it('should detect check from bishop', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(2, 2), piece: createPiece('bishop', 'black') }
      ]);
      expect(isKingInCheck(board, 'white')).toBe(true);
    });

    it('should detect check from knight', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(2, 3), piece: createPiece('knight', 'black') }
      ]);
      expect(isKingInCheck(board, 'white')).toBe(true);
    });

    it('should detect check from pawn', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(3, 3), piece: createPiece('pawn', 'black') }
      ]);
      expect(isKingInCheck(board, 'white')).toBe(true);
    });

    it('should return false when king is safe', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(0, 0), piece: createPiece('rook', 'black') }
      ]);
      expect(isKingInCheck(board, 'white')).toBe(false);
    });

    it('should handle blocked attacks', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(4, 0), piece: createPiece('rook', 'black') },
        { position: pos(4, 2), piece: createPiece('pawn', 'white') } // blocking
      ]);
      expect(isKingInCheck(board, 'white')).toBe(false);
    });
  });

  describe('isMoveLegal', () => {
    it('should allow legal moves', () => {
      const board = createInitialBoard();
      expect(isMoveLegal(board, getSquareFromCoordinates(6, 4), getSquareFromCoordinates(5, 4), 'white')).toBe(true);
    });

    it('should prevent moves that put own king in check', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(4, 3), piece: createPiece('rook', 'white') },
        { position: pos(4, 0), piece: createPiece('rook', 'black') }
      ]);
      // Moving the rook would expose the king to check
      expect(isMoveLegal(board, getSquareFromCoordinates(4, 3), getSquareFromCoordinates(3, 3), 'white')).toBe(false);
    });

    it('should allow moves that block check', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(4, 0), piece: createPiece('rook', 'black') },
        { position: pos(3, 2), piece: createPiece('bishop', 'white') }
      ]);
      // Bishop can block the check
      expect(isMoveLegal(board, getSquareFromCoordinates(3, 2), getSquareFromCoordinates(4, 1), 'white')).toBe(true);
    });
  });

  describe('hasAnyLegalMoves', () => {
    it('should return true when player has legal moves', () => {
      const board = createInitialBoard();
      expect(hasAnyLegalMoves(board, 'white', emptyCastlingRights)).toBe(true);
    });

    it('should return false when player has no legal moves (stalemate)', () => {
      const board = createCustomBoard([
        { position: pos(0, 0), piece: createPiece('king', 'white') },
        { position: pos(1, 2), piece: createPiece('queen', 'black') },
        { position: pos(2, 1), piece: createPiece('king', 'black') }
      ]);
      expect(hasAnyLegalMoves(board, 'white', emptyCastlingRights)).toBe(false);
    });
  });

  describe('isCheckmate', () => {
    it('should detect checkmate', () => {
      const board = createCustomBoard([
        { position: pos(0, 0), piece: createPiece('king', 'white') },
        { position: pos(1, 1), piece: createPiece('queen', 'black') },
        { position: pos(2, 2), piece: createPiece('king', 'black') }
      ]);
      expect(isCheckmate(board, 'white', emptyCastlingRights)).toBe(true);
    });

    it('should return false when not in check', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(0, 0), piece: createPiece('queen', 'black') }
      ]);
      expect(isCheckmate(board, 'white', emptyCastlingRights)).toBe(false);
    });

    it('should return false when king can escape', () => {
      const board = createCustomBoard([
        { position: pos(4, 4), piece: createPiece('king', 'white') },
        { position: pos(4, 0), piece: createPiece('rook', 'black') }
      ]);
      expect(isCheckmate(board, 'white', emptyCastlingRights)).toBe(false);
    });
  });

  describe('isStalemate', () => {
    it('should detect stalemate', () => {
      const board = createCustomBoard([
        { position: pos(0, 0), piece: createPiece('king', 'white') },
        { position: pos(1, 2), piece: createPiece('queen', 'black') },
        { position: pos(2, 1), piece: createPiece('king', 'black') }
      ]);
      expect(isStalemate(board, 'white', emptyCastlingRights)).toBe(true);
    });

    it('should return false when in check', () => {
      const board = createCustomBoard([
        { position: pos(0, 0), piece: createPiece('king', 'white') },
        { position: pos(1, 1), piece: createPiece('queen', 'black') },
        { position: pos(2, 2), piece: createPiece('king', 'black') }
      ]);
      expect(isStalemate(board, 'white', emptyCastlingRights)).toBe(false);
    });

    it('should return false when player has legal moves', () => {
      const board = createInitialBoard();
      expect(isStalemate(board, 'white', emptyCastlingRights)).toBe(false);
    });
  });

  describe('Boundary conditions and invalid inputs', () => {
    it('should handle positions outside board bounds', () => {
      const board = createInitialBoard();
      const moves = getValidMoves(board, getSquareFromCoordinates(-1, 4), 'white', emptyCastlingRights);
      expect(moves).toHaveLength(0);
    });

    it('should handle positions with invalid coordinates', () => {
      const board = createInitialBoard();
      const moves = getValidMoves(board, getSquareFromCoordinates(8, 4), 'white', emptyCastlingRights);
      expect(moves).toHaveLength(0);
    });

    it('should handle null board gracefully', () => {
      const nullBoard = null as unknown as Board;
      expect(() => getValidMoves(nullBoard, getSquareFromCoordinates(4, 4), 'white', emptyCastlingRights)).not.toThrow();
    });
  });

  describe('Castling edge cases', () => {
    it('should not castle when king has moved', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white', true) }, // has moved
        { position: pos(7, 7), piece: createPiece('rook', 'white', false) }
      ]);
      const castlingRights = {
        white: { kingSide: true, queenSide: false },
        black: { kingSide: false, queenSide: false }
      };
      const moves = getKingMoves(board, getSquareFromCoordinates(7, 4), 'white', castlingRights);
      expect(moves).not.toContain('g1');
    });

    it('should not castle when rook has moved', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white', false) },
        { position: pos(7, 7), piece: createPiece('rook', 'white', true) } // has moved
      ]);
      const castlingRights = {
        white: { kingSide: true, queenSide: false },
        black: { kingSide: false, queenSide: false }
      };
      const moves = getKingMoves(board, getSquareFromCoordinates(7, 4), 'white', castlingRights);
      expect(moves).not.toContain('g1');
    });

    it('should not castle when squares between king and rook are occupied', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white', false) },
        { position: pos(7, 7), piece: createPiece('rook', 'white', false) },
        { position: pos(7, 5), piece: createPiece('bishop', 'white') } // blocking
      ]);
      const castlingRights = {
        white: { kingSide: true, queenSide: false },
        black: { kingSide: false, queenSide: false }
      };
      const moves = getKingMoves(board, getSquareFromCoordinates(7, 4), 'white', castlingRights);
      expect(moves).not.toContain('g1');
    });

    it('should not castle when king is in check', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white', false) },
        { position: pos(7, 7), piece: createPiece('rook', 'white', false) },
        { position: pos(0, 4), piece: createPiece('rook', 'black') } // checking king
      ]);
      const castlingRights = {
        white: { kingSide: true, queenSide: false },
        black: { kingSide: false, queenSide: false }
      };
      const moves = getKingMoves(board, getSquareFromCoordinates(7, 4), 'white', castlingRights);
      expect(moves).not.toContain('g1');
    });

    it('should not castle into check', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white', false) },
        { position: pos(7, 7), piece: createPiece('rook', 'white', false) },
        { position: pos(0, 6), piece: createPiece('rook', 'black') } // attacking g1
      ]);
      const castlingRights = {
        white: { kingSide: true, queenSide: false },
        black: { kingSide: false, queenSide: false }
      };
      const moves = getKingMoves(board, getSquareFromCoordinates(7, 4), 'white', castlingRights);
      expect(moves).not.toContain('g1');
    });
  });

  describe('Pins, king safety, and en passant edge cases', () => {
    it('forbids pinned bishop moves that would expose the king to check', () => {
      // e-file: White king e1, white bishop e2, black rook e8
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white') },  // e1
        { position: pos(6, 4), piece: createPiece('bishop', 'white') },// e2
        { position: pos(0, 4), piece: createPiece('rook', 'black') }   // e8
      ]);
      const moves = getValidMoves(board, getSquareFromCoordinates(6, 4), 'white');
      expect(moves).toHaveLength(0);
    });

    it('prevents the king from moving into attacked squares', () => {
      // White king e1; black rook e3 attacks e2 and e1; king cannot move to e2
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white') }, // e1
        { position: pos(5, 4), piece: createPiece('rook', 'black') }  // e3
      ]);
      const moves = getValidMoves(board, getSquareFromCoordinates(7, 4), 'white', emptyCastlingRights);
      expect(moves).not.toContain('e2');
    });

    it('allows castling even if rook is attacked, provided king path and landing are safe', () => {
      // White king e1, rook h1; black rook h3 attacks rook but not e1/f1/g1
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white', false) }, // e1
        { position: pos(7, 7), piece: createPiece('rook', 'white', false) }, // h1
        { position: pos(5, 7), piece: createPiece('rook', 'black') }         // h3
      ]);
      const rights: CastlingRights = { white: { kingSide: true, queenSide: false }, black: { kingSide: false, queenSide: false } };
      const moves = getKingMoves(board, getSquareFromCoordinates(7, 4), 'white', rights);
      expect(moves).toContain('g1');
    });

    it('disallows en passant if it would leave own king in check (self-check via discovered attack)', () => {
      // White king e1, white pawn e5, black rook e8 (along e-file), black pawn d5; enPassantTarget = d6
      // If white plays e5xd6 e.p., e-file opens and white king is in check -> illegal
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white') },   // e1
        { position: pos(3, 4), piece: createPiece('pawn', 'white', true) }, // e5
        { position: pos(0, 4), piece: createPiece('rook', 'black') },   // e8
        { position: pos(3, 3), piece: createPiece('pawn', 'black', true) }  // d5
      ]);
      const moves = getValidMoves(board, getSquareFromCoordinates(3, 4), 'white', undefined, 'd6');
      expect(moves).not.toContain('d6');
    });

    it('hasAnyLegalMoves returns true when en passant is the available legal move', () => {
      // Minimalistic scenario: white pawn e5, black pawn d5; enPassantTarget d6 => white has a legal move
      const board = createCustomBoard([
        { position: pos(3, 4), piece: createPiece('pawn', 'white', true) }, // e5
        { position: pos(3, 3), piece: createPiece('pawn', 'black', true) }  // d5
      ]);
      expect(hasAnyLegalMoves(board, 'white', emptyCastlingRights, 'd6')).toBe(true);
    });
  });

  describe('insufficient material draws (FIDE dead position)', () => {
    it('King vs King = draw (insufficient material, no legal checkmate possible)', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white') },
        { position: pos(0, 4), piece: createPiece('king', 'black') },
      ]);
      expect(isInsufficientMaterial(board)).toBe(true);
      expect(computeGameStatus(board, 'white', emptyCastlingRights, null)).toBe('draw');
      expect(computeGameStatus(board, 'black', emptyCastlingRights, null)).toBe('draw');
    });

    it('King + Bishop vs King = draw', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white') },
        { position: pos(7, 2), piece: createPiece('bishop', 'white') },
        { position: pos(0, 4), piece: createPiece('king', 'black') },
      ]);
      expect(isInsufficientMaterial(board)).toBe(true);
      expect(computeGameStatus(board, 'white', emptyCastlingRights, null)).toBe('draw');
    });

    it('King + Knight vs King = draw', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white') },
        { position: pos(7, 1), piece: createPiece('knight', 'white') },
        { position: pos(0, 4), piece: createPiece('king', 'black') },
      ]);
      expect(isInsufficientMaterial(board)).toBe(true);
      expect(computeGameStatus(board, 'black', emptyCastlingRights, null)).toBe('draw');
    });

    it('King + Bishop vs King + Bishop (same color squares) = draw', () => {
      // Both bishops on LIGHT squares (row+col even per getSquareColor = light)
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white') },
        { position: pos(6, 2), piece: createPiece('bishop', 'white') }, // (6,2)=8 even = light
        { position: pos(0, 4), piece: createPiece('king', 'black') },
        { position: pos(1, 3), piece: createPiece('bishop', 'black') }, // (1,3)=4 even = light
      ]);
      expect(isInsufficientMaterial(board)).toBe(true);
      expect(computeGameStatus(board, 'white', emptyCastlingRights, null)).toBe('draw');
    });

    it('King + Rook vs King = NOT a draw (Rook can mate)', () => {
      const board = createCustomBoard([
        { position: pos(7, 4), piece: createPiece('king', 'white') },
        { position: pos(7, 0), piece: createPiece('rook', 'white') },
        { position: pos(0, 4), piece: createPiece('king', 'black') },
      ]);
      expect(isInsufficientMaterial(board)).toBe(false);
      expect(computeGameStatus(board, 'black', emptyCastlingRights, null)).not.toBe('draw');
    });

    it('Initial position = NOT a draw (pawns + majors can mate)', () => {
      const board = createInitialBoard();
      expect(isInsufficientMaterial(board)).toBe(false);
      expect(computeGameStatus(board, 'white', emptyCastlingRights, null)).toBe('active');
    });
  });
});
