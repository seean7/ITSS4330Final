import type { Client, Facility, NetworkAlert, VolunteerShift } from '../types'

const iso = (daysAgo: number, hour = 12) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const seedFacilities = (): Facility[] => {
  const shelters: Facility[] = [
    { id: 's1', name: 'Harbor Night Shelter', shortName: 'Harbor', type: 'emergency_shelter', mapX: 12, mapY: 72, licensedBeds: 85, occupiedBeds: 78, genderDesignations: ['all_gender'], petFriendly: false, accessibility: ['Wheelchair accessible', 'Hearing loop'], volunteerHelpRequested: true, lastBedEventAt: iso(0, 14) },
    { id: 's2', name: 'Northside Warming Center', shortName: 'Northside', type: 'emergency_shelter', mapX: 28, mapY: 18, licensedBeds: 120, occupiedBeds: 112, genderDesignations: ['all_gender', 'youth'], petFriendly: true, accessibility: ['Ground-floor beds'], volunteerHelpRequested: true, lastBedEventAt: iso(0, 13) },
    { id: 's3', name: 'Riverside Respite', shortName: 'Riverside', type: 'emergency_shelter', mapX: 45, mapY: 55, licensedBeds: 64, occupiedBeds: 40, genderDesignations: ['women', 'nonbinary_centered'], petFriendly: false, accessibility: ['ADA restrooms'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 15) },
    { id: 's4', name: 'Cedar Commons', shortName: 'Cedar', type: 'emergency_shelter', mapX: 62, mapY: 22, licensedBeds: 95, occupiedBeds: 88, genderDesignations: ['men'], petFriendly: false, accessibility: ['Elevator', 'Visual alarms'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 12) },
    { id: 's5', name: 'Market Street Annex', shortName: 'Market', type: 'emergency_shelter', mapX: 55, mapY: 78, licensedBeds: 42, occupiedBeds: 41, genderDesignations: ['all_gender'], petFriendly: true, accessibility: ['Ramp entry'], volunteerHelpRequested: true, lastBedEventAt: iso(0, 16) },
    { id: 's6', name: 'Lakeside Lodge', shortName: 'Lakeside', type: 'emergency_shelter', mapX: 18, mapY: 42, licensedBeds: 110, occupiedBeds: 65, genderDesignations: ['all_gender'], petFriendly: false, accessibility: ['Wide doorways'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 11) },
    { id: 's7', name: 'Eastgate Shelter', shortName: 'Eastgate', type: 'emergency_shelter', mapX: 88, mapY: 38, licensedBeds: 76, occupiedBeds: 70, genderDesignations: ['women', 'youth'], petFriendly: false, accessibility: ['ASL support on request'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 10) },
    { id: 's8', name: 'South Loop Station', shortName: 'South Loop', type: 'emergency_shelter', mapX: 48, mapY: 92, licensedBeds: 130, occupiedBeds: 129, genderDesignations: ['all_gender'], petFriendly: false, accessibility: ['Full ADA'], volunteerHelpRequested: true, lastBedEventAt: iso(0, 9) },
    { id: 's9', name: 'Hillcrest House', shortName: 'Hillcrest', type: 'emergency_shelter', mapX: 72, mapY: 62, licensedBeds: 55, occupiedBeds: 22, genderDesignations: ['all_gender'], petFriendly: true, accessibility: ['Sensory-friendly wing'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 8) },
    { id: 's10', name: 'Old Town Hall Shelter', shortName: 'Old Town', type: 'emergency_shelter', mapX: 35, mapY: 35, licensedBeds: 48, occupiedBeds: 45, genderDesignations: ['men', 'nonbinary_centered'], petFriendly: false, accessibility: ['Limited — stairs'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 17) },
    { id: 's11', name: 'Airport Road Pavilion', shortName: 'Airport Rd', type: 'emergency_shelter', mapX: 8, mapY: 88, licensedBeds: 90, occupiedBeds: 30, genderDesignations: ['all_gender'], petFriendly: false, accessibility: ['Ground floor'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 7) },
    { id: 's12', name: 'West End Gymnasium', shortName: 'West End', type: 'emergency_shelter', mapX: 5, mapY: 48, licensedBeds: 200, occupiedBeds: 195, genderDesignations: ['all_gender', 'youth'], petFriendly: true, accessibility: ['ADA shower trailers'], volunteerHelpRequested: true, lastBedEventAt: iso(0, 18) },
    { id: 's13', name: 'Midtown Mosaic', shortName: 'Mosaic', type: 'emergency_shelter', mapX: 52, mapY: 48, licensedBeds: 70, occupiedBeds: 68, genderDesignations: ['nonbinary_centered', 'women'], petFriendly: false, accessibility: ['Gender-neutral restrooms'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 6) },
    { id: 's14', name: 'Canal Street Overflow', shortName: 'Canal', type: 'emergency_shelter', mapX: 68, mapY: 88, licensedBeds: 60, occupiedBeds: 12, genderDesignations: ['all_gender'], petFriendly: false, accessibility: ['Ramp'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 5) },
  ]

  const transitional: Facility[] = [
    { id: 't1', name: 'Bridgeview Apartments', shortName: 'Bridgeview', type: 'transitional', mapX: 25, mapY: 65, licensedBeds: 32, occupiedBeds: 28, genderDesignations: ['all_gender'], petFriendly: true, accessibility: ['Elevator'], volunteerHelpRequested: false, lastBedEventAt: iso(1, 10) },
    { id: 't2', name: 'Willow Path Studios', shortName: 'Willow', type: 'transitional', mapX: 40, mapY: 12, licensedBeds: 24, occupiedBeds: 24, genderDesignations: ['women'], petFriendly: false, accessibility: ['Step-free'], volunteerHelpRequested: false, lastBedEventAt: iso(2, 9) },
    { id: 't3', name: 'Granite Row', shortName: 'Granite', type: 'transitional', mapX: 78, mapY: 12, licensedBeds: 40, occupiedBeds: 31, genderDesignations: ['all_gender'], petFriendly: false, accessibility: ['Hearing loop'], volunteerHelpRequested: false, lastBedEventAt: iso(1, 14) },
    { id: 't4', name: 'Summit Crossing', shortName: 'Summit', type: 'transitional', mapX: 92, mapY: 72, licensedBeds: 36, occupiedBeds: 20, genderDesignations: ['men', 'youth'], petFriendly: true, accessibility: ['ADA parking'], volunteerHelpRequested: false, lastBedEventAt: iso(3, 11) },
    { id: 't5', name: 'Elm Cooperative', shortName: 'Elm Co-op', type: 'transitional', mapX: 15, mapY: 25, licensedBeds: 28, occupiedBeds: 27, genderDesignations: ['all_gender'], petFriendly: false, accessibility: ['Visual fire alarms'], volunteerHelpRequested: false, lastBedEventAt: iso(0, 20) },
    { id: 't6', name: 'Quince Terrace', shortName: 'Quince', type: 'transitional', mapX: 58, mapY: 40, licensedBeds: 20, occupiedBeds: 18, genderDesignations: ['women', 'nonbinary_centered'], petFriendly: false, accessibility: ['Single-floor'], volunteerHelpRequested: false, lastBedEventAt: iso(4, 8) },
  ]

  return [...shelters, ...transitional]
}

function manyStays(clientId: string, facilityId: string): { id: string; facilityId: string; clientId: string; checkIn: string; checkOut?: string }[] {
  const out: { id: string; facilityId: string; clientId: string; checkIn: string; checkOut?: string }[] = []
  for (let i = 0; i < 10; i++) {
    out.push({
      id: `stay-${clientId}-${i}`,
      facilityId,
      clientId,
      checkIn: iso(i * 7 + 2, 19),
      checkOut: iso(i * 7 + 1, 8),
    })
  }
  return out
}

export const seedClients = (facilities: Facility[]): Client[] => {
  const f = (i: number) => facilities[i % facilities.length].id
  return [
    {
      id: 'c1',
      legalFirst: 'Jordan',
      legalLast: 'Ellis',
      preferredName: 'Jordy',
      dateOfBirth: '1988-04-12',
      ssnLast4: '4421',
      genderIdentity: 'Non-binary',
      govIdOnFile: true,
      selfReportedAlias: true,
      biometricWaiver: false,
      facilityBan: false,
      activelyHoused: false,
      stays: [
        { id: 'st1', facilityId: f(0), clientId: 'c1', checkIn: iso(2, 20), checkOut: iso(1, 7) },
        { id: 'st2', facilityId: f(3), clientId: 'c1', checkIn: iso(0, 18) },
      ],
      documents: [
        { id: 'd1', label: 'ID copy (secured)', uploadedAt: iso(10), sensitivity: 'case_manager_and_above' },
        { id: 'd2', label: 'Benefit award letter', uploadedAt: iso(5), sensitivity: 'case_manager_and_above' },
      ],
      tasks: [
        { id: 'tk1', title: 'Confirm CoC housing assessment', assignee: 'Sam Rivera', due: iso(-3, 12), done: false },
        { id: 'tk2', title: 'Follow up with landlord reference', assignee: 'Alex Kim', due: iso(-1, 12), done: true },
      ],
      placements: [{ id: 'p1', status: 'pending' }],
    },
    {
      id: 'c2',
      legalFirst: 'Maria',
      legalLast: 'Santos',
      preferredName: 'Mari',
      dateOfBirth: '1992-11-03',
      ssnLast4: '8890',
      genderIdentity: 'Woman',
      govIdOnFile: false,
      selfReportedAlias: true,
      biometricWaiver: false,
      facilityBan: true,
      banNotes: 'Prior incident — director review required before intake.',
      activelyHoused: false,
      stays: [{ id: 'st3', facilityId: f(2), clientId: 'c2', checkIn: iso(30, 16), checkOut: iso(29, 9) }],
      documents: [],
      tasks: [],
      placements: [],
    },
    {
      id: 'c_hf',
      legalFirst: 'Taylor',
      legalLast: 'Brooks',
      preferredName: 'Taylor',
      dateOfBirth: '1995-06-21',
      ssnLast4: '1122',
      genderIdentity: 'Trans man',
      govIdOnFile: true,
      selfReportedAlias: false,
      biometricWaiver: false,
      facilityBan: false,
      activelyHoused: false,
      stays: manyStays('c_hf', f(1)),
      documents: [],
      tasks: [],
      placements: [],
    },
    {
      id: 'c_housed',
      legalFirst: 'Riley',
      legalLast: 'Nguyen',
      preferredName: 'Riley',
      dateOfBirth: '1990-01-30',
      ssnLast4: '3344',
      genderIdentity: 'Woman',
      govIdOnFile: true,
      selfReportedAlias: true,
      biometricWaiver: false,
      facilityBan: false,
      activelyHoused: true,
      housedPausedReason: 'Permanent supportive housing — lease signed 03/15',
      stays: [{ id: 'st4', facilityId: f(4), clientId: 'c_housed', checkIn: iso(120, 15), checkOut: iso(90, 10) }],
      documents: [{ id: 'd3', label: 'Signed lease (unit 12B)', uploadedAt: iso(20), sensitivity: 'case_manager_and_above' }],
      tasks: [],
      placements: [
        {
          id: 'p2',
          status: 'successful',
          moveInDate: '2026-03-15',
          destinationAddress: '412 Cedar Ln, Harlow',
        },
      ],
    },
  ]
}

export const seedVolunteers = (facilities: Facility[]): VolunteerShift[] => [
  { id: 'v1', facilityId: facilities[0].id, pin: '4829', volunteerLabel: 'Morning crew — Dana' },
  { id: 'v2', facilityId: facilities[1].id, pin: '7104', volunteerLabel: 'Evening — Chris' },
]

export const seedAlerts = (): NetworkAlert[] => [
  {
    id: 'a1',
    kind: 'capacity',
    message: 'South Loop Station at 99% — volunteer SMS simulation triggered.',
    createdAt: iso(0, 19),
    facilityId: 's8',
    read: false,
  },
  {
    id: 'a2',
    kind: 'high_frequency',
    message: 'Taylor Brooks exceeded 8 shelter stays in the last 90 days — intensive case review suggested.',
    createdAt: iso(0, 8),
    clientId: 'c_hf',
    read: false,
  },
]
