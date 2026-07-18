// เสียงตอบสนอง — ใช้ไฟล์ MP3 จาก Supabase Storage และ fail แบบเงียบเสมอ
//  • playCashSound() = เสียงเครื่องคิดเงิน เมื่อบันทึกรายการสำเร็จ
//  • playTick()      = เสียงคลิกปุ่ม เมื่อกดปุ่ม/แท็บ เพื่อบอกว่ากดแล้ว
// เคารพการตั้งค่าเครื่อง/เบราว์เซอร์: ถ้าเล่นไม่ได้ (silent mode / autoplay policy) จะไม่กระทบ UX

const STORAGE_KEY = 'spendwise.sound'

const urlClick = "https://cjhahtzqlolagbgdzdaa.supabase.co/storage/v1/object/public/sound%20effects/denielcz-immersivecontrol-button-click-sound-463065.mp3"
const urlCash = "https://cjhahtzqlolagbgdzdaa.supabase.co/storage/v1/object/public/sound%20effects/ksjsbwuil-cash-register-1-513922.mp3"

/** เล่นไฟล์เสียงจาก URL — สร้าง Audio ใหม่ทุกครั้งเพื่อให้กดซ้ำได้ทันที */
function playUrl(url) {
  try {
    const audio = new Audio(url)
    audio.volume = 0.5
    audio.play().catch(() => {})
  } catch {
    // ignore
  }
}

/** ผู้ใช้เปิดเสียงอยู่หรือไม่ (ค่าเริ่มต้น: เปิด) */
export function isSoundEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundEnabled(on) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // ignore storage errors
  }
}

/** เสียงยืนยันเมื่อบันทึกรายการสำเร็จ (เครื่องคิดเงิน) — เรียกครั้งเดียวต่อ 1 รายการ */
export function playCashSound() {
  if (!isSoundEnabled()) return
  playUrl(urlCash)
}

/** เสียงคลิกปุ่ม เมื่อกดปุ่ม/แท็บ */
export function playTick() {
  if (!isSoundEnabled()) return
  playUrl(urlClick)
}
