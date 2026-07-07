# SpendWise — Frontend (Phase 1)

เว็บแอปทำบัญชีรายรับรายจ่ายส่วนบุคคล พร้อมผู้ช่วย AI — ส่วน **Frontend เฟส 1**
สร้างด้วย **React + Vite + Tailwind CSS v4**

> เฟสนี้เป็น UI ทั้งหมดที่ทำงานได้จริงบน **ข้อมูลจำลอง (mock) ในเครื่อง** ยังไม่ต่อ backend/Supabase
> โครงสร้าง API layer ออกแบบให้สลับไปเรียก Go backend จริงได้ภายหลังโดยแทบไม่ต้องแก้ component

## ฟีเจอร์ในเฟสนี้

- 🔐 **Login / Register** (mock auth เก็บ session ใน localStorage)
- 📊 **Dashboard** — การ์ดสรุปรายรับ/รายจ่าย/คงเหลือ, Pie รายจ่ายตามหมวด, Line แนวโน้ม 6 เดือน, รายการล่าสุด
- 💸 **Transactions** — filter เดือน/ประเภท/หมวด, quick-add ด้วย AI (พิมพ์ “KFC 249” → AI จัดหมวดให้), เพิ่ม/แก้ไข/ลบ
- 🎯 **Goals** — progress bar + ปุ่ม “ให้ AI วางแผนออม” (คำนวณเงินออม/เดือน, OT, หมวดที่ควรลด)
- ✨ **What-if** — ถามภาษาไทยอิสระ แล้วดูผลกระทบต่อเดือน/ปี/5 ปี
- ⚙️ **Settings** — แก้ฐานเงินเดือน + จัดการหมวดหมู่ที่สร้างเอง

UI ภาษาไทย, responsive (mobile-first), แสดงเงินรูปแบบ `1,234.56 ฿`

## เริ่มใช้งาน

```bash
npm install
npm run dev      # เปิด http://localhost:5173
```

หน้า Login (เดโม): กรอกอีเมล/รหัสผ่านใดก็ได้ (รหัสอย่างน้อย 6 ตัว) เพื่อเข้าใช้งาน

```bash
npm run build    # production build
npm run lint     # ตรวจโค้ดด้วย oxlint
```

## โครงสร้างโค้ด

```
src/
  lib/
    format.js       ฟังก์ชัน format เงิน/วันที่ (ภาษาไทย, พ.ศ.)
    mockData.js     seed หมวดหมู่ + รายการ 6 เดือน + เป้าหมาย (อิง schema ใน PROJECT_SPEC.md)
    api.js          fake API layer (async) จำลอง REST endpoints + logic AI
  context/
    AuthContext.jsx auth แบบจำลอง
  components/
    ui.jsx          UI primitives (Button, Card, Input, Modal, Badge, ไอคอนหมวด ...)
    Layout.jsx      sidebar (desktop) + bottom nav (mobile)
    MonthPicker.jsx
  pages/            Login, Dashboard, Transactions, Goals, WhatIf, Settings
```

## เชื่อมต่อ backend จริง (เฟสถัดไป)

1. คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่า `VITE_SUPABASE_*` และ `VITE_API_BASE_URL`
2. แทนที่ฟังก์ชันใน `src/lib/api.js` ด้วย `fetch()` ที่แนบ `Authorization: Bearer <JWT>`
3. แทน `AuthContext` ด้วย `supabase-js` (`signInWithPassword`, `onAuthStateChange`)

รูปแบบข้อมูลที่ทุกฟังก์ชันคืนค่าถูกออกแบบให้ตรงกับ endpoint ใน [PROJECT_SPEC.md](PROJECT_SPEC.md) แล้ว

## Tech stack

React 19 · Vite 8 · Tailwind CSS v4 · React Router · TanStack Query · Recharts · lucide-react
