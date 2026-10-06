import { useState } from 'react'
import { createObservation } from '../services/dataService.js'
import { fmtDate, todayISO } from '../utils/format.js'
import { OBSERVATION_SOURCES } from '../utils/sources.js'
import { Button } from './Button.jsx'
import Icon from './Icon.jsx'

/**
 * Observation ingestion: POST /api/v1/obs/
 * { "date": "YYYY-MM-DD", "patients": 128, "source": "hospital_system" }
 */
export default function ObservationForm({ settings, token, onLogged }) {
  const [date, setDate] = useState(todayISO())
  const [patients, setPatients] = useState('')
  const [source, setSource] = useState(settings?.defaultSource ?? 'hospital_system')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    const value = Number(patients)
    if (!date) {
      setError('Choose the observation date.')
      return
    }
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      setError('Enter the patient count as a whole number.')
      return
    }
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      await createObservation(
        { date, patients: value, source },
        { demoMode: settings?.demo, token },
      )
      setOk(`Logged ${value.toLocaleString('en-US')} patients for ${fmtDate(date)} via ${source}. New observations feed the next forecast run.`)
      setPatients('')
      onLogged?.()
    } catch (err) {
      setError(err.message ?? 'The observation could not be submitted.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="obs-fields">
        <div className="field">
          <label className="field__label" htmlFor="obs-date">
            <strong>Date</strong>
          </label>
          <input
            id="obs-date"
            type="date"
            className={error && !patients ? 'input input--error' : 'input'}
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="obs-patients">
            <strong>Patients</strong>
          </label>
          <input
            id="obs-patients"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            className={error && !date ? 'input input--error' : 'input'}
            value={patients}
            placeholder="e.g. 128"
            onChange={(e) => setPatients(e.target.value)}
            required
            aria-describedby="obs-patients-hint"
          />
          <span className="field__hint" id="obs-patients-hint">
            Total patient encounters for that day
          </span>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="obs-source">
            <strong>Source</strong>
          </label>
          <select
            id="obs-source"
            className="select"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {OBSERVATION_SOURCES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? (
        <div className="notice notice--error" role="alert">
          <Icon name="warning" size={16} />
          <span>{error}</span>
        </div>
      ) : null}
      {ok ? (
        <div className="notice notice--success" role="status">
          <Icon name="check" size={16} />
          <span>{ok}</span>
        </div>
      ) : null}
      <div className="form-actions">
        <Button type="submit" busy={busy} icon={busy ? undefined : 'plus'}>
          {busy ? 'Submitting…' : 'Log observation'}
        </Button>
      </div>
    </form>
  )
}
