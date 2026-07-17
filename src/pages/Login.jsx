// หน้า Login / Register — editorial ขาว-ดำ + color block ตาม DESIGN.md
import { useState } from 'react'
import { PiggyBank, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Field, Input, Eyebrow } from '../components/ui'

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
    } catch {
      setErrors({ form: 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-canvas p-3 sm:p-4">
      {/* Color-block panel — desktop */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden rounded-3xl bg-lavender p-12 text-ink lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-canvas">
            <PiggyBank className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">SpendWise</span>
        </div>

        <div>
          <Eyebrow className="!text-ink/70">Personal Finance · AI</Eyebrow>
          <h1 className="display mt-4 text-5xl">
            จัดการเงิน
            <br />
            ให้ฉลาดขึ้น
          </h1>
          <p className="mt-5 max-w-sm text-lg font-light leading-relaxed text-ink/80">
            บันทึกรายรับรายจ่าย ตั้งเป้าหมายการออม และให้ AI ช่วยวางแผนการเงินของคุณ
          </p>
          <ul className="mt-8 border-t border-ink/15 text-[15px]">
            {[
              'จัดหมวดหมู่อัตโนมัติด้วย AI',
              'วางแผนออมเงินให้ถึงเป้าหมาย',
              'จำลองสถานการณ์ “ถ้า...จะเป็นอย่างไร”',
            ].map((text, i) => (
              <li
                key={text}
                className="flex items-baseline gap-4 border-b border-ink/15 py-3.5"
              >
                <span className="text-sm font-semibold tabular text-ink/45">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="eyebrow !text-ink/50">© {new Date().getFullYear()} SpendWise</p>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-canvas">
              <PiggyBank className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-ink">SpendWise</span>
          </div>

          <Eyebrow>{mode === 'login' ? 'Sign in' : 'Create account'}</Eyebrow>
          <h2 className="display mt-2 text-3xl text-ink">
            {mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'สร้างบัญชีใหม่'}
          </h2>
          <p className="mt-2 text-[15px] text-muted">
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
              <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm font-medium text-expense">
                {errors.form}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setErrors({})
              }}
              className="font-semibold text-ink underline underline-offset-4 hover:text-ink/70"
            >
              {mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            </button>
          </p>

          <p className="mt-6 flex items-center justify-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-center text-xs text-muted">
            <Check className="h-3.5 w-3.5 text-income" />
            เดโม (Phase 1): กรอกอีเมลและรหัสผ่านใดก็ได้เพื่อเข้าใช้งาน
          </p>
        </div>
      </div>
    </div>
  )
}
