import { getFeedbackSettings } from './user-settings'

function vibrateStrong() {
  try {
    if ('vibrate' in navigator) {
      // Approximate "max" by a stronger-feeling, longer pattern
      navigator.vibrate([80, 60, 80, 60, 120])
    }
  } catch {}
}

function playLoudSuccessTune() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()
    // Louder, slightly longer success melody with gentle envelope to avoid clicks
    const master = ctx.createGain()
    master.gain.value = 0.6 // louder than before
    master.connect(ctx.destination)

    const notes = [
      { f: 784, d: 0.14 },   // G5
      { f: 988, d: 0.14 },   // B5
      { f: 1175, d: 0.20 },  // D6
    ]
    let t = ctx.currentTime
    for (const n of notes) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'triangle'
      o.frequency.setValueAtTime(n.f, t)
      // Attack/decay
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + n.d)
      o.connect(g)
      g.connect(master)
      o.start(t)
      o.stop(t + n.d + 0.03)
      t += n.d + 0.03
    }
    setTimeout(() => { try { ctx.close() } catch {} }, 1000)
  } catch {}
}

export function triggerSuccessVibration() {
  const { vibrationEnabled } = getFeedbackSettings()
  if (vibrationEnabled) vibrateStrong()
}

export function triggerSuccessSound() {
  const { soundEnabled } = getFeedbackSettings()
  if (soundEnabled) playLoudSuccessTune()
}

export function triggerSuccessFeedback() {
  const { soundEnabled, vibrationEnabled } = getFeedbackSettings()
  if (vibrationEnabled) vibrateStrong()
  if (soundEnabled) playLoudSuccessTune()
}
