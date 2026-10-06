import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_THRESHOLDS } from '../utils/alerts.js'

const STORAGE_KEY = 'afyaflow:settings'
const CHANGE_EVENT = 'afyaflow:settings-changed'

export const DEFAULT_SETTINGS = {
  facility: 'Central Regional Hospital',
  defaultSource: 'hospital_system',
  demo: false,
  thresholds: { ...DEFAULT_THRESHOLDS },
  /**
   * Locally-entered capacity figures used for comparison in Resource
   * Planning. The model does not provide capacity data; these values are
   * the facility's own and are kept in the browser only.
   */
  capacity: { beds: null, nursing: null, medicines: null, consumables: null },
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      thresholds: { ...DEFAULT_SETTINGS.thresholds, ...(parsed.thresholds ?? {}) },
      capacity: { ...DEFAULT_SETTINGS.capacity, ...(parsed.capacity ?? {}) },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load)

  // Keep every useSettings() instance in this tab in sync.
  useEffect(() => {
    const sync = () => setSettings(load())
    window.addEventListener('storage', sync)
    window.addEventListener(CHANGE_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CHANGE_EVENT, sync)
    }
  }, [])

  const update = useCallback((partial) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        ...partial,
        thresholds: partial.thresholds
          ? { ...prev.thresholds, ...partial.thresholds }
          : prev.thresholds,
        capacity: partial.capacity ? { ...prev.capacity, ...partial.capacity } : prev.capacity,
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage unavailable — settings apply for this session only.
      }
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
      return next
    })
  }, [])

  return [settings, update]
}
