# Tehnična arhitektura — Sodobna šahovska igra

## Pregled sklada
- Okvir: `React` + `TypeScript` (SPA), zaganjalnik `Vite` (`vite.config.ts`).
- Slog: `Tailwind CSS` (utility razredi; `tailwind.config.js`, `postcss.config.js`, `index.css`).
- Testiranje: `Vitest` + `@testing-library/react` (enotski in integracijski testi; `vitest.config.ts`).

## Struktura projektnih modulov
- `src/components`: vizualne komponente (plošča, polja, figure, kontrolniki, dialogi).
- `src/hooks`: poslovna logika igre (`useChessGame` z `useReducer`).
- `src/utils`: logika potez, notacija, pripomočki za šah.
- `src/types`: skupni tipi za šah (`chess.ts`) in UI (`ui.ts`).
- `src/test`: nastavitve testiranja in pripomočki.

## Model podatkov
- `Board`: mreža 8×8 z `ChessPiece | null` (`src/types/chess.ts:41`).
- `ChessPiece`: `type`, `color`, `hasMoved` (`src/types/chess.ts:8`).
- `GameState`: trenutni igralec, zgodovina potez, redo, status igre, izbrano polje, veljavne poteze, šah indikator, pravice rokiranja, en passant cilj, promocija (`src/types/chess.ts:50`).
- `Move`: polno beleženje stanj za Undo/Redo (vključno z prejšnjimi pravicami rokiranja, en passant) (`src/types/chess.ts:20`).
- `orientation`: orientacija plošče (`whiteBottom` | `blackBottom`) za 180° rotacijo prikaza (`src/types/chess.ts:50`).
- `halfMoveClock`: števec polpotez brez premika kmeta ali zajema; ob 100 polpotezah remi.
- `positionCounts`: števec ponovitev pozicij, ključ generiran z `generatePositionKey`.
 - `mode`: način igre (`pvp` | `pvai`).
 - `aiSettings`: nastavitve AI (barva, globina, čas poteze, auto analiza).

## Upravljanje stanja
- Centralni reducer `gameReducer` upravlja selekcijo, poteze, promocijo, reset, undo/redo (`src/hooks/useChessGame.ts:21`).
- Za potezo:
  - Preveri promocijo kmeta (zadnja vrsta) in sproži `pendingPromotion` (`src/hooks/useChessGame.ts:59`).
  - Uporabi klonirano tablo, izvede zajem (vklj. en passant), posodobi `hasMoved`, pravice rokiranja, en passant cilj (`src/hooks/useChessGame.ts:98`, `src/utils/chessUtils.ts:131`).
  - Izračuna status igre (`computeGameStatus`) in generira SAN (`generateAlgebraicNotation`) (`src/hooks/useChessGame.ts:124`, `src/utils/chessUtils.ts:317`).
- Undo/Redo z dosledno obnovo vseh odvisnih stanj (rokiranje trdnjave, en passant, promocije) (`src/hooks/useChessGame.ts:253`, `src/hooks/useChessGame.ts:320`).
- `TOGGLE_ORIENTATION`: preklopi orientacijo brez vpliva na logiko igre (`src/hooks/useChessGame.ts:397`).
- Remi logika v reducerju po vsaki potezi: izračun `halfMoveClock`, posodobitev `positionCounts`, trojna ponovitev in 50-potezno pravilo nastavita `gameStatus='draw'` (`src/hooks/useChessGame.ts:124`).
 - Blokada potez po koncu: guardi v `SELECT_SQUARE` in `MAKE_MOVE` preprečijo nadaljnje poteze, ko `gameStatus` ni `active` ali `check` (`src/hooks/useChessGame.ts:28`, `src/hooks/useChessGame.ts:55`).
 - AI integracija: asinhroni generator `computeBestMoveProgress` prek `useEffect` ko je na potezi AI; vsak yield (dokončana globina) se objavi kot `SET_AI_PROGRESS` za UI, na koncu pa `MAKE_MOVE`; akcije `TOGGLE_MODE` in `SET_AI_SETTINGS`.

## Logika potez
- Generator veljavnih potez `getValidMoves` delegira na posamezne tipe figur in filtrira poteze, ki puščajo kralja v šahu (`src/utils/moveValidation.ts:13`, `src/utils/moveValidation.ts:45`).
- Drseče figure uporabljajo enoten `slidingMoves` (lovec/trdnjava/dama) (`src/utils/moveValidation.ts:115`).
- Kralj: standardne poteze + rokiranje z validacijo poti, pravic, prehodov čez šah (`src/utils/moveValidation.ts:200`).
- Kmet: napredovanje, zajemi diagonalno, en passant generiranje na ustrezni vrsti (`src/utils/moveValidation.ts:50`).
- Zaznava šaha temelji na napadih nasprotnih figur (kmet diagonale, skakač L, drseče smeri, kralj sosednja polja) (`src/utils/moveValidation.ts:338`).

## Notacija potez (SAN)
- Simboli figur, razločevanje izvora, oznaka zajema, destinacija, promocija, en passant, indikatorji šah/mat (`src/utils/chessUtils.ts:317`).
- Rokiranje: `O-O` / `O-O-O` (`src/utils/chessUtils.ts:274`).
- `formatPrincipalVariation` pretvori PV (koordinatne poteze) v oštevilčen SAN zapis za prikaz napredka AI (issue #14) (`src/utils/notation.ts`).

## UI arhitektura
- `ChessGame`: orkestracija stanja in povezava med ploščo, kontrolami ter dialogi (`src/components/ChessGame.tsx:13`).
- `ChessBoard`: izris plošče, oznake vrstic/datotek, integracija `ErrorBoundary` (`src/components/ChessBoard.tsx:29`).
- `ChessSquare`: interakcije (klik, tipkovnica, DnD, touch), validacija vnosa (`src/components/ChessSquare.tsx:31`).
- `ChessPiece`: DnD vir, sanitizacija, unicode simbol (`src/components/ChessPiece.tsx:11`).
- `GameControls`: status igre, gumbi Reset/Undo/Redo, prikaz zgodovine potez, AI nastavitve in kartica napredka iskanja AI (globina, eval, PV, čas) (`src/components/GameControls.tsx:22`).
- Gumb za preklop orientacije (`src/components/GameControls.tsx:61`) sproži `TOGGLE_ORIENTATION`; `ChessBoard` izriše datoteke/range v odvisnosti od orientacije (`src/components/ChessBoard.tsx:8`).
- `PromotionDialog` in `ConfirmationDialog`: dostopna dialoga, fokusna past, tipkovnična navigacija (`src/components/PromotionDialog.tsx:43`, `src/components/ConfirmationDialog.tsx:50`).

## Dostopnost (A11y)
- Aria vloge/oznake na plošči, statusih in dialogih (`src/components/ChessBoard.tsx:31`, `src/components/GameControls.tsx:38`, `src/components/PromotionDialog.tsx:100`).
- Upravljanje fokusa, fokusne pasti, Escape za preklic, obnovitev fokusa po zaprtju (`src/components/ConfirmationDialog.tsx:50`, `src/components/PromotionDialog.tsx:21`).

## Testna arhitektura
- Enotski testi utilov (pravice rokiranja, validacija potez, notacija) (`src/utils/__tests__`).
- Integracijski testi hook-a (`useChessGame`) za rokiranje, promocijo, en passant, undo/redo (`src/hooks/__tests__`).
- UI in A11y testi komponent (ChessBoard, GameControls, dialogs) (`src/components/__tests__`).
- Testi remija: `useChessGame.draw.test.ts` pokrivajo trojno ponovitev pozicije in 50 potez brez kmetov/zajemov (`src/hooks/__tests__/useChessGame.draw.test.ts`).
 - Test blokade: `useChessGame.end-lock.test.ts` potrdi, da se po zaključku igre nadaljnji premiki ignorirajo.
- Pragovi pokritosti nastavljeni v `vitest.config.ts`. Dodatni testi: `src/engine/__tests__/openingBook.test.ts`, `src/engine/__tests__/ai.timeout.test.ts`.
 - Performančni test: `src/engine/__tests__/ai.timeout.test.ts` preverja časovno odzivnost.
 - Slog testi: `src/engine/__tests__/openingBook.style.test.ts`.

## Razširljivost in vzdrževanje
- Enotni SRP/DRY pomočniki (`buildMoveRecord`, `slidingMoves`) zmanjšujejo ponavljanje (`src/utils/chessUtils.ts:218`, `src/utils/moveValidation.ts:115`).
- Tipi v `src/types` omogočajo varnost in jasnost pogodbe med plastmi.
- Ločitev UI/poslovne logike preko hook-a olajša refaktoriranje in testiranje.

## Logika AI (brez Stockfisha)
- `src/engine/evaluation.ts`: ocena položaja (material, PST), rezultat v centipawn.
- `src/engine/zobrist.ts`: Zobrist hash in TT vnosi (globina, ocena, PV poteza).
- `src/engine/search.ts`: minimax z alfa–beta, killer/history premet, PVS (PV-search) in LMR (redukcije za pozne ne-zajeme), TT lookup/set.
  - Premet: zajemi+SEE, killer/history, PV‑move iz TT, check bonus (lahka `isKingInCheck`) brez dragih status izračunov.
  - Ekstenzije: check‑extension (+1 ply), terminalna detekcija mate/stalemate/draw z minimizacijo razdalje do mata.
  - Quiescence: na listju izvede “stand pat” oceno in razširi samo zajeme z alfa‑beta, kar prepreči horizonta efekt pri taktikah.
- `src/engine/ai.ts`: `computeBestMoveProgress(state, depth, moveTimeMs)` z iterativnim poglabljanjem, aspiration windows in globalno TT persistenco — async generator, ki po vsaki dokončani globini yielda `AiProgress` (globina, ocena z vidika belih, PV, pretečeni čas); `computeBestMove` je tanek sinhroni ovoj, ki porabi generator in vrne le končno potezo.
  - PV se rekonstruira iz transpozicijske tabele (`extractPrincipalVariation` v `search.ts`) brez dodatnega iskanja.
- `src/engine/openingBook.ts`: opening book `getBookMove(state)`.
  - Lazy prebere `public/opening-book.json` (PGN→JSON) in izbira potez po zgodovini in `aiSettings.style`.

## Omejitve trenutne zasnove
- Brez mrežnega igranja ali AI; lokalna igra dveh igralcev.
- Ni trajnega shranjevanja stanja.
- Enotna plošča; brez variacij časovnih kontrol ali posebnih šahovskih pravil zunaj standarda.
