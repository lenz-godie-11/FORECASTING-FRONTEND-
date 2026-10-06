import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card.jsx'
import KpiStrip from '../components/KpiStrip.jsx'
import PageHead from '../components/PageHead.jsx'
import { EmptyState, ErrorState, LoadingRow } from '../components/StateViews.jsx'
import TrendChart from '../components/charts/TrendChart.jsx'
import WeekdayBars from '../components/charts/WeekdayBars.jsx'
import Histogram from '../components/charts/Histogram.jsx'
import WeeklyTotalsChart from '../components/charts/WeeklyTotalsChart.jsx'
import ModelCheckChart from '../components/charts/ModelCheckChart.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useSettings } from '../hooks/useSettings.js'
import { useData } from '../hooks/useData.js'
import { getRun, listRuns } from '../services/dataService.js'
import {
  histogram,
  movingAverage,
  modelCheck,
  peakObservedDay,
  variability,
  weekdayAverages,
  weeklyTotals,
} from '../utils/analytics.js'
import { normalizeRun, normalizeRunList } from '../utils/forecast.js'
import { fmtDate, fmtInt, fmtWeekday } from '../utils/format.js'

export default function Analytics() {
  const { token } = useAuth()
  const [settings] = useSettings()
  const source = settings.demo ? 'demo' : 'api'

  const { data: runs, loading: runsLoading, error: runsError, reload } = useData(
    (signal) => listRuns({ demoMode: settings.demo, token, signal }).then(normalizeRunList),
    `runs:${source}`,
  )

  const latestId = runs?.[0]?.id
  const earlierId = runs?.[1]?.id

  const { data: latestRun, loading: latestLoading, error: latestError, reload: reloadLatest } =
    useData(
      async (signal) => {
        if (!latestId) return null
        const raw = await getRun(latestId, { demoMode: settings.demo, token, signal })
        return normalizeRun(raw)
      },
      `run:${latestId ?? 'none'}:${source}`,
    )

  const { data: earlierRun, loading: earlierLoading } = useData(
    async (signal) => {
      if (!earlierId || !latestRun) return null
      const raw = await getRun(earlierId, { demoMode: settings.demo, token, signal })
      return normalizeRun(raw)
    },
    `run:${earlierId ?? 'none'}:${source}:${latestRun ? 'ready' : 'pending'}`,
  )

  const derived = useMemo(() => {
    const history = latestRun?.history ?? []
    if (!history.length) return null
    const weekday = weekdayAverages(history)
    const busiest = weekday.reduce((best, d) => (d.avg > (best?.avg ?? 0) ? d : best), null)
    const hist = histogram(history)
    const check = earlierRun ? modelCheck(earlierRun, history) : null
    return {
      history,
      weekday,
      busiest,
      movingAvg: movingAverage(history, 7),
      hist,
      weekly: weeklyTotals(history),
      cv: variability(history),
      peak: peakObservedDay(history),
      check,
      mean: hist.mean,
    }
  }, [latestRun, earlierRun])

  const loading = runsLoading || latestLoading || (earlierLoading && Boolean(earlierId))
  const error = runsError ?? latestError

  if (error && !loading) {
    return (
      <div className="page">
        <PageHead title="Analytics" description="Patterns in logged patient demand." />
        <ErrorState
          error={error}
          onRetry={() => {
            reload()
            reloadLatest()
          }}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHead
        title="Analytics"
        description="Patterns in logged patient demand, computed from the observations reported by the API. Every figure below comes from facility data."
      />

      {loading ? (
        <>
          <KpiStrip
            loading
            cells={[
              { label: 'Average daily demand', value: '', sub: '' },
              { label: 'Peak observed day', value: '', sub: '' },
              { label: 'Busiest weekday', value: '', sub: '' },
              { label: 'Daily variability', value: '', sub: '' },
            ]}
          />
          <LoadingRow label="Computing demand analytics…" />
        </>
      ) : !derived ? (
        <EmptyState
          icon="analytics"
          title="No observations to analyse yet"
          text="Analytics are computed from logged patient observations. Log daily patient counts from the dashboard and this page will show seasonality, trend, and distribution."
          actions={
            <Link to="/" className="btn btn--tertiary">
              Log observations
            </Link>
          }
        />
      ) : (
        <>
          <KpiStrip
            cells={[
              {
                label: 'Average daily demand',
                value: fmtInt(derived.mean),
                unit: 'patients',
                sub: `across ${derived.history.length} observed days`,
              },
              {
                label: 'Peak observed day',
                value: fmtInt(derived.peak?.patients),
                unit: 'patients',
                sub: derived.peak
                  ? `${fmtWeekday(derived.peak.date)}, ${fmtDate(derived.peak.date)}`
                  : '—',
              },
              {
                label: 'Busiest weekday',
                value: derived.busiest?.label ?? '—',
                sub: derived.busiest ? `avg ${fmtInt(derived.busiest.avg)} patients/day` : '—',
              },
              {
                label: 'Daily variability',
                value: derived.cv != null ? `±${Math.round(derived.cv * 100)}%` : '—',
                sub: 'standard deviation relative to the daily mean',
              },
            ]}
          />

          <div className="grid-2">
            <Card
              title="Weekly seasonality"
              subtitle="Average daily patients by weekday"
              foot="The production model uses period = 7, i.e. weekly seasonality. This chart shows which weekdays the logged demand actually loads hardest."
            >
              <WeekdayBars data={derived.weekday} />
            </Card>

            <Card
              title="Demand trend"
              subtitle="Daily observations against the 7-day moving average"
              foot="The moving average smooths the weekly cycle, making the underlying direction of demand visible — the signal to plan for."
            >
              <TrendChart observed={derived.history} movingAverage={derived.movingAvg} />
            </Card>

            <Card
              title="Daily demand distribution"
              subtitle="How often each patient-count range occurred"
              foot={`Mean ${fmtInt(derived.hist.mean)} · median ${fmtInt(derived.hist.median)} · 90th percentile ${fmtInt(derived.hist.p90)} patients.`}
            >
              <Histogram bins={derived.hist.bins} mean={derived.hist.mean} median={derived.hist.median} />
            </Card>

            <Card
              title="Weekly totals"
              subtitle="Patient demand per ISO week"
              foot="A rising week-over-week trend is when capacity planning should start, before demand arrives."
            >
              <WeeklyTotalsChart data={derived.weekly} />
            </Card>
          </div>

          {derived.check ? (
            <Card
              title="Forecast accuracy check"
              subtitle={`What an earlier run predicted for ${derived.check.days} days that have since been observed`}
              foot={`Mean absolute error: ${fmtInt(derived.check.mae)} patients per day. A rising MAE means the model needs review before the forecast is trusted for planning.`}
            >
              <ModelCheckChart observed={derived.check.observed} predicted={derived.check.predicted} />
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
