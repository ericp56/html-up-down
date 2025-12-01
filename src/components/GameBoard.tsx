import type { FC } from 'react'

export type BoxPosition = 'top' | 'bottom'

interface GameBoardProps {
  selectedBox: BoxPosition
}

const SQUARES: Array<{
  position: BoxPosition
  label: string
}> = [
  { position: 'top', label: 'Up' },
  { position: 'bottom', label: 'Down' },
]

export const GameBoard: FC<GameBoardProps> = ({ selectedBox }) => {
  return (
    <section className="board" aria-label="Practice squares">
      {SQUARES.map(({ position, label }) => {
        const isSelected = position === selectedBox
        return (
          <div
            key={position}
            className={`square ${isSelected ? 'square-selected' : ''}`}
            role="img"
            aria-label={`${label} square ${isSelected ? 'selected' : 'idle'}`}
          >
            <span className="square-label" aria-hidden="true">
              {label}
            </span>
          </div>
        )
      })}
    </section>
  )
}
