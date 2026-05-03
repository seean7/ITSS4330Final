import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useNetwork } from '../context/NetworkContext'
import { ROUTES } from '../lib/access'

export default function Shell({
  children,
  navLinks,
}: {
  children: ReactNode
  navLinks: { to: string; label: string }[]
}) {
  const { user, logout } = useNetwork()

  return (
    <div className="min-h-screen flex flex-col bg-harlow-mist">
      <header className="bg-white border-b border-black/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="font-semibold text-harlow-ink">Harlow shelter network</p>
            <p className="text-xs text-harlow-ink/60">Prototype · demo data</p>
          </div>
          <nav className="flex flex-wrap gap-1" aria-label="Primary">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'px-3 py-1.5 rounded-md text-sm',
                    isActive ? 'bg-harlow-accent text-white' : 'text-harlow-ink hover:bg-black/5',
                  ].join(' ')
                }
                end={to === ROUTES.home}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm text-harlow-ink">
            <span className="hidden sm:inline text-harlow-ink/70">{user?.displayName}</span>
            <NavLink
              to={ROUTES.login}
              onClick={() => logout()}
              className="px-2 py-1 rounded-md border border-black/15 hover:bg-black/5 text-sm"
            >
              Sign out
            </NavLink>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
