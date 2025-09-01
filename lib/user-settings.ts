export type FeedbackSettings = {
  soundEnabled: boolean
  vibrationEnabled: boolean
}

const SOUND_KEY = 'feedback_sound_enabled'
const VIBRATION_KEY = 'feedback_vibration_enabled'
const EVENT = 'feedback:settings-changed'

export function getFeedbackSettings(): FeedbackSettings {
  try {
    const se = localStorage.getItem(SOUND_KEY)
    const ve = localStorage.getItem(VIBRATION_KEY)
    return {
      soundEnabled: se == null ? true : se === '1',
      vibrationEnabled: ve == null ? true : ve === '1',
    }
  } catch {
    return { soundEnabled: true, vibrationEnabled: true }
  }
}

export function setFeedbackSettings(next: Partial<FeedbackSettings>) {
  try {
    const cur = getFeedbackSettings()
    const merged: FeedbackSettings = { ...cur, ...next }
    localStorage.setItem(SOUND_KEY, merged.soundEnabled ? '1' : '0')
    localStorage.setItem(VIBRATION_KEY, merged.vibrationEnabled ? '1' : '0')
    const evt = new CustomEvent(EVENT, { detail: merged })
    window.dispatchEvent(evt)
  } catch {}
}

export function subscribeFeedbackSettings(cb: (s: FeedbackSettings) => void) {
  const handler = (e: Event) => {
    try {
      const d = (e as CustomEvent<FeedbackSettings>).detail
      if (d) cb(d)
    } catch {}
  }
  window.addEventListener(EVENT, handler as EventListener)
  return () => window.removeEventListener(EVENT, handler as EventListener)
}
