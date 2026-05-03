import { useMemo, useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import { ROUTES } from '../lib/access'
import {
  canClosePlacementSuccess,
  findDuplicateClient,
  hasValidIdentifier,
  wouldExceedCapacity,
} from '../lib/rules'

export default function QAPage() {
  const {
    roleMay,
    clients,
    facilities,
    lastNetworkRefresh,
    mapFreshnessMs,
    cesLog,
    emergencyOverflow,
    setEmergencyOverflow,
    exportHmisCsv,
  } = useNetwork()
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (!roleMay(['qa_tester'])) {
    return <Navigate to={ROUTES.home} replace />
  }

  const dup = findDuplicateClient(clients, 'Jordan', 'Ellis', '1988-04-12', '4421')
  const idFail = !hasValidIdentifier({ govIdOnFile: false, selfReportedAlias: false, biometricWaiver: false })
  const idPass = hasValidIdentifier({ govIdOnFile: true, selfReportedAlias: false, biometricWaiver: false })
  const placementBad = canClosePlacementSuccess({ moveInDate: '', destinationAddress: '' })
  const placementGood = canClosePlacementSuccess({
    moveInDate: '2026-01-01',
    destinationAddress: '123 Main',
  })
  const sample = facilities[0]
  const synthetic =
    sample &&
    ({
      ...sample,
      licensedBeds: 100,
      occupiedBeds: 100,
    } as (typeof facilities)[0])
  const overflowHit = synthetic ? wouldExceedCapacity(synthetic, 101, false) : false
  const maxEmergency = synthetic ? Math.floor(synthetic.licensedBeds * 1.1) : 0
  const overflowOk = Boolean(
    synthetic &&
      !wouldExceedCapacity(synthetic, maxEmergency, true) &&
      wouldExceedCapacity(synthetic, maxEmergency + 1, true),
  )

  const mapFreshSec = Math.max(0, Math.round((Date.now() - lastNetworkRefresh) / 1000))
  const cesRows = useMemo(() => [...cesLog].reverse().slice(0, 8), [cesLog])

  function downloadHmis() {
    const blob = new Blob([exportHmisCsv()], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `harlow-pit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-harlow-ink">QA</h1>
        <p className="text-sm text-harlow-ink/65 mt-1">Rule checks and demo tools.</p>
      </div>

      <section className="bg-white rounded-lg border border-black/10 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-harlow-ink">Demo tools</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={emergencyOverflow} onChange={(e) => setEmergencyOverflow(e.target.checked)} />
          Emergency overflow (110% bed cap)
        </label>
        <button
          type="button"
          onClick={downloadHmis}
          className="px-3 py-1.5 rounded-md bg-harlow-slate text-white text-sm"
        >
          Download census CSV (sample)
        </button>
      </section>

      <section className="bg-white rounded-lg border border-black/10 p-4 overflow-x-auto">
        <h2 className="text-sm font-semibold text-harlow-ink mb-2">County CES (last submissions)</h2>
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-harlow-ink/60 border-b border-black/10">
              <th className="py-1 pr-2">Client</th>
              <th className="py-1 pr-2">Status</th>
              <th className="py-1">Latency</th>
            </tr>
          </thead>
          <tbody>
            {cesRows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-2 text-harlow-ink/50">
                  Run an intake to populate.
                </td>
              </tr>
            ) : (
              cesRows.map((row) => (
                <tr key={row.id} className="border-b border-black/5">
                  <td className="py-1 pr-2 font-mono">{row.clientId}</td>
                  <td className="py-1 pr-2">{row.status}</td>
                  <td className="py-1">{row.latencyMs != null ? `${row.latencyMs} ms` : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Check title="Duplicate (name + DOB + SSN-4)" pass={!!dup} detail={dup ? `Match: ${dup.id}` : 'No seed'} />
        <Check title="Identifiers all off" pass={idFail} detail="Intake blocked" />
        <Check title="Gov ID on file" pass={idPass} detail="Allows save" />
        <Check title="Placement needs date + address" pass={!placementBad && placementGood} detail="Closure rule" />
        <Check title="100% cap (overflow off)" pass={overflowHit} detail="Full site blocks +1" />
        <Check
          title="110% cap (overflow on)"
          pass={emergencyOverflow ? overflowOk : true}
          detail={emergencyOverflow ? 'Cap math OK' : 'Enable overflow above to test'}
        />
        <Check
          title="Map freshness"
          pass={mapFreshSec * 1000 <= mapFreshnessMs}
          detail={`${mapFreshSec}s since last save`}
        />
        <Check
          title="CES ack has latency"
          pass={cesRows.every((r) => r.status !== 'ack' || r.latencyMs != null)}
          detail="After intake"
        />
      </div>
    </div>
  )
}

function Check({ title, pass, detail }: { title: string; pass: boolean; detail: string }) {
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${pass ? 'border-harlow-accent/40 bg-harlow-accent/5' : 'border-harlow-danger/30 bg-red-50/50'}`}
    >
      <p className="font-medium text-harlow-ink">{title}</p>
      <p className="text-harlow-ink/65 text-xs mt-1">{detail}</p>
      <p className={`text-xs font-medium mt-2 ${pass ? 'text-harlow-accent' : 'text-harlow-danger'}`}>
        {pass ? 'Pass' : 'Review'}
      </p>
    </div>
  )
}
