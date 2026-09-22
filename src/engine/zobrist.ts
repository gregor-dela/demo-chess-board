import { Board, CastlingRights, PieceColor, ChessPiece, Square } from '../types/chess'

function xorshift(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 0xffffffff
  }
}

const rng = xorshift(0x9e3779b9)

function rand64(): bigint {
  const a = BigInt(Math.floor(rng() * 0xffffffff))
  const b = BigInt(Math.floor(rng() * 0xffffffff))
  return (a << 32n) ^ b
}

const pieceTypes = ['pawn','knight','bishop','rook','queen','king'] as const
const colors: PieceColor[] = ['white','black']

const table: Record<string, bigint[]> = {}
for (const t of pieceTypes) {
  for (const c of colors) {
    const key = `${c}:${t}`
    table[key] = Array(64).fill(0n).map(() => rand64())
  }
}

const sideKey = rand64()
const castleKeys = {
  K: rand64(),
  Q: rand64(),
  k: rand64(),
  q: rand64(),
}
const epFileKeys: Record<string, bigint> = {
  a: rand64(), b: rand64(), c: rand64(), d: rand64(), e: rand64(), f: rand64(), g: rand64(), h: rand64()
}

export function zobristHash(board: Board, player: PieceColor, rights: CastlingRights, enPassant: Square | null): bigint {
  let h = 0n
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p: ChessPiece | null = board[r][c]
      if (!p) continue
      const idx = r * 8 + c
      const key = `${p.color}:${p.type}`
      const arr = table[key]
      if (!arr) {
        throw new Error(`Zobrist missing key '${key}' at r=${r} c=${c} idx=${idx} piece=${JSON.stringify(p)}`)
      }
      h ^= arr[idx]
    }
  }
  if (player === 'white') h ^= sideKey
  if (rights.white.kingSide) h ^= castleKeys.K
  if (rights.white.queenSide) h ^= castleKeys.Q
  if (rights.black.kingSide) h ^= castleKeys.k
  if (rights.black.queenSide) h ^= castleKeys.q
  if (enPassant) {
    const file = enPassant[0]
    h ^= epFileKeys[file]
  }
  return h
}

export type TTEntry = { depth: number, score: number, move?: { from: Square, to: Square } }
