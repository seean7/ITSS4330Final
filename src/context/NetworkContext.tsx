import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { seedAlerts, seedClients, seedFacilities, seedVolunteers } from '../data/seed'
import { submitIntakeToCes } from '../lib/ces'
import {
  exceedsHighFrequencyThreshold,
  findDuplicateClient,
  hasValidIdentifier,
  needsVolunteerSms,
  wouldExceedCapacity,
} from '../lib/rules'
import type {
  CesSyncRecord,
  Client,
  Facility,
  NetworkAlert,
  SessionUser,
  UserRole,
  VolunteerShift,
} from '../types'

const MAP_FRESHNESS_MS = 30_000

interface NetworkContextValue {
  user: SessionUser | null
  login: (user: SessionUser) => void
  logout: () => void
  facilities: Facility[]
  clients: Client[]
  alerts: NetworkAlert[]
  cesLog: CesSyncRecord[]
  volunteerShifts: VolunteerShift[]
  emergencyOverflow: boolean
  setEmergencyOverflow: (v: boolean) => void
  lastNetworkRefresh: number
  mapFreshnessMs: number
  markAlertRead: (id: string) => void
  updateFacility: (id: string, patch: Partial<Facility>) => void
  recordIntake: (input: IntakeInput) => Promise<{ ok: boolean; error?: string; duplicate?: Client }>
  dischargeOneBed: (facilityId: string) => void
  setClientHoused: (clientId: string, housed: boolean, reason?: string) => void
  addClientTask: (clientId: string, title: string, assignee: string) => void
  toggleTask: (clientId: string, taskId: string) => void
  updatePlacement: (
    clientId: string,
    placementId: string,
    patch: Partial<Client['placements'][0]>,
  ) => { ok: boolean; error?: string }
  addDocument: (clientId: string, label: string, sensitivity: Client['documents'][0]['sensitivity']) => void
  simulateBanIntakeAttempt: (clientId: string, facilityId: string) => void
  volunteerCheckIn: (facilityId: string, pin: string) => { ok: boolean; error?: string }
  volunteerCheckOut: (facilityId: string, pin: string) => { ok: boolean; error?: string }
  exportHmisCsv: () => string
  roleMay: (allowed: UserRole[]) => boolean
  smsSimulationLog: string[]
}

export interface IntakeInput {
  facilityId: string
  legalFirst: string
  legalLast: string
  preferredName: string
  dateOfBirth: string
  ssnLast4: string
  genderIdentity: string
  govIdOnFile: boolean
  selfReportedAlias: boolean
  biometricWaiver: boolean
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [facilities, setFacilities] = useState(seedFacilities)
  const [clients, setClients] = useState<Client[]>(() => seedClients(seedFacilities()))
  const [alerts, setAlerts] = useState(seedAlerts)
  const [cesLog, setCesLog] = useState<CesSyncRecord[]>([])
  const [volunteerShifts, setVolunteerShifts] = useState(() => seedVolunteers(seedFacilities()))
  const [emergencyOverflow, setEmergencyOverflow] = useState(false)
  const [lastNetworkRefresh, setLastNetworkRefresh] = useState(() => Date.now())
  const [smsSimulationLog, setSmsSimulationLog] = useState<string[]>([])

  const touchNetwork = useCallback(() => {
    setLastNetworkRefresh(Date.now())
  }, [])

  useEffect(() => {
    const t = window.setInterval(() => {
      setFacilities((prev) =>
        prev.map((f) => {
          if (!needsVolunteerSms(f)) return f
          const msg = `[SMS sim] Volunteers needed: ${f.name} ≥90% capacity & help requested.`
          setSmsSimulationLog((log) => [msg, ...log].slice(0, 50))
          return f
        }),
      )
    }, 60_000)
    return () => window.clearInterval(t)
  }, [])

  const roleMay = useCallback(
    (allowed: UserRole[]) => {
      if (!user) return false
      return allowed.includes(user.role)
    },
    [user],
  )

  const markAlertRead = useCallback((id: string) => {
    setAlerts((a) => a.map((x) => (x.id === id ? { ...x, read: true } : x)))
  }, [])

  const updateFacility = useCallback(
    (id: string, patch: Partial<Facility>) => {
      setFacilities((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
      touchNetwork()
    },
    [touchNetwork],
  )

  const recordIntake = useCallback(
    async (input: IntakeInput): Promise<{ ok: boolean; error?: string; duplicate?: Client }> => {
      const dup = findDuplicateClient(
        clients,
        input.legalFirst,
        input.legalLast,
        input.dateOfBirth,
        input.ssnLast4,
      )
      if (dup) return { ok: false, duplicate: dup, error: 'Possible duplicate client record.' }

      const idOk = hasValidIdentifier({
        govIdOnFile: input.govIdOnFile,
        selfReportedAlias: input.selfReportedAlias,
        biometricWaiver: input.biometricWaiver,
      })
      if (!idOk) return { ok: false, error: 'At least one valid identifier is required.' }

      const fac = facilities.find((f) => f.id === input.facilityId)
      if (!fac) return { ok: false, error: 'Facility not found.' }

      if (wouldExceedCapacity(fac, fac.occupiedBeds + 1, emergencyOverflow)) {
        return {
          ok: false,
          error: `Cannot exceed ${emergencyOverflow ? '110%' : '100%'} of licensed capacity at ${fac.shortName}.`,
        }
      }

      const cid = `c_${Date.now()}`
      const stayId = `stay_${Date.now()}`
      const newClient: Client = {
        id: cid,
        legalFirst: input.legalFirst,
        legalLast: input.legalLast,
        preferredName: input.preferredName || input.legalFirst,
        dateOfBirth: input.dateOfBirth,
        ssnLast4: input.ssnLast4,
        genderIdentity: input.genderIdentity,
        govIdOnFile: input.govIdOnFile,
        selfReportedAlias: input.selfReportedAlias,
        biometricWaiver: input.biometricWaiver,
        facilityBan: false,
        activelyHoused: false,
        stays: [
          {
            id: stayId,
            facilityId: input.facilityId,
            clientId: cid,
            checkIn: new Date().toISOString(),
          },
        ],
        documents: [],
        tasks: [],
        placements: [],
      }

      setFacilities((prev) =>
        prev.map((f) =>
          f.id === input.facilityId
            ? { ...f, occupiedBeds: f.occupiedBeds + 1, lastBedEventAt: new Date().toISOString() }
            : f,
        ),
      )
      setClients((c) => [...c, newClient])

      const cesId = `ces_${Date.now()}`
      const submittedAt = new Date().toISOString()
      setCesLog((log) => [...log, { id: cesId, clientId: newClient.id, submittedAt, status: 'pending' }])

      const ces = await submitIntakeToCes({ clientId: newClient.id, submittedAt })
      const ackAt = ces.ok ? ces.acknowledgedAt : undefined
      setCesLog((log) =>
        log.map((row) =>
          row.id === cesId
            ? {
                ...row,
                status: ces.ok ? 'ack' : 'error',
                acknowledgedAt: ackAt,
                latencyMs: ces.ok ? ces.latencyMs : undefined,
              }
            : row,
        ),
      )
      if (!ces.ok) {
        setAlerts((a) => [
          {
            id: `ces_${Date.now()}`,
            kind: 'ces_failure',
            message: `County CES did not acknowledge intake for ${newClient.preferredName} (${newClient.legalLast}).`,
            createdAt: new Date().toISOString(),
            clientId: newClient.id,
            read: false,
          },
          ...a,
        ])
      }

      const hf = exceedsHighFrequencyThreshold(newClient.stays)
      if (hf) {
        setAlerts((a) => [
          {
            id: `hf_${Date.now()}`,
            kind: 'high_frequency',
            message: `${newClient.preferredName} ${newClient.legalLast} exceeded 8 stays / 90 days — review.`,
            createdAt: new Date().toISOString(),
            clientId: newClient.id,
            read: false,
          },
          ...a,
        ])
      }

      touchNetwork()
      return { ok: true }
    },
    [clients, facilities, emergencyOverflow, touchNetwork],
  )

  const dischargeOneBed = useCallback(
    (facilityId: string) => {
      setFacilities((prev) =>
        prev.map((f) =>
          f.id === facilityId && f.occupiedBeds > 0
            ? { ...f, occupiedBeds: f.occupiedBeds - 1, lastBedEventAt: new Date().toISOString() }
            : f,
        ),
      )
      touchNetwork()
    },
    [touchNetwork],
  )

  const setClientHoused = useCallback((clientId: string, housed: boolean, reason?: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, activelyHoused: housed, housedPausedReason: reason } : c,
      ),
    )
    touchNetwork()
  }, [touchNetwork])

  const addClientTask = useCallback(
    (clientId: string, title: string, assignee: string) => {
      const due = new Date()
      due.setDate(due.getDate() + 7)
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                tasks: [
                  ...c.tasks,
                  {
                    id: `tk_${Date.now()}`,
                    title,
                    assignee,
                    due: due.toISOString(),
                    done: false,
                  },
                ],
              }
            : c,
        ),
      )
      touchNetwork()
    },
    [touchNetwork],
  )

  const toggleTask = useCallback(
    (clientId: string, taskId: string) => {
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
              }
            : c,
        ),
      )
      touchNetwork()
    },
    [touchNetwork],
  )

  const updatePlacement = useCallback(
    (clientId: string, placementId: string, patch: Partial<Client['placements'][0]>) => {
      let result: { ok: boolean; error?: string } = { ok: true }
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c
          const next = c.placements.map((p) => {
            if (p.id !== placementId) return p
            const merged = { ...p, ...patch }
            if (merged.status === 'successful') {
              const ok = Boolean(
                merged.moveInDate?.trim() && merged.destinationAddress?.trim(),
              )
              if (!ok) {
                result = {
                  ok: false,
                  error: 'Successful closure requires move-in date and destination address.',
                }
                return p
              }
            }
            return merged
          })
          return { ...c, placements: next }
        }),
      )
      if (result.ok) touchNetwork()
      return result
    },
    [touchNetwork],
  )

  const addDocument = useCallback(
    (clientId: string, label: string, sensitivity: Client['documents'][0]['sensitivity']) => {
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                documents: [
                  ...c.documents,
                  { id: `doc_${Date.now()}`, label, uploadedAt: new Date().toISOString(), sensitivity },
                ],
              }
            : c,
        ),
      )
      touchNetwork()
    },
    [touchNetwork],
  )

  const simulateBanIntakeAttempt = useCallback(
    (clientId: string, facilityId: string) => {
      const client = clients.find((c) => c.id === clientId)
      const fac = facilities.find((f) => f.id === facilityId)
      if (!client?.facilityBan || !fac) return
      setAlerts((a) => [
        {
          id: `ban_${Date.now()}`,
          kind: 'ban_intake',
          message: `Ban flag: ${client.preferredName} ${client.legalLast} presented at ${fac.shortName}.`,
          createdAt: new Date().toISOString(),
          facilityId,
          clientId,
          read: false,
        },
        ...a,
      ])
      touchNetwork()
    },
    [clients, facilities, touchNetwork],
  )

  const volunteerCheckIn = useCallback(
    (facilityId: string, pin: string) => {
      const shift = volunteerShifts.find((v) => v.facilityId === facilityId && v.pin === pin)
      if (!shift) return { ok: false, error: 'PIN not recognized for this site.' }
      if (shift.checkedIn && !shift.checkedOut) return { ok: false, error: 'Already checked in.' }
      setVolunteerShifts((vs) =>
        vs.map((v) => (v.id === shift.id ? { ...v, checkedIn: new Date().toISOString(), checkedOut: undefined } : v)),
      )
      touchNetwork()
      return { ok: true }
    },
    [volunteerShifts, touchNetwork],
  )

  const volunteerCheckOut = useCallback(
    (facilityId: string, pin: string) => {
      const shift = volunteerShifts.find((v) => v.facilityId === facilityId && v.pin === pin)
      if (!shift?.checkedIn || shift.checkedOut) return { ok: false, error: 'Not checked in.' }
      setVolunteerShifts((vs) =>
        vs.map((v) => (v.id === shift.id ? { ...v, checkedOut: new Date().toISOString() } : v)),
      )
      touchNetwork()
      return { ok: true }
    },
    [volunteerShifts, touchNetwork],
  )

  const exportHmisCsv = useCallback(() => {
    const headers = ['personal_id', 'facility', 'pit_date', 'actively_housed', 'stay_count_90d']
    const pit = new Date().toISOString().slice(0, 10)
    const rows = clients.map((c) => {
      const recent = c.stays.filter((s) => {
        const t = new Date(s.checkIn).getTime()
        const start = Date.now() - 90 * 86_400_000
        return t >= start
      }).length
      const fac = facilities.find((f) => f.id === c.stays[0]?.facilityId)
      return [c.id, fac?.shortName ?? '', pit, c.activelyHoused ? '1' : '0', String(recent)].join(',')
    })
    return [headers.join(','), ...rows].join('\n')
  }, [clients, facilities])

  const value = useMemo<NetworkContextValue>(
    () => ({
      user,
      login: setUser,
      logout: () => setUser(null),
      facilities,
      clients,
      alerts,
      cesLog,
      volunteerShifts,
      emergencyOverflow,
      setEmergencyOverflow,
      lastNetworkRefresh,
      mapFreshnessMs: MAP_FRESHNESS_MS,
      markAlertRead,
      updateFacility,
      recordIntake,
      dischargeOneBed,
      setClientHoused,
      addClientTask,
      toggleTask,
      updatePlacement,
      addDocument,
      simulateBanIntakeAttempt,
      volunteerCheckIn,
      volunteerCheckOut,
      exportHmisCsv,
      roleMay,
      smsSimulationLog,
    }),
    [
      user,
      facilities,
      clients,
      alerts,
      cesLog,
      volunteerShifts,
      emergencyOverflow,
      lastNetworkRefresh,
      markAlertRead,
      updateFacility,
      recordIntake,
      dischargeOneBed,
      setClientHoused,
      addClientTask,
      toggleTask,
      updatePlacement,
      addDocument,
      simulateBanIntakeAttempt,
      volunteerCheckIn,
      volunteerCheckOut,
      exportHmisCsv,
      roleMay,
      smsSimulationLog,
    ],
  )

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
  return ctx
}
