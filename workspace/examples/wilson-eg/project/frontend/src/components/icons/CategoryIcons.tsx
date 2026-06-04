/**
 * Category icons — Lucide only, no emojis.
 * Used for category sections, filters, and product grouping.
 */
import type { LucideIcon } from 'lucide-react'
import {
  Snowflake,
  Flame,
  Droplet,
  Wind,
  Zap,
  UtensilsCrossed,
  Tv,
  Thermometer,
  Shirt,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Slug → icon; backend drives which slugs exist; unknown slugs fall back to Zap */
const MAP: Record<string, LucideIcon> = {
  freezers: Snowflake,
  refrigerators: Snowflake,
  stoves: Flame,
  water_coolers: Droplet,
  vacuum_cleaners: Wind,
  blenders: UtensilsCrossed,
  home_appliances: Zap,
  small_appliances: Zap,
  aircon: Thermometer,
  tvs: Tv,
  washers: Shirt,
}

export function getCategoryIcon(key: string): LucideIcon {
  return MAP[key] ?? Zap
}

export function CategoryIcon({
  categoryKey,
  className,
  size = 28,
}: {
  categoryKey: string
  className?: string
  size?: number
}) {
  const Icon = getCategoryIcon(categoryKey)
  return <Icon className={cn('shrink-0', className)} size={size} strokeWidth={2} aria-hidden />
}

export { MAP as categoryIconMap }
