import { describe, it, expect } from 'vitest'
import {
  categorize,
  subjectText,
  groupCommits,
  parseUnreleasedSection,
  renderUnreleasedSection,
  mergeUnreleased
} from '../changelog.mjs'

const CHANGELOG = `# Dnevnik sprememb

Vse pomembne spremembe tega projekta so dokumentirane v tej datoteki.

## Neizdano

### Izboljšano
- ročno napisan vnos

### Spremenjeno
- obstoječa sprememba

## 2025-09-02 - Stara izdaja

### Popravljeno
- star popravek
`

describe('categorize', () => {
  it('preslika konvencionalne tipe v kategorije dnevnika', () => {
    expect(categorize('feat(ui): nekaj')).toBe('Dodano')
    expect(categorize('fix(core): nekaj')).toBe('Popravljeno')
    expect(categorize('docs(readme): nekaj')).toBe('Dokumentacija')
    expect(categorize('perf(engine): nekaj')).toBe('Spremenjeno')
    expect(categorize('chore(deps): nekaj')).toBe('Vzdrževanje')
    expect(categorize('brez konvencije')).toBe('Vzdrževanje')
  })
})

describe('subjectText', () => {
  it('odstrani predpono tipa', () => {
    expect(subjectText('perf(engine): hitrejši izračun')).toBe('hitrejši izračun')
    expect(subjectText('brez dvopičja')).toBe('brez dvopičja')
  })
})

describe('parseUnreleasedSection', () => {
  it('razčleni podnaslove in vnose ter ohrani besedilo vnosov', () => {
    const body = '\n### Izboljšano\n- a\n- b\n\n### Popravljeno\n- c\n'
    const { subsections } = parseUnreleasedSection(body)
    expect(subsections.map(s => s.heading)).toEqual(['Izboljšano', 'Popravljeno'])
    expect(subsections[0].items).toEqual(['a', 'b'])
    expect(subsections[1].items).toEqual(['c'])
  })
})

describe('mergeUnreleased', () => {
  it('ohrani obstoječe ročne vnose in doda nove v ustrezen podnaslov', () => {
    const commits = [
      { subject: 'perf(engine): hitrejše iskanje' },
      { subject: 'fix(ui): odpravi napako' }
    ]
    const next = mergeUnreleased(CHANGELOG, groupCommits(commits))

    // obstoječa ročna vsebina ostane
    expect(next).toContain('- ročno napisan vnos')
    expect(next).toContain('- obstoječa sprememba')

    // nova vnosa sta dodana v obstoječa podnaslova
    expect(next).toContain('- hitrejše iskanje')
    expect(next).toContain('- odpravi napako')

    // izdana izdaja ostane nedotaknjena
    expect(next).toContain('## 2025-09-02 - Stara izdaja')
    expect(next).toContain('- star popravek')
  })

  it('ustvari nov podnaslov, ko kategorija še ne obstaja', () => {
    const next = mergeUnreleased(CHANGELOG, groupCommits([{ subject: 'feat(ui): nova funkcija' }]))
    expect(next).toContain('### Dodano')
    expect(next).toContain('- nova funkcija')
  })

  it('ne podvaja vnosov, ki so že zapisani', () => {
    const once = mergeUnreleased(CHANGELOG, groupCommits([{ subject: 'fix(ui): odpravi napako' }]))
    const twice = mergeUnreleased(once, groupCommits([{ subject: 'fix(ui): odpravi napako' }]))
    expect(twice.match(/- odpravi napako/g)).toHaveLength(1)
  })

  it('brez commitov vrne vsebino nespremenjeno', () => {
    expect(mergeUnreleased(CHANGELOG, groupCommits([]))).toBe(CHANGELOG)
  })
})

describe('renderUnreleasedSection', () => {
  it('izpusti prazne podnaslove', () => {
    const rendered = renderUnreleasedSection(
      [
        { heading: 'Dodano', items: ['a'] },
        { heading: 'Vzdrževanje', items: [] }
      ],
      new Map()
    )
    expect(rendered).toContain('### Dodano')
    expect(rendered).not.toContain('### Vzdrževanje')
  })
})
