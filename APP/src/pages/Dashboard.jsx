import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import AlertItem from '../components/AlertItem.jsx'
import { ButtonLink } from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import KpiStrip from '../components/KpiStrip.jsx'
import ObservationForm from '../components/ObservationForm.jsx'
import PageHead from '../components/PageHead.jsx'
import { EmptyState, ErrorState, LoadingRow } from '../components/StateViews.jsx'
import DemandChart from '../components/charts/DemandChart.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSettings } from '../hooks/useSettings.js'
import { useData } from '../hooks/useData.js'
import { getRun, listRuns } from '../services/dataService.js'
import { averageOf, findPeak, normalizeRun, normalizeRunList, sumRange } from '../utils/forecast.js'
import { evaluateAlerts } from '../utils/alerts.js'
import { addDays, fmtDate, fmtDateShort, fmtInt, fmtWeekday, timeAgo } from '../utils/format.js'

export default function Dashboard() {
  const { token } = useAuth()
  const [settings] = useSettings()
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

  const derived = useMemo(() => {
    if (!run) return null
    const history = run.history ?? []
    const predictions = run.predictions ?? []
    return {
      predictions,
      next7: sumRange(predictions, 7),
      next30: sumRange(predictions, 30),
      peak: findPeak(predictions),
      alerts: evaluateAlerts(predictions, settings.thresholds, {
        averageDaily: averageOf(history) ?? averageOf(predictions),
      }),
    }
  }, [run, settings.thresholds])

  const loading = runsLoading || runLoading
  const error = runsError ?? runError

  if (error && !loading) {
    return (
      <div className="page">
        <PageHead
          title="Operations overview"
          description="Historical patient demand and the latest forecast for planning ahead."
        />
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

  const hasData = Boolean(derived && (derived.predictions.length || run?.history?.length))

  return (
    <div className="page">
      <PageHead
        title="Operations overview"
        description="Historical patient demand and the latest 90-day forecast, with the demand signals that drive planning."
        actions={
          <ButtonLink to="/forecasts" variant="tertiary" icon="forecasts">
            Forecast runs
          </ButtonLink>
        }
      />

      {loading ? (
        <>
          <KpiStrip
            loading
            cells={[
              { label: 'Next 7 days', value: '', sub: '' },
              { label: 'Next 30 days', value: '', sub: '' },
              { label: 'Expected peak demand', value: '', sub: '' },
              { label: 'Forecast horizon', value: '', sub: '' },
            ]}
          />
          <LoadingRow label="Loading the latest forecast run…" />
        </>
      ) : !hasData ? (
        <EmptyState
          icon="database"
          title="No forecast runs yet"
          text="When the backend completes a forecast run, the latest 90-day patient-demand forecast, demand totals, and high-demand alerts will appear here. You can log observations in the meantime."
          actions={
            <ButtonLink to="/forecasts" icon="plus">
              Trigger a forecast run
            </ButtonLink>
          }
        />
      ) : (
        <>
          <KpiStrip
            cells={[
              {
                label: 'Next 7 days',
                value: fmtInt(derived.next7),
                unit: 'patients',
                sub: `${fmtDateShort(run.forecastStart)} → ${fmtDateShort(addDays(run.forecastStart, 6))}`,
              },
              {
                label: 'Next 30 days',
                value: fmtInt(derived.next30),
                unit: 'patients',
                sub: `${fmtDateShort(run.forecastStart)} → ${fmtDateShort(addDays(run.forecastStart, 29))}`,
              },
              {
                label: 'Expected peak demand',
                value: derived.peak ? fmtInt(derived.peak.patients) : '—',
                unit: 'patients/day',
                sub: derived.peak
                  ? `${fmtWeekday(derived.peak.date)}, ${fmtDate(derived.peak.date)}`
                  : 'No predictions yet',
                alert: derived.peak?.patients >= settings.thresholds.peakPatientsPerDay,
              },
              {
                label: 'Forecast horizon',
                value: `${run.horizon}`,
                unit: 'days',
                sub: `${run.model} · period ${run.period}`,
              },
            ]}
          />

          <div className="dash-grid">
            <Card
              title="Patient demand — historical vs predicted"
              subtitle="Logged daily patients against the model's daily forecast"
              foot="Grey line: observations logged from the facility. Blue line: the model's daily predictions. Dashed vertical line: today. The shaded area is the forecast horizon."
            >
              {run.history.length && run.predictions.length ? (
                <DemandChart history={run.history} predictions={derived.predictions} />
              ) : (
                <>
                  <DemandChart history={run.history} predictions={derived.predictions} />
                  <div className="notice notice--info card__note">
                    {run.history.length === 0
                      ? 'No historical observations are linked to this run yet — the chart shows the forecast only. Log observations to see demand history.'
                      : 'This run has no predictions yet — the chart shows logged observations only.'}
                  </div>
                </>
              )}
            </Card>

            <aside className="dash-rail" aria-label="Forecast context">
              <Card
                title="Latest forecast run"
                subtitle={run.createdAt ? `Completed ${timeAgo(run.createdAt)}` : 'Recently completed'}
                meta={<Badge tone="success">{run.status}</Badge>}
              >
                <dl className="meta-grid">
                  <div className="meta-item">
                    <dt className="meta-item__label">Model</dt>
                    <dd className="meta-item__value">{run.model}</dd>
                  </div>
                  <div className="meta-item">
                    <dt className="meta-item__label">Period</dt>
                    <dd className="meta-item__value">{run.period} days (weekly)</dd>
                  </div>
                  <div className="meta-item">
                    <dt className="meta-item__label">History</dt>
                    <dd className="meta-item__value">
                      {fmtDate(run.historyStart)} → {fmtDate(run.historyEnd)}
                    </dd>
                  </div>
                  <div className="meta-item">
                    <dt className="meta-item__label">Forecast</dt>
                    <dd className="meta-item__value">
                      {fmtDate(run.forecastStart)} → {fmtDate(run.forecastEnd)}
                    </dd>
                  </div>
                  <div className="meta-item">
                    <dt className="meta-item__label">Run ID</dt>
                    <dd className="meta-item__value meta-item__value--sm">
                      <code>{run.id}</code>
                    </dd>
                  </div>
                </dl>
                <div style={{ marginTop: 16 }}>
                  <Link to={`/forecasts?run=${encodeURIComponent(run.id)}`}>View run details</Link>
                </div>
              </Card>

              <Card
                title="High-demand alerts"
                subtitle={`${derived.alerts.length} in the forecast horizon`}
              >
                {derived.alerts.length ? (
                  <div className="dash-due-soon">
                    {derived.alerts.slice(0, 3).map((alert) => (
                      <AlertItem key={alert.id} alert={alert} />
                    ))}
                  </div>
                ) : (
                  <p className="state__text" style={{ padding: '8px 0' }}>
                    No high-demand periods are expected under the current alert thresholds.
                  </p>
                )}
                <div className="card__foot">
                  <Link to="/alerts">View all alerts and thresholds</Link>
                </div>
              </Card>

              <Card
                title="Log patient demand"
                subtitle="Daily observations feed the next forecast run"
              >
                <ObservationForm settings={settings} token={token} onLogged={reloadRun} />
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
