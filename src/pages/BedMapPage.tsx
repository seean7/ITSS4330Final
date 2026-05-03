import { useMemo, useState } from 'react'
import { useNetwork } from '../context/NetworkContext'
import { facilityUtilization } from '../lib/rules'
import type { Facility, GenderDesignation } from '../types'

function utilizationColor(u: number) {
  if (u >= 0.95) return 'bg-harlow-danger text-white'
  if (u >= 0.85) return 'bg-harlow-warn text-white'
  if (u >= 0.6) return 'bg-amber-400 text-harlow-ink'
  return 'bg-harlow-accent/90 text-white'
}

const GENDER_FILTER: { id: GenderDesignation | 'any'; label: string }[] = [
  { id: 'any', label: 'Any designation' },
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'nonbinary_centered', label: 'Non-binary centered' },
  { id: 'youth', label: 'Youth' },
  { id: 'all_gender', label: 'All-gender' },
]

export default function BedMapPage() {
  const { facilities, lastNetworkRefresh, mapFreshnessMs, dischargeOneBed } = useNetwork()
  const [gender, setGender] = useState<GenderDesignation | 'any'>('any')
  const [pet, setPet] = useState<'any' | 'yes'>('any')
  const [ada, setAda] = useState('')
  const [type, setType] = useState<'all' | 'emergency_shelter' | 'transitional'>('all')

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      if (type !== 'all' && f.type !== type) return false
      if (pet === 'yes' && !f.petFriendly) return false
      if (gender !== 'any' && !f.genderDesignations.includes(gender)) return false
      if (ada.trim() && !f.accessibility.some((x) => x.toLowerCase().includes(ada.toLowerCase()))) return false
      return true
    })
  }, [facilities, gender, pet, ada, type])

  const freshSec = Math.max(0, Math.round((Date.now() - lastNetworkRefresh) / 1000))
  const freshOk = freshSec * 1000 <= mapFreshnessMs

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap gap-4 justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-harlow-ink">Open beds</h1>
          <p className="text-sm text-harlow-ink/65 mt-1 max-w-2xl">
            Demo map and filters (program, pets, accessibility). Updates when intakes or discharges save.
          </p>
        </div>
        <div
          className={`text-sm px-3 py-2 rounded-lg border ${freshOk ? 'border-harlow-accent/40 bg-harlow-accent/10' : 'border-harlow-warn/50 bg-harlow-warn/10'}`}
          role="status"
        >
          <p className="font-medium text-harlow-ink">Last update</p>
          <p className="text-harlow-ink/80 text-xs">
            {freshSec}s ago · target &lt; {mapFreshnessMs / 1000}s
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 items-end bg-white border border-black/10 rounded-xl p-4 shadow-sm">
        <div>
          <label className="text-xs font-medium text-harlow-ink/70 block mb-1" htmlFor="ftype">
            Program type
          </label>
          <select
            id="ftype"
            className="rounded-lg border border-black/15 px-2 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <option value="all">All</option>
            <option value="emergency_shelter">Emergency shelter</option>
            <option value="transitional">Transitional</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-harlow-ink/70 block mb-1" htmlFor="gender">
            Gender program
          </label>
          <select
            id="gender"
            className="rounded-lg border border-black/15 px-2 py-2 text-sm"
            value={gender}
            onChange={(e) => setGender(e.target.value as GenderDesignation | 'any')}
          >
            {GENDER_FILTER.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={pet === 'yes'} onChange={(e) => setPet(e.target.checked ? 'yes' : 'any')} />
          Pet-friendly only
        </label>
        <div>
          <label className="text-xs font-medium text-harlow-ink/70 block mb-1" htmlFor="ada">
            Accessibility contains
          </label>
          <input
            id="ada"
            className="rounded-lg border border-black/15 px-2 py-2 text-sm w-40"
            placeholder="e.g. wheelchair"
            value={ada}
            onChange={(e) => setAda(e.target.value)}
          />
        </div>
      </div>

      <div
        className="relative rounded-2xl border-2 border-harlow-slate/20 bg-gradient-to-br from-sky-100/80 via-harlow-mist to-emerald-50/60 min-h-[420px] overflow-hidden shadow-inner"
        aria-label="Schematic network map"
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,#2d7a6e33,transparent_40%),radial-gradient(circle_at_80%_70%,#1a233233,transparent_35%)]" />
        <p className="absolute top-3 left-3 text-xs font-medium text-harlow-ink/60 z-10">
          {filtered.length} sites match filters · click a node for capacity detail
        </p>
        {filtered.map((f) => (
          <MapNode key={f.id} facility={f} onDemoDischarge={() => dischargeOneBed(f.id)} />
        ))}
      </div>

      <section className="rounded-xl bg-white border border-black/10 overflow-hidden shadow-sm">
        <h2 className="sr-only">Tabular availability</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-harlow-slate text-white text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Site</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Occupied</th>
                <th className="px-3 py-2 font-medium">Licensed</th>
                <th className="px-3 py-2 font-medium">Open</th>
                <th className="px-3 py-2 font-medium">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const u = facilityUtilization(f)
                const open = Math.max(0, f.licensedBeds - f.occupiedBeds)
                return (
                  <tr key={f.id} className="border-t border-black/10">
                    <td className="px-3 py-2 font-medium">{f.shortName}</td>
                    <td className="px-3 py-2 capitalize">{f.type.replaceAll('_', ' ')}</td>
                    <td className="px-3 py-2">{f.occupiedBeds}</td>
                    <td className="px-3 py-2">{f.licensedBeds}</td>
                    <td className="px-3 py-2">{open}</td>
                    <td className="px-3 py-2">{(u * 100).toFixed(0)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MapNode({ facility: f, onDemoDischarge }: { facility: Facility; onDemoDischarge: () => void }) {
  const [open, setOpen] = useState(false)
  const u = facilityUtilization(f)
  const openBeds = Math.max(0, f.licensedBeds - f.occupiedBeds)
  return (
    <div className="absolute z-20" style={{ left: `${f.mapX}%`, top: `${f.mapY}%`, transform: 'translate(-50%, -50%)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full shadow-lg border-2 border-white text-xs font-bold ${utilizationColor(u)}`}
        aria-expanded={open}
        aria-label={`${f.shortName}, ${(u * 100).toFixed(0)} percent full`}
      >
        {f.shortName.slice(0, 2).toUpperCase()}
      </button>
      {open && (
        <div className="absolute left-1/2 top-full mt-2 w-56 -translate-x-1/2 rounded-lg border border-black/15 bg-white p-3 text-xs shadow-xl z-30 text-left">
          <p className="font-semibold text-harlow-ink">{f.name}</p>
          <p className="text-harlow-ink/70 mt-1">
            {f.occupiedBeds} / {f.licensedBeds} beds · {openBeds} open
          </p>
          <p className="mt-1 text-harlow-ink/70">Pets: {f.petFriendly ? 'yes' : 'no'}</p>
          <p className="text-harlow-ink/70 text-[11px] mt-1">{f.accessibility.join(', ')}</p>
          <button
            type="button"
            className="mt-2 w-full py-1.5 rounded bg-harlow-slate/10 text-harlow-ink text-[11px] font-medium hover:bg-harlow-slate/15"
            onClick={(e) => {
              e.stopPropagation()
              onDemoDischarge()
            }}
          >
            Demo: discharge one bed
          </button>
        </div>
      )}
    </div>
  )
}
