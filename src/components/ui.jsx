// UI primitives — ตามระบบดีไซน์ DESIGN.md
// ปุ่มเป็น pill เสมอ, การ์ดใช้เส้น hairline แทนเงา, สีจาก pastel color-block
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Wallet, Clock, Gift, Briefcase, UtensilsCrossed, Coffee, Bus, Home, Plug,
  ShoppingBag, Clapperboard, HeartPulse, GraduationCap, PiggyBank, Ellipsis,
  Tag, X, Loader2,
} from 'lucide-react'

const ICONS = {
  Wallet, Clock, Gift, Briefcase, UtensilsCrossed, Coffee, Bus, Home, Plug,
  ShoppingBag, Clapperboard, HeartPulse, GraduationCap, PiggyBank, Ellipsis, Tag,
}

/** ไอคอนหมวดหมู่จากชื่อ (fallback เป็น Tag) */
export function CategoryIcon({ name, className = 'h-5 w-5' }) {
  const Icon = ICONS[name] || Tag
  return <Icon className={className} strokeWidth={1.8} aria-hidden="true" />
}

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

/** Eyebrow — ป้ายหมวด mono ตัวพิมพ์ใหญ่ */
export function Eyebrow({ children, className = '' }) {
  return <p className={cx('eyebrow', className)}>{children}</p>
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  ...props
}) {
  // ปุ่มทุกตัวเป็น pill (rounded-full) ตาม DESIGN.md
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,border-color,box-shadow,opacity] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]'
  const variants = {
    primary: 'bg-ink text-canvas hover:bg-ink/90',
    secondary: 'bg-canvas text-ink border border-hairline hover:bg-surface',
    ghost: 'text-ink hover:bg-surface',
    danger: 'bg-canvas text-[#e34948] border border-[#f0caca] hover:bg-[#fbeeee]',
  }
  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  }
  return (
    <button
      className={cx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

/** การ์ดมาตรฐาน — เส้น hairline; ใส่ interactive เพื่อยกลอยตอน hover */
export function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <div
      className={cx(
        'rounded-3xl border border-hairline bg-canvas',
        interactive && 'hover-lift',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** Color block — พาเนลพาสเทลขนาดใหญ่ (signature); interactive = ยกลอยตอน hover */
export function ColorBlock({ tone = 'lilac', className = '', interactive = false, children, ...props }) {
  const tones = {
    lime: 'bg-lime text-ink',
    lilac: 'bg-lilac text-ink',
    cream: 'bg-cream text-ink',
    pink: 'bg-pink text-ink',
    mint: 'bg-mint text-ink',
    coral: 'bg-coral text-ink',
    navy: 'bg-navy text-canvas',
  }
  return (
    <div className={cx('rounded-3xl', tones[tone], interactive && 'hover-lift', className)} {...props}>
      {children}
    </div>
  )
}

/** Skeleton block สำหรับ loading state (shimmer) */
export function Skeleton({ className = '' }) {
  return <div className={cx('skeleton', className)} aria-hidden="true" />
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-[#e34948]">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

// input radius = 8px (rounded-lg) ตาม DESIGN.md, focus ด้วย ring ไม่เปลี่ยนพื้น
const inputBase =
  'w-full h-11 rounded-lg border border-hairline bg-canvas px-3.5 text-sm text-ink placeholder:text-muted transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15'

export function Input({ className = '', ...props }) {
  return <input className={cx(inputBase, className)} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={cx(inputBase, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
}

/** Badge — พื้น pastel ตัวหนังสือดำเสมอ */
export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-surface text-ink',
    income: 'bg-mint text-ink',
    expense: 'bg-pink text-ink',
    ai: 'bg-lilac text-ink',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Spinner({ className = 'h-6 w-6' }) {
  return <Loader2 className={cx('animate-spin text-ink', className)} aria-label="กำลังโหลด" />
}

export function LoadingBlock({ label = 'กำลังโหลด...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="px-6 py-12">
      <div className="mb-4 h-1 w-10 rounded-full bg-ink" />
      <p className="eyebrow mb-2">Empty</p>
      <p className="display text-2xl text-ink">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/** Modal — ปิดด้วย ESC / คลิกฉากหลัง (modal เป็นระดับเดียวที่มีเงาได้) */
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-scale-in relative z-10 w-full max-w-md rounded-t-3xl border border-hairline bg-canvas p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="display text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-ink"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
