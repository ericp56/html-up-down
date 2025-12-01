import { useEffect, useReducer, useRef } from 'react'
import { GameBoard, type BoxPosition } from './components/GameBoard'
import { ActionPanel } from './components/ActionPanel'
import { FeedbackToast } from './components/FeedbackToast'
import { useGamepad, type Direction } from './hooks/useGamepad'
import { useSuccessChime } from './hooks/useSuccessChime'
import './App.css'

type GameState = {
  selectedBox: BoxPosition
  target: Direction
  toastMessage: string | null
  successCount: number
}

type GameAction =
  | { type: 'INPUT'; direction: Direction }
  | { type: 'HIDE_TOAST' }

const initialState: GameState = {
  selectedBox: 'bottom',
  target: 'up',
  toastMessage: null,
  successCount: 0,
}

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INPUT':
      if (action.direction !== state.target) {
        return state
      }

      return {
        selectedBox: action.direction === 'up' ? 'top' : 'bottom',
        target: state.target === 'up' ? 'down' : 'up',
        toastMessage: 'Correct!',
        successCount: state.successCount + 1,
      }

    case 'HIDE_TOAST':
      if (!state.toastMessage) {
        return state
      }

      return { ...state, toastMessage: null }
    default:
      return state
  }
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const intent = useGamepad()
  const toastTimerRef = useRef<number | null>(null)
  const playSuccessChime = useSuccessChime()

  useEffect(() => {
    if (!intent) {
      return
    }

    dispatch({ type: 'INPUT', direction: intent.direction })
  }, [intent])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!state.toastMessage) {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
      return
    }

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }

    playSuccessChime()

    toastTimerRef.current = window.setTimeout(() => {
      dispatch({ type: 'HIDE_TOAST' })
      toastTimerRef.current = null
    }, 3000)

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [state.toastMessage, state.successCount, playSuccessChime])

  return (
    <div className="app">
      <header className="intro" aria-describedby="gameplay-steps">
        <h1>Up / Down Trainer</h1>
        <p id="gameplay-steps">
          Follow the Action box and press your controller or keyboard arrows to
          move the highlight.
        </p>
      </header>
      <main className="game-shell">
        <GameBoard selectedBox={state.selectedBox} />
        <ActionPanel target={state.target} />
      </main>
      <FeedbackToast message={state.toastMessage} />
    </div>
  )
}

export default App
