import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/services/api'
import type { Category } from '@/types'

const CATEGORIES_QUERY_KEY = ['categories'] as const

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => categoriesApi.getAll(),
    staleTime: 5 * 60 * 1000,
  })
}
