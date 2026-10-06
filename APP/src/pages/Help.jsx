import Card from '../components/Card.jsx'
import PageHead from '../components/PageHead.jsx'

export default function Help() {
  return (
    <div className="page">
      <PageHead
        title="Help"
        description="How AfyaFlow works, how to read the charts, and the terms used across the console."
      />

      <div className="help-cols">
        <div className="dash-rail">
          <Card title="How AfyaFlow works" subtitle="From daily counts to a 90-day plan">
            <ol className="steps">
              <li>
                <strong>Log daily patient demand</strong>
                <p>
                  Each day, record the facility&rsquo;s patient count with its source
                  (hospital system, ER records, manual entry). Observations are posted to the
                  backend through the dashboard form.
                </p>
              </li>
              <li>
                <strong>The backend forecasts demand</strong>
                <p>
                  A forecast run applies ThetaModel with weekly seasonality (period 7) to the
                  logged history and produces 90 daily predictions. Runs are listed on the
                  Forecasts page.
                </p>
              </li>
              <li>
                <strong>Plan against the forecast</strong>
                <p>
                  The dashboard, alerts, and resource planning pages turn those predictions into
                  decisions: expected peaks, high-demand periods, and demand-vs-capacity checks.
                </p>
              </li>
            </ol>
          </Card>

          <Card title="Reading the demand chart" subtitle="The dashboard&rsquo;s core view">
            <dl className="dl">
              <dt>Grey line</dt>
              <dd>Observed demand — the days your facility actually logged.</dd>
              <dt>Blue line</dt>
              <dd>
                Predicted demand — the model&rsquo;s daily forecast for the 90-day horizon.
              </dd>
              <dt>Dashed vertical line</dt>
              <dd>Today — or the forecast start if the run predates today.</dd>
              <dt>Shaded area</dt>
              <dd>The forecast horizon, where every value is a prediction, not an observation.</dd>
            </dl>
          </Card>

          <Card title="What AfyaFlow does not do" subtitle="Scope, stated plainly">
            <dl className="dl">
              <dt>No resource forecasting</dt>
              <dd>
                The model predicts patient demand only. It does not forecast nurses, beds, or
                medicines. Resource planning compares demand against capacity figures you enter.
              </dd>
              <dt>No silent data</dt>
              <dd>
                Every number on screen comes from the API (or the clearly-labelled demo data set).
                Failed calls show an error state, never invented data.
              </dd>
            </dl>
          </Card>
        </div>

        <div className="dash-rail">
          <Card title="Glossary" subtitle="Terms used across the console">
            <dl className="dl">
              <dt>Patient demand</dt>
              <dd>Daily patient encounters at the facility — the quantity the model forecasts.</dd>
              <dt>ThetaModel</dt>
              <dd>
                The current production forecasting model. It handles trend, weekly seasonality,
                and occasional zero or sparse observations.
              </dd>
              <dt>Period (7)</dt>
              <dd>Weekly seasonality: the model repeats a 7-day weekday pattern in the forecast.</dd>
              <dt>Forecast horizon</dt>
              <dd>How far ahead a run predicts — 90 daily predictions.</dd>
              <dt>Forecast run</dt>
              <dd>
                One execution of the model over the logged history, with a timestamp and its own
                set of predictions.
              </dd>
              <dt>Observed vs predicted</dt>
              <dd>
                Observed values are logged reality; predicted values are model output. The two are
                always visually separated.
              </dd>
              <dt>High-demand alert</dt>
              <dd>
                A forecast day or stretch of days at or above the configured thresholds, shown on
                the dashboard and the Alerts page.
              </dd>
            </dl>
          </Card>

          <Card title="Frequently asked" subtitle="Short answers">
            <details className="faq-item">
              <summary>Why is the horizon 90 days?</summary>
              <div className="faq-item__body">
                The production model is configured for a 90-day horizon. That window covers
                monthly and seasonal planning cycles (ordering, rosters, seasonal surges) without
                degrading prediction quality.
              </div>
            </details>
            <details className="faq-item">
              <summary>Does the forecast tell me how many nurses to schedule?</summary>
              <div className="faq-item__body">
                No. It tells you how many patients to expect. Use the Resource planning page to
                compare that demand against your own capacity figures — the comparison is decision
                support, not a model output.
              </div>
            </details>
            <details className="faq-item">
              <summary>Where does the data come from?</summary>
              <div className="faq-item__body">
                The Django REST API. The frontend never reads the database or calls the model
                directly: sign-in, observations, and forecasts all go through
                <code> /api/v1/…</code> endpoints.
              </div>
            </details>
            <details className="faq-item">
              <summary>What happens when the API is unreachable?</summary>
              <div className="faq-item__body">
                Pages show an error state with the reason and a retry control. Nothing is replaced
                with fake data. For demos without a backend, enable demo mode at sign-in — it is
                clearly labelled wherever it appears.
              </div>
            </details>
            <details className="faq-item">
              <summary>Are alert thresholds configurable?</summary>
              <div className="faq-item__body">
                Yes — on the Alerts page and in Settings. Thresholds are structured as serialisable
                rules so the same logic can move to backend business logic later.
              </div>
            </details>
          </Card>

          <Card title="Support" subtitle="When something looks wrong">
            <dl className="dl">
              <dt>Data looks wrong</dt>
              <dd>
                Check the run&rsquo;s history range on the Forecasts page, then log a corrected
                observation and trigger a new run.
              </dd>
              <dt>Sign-in keeps failing</dt>
              <dd>
                Confirm your account exists on the backend and that the API base URL in
                <code> .env</code> is reachable.
              </dd>
              <dt>Facility administrator</dt>
              <dd>
                Contact the operations team that maintains the Django backend and the forecasting
                model.
              </dd>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}
