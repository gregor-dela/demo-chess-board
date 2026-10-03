import { Board, PieceColor } from '../types/chess'

export const pieceValues: Record<string, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 0,
}

const pstWhite: Record<string, number[][]> = {
  pawn: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  knight: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  bishop: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 10, 15, 15, 10, 5, -10],
    [-10, 0, 10, 15, 15, 10, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  rook: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  queen: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  king: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
}

const mirror = (arr: number[][]) => arr.slice().reverse()
const pstBlack: Record<string, number[][]> = Object.fromEntries(
  Object.entries(pstWhite).map(([k, v]) => [k, mirror(v as number[][])])
)

// helper removed

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8
}

function dangerFor(board: Board, kr: number, kc: number, color: PieceColor): number {
  const enemy: PieceColor = color === 'white' ? 'black' : 'white'
  let ring = 0
  const kn = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
  for (const [dr, dc] of kn) {
    const r = kr + dr, c = kc + dc
    if (!inBounds(r,c)) continue
    const p = board[r][c]
    if (p && p.color === enemy && p.type === 'knight') ring++
  }
  const pr = enemy === 'white' ? -1 : 1
  for (const dc of [-1, 1]) {
    const r = kr + pr, c = kc + dc
    if (!inBounds(r,c)) continue
    const p = board[r][c]
    if (p && p.color === enemy && p.type === 'pawn') ring++
  }
  let line = 0
  const diag = [[-1,-1],[-1,1],[1,-1],[1,1]]
  for (const [dr, dc] of diag) {
    let r = kr + dr, c = kc + dc
    while (inBounds(r,c)) {
      const p = board[r][c]
      if (p) {
        if (p.color === enemy && (p.type === 'bishop' || p.type === 'queen')) line += 1
        break
      }
      r += dr; c += dc
    }
  }
  const orth = [[-1,0],[1,0],[0,-1],[0,1]]
  for (const [dr, dc] of orth) {
    let r = kr + dr, c = kc + dc
    while (inBounds(r,c)) {
      const p = board[r][c]
      if (p) {
        if (p.color === enemy && (p.type === 'rook' || p.type === 'queen')) line += 1
        break
      }
      r += dr; c += dc
    }
  }
  let open = 0
  for (const fc of [kc - 1, kc, kc + 1]) {
    if (fc < 0 || fc >= 8) continue
    let hasFriendlyPawn = false
    for (let r = 0; r < 8; r++) {
      const p = board[r][fc]
      if (p && p.type === 'pawn' && p.color === color) { hasFriendlyPawn = true; break }
    }
    if (!hasFriendlyPawn) open++
  }
  const s = ring * 12 + line * 20 + open * 8
  return s
}

function kingDanger(board: Board): number {
  let wk: [number, number] | null = null
  let bk: [number, number] | null = null
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]
    if (p && p.type === 'king') {
      if (p.color === 'white') wk = [r, c]
      else bk = [r, c]
    }
  }
  let dw = 0, db = 0
  if (wk) dw = dangerFor(board, wk[0], wk[1], 'white')
  if (bk) db = dangerFor(board, bk[0], bk[1], 'black')
  return -dw + db
}

function evaluatePawnStructure(board: Board): number {
  let s = 0
  const files = 8
  const pawnFilesWhite = Array(files).fill(0)
  const pawnFilesBlack = Array(files).fill(0)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (!p || p.type !== 'pawn') continue
      if (p.color === 'white') pawnFilesWhite[c]++
      else pawnFilesBlack[c]++
    }
  }
  // doubled/isolated penalties
  for (let c = 0; c < files; c++) {
    const w = pawnFilesWhite[c]
    const b = pawnFilesBlack[c]
    if (w > 1) s -= 12 * (w - 1)
    if (b > 1) s += 12 * (b - 1)
    const wIsolated = (c === 0 ? 0 : pawnFilesWhite[c - 1]) + (c === files - 1 ? 0 : pawnFilesWhite[c + 1]) === 0 && w > 0
    const bIsolated = (c === 0 ? 0 : pawnFilesBlack[c - 1]) + (c === files - 1 ? 0 : pawnFilesBlack[c + 1]) === 0 && b > 0
    if (wIsolated) s -= 10
    if (bIsolated) s += 10
  }
  // passed pawns: simple check ahead on same/adjacent files
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (!p || p.type !== 'pawn') continue
      if (p.color === 'white') {
        let blocked = false
        for (let rr = r - 1; rr >= 0; rr--) {
          for (const cc of [c - 1, c, c + 1]) {
            if (cc < 0 || cc >= 8) continue
            const op = board[rr][cc]
            if (op && op.type === 'pawn' && op.color === 'black') blocked = true
          }
        }
        if (!blocked) s += Math.max(0, 6 * (6 - r))
      } else {
        let blocked = false
        for (let rr = r + 1; rr < 8; rr++) {
          for (const cc of [c - 1, c, c + 1]) {
            if (cc < 0 || cc >= 8) continue
            const op = board[rr][cc]
            if (op && op.type === 'pawn' && op.color === 'white') blocked = true
          }
        }
        if (!blocked) s -= Math.max(0, 6 * (r - 1))
      }
    }
  }
  return s
}

function bishopPairBonus(board: Board): number {
  let w = 0, b = 0
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]
    if (p && p.type === 'bishop') {
      if (p.color === 'white') w++
      else b++
    }
  }
  let s = 0
  if (w >= 2) s += 15
  if (b >= 2) s -= 15
  return s
}

function rookFileBonuses(board: Board): number {
  let s = 0
  for (let c = 0; c < 8; c++) {
    let hasWhitePawn = false, hasBlackPawn = false
    for (let r = 0; r < 8; r++) {
      const p = board[r][c]
      if (p && p.type === 'pawn') {
        if (p.color === 'white') hasWhitePawn = true
        else hasBlackPawn = true
      }
    }
    const fileSquares: Array<[number, number]> = Array.from({ length: 8 }, (_, r) => [r, c])
    for (const [r, col] of fileSquares) {
      const p = board[r][col]
      if (!p || p.type !== 'rook') continue
      if (p.color === 'white') {
        if (!hasWhitePawn && !hasBlackPawn) s += 12
        else if (!hasWhitePawn) s += 6
      } else {
        if (!hasWhitePawn && !hasBlackPawn) s -= 12
        else if (!hasBlackPawn) s -= 6
      }
    }
  }
  return s
}


function kingSafety(board: Board): number {
  let wk: [number, number] | null = null
  let bk: [number, number] | null = null
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]
    if (p && p.type === 'king') {
      if (p.color === 'white') wk = [r, c]
      else bk = [r, c]
    }
  }
  let s = 0
  if (wk) {
    const [kr, kc] = wk
    const shieldSquares: Array<[number, number]> = [[kr + 1, kc - 1], [kr + 1, kc], [kr + 1, kc + 1]]
    let shield = 0
    for (const [r, c] of shieldSquares) {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const p = board[r][c]
        if (p && p.type === 'pawn' && p.color === 'white') shield++
      }
    }
    s += shield * 5 - (3 - shield) * 5
  }
  if (bk) {
    const [kr, kc] = bk
    const shieldSquares: Array<[number, number]> = [[kr - 1, kc - 1], [kr - 1, kc], [kr - 1, kc + 1]]
    let shield = 0
    for (const [r, c] of shieldSquares) {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const p = board[r][c]
        if (p && p.type === 'pawn' && p.color === 'black') shield++
      }
    }
    s -= shield * 5 - (3 - shield) * 5
  }
  return s
}

type SimpleEndgame = 'none' | 'KQvsK' | 'KRvsK' | 'KBvsK' | 'KNvsK'

function detectSimpleEndgame(board: Board): { whiteMat: number; blackMat: number; kind: SimpleEndgame } {
  let wm = 0, bm = 0
  let wq = 0, wr = 0, wb = 0, wn = 0
  let bq = 0, br = 0, bb = 0, bn = 0
  let wp = 0, bp = 0
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]
    if (!p) continue
    const v = pieceValues[p.type]
    if (p.color === 'white') {
      wm += v
      if (p.type === 'queen') wq++
      else if (p.type === 'rook') wr++
      else if (p.type === 'bishop') wb++
      else if (p.type === 'knight') wn++
      else if (p.type === 'pawn') wp++
    } else {
      bm += v
      if (p.type === 'queen') bq++
      else if (p.type === 'rook') br++
      else if (p.type === 'bishop') bb++
      else if (p.type === 'knight') bn++
      else if (p.type === 'pawn') bp++
    }
  }
  let kind: SimpleEndgame = 'none'
  if (wp === 0 && bp === 0 && wb === 0 && wn === 0 && wr === 0 && wq === 1 && bq === 0 && br === 0 && bb === 0 && bn === 0) kind = 'KQvsK'
  else if (wp === 0 && bp === 0 && bb === 0 && bn === 0 && br === 0 && bq === 1 && wq === 0 && wr === 0 && wb === 0 && wn === 0) kind = 'KQvsK'
  else if (wp === 0 && bp === 0 && wb === 0 && wn === 0 && wq === 0 && wr === 1 && bq === 0 && br === 0 && bb === 0 && bn === 0) kind = 'KRvsK'
  else if (wp === 0 && bp === 0 && bb === 0 && bn === 0 && bq === 0 && br === 1 && wq === 0 && wr === 0 && wb === 0 && wn === 0) kind = 'KRvsK'
  else if (wp === 0 && bp === 0 && wn === 0 && wq === 0 && wr === 0 && wb === 1 && bq === 0 && br === 0 && bb === 0 && bn === 0) kind = 'KBvsK'
  else if (wp === 0 && bp === 0 && bn === 0 && bq === 0 && br === 0 && bb === 1 && wq === 0 && wr === 0 && wb === 0 && wn === 0) kind = 'KBvsK'
  else if (wp === 0 && bp === 0 && wb === 0 && wq === 0 && wr === 0 && wn === 1 && bq === 0 && br === 0 && bb === 0 && bn === 0) kind = 'KNvsK'
  else if (wp === 0 && bp === 0 && bb === 0 && bq === 0 && br === 0 && bn === 1 && wq === 0 && wr === 0 && wb === 0 && wn === 0) kind = 'KNvsK'
  return { whiteMat: wm, blackMat: bm, kind }
}

function kingDistToCorner(r: number, c: number): number {
  const d1 = Math.max(r, c)
  const d2 = Math.max(r, 7 - c)
  const d3 = Math.max(7 - r, c)
  const d4 = Math.max(7 - r, 7 - c)
  return Math.min(d1, d2, d3, d4)
}
function kingDistToEdge(r: number, c: number): number {
  return Math.min(r, c, 7 - r, 7 - c)
}
function manhattan(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
}
function chebyshev(a: [number, number], b: [number, number]): number {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]))
}

function forcedMateEndgameHeuristic(board: Board): number {
  const result = detectSimpleEndgame(board)
  if (result.kind === 'none') return 0
  let wk: [number, number] | null = null
  let bk: [number, number] | null = null
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]
    if (p && p.type === 'king') {
      if (p.color === 'white') wk = [r, c]
      else bk = [r, c]
    }
  }
  if (!wk || !bk) return 0
  const strongIsWhite = result.whiteMat > result.blackMat
  const strongK = strongIsWhite ? wk : bk
  const weakK = strongIsWhite ? bk : wk
  let s = 0
  s += (7 - kingDistToCorner(weakK[0], weakK[1])) * 80
  s += (7 - kingDistToEdge(weakK[0], weakK[1])) * 40
  s += (14 - chebyshev(strongK, weakK)) * 20
  if (result.kind === 'KRvsK' || result.kind === 'KQvsK') {
    s += (14 - manhattan(strongK, weakK)) * 12
  }
  if (result.kind === 'KBvsK' || result.kind === 'KNvsK') return 0
  return strongIsWhite ? s : -s
}

export function evaluate(board: Board, turn: PieceColor): number {
  let scoreMg = 0
  let scoreEg = 0
  let phase = 0
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (!p) continue
      const base = pieceValues[p.type]
      const pst = p.color === 'white' ? pstWhite[p.type][r][c] : pstBlack[p.type][r][c]
      const mg = base + pst
      const eg = base + Math.floor(pst * 0.6)
      scoreMg += p.color === 'white' ? mg : -mg
      scoreEg += p.color === 'white' ? eg : -eg
      if (p.type === 'pawn') phase += 0
      else if (p.type === 'knight' || p.type === 'bishop') phase += 1
      else if (p.type === 'rook') phase += 2
      else if (p.type === 'queen') phase += 4
    }
  }
  const mgExtras = evaluatePawnStructure(board) + bishopPairBonus(board) + rookFileBonuses(board) + kingSafety(board) * 2 + Math.floor(kingDanger(board) * 1.2)
  const egExtras = evaluatePawnStructure(board) + bishopPairBonus(board) + rookFileBonuses(board) + Math.floor(kingSafety(board) * 0.6) + Math.floor(kingDanger(board) * 0.6)
  scoreMg += mgExtras
  scoreEg += egExtras
  const maxPhase = 16
  if (phase > maxPhase) phase = maxPhase
  const egWeight = phase / maxPhase
  const mgWeight = 1 - egWeight
  const tapered = Math.floor(scoreMg * mgWeight + scoreEg * egWeight)
  const endgameHeur = forcedMateEndgameHeuristic(board)
  const final = tapered + endgameHeur * 3
  return turn === 'white' ? final : -final
}
