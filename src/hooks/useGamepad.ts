import { useCallback, useEffect, useRef, useState } from 'react'

export type Direction = 'up' | 'down'

export interface DirectionIntent {
  direction: Direction
  timestamp: number
  source: 'gamepad' | 'keyboard'
}

const MOVEMENT_THRESHOLD = 0.5
const REPEAT_DELAY_MS = 250
const HORIZONTAL_SUPPRESSION_THRESHOLD = 0.3
const HAT_TOLERANCE = 0.05

const HAT_UP_VALUES = [-1, -0.714, 0.714, 1]
const HAT_DOWN_VALUES = [-0.142, 0, 0.142]
const HAT_LEFT_VALUES = [0.142, 0.428, 0.714]
const HAT_RIGHT_VALUES = [-0.714, -0.428, -0.142]

const hatMatches = (value: number | null, targets: number[]) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return false
  }

  return targets.some((target) => Math.abs(value - target) <= HAT_TOLERANCE)
}

const safeAxisValue = (value: number | undefined) =>
  typeof value === 'number' ? value : null

const getVerticalAxisValue = (pad: Gamepad) => {
  const axis2 = safeAxisValue(pad.axes[2])

  if (axis2 !== null && Math.abs(axis2) >= 0.1) {
    return axis2
  }

  // axis[1] is reserved for horizontal tracking on the user's controller, so ignore it.
  return 0
}

const readGamepads = () => {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) {
    return []
  }

  return Array.from(navigator.getGamepads()).filter(
    (pad): pad is Gamepad => Boolean(pad),
  )
}

export const useGamepad = (): DirectionIntent | null => {
  const [intent, setIntent] = useState<DirectionIntent | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastEmitRef = useRef<{ direction: Direction | null; timestamp: number }>(
    { direction: null, timestamp: 0 },
  )

  const emitDirection = useCallback((direction: Direction, source: DirectionIntent['source']) => {
    const now = performance.now()
    const { direction: lastDirection, timestamp } = lastEmitRef.current

    if (lastDirection === direction && now - timestamp < REPEAT_DELAY_MS) {
      return
    }

    lastEmitRef.current = { direction, timestamp: now }
    setIntent({ direction, timestamp: Date.now(), source })
  }, [])

  useEffect(() => {
    const stopPolling = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }

    const pollGamepads = () => {
      const gamepads = readGamepads()

      for (const pad of gamepads) {
        const isStandardMapping = pad.mapping === 'standard'
        const horizontalAxis =
          typeof pad.axes[0] === 'number' ? pad.axes[0] : 0
        const verticalAxis = getVerticalAxisValue(pad)
        const dpadHat =
          typeof pad.axes[9] === 'number' ? pad.axes[9] : null

        const hatLeft = hatMatches(dpadHat, HAT_LEFT_VALUES)
        const hatRight = hatMatches(dpadHat, HAT_RIGHT_VALUES)

        const horizontalButtonsActive = isStandardMapping
          ? Boolean(pad.buttons[14]?.pressed) || Boolean(pad.buttons[15]?.pressed)
          : false

        const horizontalActive =
          horizontalButtonsActive || hatLeft || hatRight || Math.abs(horizontalAxis) > MOVEMENT_THRESHOLD

        const allowAxisVertical =
          !horizontalActive && Math.abs(horizontalAxis) < HORIZONTAL_SUPPRESSION_THRESHOLD

        const upPressed =
          (!horizontalActive && isStandardMapping && Boolean(pad.buttons[12]?.pressed)) ||
          (allowAxisVertical && verticalAxis < -MOVEMENT_THRESHOLD) ||
          (!horizontalActive && hatMatches(dpadHat, HAT_UP_VALUES))
        const downPressed =
          (!horizontalActive && isStandardMapping && Boolean(pad.buttons[13]?.pressed)) ||
          (allowAxisVertical && verticalAxis > MOVEMENT_THRESHOLD) ||
          (!horizontalActive && hatMatches(dpadHat, HAT_DOWN_VALUES))

        if (upPressed) {
          emitDirection('up', 'gamepad')
          break
        }

        if (downPressed) {
          emitDirection('down', 'gamepad')
          break
        }
      }

      frameRef.current = requestAnimationFrame(pollGamepads)
    }

    const startPolling = () => {
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(pollGamepads)
      }
    }
    startPolling()

    const handleConnected = () => startPolling()
    const handleDisconnected = () => {
      // keep polling so navigator.getGamepads() can detect reconnects
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        emitDirection('up', 'keyboard')
      }

      if (event.key === 'ArrowDown') {
        emitDirection('down', 'keyboard')
      }
    }
 
    window.addEventListener('gamepadconnected', handleConnected)
    window.addEventListener('gamepaddisconnected', handleDisconnected)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      stopPolling()
      window.removeEventListener('gamepadconnected', handleConnected)
      window.removeEventListener('gamepaddisconnected', handleDisconnected)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [emitDirection])

  return intent
}
