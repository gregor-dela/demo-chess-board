# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project commands

- Setup
  - npm install
  - Requires Node.js 16 or higher (per README)
- Changelog
  - npm run changelog:update
  - npm run changelog:check
- Development server
  - npm run dev
  - Vite server opens browser on http://localhost:3000 (see vite.config.ts)
- Build
  - npm run build
  - Runs TypeScript type-checker (tsc) then Vite build; output in dist with sourcemaps
- Preview production build
  - npm run preview
- Lint
  - npm run lint
  - ESLint runs on . with ts/tsx extensions and max-warnings=0
- Tests
  - npm test (runs Vitest test suite)
  - npm run test:ui (opens Vitest UI for interactive testing)
  - npm run test:coverage (generates coverage in coverage/ with text, lcov, html; thresholds enforced)
  - npm run test:quick (quick subset used by pre-commit)
  - Coverage thresholds: statements ≥ 80%, functions ≥ 80%, lines ≥ 80%, branches ≥ 70%
  - Test files located in src/components/__tests__/, src/hooks/__tests__/, src/utils/__tests__/, and src/engine/__tests__/
  - UI tests cover ChessBoard/ChessSquare/ChessPiece DnD, PromotionDialog, ConfirmationDialog, ErrorBoundary, GameControls (status/actions/integration), board orientation, keyboard-only moves, touch tap-to-move, visual feedback, and last-move highlights
  - Accessibility tests: jest-axe basic checks; live status regions; keyboard and touch flows

## Testno voden razvoj (TDD)

- Za vsako novo funkcijo ali popravke napak najprej napiši test, ki sprva pade; nato implementiraj kodo in poskrbi, da test uspe.
- Vsaka sprememba vedenja mora biti pokrita s testom (novim ali posodobljenim). PR-ji brez ustreznih testov se ne smejo združiti.
- Ohranite ali povečajte pokritost: `statements ≥ 80%`, `functions ≥ 80%`, `lines ≥ 80%`, `branches ≥ 70%`.
- Pred commitom se poganjajo `lint` in `npm run test:quick`; pred združitvijo poganjaj `npm test` in `npm run test:coverage`.
- Testi naj bodo locirani v `src/components/__tests__/`, `src/hooks/__tests__/`, `src/utils/__tests__/`, `src/engine/__tests__/`; po potrebi dodaj nove mape.
- Pri regresijah najprej napiši reprodukcijski test in ga pusti padati, dokler napaka ni odpravljena.

## Architecture overview

- Stack and tooling
  - React 18 + TypeScript + Vite + Tailwind CSS
  - Vitest + Testing Library + jest-axe for tests/a11y
  - ESLint configured for TypeScript and react-refresh
  - Vite config: server.port = 3000, open = true; build outputs dist with sourcemaps
  - Tailwind config extends theme with chess-specific colors and fonts
- App composition (top-level flow)
  - src/main.tsx mounts <App />; App renders <ChessGame /> as the main container
  - ChessGame composes:
    - ChessBoard: renders the 8x8 board grid with rank/file labels; supports board orientation; highlights selection, valid moves, and last move; exposes role=group and squares as role=button with accessible names; supports keyboard (Enter/Space) and touch tap-to-move
    - GameControls: shows current player, game status (active/check/checkmate/stalemate/draw), mode, AI thinking indicator, and move history in SAN; provides Reset (with confirmation), Undo, Redo, orientation toggle, and mode toggle
    - ConfirmationDialog: reusable modal for reset confirmation with keyboard accessibility
    - PromotionDialog: accessible modal for pawn promotion selection (Queen/Rook/Bishop/Knight) with focus trap, keyboard navigation, and Escape to cancel
    - ErrorBoundary: wraps the board grid to handle rendering errors gracefully
- State management and game logic
  - src/hooks/useChessGame.ts encapsulates all game state using useReducer
    - State: board (8×8), currentPlayer, moveHistory, redoHistory, gameStatus, selectedSquare, validMoves, isInCheck, castlingRights, enPassantTarget, pendingPromotion, orientation, halfMoveClock, positionCounts, mode, aiSettings, aiThinking
    - Actions: SELECT_SQUARE, MAKE_MOVE, REQUEST_PROMOTION, COMPLETE_PROMOTION, CANCEL_PROMOTION, RESET_GAME, UNDO_MOVE, REDO_MOVE, SET_VALID_MOVES, UPDATE_GAME_STATUS, TOGGLE_ORIENTATION, TOGGLE_MODE, SET_AI_SETTINGS, SET_AI_THINKING
    - Workflow: clicks or drops dispatch actions; reducer updates board and history, toggles player; promotion handled via pendingPromotion flow
    - Tracks castling rights and en passant target based on king/rook/pawn moves
    - Automatically detects and sets checkmate/stalemate/check status after each move and undo/redo
    - Draw detection: threefold repetition + 50-move rule via positionCounts and halfMoveClock
    - AI flow: in pvai mode, useChessGame requests computeBestMove on the AI turn and toggles aiThinking
    - Full undo/redo functionality with state restoration
  - src/types/chess.ts defines core types (PieceType, PieceColor, Square, Board, GameState, Move, props interfaces)
  - src/types/ui.ts defines UI component types (ConfirmationDialogProps)
- AI engine
  - src/engine/* implements opening book lookup, evaluation, search (alpha-beta + quiescence), and Zobrist transposition tables
- Board representation and helpers
  - src/utils/chessUtils.ts
    - createInitialBoard(): sets up pieces and pawns with hasMoved = false
    - Square/coordinate conversions, square color, and occupancy checks (own/opponent/empty)
    - getPieceSymbol(): maps type/color to Unicode chess glyphs used by the UI
    - Castling rights management: createInitialCastlingRights(), updateCastlingRightsForMove()
    - Castling rook moves: applyCastlingRookMove(), undoCastlingRookMove()
    - En passant target calculation: computeEnPassantTarget()
    - Input validation: isValidDragData(), sanitizeSquareInput() for robust drag-and-drop
    - Move record + repetition helpers: buildMoveRecord(), generatePositionKey()
    - generateAlgebraicNotation(): creates Standard Algebraic Notation for moves with disambiguation, captures, check/checkmate indicators
- Move validation and endgame detection
  - src/utils/moveValidation.ts
    - getValidMoves(board, square, piece, castlingRights): delegates to piece-specific generators and filters illegal moves
    - Implements pawn (forward + diagonal captures), rook, knight, bishop, queen, king movement
    - Castling fully implemented: validates all conditions (pieces haven't moved, path clear, safety checks)
    - Check detection fully implemented: isKingInCheck() validates king safety, isMoveLegal() prevents self-check (including en passant capture simulation)
    - Endgame detection: hasAnyLegalMoves() checks for any valid moves, isCheckmate() and isStalemate() determine game end
    - getPawnAttacks(): special function for pawn diagonal attacks used in check detection
    - computeGameStatus() returns active/check/checkmate/stalemate based on position
    - En passant implemented
- Interaction boundaries and DnD
  - ChessPiece sets dataTransfer with a sanitized square on dragstart; visual feedback via Tailwind classes
  - ChessSquare handles click selection and onDrop (from → to) and forwards to useChessGame handlers; supports touch via tap-to-select and tap-to-move; keyboard via Enter/Space/Escape; validates drag data
  - ChessBoard computes square color and pulls piece data from gameState.board; highlights last move
  - ErrorBoundary wraps the board grid to handle rendering errors gracefully
- Styling
  - Tailwind utilities via src/index.css (@layer components) define chess-square and chess-piece classes
  - tailwind.config.js defines custom colors: chess-light, chess-dark, highlight-blue, valid-move

## Notes

- Package manager: npm (package-lock.json present)
- Husky pre-commit hook runs lint and npm run test:quick (install via: npm run prepare)
- CI: GitHub Actions runs lint + tests with coverage; Codecov upload is conditional on CODECOV_TOKEN secret (badge in README)
- README.md includes quickstart (npm install, npm run dev/build/preview/lint) and feature overview
 
## Git smernice

- Pogosto delaj `git commit` po smiselnih, majhnih korakih.
- Sporočila commitov naj bodo jasna, opisna in smiselna.
