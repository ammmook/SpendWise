// UI primitives — ตามระบบดีไซน์ DESIGN.md
// ปุ่มเป็น pill เสมอ, การ์ดใช้เส้น hairline แทนเงา, สีจาก pastel color-block
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Wallet, Clock, Gift, Briefcase, UtensilsCrossed, Coffee, Bus, Home, Plug,
  ShoppingBag, Clapperboard, HeartPulse, GraduationCap, PiggyBank, Ellipsis,
  Tag, X, Loader2, Landmark, CreditCard, Banknote, TrendingUp,
} from 'lucide-react'

const ICONS = {
  Wallet, Clock, Gift, Briefcase, UtensilsCrossed, Coffee, Bus, Home, Plug,
  ShoppingBag, Clapperboard, HeartPulse, GraduationCap, PiggyBank, Ellipsis, Tag,
  Landmark, CreditCard, Banknote, TrendingUp,
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
  // ปุ่มมุมโค้ง 12px (rounded-xl) ตาม DESIGN.md (Clay) — ไม่ใช่ pill
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[transform,background-color,border-color,box-shadow,opacity] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 disabled:opacity-45 disabled:cursor-not-allowed active:scale-[0.98]'
  const variants = {
    primary: 'bg-ink text-white hover:bg-ink/90',
    secondary: 'bg-canvas text-ink border border-hairline hover:bg-surface-card',
    onColor: 'bg-canvas text-ink hover:bg-surface-card',
    ghost: 'text-ink hover:bg-surface-card',
    danger: 'bg-canvas text-expense border border-expense/25 hover:bg-expense/10',
    ai: 'ai-gradient text-white hover:opacity-90', // เฉพาะฟีเจอร์ AI
  }
  // ขนาดกระชับบนมือถือ แล้วขยายที่ sm ขึ้นไป
  const sizes = {
    sm: 'h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm',
    md: 'h-10 px-4 text-sm sm:h-11 sm:px-5',
    lg: 'h-11 px-5 text-sm sm:h-12 sm:px-6 sm:text-base',
    icon: 'h-9 w-9 sm:h-10 sm:w-10',
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

/** การ์ดเนื้อหา — canvas + เส้น hairline, มุมโค้ง 16px (rounded-2xl) */
export function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-hairline bg-canvas',
        interactive && 'hover-soft',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** Feature card — สีจัดแบบ Clay, มุมโค้ง 24px (rounded-3xl); interactive = ยกลอยตอน hover */
export function ColorBlock({ tone = 'lavender', className = '', interactive = false, children, ...props }) {
  const tones = {
    pink: 'bg-pink text-white',
    teal: 'bg-teal text-white',
    coral: 'bg-coral text-white',
    lavender: 'bg-lavender text-ink',
    peach: 'bg-peach text-ink',
    ochre: 'bg-ochre text-ink',
    mint: 'bg-mint text-ink',
    cream: 'bg-surface-card text-ink',
  }
  return (
    <div className={cx('rounded-3xl', tones[tone], interactive && 'hover-soft', className)} {...props}>
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
        <span className="mt-1 block text-xs font-medium text-expense">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

// input radius = 12px (rounded-xl) ตาม DESIGN.md (Clay), สูง 44px, โฟกัสด้วยขอบ ink
const inputBase =
  'w-full h-11 rounded-xl border border-hairline bg-canvas px-4 text-sm text-ink placeholder:text-muted-soft transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10'

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

/** Badge — pill ฟิลล์ครีม/สีอ่อน (badge-pill) */
export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-surface-card text-ink',
    income: 'bg-mint text-ink',
    expense: 'bg-peach text-ink',
    ai: 'ai-gradient text-white', // เฉพาะฟีเจอร์ AI
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

/** Modal — ปิดด้วย ESC / คลิกฉากหลัง; tone="ai" = หัวโมดัลใช้ gradient ของ AI */
export function Modal({ open, onClose, title, children, footer, tone }) {
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
        className="animate-scale-in relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-hairline bg-canvas shadow-2xl sm:rounded-2xl"
      >
        <div
          className={cx(
            'flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5',
            tone === 'ai' ? 'ai-gradient text-white' : 'border-b border-hairline-soft',
          )}
        >
          <h2 className={cx('font-semibold', tone === 'ai' ? 'text-base' : 'display text-lg text-ink')}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className={cx(
              'rounded-lg p-1.5 transition-colors',
              tone === 'ai'
                ? 'text-white/80 hover:bg-white/20 hover:text-white'
                : 'text-muted hover:bg-surface-card hover:text-ink',
            )}
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {children}
          {footer && <div className="mt-5 flex gap-2.5">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
