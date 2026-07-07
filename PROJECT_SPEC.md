# Project Spec: Personal Finance Tracker + AI Analysis

> เอกสารนี้คือ specification สำหรับเริ่มเขียนโค้ด สรุปจากการวิเคราะห์ระบบ (System Analysis) ที่ทำไว้แล้ว
> ให้ยึดตามการตัดสินใจในเอกสารนี้ ถ้าส่วนไหนไม่ได้ระบุ ให้เลือกแนวทางที่เรียบง่ายที่สุดก่อน

---

## 1. ภาพรวมโปรเจกต์

เว็บแอปทำบัญชีรายรับรายจ่ายส่วนบุคคล พร้อมวิเคราะห์การเงินด้วย AI ประกอบด้วย

1. บันทึก/จัดการรายรับรายจ่าย (CRUD)
2. Dashboard สรุปการเงิน (ยอดเดือนนี้, กราฟรายจ่ายตามหมวด, แนวโน้มย้อนหลัง)
3. Sync ฐานเงินเดือน (รายรับหลัก) จากเว็บเดิมที่ใช้ Supabase อยู่แล้ว
4. ฟีเจอร์ AI 3 ตัว: Auto Categorize, Goal Planner, What-if Simulation

ภาษา UI: ไทยเป็นหลัก

---

## 2. Tech Stack (ตัดสินใจแล้ว)

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Recharts (กราฟ), TanStack Query (data fetching) |
| Backend | Go + Gin framework, layered architecture (handler → service → repository) |
| Database | Supabase PostgreSQL (ต่อผ่าน connection pooler, port 6543) ใช้ `pgx` |
| Auth | Supabase Auth — frontend login ผ่าน supabase-js ได้ JWT แล้วแนบ `Authorization: Bearer <token>` ทุก request ไปหา Go |
| AI | Google Gemini 2.5 Flash (free tier) เรียกจากฝั่ง Go เท่านั้น |
| Deploy | Frontend → Vercel, Backend → Docker บน Render/Railway/Fly.io |

**เหตุผลสำคัญ:** Gemini API key ห้ามอยู่ฝั่ง frontend เด็ดขาด ทุก AI request ต้องวิ่งผ่าน Go backend

---

## 3. Architecture

```
React (Vite) ──JWT──▶ Go Backend (Gin) ──▶ Supabase PostgreSQL
                            │
                            └──▶ Gemini 2.5 Flash API
เว็บเดิม (เงินเดือน) ──sync──▶ PostgreSQL (transactions, source='salary_sync')
```

- Go ทำหน้าที่: REST API, ตรวจ JWT, business logic, AI proxy, cron sync เงินเดือน
- Frontend ไม่คุยกับ Postgres ตรง (ยกเว้น Supabase Auth สำหรับ login/register เท่านั้น)

---

## 4. Database Schema (PostgreSQL)

รัน SQL นี้ใน Supabase SQL Editor (schema ออกแบบและตรวจแล้ว ห้ามเปลี่ยนชื่อตาราง/คอลัมน์)

```sql
-- PROFILES: 1:1 กับ auth.users สร้างอัตโนมัติด้วย trigger ตอน signup
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  base_salary   numeric(12,2) default 0 check (base_salary >= 0),
  currency      text not null default 'THB',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- CATEGORIES: user_id IS NULL = หมวด default ใช้ร่วมกันทุกคน
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  name        text not null,
  name_th     text not null,
  type        text not null check (type in ('income', 'expense')),
  icon        text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, name, type)
);

-- TRANSACTIONS: หัวใจของระบบ / amount เป็นบวกเสมอ แยกทิศทางด้วย type
create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  category_id       uuid references public.categories(id) on delete set null,
  type              text not null check (type in ('income', 'expense')),
  amount            numeric(12,2) not null check (amount > 0),
  description       text,
  transaction_date  date not null default current_date,
  source            text not null default 'manual' check (source in ('manual', 'salary_sync')),
  ai_categorized    boolean not null default false,
  created_at        timestamptz not null default now()
);

create index idx_transactions_user_date on public.transactions (user_id, transaction_date desc);
create index idx_transactions_user_category on public.transactions (user_id, category_id);

-- กัน sync เงินเดือนซ้ำเดือนเดิม (idempotent)
create unique index uq_salary_sync_per_month
  on public.transactions (user_id, date_trunc('month', transaction_date))
  where source = 'salary_sync';

-- GOALS: เป้าหมายการออม / ai_plan เก็บ JSON จาก Gemini
create table public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  name           text not null,
  target_amount  numeric(12,2) not null check (target_amount > 0),
  saved_amount   numeric(12,2) not null default 0 check (saved_amount >= 0),
  target_date    date,
  status         text not null default 'active' check (status in ('active', 'achieved', 'cancelled')),
  ai_plan        jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- KEYWORD_MAP: cache ของ AI Auto Categorize (keyword เก็บ lowercase เสมอ)
create table public.keyword_map (
  id            uuid primary key default gen_random_uuid(),
  keyword       text not null unique,
  category_id   uuid not null references public.categories(id) on delete cascade,
  hit_count     integer not null default 1,
  last_used_at  timestamptz not null default now()
);

-- VIEW สรุปรายเดือน (ต้องมี security_invoker = true)
create or replace view public.monthly_summary
with (security_invoker = true) as
select t.user_id,
       date_trunc('month', t.transaction_date)::date as month,
       t.type, c.name as category, c.name_th as category_th,
       sum(t.amount) as total, count(*) as tx_count
from public.transactions t
left join public.categories c on c.id = t.category_id
group by 1, 2, 3, 4, 5;
```

**เพิ่มเติมที่ต้องทำ:**
- Enable RLS ทุกตาราง + policies แบบ `auth.uid() = user_id` (เป็น defense ชั้นสอง แม้ Go จะกรองเองแล้ว)
- Seed หมวดหมู่ default: Salary/เงินเดือน, Overtime/ค่า OT, Bonus/โบนัส, Side Income/รายได้เสริม (income) และ Food/อาหาร, Coffee & Drinks/กาแฟ, Transport/เดินทาง, Housing/ที่พัก, Utilities/น้ำไฟเน็ต, Shopping/ช้อปปิ้ง, Entertainment/บันเทิง, Health/สุขภาพ, Education/การศึกษา, Savings/เงินออม, Other/อื่นๆ (expense) — ทุกแถว `is_default = true, user_id = null`

---

## 5. Go Backend — REST API

### โครงสร้างโปรเจกต์ (layered)

```
/cmd/server/main.go
/internal
  /handler      -- Gin handlers, bind/validate request
  /service      -- business logic
  /repository   -- pgx queries
  /middleware   -- JWT auth middleware
  /model        -- structs
  /ai           -- Gemini client + prompts
/migrations
```

### Endpoints (prefix `/api/v1`, ทุกตัวต้องผ่าน JWT middleware)

| Method | Path | หน้าที่ |
|---|---|---|
| GET | /me | โปรไฟล์ + base_salary |
| PUT | /me | แก้โปรไฟล์ |
| GET | /categories | หมวด default + ของ user |
| POST | /categories | เพิ่มหมวด custom |
| GET | /transactions?month=YYYY-MM&type=&category_id= | รายการ + pagination |
| POST | /transactions | เพิ่มรายการ |
| PUT | /transactions/:id | แก้ไข |
| DELETE | /transactions/:id | ลบ |
| GET | /dashboard/summary?month=YYYY-MM | ยอดรวม income/expense/balance + breakdown ตามหมวด + แนวโน้ม 6 เดือน |
| GET | /goals, POST /goals, PUT /goals/:id, DELETE /goals/:id | CRUD เป้าหมาย |
| POST | /ai/categorize | body: `{description, amount}` → `{category_id, category_name, confidence, from_cache}` |
| POST | /ai/goal-plan | body: `{goal_id}` → แผนออม (บันทึกลง goals.ai_plan ด้วย) |
| POST | /ai/what-if | body: `{question}` → ผลคำนวณ + คำอธิบาย |
| POST | /internal/sync-salary | เรียกโดย cron (ป้องกันด้วย secret header) sync เงินเดือนเดือนปัจจุบัน |

### กติกาความปลอดภัย (บังคับ)

1. **JWT middleware**: verify token ด้วย `SUPABASE_JWT_SECRET` (HS256) ดึง `user_id` จาก claim `sub` ใส่ใน Gin context
2. **ทุก query ต้อง filter `WHERE user_id = $1`** โดยใช้ค่าจาก JWT เท่านั้น — **ห้ามรับ user_id จาก request body/query เด็ดขาด** (กัน IDOR)
3. ใช้ parameterized query เสมอ (กัน SQL injection)
4. Gemini API key อยู่ใน env ฝั่ง Go เท่านั้น
5. CORS อนุญาตเฉพาะ origin ของ frontend

---

## 6. AI Features — Logic ที่ต้อง implement

หลักการรวม: **ให้โค้ดคำนวณตัวเลข ให้ AI ทำเฉพาะงานที่ต้องเข้าใจภาษา** (ประหยัด quota free tier + ตัวเลขไม่ผิด)

### 6.1 Auto Categorize (hybrid: cache-first)

```
1. normalize description → lowercase, ตัดตัวเลข/จำนวนเงินออก, trim
2. ค้น keyword_map ด้วย keyword ที่ match (exact หรือ prefix)
   → เจอ: ตอบทันที (from_cache=true), update hit_count + last_used_at
3. ไม่เจอ: เรียก Gemini ส่งรายชื่อหมวดทั้งหมด + description
   Prompt บังคับตอบ JSON เท่านั้น: {"category": "<ชื่อหมวดจาก list>", "confidence": 0-1}
4. parse JSON (strip ```json fence ก่อน), validate ว่า category อยู่ใน list จริง
5. confidence >= 0.7 → บันทึก keyword ลง keyword_map เพื่อครั้งหน้าไม่ต้องเรียก AI
6. confidence < 0.7 → ตอบหมวด "Other" และให้ user เลือกเอง
7. Gemini ล่ม/timeout → fallback เป็นหมวด "Other" (ห้ามทำให้บันทึกรายการล้มเหลว)
```

### 6.2 Goal Planner

```
Input จาก DB: goal (target_amount, saved_amount, target_date),
  base_salary, สรุปรายรับ-รายจ่ายเฉลี่ยแยกหมวด 3 เดือนล่าสุด (จาก monthly_summary)
คำนวณในโค้ด Go:
  - remaining = target - saved
  - months_left = จากวันนี้ถึง target_date
  - required_monthly = remaining / months_left
  - current_surplus = avg_income - avg_expense
  - OT: อัตรา OT ไทย = (base_salary / 30 / 8) × 1.5 ต่อชั่วโมง
    → ot_hours_needed = max(0, required_monthly - current_surplus) / ot_rate
ส่งตัวเลขที่คำนวณแล้ว + breakdown รายจ่ายให้ Gemini เขียน:
  - หมวดไหนควรลด ลดเท่าไหร่ (เลือกจากหมวดที่ยอดสูงและเป็น discretionary)
  - คำแนะนำภาษาไทย อ่านง่าย ให้กำลังใจ
Output JSON เก็บลง goals.ai_plan:
  {required_monthly, months_left, current_surplus, ot_hours_needed,
   cut_suggestions: [{category, current_avg, suggested_cut}], advice_th}
```

### 6.3 What-if Simulation

```
1. ส่งคำถาม user ให้ Gemini แปลงเป็น parameter JSON เท่านั้น เช่น
   "ถ้าเลิกซื้อกาแฟ" → {"action":"reduce_category","category":"Coffee & Drinks","percent":100}
   "ถ้าเงินเดือนขึ้น 10%" → {"action":"income_increase","percent":10}
2. Go คำนวณจากข้อมูลจริงของ user: ผลต่อเดือน / ปี / 5 ปี, เงินออมใหม่
3. (optional) ส่งผลลัพธ์กลับให้ Gemini เขียน insight สั้นๆ ภาษาไทย
4. ตอบ frontend: ตัวเลข (จากโค้ด) + คำอธิบาย (จาก AI)
```

### Gemini API

- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=<KEY>`
- ตั้ง `responseMimeType: "application/json"` ใน generationConfig เพื่อบังคับ JSON
- ใส่ timeout ~15s + retry 1 ครั้ง, มี fallback ทุกจุดที่เรียก AI
- ออกแบบ `ai` package ให้เป็น interface เพื่อสลับโมเดลอื่นได้ภายหลัง

---

## 7. Salary Sync (เชื่อมเว็บเดิม)

- เว็บเดิมใช้ Supabase อยู่แล้ว — ถ้าเป็น **project เดียวกัน** ให้อ่านตารางเงินเดือนตรงๆ, ถ้า **คนละ project** ให้ Go เรียก REST API / DB ของ project เดิมด้วย service credentials
- Cron (เช่น ทุกวันที่ 1) เรียก `POST /internal/sync-salary` → insert transaction: `type='income', source='salary_sync', category=Salary, amount=base_salary`
- Unique index `uq_salary_sync_per_month` กันซ้ำอยู่แล้ว — insert ซ้ำให้ทำ `ON CONFLICT DO NOTHING`

---

## 8. Frontend — หน้าหลัก

1. **Login / Register** — supabase-js
2. **Dashboard** — การ์ดสรุป (รายรับ/รายจ่าย/คงเหลือเดือนนี้), Pie chart รายจ่ายตามหมวด, Line chart แนวโน้ม 6 เดือน, รายการล่าสุด
3. **Transactions** — ตาราง + filter เดือน/หมวด/ประเภท, ฟอร์มเพิ่มรายการแบบเร็ว: พิมพ์ "KFC 249" → เรียก `/ai/categorize` → แสดงหมวดที่ AI เลือกให้กดยืนยัน/แก้ได้
4. **Goals** — list เป้าหมาย + progress bar, ปุ่ม "ให้ AI วางแผน" → แสดงแผนจาก `/ai/goal-plan`
5. **What-if** — ช่องถามภาษาไทยอิสระ + การ์ดแสดงผลเดือน/ปี/5 ปี
6. **Settings** — แก้ base_salary, จัดการหมวด custom

UI เป็นภาษาไทย, responsive (mobile-first), แสดงจำนวนเงินรูปแบบ `1,234.56 ฿`

---

## 9. Environment Variables

```
# Go backend
DATABASE_URL=postgres://...pooler.supabase.com:6543/postgres
SUPABASE_JWT_SECRET=...
GEMINI_API_KEY=...
SYNC_SECRET=...            # ป้องกัน /internal/sync-salary
ALLOWED_ORIGIN=https://<frontend>.vercel.app

# Frontend (.env)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=https://<backend>/api/v1
```

---

## 10. ลำดับการพัฒนา (ทำตามลำดับนี้)

1. **Phase 1**: Setup repo (frontend/backend แยกโฟลเดอร์), รัน schema, Go: JWT middleware + CRUD transactions/categories, React: login + หน้า transactions
2. **Phase 2**: Dashboard (endpoint summary + กราฟ Recharts) + salary sync
3. **Phase 3**: AI Auto Categorize (cache-first ตาม 6.1)
4. **Phase 4**: Goals CRUD + AI Goal Planner + What-if
5. **Phase 5**: Error handling, loading states, Dockerfile, deploy, README

**Definition of done ต่อ endpoint**: มี validation, filter ด้วย user_id จาก JWT, error response รูปแบบเดียวกัน `{"error": "..."}`, และมี fallback เมื่อ AI ล้มเหลว
