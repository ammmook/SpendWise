// Aurora mesh background — ตกแต่งล้วน (decorative only)
// radial-gradient หลายชั้น เบลอหนัก opacity ต่ำ วางรอบ "ขอบ" จอ ให้กลางจอยังขาวสะอาด
// อยู่หลังเนื้อหาทั้งหมดด้วย -z-10 และไม่รับ pointer

// ไล่สีพาสเทลละมุนรอบขอบจอ กลางจาง fade เป็นขาวสะอาด ไม่บัง content
const GLOWS = [
  {
    // มุมซ้ายบน — ม่วงอ่อน (violet)
    className: '-left-[28%] -top-[30%] h-[65vh] w-[85vw] md:-left-[12%] md:w-[55vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(155, 130, 240, 0.22) 0%, rgba(155, 130, 240, 0) 70%)',
    filter: 'blur(150px)',
  },
  {
    // กลางบน — ชมพูโรส (rose/pink)
    className: '-top-[26%] left-1/2 h-[55vh] w-[75vw] -translate-x-1/2 md:w-[48vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(247, 97, 116, 0.20) 0%, rgba(247, 97, 116, 0) 70%)',
    filter: 'blur(160px)',
  },
  {
    // มุมขวาบน — ฟ้าอ่อน (sky blue)
    className: '-right-[28%] -top-[24%] h-[65vh] w-[85vw] md:-right-[12%] md:w-[55vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.21) 0%, rgba(96, 165, 250, 0) 70%)',
    filter: 'blur(170px)',
  },
  {
    // ขอบซ้าย — ลาเวนเดอร์อ่อน
    className: 'top-1/2 -left-[30%] h-[70vh] w-[65vw] -translate-y-1/2 md:-left-[14%] md:w-[40vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(184, 164, 237, 0.19) 0%, rgba(184, 164, 237, 0) 70%)',
    filter: 'blur(180px)',
  },
  {
    // ขอบขวา — เขียวอมฟ้า (teal) นุ่มมาก
    className: 'top-1/2 -right-[30%] h-[70vh] w-[65vw] -translate-y-1/2 md:-right-[14%] md:w-[40vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(94, 200, 205, 0.17) 0%, rgba(94, 200, 205, 0) 70%)',
    filter: 'blur(190px)',
  },
  {
    // มุมซ้ายล่าง — ลาเวนเดอร์อ่อนมาก
    className: '-bottom-[30%] -left-[24%] h-[60vh] w-[80vw] md:-left-[10%] md:w-[50vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(184, 164, 237, 0.18) 0%, rgba(184, 164, 237, 0) 70%)',
    filter: 'blur(190px)',
  },
  {
    // กลางล่าง — น้ำเงินอินดิโก (indigo)
    className: '-bottom-[28%] left-1/2 h-[58vh] w-[78vw] -translate-x-1/2 md:w-[50vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(79, 114, 229, 0.19) 0%, rgba(79, 114, 229, 0) 70%)',
    filter: 'blur(200px)',
  },
  {
    // มุมขวาล่าง — ชมพูอ่อน
    className: '-bottom-[26%] -right-[24%] h-[60vh] w-[80vw] md:-right-[10%] md:w-[50vw]',
    background: 'radial-gradient(circle at 50% 50%, rgba(247, 97, 116, 0.17) 0%, rgba(247, 97, 116, 0) 70%)',
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
