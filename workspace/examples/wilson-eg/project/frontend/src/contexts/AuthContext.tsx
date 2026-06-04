import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import type { User, Address } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (phone: string, otp: string) => Promise<void>
  requestOtp: (phone: string) => Promise<User>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  addresses: Address[]
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>
  deleteAddress: (id: string) => Promise<void>
  setDefaultAddress: (id: string) => Promise<void>
  getDefaultAddress: () => Address | undefined
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'wilson-token'
const USER_KEY = 'wilson-user'

function buildUrl(path: string): string {
  const base = API_BASE.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return base.startsWith('http') ? `${base}${p}` : `${base}${p}`
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem(USER_KEY)
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  })
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const isAuthenticated = !!user && !!token
  const isAdmin = user?.role === 'admin'

  // Validate token on mount; sync role from backend so admin access is correct
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (!storedToken) return
    fetch(buildUrl('/profile'), {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((r) => {
        if (r.status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          setUser(null)
          setToken(null)
          return
        }
        if (r.ok && storedUser) {
          r.json().then((data) => {
            // Only sync role when backend returns it; some deployed backends omit it.
            // Fallback: phone 0000000000 is always admin (matches backend convention).
            const backendRole = data.role === 'admin' ? 'admin' : data.role === 'user' ? 'user' : undefined
            const inferredRole = data.phone === '0000000000' ? 'admin' : undefined
            setUser((prev) => {
              if (!prev) return null
              const role = backendRole ?? inferredRole ?? prev.role ?? 'user'
              if (prev.role === role) return prev
              const next = { ...prev, role }
              localStorage.setItem(USER_KEY, JSON.stringify(next))
              return next
            })
          }).catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  const fetchAddresses = useCallback(async () => {
    if (!token) return
    try {
      const response = await fetch(buildUrl('/profile'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        const addrs = (data.addresses || []).map((a: { id: string; governorate: string; district: string; details: string; is_default: boolean }) => ({
          id: a.id,
          governorate: a.governorate,
          district: a.district,
          details: a.details,
          isDefault: a.is_default,
        }))
        setAddresses(addrs)
      }
    } catch {
      console.error('Failed to fetch addresses')
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchAddresses()
    }
  }, [token, fetchAddresses])

  const requestOtp = async (phone: string): Promise<User> => {
    setIsLoading(true)
    try {
      const response = await fetch(buildUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to login')
      }
      const gotToken = data.token && typeof data.token === 'string'
      if (!gotToken) {
        throw new Error('Invalid login response: no token')
      }
      const tokenStr = data.token
      setToken(tokenStr)
      localStorage.setItem(TOKEN_KEY, tokenStr)

      // Use profile to get authoritative role (backend may have upgraded admin on login)
      let role: 'user' | 'admin' = (data.user?.role ?? data.role ?? 'user') === 'admin' ? 'admin' : 'user'
      try {
        const profileRes = await fetch(buildUrl('/profile'), {
          headers: { Authorization: `Bearer ${tokenStr}` },
        })
        if (profileRes.ok) {
          const profile = await profileRes.json()
          if (profile.role === 'admin') role = 'admin'
        }
      } catch {
        /* use role from login */
      }

      const userData = data.user || data
      const u: User = {
        id: String(userData.id),
        phone: String(userData.phone),
        name: userData.name ?? null,
        email: null,
        role,
        isProfileComplete: !!userData.name,
        createdAt: userData.createdAt ?? new Date().toISOString(),
      }
      setUser(u)
      localStorage.setItem(USER_KEY, JSON.stringify(u))
      return u
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (phone: string, _otp?: string) => {
    await requestOtp(phone)
  }

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setAddresses([])
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const updateProfile = async (data: Partial<User>) => {
    if (!token) return
    setIsLoading(true)
    try {
      const response = await fetch(buildUrl('/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update profile')
      }
      const res = await response.json()
      const u = res.user || res
      const updated: User = {
        id: u.id,
        phone: u.phone,
        name: u.name ?? null,
        email: null,
        role: u.role ?? 'user',
        isProfileComplete: !!u.name,
        createdAt: user?.createdAt ?? new Date().toISOString(),
      }
      setUser(updated)
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
    } finally {
      setIsLoading(false)
    }
  }

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!token) return
    setIsLoading(true)
    try {
      const response = await fetch(buildUrl('/addresses'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          governorate: address.governorate,
          district: address.district,
          details: address.details,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add address')
      }
      const data = await response.json()
      const a = data.address || data
      const newAddress: Address = {
        id: a.id,
        governorate: a.governorate,
        district: a.district,
        details: a.details,
        isDefault: a.is_default ?? a.isDefault ?? false,
      }
      setAddresses((prev) => [...prev, newAddress])
    } finally {
      setIsLoading(false)
    }
  }

  const updateAddress = async (id: string, address: Partial<Address>) => {
    if (!token) return
    setIsLoading(true)
    try {
      const response = await fetch(buildUrl(`/addresses/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...address,
          is_default: address.isDefault,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update address')
      }
      const data = await response.json()
      const a = data.address || data
      const updated: Address = {
        id: a.id,
        governorate: a.governorate,
        district: a.district,
        details: a.details,
        isDefault: a.is_default ?? a.isDefault ?? false,
      }
      setAddresses((prev) => prev.map((x) => (x.id === id ? updated : x)))
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAddress = async (id: string) => {
    if (!token) return
    try {
      const response = await fetch(buildUrl(`/addresses/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete address')
      }
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (error) {
      console.error('Failed to delete address:', error)
      throw error
    }
  }

  const setDefaultAddress = async (id: string) => {
    if (!token) return
    try {
      await updateAddress(id, { isDefault: true })
    } catch (error) {
      console.error('Failed to set default address:', error)
      throw error
    }
  }

  const getDefaultAddress = () => addresses.find((a) => a.isDefault)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        requestOtp,
        logout,
        updateProfile,
        addresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        getDefaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
