// ปฏิทินรายเดือน — แต่ละช่องสรุปรายรับ(เขียว)/รายจ่าย(แดง) ของวันนั้น
// คลิกวันเพื่อไปดูรายการของวันนั้นในแท็บ Daily
import { formatCompact, todayISO } from '../lib/format'

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export default function Calendar({ month, dailyTotals, selectedDate, onSelectDate }) {
  const [y, m] = month.split('-').map(Number)
  const firstWeekday = new Date(y, m - 1, 1).getDay() // 0 = อาทิตย์
  const daysInMonth = new Date(y, m, 0).getDate()
  const today = todayISO()

  // เซลล์นำหน้า (ช่องว่างก่อนวันที่ 1) + วันของเดือน
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }

  return (
    <div>
      {/* หัวตารางวัน */}
      <div className="mb-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1 text-center text-[11px] font-medium ${
              i === 0 || i === 6 ? 'text-expense/70' : 'text-muted'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* ช่องวันที่ */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((date, idx) => {
          if (!date) return <div key={`e${idx}`} aria-hidden="true" />
          const totals = dailyTotals[date]
          const isToday = date === today
          const isSelected = date === selectedDate
          const dayNum = Number(date.slice(8))

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`group flex min-h-[58px] flex-col rounded-xl border p-1.5 text-left transition-[background-color,border-color] duration-200 ease-out sm:min-h-[76px] sm:p-2 ${
                isSelected
                  ? 'border-ink bg-ink text-canvas'
                  : isToday
                    ? 'border-ink/30 bg-surface-card'
                    : 'border-hairline bg-canvas hover:border-ink/20 hover:bg-surface-card'
              }`}
            >
              <span
                className={`text-xs font-semibold tabular sm:text-sm ${
                  isSelected ? 'text-canvas' : isToday ? 'text-ink' : 'text-ink'
                }`}
              >
                {dayNum}
              </span>
              {totals && (
                <span className="mt-auto flex flex-col gap-0.5 leading-tight">
                  {totals.income > 0 && (
                    <span
                      className={`text-[9px] font-medium tabular sm:text-[11px] ${
                        isSelected ? 'text-mint' : 'text-income'
                      }`}
                    >
                      +{formatCompact(totals.income)}
                    </span>
                  )}
                  {totals.expense > 0 && (
                    <span
                      className={`text-[9px] font-medium tabular sm:text-[11px] ${
                        isSelected ? 'text-peach' : 'text-expense'
                      }`}
                    >
                      -{formatCompact(totals.expense)}
                    </span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
