import { useMemo } from 'react'
import Badge from '../components/Badge.jsx'
import Card from '../components/Card.jsx'
import Icon from '../components/Icon.jsx'
import PageHead from '../components/PageHead.jsx'
import { EmptyState, ErrorState, LoadingRow } from '../components/StateViews.jsx'
import CapacityChart from '../components/charts/CapacityChart.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSettings } from '../hooks/useSettings.js'
import { useData } from '../hooks/useData.js'
import { getRun, listRuns } from '../services/dataService.js'
import { normalizeRun, normalizeRunList, findPeak } from '../utils/forecast.js'
import { cx, fmtDate, fmtDateShort, fmtInt, fmtPct, fmtWeekday } from '../utils/format.js'

const RESOURCES = [
  {
    key: 'beds',
    label: 'Bed capacity',
    hint: 'Daily beds available to patients (1:1 planning basis)',
  },
  {
    key: 'nursing',
    label: 'Nursing shifts',
    hint: 'Daily nurse shifts available (1:1 planning basis)',
  },
  {
    key: 'medicines',
    label: 'Medicine stock',
    hint: 'Days of medicine stock on hand',
  },
  {
    key: 'consumables',
    label: 'Consumable stock',
    hint: 'Days of consumable stock on hand',
  },
]

export default function ResourcePlanning() {
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

  const planning = useMemo(() => {
    const predictions = run?.predictions ?? []
    if (!predictions.length) return null
    const next7 = predictions.slice(0, 7)
    const next30 = predictions.slice(0, 30)
    const peakWeek = next7.reduce((best, p) => (p.patients > (best?.patients ?? 0) ? p : best), null)
    const stock30 = next30.reduce((acc, p) => acc + p.patients, 0)
    return { predictions, next7, peakWeek, stock30, peak: findPeak(predictions) }
  }, [run])

  const loading = runsLoading || runLoading
  const error = runsError ?? runError

  if (error && !loading) {
    return (
      <div className="page">
        <PageHead title="Resource planning" description="Demand-based planning support." />
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

  function capacityStatus(resource) {
    const capacity = settings.capacity[resource.key]
    if (!planning || capacity == null || Number.isNaN(capacity) || capacity <= 0) {
      return { tone: 'neutral', text: 'No capacity entered' }
    }
    if (resource.key === 'medicines' || resource.key === 'consumables') {
      if (capacity >= 30) return { tone: 'success', text: `Covers ${capacity} of 30 days` }
      if (capacity >= 21) return { tone: 'warning', text: `Covers ${capacity} of 30 days` }
      return { tone: 'error', text: `Covers ${capacity} of 30 days` }
    }
    const expected = planning.peakWeek?.patients ?? 0
    if (expected <= capacity) return { tone: 'success', text: `Within capacity (${fmtInt(capacity)})` }
    if (expected <= capacity * 1.25)
      return { tone: 'warning', text: `Near capacity (+${fmtPct(((expected - capacity) / capacity) * 100)})` }
    return { tone: 'error', text: `Exceeds capacity (${fmtPct(((expected - capacity) / capacity) * 100)})` }
  }

  return (
    <div className="page">
      <PageHead
        title="Resource planning"
        description="Decision support: compare the patient-demand forecast against the capacity your facility has available."
      />

      <aside className="planning-note" aria-label="About this page">
        <Icon name="info" size={18} />
        <div>
          <p>
            <strong>AfyaFlow forecasts patient demand only.</strong> The Theta model does not
            predict nurses, beds, medicines, or supplies. The comparisons on this page use the
            demand forecast against capacity figures your facility enters — decision support, not
            model output.
          </p>
          <p>
            Capacity values are kept in this browser. Where no facility data source is connected,
            an empty state is shown rather than an invented number.
          </p>
        </div>
      </aside>

      {loading ? (
        <LoadingRow label="Loading the demand forecast…" />
      ) : !planning ? (
        <EmptyState
          icon="planning"
          title="No forecast available yet"
          text="Resource planning compares the demand forecast against your capacity. Run a forecast (or sign in to a workspace that has one) to use this page."
          actions={
            <a className="btn btn--tertiary" href="/forecasts">
              Go to forecasts
            </a>
          }
        />
      ) : (
        <>
          <div className="grid-2">
            <Card
              title="Seven-day demand outlook"
              subtitle={`Predicted daily patients, ${fmtDateShort(run.forecastStart)} → ${fmtDateShort(planning.next7[planning.next7.length - 1]?.date ?? '')}`}
              meta={
                planning.peak ? (
                  <Badge
                    tone={
                      planning.peak.patients >= settings.thresholds.peakPatientsPerDay ? 'error' : 'info'
                    }
                  >
                    Peak {fmtInt(planning.peak.patients)} on {fmtWeekday(planning.peak.date)}{' '}
                    {fmtDateShort(planning.peak.date)}
                  </Badge>
                ) : null
              }
            >
              <CapacityChart
                predictions={planning.predictions}
                capacity={settings.capacity.beds ?? null}
              />
              <div className="table-wrap card__note">
                <table className="table">
                  <caption className="sr-only">Predicted patients for the next seven days</caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Weekday</th>
                      <th scope="col" className="cell-num">
                        Predicted patients
                      </th>
                      <th scope="col" className="cell-num">
                        Day over day
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {planning.next7.map((point, i) => {
                      const prev = i > 0 ? planning.next7[i - 1].patients : null
                      const delta = prev != null ? point.patients - prev : null
                      const isPeak = planning.peak?.date === point.date
                      return (
                        <tr key={point.date} className={cx(isPeak && 'is-selected')}>
                          <td>
                            {fmtDate(point.date)}
                            {isPeak ? (
                              <Badge tone="info" className="card__badge">
                                Peak day
                              </Badge>
                            ) : null}
                          </td>
                          <td className="cell-muted">{fmtWeekday(point.date)}</td>
                          <td className="cell-num">{fmtInt(point.patients)}</td>
                          <td className="cell-num">
                            {delta == null ? '—' : `${delta > 0 ? '+' : ''}${fmtInt(delta)}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card
              title="Capacity check"
              subtitle="Forecast demand against locally entered capacity"
              foot="Comparisons assume one unit of capacity per patient on the stated basis. Adjust the capacity values to your facility's planning basis. The model itself provides no resource data."
            >
              <div className="capacity-grid">
                {RESOURCES.map((resource) => {
                  const status = capacityStatus(resource)
                  const value = settings.capacity[resource.key]
                  return (
                    <div key={resource.key} className="capacity-cell">
                      <div className="capacity-cell__label">{resource.label}</div>
                      <div className="capacity-cell__hint">{resource.hint}</div>
                      <div className="capacity-cell__input">
                        <input
                          className="input"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={value == null ? '' : String(value)}
                          placeholder="Enter"
                          aria-label={`${resource.label} capacity`}
                          onChange={(e) => {
                            const raw = e.target.value
                            updateSettings({
                              capacity: {
                                [resource.key]: raw === '' ? null : Number(raw),
                              },
                            })
                          }}
                        />
                      </div>
                      <div className="capacity-cell__status">
                        <Badge tone={status.tone}>{status.text}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <Card
            title="Thirty-day planning signal"
            subtitle="What the demand forecast implies for the next month"
          >
            <dl className="dl">
              <dt>Expected patient-days</dt>
              <dd>
                {fmtInt(planning.stock30)} patient-days across the next 30 days (
                {fmtInt(planning.stock30 / 30)} per day on average).
              </dd>
              <dt>Peak day in horizon</dt>
              <dd>
                {planning.peak
                  ? `${fmtInt(planning.peak.patients)} patients on ${fmtWeekday(planning.peak.date)}, ${fmtDate(planning.peak.date)} — plan coverage for this day first.`
                  : '—'}
              </dd>
              <dt>What this is not</dt>
              <dd>
                This is not a staffing, bed, or supply forecast. It is the patient-demand input you
                use for those decisions; the model predicts demand only.
              </dd>
            </dl>
          </Card>
        </>
      )}
    </div>
  )
}
