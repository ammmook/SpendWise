// Settings — แก้โปรไฟล์/ฐานเงินเดือน + จัดการหมวดหมู่ที่สร้างเอง
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, Trash2, Tag } from 'lucide-react'
import { getMe, updateMe, getCategories, addCategory, deleteCategory } from '../lib/api'
import { formatMoney } from '../lib/format'
import { Button, Card, Eyebrow, Field, Input, Select, CategoryIcon, Skeleton } from '../components/ui'

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Settings</Eyebrow>
        <h2 className="display mt-1 text-2xl text-ink">ตั้งค่า</h2>
        <p className="mt-1 text-sm text-muted">จัดการโปรไฟล์และหมวดหมู่ของคุณ</p>
      </div>
      <ProfileSection />
      <CategoriesSection />
    </div>
  )
}

function ProfileSection() {
  const qc = useQueryClient()
  const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  const current = form ?? (me ? { display_name: me.display_name, base_salary: me.base_salary } : null)

  const mutation = useMutation({
    mutationFn: () =>
      updateMe({
        display_name: current.display_name,
        base_salary: Number(current.base_salary) || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  if (isLoading || !current) {
    return (
      <Card className="p-6">
        <Skeleton className="h-5 w-28 rounded" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-11 rounded-lg" />
        </div>
        <Skeleton className="mt-5 h-11 w-40 rounded-full" />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="display text-lg text-ink">โปรไฟล์</h3>
      <p className="mt-1 text-sm text-muted">ฐานเงินเดือนใช้สำหรับให้ AI คำนวณแผนการออมและ OT</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ชื่อที่แสดง">
          <Input
            value={current.display_name || ''}
            onChange={(e) => setForm({ ...current, display_name: e.target.value })}
          />
        </Field>
        <Field label="ฐานเงินเดือน (บาท/เดือน)" hint={`ปัจจุบัน ${formatMoney(me.base_salary)}`}>
          <Input
            type="number"
            min="0"
            value={current.base_salary}
            onChange={(e) => setForm({ ...current, base_salary: e.target.value })}
          />
        </Field>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
          บันทึกโปรไฟล์
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-medium text-[#1ea64a]">
            <Check className="h-4 w-4" /> บันทึกแล้ว
          </span>
        )}
      </div>
    </Card>
  )
}

function CategoriesSection() {
  const qc = useQueryClient()
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const [form, setForm] = useState({ name_th: '', type: 'expense' })
  const [error, setError] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const addMutation = useMutation({
    mutationFn: () => addCategory(form),
    onSuccess: () => {
      setForm({ name_th: '', type: 'expense' })
      setError('')
      invalidate()
    },
    onError: (e) => setError(e.message),
  })
  const delMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: invalidate,
    onError: (e) => setError(e.message),
  })

  const custom = categories.filter((c) => !c.is_default)
  const defaults = categories.filter((c) => c.is_default)

  return (
    <Card className="p-6">
      <h3 className="display text-lg text-ink">หมวดหมู่</h3>
      <p className="mt-1 text-sm text-muted">เพิ่มหมวดหมู่ของคุณเอง (หมวดเริ่มต้นแก้ไขไม่ได้)</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.name_th.trim()) return setError('กรุณากรอกชื่อหมวดหมู่')
          addMutation.mutate()
        }}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <Input
          placeholder="ชื่อหมวดหมู่ใหม่"
          value={form.name_th}
          onChange={(e) => setForm((f) => ({ ...f, name_th: e.target.value }))}
          className="flex-1"
        />
        <Select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          className="w-full sm:w-36"
        >
          <option value="expense">รายจ่าย</option>
          <option value="income">รายรับ</option>
        </Select>
        <Button type="submit" loading={addMutation.isPending} className="sm:w-auto">
          <Plus className="h-4 w-4" /> เพิ่ม
        </Button>
      </form>
      {error && <p className="mt-2 text-sm font-medium text-[#e34948]">{error}</p>}

      {custom.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow mb-2">Custom</p>
          <ul className="flex flex-wrap gap-2">
            {custom.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas py-1 pl-3 pr-1.5 text-sm"
              >
                <Tag className="h-3.5 w-3.5 text-muted" />
                <span className="text-ink">{c.name_th}</span>
                <span className="text-[10px] text-muted">{c.type === 'income' ? 'รับ' : 'จ่าย'}</span>
                <button
                  onClick={() => delMutation.mutate(c.id)}
                  className="rounded-full p-1 text-muted hover:bg-[#fbeeee] hover:text-[#e34948]"
                  aria-label={`ลบ ${c.name_th}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <p className="eyebrow mb-2">Default</p>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {defaults.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-sm text-ink"
              >
                <CategoryIcon name={c.icon} className="h-3.5 w-3.5" />
                {c.name_th}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
