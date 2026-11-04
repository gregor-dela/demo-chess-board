import { getBookMove } from '../openingBook'
import { initialGameState } from '../../hooks/useChessGame'
import { createEmptyBoard, setPiece } from '../../test/chessTestUtils'

test('book suggests e5 after e4', async () => {
  const s = { ...initialGameState, mode: 'pvai', aiSettings: { aiPlays: 'black', depth: 3, moveTimeMs: 1200, autoAnalyze: false } }
  s.moveHistory = [
    {
      from: 'e2', to: 'e4', piece: { type: 'pawn', color: 'white', hasMoved: true }, notation: '', timestamp: new Date(), prevHasMoved: false, prevCastlingRights: s.castlingRights,
      prevCapturedHasMoved: undefined, isEnPassant: false, enPassantCaptureSquare: undefined,
    }
  ]
  const m = await getBookMove(s)
  expect(m).toBeTruthy()
  expect(m?.from).toBe('e7')
  expect(m?.to).toBe('e5')
})

test('book suggests Nc6 after Nf3 in e4 e5', async () => {
  const s = { ...initialGameState, mode: 'pvai', aiSettings: { aiPlays: 'black', depth: 3, moveTimeMs: 1200, autoAnalyze: false } }
  s.moveHistory = [
    { from: 'e2', to: 'e4', piece: { type: 'pawn', color: 'white', hasMoved: true }, notation: '', timestamp: new Date(), prevHasMoved: false, prevCastlingRights: s.castlingRights },
    { from: 'e7', to: 'e5', piece: { type: 'pawn', color: 'black', hasMoved: true }, notation: '', timestamp: new Date(), prevHasMoved: false, prevCastlingRights: s.castlingRights },
    { from: 'g1', to: 'f3', piece: { type: 'knight', color: 'white', hasMoved: true }, notation: '', timestamp: new Date(), prevHasMoved: false, prevCastlingRights: s.castlingRights },
  ]
  const m = await getBookMove(s)
  expect(m).toBeTruthy()
  expect(m?.from).toBe('b8')
  expect(m?.to).toBe('c6')
})

test('book skips candidates whose source piece is missing on the current board', async () => {
  const board = createEmptyBoard()
  setPiece(board, 'e1', { type: 'king', color: 'white', hasMoved: false })
  setPiece(board, 'e8', { type: 'king', color: 'black', hasMoved: false })
  setPiece(board, 'e4', { type: 'pawn', color: 'white', hasMoved: true })

  const s = {
    ...initialGameState,
    board,
    currentPlayer: 'black' as const,
    mode: 'pvai' as const,
    aiSettings: { aiPlays: 'black' as const, depth: 3, moveTimeMs: 300, autoAnalyze: false },
  }

  s.moveHistory = [
    {
      from: 'e2',
      to: 'e4',
      piece: { type: 'pawn', color: 'white', hasMoved: true },
      notation: '',
      timestamp: new Date(),
      prevHasMoved: false,
      prevCastlingRights: s.castlingRights,
    },
  ]

  await expect(getBookMove(s)).resolves.toBeNull()
})
