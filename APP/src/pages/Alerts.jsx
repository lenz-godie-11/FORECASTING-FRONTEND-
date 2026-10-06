import { Fragment, useMemo, useState } from 'react'
import AlertItem from '../components/AlertItem.jsx'
import { Button } from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Icon from '../components/Icon.jsx'
import PageHead from '../components/PageHead.jsx'
import { EmptyState, ErrorState, LoadingRow } from '../components/StateViews.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSettings } from '../hooks/useSettings.js'
import { useData } from '../hooks/useData.js'
import { getRun, listRuns } from '../services/dataService.js'
import { normalizeRun, normalizeRunList, averageOf } from '../utils/forecast.js'
import { ALERT_RULES, DEFAULT_THRESHOLDS, evaluateAlerts } from '../utils/alerts.js'
import { fmtInt, timeAgo } from '../utils/format.js'

export default function Alerts() {
  const { token } = useAuth()
  const [settings, updateSettings] = useSettings()
  const source = settings.demo ? 'demo' : 'api'

  const { data: runs, loading: runsLoading, error: runsError, reload } = useData(
    (signal) => listRuns({ demoMode: settings.demo, token, signal }).then(normalizeRunList),
    `runs:${source}`,
  )

  const latestId = runs?.[0]?.id

  const { data: run, loading: runLoading, error: runError, reload: reloadRun } = useData(
    async (signal) => {
      if (!latestId) return null
      const raw = await getRun(latestId, { demoMode: settings.demo, token, signal })
      return normalizeRun(raw)
    },
    `run:${latestId ?? 'none'}:${source}`,
  )

  const [draft, setDraft] = useState({
    peak: String(settings.thresholds.peakPatientsPerDay),
    sustained: String(settings.thresholds.sustainedPatientsPerDay),
    days: String(settings.thresholds.sustainedDays),
  })
  const [savedNote, setSavedNote] = useState(null)
  const [thresholdError, setThresholdError] = useState(null)

  const alerts = useMemo(() => {
    if (!run) return []
    const predictions = run.predictions ?? []
    if (!predictions.length) return []
    return evaluateAlerts(predictions, settings.thresholds, {
      averageDaily: averageOf(run.history) ?? averageOf(predictions),
    })
  }, [run, settings.thresholds])

  function saveThresholds(event) {
    event.preventDefault()
    const peak = Number(draft.peak)
    const sustained = Number(draft.sustained)
    const days = Number(draft.days)
    if (![peak, sustained, days].every((v) => Number.isInteger(v) && v > 0)) {
      setThresholdError('Thresholds must be whole numbers greater than zero.')
      return
    }
    if (sustained > peak) {
      setThresholdError('The sustained threshold should not exceed the peak threshold.')
      return
    }
    setThresholdError(null)
    updateSettings({
      thresholds: {
        peakPatientsPerDay: peak,
        sustainedPatientsPerDay: sustained,
        sustainedDays: days,
      },
    })
    setSavedNote('Alert thresholds saved for this browser. They run in the frontend today and are structured to move to backend business logic without UI changes.')
  }

  function resetThresholds() {
    setDraft({
      peak: String(DEFAULT_THRESHOLDS.peakPatientsPerDay),
      sustained: String(DEFAULT_THRESHOLDS.sustainedPatientsPerDay),
      days: String(DEFAULT_THRESHOLDS.sustainedDays),
    })
    setSavedNote(null)
  }

  const loading = runsLoading || runLoading
  const error = runsError ?? runError

  if (error && !loading) {
    return (
      <div className="page">
        <PageHead title="Alerts" description="High-demand periods in the forecast horizon." />
        <ErrorState
          error={error}
          onRetry={() => {
            reload()
            reloadRun()
          }}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHead
        title="Alerts"
        description="High-demand periods expected in the forecast horizon, evaluated against the alert rules on the right."
      />

      {loading ? (
        <LoadingRow label="Evaluating forecast alerts…" />
      ) : !run?.predictions?.length ? (
        <EmptyState
          icon="alerts"
          title="No forecast to evaluate"
          text="Alerts are computed from the latest forecast run's daily predictions. Run a forecast first and the expected high-demand periods will appear here."
          actions={
            <a className="btn btn--tertiary" href="/forecasts">
              Go to forecasts
            </a>
          }
        />
      ) : (
        <div className="grid-2">
          <Card
            title="Forecast alerts"
            subtitle={run.createdAt ? `Latest run, completed ${timeAgo(run.createdAt)}` : 'Latest run'}
            meta={<Badge tone="neutral">{alerts.length} active</Badge>}
          >
            {alerts.length ? (
              alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
            ) : (
              <EmptyState
                icon="check"
                title="All quiet in the horizon"
                text={`No day in the forecast reaches ${fmtInt(settings.thresholds.peakPatientsPerDay)} patients, and no ${settings.thresholds.sustainedDays}-day stretch reaches ${fmtInt(settings.thresholds.sustainedPatientsPerDay)} patients/day.`}
              />
            )}
          </Card>

          <div className="dash-rail">
            <Card
              title="Alert rules"
              subtitle="Thresholds applied to daily predicted patients"
              foot="Rules run client-side today. The threshold shape and alert objects are stable, so the business logic can move to the backend without changing the UI."
            >
              <form onSubmit={saveThresholds} noValidate>
                <div className="form-row">
                  <div className="field">
                    <label className="field__label" htmlFor="alert-peak">
                      <strong>Peak day</strong>
                    </label>
                    <input
                      id="alert-peak"
                      className="input"
                      type="number"
                      min="1"
                      value={draft.peak}
                      onChange={(e) => setDraft((d) => ({ ...d, peak: e.target.value }))}
                    />
                    <span className="field__hint">Patients/day that flag a high-demand day</span>
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor="alert-sustained">
                      <strong>Sustained level</strong>
                    </label>
                    <input
                      id="alert-sustained"
                      className="input"
                      type="number"
                      min="1"
                      value={draft.sustained}
                      onChange={(e) => setDraft((d) => ({ ...d, sustained: e.target.value }))}
                    />
                    <span className="field__hint">Patients/day for a sustained period</span>
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor="alert-days">
                      <strong>Consecutive days</strong>
                    </label>
                    <input
                      id="alert-days"
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
                {savedNote ? (
                  <div className="notice notice--success card__note" role="status">
                    <Icon name="check" size={16} />
                    <span>{savedNote}</span>
                  </div>
                ) : null}
                <div className="form-actions">
                  <Button type="submit" icon="check">
                    Save thresholds
                  </Button>
                  <Button variant="ghost" onClick={resetThresholds}>
                    Reset to defaults
                  </Button>
                </div>
              </form>
            </Card>

            <Card title="How alerts are calculated" subtitle="Each rule and its severity">
              <dl className="dl">
                {ALERT_RULES.map((rule) => (
                  <Fragment key={rule.key}>
                    <dt>
                      {rule.label}{' '}
                      <Badge
                        tone={
                          rule.severity === 'high'
                            ? 'error'
                            : rule.severity === 'warning'
                              ? 'warning'
                              : 'info'
                        }
                        className="card__badge"
                      >
                        {rule.severity}
                      </Badge>
                    </dt>
                    <dd>{rule.description}</dd>
                  </Fragment>
                ))}
              </dl>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
