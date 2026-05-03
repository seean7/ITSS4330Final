import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import { canViewDocuments, documentSensitivityOk, ROUTES } from '../lib/access'
import { countStaysLast90Days } from '../lib/rules'

export default function ClientDetailPage() {
  const { id } = useParams()
  const {
    clients,
    facilities,
    user,
    setClientHoused,
    addClientTask,
    toggleTask,
    updatePlacement,
    addDocument,
    simulateBanIntakeAttempt,
  } = useNetwork()
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [placementErr, setPlacementErr] = useState<string | null>(null)
  const [docLabel, setDocLabel] = useState('')

  const client = clients.find((c) => c.id === id)

  const history = useMemo(() => {
    if (!client) return []
    return [...client.stays].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
  }, [client])

  if (!client) {
    return (
      <p className="text-harlow-ink">
        Client not found. <Link to={ROUTES.clients}>Back to list</Link>
      </p>
    )
  }

  const isQa = user?.role === 'qa_tester'
  const showDocs = canViewDocuments(user?.role)
  const stays90 = countStaysLast90Days(client.stays)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 justify-between items-start">
        <div>
          <p className="text-sm text-harlow-accent font-medium">
            <Link to={ROUTES.clients}>Guests</Link> / {client.id}
          </p>
          <h1 className="text-3xl font-bold text-harlow-ink mt-1">
            {client.preferredName} <span className="text-harlow-ink/70 font-normal">{client.legalLast}</span>
          </h1>
          <p className="text-harlow-ink/70 mt-1">
            Legal name {client.legalFirst} {client.legalLast} · DOB {client.dateOfBirth} · Gender identity:{' '}
            {client.genderIdentity}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {client.facilityBan && (
            <span className="px-2 py-1 rounded-md bg-harlow-danger/15 text-harlow-danger text-sm font-medium">
              Facility ban flag
            </span>
          )}
          {client.activelyHoused && (
            <span className="px-2 py-1 rounded-md bg-harlow-accent/15 text-harlow-accent text-sm font-medium">
              Actively housed — shelter eligibility paused
            </span>
          )}
        </div>
      </div>

      {client.facilityBan && client.banNotes && (
        <div className="rounded-xl border border-harlow-warn/40 bg-harlow-warn/10 p-4 text-sm text-harlow-ink">
          <p className="font-semibold text-harlow-warn">Ban review</p>
          <p className="mt-1">{client.banNotes}</p>
          <p className="mt-2 text-xs text-harlow-ink/70">Demo: fire a network alert as if this guest showed up at a site.</p>
          {isQa && (
            <button
              type="button"
              className="mt-3 px-3 py-2 rounded-lg bg-harlow-slate text-white text-sm"
              onClick={() => simulateBanIntakeAttempt(client.id, user?.facilityId ?? facilities[0].id)}
            >
              Simulate intake attempt
            </button>
          )}
        </div>
      )}

      <section className="rounded-xl bg-white border border-black/10 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-lg">Housing &amp; eligibility</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={client.activelyHoused}
            disabled={!isQa}
            onChange={(e) =>
              setClientHoused(client.id, e.target.checked, e.target.checked ? 'Documented housing exit' : undefined)
            }
          />
          Mark as actively housed (pauses shelter eligibility in reporting)
        </label>
        {client.activelyHoused && client.housedPausedReason && (
          <p className="text-sm text-harlow-ink/70">{client.housedPausedReason}</p>
        )}
        <p className="text-sm">
          <span className="font-medium">Shelter stays (90-day window):</span> {stays90}
          {stays90 > 8 && (
            <span className="ml-2 text-harlow-warn font-medium">— Above city review threshold (8 / 90d)</span>
          )}
        </p>
      </section>

      <section className="rounded-xl bg-white border border-black/10 p-5 shadow-sm">
        <h2 className="font-semibold text-lg mb-3">Service history across facilities</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-harlow-ink/70 border-b border-black/10">
                <th className="py-2 pr-4">Facility</th>
                <th className="py-2 pr-4">Check-in</th>
                <th className="py-2">Check-out</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s) => {
                const f = facilities.find((x) => x.id === s.facilityId)
                return (
                  <tr key={s.id} className="border-b border-black/5">
                    <td className="py-2 pr-4 font-medium">{f?.shortName ?? s.facilityId}</td>
                    <td className="py-2 pr-4">{new Date(s.checkIn).toLocaleString()}</td>
                    <td className="py-2">{s.checkOut ? new Date(s.checkOut).toLocaleString() : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white border border-black/10 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-lg">Collaborative case tasks</h2>
        <ul className="space-y-2">
          {client.tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={t.done}
                disabled={!isQa}
                onChange={() => toggleTask(client.id, t.id)}
              />
              <span className={t.done ? 'line-through text-harlow-ink/50' : ''}>{t.title}</span>
              <span className="text-harlow-ink/60">— {t.assignee}</span>
            </li>
          ))}
        </ul>
        {isQa && (
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-harlow-ink/70 block" htmlFor="t1">
                Task
              </label>
              <input
                id="t1"
                className="rounded-lg border border-black/15 px-2 py-1.5"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-harlow-ink/70 block" htmlFor="t2">
                Assignee
              </label>
              <input
                id="t2"
                className="rounded-lg border border-black/15 px-2 py-1.5"
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-harlow-accent text-white text-sm"
              onClick={() => {
                if (!taskTitle.trim()) return
                addClientTask(client.id, taskTitle.trim(), taskAssignee.trim() || 'Unassigned')
                setTaskTitle('')
                setTaskAssignee('')
              }}
            >
              Add task
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white border border-black/10 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-lg">Housing placements &amp; outcomes</h2>
        {placementErr && (
          <p className="text-sm text-harlow-danger" role="alert">
            {placementErr}
          </p>
        )}
        {client.placements.map((p) => (
          <div key={p.id} className="border border-black/10 rounded-lg p-3 text-sm space-y-2">
            <p className="font-medium capitalize">Status: {p.status}</p>
            {isQa && (
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-harlow-ink/70">Move-in date</label>
                  <input
                    type="date"
                    className="w-full rounded border border-black/15 px-2 py-1"
                    value={p.moveInDate ?? ''}
                    onChange={(e) => {
                      setPlacementErr(null)
                      updatePlacement(client.id, p.id, { moveInDate: e.target.value })
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-harlow-ink/70">Destination address</label>
                  <input
                    className="w-full rounded border border-black/15 px-2 py-1"
                    value={p.destinationAddress ?? ''}
                    onChange={(e) => {
                      setPlacementErr(null)
                      updatePlacement(client.id, p.id, { destinationAddress: e.target.value })
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-harlow-ink/70">Mark outcome</label>
                  <select
                    className="w-full rounded border border-black/15 px-2 py-1 mt-0.5"
                    value={p.status}
                    onChange={(e) => {
                      setPlacementErr(null)
                      const res = updatePlacement(client.id, p.id, {
                        status: e.target.value as typeof p.status,
                      })
                      if (!res.ok) setPlacementErr(res.error ?? null)
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="successful">Successful</option>
                    <option value="unsuccessful">Unsuccessful</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="rounded-xl bg-white border border-black/10 p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-lg">Documents</h2>
        {!showDocs && (
          <p className="text-sm text-harlow-ink/70">Attachments are only visible when signed in as QA / tester.</p>
        )}
        {showDocs && (
          <>
            <ul className="text-sm space-y-1">
              {client.documents.map((d) => {
                const ok = documentSensitivityOk(user?.role, d.sensitivity)
                return (
                  <li key={d.id} className="flex justify-between gap-2 border-b border-black/5 py-1">
                    <span>
                      {d.label}{' '}
                      <span className="text-harlow-ink/60">({d.sensitivity.replaceAll('_', ' ')})</span>
                    </span>
                    {!ok ? (
                      <span className="text-harlow-warn text-xs">Restricted</span>
                    ) : (
                      <span className="text-harlow-ink/60 text-xs">{new Date(d.uploadedAt).toLocaleDateString()}</span>
                    )}
                  </li>
                )
              })}
            </ul>
            {isQa && (
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="text-xs text-harlow-ink/70 block" htmlFor="doc">
                    Label
                  </label>
                  <input
                    id="doc"
                    className="rounded-lg border border-black/15 px-2 py-1.5"
                    value={docLabel}
                    onChange={(e) => setDocLabel(e.target.value)}
                    placeholder="Lease, ID copy, benefit letter…"
                  />
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-harlow-slate text-white text-sm"
                  onClick={() => {
                    if (!docLabel.trim()) return
                    addDocument(client.id, docLabel.trim(), 'case_manager_and_above')
                    setDocLabel('')
                  }}
                >
                  Attach (demo)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
