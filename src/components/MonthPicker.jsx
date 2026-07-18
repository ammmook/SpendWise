// ตัวเลือกเดือน (ก่อนหน้า / ถัดไป) — pill + hairline ตาม DESIGN.md
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { currentMonthKey, formatMonthLabel, shiftMonth } from '../lib/format'

export default function MonthPicker({ value, onChange }) {
  const thisMonth = currentMonthKey()
  const atCurrent = value >= thisMonth

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas p-1">
      <button
        onClick={() => onChange(shiftMonth(value, -1))}
        className="rounded-full p-1.5 text-ink hover:bg-surface-card"
        aria-label="เดือนก่อนหน้า"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[128px] text-center text-sm font-medium text-ink tabular">
        {formatMonthLabel(value)}
      </span>
      <button
        onClick={() => !atCurrent && onChange(shiftMonth(value, 1))}
        disabled={atCurrent}
        className="rounded-full p-1.5 text-ink hover:bg-surface-card disabled:opacity-25 disabled:hover:bg-transparent"
        aria-label="เดือนถัดไป"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
