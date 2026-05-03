import { Link } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import { facilityUtilization } from '../lib/rules'
import { ROUTES } from '../lib/access'

export default function DashboardPage() {
  const { facilities, user, lastNetworkRefresh, mapFreshnessMs } = useNetwork()
  const openBeds = facilities.reduce((s, f) => s + Math.max(0, f.licensedBeds - f.occupiedBeds), 0)
  const urgent = facilities.filter((f) => facilityUtilization(f) >= 0.9).length
  const freshSec = Math.max(0, Math.round((Date.now() - lastNetworkRefresh) / 1000))
  const site = facilities.find((f) => f.id === user?.facilityId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-harlow-ink">Home</h1>
        <p className="text-sm text-harlow-ink/65 mt-1">
          {user?.role === 'qa_tester'
            ? 'Same screens as intake, plus QA checks in the nav.'
            : `Hi ${user?.displayName}. ${site ? `Desk: ${site.shortName}.` : ''} Check the map before turning anyone away.`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-white rounded-lg border border-black/10 p-4">
          <p className="text-xs text-harlow-ink/60">Open beds (demo)</p>
          <p className="text-2xl font-semibold text-harlow-accent">{openBeds}</p>
        </div>
        <div className="bg-white rounded-lg border border-black/10 p-4">
          <p className="text-xs text-harlow-ink/60">Sites ≥ 90% full</p>
          <p className="text-2xl font-semibold text-harlow-warn">{urgent}</p>
        </div>
        <div className="bg-white rounded-lg border border-black/10 p-4">
          <p className="text-xs text-harlow-ink/60">Last update</p>
          <p className="text-2xl font-semibold text-harlow-ink">{freshSec}s</p>
          <p className="text-[11px] text-harlow-ink/55 mt-1">Goal &lt; {mapFreshnessMs / 1000}s after a save</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          to={ROUTES.map}
          className="flex-1 text-center py-3 rounded-lg bg-harlow-accent text-white text-sm font-medium"
        >
          Open bed map
        </Link>
        <Link
          to={ROUTES.intake}
          className="flex-1 text-center py-3 rounded-lg bg-harlow-slate text-white text-sm font-medium"
        >
          New intake
        </Link>
        <Link
          to={ROUTES.clients}
          className="flex-1 text-center py-3 rounded-lg border border-black/15 bg-white text-sm font-medium text-harlow-ink"
        >
          Find guest
        </Link>
      </div>
    </div>
  )
}
