import React from 'react'
import { ChessPiece, PieceColor, Move } from '../types/chess'
import { getPieceSymbol } from '../utils/chessUtils'

interface CapturedPiecesProps {
  moveHistory: Move[]
  orientation: 'whiteBottom' | 'blackBottom'
}

const PIECE_VALUE: Record<string, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
}

function extractCaptured(moveHistory: Move[]): {
  capturedByWhite: ChessPiece[];
  capturedByBlack: ChessPiece[];
} {
  const capturedByWhite: ChessPiece[] = []
  const capturedByBlack: ChessPiece[] = []

  for (const move of moveHistory) {
    if (!move.captured) continue
    if (move.piece.color === 'white') {
      capturedByWhite.push(move.captured)
    } else {
      capturedByBlack.push(move.captured)
    }
  }

  const sortPieces = (pieces: ChessPiece[]): ChessPiece[] =>
    [...pieces].sort((a, b) => PIECE_VALUE[a.type] - PIECE_VALUE[b.type])

  return {
    capturedByWhite: sortPieces(capturedByWhite),
    capturedByBlack: sortPieces(capturedByBlack),
  }
}

function materialDiff(capturedByWhite: ChessPiece[], capturedByBlack: ChessPiece[]): number {
  const sum = (pieces: ChessPiece[]) =>
    pieces.reduce((acc, p) => acc + PIECE_VALUE[p.type], 0)
  return sum(capturedByWhite) - sum(capturedByBlack)
}

export const CapturedPiecesTop: React.FC<CapturedPiecesProps> = (props) => {
  const { capturedByWhite, capturedByBlack } = extractCaptured(props.moveHistory)
  const diff = materialDiff(capturedByWhite, capturedByBlack)
  const captures: ChessPiece[] = props.orientation === 'whiteBottom'
    ? capturedByWhite
    : capturedByBlack
  const color: PieceColor = props.orientation === 'whiteBottom' ? 'black' : 'white'
  const advantage = color === 'white' ? -diff : diff
  const showAdv = advantage > 0

  return (
    <div className="captured-bar" role="list" aria-label={`Pieces captured by ${color}`}>
      <div className="captured-bar__pieces">
        {captures.length === 0 ? (
          <span className="captured-bar__empty">&nbsp;</span>
        ) : (
          captures.map((piece, idx) => (
            <span
              key={`top-${piece.type}-${idx}`}
              role="listitem"
              className={`captured-bar__piece captured-bar__piece--${color}`}
              aria-label={`${piece.color} ${piece.type}`}
            >
              {getPieceSymbol(piece.type, color)}
            </span>
          ))
        )}
      </div>
      {showAdv && (
        <span className="captured-bar__advantage">+{advantage}</span>
      )}
    </div>
  )
}

export const CapturedPiecesBottom: React.FC<CapturedPiecesProps> = (props) => {
  const { capturedByWhite, capturedByBlack } = extractCaptured(props.moveHistory)
  const diff = materialDiff(capturedByWhite, capturedByBlack)
  const captures: ChessPiece[] = props.orientation === 'whiteBottom'
    ? capturedByBlack
    : capturedByWhite
  const color: PieceColor = props.orientation === 'whiteBottom' ? 'white' : 'black'
  const advantage = color === 'white' ? -diff : diff
  const showAdv = advantage > 0

  return (
    <div className="captured-bar" role="list" aria-label={`Pieces captured by ${color}`}>
      <div className="captured-bar__pieces">
        {captures.length === 0 ? (
          <span className="captured-bar__empty">&nbsp;</span>
        ) : (
          captures.map((piece, idx) => (
            <span
              key={`bot-${piece.type}-${idx}`}
              role="listitem"
              className={`captured-bar__piece captured-bar__piece--${color}`}
              aria-label={`${piece.color} ${piece.type}`}
            >
              {getPieceSymbol(piece.type, color)}
            </span>
          ))
        )}
      </div>
      {showAdv && (
        <span className="captured-bar__advantage">+{advantage}</span>
      )}
    </div>
  )
}
