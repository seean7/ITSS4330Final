import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import type { UserRole } from '../types'

export default function LoginPage() {
  const { user, login, facilities } = useNetwork()
  const [role, setRole] = useState<UserRole>('intake_coordinator')
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '')
  const [name, setName] = useState('Jamie Chen')

  if (user) return <Navigate to="/" replace />

  const isCoordinator = role === 'intake_coordinator'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-harlow-mist py-10">
      <div className="w-full max-w-sm bg-white rounded-lg border border-black/10 shadow-sm p-6 space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-harlow-ink">Sign in</h1>
          <p className="text-sm text-harlow-ink/65 mt-1">Demo only. Production would use city single sign-on.</p>
        </div>

        <div>
          <label className="text-xs text-harlow-ink/70 block mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="w-full rounded-md border border-black/15 px-3 py-2 text-harlow-ink"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs text-harlow-ink/70 mb-2">Role</legend>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="role" checked={isCoordinator} onChange={() => setRole('intake_coordinator')} />
            Shelter intake coordinator
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="role" checked={!isCoordinator} onChange={() => setRole('qa_tester')} />
            QA / tester
          </label>
        </fieldset>

        {isCoordinator && (
          <div>
            <label className="text-xs text-harlow-ink/70 block mb-1" htmlFor="site">
              Your site
            </label>
            <select
              id="site"
              className="w-full rounded-md border border-black/15 px-3 py-2 bg-white text-harlow-ink"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.shortName}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          className="w-full py-2.5 rounded-md bg-harlow-accent text-white text-sm font-medium hover:opacity-95"
          onClick={() =>
            login({
              displayName: name.trim() || 'Staff',
              role,
              facilityId: isCoordinator ? facilityId : undefined,
            })
          }
        >
          Continue
        </button>
      </div>
    </div>
  )
}
