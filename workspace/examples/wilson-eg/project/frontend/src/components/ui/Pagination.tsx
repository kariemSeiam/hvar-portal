import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface PaginationContextValue {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const PaginationContext = React.createContext<PaginationContextValue | null>(null)

function usePagination() {
  const ctx = React.useContext(PaginationContext)
  if (!ctx) throw new Error('Pagination components must be used within Pagination')
  return ctx
}

interface PaginationProps {
  page?: number
  totalPages: number
  onPageChange?: (page: number) => void
  className?: string
  children: React.ReactNode
}

function Pagination({ page = 1, totalPages, onPageChange = () => {}, className, children }: PaginationProps) {
  const [currentPage, setCurrentPage] = React.useState(page)

  const handleChange = React.useCallback(
    (p: number) => {
      setCurrentPage(p)
      onPageChange(p)
    },
    [onPageChange]
  )

  React.useEffect(() => {
    setCurrentPage(page)
  }, [page])

  return (
    <PaginationContext.Provider
      value={{ page: currentPage, totalPages, onPageChange: handleChange }}
    >
      <nav role="navigation" aria-label="Pagination" className={cn('flex items-center gap-2', className)}>
        {children}
      </nav>
    </PaginationContext.Provider>
  )
}

const PaginationContent = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  )
)
PaginationContent.displayName = 'PaginationContent'

const PaginationItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn('', className)} {...props} />
)
PaginationItem.displayName = 'PaginationItem'

function PaginationLink({ page, className, ...props }: { page: number } & React.ComponentProps<typeof Button>) {
  const { page: currentPage, onPageChange } = usePagination()
  const isActive = currentPage === page

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="icon"
      className={cn('h-9 w-9', isActive && 'pointer-events-none', className)}
      onClick={() => onPageChange(page)}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Go to page ${page}`}
      {...props}
    >
      {page}
    </Button>
  )
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { page, onPageChange } = usePagination()
  const disabled = page <= 1

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn('h-9 w-9', className)}
      onClick={() => onPageChange(page - 1)}
      disabled={disabled}
      aria-label="Previous page"
      {...props}
    >
      <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
    </Button>
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { page, totalPages, onPageChange } = usePagination()
  const disabled = page >= totalPages

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn('h-9 w-9', className)}
      onClick={() => onPageChange(page + 1)}
      disabled={disabled}
      aria-label="Next page"
      {...props}
    >
      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
    </Button>
  )
}

function PaginationEllipsis({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <span className="text-muted-foreground">...</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
