import type { Client, Facility } from '../types'

const MS_DAY = 86_400_000

export function findDuplicateClient(
  clients: Client[],
  legalFirst: string,
  legalLast: string,
  dob: string,
  ssnLast4: string,
): Client | undefined {
  const f = legalFirst.trim().toLowerCase()
  const l = legalLast.trim().toLowerCase()
  return clients.find(
    (c) =>
      c.legalFirst.trim().toLowerCase() === f &&
      c.legalLast.trim().toLowerCase() === l &&
      c.dateOfBirth === dob &&
      c.ssnLast4 === ssnLast4,
  )
}

export function hasValidIdentifier(client: {
  govIdOnFile: boolean
  selfReportedAlias: boolean
  biometricWaiver: boolean
}): boolean {
  return client.govIdOnFile || client.selfReportedAlias || client.biometricWaiver
}

export function canClosePlacementSuccess(placement: {
  moveInDate?: string
  destinationAddress?: string
}): boolean {
  return Boolean(
    placement.moveInDate &&
      placement.moveInDate.length > 0 &&
      placement.destinationAddress &&
      placement.destinationAddress.trim().length > 0,
  )
}

/** Rolling 90-day shelter stays count (check-ins). */
export function countStaysLast90Days(stays: { checkIn: string; checkOut?: string }[]): number {
  const now = Date.now()
  const start = now - 90 * MS_DAY
  return stays.filter((s) => {
    const t = new Date(s.checkIn).getTime()
    return t >= start && t <= now
  }).length
}

export function exceedsHighFrequencyThreshold(stays: { checkIn: string }[], threshold = 8): boolean {
  return countStaysLast90Days(stays) > threshold
}

export function maxBedsAllowed(facility: Facility, emergencyOverflowAuthorized: boolean): number {
  const cap = emergencyOverflowAuthorized
    ? Math.floor(facility.licensedBeds * 1.1)
    : facility.licensedBeds
  return cap
}

export function wouldExceedCapacity(
  facility: Facility,
  proposedOccupied: number,
  emergencyOverflowAuthorized: boolean,
): boolean {
  return proposedOccupied > maxBedsAllowed(facility, emergencyOverflowAuthorized)
}

export function facilityUtilization(f: Facility): number {
  if (f.licensedBeds <= 0) return 0
  return f.occupiedBeds / f.licensedBeds
}

export function needsVolunteerSms(f: Facility): boolean {
  return f.volunteerHelpRequested && facilityUtilization(f) >= 0.9
}
