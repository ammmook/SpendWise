// แจ้งเตือนบนจอเดสก์ท็อป — เว็บนี้ออกแบบมาสำหรับมือถือ/iPad เท่านั้น
// ใช้ CSS ล้วน (hidden xl:flex) จึงตอบสนองการ resize ทันที ไม่ต้องมี JS listener
// เกณฑ์: >= 1280px (xl) = เดสก์ท็อป — iPad เกือบทุกรุ่น (แนวตั้ง/แนวนอน) ยังใช้งานได้ปกติ
import { PiggyBank, Smartphone, Tablet, Monitor } from 'lucide-react'

function DeviceChip({ icon: Icon, label, tone }) {
  const tones = {
    ok: 'bg-mint text-ink',
    alt: 'bg-lavender text-ink',
    no: 'bg-surface-card text-muted-soft',
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </div>
      <span className={`text-xs ${tone === 'no' ? 'text-muted-soft line-through' : 'font-medium text-ink'}`}>
        {label}
      </span>
    </div>
  )
}

export default function DesktopNotice() {
  return (
    <div className="fixed inset-0 z-[100] hidden items-center justify-center bg-surface p-8 xl:flex">
      <div className="w-full max-w-md text-center">
        {/* แบรนด์ */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white">
            <PiggyBank className="h-[22px] w-[22px]" strokeWidth={2} />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink">SpendWise</span>
        </div>

        <p className="eyebrow mt-10">Mobile &amp; iPad only</p>
        <h1 className="display mt-2 text-[26px] text-ink">รองรับเฉพาะมือถือและ iPad</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          เว็บไซต์นี้ออกแบบมาสำหรับหน้าจอมือถือและแท็บเล็ต
          <br />
          กรุณาเปิดบนมือถือ/iPad หรือย่อหน้าต่างเบราว์เซอร์ให้เล็กลง
        </p>

        {/* อุปกรณ์ที่รองรับ */}
        <div className="mt-10 flex items-start justify-center gap-6">
          <DeviceChip icon={Smartphone} label="มือถือ" tone="ok" />
          <DeviceChip icon={Tablet} label="iPad" tone="alt" />
          <DeviceChip icon={Monitor} label="เดสก์ท็อป" tone="no" />
        </div>
      </div>
    </div>
  )
}
