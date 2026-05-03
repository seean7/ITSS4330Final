/** Mock County Coordinated Entry System — resolves within SLA for QA. */

export type CesResult = { ok: true; acknowledgedAt: string; latencyMs: number } | { ok: false; error: string }

export function submitIntakeToCes(_payload: Record<string, unknown>): Promise<CesResult> {
  const latencyMs = 400 + Math.floor(Math.random() * 800)
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (Math.random() < 0.05) {
        resolve({ ok: false, error: 'County CES timeout (simulated)' })
      } else {
        resolve({
          ok: true,
          acknowledgedAt: new Date().toISOString(),
          latencyMs,
        })
      }
    }, latencyMs)
  })
}
