// โครงหน้าหลัก: sidebar (desktop) + bottom nav (mobile) — สไตล์ขาว-ดำ ตาม DESIGN.md
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Home, LayoutDashboard, Target, Sparkles, Menu, LogOut, PiggyBank,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Aurora from './Aurora'

const NAV = [
  { to: '/', label: 'หน้าแรก', eyebrow: 'HOME', icon: Home, end: true },
  { to: '/dashboard', label: 'วิเคราะห์', eyebrow: 'DASHBOARD', icon: LayoutDashboard },
  { to: '/goals', label: 'เป้าหมาย', eyebrow: 'GOALS', icon: Target },
  { to: '/what-if', label: 'จำลอง', eyebrow: 'SIMULATION', icon: Sparkles },
  { to: '/settings', label: 'เมนู', eyebrow: 'MENU', icon: Menu },
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
  // ซ่อนชื่อหน้าบน header ทุกหน้า ยกเว้นหน้าจำลอง (Simulation)
  const showTitle = pathname === '/what-if'
  // หน้า Simulation ใช้พื้นขาว + Aurora แทนพื้นครีมของแอป
  const isSimulation = pathname === '/what-if'

  return (
    // isolate = สร้าง stacking context ให้ Aurora (-z-10) อยู่เหนือพื้นการ์ด แต่ใต้เนื้อหา
    <div className={`relative isolate min-h-screen ${isSimulation ? 'bg-white' : 'bg-surface'}`}>
      {isSimulation && <Aurora />}
      {/* Sidebar — desktop */}
      <aside
        className={`fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-hairline px-4 py-6 backdrop-blur lg:flex ${
          isSimulation ? 'bg-white/70' : 'bg-canvas'
        }`}
      >
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
        <header
          className={`sticky top-0 z-30 border-b border-hairline backdrop-blur ${
            isSimulation ? 'bg-white/70' : 'bg-canvas/85'
          }`}
        >
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:h-16 sm:px-6">
            <div className="lg:hidden">
              <Brand />
            </div>
            {showTitle && (
              <div className="hidden lg:block">
                <p className="eyebrow">{current.eyebrow}</p>
                <h1 className="display text-lg text-ink">{current.label}</h1>
              </div>
            )}
            <button
              onClick={signOut}
              className="rounded-xl p-1.5 text-muted hover:bg-surface-card hover:text-ink lg:hidden"
              aria-label="ออกจากระบบ"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-3 pb-24 pt-4 sm:px-6 sm:pt-6 lg:pb-12">
          {/* re-mount ต่อ route เพื่อ page transition (fade-up) */}
          <div key={pathname} className="animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-hairline backdrop-blur lg:hidden ${
          isSimulation ? 'bg-white/80' : 'bg-canvas/95'
        }`}
      >
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-ink"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-[background-color,transform] duration-200 ease-out active:scale-90 ${
                      isActive ? 'bg-surface-card text-ink' : 'text-muted'
                    }`}
                  >
                    <item.icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
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
