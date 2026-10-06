import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Icon from '../components/Icon.jsx'
import PageHead from '../components/PageHead.jsx'
import { EmptyState, ErrorState, LoadingRow } from '../components/StateViews.jsx'
import ForecastLineChart from '../components/charts/ForecastLineChart.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSettings } from '../hooks/useSettings.js'
import { useData } from '../hooks/useData.js'
import { createRun, getRun, listRuns } from '../services/dataService.js'
import { averageOf, normalizeRun, normalizeRunList } from '../utils/forecast.js'
import { cx, fmtDate, fmtInt, fmtPct, fmtWeekday, timeAgo } from '../utils/format.js'

const STATUS_TONE = {
  completed: 'success',
  running: 'info',
  queued: 'warning',
  processing: 'info',
  failed: 'error',
}

function shortenId(id) {
  return id.length > 20 ? `${id.slice(0, 20)}…` : id
}

export default function Forecasts() {
  const { token } = useAuth()
  const [settings] = useSettings()
  const location = useLocation()
  const initialRun = new URLSearchParams(location.search).get('run')

  const { data: runs, loading, error, reload } = useData(
    (signal) => listRuns({ demoMode: settings.demo, token, signal }).then(normalizeRunList),
    `runs:${settings.demo ? 'demo' : 'api'}`,
  )

  const [selectedId, setSelectedId] = useState(initialRun ?? null)
  const effectiveId =
    selectedId && runs?.some((r) => r.id === selectedId) ? selectedId : runs?.[0]?.id

  const { data: run, loading: detailLoading, error: detailError, reload: reloadDetail } = useData(
    async (signal) => {
      if (!effectiveId) return null
      const raw = await getRun(effectiveId, { demoMode: settings.demo, token, signal })
      return normalizeRun(raw)
    },
    `run:${effectiveId ?? 'none'}:${settings.demo ? 'demo' : 'api'}`,
  )

  const [triggering, setTriggering] = useState(false)
  const [triggerNote, setTriggerNote] = useState(null)
  const [triggerError, setTriggerError] = useState(null)

  async function triggerRun() {
    setTriggering(true)
    setTriggerNote(null)
    setTriggerError(null)
    try {
      const raw = await createRun({ demoMode: settings.demo, token })
      setTriggerNote(
        settings.demo
          ? 'Demo run completed — it now leads the run table below.'
          : 'Forecast run submitted to the backend. It will appear in the run table when it completes; use Refresh if it does not appear immediately.',
      )
      const created = normalizeRun(raw)
      if (created?.id) setSelectedId(created.id)
      reload()
    } catch (err) {
      setTriggerError(err.message || 'The forecast run could not be triggered.')
    } finally {
      setTriggering(false)
    }
  }

  const avg = run ? averageOf(run.predictions) : null

  return (
    <div className="page">
      <PageHead
        title="Forecasts"
        description="Forecast runs produced by the backend and their daily patient-demand predictions."
        actions={
          <Button icon="plus" busy={triggering} onClick={triggerRun}>
            {triggering ? 'Submitting…' : 'Run new forecast'}
          </Button>
        }
      />

      {triggerNote ? (
        <div className="notice notice--success" role="status">
          <Icon name="check" size={16} />
          <span>{triggerNote}</span>
        </div>
      ) : null}
      {triggerError ? (
        <div className="notice notice--error" role="alert">
          <Icon name="warning" size={16} />
          <span>{triggerError}</span>
        </div>
      ) : null}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <LoadingRow label="Loading forecast runs…" />
      ) : runs.length === 0 ? (
        <EmptyState
          icon="forecasts"
          title="No forecast runs yet"
          text="Trigger a forecast run and the backend will produce the latest 90-day daily patient-demand prediction."
          actions={
            <Button icon="plus" busy={triggering} onClick={triggerRun}>
              Run new forecast
            </Button>
          }
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Forecast runs, most recent first</caption>
              <thead>
                <tr>
                  <th scope="col">Run</th>
                  <th scope="col">Model</th>
                  <th scope="col">Period</th>
                  <th scope="col">Horizon</th>
                  <th scope="col">History</th>
                  <th scope="col">Forecast</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((item) => (
                  <tr key={item.id} className={cx(item.id === effectiveId && 'is-selected')}>
                    <td>
                      <button
                        type="button"
                        className="table-row-btn"
                        onClick={() => setSelectedId(item.id)}
                        aria-label={`Select run ${item.id}`}
                      >
                        <code>{shortenId(item.id)}</code>
                        <span className="cell-sub">
                          {item.createdAt ? timeAgo(item.createdAt) : 'No timestamp'}
                        </span>
                      </button>
                    </td>
                    <td>{item.model}</td>
                    <td className="cell-num">{item.period} days</td>
                    <td className="cell-num">{item.horizon} days</td>
                    <td>
                      {fmtDate(item.historyStart)} → {fmtDate(item.historyEnd)}
                    </td>
                    <td>
                      {fmtDate(item.forecastStart)} → {fmtDate(item.forecastEnd)}
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[item.status] ?? 'neutral'}>{item.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {detailLoading ? (
            <LoadingRow label="Loading daily predictions…" />
          ) : detailError ? (
            <ErrorState
              error={detailError}
              onRetry={reloadDetail}
              retryLabel="Reload this run"
              extra="You can select another run in the table above while this one fails."
            />
          ) : run ? (
            <Card
              title={`Daily predictions — ${run.model}`}
              subtitle={`${run.horizon} daily predictions, ${fmtDate(run.forecastStart)} to ${fmtDate(run.forecastEnd)}`}
              meta={
                <Badge tone="neutral">
                  History {fmtDate(run.historyStart)} → {fmtDate(run.historyEnd)}
                </Badge>
              }
            >
              <ForecastLineChart series={run.predictions} showAverageLine height={320} />
              <div className="table-wrap table-scroll card__note">
                <table className="table">
                  <caption className="sr-only">Daily predicted patients for the selected run</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Weekday</th>
                      <th scope="col" className="cell-num">
                        Predicted patients
                      </th>
                      <th scope="col" className="cell-num">
                        vs run average
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.predictions.map((point) => {
                      const delta =
                        avg != null && avg > 0 ? ((point.patients - avg) / avg) * 100 : null
                      return (
                        <tr key={point.date}>
                          <td>{fmtDate(point.date)}</td>
                          <td className="cell-muted">{fmtWeekday(point.date)}</td>
                          <td className="cell-num">{fmtInt(point.patients)}</td>
                          <td className="cell-num">{delta == null ? '—' : fmtPct(delta)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
