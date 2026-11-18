# Roadmap & Milestones - demo-chess-board
_V zadnji posodobitvi: 2026-11-12_

Ta dokument predlaga **milestone** (končne točke) za projekt in kaj je v vsaki vključeno.
Milestone-e lahko ročno ustvariš na GitHubu pod zavihkom `Issues` → `Milestones`.

Kako uporabljati:
1. Na GitHubu naredi milestone z imenom iz spodnjega seznama.
2. Nastavi `Due date` (rok) na želeni datum.
3. Issue, ki pripadajo temu milestoneu, dodeliš k njemu.
4. Kadar zapreš issue z `Fixes #123` → se milestone progress sam poveča.

---

## 🔄 Trenutno delo (ali že narejeno)
_Vsebuje predhodne opravke: CODE_SMELLS (popravki), UX izboljšave, refactor engine._

### Milestone: **"MVP + Tech debt cleanup"**
- **Rok**: (ze narejen - po potrebi nastavi na danasnji dan)
- **Opis**: Popravki vseh zakodiranih "code smell"-ov + MVP UX funkcionalnosti, da postane aplikacija uporabna v produkciji.
- **Cilj**: Vsi testi zeleni, coverage >90%, AI deluje brez crashov.
- **Issue-i ki pripadajo tu**:
  - [x] CS-001/CS-007 Unified `applyEngineMove` (search+quiescence+openingBook)
  - [x] CS-002 Opening book uporablja `applyEngineMove` (castling/en passant/promocija)
  - [x] CS-003 Stale AI cancellation (version token)
  - [x] CS-004 `seedPositionCounts` (začetna pozicija v trikratnem ponavljanju)
  - [x] CS-005/CS-009 Enosmerni graf odvisnosti + centralizirane pretvorbe (`board.ts`)
  - [x] CS-006 Skupni pomočniki za apply/undo/redo (`moveStateHelpers.ts`)
  - [x] CS-008 Reset TT ob reset/mode toggle + TT size cap
  - [x] CS-010 Draw pravila tudi v engine (50-move + ponavljanje)
  - [x] CS-011 Template-literal `Square` + obvezna osnovna polja `GameState`
  - [x] CS-012 Optional → required callbacks (GameControlsProps)
  - [x] CS-013 Mrtva SET_EN_PASSANT_TARGET action → remove
  - [x] CS-014 Poceni razločevanje SAN (`attacksSquare` + `isMoveLegal`)
  - [x] CS-015 Terminalna stanja v search le pri praznem `genMoves()`
  - [x] CS-016 buildMoveRecord timestamp → optional (determinizem)
  - [x] UX: Ctrl/Cmd Z/Y undo/redo bližnjice
  - [x] UX: AI Difficulty/Style/Side selects v GameControls (PVAI mode)
  - [x] Testi: 251/251 zeleno, coverage 97.37/90.41/97.26/97.37 %
- **Progress**: 100% ✅

---

## 🚀 Blizu prihodnost (1-2 tedna dela)

### Milestone: **"v1.0 - Production Ready"**
- **Rok**: 2026-10-07 (primerno za 2 tedna dela)
- **Opis**: Aplikacija je "production quality". Poln pokritost testi, robusten AI (zmage v endgamu ne izgubi), UI polish, pristna a11y audit.
- **Vključi**:
  - **Engine**:
    - [x] CS-009: časovni budžet iterative deepening je v `ai.ts` (`computeBestMove`, SRP)
    - [~] Endgame tablebase za KQ vs K, KR vs K — delno: mop-up + `forcedMateEndgameHeuristic`, pokrito z `mate.endgame.test.ts` (prava tablebase ostaja odprta)
    - [x] Null-move pruning + Late Move Reduction (`search.ts` — null-move z izklopom v končnicah, redukcija kasnejših potez)
    - [x] SEE (Static Exchange Evaluation) robustness (`seeGain` + `buildAttackerMap`)
  - **Refactor / arhi**:
    - [x] CS-005: kognitivna kompleksnost reduktorja (razdeljeno na `gameReducer` + `moveStateHelpers`)
    - [x] CS-006: razdelitev `useChessGame.ts` (→ `useAIManager`, `useUndoRedo`, `useGameState`, `usePieceHandlers`; 71 vrstic)
    - [x] DRY helperji za legalnost potez (`applyEngineMove`, `isMoveLegal`, `attacksSquare`)
  - **UX / UI polish**:
    - [ ] Grafična zgodovina potez (#13: predogled poteze ob hoveru)
    - [x] Indikator "AI razmišlja" z napredkom (#14: globina X/Y, eval v cp, PV linija v SAN, pretečeni čas/proračun)
    - [ ] Šahovnice za figure (Unicode ligature) + option za SVG/PNG figure
    - [ ] Board theming (#11: izbira light/dark barv šahovnice)
  - **A11y & QA**:
    - [x] jest-axe audit celotnega <App/> drevesa (`App.a11y.test.tsx`)
    - [ ] Manual screen reader test (VoiceOver/NVDA) - preveri check/checkmate announcement
    - [x] Coverage pragovi dvignjeni na DoD (95/90/95/95), dejansko 97.52/91.53/97.40/97.52 %
    - [~] Smoke test za kombinacije modov — delno pokrito z integracijskimi a11y testi
- **Obljubljivosti (DoD)**:
  - [x] `npm run build` → 0 warningov
  - [x] `npm run test:coverage` → Statements ≥95%, Functions ≥95%, Lines ≥95%, Branches ≥90%
  - [x] `npm run lint` → 0
  - [ ] Ročno preverjeno v Chrome/Safari/Firefox + mobilni Safari (iOS + Android)
- **Progress**: ~80% (tehnični dolg zaključen; ostajajo preostale UX/UI polish postavke in ročni QA)

### Milestone: **"v1.1 - Multiplayer Online"**
- **Rok**: 2026-10-30 (primerno)
- **Opis**: Online igranje proti soigralec prek povezave. Izberiš kateri stack želiš.
- **Predlog tehnologije**: Supabase (Postgres + Realtime + Auth + Row Level Security).
- **Vključi**:
  - [ ] Room creation (url: `/game/:roomId` with 6-digit PIN)
  - [ ] Bela/Crna dodelitev sobam
  - [ ] Auth: anonimni gostje + OAuth (Google/Apple) za profile
  - [ ] Realtime premiki (SSE / WebSocket) + spectator mode
  - [ ] Chat med igralca (moderiran, emoji reakcije za hitro)
  - [ ] Game time (Bullet/Blitz/Rapid/Classical) + increment + premik na čas
  - [ ] Premor v redu, odjava, remi ponudba → ½-½ (standard FIDE pravila)
  - [ ] Rang / ELO (Glicko-2) za auth-anje uporabnike
  - [ ] Arhivirane igre → pregled + PGN download + share link
- **DoD**:
  - Realno deluje 2 igralca iz različnih računalnikov / IPjev
  - Povezava se ne prebije ob disconectu → reconnect
  - RATE LIMIT za premike (no cheating!)

---

## 🚀 Dolgoročno (3+ mesecev)

### Milestone: **"v2.0 - Coach & Analysis mode"**
- **Rok**: 2026-12-31
- **Opis**: Iz šahovnice za "igranje" napraviš še coach orodje.
- **Vključi**:
  - [ ] Analysis board: poljubno urejanje pozicij (vklopi "setup mode")
  - [ ] PGN import/export (screenshot PGN → OCR → board position = "šahaško fotografijo naložiš")
  - [ ] Engine analiza + prikaz VRSTICE potez (Principle Variation) z barvami:
    - ⟳ Zmožnik premik (Engine Top-1)
    - ⚠️ Manjša napaka (Inaccuracy)
    - ❌ Velika napaka (Mistake)
    - 💀 Hud napaka (Blunder)
    - ✅ Dobra poteza (Good)
    - ⭐ Dobra poteza, ki je bila izven top-1 (Brilliant!)
  - [ ] Centipawn graf (0.0 -> ±10, x-os=st. potez, y-os=eval)
  - [ ] Coach mode: "Kaj je naslednja zmagovalna poteza?" + namigi + explain (za vsako potezo napiši 1 stavek zakaj je dobra)
  - [ ] Daily puzzle: 1 dan = 1 tactical puzzle (mate in 2 / 3), ranking rešitev
  - [ ] Tutorial: kako premikati figure za začetnike (za vsako figuro posebej, "Slah")
  - [ ] Lichess / Chess.com embed (če so API-ji odprti) - naloži partijo iz linka

### Milestone: **"v3.0 - Platforma"**
- **Rok**: 2027 (odprt za dogodivščine)
- **Opis**: Če postane to res "velik projekt".
- **Vključi**:
  - Turnirji pod okvirjem (Round Robin / Swiss par)
  - Tv / spectator mode za turnire + komentar
  - Lichess Bot API → bot boš lahko dal igrati online proti drugim botom
  - Trainer za otvoritve: "najbolj pogoste linije za 1.e4" in repeticija + flashcards
  - Dark/light tema za UI
  - Namizna aplikacija (Tauri/Electron) za offline in hitrejše
  - iOS / Android aplikacija (Capacitor / React Native)

---

## 🗺️ Kako dodati nov milestone?

Če želiš dodati nov milestone:
1. Odpri https://github.com/gregor-dela/demo-chess-board/milestones
2. Klikni **New milestone**
3. Ime (npr. v1.0), Due date, Opis izkopiraj od tu
4. Shrani

Nato v vsakem issue, ki mu želiš dodeliti milestone: desno zavihček "Milestones" → izberi.
