import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '@/contexts/LanguageContext'
import type { Product } from '@/types'
import ProductsPage from './ProductsPage'

vi.mock('@/services/api', () => ({
  productsApi: {
    getAll: vi.fn(),
  },
}))

const { productsApi } = await import('@/services/api')

const mockProduct: Product = {
  id: 'prod-1',
  nameAr: 'منتج تجريبي',
  nameEn: 'Test Product',
  basePrice: 5000,
  discountPrice: null,
  inStock: true,
  stockQuantity: 10,
  rating: 4.5,
  ratingCount: 20,
  warrantyYears: 2,
  sku: 'SKU-001',
  category: 'refrigerators',
  tag: null,
  tagColor: null,
  status: 'active',
  specifications: {},
  thumbnail: '',
  images: [],
  views: 0,
  salesCount: 0,
  isFavorite: false,
  energyRating: null,
  createdAt: new Date().toISOString(),
  features: [],
  descriptionAr: '',
  descriptionEn: '',
}

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={['/products']}>
          <ProductsPage />
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>
  )
}

describe('ProductsPage integration', () => {
  beforeEach(() => {
    vi.mocked(productsApi.getAll).mockResolvedValue({
      items: [mockProduct],
      total: 1,
      pages: 1,
      currentPage: 1,
    })
  })

  it('loads and displays products from API', async () => {
    renderWithProviders()
    expect(productsApi.getAll).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText(/Test Product|منتج تجريبي/)).toBeInTheDocument()
    })
  })

  it('shows product price', async () => {
    renderWithProviders()
    await waitFor(() => {
      expect(screen.getByText(/5,000|٥٬٠٠٠/)).toBeInTheDocument()
    })
  })
})
