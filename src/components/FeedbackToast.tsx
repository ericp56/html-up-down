import type { FC } from 'react'

interface FeedbackToastProps {
  message: string | null
}

export const FeedbackToast: FC<FeedbackToastProps> = ({ message }) => {
  return (
    <div
      className={`toast ${message ? 'toast-visible' : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span>{message ?? ' '}</span>
    </div>
  )
}
