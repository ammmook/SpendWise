// Goals — รายการเป้าหมาย + progress + ปุ่มให้ AI วางแผนออม
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Target, Sparkles, Trash2, TrendingDown, Clock, CalendarDays, Coins,
} from 'lucide-react'
import { getGoals, addGoal, deleteGoal, aiGoalPlan } from '../lib/api'
import { formatMoney, formatMoneyShort, formatDate } from '../lib/format'
import {
  Button, Card, Field, Input, Modal, Skeleton, EmptyState,
} from '../components/ui'

export default function Goals() {
  const qc = useQueryClient()
  const { data: goals = [], isLoading } = useQuery({ queryKey: ['goals'], queryFn: getGoals })
  const [adding, setAdding] = useState(false)
  const invalidate = () => qc.invalidateQueries({ queryKey: ['goals'] })

  return (
    <div className="space-y-6">
      {/* ไม่แสดงชื่อหน้าตามดีไซน์ใหม่ */}
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> เพิ่มเป้าหมาย
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
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
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
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
    <Card interactive className="flex flex-col p-3 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender text-ink sm:h-10 sm:w-10">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink sm:text-base">{goal.name}</h3>
            {goal.target_date && (
              <p className="truncate text-[10px] text-muted sm:text-xs">
                ถึงกำหนด {formatDate(goal.target_date)}
              </p>
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
              className="rounded-lg bg-expense/10 px-3 py-1 text-xs font-medium text-expense hover:bg-expense/20"
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
            className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"
            aria-label="ลบเป้าหมาย"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="mt-3 sm:mt-5">
        <div className="mb-1.5 flex items-baseline justify-between gap-1 text-xs sm:text-sm">
          <span className="truncate font-semibold tabular text-ink">{formatMoneyShort(goal.saved_amount)}</span>
          <span className="shrink-0 text-muted tabular">/ {formatMoneyShort(goal.target_amount)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-hairline-soft sm:h-2.5">
          <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-[10px] text-muted sm:text-xs">
          ออมแล้ว {pct}% · เหลือ {formatMoneyShort(goal.target_amount - goal.saved_amount)}
        </p>
      </div>

      {/* AI plan */}
      <div className="mt-3 border-t border-hairline-soft pt-3 sm:mt-5 sm:pt-5">
        {!plan ? (
          <Button
            variant="ai"
            size="sm"
            className="w-full"
            onClick={() => planMutation.mutate()}
            loading={planMutation.isPending}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {planMutation.isPending ? 'AI กำลังวางแผน...' : 'ให้ AI วางแผนออม'}
          </Button>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <span className="ai-gradient flex h-5 w-5 items-center justify-center rounded-full text-white">
                <Sparkles className="h-3 w-3" />
              </span>
              <p className="ai-gradient-text text-[11px] font-semibold uppercase tracking-wider">AI Plan</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <PlanStat icon={Coins} label="ต้องออม/เดือน" value={formatMoney(plan.required_monthly)} />
              <PlanStat icon={CalendarDays} label="เหลือเวลา" value={`${plan.months_left} เดือน`} />
              <PlanStat icon={TrendingDown} label="เงินเหลือปัจจุบัน" value={formatMoney(plan.current_surplus)} />
              <PlanStat icon={Clock} label="OT ที่ต้องทำ" value={`${plan.ot_hours_needed} ชม./เดือน`} />
            </div>

            {plan.cut_suggestions?.length > 0 && (
              <div className="rounded-xl bg-surface-card p-2.5">
                <p className="mb-1.5 text-[10px] font-medium text-muted sm:text-xs">แนะนำให้ลดค่าใช้จ่าย</p>
                <ul className="space-y-1">
                  {plan.cut_suggestions.map((c) => (
                    <li key={c.category} className="flex items-center justify-between gap-1 text-[11px] sm:text-sm">
                      <span className="truncate text-ink">{c.category}</span>
                      <span className="shrink-0 tabular text-ink">ลด {formatMoneyShort(c.suggested_cut)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* คำแนะนำจาก AI — ใช้ธีม gradient ของ AI */}
            <p className="ai-gradient rounded-xl p-3 text-[11px] leading-relaxed text-white sm:text-sm">
              {plan.advice_th}
            </p>
            <button
              onClick={() => planMutation.mutate()}
              className="text-[10px] font-medium text-muted underline underline-offset-2 hover:text-ink sm:text-xs"
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
    <div className="rounded-xl border border-hairline p-2">
      <div className="flex items-center gap-1 text-muted">
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate text-[10px]">{label}</span>
      </div>
      <p className="mt-0.5 truncate text-[11px] font-semibold tabular text-ink sm:text-sm">{value}</p>
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
        {error && <p className="text-sm font-medium text-expense">{error}</p>}
      </form>
    </Modal>
  )
}
