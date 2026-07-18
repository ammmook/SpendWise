// ตกแต่งหมวดหมู่ — เพิ่ม/ลบหมวดหมู่ของผู้ใช้เอง
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Tag } from 'lucide-react'
import { getCategories, addCategory, deleteCategory } from '../lib/api'
import { Button, Card, Input, Select, CategoryIcon, Skeleton } from '../components/ui'
import PageHeader from '../components/PageHeader'

export default function CategorySettings() {
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
    <div className="space-y-4">
      <PageHeader title="ตกแต่งหมวดหมู่" />

      <Card className="p-5">
        <h3 className="font-semibold text-ink">เพิ่มหมวดหมู่ใหม่</h3>
        <p className="mt-1 text-sm text-muted">สร้างหมวดหมู่ของคุณเอง (หมวดเริ่มต้นแก้ไขไม่ได้)</p>

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
        {error && <p className="mt-2 text-sm font-medium text-expense">{error}</p>}
      </Card>

      {custom.length > 0 && (
        <Card className="p-5">
          <p className="eyebrow mb-3">หมวดหมู่ของคุณ</p>
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
                  className="rounded-full p-1 text-muted hover:bg-expense/10 hover:text-expense"
                  aria-label={`ลบ ${c.name_th}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <p className="eyebrow mb-3">หมวดหมู่เริ่มต้น</p>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {defaults.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1 text-sm text-ink"
              >
                <CategoryIcon name={c.icon} className="h-3.5 w-3.5" />
                {c.name_th}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
