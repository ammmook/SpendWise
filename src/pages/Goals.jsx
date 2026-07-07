// Goals — รายการเป้าหมาย + progress + ปุ่มให้ AI วางแผนออม
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Target, Sparkles, Trash2, TrendingDown, Clock, CalendarDays, Coins,
} from 'lucide-react'
import { getGoals, addGoal, deleteGoal, aiGoalPlan } from '../lib/api'
import { formatMoney, formatDate } from '../lib/format'
import { Button, Card, Field, Input, Modal, LoadingBlock, EmptyState } from '../components/ui'

export default function Goals() {
  const qc = useQueryClient()
  const { data: goals = [], isLoading } = useQuery({ queryKey: ['goals'], queryFn: getGoals })
  const [adding, setAdding] = useState(false)
  const invalidate = () => qc.invalidateQueries({ queryKey: ['goals'] })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink-900">เป้าหมายการออม</h2>
          <p className="text-sm text-ink-500">ตั้งเป้าและให้ AI ช่วยวางแผนให้ถึงเป้าหมาย</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> เพิ่มเป้าหมาย
        </Button>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            title="ยังไม่มีเป้าหมาย"
            description="เริ่มตั้งเป้าหมายการออมแรกของคุณ"
            action={
              <Button onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4" /> เพิ่มเป้าหมาย
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onChanged={invalidate} />
          ))}
        </div>
      )}

      {adding && (
        <GoalModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            invalidate()
          }}
        />
      )}
    </div>
  )
}

function GoalCard({ goal, onChanged }) {
  const qc = useQueryClient()
  const pct = Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100))
  const [confirming, setConfirming] = useState(false)

  const planMutation = useMutation({
    mutationFn: () => aiGoalPlan({ goal_id: goal.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
  const plan = goal.ai_plan

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-ink-900">{goal.name}</h3>
            {goal.target_date && (
              <p className="text-xs text-ink-400">ถึงกำหนด {formatDate(goal.target_date)}</p>
            )}
          </div>
        </div>
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                await deleteGoal(goal.id)
                onChanged()
              }}
              className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100"
            >
              ลบ
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg px-2 py-1 text-xs text-ink-400"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
            aria-label="ลบเป้าหมาย"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-semibold tabular text-ink-900">{formatMoney(goal.saved_amount)}</span>
          <span className="text-ink-400 tabular">/ {formatMoney(goal.target_amount)}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-500">
          ออมแล้ว {pct}% · เหลืออีก {formatMoney(goal.target_amount - goal.saved_amount)}
        </p>
      </div>

      {/* AI plan */}
      <div className="mt-4 border-t border-ink-100 pt-4">
        {!plan ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => planMutation.mutate()}
            loading={planMutation.isPending}
          >
            <Sparkles className="h-4 w-4 text-violet-500" />
            {planMutation.isPending ? 'AI กำลังวางแผน...' : 'ให้ AI วางแผนออม'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">
              <Sparkles className="h-4 w-4" /> แผนจาก AI
            </div>
            <div className="grid grid-cols-2 gap-2">
              <PlanStat icon={Coins} label="ต้องออม/เดือน" value={formatMoney(plan.required_monthly)} />
              <PlanStat icon={CalendarDays} label="เหลือเวลา" value={`${plan.months_left} เดือน`} />
              <PlanStat icon={TrendingDown} label="เงินเหลือปัจจุบัน" value={formatMoney(plan.current_surplus)} />
              <PlanStat icon={Clock} label="OT ที่ต้องทำ" value={`${plan.ot_hours_needed} ชม./เดือน`} />
            </div>

            {plan.cut_suggestions?.length > 0 && (
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="mb-2 text-xs font-medium text-ink-600">แนะนำให้ลดค่าใช้จ่าย</p>
                <ul className="space-y-1.5">
                  {plan.cut_suggestions.map((c) => (
                    <li key={c.category} className="flex items-center justify-between text-sm">
                      <span className="text-ink-600">{c.category}</span>
                      <span className="tabular text-rose-600">
                        ลด {formatMoney(c.suggested_cut)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="rounded-xl bg-violet-50 p-3 text-sm leading-relaxed text-violet-900">
              {plan.advice_th}
            </p>
            <button
              onClick={() => planMutation.mutate()}
              className="text-xs font-medium text-violet-500 hover:text-violet-700"
            >
              วางแผนใหม่อีกครั้ง
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

function PlanStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-ink-100 p-2.5">
      <div className="flex items-center gap-1.5 text-ink-400">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold tabular text-ink-900">{value}</p>
    </div>
  )
}

function GoalModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', target_amount: '', saved_amount: '', target_date: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      addGoal({
        name: form.name,
        target_amount: Number(form.target_amount),
        saved_amount: Number(form.saved_amount) || 0,
        target_date: form.target_date || null,
      }),
    onSuccess: onSaved,
    onError: (e) => setError(e.message || 'บันทึกไม่สำเร็จ'),
  })

  function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('กรุณาตั้งชื่อเป้าหมาย')
    if (!(Number(form.target_amount) > 0)) return setError('จำนวนเป้าหมายต้องมากกว่า 0')
    mutation.mutate()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="เพิ่มเป้าหมายใหม่"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button className="flex-1" onClick={submit} loading={mutation.isPending}>
            เพิ่มเป้าหมาย
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="ชื่อเป้าหมาย">
          <Input
            placeholder="เช่น เที่ยวญี่ปุ่น"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
          />
        </Field>
        <Field label="จำนวนเป้าหมาย (บาท)">
          <Input
            type="number"
            min="0"
            placeholder="60000"
            value={form.target_amount}
            onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
          />
        </Field>
        <Field label="ออมไว้แล้ว (บาท)" hint="ถ้ายังไม่มีให้เว้นว่าง">
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={form.saved_amount}
            onChange={(e) => setForm((f) => ({ ...f, saved_amount: e.target.value }))}
          />
        </Field>
        <Field label="วันที่เป้าหมาย" hint="ไม่บังคับ">
          <Input
            type="date"
            value={form.target_date}
            onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
          />
        </Field>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </form>
    </Modal>
  )
}
