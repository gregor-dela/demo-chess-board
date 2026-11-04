# Demo Chess Board Frontend Design

## Povzetek

Ta specifikacija opisuje prenovo frontend predstavitve za `demo-chess-board` z jasno omejitvijo: izboljšati vizualno kakovost in uporabniško berljivost obstoječe igralne izkušnje brez posega v pravila šaha, AI logiko ali temeljni reducer stanja.

Predlagana smer je `editorial board-first`: temnejši, bolj premium in bolj discipliniran vmesnik, kjer je šahovnica osrednji vizualni element, kontrole pa delujejo kot urejen turnirski panel in ne kot skupek posameznih gumbov.

## Cilji

- Dvigniti občutek kakovosti iz “demo aplikacije” v “premišljeno oblikovano chess experience”.
- Ohraniti obstoječo funkcionalnost in dostopnost.
- Izboljšati hierarhijo informacij okoli:
  - trenutnega igralca
  - statusa igre
  - AI razmišljanja
  - nadzornih akcij
  - vizualnih signalov na šahovnici
- Ohraniti nizko tveganje za regresije z omejitvijo sprememb predvsem na prezentacijski sloj in lažje UX izboljšave.

## Ne-cilji

- Ni sprememb pravil premikanja figur.
- Ni sprememb AI odločanja, search logike ali engine modulov.
- Ni refaktorja `useChessGame` reducerja, razen če se pokaže minimalna potreba po boljšem posredovanju že obstoječih UI stanj.
- Ni širjenja aplikacije v marketing landing page ali večstranski produkt.
- Ni odstranjevanja obstoječe keyboard, touch ali drag-and-drop podpore.

## Oblikovna Smer

### Koncept

Vmesnik naj daje občutek `digitalne turnirske mize`. Šahovnica je “predmet v prostoru”, osvetljen in uokvirjen, preostali UI pa je tih, eleganten in hierarhično urejen.

### Vizualni atributi

- Zelo temno, skoraj črno ozadje z blagim gradientom ali skoraj neopazno teksturo.
- Board container z nežnim notranjim shadow efektom, tanko obrobo in občutkom globine.
- Topli svetli toni za svetla polja in globlji grafitno-rjavi ali olivno-dimljeni toni za temna polja.
- En primarni poudarek za aktivna stanja, npr. medeninasto zlata ali hladno jantarna.
- Ločen opozorilni poudarek za `check` in sorodna kritična stanja.
- Tipografska kombinacija:
  - display/serif za naslov in ključne statusne poudarke
  - čist sans-serif za kontrolne elemente, meta informacije in gostejše besedilo

### Občutek interakcije

- Miren, samozavesten, brez kičastih efektov.
- Mikrointerakcije naj bodo subtilne: hover, focus, selected in active stanja naj delujejo usklajeno.
- Signalizacija naj bo jasna, ne preglasna.

## Informacijska Arhitektura

### Glavna postavitev

Obstoječa dvostolpčna logika ostane, a se bolj disciplinira:

- levo: dominanten board
- desno: večsekcijski control panel

Na večjih zaslonih ostane board vizualno središče. Na manjših zaslonih se panel premakne pod board, vendar ostane razdeljen na jasne kartične sekcije.

### Panel sekcije

Predlagane sekcije v `GameControls`:

1. `Game status`
   - current player
   - active / check / checkmate / stalemate / draw
   - AI thinking indikator
2. `Match settings`
   - mode toggle
   - board orientation
   - AI nastavitve
3. `History actions`
   - undo
   - redo
4. `Danger action`
   - reset
5. `Move history`
   - obstoječa SAN zgodovina, vizualno bolje vključena v panel

To uporabniku omogoča, da najprej prebere stanje partije, nato možnosti konfiguracije, nato akcije.

## Komponentne Spremembe

### `App.tsx`

Odgovornost:
- boljši page shell
- naslovni blok
- ozadje in globalno uokvirjanje vsebine

Predlagane spremembe:
- zamenjava trenutnega svetlega ozadja z editorial-dark shellom
- dodatek krajšega, premium naslovnega bloka
- omejitev širine in boljši vertikalni ritem

### `ChessGame.tsx`

Odgovornost:
- boljši razpored boarda in panela
- doslednejši responsive layout

Predlagane spremembe:
- bolj natančen grid/flex layout za board in side panel
- bolj uravnoteženi razmiki
- panel naj deluje kot namenska “match console” površina

### `GameControls.tsx`

Odgovornost:
- hierarhija informacij
- jasnejše grupiranje
- bolj premišljena CTA prioriteta

Predlagane spremembe:
- status igre na vrhu kot najbolj poudarjen blok
- bolj čitljivo razlikovanje primarnih in sekundarnih akcij
- reset vizualno ločen od undo/redo
- AI thinking predstavljen kot stanje, ne samo inline besedilo
- boljša vizualna organizacija move history

### `ChessBoard.tsx`

Odgovornost:
- board framing
- vizualna prezenca šahovnice
- usklajen highlight sistem

Predlagane spremembe:
- močnejši zunanji okvir boarda
- bolj eleganten styling koordinat
- boljša integracija zadnje poteze, valid moves in selected stanja
- ohranitev obstoječih a11y atributov

### `ChessSquare.tsx`

Odgovornost:
- vizualna prioriteta različnih stanj polja
- hover/focus/selected/valid/last-move/check konfliktna pravila

Predlagane spremembe:
- definiranje jasnega vrstnega reda signalov
- focus ring naj ostane izrazit tudi v temni temi
- valid move indikatorji naj bodo bolj prefinjeni in manj “default demo” občutka

### `ChessPiece.tsx`

Odgovornost:
- po potrebi izboljšava kontrasta in teže figur

Predlagane spremembe:
- brez menjave semantike ali drag vedenja
- po potrebi prilagoditev velikosti, shadowa ali kontrasta za bolj premium prisotnost na poljih

### Skupni styling sloj

Po potrebi dodamo ali razširimo skupni styling v:
- `src/index.css`
- ali konsistentno prek Tailwind utility/class kombinacij

Cilj je centralizirati:
- barvne tokene
- panel površine
- border/shadow/radius sistem
- naslovno tipografijo
- stanja gumbov in highlight signalov

## Pravila Vizualne Prioritete

Da se signali ne tepejo med sabo, naj velja ta vrstni red pomembnosti:

1. `check` / kritično stanje
2. `selected square`
3. `valid move`
4. `last move`
5. `hover`
6. `default square styling`

To pomeni:
- zadnja poteza ne sme preglasiti aktivno izbrane figure
- valid moves morajo ostati berljive nad board stylingom
- focus mora ostati dostopen in ne sme izginiti pod dekorativnimi efekti

## Odvisnosti in Podatkovni Tok

Arhitektura stanja ostane enaka:

- `useChessGame` ostane glavni vir trutha za `gameState`
- UI komponente še naprej berejo obstoječa stanja in callbacke
- ni načrtovana nova globalna state plast

Možni minimalni dodatki so dovoljeni samo, če so potrebni za bolj čist prikaz že obstoječih UI stanj, npr. če bi bilo lažje oblikovati statusni blok z manjšim preurejanjem propsov ali izpeljanih label.

## Dostopnost

Prenova mora ohraniti ali izboljšati obstoječo dostopnost:

- role in accessible names za polja morajo ostati nedotaknjeni
- keyboard flow mora ostati ekvivalenten miškinemu
- focus states morajo biti v dark temi še jasnejši kot prej
- kontrast statusnih in akcijskih elementov mora ostati zadosten
- promotion dialog, reset confirmation in live status regije ne smejo izgubiti dostopnosti

## Responsive Vedenje

### Desktop

- board dominira
- side panel stoji ob njem
- dovolj praznega prostora, da UI deluje premium

### Tablet

- layout ostane dvo-conski, a z manjšimi razmiki
- panel se po potrebi zoži brez gneče

### Mobile

- board ostane prvi
- panel se prestavi pod board
- sekcije v panelu ostanejo ločene in hitro skenljive
- kontrolni elementi morajo ostati dovolj veliki za dotik

## Tveganja in Varovala

### Tveganje: preveč vizualnih signalov

Možen problem:
- selected, valid, check in last move se začnejo prekrivati

Varovalo:
- oblikujemo enoten sistem prioritet in ga preverimo v več kombinacijah stanj

### Tveganje: regressions zaradi večjih strukturnih sprememb

Možen problem:
- testi ali a11y pričakovanja padejo, če se DOM preveč spremeni

Varovalo:
- raje preuredimo vizualne skupine kot da na novo sestavimo celotno funkcionalno strukturo

### Tveganje: dark theme poslabša čitljivost

Možen problem:
- slab kontrast tekstov, koordinat ali kontrol

Varovalo:
- preverjanje kontrasta na statusnem bloku, gumbih, fokusnih obrobah in board označitvah

## Testna Strategija

Ker je poseg predvsem frontend in UX plast, mora implementacija slediti obstoječim smernicam TDD iz repozitorija.

Predvideni testni učinki:

- obstoječi testi naj ostanejo zeleni
- po potrebi posodobimo teste, če se spremeni pričakovana semantika besedil ali grupiranja
- dodamo teste samo tam, kjer nova predstavitev ali nova UI hierarhija pomeni novo vedenje

Posebej preveriti:

- `GameControls` status, skupine akcij in disabled stanja
- `ChessBoard`/`ChessSquare` fokus in highlight prisotnost
- keyboard-only tok po prenovi
- tematski kontrast skozi obstoječe a11y teste, kjer je relevantno

Pred izvedbo merge:

- `npm run lint`
- `npm run test:quick`
- po večjih spremembah še `npm test`

## Predlagan Implementacijski Rez

Uspešna izvedba pomeni:

- aplikacija vizualno deluje bolj kot premišljen chess product
- board je jasen hero element
- control panel je hierarhičen in lažje berljiv
- status igre in AI thinking sta bolje izpostavljena
- highlight sistem je bolj prefinjen in manj generičen
- obstoječa funkcionalnost, dostopnost in ključni testi ostanejo ohranjeni

## Odprta Odločitev

Za izvedbo ostaja ena oblikovna odločitev, ki jo lahko določimo med implementacijo:

- ali bo poudarni ton bolj `medeninasto topel` ali bolj `hladno jantarno nevtralen`

Obe smeri ustrezata potrjenemu editorial-dark konceptu. To odločitev lahko sprejmemo med implementacijo brez vpliva na arhitekturo.
