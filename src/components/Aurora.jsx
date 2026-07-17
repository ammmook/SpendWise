// Aurora mesh background — ตกแต่งล้วน (decorative only)
// radial-gradient หลายชั้น เบลอหนัก opacity ต่ำ วางรอบ "ขอบ" จอ ให้กลางจอยังขาวสะอาด
// อยู่หลังเนื้อหาทั้งหมดด้วย -z-10 และไม่รับ pointer

const GLOWS = [
  {
    // มุมซ้ายบน — ชมพู
    className: '-left-[28%] -top-[30%] h-[65vh] w-[85vw] md:-left-[12%] md:w-[55vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(247, 97, 116, 0.14) 0%, rgba(247, 97, 116, 0) 70%)',
    filter: 'blur(150px)',
  },
  {
    // มุมขวาบน — น้ำเงิน
    className: '-right-[28%] -top-[24%] h-[65vh] w-[85vw] md:-right-[12%] md:w-[55vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(79, 114, 229, 0.13) 0%, rgba(79, 114, 229, 0) 70%)',
    filter: 'blur(170px)',
  },
  {
    // มุมซ้ายล่าง — ลาเวนเดอร์อ่อนมาก
    className: '-bottom-[30%] -left-[24%] h-[60vh] w-[80vw] md:-left-[10%] md:w-[50vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(184, 164, 237, 0.12) 0%, rgba(184, 164, 237, 0) 70%)',
    filter: 'blur(190px)',
  },
  {
    // มุมขวาล่าง — ชมพูอ่อน
    className: '-bottom-[26%] -right-[24%] h-[60vh] w-[80vw] md:-right-[10%] md:w-[50vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(247, 97, 116, 0.10) 0%, rgba(247, 97, 116, 0) 70%)',
    filter: 'blur(200px)',
  },
]

export default function Aurora() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {GLOWS.map((g, i) => (
        <div
          key={i}
          className={`absolute ${g.className}`}
          style={{ background: g.background, filter: g.filter }}
        />
      ))}
    </div>
  )
}
