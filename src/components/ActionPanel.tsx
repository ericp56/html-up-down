import type { FC } from 'react'
import type { Direction } from '../hooks/useGamepad'

interface ActionPanelProps {
  target: Direction
}

export const ActionPanel: FC<ActionPanelProps> = ({ target }) => {
  return (
    <section
      className="action-panel"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="action-heading">Action</p>
      <p className="action-direction" data-testid="action-direction">
        {target.toUpperCase()}
      </p>
      <p className="action-hint">Press the D-pad {target} to match the highlight.</p>
    </section>
  )
}
