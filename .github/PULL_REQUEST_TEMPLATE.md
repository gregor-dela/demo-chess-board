<!--
PR Checklist za chess-board projekt.
Pusti stvari ki niso relevantne NEPREVERJENE, razen če veste da gre narobe.
-->

## Kaj spremeni ta PR?
<!-- Jasen opis sprememb in zakaj so narejene. Primer: -->
<!--
- refactor(engine): Unified `applyEngineMove` helper za single source of truth (CS-001/CS-007)
- fix(ai): Stale AI result cancellation z version token (CS-003)
- feat(ux): Keyboard shortcuts Ctrl/Cmd Z/Y za undo/redo
- test: Coverage za applyEngineMove, AI UI, keyboard shortcuts
-->

- ...
- ...

## Povezani issue-i
<!-- `Fixes #123` ali `Closes #456` -->
Fixes #

## Kako sem preveril?
<!-- Ustrezni checkboxes pogoji -->

- [ ] Lint: `npm run lint` → 0 warnings/errors
- [ ] Testi: `npm test -- --run` → Vsi pretekli
- [ ] Coverage: `npm run test:coverage` → Statements ≥80%, Functions ≥80%, Lines ≥80%, Branches ≥70%
- [ ] Quick test (pre-commit): `npm run test:quick` → ok
- [ ] Build: `npm run build` → Zgradi se brez napak
- [ ] Živi test: `npm run dev` → Ročno preveril:
  - [ ] PvE: Naredim potezo, AI odgovori, ni crasha
  - [ ] Undo / Redo deluje (tipke + gumb)
  - [ ] Castling (K + Q side), en passant, promotion delujejo
  - [ ] Check / checkmate / stalemate pravilno
  - [ ] Toggle orientation, toggle mode delujeta

## Razvrstitev vrste spremembe
- [ ] 🐞 Bug fix (nebreaking popravek)
- [ ] ✨ Feature (nebreaking nova funkcionalnost)
- [ ] 💥 Breaking change (popravek ali feature, ki krši obstoječo kompatibilnost)
- [ ] 🧹 Refactor (brez spremembe APIja ali UI behaviorja)
- [ ] 📝 Documentation
- [ ] 🧪 Tests / CI
- [ ] 🛠 Chore (npm, husky, build config…)

## Preverjanje dostopnosti (a11y)
<!--
Vazno! Keyboard first, potem miška, potem dotik.
Namig: jest-axe je že vključen v teste, raje dodaj test!
-->
- [ ] Vsi interaktivni elementi imajo `role` + dostopno ime (aria-label / for-id)
- [ ] Deluje samo s tipkovnico (Tab + Enter/Space)
- [ ] Živi status (check/checkmate) se objavi v `role="status"` / `aria-live="polite"`
- [ ] Modalni okni (promotion/reset) imajo focus trap in Escape za cancel
- [ ] jest-axe: ni novih accessibility težav

## Razlaga (če potrebno)
<!-- Kratek opis arhitekturne odločitve, če so spremembe velike.
     Npr. "Zamenjal sem 3 kopije apply() v search/quiescence/openingBook z eno funkcijo v chessUtils, da DRY + enako vedenje."
-->

## Screenshoti / video (če UI sprememba)
<!-- Pred / Po -->
