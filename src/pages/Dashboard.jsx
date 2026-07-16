// Dashboard — หน้าวิเคราะห์การเงิน (analytics): รายเดือน + รายปี + กราฟ + สถิติ
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Trophy, Layers, CalendarRange,
} from 'lucide-react'
import { getDashboardSummary, getYearlySummary } from '../lib/api'
import {
  formatMoney, formatMonthShort, formatMonthLabel, currentMonthKey,
} from '../lib/format'
import { Card, Eyebrow, Skeleton, EmptyState } from '../components/ui'
import MonthPicker from '../components/MonthPicker'

const CAT_COLORS = ['#2a78d6', '#1ea64a', '#eda100', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834']
const OTHER_COLOR = '#9a9a95'
const INCOME_COLOR = '#1ea64a'
const EXPENSE_COLOR = '#e34948'

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

function StatCard({ label, main, icon: Icon, accent = '#000', hint }) {
  return (
    <Card interactive className="p-5 shadow-soft">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="eyebrow mt-3">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular text-ink">{main}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

function StatMini({ icon: Icon, label, value, sub }) {
  return (
    <Card className="p-4 shadow-soft">
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

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-3xl lg:col-span-3" />
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  )
}

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonthKey())
  const year = Number(month.slice(0, 4))

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => getDashboardSummary({ month }),
  })
  const { data: yearly } = useQuery({
    queryKey: ['yearly', year],
    queryFn: () => getYearlySummary({ year }),
  })

  const savingRate = data && data.income > 0 ? Math.round((data.balance / data.income) * 100) : 0

  // แสดงสูงสุด 6 หมวด ที่เหลือยุบเป็น "อื่นๆ"
  const pieData = (() => {
    if (!data) return []
    const items = data.breakdown
    if (items.length <= 7) return items.map((b, i) => ({ ...b, color: CAT_COLORS[i] }))
    const head = items.slice(0, 6).map((b, i) => ({ ...b, color: CAT_COLORS[i] }))
    const rest = items.slice(6).reduce((s, b) => s + b.total, 0)
    return [...head, { category_id: 'other', name_th: 'อื่นๆ', total: rest, color: OTHER_COLOR }]
  })()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow>Dashboard</Eyebrow>
          <h2 className="display mt-1 text-2xl text-ink">วิเคราะห์การเงิน</h2>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Income vs Expense + Savings (รายเดือน) */}
          <section className="space-y-4">
            <SectionTitle eyebrow="This Month" title={formatMonthLabel(month)} />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="รายรับ" main={formatMoney(data.income)} icon={TrendingUp} accent={INCOME_COLOR} />
              <StatCard label="รายจ่าย" main={formatMoney(data.expense)} icon={TrendingDown} accent={EXPENSE_COLOR} />
              <StatCard
                label="คงเหลือ"
                main={formatMoney(data.balance)}
                icon={Wallet}
                accent="#2a78d6"
                hint={`${data.tx_count} รายการ`}
              />
              <StatCard label="อัตราการออม" main={`${savingRate}%`} icon={PiggyBank} accent="#4a3aa7" hint="ของรายรับเดือนนี้" />
            </div>
          </section>

          {/* Pie + breakdown + monthly trend */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <Card className="p-6 shadow-soft lg:col-span-2">
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
                          stroke="#ffffff"
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

            <Card className="p-6 shadow-soft lg:col-span-3">
              <SectionTitle eyebrow="6-Month Trend" title="แนวโน้ม 6 เดือน" />
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ left: -18, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fontSize: 12, fill: '#6f6f6f' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} tick={{ fontSize: 12, fill: '#6f6f6f' }} tickLine={false} axisLine={false} width={44} />
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

          {/* Yearly overview + annual trend */}
          {yearly && (
            <section className="space-y-4">
              <SectionTitle eyebrow="This Year" title={`ภาพรวมปี ${year + 543}`} />
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="รายรับรวมทั้งปี" main={formatMoney(yearly.income)} icon={TrendingUp} accent={INCOME_COLOR} />
                <StatCard label="รายจ่ายรวมทั้งปี" main={formatMoney(yearly.expense)} icon={TrendingDown} accent={EXPENSE_COLOR} />
                <StatCard label="คงเหลือทั้งปี" main={formatMoney(yearly.balance)} icon={Wallet} accent="#2a78d6" />
                <StatCard
                  label="ออมเฉลี่ย/เดือน"
                  main={formatMoney(yearly.avg_income - yearly.avg_expense)}
                  icon={PiggyBank}
                  accent="#4a3aa7"
                />
              </div>

              <Card className="p-6 shadow-soft">
                <SectionTitle eyebrow="Annual Trend" title="เงินคงเหลือสุทธิรายเดือน" />
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearly.months} margin={{ left: -18, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                      <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={{ fontSize: 11, fill: '#6f6f6f' }} tickLine={false} axisLine={false} interval={0} />
                      <YAxis tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : v)} tick={{ fontSize: 12, fill: '#6f6f6f' }} tickLine={false} axisLine={false} width={44} />
                      <Tooltip content={<ChartTooltip />} labelFormatter={formatMonthShort} cursor={{ fill: '#f7f7f5' }} />
                      <Bar dataKey="balance" name="คงเหลือสุทธิ" radius={[4, 4, 0, 0]}>
                        {yearly.months.map((mo) => (
                          <Cell key={mo.month} fill={mo.balance >= 0 ? INCOME_COLOR : EXPENSE_COLOR} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          )}

          {/* Financial statistics */}
          <section className="space-y-4">
            <SectionTitle eyebrow="Statistics" title="สถิติการเงิน" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatMini icon={PiggyBank} label="อัตราการออม" value={`${savingRate}%`} sub="เดือนนี้" />
              <StatMini
                icon={Layers}
                label="หมวดจ่ายสูงสุด"
                value={data.breakdown[0]?.name_th || '—'}
                sub={data.breakdown[0] ? formatMoney(data.breakdown[0].total) : undefined}
              />
              {yearly && (
                <>
                  <StatMini icon={CalendarRange} label="จ่ายเฉลี่ย/เดือน" value={formatMoney(yearly.avg_expense)} sub="ทั้งปี" />
                  <StatMini
                    icon={Trophy}
                    label="เดือนที่ออมได้มากสุด"
                    value={formatMonthShort(yearly.best_month.month)}
                    sub={formatMoney(yearly.best_month.balance)}
                  />
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
