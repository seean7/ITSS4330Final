export type UserRole = 'intake_coordinator' | 'qa_tester'

export type FacilityType = 'emergency_shelter' | 'transitional'

export type GenderDesignation = 'all_gender' | 'women' | 'men' | 'nonbinary_centered' | 'youth'

export interface Facility {
  id: string
  name: string
  shortName: string
  type: FacilityType
  /** Percent positions for schematic map (0–100) */
  mapX: number
  mapY: number
  licensedBeds: number
  occupiedBeds: number
  genderDesignations: GenderDesignation[]
  petFriendly: boolean
  accessibility: string[]
  volunteerHelpRequested: boolean
  lastBedEventAt: string
}

export interface StayRecord {
  id: string
  facilityId: string
  clientId: string
  checkIn: string
  checkOut?: string
}

export type DocumentSensitivity = 'case_manager_and_above' | 'admin_only'

export interface ClientDocument {
  id: string
  label: string
  uploadedAt: string
  sensitivity: DocumentSensitivity
}

export interface HousingPlacement {
  id: string
  status: 'pending' | 'successful' | 'unsuccessful'
  moveInDate?: string
  destinationAddress?: string
}

export interface ClientTask {
  id: string
  title: string
  assignee: string
  due: string
  done: boolean
}

export interface Client {
  id: string
  legalFirst: string
  legalLast: string
  preferredName: string
  dateOfBirth: string
  ssnLast4: string
  genderIdentity: string
  govIdOnFile: boolean
  selfReportedAlias: boolean
  biometricWaiver: boolean
  facilityBan: boolean
  banNotes?: string
  activelyHoused: boolean
  housedPausedReason?: string
  stays: StayRecord[]
  documents: ClientDocument[]
  tasks: ClientTask[]
  placements: HousingPlacement[]
}

export interface CesSyncRecord {
  id: string
  clientId: string
  submittedAt: string
  acknowledgedAt?: string
  status: 'pending' | 'ack' | 'error'
  latencyMs?: number
}

export interface VolunteerShift {
  id: string
  facilityId: string
  pin: string
  volunteerLabel: string
  checkedIn?: string
  checkedOut?: string
}

export interface NetworkAlert {
  id: string
  kind: 'capacity' | 'ban_intake' | 'high_frequency' | 'ces_failure'
  message: string
  createdAt: string
  facilityId?: string
  clientId?: string
  read: boolean
}

export interface SessionUser {
  displayName: string
  role: UserRole
  facilityId?: string
}
