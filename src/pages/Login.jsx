// หน้า Login / Register (mock auth) — Phase ถัดไปต่อ supabase-js
import { useState } from 'react'
import { PiggyBank, Sparkles, TrendingUp, Target } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Field, Input } from '../components/ui'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const err = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'อีเมลไม่ถูกต้อง'
    if (form.password.length < 6) err.password = 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'
    if (mode === 'register' && !form.displayName.trim())
      err.displayName = 'กรุณากรอกชื่อที่แสดง'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') await signIn({ email: form.email })
      else await signUp({ email: form.email, displayName: form.displayName })
      // เมื่อ user ถูกตั้งค่า RequireAuth จะพาไป dashboard เอง
    } catch {
      setErrors({ form: 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel — desktop */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <PiggyBank className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">SpendWise</span>
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold leading-snug">
            จัดการเงินให้ฉลาดขึ้น
            <br />
            ด้วยผู้ช่วย AI
          </h1>
          <p className="mt-4 max-w-sm text-brand-100">
            บันทึกรายรับรายจ่าย ตั้งเป้าหมายการออม และให้ AI ช่วยวางแผนการเงินของคุณ
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: Sparkles, text: 'จัดหมวดหมู่อัตโนมัติด้วย AI' },
              { icon: Target, text: 'วางแผนออมเงินให้ถึงเป้าหมาย' },
              { icon: TrendingUp, text: 'จำลองสถานการณ์ “ถ้า...จะเป็นอย่างไร”' },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} SpendWise — Personal Finance
        </p>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center bg-ink-50 p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <PiggyBank className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-ink-900">SpendWise</span>
          </div>

          <h2 className="text-2xl font-bold text-ink-900">
            {mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'สร้างบัญชีใหม่'}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {mode === 'login'
              ? 'เข้าสู่ระบบเพื่อจัดการการเงินของคุณ'
              : 'เริ่มต้นวางแผนการเงินได้ฟรีวันนี้'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            {mode === 'register' && (
              <Field label="ชื่อที่แสดง" error={errors.displayName}>
                <Input
                  type="text"
                  placeholder="เช่น รุ่งทิพย์"
                  value={form.displayName}
                  onChange={set('displayName')}
                  autoComplete="name"
                />
              </Field>
            )}
            <Field label="อีเมล" error={errors.email}>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </Field>
            <Field label="รหัสผ่าน" error={errors.password}>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </Field>

            {errors.form && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {errors.form}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            {mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setErrors({})
              }}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              {mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </p>

          <p className="mt-6 rounded-lg bg-ink-100 px-3 py-2 text-center text-xs text-ink-400">
            เดโม (Phase 1): กรอกอีเมลและรหัสผ่านใดก็ได้เพื่อเข้าใช้งาน
          </p>
        </div>
      </div>
    </div>
  )
}
