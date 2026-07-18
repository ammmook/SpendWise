// Analytics — วิเคราะห์การเงิน 3 แท็บ (สัปดาห์/เดือน/ปี) × ตัวกรอง (รายรับรายจ่าย/การออม)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import {
  CalendarDays, CalendarRange, CalendarClock, PieChart as PieIcon, BarChart3,
  ArrowLeftRight, PiggyBank, Landmark,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { getAnalytics } from '../lib/api'
import {
  formatMoney, formatMoneyShort, formatMonthShort, formatMonthAbbr, formatWeekRange,
  currentMonthKey, todayISO,
} from '../lib/format'
import { Card, Skeleton, EmptyState } from '../components/ui'
import MonthPicker from '../components/MonthPicker'

const CAT_COLORS = ['#2a78d6', '#22c55e', '#eda100', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834']
const OTHER_COLOR = '#9a9a95'
const INCOME_COLOR = '#22c55e'
const EXPENSE_COLOR = '#ef4444'
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

function shiftDay(dateISO, delta) {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return todayISO(d)
}
function weekStart(dateISO) {
  const d = new Date(`${dateISO}T00:00:00`)
  d.setDate(d.getDate() - d.getDay())
  return todayISO(d)
}

// label ของแกน X ตามช่วงเวลา
function flowLabel(period, key) {
  if (period === 'week') return WEEKDAYS[new Date(`${key}T00:00:00`).getDay()]
  if (period === 'month') return String(Number(key.slice(8)))
  return formatMonthAbbr(key) // รายปี: ตัวย่อเดือนอย่างเดียว ไม่มี ค.ศ.
}

// ยุบหมวดเกิน 6 อันเป็น "อื่นๆ"
function toPie(breakdown) {
  if (breakdown.length <= 7) return breakdown.map((b, i) => ({ ...b, color: CAT_COLORS[i] }))
  const head = breakdown.slice(0, 6).map((b, i) => ({ ...b, color: CAT_COLORS[i] }))
  const rest = breakdown.slice(6).reduce((s, b) => s + b.total, 0)
  return [...head, { category_id: 'other', name_th: 'อื่นๆ', total: rest, color: OTHER_COLOR }]
}

// ---------- primitives ----------
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-hairline bg-white px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium text-ink">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="tabular text-ink">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ background: p.color || p.payload?.fill }}
          />
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  )
}

function Segmented({ value, onChange, options, className = '' }) {
  return (
    <div className={`inline-flex rounded-full bg-surface-card p-1 ${className}`}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-label={o.srLabel || o.label}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 active:scale-[0.98] sm:text-sm ${
              active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {o.icon && <o.icon className="h-3.5 w-3.5" />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function PieLegend({ data }) {
  if (!data.length) return null
  return (
    <ul className="mt-4 space-y-2">
      {data.map((b) => (
        <li key={b.category_id ?? b.name} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-ink">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
            {b.name_th ?? b.name}
          </span>
          <span className="font-medium tabular text-ink">{formatMoney(b.total ?? b.value)}</span>
        </li>
      ))}
    </ul>
  )
}

function Donut({ data, centerLabel, centerValue }) {
  return (
    <div className="relative mx-auto h-52 w-full max-w-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={data[0]?.total != null ? 'total' : 'value'}
            nameKey={data[0]?.name_th != null ? 'name_th' : 'name'}
            innerRadius={62}
            outerRadius={90}
            paddingAngle={2}
            stroke="#ffffff"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted">{centerLabel}</span>
          <span className="text-lg font-semibold tabular text-ink">{centerValue}</span>
        </div>
      )}
    </div>
  )
}

function FlowBars({ period, data }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -18, right: 8, top: 8 }} barCategoryGap={period === 'month' ? 1 : '20%'}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f3" vertical={false} />
          <XAxis
            dataKey="key"
            tickFormatter={(k) => flowLabel(period, k)}
            tick={{ fontSize: 11, fill: '#6a6a6a' }}
            tickLine={false}
            axisLine={false}
            interval={period === 'month' ? 3 : 0}
          />
          <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} tick={{ fontSize: 12, fill: '#6a6a6a' }} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<ChartTooltip />} labelFormatter={(k) => flowLabel(period, k)} cursor={{ fill: '#f3f3f5' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="รายรับ" fill={INCOME_COLOR} radius={[3, 3, 0, 0]} />
          <Bar dataKey="expense" name="รายจ่าย" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function TrendLine({ data, series }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f3" vertical={false} />
          <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fontSize: 12, fill: '#6a6a6a' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} tick={{ fontSize: 12, fill: '#6a6a6a' }} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<ChartTooltip />} labelFormatter={formatMonthShort} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function SavingsMonthBars({ data }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f3" vertical={false} />
          <XAxis dataKey="key" tickFormatter={formatMonthAbbr} tick={{ fontSize: 11, fill: '#6a6a6a' }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} tick={{ fontSize: 12, fill: '#6a6a6a' }} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<ChartTooltip />} labelFormatter={formatMonthShort} cursor={{ fill: '#f3f3f5' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="saved" name="ออมเข้า" fill={INCOME_COLOR} radius={[3, 3, 0, 0]} />
          <Bar dataKey="withdrawn" name="ออมออก" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SectionCard({ title, action, children }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="display text-base text-ink sm:text-lg">{title}</h3>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

// ---------- period pickers ----------
function WeekPicker({ value, onChange }) {
  const start = weekStart(value)
  const end = shiftDay(start, 6)
  const atCurrent = weekStart(todayISO()) <= start
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white p-1">
      <button onClick={() => onChange(shiftDay(value, -7))} className="rounded-full p-1.5 text-ink hover:bg-surface-card" aria-label="สัปดาห์ก่อน">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[150px] text-center text-xs font-medium tabular text-ink sm:text-sm">
        {formatWeekRange(start, end)}
      </span>
      <button onClick={() => !atCurrent && onChange(shiftDay(value, 7))} disabled={atCurrent} className="rounded-full p-1.5 text-ink hover:bg-surface-card disabled:opacity-25 disabled:hover:bg-transparent" aria-label="สัปดาห์ถัดไป">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function YearPicker({ value, onChange }) {
  const thisYear = new Date().getFullYear()
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white p-1">
      <button onClick={() => onChange(value - 1)} className="rounded-full p-1.5 text-ink hover:bg-surface-card" aria-label="ปีก่อน">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[96px] text-center text-sm font-medium tabular text-ink">ปี {value + 543}</span>
      <button onClick={() => value < thisYear && onChange(value + 1)} disabled={value >= thisYear} className="rounded-full p-1.5 text-ink hover:bg-surface-card disabled:opacity-25 disabled:hover:bg-transparent" aria-label="ปีถัดไป">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ---------- main ----------
export default function Dashboard() {
  const [period, setPeriod] = useState('month') // week | month | year
  const [filter, setFilter] = useState('flow') // flow | savings
  const [chartType, setChartType] = useState('pie') // pie | bar
  const [pieType, setPieType] = useState('expense') // expense | income
  const [savingsChart, setSavingsChart] = useState('donut') // donut | bar (รายปี)

  const [week, setWeek] = useState(todayISO())
  const [month, setMonth] = useState(currentMonthKey())
  const [year, setYear] = useState(new Date().getFullYear())
  const anchor = period === 'week' ? week : period === 'year' ? year : month

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', period, anchor],
    queryFn: () => getAnalytics({ period, anchor }),
  })

  return (
    <div className="space-y-4">
      {/* แท็บช่วงเวลา */}
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'week', label: 'รายสัปดาห์', icon: CalendarClock },
          { value: 'month', label: 'รายเดือน', icon: CalendarDays },
          { value: 'year', label: 'รายปี', icon: CalendarRange },
        ]}
      />

      {/* ตัวกรอง (ซ้าย) + ตัวเลือกช่วงเวลา (ขวา) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'flow', label: 'รายรับ-รายจ่าย', icon: ArrowLeftRight },
            { value: 'savings', label: 'การออม', icon: PiggyBank },
          ]}
        />
        {period === 'week' ? (
          <WeekPicker value={week} onChange={setWeek} />
        ) : period === 'year' ? (
          <YearPicker value={year} onChange={setYear} />
        ) : (
          <MonthPicker value={month} onChange={setMonth} />
        )}
      </div>

      {isLoading || !data ? (
        <div className="space-y-5">
          <Skeleton className="h-96 rounded-2xl" />
          {period === 'month' && <Skeleton className="h-72 rounded-2xl" />}
        </div>
      ) : filter === 'flow' ? (
        <div key={`flow-${period}-${anchor}`} className="animate-fade-up space-y-5">
          <FlowSection period={period} data={data} chartType={chartType} setChartType={setChartType} pieType={pieType} setPieType={setPieType} />
          {period === 'month' && data.trend6 && (
            <SectionCard title="แนวโน้ม 6 เดือน">
              <TrendLine
                data={data.trend6}
                series={[
                  { key: 'income', name: 'รายรับ', color: INCOME_COLOR },
                  { key: 'expense', name: 'รายจ่าย', color: EXPENSE_COLOR },
                ]}
              />
            </SectionCard>
          )}
        </div>
      ) : (
        <div key={`sav-${period}-${anchor}`} className="animate-fade-up space-y-5">
          <SavingsSection period={period} data={data} savingsChart={savingsChart} setSavingsChart={setSavingsChart} />
          {period === 'month' && data.trend6savings && (
            <SectionCard title="แนวโน้มการออม 6 เดือน">
              <TrendLine
                data={data.trend6savings}
                series={[
                  { key: 'saved', name: 'ออมเข้า', color: INCOME_COLOR },
                  { key: 'withdrawn', name: 'ออมออก', color: EXPENSE_COLOR },
                ]}
              />
            </SectionCard>
          )}
        </div>
      )}
    </div>
  )
}

function FlowSection({ period, data, chartType, setChartType, pieType, setPieType }) {
  const pieData = toPie(pieType === 'expense' ? data.expense_breakdown : data.income_breakdown)

  return (
    <SectionCard
      title="สรุปรายรับ-รายจ่าย"
      action={
        <Segmented
          value={chartType}
          onChange={setChartType}
          options={[
            { value: 'pie', icon: PieIcon, srLabel: 'กราฟวงกลม' },
            { value: 'bar', icon: BarChart3, srLabel: 'กราฟแท่ง' },
          ]}
        />
      }
    >
      {chartType === 'pie' ? (
        <div>
          <div className="mb-4 flex justify-center">
            <Segmented
              value={pieType}
              onChange={setPieType}
              options={[
                { value: 'expense', label: 'รายจ่ายตามหมวด' },
                { value: 'income', label: 'รายรับตามหมวด' },
              ]}
            />
          </div>
          {pieData.length === 0 ? (
            <EmptyState
              title={pieType === 'expense' ? 'ยังไม่มีรายจ่าย' : 'ยังไม่มีรายรับ'}
              description="ช่วงเวลานี้ยังไม่มีข้อมูล"
            />
          ) : (
            <>
              <Donut data={pieData} />
              <PieLegend data={pieData} />
            </>
          )}
        </div>
      ) : (
        <FlowBars period={period} data={data.flow} />
      )}
    </SectionCard>
  )
}

function SavingsSection({ period, data, savingsChart, setSavingsChart }) {
  const { saved, withdrawn, remaining } = data.savings
  const donut = [
    { name: 'ออมเข้า', value: saved, color: INCOME_COLOR },
    { name: 'ออมออก', value: withdrawn, color: EXPENSE_COLOR },
  ].filter((d) => d.value > 0)
  // รายปีเท่านั้นที่เลือกได้ว่าจะดูแบบวงกลมหรือแท่ง
  const showBar = period === 'year' && savingsChart === 'bar'

  return (
    <SectionCard
      title="สรุปการออม"
      action={
        period === 'year' ? (
          <Segmented
            value={savingsChart}
            onChange={setSavingsChart}
            options={[
              { value: 'donut', icon: PieIcon, srLabel: 'กราฟวงกลม' },
              { value: 'bar', icon: BarChart3, srLabel: 'กราฟแท่ง' },
            ]}
          />
        ) : null
      }
    >
      {showBar ? (
        data.savings_flow?.length > 0 ? (
          <SavingsMonthBars data={data.savings_flow} />
        ) : (
          <EmptyState title="ยังไม่มีการออม" description="ปีนี้ยังไม่มีการออมเข้าหรือถอนออก" />
        )
      ) : donut.length === 0 ? (
        <EmptyState title="ยังไม่มีการออม" description="ช่วงเวลานี้ยังไม่มีการออมเข้าหรือถอนออก" />
      ) : (
        <>
          <Donut data={donut} centerLabel="คงเหลือ" centerValue={formatMoneyShort(remaining)} />
          <ul className="mt-4 space-y-2">
            <li className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: INCOME_COLOR }} /> ออมเข้า
              </span>
              <span className="font-medium tabular text-ink">{formatMoney(saved)}</span>
            </li>
            <li className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: EXPENSE_COLOR }} /> ออมออก
              </span>
              <span className="font-medium tabular text-ink">{formatMoney(withdrawn)}</span>
            </li>
            <li className="flex items-center justify-between border-t border-hairline-soft pt-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-ink">
                <Landmark className="h-3.5 w-3.5 text-ink" /> คงเหลือ
              </span>
              <span className="font-semibold tabular text-ink">{formatMoney(remaining)}</span>
            </li>
          </ul>
        </>
      )}
    </SectionCard>
  )
}
