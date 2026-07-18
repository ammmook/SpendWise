// หัวข้อหน้าย่อย — ปุ่มย้อนกลับ + ชื่อหน้า (สำหรับหน้าใต้ /settings)
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function PageHeader({ title, backTo = '/settings' }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(backTo)}
        aria-label="ย้อนกลับ"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-card active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <h1 className="display text-lg text-ink">{title}</h1>
    </div>
  )
}
