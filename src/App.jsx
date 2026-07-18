// Routing + guard การเข้าถึงหน้า (ต้อง login ก่อน)
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { playTick } from './lib/sound'
import { Spinner } from './components/ui'

// เล่นเสียง "ติ้ก" เมื่อกดปุ่ม/แท็บ/ลิงก์ใดๆ (บอกว่ากดแล้ว)
function useClickTick() {
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest('button, a[href], [role="switch"], [role="tab"], select, summary')
      if (!el) return
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return
      playTick()
    }
    // capture phase — ให้ทำงานแม้ handler ปลายทางจะ stopPropagation
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])
}
import Layout from './components/Layout'
import DesktopNotice from './components/DesktopNotice'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import WhatIf from './pages/WhatIf'
import Settings from './pages/Settings'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  useClickTick()
  return (
    <BrowserRouter>
      {/* จอเดสก์ท็อป (>= 1280px) แสดงหน้าแจ้งเตือนแทนตัวแอป */}
      <DesktopNotice />
      <div className="xl:hidden">
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <Login />
              </RedirectIfAuthed>
            }
          />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/what-if" element={<WhatIf />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
