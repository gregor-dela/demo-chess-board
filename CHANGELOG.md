# Dnevnik sprememb

Vse pomembne spremembe tega projekta so dokumentirane v tej datoteki.

## Neizdano

### Izboljšano
- #11: barvna tema šahovnice — nov modul `boardThemes.ts` ponuja pet palet (Classic, Emerald, Ocean, Amethyst, Slate); barvi polj se nastavita prek CSS spremenljivk `--board-light`/`--board-dark` na `.board-grid`, uporabnik pa ju izbere z izbirnikom "Board theme" v `GameControls` (akcija `SET_BOARD_THEME`)
- #11: izbrana tema se ohrani ob resetu igre (`RESET_GAME` vrne privzeto stanje z isto `boardTheme`); neznana tema varno pade nazaj na Classic
- hitrejše vlečenje figur: ob pritisku z levim gumbom miške na figuro trenutnega igralca se ta takoj izbere (akcija `SELECT_SQUARE` prek `onPointerDown`), veljavne poteze pa so označene še pred sprožitvijo nativnega vlečenja; `:active` povečava figure brez prehoda in oster drag feedback (`setDragImage`, `effectAllowed = 'move'`), da se občutek približa chess.com
- #13: grafična zgodovina potez — vrstice zgodovine v `GameControls` so interaktivni gumbi; ob hoveru ali fokusu se izvorno in ciljno polje poteze označita na plošči (`.chess-square-preview-move`), ob izgubi fokusa/hoverja pa oznaka izgine
- #13: `previewMove` (`MovePreview`) v stanju igre in akcija `SET_PREVIEW_MOVE` prek `useChessGame.setPreviewMove`; predogled se samodejno počisti ob vsaki spremembi zgodovine (`MAKE_MOVE`, `COMPLETE_PROMOTION`, `UNDO_MOVE`, `REDO_MOVE`, `RESET_GAME`), da ne zaostaja za dejanskim stanjem
- #14: kartica napredka iskanja AI v `GameControls` (PVAI) — prikaz globine (`X / Y`), ocene v centipawnih z vidika belih, PV linije v SAN in pretečenega časa/proračuna; kartica se prikaže med razmišljanjem in skrije ob koncu
- #14: `computeBestMoveProgress` — async generator z iterativnim poglabljanjem, ki po vsaki dokončani globini objavi napredek (`AiProgress`); `computeBestMove` ostaja tanek sinhroni ovoj (porabi generator in vrne končno potezo)
- #14: PV se rekonstruira iz transpozicijske tabele (`extractPrincipalVariation` v `search.ts`), brez dodatnega iskanja
- #14: `formatPrincipalVariation` pretvori koordinatno PV v oštevilčen SAN zapis (upošteva zajeme, rokado, promocijo in disambiguacijo)
- CS-015: optimizacija iskanja — `isKingInCheck` preverja napad na kraljevo polje neposredno (brez generiranja seznamov potez), attack map za SEE se zgradi največ enkrat na node, kraljevo polje nasprotnika se izračuna enkrat na node
- CS-015: terminalna stanja (mat/pat) se hranijo v transpozicijski tabeli in se ob ponovnem obisku vrnejo takoj
- CS-014: razločevanje SAN uporablja poceni `attacksSquare` + `isMoveLegal` namesto polne generacije potez (`getValidMoves`)
- odzivna velikost šahovskih polj prek CSS spremenljivke `--square-size` (`clamp`), da se plošča na ozkih zaslonih (375/360/320 px) krči brez vodoravnega overflowa
- višji kontrast za dostopnost: gumb "Reset game" (`rose-600`/`rose-700`) in prazna zgodovina potez (`slate-400`)
- dostopnost plošče: roving tabindex — v zaporedju Tab je le eno polje šahovnice (prej vseh 64); med polji se premikamo s puščicami (gor/dol/levo/desno) po vzorcu ARIA grid, fokus se samodejno sinhronizira z aktivnim poljem

### Spremenjeno
- CS-011 – template-literal `Square` (`File`+`Rank`) in obvezna osnovna polja `GameState` (`halfMoveClock`, `positionCounts`, `mode`, `aiSettings`, `aiThinking`)
- CS-005/CS-009 – izluščena `board.ts` (brez odvisnosti) in `notation.ts`; pretvorbe koordinat centralizirane, krožna odvisnost prekinjena
- CS-006 – izdvoji apply/undo/redo helperje iz reducerja (`src/hooks/moveStateHelpers.ts`); reducer switch skrajšan s ~400 na 138 vrstic
- #10 (SRP) – razdelitev `useChessGame.ts` (611 vrstic) na 4 specializirane hooke (`useGameState`, `usePieceHandlers`, `useUndoRedo`, `useAIManager`) in pure reducer modul `gameReducer.ts`; `useChessGame` je zdaj kompozicija (71 vrstic), javni API nespremenjen
- predpomnjene tabele square<->koordinate
- hitrejši isKingInCheck in plitvi klon v isMoveLegal
- izračunaj skupne evaluacijske člene enkrat v evaluate
- memoiziraj ploščo in izloči predogled poteze iz gameState

### Popravljeno
- CS-010 – `quiescence()` zdaj upošteva 50-potezno pravilo (ob `halfMoveClock >= 100` vrne remi, score 0) in pravilno propagira števec navzdol (zajem ali poteza kmeta ga resetira na 0)
- popravki iz pregleda UI: (1) v dialogu za promocijo so bile možnosti neberljive (temno besedilo na belem ozadju ni bilo nastavljeno) — dodano temno besedilo na dialogu in gumbih; (2) indikator "AI is thinking" je ob preklicu (Undo/Reset/sprememba nastavitev) lahko obvisel — uveden ločen žeton razmišljanja v `useAIManager`; (3) v načinu PvAI je Undo po potezi AI sprožil takojšnjo ponovno potezo AI — `useUndoRedo` zdaj odstrani obe potezi, da uporabnik dobi svoj položaj nazaj
- tipkovnica: `Escape` zdaj res odizbere izbrano figuro prek nove akcije `DESELECT_SQUARE` (prej je klic `onSquareClick` isto figuro znova izbral, zato je bil Escape brez učinka)
- dostopnost: indeks poteze v grafični zgodovini (`.history-row__index`) ima `slate-400` namesto `slate-500`, s čimer ustreza pragu kontrasta WCAG AA (axe `color-contrast`, serious)

### Testi
- #11: testi palet in padca na privzeto temo (`boardThemes.test.ts`, 6 testov)
- #11: testi reducerja za `SET_BOARD_THEME` in ohranitev teme ob resetu (`gameReducer.boardTheme.test.ts`, 6 testov)
- #11: testi `ChessBoard` za atribut `data-board-theme` in vrednosti CSS spremenljivk ter `GameControls` za izbirnik teme (`ChessBoard.boardTheme.test.tsx`, `GameControls.boardTheme.test.tsx`, 8 testov)
- hitrejše vlečenje: testi takojšnje izbire ob pritisku z miško (izbere figuro trenutnega igralca; ignorira prazno/tuje polje, dotik in desni gumb) in integracijski test oznake veljavnih potez prek `<ChessGame/>` (`PointerSelection.test.tsx`, 6 testov)
- #13: testi reducerja za `SET_PREVIEW_MOVE` in čiščenje predogleda ob potezi/undo/redo/reset (`gameReducer.previewMove.test.ts`, 7 testov)
- #13: testi `ChessBoard` za označitev polj predogleda, odsotnost oznak brez predogleda, delovanje pri `blackBottom` in kotni potezi (`ChessBoard.previewMove.test.tsx`, 4 testi)
- #13: testi `GameControls` za hover/izstop, fokus/blur, ločen predogled po vrsticah, dostopna imena vrstic in odsotnost vrstic brez potez (`GameControls.previewMove.test.tsx`, 5 testov)
- #13: integracijski testi predogleda prek `<ChessGame/>` — hover označi na plošči, tipkovnični fokus, undo med predogledom počisti oznako, jest-axe brez kršitev (`MovePreview.integration.test.tsx`, 4 testi)
- #14: testi za generator napredka (`ai.progress.test.ts`) — en zapis na globino, pretvorba ocene na vidik belih, veja otvoritvene knjižnice, remi pri `halfMoveClock ≥ 100`, časovni proračun (faza igre, šah, stil)
- #14: testi reducerja za `SET_AI_PROGRESS` in čiščenje napredka ob `SET_AI_THINKING(false)` (`gameReducer.aiProgress.test.ts`)
- #14: testi `useAIManager` z mockanim generatorjem — objava napredka ob vsakem yieldu, izvedba poteze na koncu, prekinitev ob zastareli verziji (`useAIManager.progress.test.ts`)
- #14: testi kartice v `GameControls` (prikaz/skritje, otvoritvena poteza, oblikovanje ocene) in `formatPrincipalVariation` (oštevilčenje, zajem, rokada, promocija)
- CS-014: test pripete figure — pripeti kandidat ne zahteva razločevanja SAN (`Bc2`)
- CS-011: `tsc --noEmit` čist tipski prehod; obstoječih 250 testov nespremenjenih
- CS-010: enotski testi za 50-potezno pravilo v `quiescence()` (`quiescence.test.ts`) in integracijski AI testi prek `computeBestMove` (`ai.draw.integration.test.ts`): izogib trikrat ponovljeni poziciji, izbira poteze, ki resetira 50-potezni števec, ter remi pri `halfMoveClock >= 100`
- CS-015: Scholar's mate regresijski test (Qxf7#), benchmark globine 4 s časovnim pragom in test terminalnosti v TT
- #12 (a11y): end-to-end `App.a11y.test.tsx` — jest-axe audit celotnega drevesa `<App/>` in odprtih (portal) dialogov, tipkovnični/Enter flow do šahovskih polj ter Escape in Tab+Enter za potrditveni in promocijski dialog
- CS-006: pure-function testi za `createMoveFromState`/`applyMoveToState`/`undoMoveInState`/`redoMoveInState` (14 testov)
- #10: unit testi za nove hooke (`useGameState`, `usePieceHandlers`, `useUndoRedo`, `useAIManager`) — 11 novih testov
- CS-013: testi za AI nastavitve v `GameControls` — vse oznake težavnosti (depth 1–6, privzeti `?? 3`), oznake stila igre (balanced/aggressive/positional), veja `aiPlays === 'white'` ter posredovanje `onSetAiSettings` prek vseh treh izbirnih polj
- CS-012/CS-013: robni primeri v `usePieceHandlers` — neveljavna izvorna/ciljna polja in `from === to` ne sprožijo poteze
- regresijski testi za pregled UI: berljivost možnosti promocije (`PromotionDialog.ui.test.tsx`), pošiljanje `SET_AI_THINKING(false)` ob preklicu iskanja (`useAIManager.progress.test.ts`) in dvojni Undo v PvAI (`useUndoRedo.test.ts`)
- sistematični QA prehod v pravem brskalniku (Playwright): prave geste (miš/touch), tipkovnica in bližnjice, posebna pravila šaha (rokada, mimohod, promocija, trojna ponovitev, šah-mat), polni axe pregled v vseh stanjih in meritve delovanja — na podlagi tega dodani regresijski testi v `KeyboardMoves.test.tsx` (Escape odizbere figuro, en sam tab stop na plošči, premik fokusa s puščicami)

### Dokumentacija
- označi #11 (board theming) kot zaključen v `docs/MILESTONES.md` in osveži napredek milestona v1.0
- osveži `docs/ARCHITECTURE.md`: `boardTheme` v `GameState`, modul `boardThemes.ts`, CSS spremenljivki teme na plošči in takojšnja izbira ob pritisku; `README.md`: izbira teme plošče in odzivnejše vlečenje; `AGENTS.md`: povzetek teme in hitrejšega vlečenja
- označi #13 (grafična zgodovina potez) kot zaključen v `docs/MILESTONES.md` in osveži napredek milestona v1.0
- osveži `docs/ARCHITECTURE.md`: `previewMove` v `GameState`, gumbi zgodovine in oznaka predogleda na plošči; `README.md`: funkcija predogleda poteze ob hoveru/fokusu
- označi #14 (AI loading UI) kot zaključen v `docs/MILESTONES.md` in osveži napredek milestona v1.0
- osveži `docs/ARCHITECTURE.md`: generator napredka AI, rekonstrukcija PV iz TT, `formatPrincipalVariation` in kartica napredka v `GameControls`
- označi CS-005, CS-009, CS-011, CS-014 kot rešene v `docs/CODE_SMELLS.md`
- označi preostale smell-e (CS-001–CS-004, CS-006–CS-008, CS-010, CS-012, CS-013, CS-015, CS-016) kot rešene v `docs/CODE_SMELLS.md` z navedenimi testi
- sinhroniziraj `docs/MILESTONES.md`: MVP milestone 100 %, v1.0 odraža dokončan tehnični dolg in preostale UX/QA postavke
- zabeleži pravilo angleške ključne besede `Closes #N` za samodejno zapiranje izdaj (AGENTS.md)

### Vzdrževanje
- postopno dvigni pragove pokritosti na 90/85/90/90 (vmesni korak proti DoD v1.0)
- dvigni pragove pokritosti na raven DoD v1.0 (statements/lines/functions ≥95, branches ≥90)
- omeji merjenje pokritosti na izvorno kodo (`src/**`), izključi tipe, teste in konfiguracijske skripte
- podaljšaj timeout promotion integracijskega testa pod pokritostjo
- posodobi CHANGELOG za izboljšano matiranje v končnicah
- sinhroniziraj marker `.changelog-last-sha` (#5, #10)
- dodaj playwright in uredi devDependencies

## 2025-09-02 - Popravek napake pri zaznavi mat-a

### Popravljeno
- Popravljena validacija vrste figure v funkciji `isKingInCheck` za pravilno zaznavanje šaha
- Popravljena zaznava mat-a z natančnejšo preverbo šaha pri oceni zakonitosti potez
- Izboljšana zaznava napadov drsečih figur z enotno logiko za lovce, trdnjave in dame

## 2025-09-02 - Dostopnost (A11y) dialoga za promocijo: fokusna past

### Dodano
- Fokusna past za PromotionDialog: Tab/Shift+Tab krožita znotraj dialoga; prejšnji fokus se ob zapiranju obnovi
- UI test preverja zavijanje Tab/Shift+Tab in vedenje preklica z Escape

### PR-ji
- #11

## 2025-09-02 - Potek promocije kmeta in uporabniški vmesnik

### Dodano
- Potek promocije kmeta z `pendingPromotion` v stanju igre in akcijami `REQUEST_PROMOTION`/`COMPLETE_PROMOTION`/`CANCEL_PROMOTION`
- Dostopen PromotionDialog z navigacijo po tipkovnici (puščice, Enter/Space), Escape za preklic in sprotnimi oznanili stanja
- Integracijski testi: potek promocije na ravni hook-ov (undo/redo) in interakcije dialoga na ravni UI

### Spremenjeno
- Posodobljen reducer za zaznavo promocije, ko kmet doseže zadnjo vrsto, in izvedbo promocije s pravilnim SAN (npr. e8=Q, exd8=Q)
- Logika ponovne izvedbe (redo) zagotavlja, da se vrsta promovirane figure pri ponovni izvedbi obnovi

### Dokumentacija
- README posodobljen: promocija kmeta prestavljena med implementirana pravila
- WARP.md posodobljen z PromotionDialog in novimi akcijami/stanjema
- Dokumenta Tehnična arhitektura in Zahteve posodobljena, promocija označena kot implementirana

## 2025-09-02 - Podpora en passant in testi; popravek pravic rokiranja

### Dodano
- Podpora en passant v simulaciji zakonitosti poteze (funkcija `isMoveLegal` zdaj med simulacijo odstrani ujetega kmeta)
- Enotski testi (unit) za generiranje potez en passant (`utils/moveValidation.test.ts`)
- Integracijski test, ki pokriva izvedbo en passant in undo/redo (`hooks/useChessGame.test.ts`)

### Popravljeno
- Funkcija za posodobitev pravic rokiranja ne mutira vhodov; pravilno posodobi pravice glede na barvo ujete trdnjave

### Dokumentacija
- README: en passant prestavljen iz prihodnjih izboljšav med implementirana pravila igre
- WARP.md: posodobljeno, da je en passant implementiran
- Tehnična arhitektura: razdelek 16 označen kot implementiran z podrobnostmi
- Zahteve: zahteve za en passant označene kot implementirane

### Vzdrževanje
- Dodani pragovi pokritosti v `vitest.config.ts` (stavki/vrstice/funkcije ≥ 80 %, vejitve ≥ 70 %)
- Popravljena konfiguracija ESLint za uporabo `plugin:` v `extends`

## 2025-09-01 - Celovita posodobitev dokumentacije

### Dokumentacija
- Posodobljena vsa dokumentacija, da natančno odraža celotno implementacijo:
  - **Dokument Tehnična arhitektura**:
    - Dodan razdelek 12: Zaznava končnice s funkcijami za mat/pat
    - Dodan razdelek 13: Sistem standardne algebrske notacije (SAN)
    - Dodan razdelek 14: Izboljšave uporabniške izkušnje (potrditveni dialogi)
    - Posodobljena hierarhija komponent, vključuje ConfirmationDialog in UI tipe
    - Dodan `getPawnAttacks()` v razdelek zaznave šaha
  - **Dokument Zahteve**:
    - Dodan razdelek 10: Zahteve za zaznavo končnice (vse implementirane ✅)
    - Dodan razdelek 11: Zahteve za notacijo potez (implementacija SAN ✅)
    - Dodan razdelek 12: Zahteve za uporabniško potrditev (reset dialog ✅)
    - Posodobljen prikaz stanja, da prikazuje indikatorje mat/pat/šah
    - Posodobljena zgodovina potez z omembo standardne algebrske notacije
    - Dodan razdelek 13: Zahteve za razveljavitev/ponovno izvedbo (v celoti implementirano)
    - Dodan razdelek 14: Zahteve za rokiranje (v celoti implementirano)
    - Odpravljene nasprotujoče si navedbe o implementaciji rokiranja
  - **WARP.md**:
    - Dodane funkcije zaznave končnice v razdelek validacije potez
    - Dodan `generateAlgebraicNotation()` v dokumentacijo utils
    - Dodana komponenta ConfirmationDialog v sestavo aplikacije
    - Posodobljen opis GameControls, vključuje SAN notacijo in stanje končnice
    - Dodan `redoHistory` v upravljanje stanja
    - Dokumentirano, da je rokiranje v celoti implementirano
    - Dodana akcija `REDO_MOVE` v dokumentirane akcije

## 2025-09-01 - Izboljšave UX potrditvenega dialoga in SSR

### Spremenjeno
- Odstranjen globalni Enter-za-potrditev; zanašanje na fokusiran gumb za preprečitev nenamernih ali dvojnih potrditev.
- Handlerje dialoga shranjujemo v `refs`; glavni učinek je odvisen le od `isOpen`, da se prepreči ponovno naročanje in utripanje fokusa.
- Varnostna namestitev portala za SSR prek zaščite `mounted`; vrne `null` na strežniku ali pred namestitvijo.
- Izhodna animacija za gladko bledenje/skaliranje z zakasnjenim odklopom, da omogoči prehod.

### Vzdrževanje
- Premik `ConfirmationDialogProps` iz tipov domene šaha v `src/types/ui.ts`.

## 2025-09-01 - Potrditev reset in SAN notacija

### Dodano
- Ponovno uporabna, dostopna komponenta ConfirmationDialog in integracija v GameControls. Reset zdaj prikaže potrditveni dialog pred čiščenjem igre.
- Standardna algebrska notacija (SAN) v zgodovini potez z razločevanjem, ujemi, rokiranje in indikatorji šah/mat.
- Podpora generatorja SAN za prihodnje promocije in formatiranje en passant.

### Spremenjeno
- Zaznava napadov kmeta uporablja zgolj diagonalni generator napadov za natančno zaznavo šaha.
- Stanje igre zdaj nastavi 'šah' kjer je ustrezno (ne le aktivno/mat/pat).
- Undo je dovoljen po koncu igre, da lahko uporabniki korakajo nazaj iz položajev mat/pat.

### Dokumentacija
- Posodobljen `README.md` s SAN zgodovino potez in podrobnostmi potrditvenega dialoga reset.

## 2025-09-01 - Zaznava končnice

### Dodano
- Zaznava mat-a in pat-a prek `isCheckmate`, `isStalemate` in `hasAnyLegalMoves` (`utils/moveValidation.ts`).

### Spremenjeno
- `hooks/useChessGame.ts` zdaj samodejno nastavlja `gameStatus` po vsaki potezi in razveljavitvi; `isInCheck` odraža igralca na potezi.
- `components/GameControls.tsx` prikazuje jasna sporočila o končnici in opozorilo "Šah!" med igro; onemogoči Undo po koncu igre.

### Dokumentacija
- Posodobljen `README.md`, da odraža zaznavo končnice in vedenje kontrol.

## 2025-09-01 - Posodobitev natančnosti dokumentacije

### Dokumentacija
- Odpravljene ključne netočnosti v dokumentaciji projekta, da odražajo dejansko implementacijo:
  - **WARP.md**: 
    - Popravljena trditev, da testi niso konfigurirani (testi SO konfigurirani z Vitest)
    - Posodobljen razdelek validacije potez, da odraža, da je zaznava šaha v celoti implementirana
    - Dodana dokumentacija za funkcije upravljanja pravic rokiranja
    - Dodana komponenta ErrorBoundary v razdelek meja interakcij
    - Dodana dokumentacija za pripomočke za validacijo vnosa
  - **Dokument Tehnična arhitektura**:
    - Dodan manjkajoči vmesnik `CastlingRights` v definicije tipov
    - Posodobljen vmesnik `Move` z polji povezanimi z razveljavitvijo (`prevHasMoved`, `prevCapturedHasMoved`, `prevCastlingRights`)
    - Posodobljen vmesnik `GameState` z dodanim poljem `castlingRights`
    - Dodan ErrorBoundary v hierarhijo komponent
    - Dodan nov razdelek Testna arhitektura, ki dokumentira nastavitev Vitest
    - Počistili, da je zaznava šaha implementirana (razdelek 10)
  - **Dokument Zahteve**:
    - Posodobljen razdelek omejitev, da pojasni, da se pravice rokiranja SPREMLJAJO (poteze pa niso implementirane)
    - Dodani kljukice, ki kažejo, da so zahteve za zaznavo šaha izpolnjene
    - Dodan nov razdelek Zahteve testiranja

## 2025-09-01 - Implementacija rokiranja in ponovne izvedbe (redo)

### Dodano
- Polna funkcionalnost rokiranja na kraljevi in damini strani
- Validacija rokiranja v funkciji `getKingMoves` s celovitimi preverjanji:
  - Preverjanje pravic rokiranja (kralj in trdnjava se nista premaknila)
  - Preverjanje prostosti poti (ni figur med kraljem in trdnjavo)
  - Preverjanje varnosti (kralj ni v šahu, ne gre skozi šah, ne konča v šahu)
- Izvedba rokiranja v game reducerju:
  - Samodejen premik trdnjave ob rokiraju kralja
  - Pravilne posodobitve pravic rokiranja
  - Podpora za razveljavitev rokiranja (obnovi poziciji kralja in trdnjave)
- Podpora SAN za rokiranje (O-O za kraljevo stran, O-O-O za damino stran)
- Popolna funkcionalnost ponovne izvedbe (redo):
  - Tabela `redoHistory` sledi razveljavljenim potezam
  - Akcija `REDO_MOVE` ponovno izvede razveljavljene poteze
  - Gumb Redo v GameControls z ustrezno logiko omogočanja/onemogočanja
  - Popolna obnova stanja, vključno z rokirnimi potezami

### Spremenjeno
- Posodobljena funkcija `getKingMoves`, ki sprejme parameter `castlingRights`
- Izboljšana funkcija `getValidMoves`, ki posreduje pravice rokiranja validaciji kraljevih potez
- Spremenjen game reducer za obravnavo izvedbe rokiranja in operacij razveljavitve

### Dokumentacija
- Posodobljen `README.md`, vključuje rokiranje med implementirane funkcije in pravila igre
- Dodana navodila za rokiranje v "Kako igrati"
- Rokiranje odstranjeno s seznama "Prihodnje izboljšave"
- Posodobljena vsa tehnična dokumentacija, ki odraža implementacijo rokiranja in redo

## 2025-09-01 - Začetna implementacija

### Dodano
- Celovita validacija vnosa povleci-in-spusti.
  - `components/ChessPiece.tsx`: validacija in sanacija polja ob začetku vlečenja; preprečevanje neveljavnih vlečenj; `try/catch` in beleženje napak.
  - `components/ChessSquare.tsx`: validacija podatkov vlečenja (`isValidDragData`) in obeh polj (`isValidSquare`) ob spustu; preprečevanje spustov na isto polje; `try/catch` z beleženjem napak.
- Meja napak (ErrorBoundary) za elegantno obravnavo napak.
  - `components/ErrorBoundary.tsx`: ponovno uporabna meja napak z nadomestnim UI in gumbom Reset; beleži napake prek `componentDidCatch`.
  - `components/ChessBoard.tsx`: ovije mrežo plošče in oznake datotek z ErrorBoundary.
- Testna infrastruktura in enotski testi.
  - Dodana konfiguracija in skripti Vitest; `devDependencies` vključujejo `vitest`, `@vitest/ui`, `jsdom` in `@testing-library/react`.
  - `src/hooks/__tests__/useChessGame.test.ts`: testi za vedenje razveljavitve, ujeme, poteze trdnjave/kralja, ki vplivajo na pravice rokiranja, učinki ujete trdnjave in obnova pri razveljavitvi.
  - `src/utils/__tests__/chessUtils.test.ts`: testi za pomočnike in posodobitve pravic rokiranja, vključno s scenariji ujete trdnjave.

### Spremenjeno
- Izvlečeno magično število 8 v konstanto in uporabljeno v pripomočkih ter validaciji potez.
  - `utils/chessUtils.ts`: uveden `BOARD_SIZE = 8`; zamenjane trdo kodirane vrednosti pri pretvorbi koordinat, postavitvi plošče in validaciji; dodani pomočniki `isValidDragData` in `sanitizeSquareInput`.
  - `utils/moveValidation.ts`: uporaba `BOARD_SIZE` za zanke dosega trdnjave in lovca namesto trdo kodirane 8.
  - `hooks/useChessGame.ts`: uporaba `BOARD_SIZE` v pretvorbah koordinat za MAKE_MOVE/UNDO_MOVE; izboljšana validacija `handlePieceDrop` (preverbe formata in `from !== to`) z beleženjem napak.
- Obravnava razveljavitve in pravic rokiranja.
  - `types`: razširjen `Move` za shranjevanje `prevHasMoved`, `prevCapturedHasMoved` in `prevCastlingRights`; `GameState` zdaj sledi `castlingRights`.
  - `utils/chessUtils.ts`: dodani `createInitialCastlingRights`, `isKingMove`, `isRookMove` in `updateCastlingRightsForMove(rights, piece, from, to, captured?)` za onemogočanje rokiranja, ko se kralj/trdnjava premakne ali je trdnjava ujeta na a1/h1/a8/h8.
  - `hooks/useChessGame.ts`: odpravljen UNDO hrošč za obnovo `hasMoved` in stanja ujete figure; beleži prejšnja stanja v zgodovino potez in skladno posodobi/obnovi pravice rokiranja.
- Zaznava šaha in filtriranje zakonitih potez.
  - `utils/moveValidation.ts`: dodani `findKingPosition`, `isKingInCheck` in `isMoveLegal`; `getValidMoves` zdaj filtrira poteze, ki pustijo lastnega kralja v šahu.
  - `hooks/useChessGame.ts`: po `MAKE_MOVE` nastavi `isInCheck`, če je nasprotnikov kralj v šahu; po `UNDO_MOVE` ponovno izračuna `isInCheck` za naslednjega trenutnega igralca.
