// เมนู — หน้ารวมเมนู: โปรไฟล์ + ตั้งค่าเงินเดือน + ตกแต่งหมวดหมู่ + ลบบัญชี
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Tags, ChevronRight, LogOut, Trash2, TriangleAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Modal } from '../components/ui'

export default function Settings() {
  const { user, signOut } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function deleteAccount() {
    // mock: ล้างข้อมูลในเครื่องแล้วออกจากระบบ (ข้อมูลรายการอยู่ใน memory จะรีเซ็ตเมื่อโหลดใหม่)
    try {
      localStorage.removeItem('spendwise.auth')
      localStorage.removeItem('spendwise.sound')
    } catch {
      // ignore
    }
    signOut()
  }

  return (
    // ไม่แสดงชื่อหน้าตามดีไซน์ใหม่
    <div className="space-y-4">
      {/* โปรไฟล์ + ล็อกเอาต์ */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-semibold text-white">
            {(user?.display_name?.[0] || 'U').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{user?.display_name || 'ผู้ใช้'}</p>
            <p className="truncate text-sm text-muted">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-expense/10 hover:text-expense active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </Card>

      {/* รายการเมนู */}
      <Card className="divide-y divide-hairline-soft overflow-hidden p-0">
        <MenuRow
          to="/settings/salary"
          icon={Wallet}
          title="ตั้งค่าเงินเดือน"
          subtitle="เชื่อมบัญชีเดิม หรือกำหนดเงินเข้าอัตโนมัติ"
        />
        <MenuRow
          to="/settings/categories"
          icon={Tags}
          title="ตกแต่งหมวดหมู่"
          subtitle="เพิ่ม/ลบหมวดหมู่ของคุณเอง"
        />
      </Card>

      {/* ลบบัญชี — อยู่ท้ายสุด */}
      <Card className="overflow-hidden p-0">
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-expense/5 active:bg-expense/10"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-expense/10 text-expense">
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-expense">ลบบัญชีนี้</p>
            <p className="truncate text-xs text-muted">ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-soft" />
        </button>
      </Card>

      {confirmDelete && (
        <Modal open onClose={() => setConfirmDelete(false)} title="ลบบัญชีนี้">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-expense/10 text-expense">
              <TriangleAlert className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm leading-relaxed text-body">
              การลบบัญชีจะลบข้อมูลรายรับ-รายจ่าย เป้าหมาย และการตั้งค่าทั้งหมดอย่างถาวร
              <br />
              <span className="font-medium text-ink">การกระทำนี้ย้อนกลับไม่ได้</span>
            </p>
          </div>
          <div className="mt-6 flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
              ยกเลิก
            </Button>
            <Button variant="danger" className="flex-1" onClick={deleteAccount}>
              <Trash2 className="h-4 w-4" />
              ลบบัญชี
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function MenuRow({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-card/60 active:bg-surface-card"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-card text-ink">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-soft" />
    </Link>
  )
}
