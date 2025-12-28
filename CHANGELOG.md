# Dnevnik sprememb

Vse pomembne spremembe tega projekta so dokumentirane v tej datoteki.

## Neizdano

### Dodano
- Način igre "Človek vs AI" z gumbom za preklop in indikatorjem "AI razmišlja..."
- AI pogon z knjigo otvoritev, ocenjevanjem pozicije, iskanjem (alfa-beta in quiescence) ter transpozicijsko tabelo
- Preklop orientacije šahovnice (whiteBottom/blackBottom)
- Zaznava remija: trikratna ponovitev in pravilo 50 potez (halfMoveClock/positionCounts)
- Označevanje zadnje poteze na plošči
- Testi za AI integracijo, orientacijo plošče in pravila remija


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
