// ฟอร์มเพิ่ม/แก้ไขรายการ — ใช้ร่วมกันระหว่างหน้า Home (Daily) และ Transactions
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { addTransaction, updateTransaction } from '../lib/api'
import { FUNDING_SOURCES } from '../lib/mockData'
import { todayISO } from '../lib/format'
import { Button, Field, Input, Select, Modal, CategoryIcon } from './ui'

export default function TransactionModal({ tx, categories, defaultDate, onClose, onSaved }) {
  const isEdit = !!tx
  const [form, setForm] = useState({
    type: tx?.type || 'expense',
    amount: tx?.amount || '',
    description: tx?.description || '',
    category_id: tx?.category_id || '',
    transaction_date: tx?.transaction_date || defaultDate || todayISO(),
    funding_source: tx?.funding_source || 'cash',
    funding_source_label: tx?.funding_source_label || '',
  })
  const [error, setError] = useState('')

  const cats = categories.filter((c) => c.type === form.type)
  const activeSource = FUNDING_SOURCES.find((s) => s.id === form.funding_source)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, amount: Number(form.amount), category_id: form.category_id || null }
      if (isEdit) return updateTransaction(tx.id, payload)
      return addTransaction(payload)
    },
    onSuccess: onSaved,
    onError: (e) => setError(e.message || 'บันทึกไม่สำเร็จ'),
  })

  function submit(e) {
    e.preventDefault()
    setError('')
    if (!(Number(form.amount) > 0)) return setError('จำนวนเงินต้องมากกว่า 0')
    mutation.mutate()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button className="flex-1" onClick={submit} loading={mutation.isPending}>
            {isEdit ? 'บันทึก' : 'เพิ่มรายการ'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Type toggle — pill segmented, selected = ดำ */}
        <div className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1">
          {[
            { v: 'expense', label: 'รายจ่าย' },
            { v: 'income', label: 'รายรับ' },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: opt.v, category_id: '' }))}
              className={`rounded-full py-2 text-sm font-medium transition-[background-color,color] duration-200 ${
                form.type === opt.v ? 'bg-ink text-canvas' : 'text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Field label="จำนวนเงิน (บาท)">
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            autoFocus
          />
        </Field>

        <Field label="รายละเอียด">
          <Input
            placeholder="เช่น ข้าวมันไก่"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>

        <Field label="หมวดหมู่">
          <Select
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          >
            <option value="">— เลือกหมวด —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_th}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={form.type === 'income' ? 'เงินเข้าที่ไหน' : 'จ่ายด้วยแหล่งเงินไหน'}
          hint="ใช้สำหรับสรุปเงินออมและรายงาน"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-hairline bg-surface-card text-ink">
              <CategoryIcon name={activeSource?.icon} className="h-[18px] w-[18px]" />
            </span>
            <Select
              value={form.funding_source}
              onChange={(e) => setForm((f) => ({ ...f, funding_source: e.target.value }))}
            >
              {FUNDING_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </Field>

        {form.funding_source === 'other' && (
          <Field label="ระบุแหล่งเงิน">
            <Input
              placeholder="เช่น กระเป๋าเงินอิเล็กทรอนิกส์"
              value={form.funding_source_label}
              onChange={(e) => setForm((f) => ({ ...f, funding_source_label: e.target.value }))}
            />
          </Field>
        )}

        <Field label="วันที่">
          <Input
            type="date"
            value={form.transaction_date}
            max={todayISO()}
            onChange={(e) => setForm((f) => ({ ...f, transaction_date: e.target.value }))}
          />
        </Field>

        {error && <p className="text-sm font-medium text-expense">{error}</p>}
      </form>
    </Modal>
  )
}
