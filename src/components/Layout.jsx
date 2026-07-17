// โครงหน้าหลัก: sidebar (desktop) + bottom nav (mobile) — สไตล์ขาว-ดำ ตาม DESIGN.md
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Home, LayoutDashboard, Target, Sparkles, Settings, LogOut, PiggyBank,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'หน้าแรก', eyebrow: 'HOME', icon: Home, end: true },
  { to: '/dashboard', label: 'วิเคราะห์', eyebrow: 'DASHBOARD', icon: LayoutDashboard },
  { to: '/goals', label: 'เป้าหมาย', eyebrow: 'GOALS', icon: Target },
  { to: '/what-if', label: 'จำลอง', eyebrow: 'SIMULATION', icon: Sparkles },
  { to: '/settings', label: 'ตั้งค่า', eyebrow: 'SETTINGS', icon: Settings },
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-canvas">
        <PiggyBank className="h-5 w-5" strokeWidth={2} />
      </div>
      <span className="text-lg font-bold tracking-tight text-ink">SpendWise</span>
    </div>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to))) || NAV[0]

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-hairline bg-canvas px-4 py-6 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav className="mt-10 flex flex-1 flex-col gap-1.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 ease-out ${
                  isActive
                    ? 'bg-surface-card text-ink'
                    : 'text-muted hover:bg-surface-card hover:text-ink'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-hairline-soft pt-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface-card text-sm font-semibold text-ink">
              {(user?.display_name?.[0] || 'U').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {user?.display_name || 'ผู้ใช้'}
              </p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-card hover:text-ink"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.9} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="hidden lg:block">
              <p className="eyebrow">{current.eyebrow}</p>
              <h1 className="display text-lg text-ink">{current.label}</h1>
            </div>
            <button
              onClick={signOut}
              className="rounded-xl p-2 text-muted hover:bg-surface-card hover:text-ink lg:hidden"
              aria-label="ออกจากระบบ"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:pb-12">
          {/* re-mount ต่อ route เพื่อ page transition (fade-up) */}
          <div key={pathname} className="animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-1.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium text-ink"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-[background-color,transform] duration-200 ease-out active:scale-90 ${
                      isActive ? 'bg-surface-card text-ink' : 'text-muted'
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </span>
                  <span className={isActive ? 'text-ink' : 'text-muted'}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
