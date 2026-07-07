// ตัวเลือกเดือน (ก่อนหน้า / ถัดไป) — ห้ามเลือกเดือนอนาคตเกินเดือนปัจจุบัน
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { currentMonthKey, formatMonthLabel, shiftMonth } from '../lib/format'

export default function MonthPicker({ value, onChange }) {
  const thisMonth = currentMonthKey()
  const atCurrent = value >= thisMonth

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1">
      <button
        onClick={() => onChange(shiftMonth(value, -1))}
        className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
        aria-label="เดือนก่อนหน้า"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[130px] text-center text-sm font-medium text-ink-800 tabular">
        {formatMonthLabel(value)}
      </span>
      <button
        onClick={() => !atCurrent && onChange(shiftMonth(value, 1))}
        disabled={atCurrent}
        className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:hover:bg-transparent"
        aria-label="เดือนถัดไป"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
