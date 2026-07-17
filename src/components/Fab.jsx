// FAB — ปุ่มวงกลมลอยมุมขวาล่าง (Material style) + เมนู 2 ทางเลือก
import { Plus, PenLine, Sparkles } from 'lucide-react'
import { Modal } from './ui'

/** ปุ่มลอย: ไอคอน + อย่างเดียว */
export function Fab({ onClick, label = 'เพิ่มรายการ' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fab-shadow fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white transition-[transform,opacity] duration-200 ease-out hover:opacity-90 active:scale-95 lg:bottom-8 lg:right-8"
    >
      <Plus className="h-6 w-6" strokeWidth={2.2} />
    </button>
  )
}

/** เมนูของ FAB — bottom sheet บนมือถือ / โมดัลกลางจอบนจอใหญ่ */
export function FabMenu({ onClose, onManual, onAi }) {
  return (
    <Modal open onClose={onClose} title="เพิ่มรายการ">
      <div className="grid gap-2.5">
        <button
          onClick={onManual}
          className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-3 text-left transition-colors duration-200 hover:bg-surface-card active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-card text-ink">
            <PenLine className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">เพิ่มเอง</span>
            <span className="block text-xs text-muted">กรอกรายละเอียดในฟอร์ม</span>
          </span>
        </button>

        <button
          onClick={onAi}
          className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-3 text-left transition-colors duration-200 hover:bg-surface-card active:scale-[0.99]"
        >
          <span className="ai-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="ai-gradient-text block text-sm font-semibold">AI Quick Add</span>
            <span className="block text-xs text-muted">พิมพ์ “KFC 249” ให้ AI จัดหมวดให้</span>
          </span>
        </button>
      </div>
    </Modal>
  )
}
