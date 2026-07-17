// Analytics — วิเคราะห์การเงิน 2 แท็บ: รายเดือน / รายปี
// ดีไซน์ตาม DESIGN.md (Clay): พื้นครีม, feature card สีจัด, การ์ด hairline ไม่มีเงา
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Trophy, Layers, CalendarRange,
  CalendarDays, LineChart as LineChartIcon, Landmark, ArrowUpFromLine,
  ChevronLeft, ChevronRight, Receipt,
} from 'lucide-react'
import { getDashboardSummary, getYearlySummary } from '../lib/api'
import { formatMoney, formatMonthShort, formatMonthLabel, currentMonthKey } from '../lib/format'
import { Card, ColorBlock, Eyebrow, Skeleton, EmptyState } from '../components/ui'
import MonthPicker from '../components/MonthPicker'

const CAT_COLORS = ['#2a78d6', '#1ea64a', '#eda100', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834']
const OTHER_COLOR = '#9a9a95'
const INCOME_COLOR = '#22c55e'
const EXPENSE_COLOR = '#ef4444'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-hairline bg-canvas px-3 py-2 text-xs shadow-lg">
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

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color] duration-200 ease-out active:scale-[0.98] ${
        active ? 'bg-surface-card text-ink' : 'text-muted hover:bg-surface-card hover:text-ink'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function YearPicker({ value, onChange }) {
  const thisYear = new Date().getFullYear()
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas p-1">
      <button
        onClick={() => onChange(value - 1)}
        className="rounded-full p-1.5 text-ink transition hover:bg-surface-card"
        aria-label="ปีก่อนหน้า"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[96px] text-center text-sm font-medium tabular text-ink">
        ปี {value + 543}
      </span>
      <button
        onClick={() => value < thisYear && onChange(value + 1)}
        disabled={value >= thisYear}
        className="rounded-full p-1.5 text-ink transition hover:bg-surface-card disabled:opacity-25 disabled:hover:bg-transparent"
        aria-label="ปีถัดไป"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/** การ์ดสรุปแบบ feature-card สีจัด */
function StatBlock({ tone, label, main, icon: Icon, hint }) {
  const dark = tone === 'teal' || tone === 'pink' || tone === 'coral'
  return (
    <ColorBlock tone={tone} interactive className="p-5">
      <div className="flex items-center justify-between">
        <p className={`eyebrow ${dark ? '!text-white/70' : '!text-ink/55'}`}>{label}</p>
        <Icon className={`h-4 w-4 ${dark ? 'text-white/70' : 'text-ink/50'}`} />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight tabular">{main}</p>
      {hint && <p className={`mt-1 text-xs ${dark ? 'text-white/60' : 'text-ink/55'}`}>{hint}</p>}
    </ColorBlock>
  )
}

/** การ์ด hairline พร้อมไอคอนสี */
function PlainStat({ label, main, icon: Icon, accent, hint }) {
  return (
    <Card interactive className="p-5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card"
        style={{ color: accent }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <p className="eyebrow mt-3">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular text-ink">{main}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

function StatMini({ icon: Icon, label, value, sub }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-1 text-base font-semibold tabular text-ink">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </Card>
  )
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3 className="display mt-0.5 text-lg text-ink">{title}</h3>
    </div>
  )
}

/** สรุปเงินออมเป็น "จำนวนเงิน" (ไม่ใช่ %) — ออมเข้า / ถอนออก / คงเหลือ */
function SavingsSummary({ savings, periodLabel }) {
  return (
    <section className="space-y-4">
      <SectionTitle eyebrow="Savings" title="สรุปเงินออม" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PlainStat
          label="ออมเข้า"
          main={formatMoney(savings.saved)}
          icon={PiggyBank}
          accent={INCOME_COLOR}
          hint={periodLabel}
        />
        <PlainStat
          label="ถอนจากเงินออม"
          main={formatMoney(savings.withdrawn)}
          icon={ArrowUpFromLine}
          accent={EXPENSE_COLOR}
          hint={periodLabel}
        />
        <ColorBlock tone="ochre" interactive className="p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow !text-ink/60">เงินออมคงเหลือ</p>
            <Landmark className="h-4 w-4 text-ink/50" />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight tabular">
            {formatMoney(savings.remaining)}
          </p>
          <p className="mt-1 text-xs text-ink/55">ยอดสะสมถึงสิ้นงวด</p>
        </ColorBlock>
      </div>
    </section>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )
}

export default function Dashboard() {
  const [tab, setTab] = useState('monthly')
  const [month, setMonth] = useState(currentMonthKey())
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: monthly, isLoading: mLoading } = useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => getDashboardSummary({ month }),
  })
  const { data: yearly, isLoading: yLoading } = useQuery({
    queryKey: ['yearly', year],
    queryFn: () => getYearlySummary({ year }),
  })

  // แสดงสูงสุด 6 หมวด ที่เหลือยุบเป็น "อื่นๆ"
  const pieData = (() => {
    if (!monthly) return []
    const items = monthly.breakdown
    if (items.length <= 7) return items.map((b, i) => ({ ...b, color: CAT_COLORS[i] }))
    const head = items.slice(0, 6).map((b, i) => ({ ...b, color: CAT_COLORS[i] }))
    const rest = items.slice(6).reduce((s, b) => s + b.total, 0)
    return [...head, { category_id: 'other', name_th: 'อื่นๆ', total: rest, color: OTHER_COLOR }]
  })()

  const loading = tab === 'monthly' ? mLoading || !monthly : yLoading || !yearly

  return (
    <div className="space-y-8">
      {/* Header + tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow>Analytics</Eyebrow>
          <h2 className="display mt-1 text-2xl text-ink">วิเคราะห์การเงิน</h2>
        </div>
        {tab === 'monthly' ? (
          <MonthPicker value={month} onChange={setMonth} />
        ) : (
          <YearPicker value={year} onChange={setYear} />
        )}
      </div>

      <div className="inline-flex rounded-full border border-hairline bg-canvas p-1">
        <TabButton active={tab === 'monthly'} onClick={() => setTab('monthly')} icon={CalendarDays} label="รายเดือน" />
        <TabButton active={tab === 'yearly'} onClick={() => setTab('yearly')} icon={LineChartIcon} label="รายปี" />
      </div>

      {loading ? (
        <AnalyticsSkeleton />
      ) : tab === 'monthly' ? (
        <div key="monthly" className="animate-fade-up space-y-8">
          {/* Income vs Expense */}
          <section className="space-y-4">
            <SectionTitle eyebrow="This Month" title={formatMonthLabel(month)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatBlock tone="mint" label="รายรับ" main={formatMoney(monthly.income)} icon={TrendingUp} />
              <StatBlock tone="pink" label="รายจ่าย" main={formatMoney(monthly.expense)} icon={TrendingDown} />
              <StatBlock
                tone="teal"
                label="คงเหลือ"
                main={formatMoney(monthly.balance)}
                icon={Wallet}
                hint={`${monthly.tx_count} รายการ`}
              />
            </div>
          </section>

          <SavingsSummary savings={monthly.savings} periodLabel={formatMonthLabel(month)} />

          {/* Pie + trend */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <Card className="p-6 lg:col-span-2">
              <SectionTitle eyebrow="Breakdown" title="รายจ่ายตามหมวด" />
              {pieData.length === 0 ? (
                <EmptyState title="ยังไม่มีรายจ่าย" description="เดือนนี้ยังไม่มีการบันทึกรายจ่าย" />
              ) : (
                <>
                  <div className="mt-3 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="total"
                          nameKey="name_th"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={2}
                          stroke="#fffaf0"
                          strokeWidth={2}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.category_id} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {pieData.map((b) => (
                      <li key={b.category_id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-ink">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                          {b.name_th}
                        </span>
                        <span className="font-medium tabular text-ink">{formatMoney(b.total)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <Card className="p-6 lg:col-span-3">
              <SectionTitle eyebrow="6-Month Trend" title="แนวโน้ม 6 เดือน" />
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly.trend} margin={{ left: -18, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fontSize: 12, fill: '#6a6a6a' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} tick={{ fontSize: 12, fill: '#6a6a6a' }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip content={<ChartTooltip />} labelFormatter={formatMonthShort} />
                    <Line type="monotone" dataKey="income" name="รายรับ" stroke={INCOME_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="expense" name="รายจ่าย" stroke={EXPENSE_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: INCOME_COLOR }} /> รายรับ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: EXPENSE_COLOR }} /> รายจ่าย
                </span>
              </div>
            </Card>
          </section>

          {/* Statistics */}
          <section className="space-y-4">
            <SectionTitle eyebrow="Statistics" title="สถิติเดือนนี้" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatMini
                icon={Layers}
                label="หมวดจ่ายสูงสุด"
                value={monthly.breakdown[0]?.name_th || '—'}
                sub={monthly.breakdown[0] ? formatMoney(monthly.breakdown[0].total) : undefined}
              />
              <StatMini icon={Receipt} label="จำนวนรายการ" value={`${monthly.tx_count}`} sub="เดือนนี้" />
              <StatMini icon={PiggyBank} label="ออมสุทธิเดือนนี้" value={formatMoney(monthly.savings.saved - monthly.savings.withdrawn)} />
              <StatMini icon={Landmark} label="เงินออมคงเหลือ" value={formatMoney(monthly.savings.remaining)} />
            </div>
          </section>
        </div>
      ) : (
        <div key="yearly" className="animate-fade-up space-y-8">
          {/* Year totals */}
          <section className="space-y-4">
            <SectionTitle eyebrow="This Year" title={`ภาพรวมปี ${year + 543}`} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatBlock tone="mint" label="รายรับทั้งปี" main={formatMoney(yearly.income)} icon={TrendingUp} />
              <StatBlock tone="pink" label="รายจ่ายทั้งปี" main={formatMoney(yearly.expense)} icon={TrendingDown} />
              <StatBlock tone="teal" label="คงเหลือทั้งปี" main={formatMoney(yearly.balance)} icon={Wallet} />
            </div>
          </section>

          <SavingsSummary savings={yearly.savings} periodLabel={`ปี ${year + 543}`} />

          {/* Savings per month */}
          <Card className="p-6">
            <SectionTitle eyebrow="Savings by Month" title="เงินออมเข้า-ออก รายเดือน" />
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearly.months} margin={{ left: -18, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fontSize: 11, fill: '#6a6a6a' }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} tick={{ fontSize: 12, fill: '#6a6a6a' }} tickLine={false} axisLine={false} width={44} />
                  <Tooltip content={<ChartTooltip />} labelFormatter={formatMonthShort} cursor={{ fill: '#f5f0e0' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="saved" name="ออมเข้า" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawn" name="ถอนออม" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Annual net trend */}
          <Card className="p-6">
            <SectionTitle eyebrow="Annual Trend" title="เงินคงเหลือสุทธิรายเดือน" />
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearly.months} margin={{ left: -18, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fontSize: 11, fill: '#6a6a6a' }} tickLine={false} axisLine={false} interval={0} />
                  <YAxis tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : v)} tick={{ fontSize: 12, fill: '#6a6a6a' }} tickLine={false} axisLine={false} width={44} />
                  <Tooltip content={<ChartTooltip />} labelFormatter={formatMonthShort} cursor={{ fill: '#f5f0e0' }} />
                  <Bar dataKey="balance" name="คงเหลือสุทธิ" radius={[4, 4, 0, 0]}>
                    {yearly.months.map((mo) => (
                      <Cell key={mo.month} fill={mo.balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Statistics */}
          <section className="space-y-4">
            <SectionTitle eyebrow="Statistics" title="สถิติทั้งปี" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatMini icon={CalendarRange} label="จ่ายเฉลี่ย/เดือน" value={formatMoney(yearly.avg_expense)} sub="ทั้งปี" />
              <StatMini icon={TrendingUp} label="รับเฉลี่ย/เดือน" value={formatMoney(yearly.avg_income)} sub="ทั้งปี" />
              <StatMini
                icon={Trophy}
                label="เดือนที่ออมได้มากสุด"
                value={formatMonthShort(yearly.best_month.month)}
                sub={formatMoney(yearly.best_month.balance)}
              />
              <StatMini icon={PiggyBank} label="ออมสุทธิทั้งปี" value={formatMoney(yearly.savings.saved - yearly.savings.withdrawn)} />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
