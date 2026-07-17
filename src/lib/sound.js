// เสียงยืนยันเมื่อบันทึกรายการสำเร็จ (แบบ "แคชเชียร์" สั้นๆ)
// สังเคราะห์ด้วย Web Audio API — ไม่ต้องโหลดไฟล์เสียง และ fail แบบเงียบเสมอ
// เคารพการตั้งค่าเครื่อง/เบราว์เซอร์: ถ้าเล่นไม่ได้ (silent mode / autoplay policy) จะไม่กระทบ UX

const STORAGE_KEY = 'spendwise.sound'
let ctx = null

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

/** เล่นเสียงยืนยันสั้นๆ (ka-ching) — เรียกครั้งเดียวต่อการบันทึก 1 รายการ */
export function playCashSound() {
  if (!isSoundEnabled()) return
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    if (!ctx) ctx = new AudioCtx()
    // บาง browser ต้อง resume หลังมี user gesture — ถ้าไม่ได้ก็ปล่อยผ่าน
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})

    const now = ctx.currentTime
    // สองโน้ตสั้นซ้อนกัน = เสียงเครื่องคิดเงิน
    const notes = [
      { freq: 1318.5, at: 0 },
      { freq: 1760, at: 0.075 },
    ]
    for (const n of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(n.freq, now + n.at)
      gain.gain.setValueAtTime(0.0001, now + n.at)
      gain.gain.exponentialRampToValueAtTime(0.15, now + n.at + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.at + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + n.at)
      osc.stop(now + n.at + 0.26)
    }
  } catch {
    // เล่นเสียงไม่ได้ก็ไม่เป็นไร — ห้ามกระทบการบันทึกรายการ
  }
}
