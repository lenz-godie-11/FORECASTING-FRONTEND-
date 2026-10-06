import { useState } from 'react'
import { Button } from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import Icon from '../components/Icon.jsx'
import PageHead from '../components/PageHead.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSettings } from '../hooks/useSettings.js'
import { OBSERVATION_SOURCES } from '../utils/sources.js'
import { API_BASE_URL, API_AVAILABLE } from '../services/api.js'
import { DEFAULT_THRESHOLDS } from '../utils/alerts.js'

export default function Settings() {
  const { user, logout } = useAuth()
  const [settings, updateSettings] = useSettings()

  const [facility, setFacility] = useState(settings.facility)
  const [defaultSource, setDefaultSource] = useState(settings.defaultSource)
  const [facilityNote, setFacilityNote] = useState(null)

  const [draft, setDraft] = useState({
    peak: String(settings.thresholds.peakPatientsPerDay),
    sustained: String(settings.thresholds.sustainedPatientsPerDay),
    days: String(settings.thresholds.sustainedDays),
  })
  const [thresholdNote, setThresholdNote] = useState(null)
  const [thresholdError, setThresholdError] = useState(null)

  function saveFacility(event) {
    event.preventDefault()
    updateSettings({ facility: facility.trim() || 'My facility', defaultSource })
    setFacilityNote('Facility profile saved for this browser. A facility data service will store this centrally when it is available.')
  }

  function saveThresholds(event) {
    event.preventDefault()
    const peak = Number(draft.peak)
    const sustained = Number(draft.sustained)
    const days = Number(draft.days)
    if (![peak, sustained, days].every((v) => Number.isInteger(v) && v > 0)) {
      setThresholdError('Thresholds must be whole numbers greater than zero.')
      return
    }
    setThresholdError(null)
    updateSettings({
      thresholds: { peakPatientsPerDay: peak, sustainedPatientsPerDay: sustained, sustainedDays: days },
    })
    setThresholdNote('Alert thresholds saved. The Alerts page now uses these values.')
  }

  return (
    <div className="page settings-page">
      <PageHead
        title="Settings"
        description="Facility profile, alert thresholds, model facts, and data source."
      />

      <Card title="Facility profile" subtitle="Used for labelling the console and as the default observation source">
        <form onSubmit={saveFacility} noValidate>
          <div className="form-row settings-row">
            <div className="field">
              <label className="field__label" htmlFor="settings-facility">
                <strong>Facility name</strong>
              </label>
              <input
                id="settings-facility"
                className="input"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="settings-source">
                <strong>Default observation source</strong>
              </label>
              <select
                id="settings-source"
                className="select"
                value={defaultSource}
                onChange={(e) => setDefaultSource(e.target.value)}
              >
                {OBSERVATION_SOURCES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {facilityNote ? (
            <div className="notice notice--success card__note" role="status">
              <Icon name="check" size={16} />
              <span>{facilityNote}</span>
            </div>
          ) : null}
          <div className="form-actions">
            <Button type="submit" icon="check">
              Save facility profile
            </Button>
          </div>
        </form>
      </Card>

      <Card
        title="Alert thresholds"
        subtitle="Same rules as the Alerts page"
        foot="Today these run client-side. The shape is serialisable so the business logic can move to the backend later without UI changes."
      >
        <form onSubmit={saveThresholds} noValidate>
          <div className="form-row">
            <div className="field">
              <label className="field__label" htmlFor="settings-peak">
                <strong>Peak day</strong>
              </label>
              <input
                id="settings-peak"
                className="input"
                type="number"
                min="1"
                value={draft.peak}
                onChange={(e) => setDraft((d) => ({ ...d, peak: e.target.value }))}
              />
              <span className="field__hint">Patients/day that flag a high-demand day</span>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="settings-sustained">
                <strong>Sustained level</strong>
              </label>
              <input
                id="settings-sustained"
                className="input"
                type="number"
                min="1"
                value={draft.sustained}
                onChange={(e) => setDraft((d) => ({ ...d, sustained: e.target.value }))}
              />
              <span className="field__hint">Patients/day for a sustained period</span>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="settings-days">
                <strong>Consecutive days</strong>
              </label>
              <input
                id="settings-days"
                className="input"
                type="number"
                min="1"
                value={draft.days}
                onChange={(e) => setDraft((d) => ({ ...d, days: e.target.value }))}
              />
              <span className="field__hint">Days at/above the sustained level</span>
            </div>
          </div>
          {thresholdError ? (
            <div className="notice notice--error card__note" role="alert">
              <Icon name="warning" size={16} />
              <span>{thresholdError}</span>
            </div>
          ) : null}
          {thresholdNote ? (
            <div className="notice notice--success card__note" role="status">
              <Icon name="check" size={16} />
              <span>{thresholdNote}</span>
            </div>
          ) : null}
          <div className="form-actions">
            <Button type="submit" icon="check">
              Save thresholds
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDraft({
                  peak: String(DEFAULT_THRESHOLDS.peakPatientsPerDay),
                  sustained: String(DEFAULT_THRESHOLDS.sustainedPatientsPerDay),
                  days: String(DEFAULT_THRESHOLDS.sustainedDays),
                })
                setThresholdNote(null)
              }}
            >
              Reset to defaults
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Model and data" subtitle="Facts about the current production setup">
        <dl className="dl">
          <dt>Forecasting model</dt>
          <dd>ThetaModel with period 7 (weekly seasonality).</dd>
          <dt>Forecast horizon</dt>
          <dd>90 days of daily patient-demand predictions per run.</dd>
          <dt>Scope of the forecast</dt>
          <dd>
            Patient demand only. The model does not predict staffing, beds, medicines, or other
            resources — resource planning uses the demand forecast as input.
          </dd>
          <dt>API base URL</dt>
          <dd>
            {API_AVAILABLE ? (
              <code>{API_BASE_URL}</code>
            ) : (
              <span>
                Not set. Copy <code>.env.example</code> to <code>.env</code> and set{' '}
                <code>VITE_API_BASE_URL</code>, then restart the dev server.
              </span>
            )}
          </dd>
          <dt>Data flow</dt>
          <dd>
            This frontend talks to the Django REST API only (login, observations, forecasts). It
            never contacts the database or the model directly.
          </dd>
        </dl>
      </Card>

      <Card title="Demo data" subtitle="Offline exploration, clearly labelled">
        <label className="check">
          <input
            type="checkbox"
            checked={settings.demo}
            onChange={(e) => updateSettings({ demo: e.target.checked })}
          />
          <span>
            Use demo data. A synthetic, deterministic data set replaces the API for every page, and
            a <strong>Demo data</strong> badge appears in the header. Failed API calls never fall
            back to demo data silently.
          </span>
        </label>
      </Card>

      <Card title="Session" subtitle="Signed in through the Django auth endpoint">
        <dl className="dl">
          <dt>Account</dt>
          <dd>{user?.name ?? '—'}</dd>
          <dt>Session</dt>
          <dd>
            JWT kept in this browser. Any API response with a 401 status signs the session out and
            returns you to the sign-in screen.
          </dd>
        </dl>
        <div className="form-actions">
          <Button variant="tertiary" icon="logout" onClick={logout}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  )
}
