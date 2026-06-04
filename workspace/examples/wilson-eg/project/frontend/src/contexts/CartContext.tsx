import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { Product, CartItem } from '@/types'

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number
  shipping: number
  total: number
  isLoading: boolean
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
  syncWithServer: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_KEY = 'wilson-cart'
const FREE_SHIPPING_THRESHOLD = 3000
const DEFAULT_SHIPPING = 75

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CART_KEY)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [isLoading] = useState(false)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.basePrice
    return sum + price * item.quantity
  }, 0)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING
  const total = subtotal + shipping

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const isInCart = useCallback(
    (productId: string) => {
      return items.some((item) => item.product.id === productId)
    },
    [items]
  )

  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = items.find((item) => item.product.id === productId)
      return item?.quantity ?? 0
    },
    [items]
  )

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id)

      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
        return updated
      }

      const price = product.discountPrice ?? product.basePrice
      const newItem: CartItem = {
        id: `cart-${product.id}-${Date.now()}`,
        product,
        quantity,
        price,
      }
      return [...prev, newItem]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId)
        return
      }

      setItems((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      )
    },
    [removeItem]
  )

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  // Cart is client-side only; backend has no /api/cart/sync. No-op for future server sync.
  const syncWithServer = useCallback(async () => {
    // Reserved for future cart persistence when backend supports it
  }, [])

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shipping,
        total,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
        syncWithServer,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextType {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
