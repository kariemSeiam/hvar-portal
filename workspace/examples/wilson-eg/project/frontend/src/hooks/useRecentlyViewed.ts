import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'wilson-recently-viewed'
const MAX_ITEMS = 8

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // ignore
    }
  }, [ids])

  const add = useCallback((productId: string) => {
    setIds((prev) => {
      const filtered = prev.filter((id) => id !== productId)
      return [productId, ...filtered].slice(0, MAX_ITEMS)
    })
  }, [])

  const remove = useCallback((productId: string) => {
    setIds((prev) => prev.filter((id) => id !== productId))
  }, [])

  const clear = useCallback(() => setIds([]), [])

  return { ids, add, remove, clear }
}
