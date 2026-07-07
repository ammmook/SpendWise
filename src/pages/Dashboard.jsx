// Dashboard — การ์ดสรุป + Pie รายจ่ายตามหมวด + Line แนวโน้ม 6 เดือน + รายการล่าสุด
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { getDashboardSummary } from '../lib/api'
import { formatMoney, formatMonthShort, currentMonthKey, formatDate } from '../lib/format'
import { Card, CategoryIcon, LoadingBlock, EmptyState } from '../components/ui'
import MonthPicker from '../components/MonthPicker'

const PIE_COLORS = [
  '#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#64748b',
]

function StatCard({ label, value, tone, icon: Icon, hint }) {
  const tones = {
    income: 'text-brand-600 bg-brand-50',
    expense: 'text-rose-600 bg-rose-50',
    balance: 'text-sky-600 bg-sky-50',
  }
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-500">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p
        className={`mt-3 text-2xl font-bold tabular ${
          tone === 'balance' && value < 0 ? 'text-rose-600' : 'text-ink-900'
        }`}
      >
        {formatMoney(value)}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </Card>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs shadow-[var(--shadow-pop)]">
      {label && <p className="mb-1 font-medium text-ink-700">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="tabular" style={{ color: p.color || p.payload?.fill }}>
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonthKey())
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', month],
    queryFn: () => getDashboardSummary({ month }),
  })

  const savingRate =
    data && data.income > 0 ? Math.round((data.balance / data.income) * 100) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink-900">ภาพรวมการเงิน</h2>
          <p className="text-sm text-ink-500">สรุปรายรับรายจ่ายของคุณ</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {isLoading || !data ? (
        <LoadingBlock />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="รายรับ" value={data.income} tone="income" icon={TrendingUp} />
            <StatCard label="รายจ่าย" value={data.expense} tone="expense" icon={TrendingDown} />
            <StatCard
              label="คงเหลือ"
              value={data.balance}
              tone="balance"
              icon={Wallet}
              hint={savingRate !== null ? `อัตราการออม ${savingRate}%` : undefined}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Pie: breakdown */}
            <Card className="p-5 lg:col-span-2">
              <h3 className="font-semibold text-ink-900">รายจ่ายตามหมวด</h3>
              {data.breakdown.length === 0 ? (
                <EmptyState title="ยังไม่มีรายจ่าย" description="เดือนนี้ยังไม่มีการบันทึกรายจ่าย" />
              ) : (
                <>
                  <div className="mt-2 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.breakdown}
                          dataKey="total"
                          nameKey="name_th"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {data.breakdown.map((entry, i) => (
                            <Cell key={entry.category_id} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {data.breakdown.slice(0, 5).map((b, i) => (
                      <li key={b.category_id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-ink-600">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          {b.name_th}
                        </span>
                        <span className="font-medium tabular text-ink-800">
                          {formatMoney(b.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            {/* Line: trend */}
            <Card className="p-5 lg:col-span-3">
              <h3 className="font-semibold text-ink-900">แนวโน้ม 6 เดือน</h3>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend} margin={{ left: -18, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonthShort}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      labelFormatter={formatMonthShort}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="รายรับ"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      name="รายจ่าย"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-center gap-6 text-xs text-ink-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> รายรับ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> รายจ่าย
                </span>
              </div>
            </Card>
          </div>

          {/* Recent */}
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-ink-900">รายการล่าสุด</h3>
            {data.recent.length === 0 ? (
              <EmptyState title="ยังไม่มีรายการ" description="เริ่มบันทึกรายการแรกของคุณได้เลย" />
            ) : (
              <ul className="divide-y divide-ink-100">
                {data.recent.map((t) => {
                  const isIncome = t.type === 'income'
                  return (
                    <li key={t.id} className="flex items-center gap-3 py-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isIncome ? 'bg-brand-50 text-brand-600' : 'bg-ink-100 text-ink-500'
                        }`}
                      >
                        <CategoryIcon name={t.category?.icon} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink-800">
                          {t.description || t.category?.name_th || 'ไม่มีรายละเอียด'}
                        </p>
                        <p className="text-xs text-ink-400">
                          {t.category?.name_th} · {formatDate(t.transaction_date)}
                        </p>
                      </div>
                      <span
                        className={`flex items-center gap-0.5 font-semibold tabular ${
                          isIncome ? 'text-brand-600' : 'text-ink-800'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {formatMoney(t.amount)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
