import type { DocumentSensitivity, UserRole } from '../types'

export const ROUTES = {
  home: '/',
  login: '/login',
  map: '/map',
  intake: '/intake',
  clients: '/clients',
  client: (id: string) => `/clients/${id}`,
  qa: '/qa',
} as const

export function navForRole(role: UserRole | undefined): { to: string; label: string }[] {
  if (!role) return []
  const core = [
    { to: ROUTES.map, label: 'Map' },
    { to: ROUTES.intake, label: 'Intake' },
    { to: ROUTES.clients, label: 'Guests' },
    { to: ROUTES.home, label: 'Home' },
  ]
  if (role === 'qa_tester') {
    return [...core, { to: ROUTES.qa, label: 'QA' }]
  }
  return core
}

export function canViewDocuments(role: UserRole | undefined): boolean {
  return role === 'qa_tester'
}

export function documentSensitivityOk(role: UserRole | undefined, _sensitivity: DocumentSensitivity): boolean {
  return role === 'qa_tester'
}
