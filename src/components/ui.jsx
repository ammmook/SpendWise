// UI primitives ที่ใช้ซ้ำทั้งแอป — คุมสไตล์ให้สอดคล้องกันจากที่เดียว
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Wallet, Clock, Gift, Briefcase, UtensilsCrossed, Coffee, Bus, Home, Plug,
  ShoppingBag, Clapperboard, HeartPulse, GraduationCap, PiggyBank, Ellipsis,
  Tag, X, Loader2, Inbox,
} from 'lucide-react'

const ICONS = {
  Wallet, Clock, Gift, Briefcase, UtensilsCrossed, Coffee, Bus, Home, Plug,
  ShoppingBag, Clapperboard, HeartPulse, GraduationCap, PiggyBank, Ellipsis, Tag,
}

/** ไอคอนหมวดหมู่จากชื่อ (fallback เป็น Tag) */
export function CategoryIcon({ name, className = 'h-5 w-5' }) {
  const Icon = ICONS[name] || Tag
  return <Icon className={className} strokeWidth={1.9} aria-hidden="true" />
}

function cx(...parts) {
  return parts.filter(Boolean).join(' ')
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
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50',
    ghost: 'text-ink-600 hover:bg-ink-100',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100',
  }
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-9 w-9',
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

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={cx(
        'rounded-2xl bg-white shadow-[var(--shadow-card)] border border-ink-100',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-rose-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-400">{hint}</span>
      ) : null}
    </label>
  )
}

const inputBase =
  'w-full h-11 rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-800 placeholder:text-ink-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

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

export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-ink-100 text-ink-600',
    income: 'bg-brand-50 text-brand-700',
    expense: 'bg-rose-50 text-rose-600',
    ai: 'bg-violet-50 text-violet-600',
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
  return <Loader2 className={cx('animate-spin text-brand-500', className)} aria-label="กำลังโหลด" />
}

export function LoadingBlock({ label = 'กำลังโหลด...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-400">
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        <Inbox className="h-7 w-7" strokeWidth={1.6} />
      </div>
      <div>
        <p className="font-semibold text-ink-700">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Modal ทั่วไป — ปิดด้วย ESC / คลิกฉากหลัง, ล็อค scroll ของ body */
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
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-6 shadow-[var(--shadow-pop)] sm:rounded-2xl animate-[fadeIn_.15s_ease-out]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
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
