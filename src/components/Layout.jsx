// โครงหน้าหลัก: sidebar (desktop) + bottom nav (mobile) + topbar
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Target, Sparkles, Settings, LogOut, PiggyBank,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'ภาพรวม', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'รายการ', icon: ArrowLeftRight },
  { to: '/goals', label: 'เป้าหมาย', icon: Target },
  { to: '/what-if', label: 'จำลอง', icon: Sparkles },
  { to: '/settings', label: 'ตั้งค่า', icon: Settings },
]

const PAGE_TITLES = {
  '/': 'ภาพรวมการเงิน',
  '/transactions': 'รายการรับ-จ่าย',
  '/goals': 'เป้าหมายการออม',
  '/what-if': 'จำลองสถานการณ์',
  '/settings': 'ตั้งค่า',
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <PiggyBank className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="leading-tight">
        <p className="font-bold text-ink-900">SpendWise</p>
        <p className="text-[11px] text-ink-400">การเงินฉลาดขึ้นด้วย AI</p>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'SpendWise'

  return (
    <div className="min-h-screen bg-ink-100">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink-200 bg-white px-4 py-6 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800'
                }`
              }
            >
              <item.icon className="h-5 w-5" strokeWidth={1.9} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-100 pt-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {(user?.display_name?.[0] || 'U').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-800">
                {user?.display_name || 'ผู้ใช้'}
              </p>
              <p className="truncate text-xs text-ink-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.9} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <div className="lg:hidden">
              <Brand />
            </div>
            <h1 className="hidden text-lg font-semibold text-ink-900 lg:block">{title}</h1>
            <button
              onClick={signOut}
              className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-rose-600 lg:hidden"
              aria-label="ออกจากระบบ"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-brand-600' : 'text-ink-400'
                }`
              }
            >
              <item.icon className="h-5 w-5" strokeWidth={1.9} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
