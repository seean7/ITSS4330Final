import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import { ROUTES } from '../lib/access'

export default function ClientListPage() {
  const { clients, facilities } = useNetwork()
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return clients.filter((c) => {
      if (!s) return true
      return (
        c.legalFirst.toLowerCase().includes(s) ||
        c.legalLast.toLowerCase().includes(s) ||
        c.preferredName.toLowerCase().includes(s) ||
        c.id.toLowerCase().includes(s)
      )
    })
  }, [clients, q])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-harlow-ink">Find a guest</h1>
        <p className="text-harlow-ink/70 mt-1">
          Search by name before you re-enter details. Full cross-site history opens on the guest&apos;s page (demo
          data).
        </p>
      </div>
      <div>
        <label className="sr-only" htmlFor="search">
          Search clients
        </label>
        <input
          id="search"
          className="w-full max-w-md rounded-lg border border-black/15 px-3 py-2"
          placeholder="Search name or ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
        {rows.map((c) => {
          const lastStay = c.stays[c.stays.length - 1]
          const fac = facilities.find((f) => f.id === lastStay?.facilityId)
          return (
            <li key={c.id}>
              <Link
                to={ROUTES.client(c.id)}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-harlow-mist/50"
              >
                <div>
                  <p className="font-medium text-harlow-ink">
                    {c.preferredName} {c.legalLast}{' '}
                    <span className="text-harlow-ink/60 font-normal text-sm">({c.legalFirst})</span>
                  </p>
                  <p className="text-xs text-harlow-ink/65">
                    Last activity: {fac?.shortName ?? '—'} · {c.stays.length} stays on record
                    {c.activelyHoused && ' · Actively housed (eligibility paused)'}
                    {c.facilityBan && ' · Ban flag'}
                  </p>
                </div>
                <span className="text-harlow-accent text-sm font-medium">View →</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
