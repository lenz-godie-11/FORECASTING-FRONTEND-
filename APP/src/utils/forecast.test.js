import { describe, it, expect } from 'vitest'
import { normalizeRun, normalizeRunList } from './forecast.js'

describe('forecast normalization', () => {
  it('normalizes GET latest forecast response {success, run, points}', () => {
    const raw = {
      success: true,
      run: {
        id: 123,
        model: 'ThetaModel',
        period: 7,
        horizon: 90,
        history_start: '2023-01-01',
        history_end: '2023-03-31',
        created_at: '2023-04-01T00:00:00Z',
        status: 'completed',
      },
      points: [
        { date: '2023-04-01', predicted_patients: 100.5 },
        { date: '2023-04-02', predicted_patients: 110.0 },
      ],
      history: [
        { date: '2023-03-30', patients: 95 },
        { date: '2023-03-31', patients: 98 },
      ],
    }

    const result = normalizeRun(raw)
    expect(result).toBeTruthy()
    expect(result.id).toBe('123')
    expect(result.model).toBe('ThetaModel')
    expect(result.predictions).toEqual([
      { date: '2023-04-01', patients: 100.5 },
      { date: '2023-04-02', patients: 110 },
    ])
    expect(result.history).toEqual([
      { date: '2023-03-30', patients: 95 },
      { date: '2023-03-31', patients: 98 },
    ])
  })

  it('normalizes GET forecast by ID response {success, run, points}', () => {
    const raw = {
      success: true,
      run: {
        id: '456',
        model: 'ThetaModel',
        period: 7,
        horizon: 90,
        created_at: '2023-04-01T00:00:00Z',
      },
      points: [
        { date: '2023-04-01', predicted_patients: 100 },
        { date: '2023-04-02', predicted_patients: 110 },
      ],
    }

    const result = normalizeRun(raw)
    expect(result.id).toBe('456')
    expect(result.predictions.length).toBe(2)
    expect(result.predictions[0]).toEqual({ date: '2023-04-01', patients: 100 })
  })

  it('normalizes POST forecast generation response {success, model, period, horizon, run_id, forecast}', () => {
    const raw = {
      success: true,
      model: 'ThetaModel',
      period: 7,
      horizon: 90,
      run_id: 789,
      history_start: '2023-01-01',
      history_end: '2023-03-31',
      forecast: [
        { date: '2023-04-01', patients: 120 },
        { date: '2023-04-02', patients: 130 },
      ],
    }

    const result = normalizeRun(raw)
    expect(result).toBeTruthy()
    expect(result.id).toBe('789')
    expect(result.predictions).toEqual([
      { date: '2023-04-01', patients: 120 },
      { date: '2023-04-02', patients: 130 },
    ])
    expect(result.model).toBe('ThetaModel')
    expect(result.period).toBe(7)
    expect(result.horizon).toBe(90)
  })

  it('normalizeRunList handles list of runs', () => {
    const raw = [
      {
        id: 1,
        created_at: '2023-04-02T00:00:00Z',
        predictions: [{ date: '2023-04-10', patients: 100 }],
      },
      {
        id: 2,
        created_at: '2023-04-01T00:00:00Z',
        predictions: [{ date: '2023-04-09', patients: 90 }],
      },
    ]

    const result = normalizeRunList(raw)
    expect(result.length).toBe(2)
    // sorted by createdAt desc
    expect(result[0].id).toBe('1')
    expect(result[1].id).toBe('2')
  })

  it('normalizeRunList handles GET /api/v1/forecast/ envelope with run and points', () => {
    const raw = {
      success: true,
      run: {
        id: 123,
        created_at: '2023-04-01T00:00:00Z',
      },
      points: [{ date: '2023-04-01', predicted_patients: 100.5 }],
    }

    const result = normalizeRunList(raw)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('123')
    expect(result[0].predictions[0]).toEqual({ date: '2023-04-01', patients: 100.5 })
  })
})
