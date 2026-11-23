import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const changelogPath = join(root, 'CHANGELOG.md')
const markerPath = join(root, '.changelog-last-sha')

// Datoteke, ki pripadajo samemu mehanizmu dnevnika. Commit, ki se dotakne
// samo teh, ne sme ustvariti novega vnosa — sicer vsak commit posodobljenega
// dnevnika znova označi dnevnik kot "nezabeležen" in zanka se ponavlja.
const BOOKKEEPING_FILES = new Set(['CHANGELOG.md', '.changelog-last-sha'])

export function getHeadSha() {
  return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
}

export function getCommitsSince(lastSha) {
  const range = lastSha ? `${lastSha}..HEAD` : ''
  const cmd = `git log ${range} --no-merges --name-only --pretty=format:__C__%H%x09%s`
  const out = execSync(cmd, { encoding: 'utf8' }).trim()
  if (!out) return []
  const commits = []
  let current = null
  for (const raw of out.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('__C__')) {
      const rest = line.slice('__C__'.length)
      const idx = rest.indexOf('\t')
      current = { sha: rest.slice(0, idx), subject: rest.slice(idx + 1).trim(), files: [] }
      commits.push(current)
    } else if (current) {
      current.files.push(line)
    }
  }
  return commits.filter(c => !(c.files.length > 0 && c.files.every(f => BOOKKEEPING_FILES.has(f))))
}

export function categorize(subject) {
  const lower = subject.toLowerCase()
  const colonIdx = lower.indexOf(':')
  const type = colonIdx !== -1 ? lower.slice(0, colonIdx) : ''
  if (type.startsWith('feat')) return 'Dodano'
  if (type.startsWith('fix')) return 'Popravljeno'
  if (type.startsWith('docs')) return 'Dokumentacija'
  if (type.startsWith('refactor') || type.startsWith('perf') || type.startsWith('style')) return 'Spremenjeno'
  if (type.startsWith('chore') || type.startsWith('test') || type.startsWith('build') || type.startsWith('ci')) return 'Vzdrževanje'
  return 'Vzdrževanje'
}

export function subjectText(subject) {
  const idx = subject.indexOf(':')
  return idx !== -1 ? subject.slice(idx + 1).trim() : subject
}

// Vrne Map(kategorija -> [vnos, ...]) iz seznama commitov.
export function groupCommits(commits) {
  const groups = new Map()
  for (const c of commits) {
    const cat = categorize(c.subject)
    const text = subjectText(c.subject)
    if (!text) continue
    const arr = groups.get(cat) || []
    if (!arr.includes(text)) arr.push(text)
    groups.set(cat, arr)
  }
  return groups
}

// Razčleni telo sekcije "## Neizdano" na podnaslove (### Kategorija) z vnosi.
export function parseUnreleasedSection(body) {
  const subsections = []
  const preamble = []
  let current = null
  for (const line of body.split('\n')) {
    const heading = line.match(/^###\s+(.+?)\s*$/)
    if (heading) {
      current = { heading: heading[1], items: [] }
      subsections.push(current)
      continue
    }
    if (current) {
      const item = line.match(/^-\s+(.+?)\s*$/)
      if (item) current.items.push(item[1])
    } else if (line.trim()) {
      preamble.push(line)
    }
  }
  return { preamble, subsections }
}

// Sestavi telo sekcije "## Neizdano": ohrani obstoječe podnaslove in vnose,
// nove vnose pa doda v ustrezen podnaslov (po potrebi ustvari novega).
export function renderUnreleasedSection(subsections, groups, preamble = []) {
  const byHeading = new Map(subsections.map(s => [s.heading, s]))
  for (const [cat, items] of groups) {
    let sub = byHeading.get(cat)
    if (!sub) {
      sub = { heading: cat, items: [] }
      subsections.push(sub)
      byHeading.set(cat, sub)
    }
    for (const item of items) {
      if (!sub.items.includes(item)) sub.items.push(item)
    }
  }
  let md = '## Neizdano\n\n'
  if (preamble.length > 0) md += preamble.join('\n') + '\n\n'
  for (const sub of subsections) {
    if (sub.items.length === 0) continue
    md += `### ${sub.heading}\n` + sub.items.map(i => `- ${i}`).join('\n') + '\n\n'
  }
  return md.trimEnd() + '\n'
}

// Dopolni sekcijo "## Neizdano" v vsebini dnevnika; obstoječe vnose ohrani.
export function mergeUnreleased(content, groups) {
  if (groups.size === 0) return content
  let start = content.indexOf('## Neizdano')
  if (start !== -1 && start > 0 && content[start - 1] !== '\n') start = -1

  if (start !== -1) {
    const bodyStart = content.indexOf('\n', start)
    if (bodyStart === -1) {
      return content + '\n\n' + renderUnreleasedSection([], groups)
    }
    let end = content.indexOf('\n## ', bodyStart)
    if (end === -1) end = content.length
    const body = content.slice(bodyStart + 1, end)
    const { preamble, subsections } = parseUnreleasedSection(body)
    const rendered = renderUnreleasedSection(subsections, groups, preamble)
    return content.slice(0, start) + rendered + content.slice(end)
  }

  return insertNewSection(content, renderUnreleasedSection([], groups))
}

function insertNewSection(content, block) {
  const introIdx = content.indexOf('Vse pomembne spremembe')
  if (introIdx !== -1) {
    const lineEnd = content.indexOf('\n', introIdx)
    if (lineEnd === -1) return content + '\n\n' + block + '\n'
    let pos = content.indexOf('\n', lineEnd + 1)
    pos = pos !== -1 ? pos + 1 : lineEnd + 1
    return content.slice(0, pos) + '\n' + block + '\n' + content.slice(pos)
  }
  const h1Idx = content.indexOf('# Dnevnik sprememb')
  if (h1Idx !== -1) {
    const lineEnd = content.indexOf('\n', h1Idx)
    const pos = lineEnd !== -1 ? lineEnd + 1 : content.length
    return content.slice(0, pos) + '\n' + block + '\n' + content.slice(pos)
  }
  return block + '\n' + content
}

function updateMode() {
  const lastSha = existsSync(markerPath) ? readFileSync(markerPath, 'utf8').trim() : ''
  const commits = getCommitsSince(lastSha)
  if (commits.length === 0) return { wrote: false }
  const groups = groupCommits(commits)
  if (groups.size === 0) return { wrote: false }
  const content = readFileSync(changelogPath, 'utf8')
  const next = mergeUnreleased(content, groups)
  writeFileSync(changelogPath, next, 'utf8')
  writeFileSync(markerPath, getHeadSha(), 'utf8')
  return { wrote: true }
}

function checkMode() {
  const lastSha = existsSync(markerPath) ? readFileSync(markerPath, 'utf8').trim() : ''
  const commits = getCommitsSince(lastSha)
  return { pending: commits.length > 0 }
}

function main() {
  const arg = process.argv[2] || 'check'
  if (!existsSync(changelogPath)) {
    console.error('CHANGELOG.md manjka')
    process.exit(1)
  }
  if (arg === 'update') {
    updateMode()
    process.exit(0)
  }
  const res = checkMode()
  process.exit(res.pending ? 1 : 0)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
