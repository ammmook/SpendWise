// Home — หน้าแรกหลัง login: แท็บ "รายเดือน" (ปฏิทิน) และ "รายวัน" (รายการของวัน)
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays, ListChecks, ChevronLeft, ChevronRight, Pencil, Trash2,
  Clock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { getTransactions, getCategories, deleteTransaction } from '../lib/api'
import { FUNDING_SOURCES } from '../lib/mockData'
import {
  formatMoney, formatMoneyShort, formatDateLong, formatTime, currentMonthKey, todayISO,
} from '../lib/format'
import { Card, CategoryIcon, Skeleton, EmptyState } from '../components/ui'
import MonthPicker from '../components/MonthPicker'
import Calendar from '../components/Calendar'
import TransactionModal from '../components/TransactionModal'
import QuickAddModal from '../components/QuickAdd'
import { Fab, FabMenu } from '../components/Fab'

/** ข้อมูลแหล่งเงินของรายการ (รองรับ 'อื่นๆ' ที่ผู้ใช้พิมพ์เอง) */
function sourceOf(tx) {
  const preset = FUNDING_SOURCES.find((s) => s.id === tx.funding_source)
  if (!preset) return null
  return {
    icon: preset.icon,
    label: tx.funding_source === 'other' && tx.funding_source_label ? tx.funding_source_label : preset.label,
  }
}

const INCOME_COLOR = '#22c55e'
const EXPENSE_COLOR = '#ef4444'

function shiftDay(dateISO, delta) {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return todayISO(d)
}

export default function Home() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('monthly')
  const [month, setMonth] = useState(currentMonthKey())
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [editing, setEditing] = useState(null) // tx | 'new' | null
  const [menuOpen, setMenuOpen] = useState(false) // เมนูของ FAB
  const [aiOpen, setAiOpen] = useState(false) // โมดัล AI Quick Add

  const activeMonth = tab === 'monthly' ? month : selectedDate.slice(0, 7)
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: txns = [], isLoading } = useQuery({
    queryKey: ['transactions', { month: activeMonth }],
    queryFn: () => getTransactions({ month: activeMonth }),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
    qc.invalidateQueries({ queryKey: ['yearly'] })
    qc.invalidateQueries({ queryKey: ['goals'] }) // ออมเข้าเป้าหมาย → อัปเดตยอดสะสม
  }

  const dailyTotals = useMemo(() => {
    const map = {}
    for (const t of txns) {
      const d = t.transaction_date
      if (!map[d]) map[d] = { income: 0, expense: 0 }
      map[d][t.type] += t.amount
    }
    return map
  }, [txns])

  const dayTxns = useMemo(
    () =>
      txns
        .filter((t) => t.transaction_date === selectedDate)
        .sort((a, b) => (a.created_at || a.transaction_date).localeCompare(b.created_at || b.transaction_date)),
    [txns, selectedDate],
  )

  const daySummary = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of dayTxns) {
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense, net: income - expense }
  }, [dayTxns])

  const openDay = (dateISO) => {
    setSelectedDate(dateISO)
    setTab('daily')
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="inline-flex rounded-full border border-hairline bg-canvas p-1">
        <TabButton active={tab === 'monthly'} onClick={() => setTab('monthly')} icon={CalendarDays} label="รายเดือน" />
        <TabButton active={tab === 'daily'} onClick={() => setTab('daily')} icon={ListChecks} label="รายวัน" />
      </div>

      {/* เนื้อหาแท็บ (fade-up ตอนสลับ) */}
      <div key={tab} className="animate-fade-up">
        {tab === 'monthly' ? (
          <MonthlyView
            month={month}
            onMonth={setMonth}
            dailyTotals={dailyTotals}
            selectedDate={selectedDate}
            onSelectDate={openDay}
            isLoading={isLoading}
          />
        ) : (
          <DailyView
            selectedDate={selectedDate}
            onDate={setSelectedDate}
            dayTxns={dayTxns}
            summary={daySummary}
            isLoading={isLoading}
            onEdit={(t) => setEditing(t)}
            onDelete={async (id) => {
              await deleteTransaction(id)
              invalidate()
            }}
          />
        )}
      </div>

      {/* ปุ่มลอยเพิ่มรายการ */}
      <Fab onClick={() => setMenuOpen(true)} />

      {menuOpen && (
        <FabMenu
          onClose={() => setMenuOpen(false)}
          onManual={() => {
            setMenuOpen(false)
            setEditing('new')
          }}
          onAi={() => {
            setMenuOpen(false)
            setAiOpen(true)
          }}
        />
      )}

      {aiOpen && (
        <QuickAddModal
          categories={categories}
          defaultDate={tab === 'daily' ? selectedDate : todayISO()}
          onClose={() => setAiOpen(false)}
          onSaved={() => {
            setAiOpen(false)
            invalidate()
          }}
        />
      )}

      {editing && (
        <TransactionModal
          tx={editing === 'new' ? null : editing}
          categories={categories}
          defaultDate={tab === 'daily' ? selectedDate : todayISO()}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            invalidate()
          }}
        />
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.97] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
        active ? 'bg-surface-card text-ink' : 'text-muted hover:bg-surface-card-card hover:text-ink'
      }`}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      {label}
    </button>
  )
}

// ---------------- Monthly ----------------
function MonthlyView({ month, onMonth, dailyTotals, selectedDate, onSelectDate, isLoading }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthPicker value={month} onChange={onMonth} />
      </div>
      <Card interactive className="p-3 sm:p-4">
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px] rounded-xl sm:h-[76px]" />
            ))}
          </div>
        ) : (
          <Calendar
            month={month}
            dailyTotals={dailyTotals}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
          />
        )}
      </Card>
    </div>
  )
}

// ---------------- Daily ----------------
function DailyView({ selectedDate, onDate, dayTxns, summary, isLoading, onEdit, onDelete }) {
  const today = todayISO()
  const isToday = selectedDate === today

  return (
    <div className="space-y-4">
      {/* ตัวเลือกวัน */}
      <Card className="flex items-center justify-between p-2">
        <button
          onClick={() => onDate(shiftDay(selectedDate, -1))}
          className="rounded-full p-2 text-ink transition hover:bg-surface-card"
          aria-label="วันก่อนหน้า"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-ink">{formatDateLong(selectedDate)}</p>
          {!isToday && (
            <button
              onClick={() => onDate(today)}
              className="text-xs font-medium text-ink underline underline-offset-2 hover:text-muted"
            >
              กลับไปวันนี้
            </button>
          )}
        </div>
        <button
          onClick={() => !isToday && onDate(shiftDay(selectedDate, 1))}
          disabled={isToday}
          className="rounded-full p-2 text-ink transition hover:bg-surface-card disabled:opacity-25 disabled:hover:bg-transparent"
          aria-label="วันถัดไป"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </Card>

      {/* รายการของวัน */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <ul className="divide-y divide-hairline-soft">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3 rounded" />
                  <Skeleton className="h-3 w-1/5 rounded" />
                </div>
                <Skeleton className="h-4 w-20 rounded" />
              </li>
            ))}
          </ul>
        ) : dayTxns.length === 0 ? (
          <EmptyState title="ไม่มีรายการในวันนี้" description="ยังไม่มีการบันทึกรายรับหรือรายจ่ายของวันนี้" />
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {dayTxns.map((t, i) => (
              <DayRow key={t.id} tx={t} index={i} onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} />
            ))}
          </ul>
        )}
      </Card>

      {/* สรุปประจำวัน (fade เมื่อเปลี่ยนวัน) */}
      <div key={selectedDate} className="animate-fade-in grid grid-cols-3 gap-3">
        <SummaryTile label="รายรับ" value={summary.income} icon={ArrowUpRight} color={INCOME_COLOR} />
        <SummaryTile label="รายจ่าย" value={summary.expense} icon={ArrowDownRight} color={EXPENSE_COLOR} />
        <SummaryTile
          label="คงเหลือ"
          value={summary.net}
          icon={summary.net >= 0 ? ArrowUpRight : ArrowDownRight}
          color={summary.net >= 0 ? '#000' : EXPENSE_COLOR}
          net
        />
      </div>
    </div>
  )
}

function SummaryTile({ label, value, icon: Icon, color, net }) {
  return (
    <Card interactive className={`p-2.5 sm:p-4 ${net ? 'bg-surface-card' : ''}`}>
      <div className="flex items-center gap-1 text-muted">
        <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" style={{ color }} />
        <span className="truncate text-[10px] sm:text-[11px]">{label}</span>
      </div>
      <p className="mt-1 text-[13px] font-semibold tabular sm:text-base" style={{ color }}>
        {formatMoneyShort(value)}
      </p>
    </Card>
  )
}

function DayRow({ tx, index, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const isIncome = tx.type === 'income'
  const src = sourceOf(tx)

  return (
    <li
      className="group flex animate-fade-up items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-surface-card/60 sm:gap-3 sm:px-4 sm:py-3"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-card text-ink sm:h-10 sm:w-10">
        <CategoryIcon name={tx.category?.icon} className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        {/* รายการที่ AI สร้าง แสดงผลเหมือนรายการที่กรอกเอง (ไม่มีป้าย AI) */}
        <p className="truncate text-sm font-medium text-ink">
          {tx.description || tx.category?.name_th || 'ไม่มีรายละเอียด'}
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
          <Clock className="h-3 w-3" />
          {formatTime(tx.created_at)} · {tx.category?.name_th || 'ไม่ระบุหมวด'}
          {src && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <CategoryIcon name={src.icon} className="h-3 w-3" />
                {src.label}
              </span>
            </>
          )}
        </p>
      </div>

      <span
        className="shrink-0 text-sm font-semibold tabular"
        style={{ color: isIncome ? INCOME_COLOR : '#0a0a0a' }}
      >
        {isIncome ? '+' : '-'}
        {formatMoney(tx.amount)}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        {confirming ? (
          <>
            <button
              onClick={onDelete}
              className="rounded-lg bg-expense/10 px-3 py-1 text-xs font-medium text-expense hover:bg-expense/20"
            >
              ลบเลย
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink"
            >
              ยกเลิก
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="rounded-full p-1.5 text-muted transition hover:bg-surface-card hover:text-ink sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="แก้ไข"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg p-1.5 text-muted transition hover:bg-expense/10 hover:text-expense sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="ลบ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </li>
  )
}
