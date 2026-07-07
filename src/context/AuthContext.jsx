// Auth แบบจำลอง (Phase 1) — เก็บ session ใน localStorage
// Phase ถัดไปเปลี่ยนไปใช้ supabase-js: signInWithPassword / onAuthStateChange
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'spendwise.auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // ignore corrupted storage
    }
    setLoading(false)
  }, [])

  async function signIn({ email }) {
    // จำลอง network + สร้าง session
    await new Promise((r) => setTimeout(r, 500))
    const session = {
      email,
      display_name: email.split('@')[0],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }

  async function signUp({ email, displayName }) {
    await new Promise((r) => setTimeout(r, 600))
    const session = { email, display_name: displayName || email.split('@')[0] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องอยู่ภายใน <AuthProvider>')
  return ctx
}
