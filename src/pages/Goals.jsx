// Goals — รายการเป้าหมาย + progress + ปุ่มให้ AI วางแผนออม
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Target, Sparkles, Trash2, TrendingDown, Clock, CalendarDays, Coins,
} from 'lucide-react'
import { getGoals, addGoal, deleteGoal, aiGoalPlan } from '../lib/api'
import { formatMoney, formatDate } from '../lib/format'
import {
  Button, Card, Eyebrow, Field, Input, Modal, Skeleton, EmptyState,
} from '../components/ui'

export default function Goals() {
  const qc = useQueryClient()
  const { data: goals = [], isLoading } = useQuery({ queryKey: ['goals'], queryFn: getGoals })
  const [adding, setAdding] = useState(false)
  const invalidate = () => qc.invalidateQueries({ queryKey: ['goals'] })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Goals</Eyebrow>
          <h2 className="display mt-1 text-2xl text-ink">เป้าหมายการออม</h2>
          <p className="mt-1 text-sm text-muted">ตั้งเป้าและให้ AI ช่วยวางแผนให้ถึงเป้าหมาย</p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> เพิ่มเป้าหมาย
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
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
    <Card interactive className="flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lilac text-ink">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-ink">{goal.name}</h3>
            {goal.target_date && (
              <p className="text-xs text-muted">ถึงกำหนด {formatDate(goal.target_date)}</p>
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
              className="rounded-full bg-[#fbeeee] px-3 py-1 text-xs font-medium text-[#e34948] hover:bg-[#f7dede]"
            >
              ลบ
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-full p-1.5 text-muted hover:bg-[#fbeeee] hover:text-[#e34948]"
            aria-label="ลบเป้าหมาย"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-semibold tabular text-ink">{formatMoney(goal.saved_amount)}</span>
          <span className="text-muted tabular">/ {formatMoney(goal.target_amount)}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-hairline-soft">
          <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          ออมแล้ว {pct}% · เหลืออีก {formatMoney(goal.target_amount - goal.saved_amount)}
        </p>
      </div>

      {/* AI plan */}
      <div className="mt-5 border-t border-hairline-soft pt-5">
        {!plan ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => planMutation.mutate()}
            loading={planMutation.isPending}
          >
            <Sparkles className="h-4 w-4" />
            {planMutation.isPending ? 'AI กำลังวางแผน...' : 'ให้ AI วางแผนออม'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="eyebrow">AI Plan</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <PlanStat icon={Coins} label="ต้องออม/เดือน" value={formatMoney(plan.required_monthly)} />
              <PlanStat icon={CalendarDays} label="เหลือเวลา" value={`${plan.months_left} เดือน`} />
              <PlanStat icon={TrendingDown} label="เงินเหลือปัจจุบัน" value={formatMoney(plan.current_surplus)} />
              <PlanStat icon={Clock} label="OT ที่ต้องทำ" value={`${plan.ot_hours_needed} ชม./เดือน`} />
            </div>

            {plan.cut_suggestions?.length > 0 && (
              <div className="rounded-2xl bg-surface p-3">
                <p className="mb-2 text-xs font-medium text-muted">แนะนำให้ลดค่าใช้จ่าย</p>
                <ul className="space-y-1.5">
                  {plan.cut_suggestions.map((c) => (
                    <li key={c.category} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{c.category}</span>
                      <span className="tabular text-ink">ลด {formatMoney(c.suggested_cut)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="rounded-2xl bg-lilac p-4 text-sm leading-relaxed text-ink">{plan.advice_th}</p>
            <button
              onClick={() => planMutation.mutate()}
              className="text-xs font-medium text-ink underline underline-offset-2 hover:text-muted"
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
    <div className="rounded-2xl border border-hairline p-3">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold tabular text-ink">{value}</p>
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
        {error && <p className="text-sm font-medium text-[#e34948]">{error}</p>}
      </form>
    </Modal>
  )
}
