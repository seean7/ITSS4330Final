import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import { findDuplicateClient, hasValidIdentifier } from '../lib/rules'
import { ROUTES } from '../lib/access'

export default function IntakePage() {
  const { user, facilities, clients, recordIntake, roleMay } = useNetwork()
  const [step, setStep] = useState(0)
  const [facilityId, setFacilityId] = useState(user?.facilityId ?? facilities[0]?.id ?? '')
  const [legalFirst, setLegalFirst] = useState('')
  const [legalLast, setLegalLast] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [dob, setDob] = useState('')
  const [ssn4, setSsn4] = useState('')
  const [genderIdentity, setGenderIdentity] = useState('')
  const [govId, setGovId] = useState(false)
  const [alias, setAlias] = useState(false)
  const [bio, setBio] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  if (!roleMay(['intake_coordinator', 'qa_tester'])) {
    return <Navigate to={ROUTES.home} replace />
  }

  const dup =
    legalFirst && legalLast && dob && ssn4.length === 4
      ? findDuplicateClient(clients, legalFirst, legalLast, dob, ssn4)
      : undefined

  const idOk = hasValidIdentifier({ govIdOnFile: govId, selfReportedAlias: alias, biometricWaiver: bio })

  async function submit() {
    setMsg(null)
    if (dup) {
      setMsg('Resolve duplicate match before saving.')
      return
    }
    if (!idOk) {
      setMsg('Provide at least one identifier: government ID on file, self-reported alias on file, or biometric waiver.')
      return
    }
    setBusy(true)
    const res = await recordIntake({
      facilityId,
      legalFirst,
      legalLast,
      preferredName,
      dateOfBirth: dob,
      ssnLast4: ssn4,
      genderIdentity,
      govIdOnFile: govId,
      selfReportedAlias: alias,
      biometricWaiver: bio,
    })
    setBusy(false)
    if (!res.ok) {
      setMsg(res.error ?? 'Could not complete intake.')
      return
    }
    setMsg('Intake saved. Bed counts and CES sync updated.')
    setStep(0)
    setLegalFirst('')
    setLegalLast('')
    setPreferredName('')
    setDob('')
    setSsn4('')
    setGenderIdentity('')
    setGovId(false)
    setAlias(false)
    setBio(false)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-harlow-ink">Intake</h1>
        <p className="text-sm text-harlow-ink/65 mt-1">
          Three short steps. Preferred name and gender identity are separate from legal ID.
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        {['Site & legal', 'Identity & dignity', 'Review'].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`flex-1 py-2 rounded-lg font-medium ${
              step === i ? 'bg-harlow-accent text-white' : 'bg-white border border-black/10 text-harlow-ink'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {msg && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${msg.includes('saved') ? 'bg-harlow-accent/15 text-harlow-ink' : 'bg-harlow-danger/10 text-harlow-danger'}`}
          role="status"
        >
          {msg}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4 bg-white border border-black/10 rounded-xl p-5 shadow-sm">
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="fac">
              Facility
            </label>
            <select
              id="fac"
              className="w-full rounded-lg border border-black/15 px-3 py-3 text-lg"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1" htmlFor="fn">
                Legal first name
              </label>
              <input
                id="fn"
                className="w-full rounded-lg border border-black/15 px-3 py-3 text-lg"
                value={legalFirst}
                onChange={(e) => setLegalFirst(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" htmlFor="ln">
                Legal last name
              </label>
              <input
                id="ln"
                className="w-full rounded-lg border border-black/15 px-3 py-3 text-lg"
                value={legalLast}
                onChange={(e) => setLegalLast(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="dob">
              Date of birth
            </label>
            <input
              id="dob"
              type="date"
              className="w-full rounded-lg border border-black/15 px-3 py-3 text-lg"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="ssn">
              Last four of SSN (duplicate check)
            </label>
            <input
              id="ssn"
              inputMode="numeric"
              maxLength={4}
              className="w-full rounded-lg border border-black/15 px-3 py-3 text-lg tracking-widest"
              value={ssn4}
              onChange={(e) => setSsn4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="w-full py-3 rounded-lg bg-harlow-slate text-white text-lg font-semibold"
            onClick={() => setStep(1)}
          >
            Continue
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4 bg-white border border-black/10 rounded-xl p-5 shadow-sm">
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="pref">
              Preferred name (how to address guest)
            </label>
            <input
              id="pref"
              className="w-full rounded-lg border border-black/15 px-3 py-3 text-lg"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              placeholder="Optional — defaults to legal first name"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="gi">
              Self-reported gender identity
            </label>
            <input
              id="gi"
              className="w-full rounded-lg border border-black/15 px-3 py-3 text-lg"
              value={genderIdentity}
              onChange={(e) => setGenderIdentity(e.target.value)}
              placeholder="e.g. woman, man, non-binary, questioning"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-2">Identifiers (at least one required)</legend>
            <label className="flex items-center gap-3 text-base">
              <input type="checkbox" checked={govId} onChange={(e) => setGovId(e.target.checked)} className="h-5 w-5" />
              Government ID scanned / verified on file
            </label>
            <label className="flex items-center gap-3 text-base">
              <input type="checkbox" checked={alias} onChange={(e) => setAlias(e.target.checked)} className="h-5 w-5" />
              Self-reported alias documented in record
            </label>
            <label className="flex items-center gap-3 text-base">
              <input type="checkbox" checked={bio} onChange={(e) => setBio(e.target.checked)} className="h-5 w-5" />
              Biometric consent waiver signed
            </label>
          </fieldset>
          {!idOk && <p className="text-sm text-harlow-warn">Select at least one identifier to enable save.</p>}
          <div className="flex gap-2">
            <button type="button" className="flex-1 py-3 rounded-lg border border-black/15 text-lg" onClick={() => setStep(0)}>
              Back
            </button>
            <button
              type="button"
              className="flex-1 py-3 rounded-lg bg-harlow-slate text-white text-lg font-semibold"
              onClick={() => setStep(2)}
            >
              Review
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 bg-white border border-black/10 rounded-xl p-5 shadow-sm text-sm">
          <h2 className="font-semibold text-harlow-ink text-base">Confirm before bed assignment</h2>
          <ul className="space-y-1 text-harlow-ink/80">
            <li>
              <span className="font-medium text-harlow-ink">Facility:</span>{' '}
              {facilities.find((f) => f.id === facilityId)?.shortName}
            </li>
            <li>
              <span className="font-medium text-harlow-ink">Legal:</span> {legalFirst} {legalLast}
            </li>
            <li>
              <span className="font-medium text-harlow-ink">Preferred:</span> {preferredName || legalFirst}
            </li>
            <li>
              <span className="font-medium text-harlow-ink">DOB:</span> {dob}
            </li>
            <li>
              <span className="font-medium text-harlow-ink">Gender identity:</span> {genderIdentity || '—'}
            </li>
            <li>
              <span className="font-medium text-harlow-ink">Identifiers:</span>{' '}
              {[govId && 'Gov ID', alias && 'Alias', bio && 'Biometric waiver'].filter(Boolean).join(', ') || 'none'}
            </li>
          </ul>

          {dup && (
            <div className="rounded-lg border-2 border-harlow-danger bg-harlow-danger/10 p-3" role="alert">
              <p className="font-semibold text-harlow-danger">Duplicate match</p>
              <p className="mt-1 text-harlow-ink">
                Existing record: {dup.preferredName} {dup.legalLast} ({dup.id}). Staff must reconcile before creating a
                second profile.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" className="flex-1 py-3 rounded-lg border border-black/15 text-lg" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              disabled={busy || !!dup || !idOk}
              className="flex-1 py-3 rounded-lg bg-harlow-accent text-white text-lg font-semibold disabled:opacity-50"
              onClick={() => void submit()}
            >
              {busy ? 'Saving…' : 'Complete intake'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
