// ตั้งค่าเงินเดือน — เชื่อมบัญชีเว็บเดิม (auto sync) หรือกำหนดเอง + วันเงินเข้า
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link2, Link2Off, Wallet, CalendarClock, Check, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  getMe, linkSalaryAccount, unlinkSalaryAccount, updateSalarySettings,
} from '../lib/api'
import { formatMoney } from '../lib/format'
import { Button, Card, Field, Input, Select, Skeleton } from '../components/ui'
import PageHeader from '../components/PageHeader'

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1)

export default function SalarySettings() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe })

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['me'] })
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['analytics'] })
  }

  const linkMutation = useMutation({ mutationFn: linkSalaryAccount, onSuccess: refreshAll })
  const unlinkMutation = useMutation({ mutationFn: unlinkSalaryAccount, onSuccess: refreshAll })

  return (
    <div className="space-y-4">
      <PageHeader title="ตั้งค่าเงินเดือน" />

      {isLoading || !me ? (
        <>
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </>
      ) : me.salary_synced ? (
        <LinkedCard me={me} user={user} onUnlink={() => unlinkMutation.mutate()} unlinking={unlinkMutation.isPending} />
      ) : (
        <>
          {/* เชื่อมกับบัญชีเดิม */}
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender text-ink">
                <Link2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-ink">เชื่อมข้อมูลจากบัญชีเดิม</h3>
                <p className="mt-1 text-sm text-muted">
                  ถ้าเคยใช้เว็บเดิม ระบบจะดึงเงินเดือนมาให้ และบันทึกรายรับให้อัตโนมัติทุกเดือน
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={() => linkMutation.mutate()} loading={linkMutation.isPending}>
              <Link2 className="h-4 w-4" />
              เชื่อมต่อบัญชีเดิม
            </Button>
          </Card>

          <div className="flex items-center gap-3 px-1">
            <span className="h-px flex-1 bg-hairline" />
            <span className="text-xs text-muted-soft">หรือตั้งค่าเอง</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          {/* ตั้งค่าเอง */}
          <ManualForm me={me} onSaved={refreshAll} />
        </>
      )}
    </div>
  )
}

function LinkedCard({ me, user, onUnlink, unlinking }) {
  return (
    <>
      <Card className="p-5">
        <div className="flex items-center gap-2 text-income">
          <Check className="h-4 w-4" />
          <span className="text-sm font-semibold">เชื่อมต่อกับบัญชีเดิมแล้ว</span>
        </div>
        {user?.email && <p className="mt-1 text-xs text-muted">{user.email}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-hairline p-3">
            <div className="flex items-center gap-1.5 text-muted">
              <Wallet className="h-3.5 w-3.5" />
              <span className="text-[11px]">เงินเดือน</span>
            </div>
            <p className="mt-1 text-lg font-semibold tabular text-ink">{formatMoney(me.base_salary)}</p>
          </div>
          <div className="rounded-xl border border-hairline p-3">
            <div className="flex items-center gap-1.5 text-muted">
              <CalendarClock className="h-3.5 w-3.5" />
              <span className="text-[11px]">เงินเข้าทุกวันที่</span>
            </div>
            <p className="mt-1 text-lg font-semibold tabular text-ink">{me.salary_day}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface-card p-3 text-xs text-muted">
          <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          บันทึกเงินเดือนเป็นรายรับให้อัตโนมัติทุกเดือน ไม่ต้องเพิ่มเอง
        </div>
      </Card>

      <Button variant="danger" className="w-full" onClick={onUnlink} loading={unlinking}>
        <Link2Off className="h-4 w-4" />
        ยกเลิกการเชื่อมต่อ
      </Button>
    </>
  )
}

function ManualForm({ me, onSaved }) {
  const [form, setForm] = useState({
    base_salary: me.base_salary || '',
    salary_day: me.salary_day || 1,
    salary_auto: me.salary_auto ?? true,
  })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: () => updateSalarySettings(form),
    onSuccess: () => {
      onSaved()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
    onError: (e) => setError(e.message || 'บันทึกไม่สำเร็จ'),
  })

  function submit(e) {
    e.preventDefault()
    setError('')
    if (!(Number(form.base_salary) > 0)) return setError('กรุณากรอกเงินเดือน')
    mutation.mutate()
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-ink">ตั้งค่าเงินเดือนเอง</h3>
      <p className="mt-1 text-sm text-muted">กำหนดเงินเดือนและวันที่ให้ระบบบันทึกรายรับอัตโนมัติ</p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <Field label="เงินเดือน (บาท/เดือน)">
          <Input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="32,000"
            value={form.base_salary}
            onChange={(e) => setForm((f) => ({ ...f, base_salary: e.target.value }))}
          />
        </Field>

        <Field label="ให้เงินเข้าทุกวันที่" hint="ระบบจะบันทึกเงินเดือนเป็นรายรับให้ทุกเดือนในวันนี้">
          <Select
            value={form.salary_day}
            onChange={(e) => setForm((f) => ({ ...f, salary_day: Number(e.target.value) }))}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                วันที่ {d}
              </option>
            ))}
          </Select>
        </Field>

        {/* เปิด/ปิดบันทึกอัตโนมัติ */}
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, salary_auto: !f.salary_auto }))}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-hairline p-3 text-left"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">บันทึกรายรับอัตโนมัติ</p>
            <p className="truncate text-xs text-muted">เพิ่มเงินเดือนเป็นรายรับให้ทุกเดือน</p>
          </div>
          <span
            aria-hidden="true"
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
              form.salary_auto ? 'bg-ink' : 'bg-hairline'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-canvas transition-transform duration-200 ${
                form.salary_auto ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>

        {error && <p className="text-sm font-medium text-expense">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={mutation.isPending}>
            บันทึก
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm font-medium text-income">
              <Check className="h-4 w-4" /> บันทึกแล้ว
            </span>
          )}
        </div>
      </form>
    </Card>
  )
}
