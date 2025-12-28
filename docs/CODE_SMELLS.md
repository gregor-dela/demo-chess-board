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
| CS-001 | critical | engine | `src/engine/search.ts:26`, `src/engine/search.ts:155`, `src/engine/search.ts:211` | Engine move application ignores castling, en passant, and promotion. | Search explores illegal positions and mis-evaluates. | Introduce shared `applyMove` for special moves; reuse in search. | New engine unit tests for special moves. | TBD | new |
| CS-002 | critical | engine | `src/engine/openingBook.ts:107` | Opening book replays moves without special-move handling. | Book filtering and scoring can be invalid. | Reuse shared `applyMove` in opening book. | Add tests that include castling and en passant book lines. | TBD | new |
| CS-003 | critical | hooks | `src/hooks/useChessGame.ts:515` | Async AI move has no cancellation/state version guard. | Stale AI move can apply after undo/mode change. | Add request token or state version checks; ignore stale results. | Add hook test for AI result ignored after state change. | TBD | new |
| CS-004 | critical | hooks | `src/hooks/useChessGame.ts:8`, `src/hooks/useChessGame.ts:147` | Threefold repetition counts likely miss initial position. | Draws may trigger late or not at all. | Seed `positionCounts` on init or adjust counting logic. | Add draw test that validates exact repetition count. | TBD | new |
| CS-005 | high | utils | `src/utils/chessUtils.ts:2`, `src/utils/moveValidation.ts:2`, `src/utils/chessUtils.ts:316` | Circular dependency between notation and move validation. | Fragile module graph; harder refactors. | Move SAN logic to dedicated module or inject move generator. | Update notation tests after refactor. | TBD | new |
| CS-006 | high | hooks | `src/hooks/useChessGame.ts:66`, `src/hooks/useChessGame.ts:198`, `src/hooks/useChessGame.ts:299`, `src/hooks/useChessGame.ts:361` | Reducer duplicates move apply/undo/redo logic. | Regression-prone and hard to reason about. | Extract helpers for move application and draw computation. | Add unit tests for shared helpers. | TBD | new |
| CS-007 | high | rules | `src/hooks/useChessGame.ts:99`, `src/engine/search.ts:26` | Special-move handling diverges between UI and engine. | Inconsistent behavior between play and AI. | Single source of truth for move application. | Cross-layer tests for legal move execution. | TBD | new |
| CS-008 | high | engine | `src/engine/ai.ts:7`, `src/engine/search.ts:106` | Global TT/killer/history caches persist and can grow unbounded. | Memory growth, stale bias across games. | Add reset on game reset, and/or size cap. | Add AI tests to verify cache reset. | TBD | new |
| CS-009 | high | utils | `src/hooks/useChessGame.ts:91`, `src/engine/search.ts:32`, `src/engine/openingBook.ts:108` | Repeated manual square-to-coord conversions. | Error-prone and inconsistent. | Centralize conversions via helper utilities. | Add utility tests for conversions. | TBD | new |
| CS-010 | high | rules | `src/hooks/useChessGame.ts:145`, `src/utils/moveValidation.ts:428` | Draw rules live only in reducer; engine ignores repetition/50-move. | AI may choose lines that are draws or miss draw saves. | Extend engine status logic to include draws. | Add engine tests for repetition/50-move. | TBD | new |
| CS-011 | medium | types | `src/types/chess.ts:4`, `src/types/chess.ts:68` | `Square` is a plain string and core fields are optional. | Runtime checks spread across code. | Introduce template-literal `Square` type; make core fields required. | Type-level change; ensure existing tests pass. | TBD | new |
| CS-012 | medium | ui | `src/types/chess.ts:97`, `src/components/GameControls.tsx:72` | Optional callbacks are used without guards. | Potential runtime errors if reused elsewhere. | Make callbacks required or guard calls. | UI test for missing callbacks or type tightening. | TBD | new |
| CS-013 | medium | types | `src/types/chess.ts:135`, `src/components/GameControls.tsx:12` | Dead or unused actions/props. | Noise and confusion in API surface. | Remove or implement `SET_EN_PASSANT_TARGET` and `onSetAiSettings`. | Update tests and types accordingly. | TBD | new |
| CS-014 | medium | utils | `src/utils/chessUtils.ts:316`, `src/utils/chessUtils.ts:346` | SAN disambiguation calls full move generation. | Performance and coupling cost per move. | Use narrower disambiguation logic or pass precomputed candidates. | Add SAN tests to validate new logic. | TBD | new |
| CS-015 | medium | engine | `src/utils/moveValidation.ts:428`, `src/engine/search.ts:114` | `computeGameStatus` is expensive in search. | Search node cost is high. | Add a cheaper terminal checker or cache king/attack data. | Performance-focused tests or profiling notes. | TBD | new |
| CS-016 | medium | hooks | `src/utils/chessUtils.ts:219`, `src/hooks/useChessGame.ts:282` | Reducer includes non-deterministic data (timestamps). | Harder to reproduce and test. | Inject clock or attach timestamps outside reducer. | Adjust tests to fix deterministic behavior. | TBD | new |
