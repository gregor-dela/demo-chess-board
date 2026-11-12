# Code Smell Register

Purpose: Track technical debt and code smells, prioritize remediation, and ensure each fix is paired with tests.

Status values:
- new: identified, not yet triaged
- triaged: scoped and scheduled
- in-progress: currently being addressed
- done: resolved with tests
- blocked: cannot proceed without external dependency
- deferred: intentionally postponed

How to use:
- Every PR that addresses a smell updates its row (status, plan, tests).
- Add new smells with a unique ID (CS-###).
- Keep entries concise and actionable; link to files/lines with inline paths.

| ID | Severity | Area | Location | Description | Impact | Plan | Tests | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CS-001 | critical | engine | `src/engine/search.ts`, `src/engine/openingBook.ts` | Engine move application ignores castling, en passant, and promotion. | Search explores illegal positions and mis-evaluates. | Resolved: enotni `applyEngineMove` (`chessUtils.ts`) uporabljen v `search.ts` in `openingBook.ts`; pokriva castling, en passant in promocijo. | `chessUtils.test.ts` (applyEngineMove za specialne poteze), `search.draw.test.ts`. | TBD | done |
| CS-002 | critical | engine | `src/engine/openingBook.ts:136` | Opening book replays moves without special-move handling. | Book filtering and scoring can be invalid. | Resolved: opening book uporablja `applyEngineMove`. | `openingBook.test.ts`, `openingBook.style.test.ts`. | TBD | done |
| CS-003 | critical | hooks | `src/hooks/useAIManager.ts:13` | Async AI move has no cancellation/state version guard. | Stale AI move can apply after undo/mode change. | Resolved: `aiVersionRef` (prek `bumpAiVersion`) zavrže zastarele AI poteze po Undo/Reset/SetSettings. | `useAIManager.test.ts`, `useChessGame.ai.test.ts`. | TBD | done |
| CS-004 | critical | hooks | `src/hooks/gameReducer.ts:8` | Threefold repetition counts likely miss initial position. | Draws may trigger late or not at all. | Resolved: `seedPositionCounts` ob inicializaciji doda začetno pozicijo v `positionCounts`. | `useChessGame.draw.test.ts`, `search.draw.test.ts`. | TBD | done |
| CS-005 | high | utils | `src/utils/board.ts`, `src/utils/notation.ts` | Circular dependency between notation and move validation. | Fragile module graph; harder refactors. | Resolved: izluščen `board.ts` (brez odvisnosti od drugih utils modulov) in `notation.ts`; odvisnost je zdaj enosmerna `notation.ts` → `moveValidation.ts` → `board.ts`. | `board.test.ts` (round-trip pretvorb, occupancy, clone), `notation.test.ts` (SAN). | TBD | done |
| CS-006 | high | hooks | `src/hooks/moveStateHelpers.ts` | Reducer duplicates move apply/undo/redo logic. | Regression-prone and hard to reason about. | Resolved: skupni pomočniki `applyMoveToState`/`undoMoveInState`/`redoMoveInState`/`createMoveFromState`; reducer jih le kliče. | `moveStateHelpers.test.ts`, `useUndoRedo.test.ts`. | TBD | done |
| CS-007 | high | rules | `src/utils/chessUtils.ts:200` | Special-move handling diverges between UI and engine. | Inconsistent behavior between play and AI. | Resolved: `applyEngineMove` je enoten vir resnice za premike (UI in engine). | `chessUtils.test.ts`, cross-layer poteze v `useChessGame.castling.test.ts`. | TBD | done |
| CS-008 | high | engine | `src/engine/ai.ts:8` | Global TT/killer/history caches persist and can grow unbounded. | Memory growth, stale bias across games. | Resolved: `TT_MAX_SIZE = 100000` s polovičnim praznjenjem ob prekoračitvi; `resetTranspositionTable()`/`resetSearchGlobals()` ob resetu in novi igri. | `tt.reset.test.ts`, `useAIManager.test.ts`. | TBD | done |
| CS-009 | high | utils | `src/utils/board.ts` | Repeated manual square-to-coord conversions. | Error-prone and inconsistent. | Resolved: pretvorbe centralizirane v `board.ts` (`getCoordinatesFromSquare`/`getSquareFromCoordinates`); `search.ts` in hooki uporabljajo te pomočnike namesto inline `charCodeAt`/`parseInt`. | `board.test.ts` (round-trip, robna polja a1/h8). | TBD | done |
| CS-010 | high | rules | `src/engine/search.ts`, `src/engine/ai.ts` | Draw rules live only in reducer; engine ignores repetition/50-move. | AI may choose lines that are draws or miss draw saves. | Resolved: `search()` zazna 50-move (`halfMoveClock >= 100`) in trikratno ponavljanje (`RepetitionContext`); `quiescence()` preveri 50-move; `ai.ts` nasadi repetition iz `positionCounts` in posreduje `halfMoveClock`. | `search.draw.test.ts`, `quiescence.test.ts`, `ai.draw.integration.test.ts`. | TBD | done |
| CS-011 | medium | types | `src/types/chess.ts` | `Square` is a plain string and core fields are optional. | Runtime checks spread across code. | Resolved: `Square` je template-literal `File`+`Rank`; polja `GameState` (`halfMoveClock`, `positionCounts`, `mode`, `aiSettings`, `aiThinking`) so obvezna. Pretvorbe v `board.ts` in robna mesta (`ChessBoard`, `openingBook`) uporabljajo ožji `as Square`. | `tsc --noEmit` čist, obstoječi testi nespremenjeni. | TBD | done |
| CS-012 | medium | ui | `src/types/chess.ts` | Optional callbacks are used without guards. | Potential runtime errors if reused elsewhere. | Resolved: `GameControlsProps` ima obvezne callbacke (`onResetGame`, `onUndoMove`, `onRedoMove`, `onToggleOrientation`, `onToggleMode`, `onSetAiSettings`). | `GameControls.*.test.tsx`. | TBD | done |
| CS-013 | medium | types | `src/types/chess.ts` | Dead or unused actions/props. | Noise and confusion in API surface. | Resolved: odstranjen `SET_EN_PASSANT_TARGET`; `onSetAiSettings` implementiran in povezan v `GameControls`. | `GameControls.test.tsx` (AI nastavitve), `useGameState.test.ts`. | TBD | done |
| CS-014 | medium | utils | `src/utils/notation.ts` | SAN disambiguation calls full move generation. | Performance and coupling cost per move. | Resolved: `getOtherCandidateFromSquares` najprej uporabi poceni `attacksSquare`, šele nato potrdi legalnost z `isMoveLegal` (brez `getValidMoves`). | `notation.test.ts` (razločevanje po datoteki/vrsti + pripeta figura ne zahteva razločevanja). | TBD | done |
| CS-015 | medium | engine | `src/engine/search.ts` | `computeGameStatus` is expensive in search. | Search node cost is high. | Resolved: `search.ts` ne kliče `computeGameStatus` na vsakem vozlišču; terminalna stanja preveri le, ko `genMoves()` vrne prazen seznam, detekcija šaha pa uporablja `attacksSquare`. | `search.performance.test.ts`, `evaluation.search.test.ts`. | TBD | done |
| CS-016 | medium | hooks | `src/utils/chessUtils.ts:161` | Reducer includes non-deterministic data (timestamps). | Harder to reproduce and test. | Resolved: `buildMoveRecord` sprejme opcijski `timestamp`; določanje časa je izven reduktorja. | `chessUtils.test.ts`, `moveStateHelpers.test.ts`. | TBD | done |
