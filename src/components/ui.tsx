import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ELEMENTS } from '../game/data'
import { maxHp, xpToNext } from '../game/engine'
import type { Creature, Element } from '../game/types'
import { Icon } from './Icon'

export function ElementTag({ element, small = false }: { element: Element; small?: boolean }) {
  const data = ELEMENTS[element]
  return <span className={`element-tag ${small ? 'small' : ''}`} style={{ color: data.color, backgroundColor: data.pale }}><Icon name={element} size={small ? 11 : 13} />{data.name}</span>
}

export function HealthBar({ creature, compact = false }: { creature: Creature; compact?: boolean }) {
  const maximum = maxHp(creature)
  const percentage = creature.hp / maximum * 100
  return <div className={`health ${compact ? 'compact' : ''}`}>
    <div className="health-track" role="progressbar" aria-label="Health" aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={creature.hp}>
      <span style={{ width: `${percentage}%`, backgroundColor: percentage > 50 ? '#6e9c62' : percentage > 20 ? '#d4ab51' : '#d97a62' }} />
    </div>
    {!compact && <span className="health-value">{creature.hp}<span> / {maximum} HP</span></span>}
  </div>
}

export function ExperienceBar({ creature }: { creature: Creature }) {
  return <div className="experience">
    <span className="utility">XP</span>
    <div className="xp-track" role="progressbar" aria-label="Experience to next level" aria-valuemin={0} aria-valuemax={xpToNext(creature.level)} aria-valuenow={creature.xp}>
      <span style={{ width: `${creature.xp / xpToNext(creature.level) * 100}%` }} />
    </div>
    <span className="utility">{creature.level === 40 ? 'MAX' : `${creature.xp} / ${xpToNext(creature.level)}`}</span>
  </div>
}

export function Modal({ title, eyebrow, children, onClose, className = '', feedback }: {
  title: string; eyebrow?: string; children: ReactNode; onClose?: () => void; className?: string; feedback?: string | null
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useLayoutEffect(() => {
    const dialog = ref.current
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (!document.querySelector('dialog[open]')) {
        const target = opener?.isConnected ? opener : document.getElementById('main-content')
        target?.focus({ preventScroll: true })
      }
    }
  }, [])
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose?.() }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose?.()
    }}>
    <div className="modal-header">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div>
      {onClose && <button className="icon-button close-button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button>}
    </div>
    <div className="modal-body">{children}</div>
    {feedback && <div className="modal-feedback" role="status"><Icon name="leaf" size={16} />{feedback}</div>}
  </dialog>
}

export function Petals({ amount }: { amount: number }) {
  return <span className="petals"><Icon name="leaf" size={15} />{amount.toLocaleString()}<span className="sr-only"> petals</span></span>
}

export function PressButton({ label, children, onPress, disabled }: { label: string; children: ReactNode; onPress: () => void; disabled: boolean }) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)
  const clear = () => {
    if (timeout.current) clearTimeout(timeout.current)
    if (interval.current) clearInterval(interval.current)
    timeout.current = null
    interval.current = null
  }
  useEffect(() => {
    if (disabled) clear()
    return clear
  }, [disabled])
  return <button className="direction-button" aria-label={label} disabled={disabled}
    onPointerDown={event => {
      if (event.button !== 0) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      clear()
      onPress()
      timeout.current = setTimeout(() => { interval.current = setInterval(onPress, 145) }, 250)
    }}
    onPointerUp={clear} onPointerCancel={clear} onLostPointerCapture={clear}
    onClick={event => { if (event.detail === 0) onPress() }}>
    {children}
  </button>
}
