import React, { useEffect, useRef, useState } from 'react'
import type { PieceColor } from '../types/chess'

export interface PromotionDialogProps {
  isOpen: boolean
  color: PieceColor
  onSelect: (piece: 'queen' | 'rook' | 'bishop' | 'knight') => void
  onCancel: () => void
}

const pieceOrder: Array<'queen' | 'rook' | 'bishop' | 'knight'> = ['queen', 'rook', 'bishop', 'knight']

const titleId = 'promotion-dialog-title'

const PromotionDialog: React.FC<PromotionDialogProps> = ({ isOpen, color, onSelect, onCancel }) => {
  const [selected, setSelected] = useState<'queen' | 'rook' | 'bishop' | 'knight'>('queen')
  const firstBtnRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)

  // Manage initial focus and remember previous focus for restoration
  useEffect(() => {
    if (isOpen) {
      prevFocusRef.current = (document.activeElement as HTMLElement) ?? null
      setSelected('queen')
      // Focus first button
      firstBtnRef.current?.focus()
    }
    return () => {
      // On close/unmount, restore focus to previous focus target if possible
      if (!isOpen && prevFocusRef.current) {
        try {
          prevFocusRef.current.focus()
        } catch {
          // ignore if element is no longer focusable
        }
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
      return
    }

    if (e.key === 'Tab') {
      const container = dialogRef.current
      const focusables = container ? Array.from(
        container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1) : []

      if (focusables.length > 0) {
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey) {
          if (active === first || !container?.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (active === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
      return
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const idx = pieceOrder.indexOf(selected)
      const nextIdx = (idx + (e.key === 'ArrowRight' ? 1 : -1) + pieceOrder.length) % pieceOrder.length
      setSelected(pieceOrder[nextIdx])
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(selected)
      return
    }
  }

  const pieceLabel = (p: string) => `${color === 'white' ? 'White' : 'Black'} ${p}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onKeyDown={handleKeyDown}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white text-slate-900 rounded-lg shadow-xl p-6 w-80"
      >
        <h2 id={titleId} className="text-lg font-bold mb-4">Promote Pawn</h2>
        <p className="text-sm text-gray-600 mb-3">Choose a piece to promote your pawn to:</p>
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          Promotion prompt open. Choose Queen, Rook, Bishop, or Knight. Press Enter to confirm.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {pieceOrder.map((p, idx) => (
            <button
              key={p}
              ref={idx === 0 ? firstBtnRef : undefined}
              className={`border rounded-lg py-2 px-3 text-sm font-semibold transition bg-white text-slate-800 hover:bg-slate-100 ${selected === p ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300 hover:border-gray-400'}`}
              onClick={() => onSelect(p)}
              aria-pressed={selected === p}
            >
              {pieceLabel(p.charAt(0).toUpperCase() + p.slice(1))}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded"
          >Cancel</button>
          <button
            onClick={() => onSelect(selected)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded"
          >Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default PromotionDialog
