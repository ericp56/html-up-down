import { useCallback, useEffect, useRef } from 'react'

const CHIME_DURATION = 0.65
const ATTACK_TIME = 0.02
const RELEASE_TIME = 0.12

const buildChimeBuffer = (context: AudioContext) => {
  const length = Math.floor(context.sampleRate * CHIME_DURATION)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)

  const startFreq = 493.88 // B4
  const endFreq = 783.99 // G5

  for (let i = 0; i < length; i += 1) {
    const t = i / context.sampleRate
    const envelopeAttack = Math.min(1, t / ATTACK_TIME)
    const envelopeRelease = 1 - Math.max(0, (t - (CHIME_DURATION - RELEASE_TIME)) / RELEASE_TIME)
    const envelope = envelopeAttack * envelopeRelease
    const freq = startFreq + (endFreq - startFreq) * (t / CHIME_DURATION)
    data[i] = envelope * Math.sin(2 * Math.PI * freq * t)
  }

  return buffer
}

export const useSuccessChime = () => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return null
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume()
    }

    return audioContextRef.current
  }, [])

  const stopActiveSource = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop()
      } catch (_) {
        // already stopped
      }
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    if (gainRef.current) {
      gainRef.current.disconnect()
      gainRef.current = null
    }
  }, [])

  const playChime = useCallback(() => {
    const context = ensureContext()
    if (!context) {
      return
    }

    if (!bufferRef.current) {
      bufferRef.current = buildChimeBuffer(context)
    }

    stopActiveSource()

    const source = context.createBufferSource()
    source.buffer = bufferRef.current

    const gain = context.createGain()
    const now = context.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.6, now + ATTACK_TIME)
    gain.gain.linearRampToValueAtTime(0, now + CHIME_DURATION)

    source.connect(gain)
    gain.connect(context.destination)

    source.start(now)
    source.stop(now + CHIME_DURATION)
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
      if (sourceRef.current === source) {
        sourceRef.current = null
        gainRef.current = null
      }
    }

    sourceRef.current = source
    gainRef.current = gain
  }, [ensureContext, stopActiveSource])

  useEffect(() => {
    const unlock = () => {
      const context = ensureContext()
      if (!context) {
        return
      }

      if (context.state === 'suspended') {
        void context.resume()
      }
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'keydown']
    events.forEach((event) => {
      window.addEventListener(event, unlock, { once: true })
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, unlock)
      })
    }
  }, [ensureContext])

  useEffect(() => {
    return () => {
      stopActiveSource()

      if (audioContextRef.current) {
        void audioContextRef.current.close()
        audioContextRef.current = null
      }
      bufferRef.current = null
    }
  }, [stopActiveSource])

  return playChime
}
