// Settings — แก้โปรไฟล์/ฐานเงินเดือน + จัดการหมวดหมู่ที่สร้างเอง
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, Trash2, Tag } from 'lucide-react'
import { getMe, updateMe, getCategories, addCategory, deleteCategory } from '../lib/api'
import { formatMoney } from '../lib/format'
import { Button, Card, Field, Input, Select, CategoryIcon, LoadingBlock } from '../components/ui'

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink-900">ตั้งค่า</h2>
        <p className="text-sm text-ink-500">จัดการโปรไฟล์และหมวดหมู่ของคุณ</p>
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

  // sync ค่าเริ่มต้นเมื่อโหลดเสร็จ
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
      <Card className="p-5">
        <LoadingBlock label="กำลังโหลดโปรไฟล์..." />
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-ink-900">โปรไฟล์</h3>
      <p className="text-sm text-ink-500">
        ฐานเงินเดือนใช้สำหรับให้ AI คำนวณแผนการออมและ OT
      </p>
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
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
          บันทึกโปรไฟล์
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-brand-600">
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
    <Card className="p-5">
      <h3 className="font-semibold text-ink-900">หมวดหมู่</h3>
      <p className="text-sm text-ink-500">เพิ่มหมวดหมู่ของคุณเอง (หมวดเริ่มต้นแก้ไขไม่ได้)</p>

      {/* Add form */}
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
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}

      {/* Custom categories */}
      {custom.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-ink-500">หมวดที่สร้างเอง</p>
          <ul className="flex flex-wrap gap-2">
            {custom.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-3 pr-1.5 text-sm"
              >
                <Tag className="h-3.5 w-3.5 text-ink-400" />
                <span className="text-ink-700">{c.name_th}</span>
                <span
                  className={`text-[10px] ${c.type === 'income' ? 'text-brand-500' : 'text-rose-500'}`}
                >
                  {c.type === 'income' ? 'รับ' : 'จ่าย'}
                </span>
                <button
                  onClick={() => delMutation.mutate(c.id)}
                  className="rounded-full p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`ลบ ${c.name_th}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Default categories */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-medium text-ink-500">หมวดเริ่มต้น</p>
        {isLoading ? (
          <LoadingBlock label="กำลังโหลด..." />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {defaults.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-600"
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
