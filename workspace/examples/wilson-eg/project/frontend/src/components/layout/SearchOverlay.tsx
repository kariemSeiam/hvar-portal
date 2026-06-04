/**
 * SearchOverlay — Full-width search bar sliding from header
 * Opens on search icon tap, submits to /products?search=...
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const { t, isRTL } = useLanguage()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when open
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Escape key to close
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Clear query when closed
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`/products?search=${encodeURIComponent(trimmed)}`)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="search-overlay"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="dialog"
      aria-label={t('nav.search')}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 min-w-0">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('nav.searchPlaceholder')}
          className="search-overlay-input"
          dir={isRTL ? 'rtl' : 'ltr'}
          aria-label={t('nav.search')}
        />
      </form>
      <button
        type="button"
        onClick={onClose}
        className="search-overlay-close"
        aria-label={isRTL ? 'إغلاق' : 'Close'}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
