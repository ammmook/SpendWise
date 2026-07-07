// รวมฟังก์ชัน format ตัวเลข/วันที่ ให้ใช้รูปแบบเดียวกันทั้งแอป (ภาษาไทย)

const currencyFmt = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * แปลงจำนวนเงินเป็นสตริง เช่น 1234.5 -> "1,234.50 ฿"
 * @param {number} amount
 * @param {{ sign?: boolean }} [opts] แสดงเครื่องหมาย +/- นำหน้า
 */
export function formatMoney(amount, opts = {}) {
  const n = Number(amount) || 0
  const base = `${currencyFmt.format(Math.abs(n))} ฿`
  if (!opts.sign) return base
  if (n > 0) return `+${base}`
  if (n < 0) return `-${base}`
  return base
}

/** แปลงจำนวนเงินแบบไม่มีสัญลักษณ์สกุลเงิน (สำหรับใส่ในฟอร์ม/แกนกราฟ) */
export function formatNumber(amount) {
  return currencyFmt.format(Number(amount) || 0)
}

const monthNamesTh = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

/** "2026-07-05" -> "5 ก.ค. 2569" (พ.ศ.) */
export function formatDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return `${d.getDate()} ${monthNamesTh[d.getMonth()]} ${d.getFullYear() + 543}`
}

/** "2026-07" -> "กรกฎาคม 2569" */
export function formatMonthLabel(monthKey) {
  const full = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ]
  const [y, m] = monthKey.split('-').map(Number)
  return `${full[m - 1]} ${y + 543}`
}

/** label สั้นสำหรับแกนกราฟ "2026-07" -> "ก.ค. 69" */
export function formatMonthShort(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  return `${monthNamesTh[m - 1]} ${String((y + 543) % 100).padStart(2, '0')}`
}

/** คืน key เดือนปัจจุบันในรูปแบบ "YYYY-MM" */
export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** เลื่อนเดือนจาก key ที่ให้มา (offset ติดลบ = ย้อนหลัง) */
export function shiftMonth(monthKey, offset) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1 + offset, 1)
  return currentMonthKey(d)
}

/** วันที่วันนี้ในรูปแบบ ISO "YYYY-MM-DD" (อิงเวลาท้องถิ่น) */
export function todayISO(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
