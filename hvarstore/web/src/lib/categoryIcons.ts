/**
 * Slug-keyed SVG inner paths for appliance categories.
 * Single source of truth shared by CategoriesStrip (home grid) and
 * Navbar (desktop category dropdown + mobile drawer accordion) so the
 * same family always reads with the same mark, light or dark.
 *
 * Each value is the inner markup of a 24×24 stroke icon — render inside
 * <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" …>.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  chopper:
    `<path d="M9 3h6l1 7H8L9 3Z"/><path d="M8 10v5h8v-5"/><rect x="9" y="15" width="6" height="3" rx="1"/><line x1="12" y1="18" x2="12" y2="21"/>`,
  blender:
    `<path d="M7 4h10l-2 10H9L7 4Z"/><path d="M9 14v3h6v-3"/><line x1="8" y1="18" x2="16" y2="18"/><line x1="12" y1="18" x2="12" y2="21"/>`,
  hand_blender:
    `<line x1="12" y1="2" x2="12" y2="10"/><path d="M9 10h6v4a3 3 0 0 1-6 0v-4Z"/><path d="M10 18v3m4-3v3M9 21h6"/>`,
  stand_mixer:
    `<path d="M5 8a7 7 0 0 1 14 0c0 4-2.5 7-7 9-4.5-2-7-5-7-9Z"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="9" y1="21" x2="15" y2="21"/>`,
  hand_beater:
    `<line x1="9" y1="3" x2="9" y2="12"/><line x1="15" y1="3" x2="15" y2="12"/><path d="M6 12a6 6 0 0 0 12 0"/><line x1="9" y1="3" x2="15" y2="3"/>`,
  air_fryer:
    `<rect x="5" y="4" width="14" height="14" rx="3"/><circle cx="12" cy="11" r="3"/><path d="M12 5v1m0 9v1M5 11h1m12 0h1"/><line x1="9" y1="2" x2="15" y2="2"/>`,
  iron:
    `<path d="M3 16.5c0 1.5 1.5 2.5 4 2.5h10c2.5 0 4-1 4-2.5V14c0-1.5-1-2.5-2.5-2.5H7L5 9H3v7.5Z"/><circle cx="12" cy="4" r="1"/><line x1="12" y1="5" x2="12" y2="9"/>`,
  vacuum:
    `<circle cx="8" cy="16" r="4"/><path d="M12 16h3a5 5 0 0 0 0-10H8"/><line x1="8" y1="6" x2="8" y2="12"/>`,
  oven:
    `<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="9" width="12" height="9" rx="1"/><circle cx="8" cy="6" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="16" cy="6" r="1"/>`,
  spice_grinder:
    `<path d="M9 3h6l1 5H8L9 3Z"/><path d="M8 8v9a4 4 0 0 0 8 0V8"/>`,
  kettle:
    `<path d="M6 8h12l-1.5 9A2 2 0 0 1 14.5 19h-5a2 2 0 0 1-2-1.8L6 8Z"/><path d="M18 8c1.5 0 3 .5 3 2s-1.5 2-3 2"/><line x1="7" y1="5" x2="17" y2="5"/><line x1="12" y1="3" x2="12" y2="5"/>`,
}

/** "All products" — four tiles, used by the grid header + dropdown "كل المنتجات" row. */
export const ALL_CATEGORIES_ICON =
  `<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>`

/** Lightning bolt — neutral fallback for any slug without a dedicated mark. */
const FALLBACK_ICON = `<path d="M13 2L4.5 13H11l-1 9L21 11H14l1-9Z"/>`

export function categoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? FALLBACK_ICON
}
