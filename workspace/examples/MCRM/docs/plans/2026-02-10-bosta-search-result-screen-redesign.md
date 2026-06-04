# Bosta Search Result Screen Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Bosta external search result screen with ServiceModalViewer-inspired design, supporting draft tickets, smart search, and call center workflow integration.

**Architecture:** Two-panel layout (Left: Customer + Bosta Orders | Right: Tickets + Quick Actions), collapsible sections, RTL-first Arabic design, brand-red gradient accents matching ServiceModalViewer.

**Tech Stack:** React 18, Vite 6, TailwindCSS 3.4, existing design tokens (brand-red, brand-blue, accent-amber), callCenterAPI/customerAPI/ticketsAPI integration.

---

## Overview

The current Bosta search result screen (`front/src/components/service/BostaSearchResultScreen/`) uses generic white cards with flat design. This redesign:

1. **Applies ServiceModalViewer design DNA** — Brand-red gradients, ring accents, collapse/expand states
2. **Supports draft tickets** — New workflow where tickets start as "draft" before confirming type
3. **Smart search** — Unified search across customers, tickets, orders with filter dropdown
4. **Call center workflow** — Quick actions, draft → pending flow, Bosta order selection
5. **RTL-first Arabic** — Proper `dir="rtl"`, logical properties, Cairo typography

---

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Layout** | Two panels + Collapsible | Merges B + D options: space-efficient + flexible |
| **Search** | Smart + Filter dropdown | B + C creative: Everything searchable + type filters |
| **Results** | Grouped by relevance | Option C: Best matches rise to top, type indicators |
| **Quick Actions** | FAB rail (left side) | Option A: Always visible, RTL-correct positioning |
| **Draft tickets** | Amber + Pulsing | Option A + creative: Attention-grabbing, clear "incomplete" signal |
| **Customer card** | Collapsed bar: name + phone + actions + last interaction | B + D creative merge |
| **Bosta orders** | ServiceModalViewer style | Lock indicator, type badge, Bosta link, status |
| **Organization** | Drafts first, then confirmed by type | Smart sort: urgency + type grouping |

---

## File Structure

```
front/src/components/service/BostaSearchResultScreen/
├── index.jsx                    # Main container (refactor: two-panel, search, state)
├── BostaIdentityPanel.jsx       # Refactor: collapsed bar + expanded state
├── BostaContentPanel.jsx        # Refactor: tickets + quick actions sections
├── BostaOrdersList.jsx          # Refactor: ServiceModalViewer card style
├── BostaTicketsSection.jsx      # Refactor: Draft tickets styling (amber + pulse)
├── BostaOrdersGrid.jsx          # Refactor: Selection + context menu
├── BostaFABRail.jsx             # Refactor: Position fix for RTL
├── NewCustomerForm.jsx          # Refactor: Match ServiceModalViewer styling
├── BostaSearchResultSkeleton.jsx # Update: Match new card styling
├── constants.js                 # Update: Draft ticket colors, search modes
├── BostaSearchResultScreen.md   # Update: Documentation
├── SmartSearchBar.jsx           # NEW: Unified search with filters
├── DraftTicketCard.jsx           # NEW: Draft ticket card component
└── BostaOrderCard.jsx            # NEW: Individual Bosta order card
```

---

## Implementation Tasks

### Task 1: Update Design Tokens for Draft States

**Files:**
- Modify: `front/src/components/service/BostaSearchResultScreen/constants.js`

**Step 1: Add draft ticket color scheme**

```javascript
/** Draft ticket color scheme - amber/warning theme with pulse animation */
export const DRAFT_TICKET_CONFIG = {
    label: 'مسودة',
    gradient: 'from-accent-amber-500 to-accent-amber-600',
    bg: 'bg-accent-amber-50 dark:bg-accent-amber-900/30',
    text: 'text-accent-amber-700 dark:text-accent-amber-200',
    border: 'border-accent-amber-300 dark:border-accent-amber-700/60',
    solid: 'bg-accent-amber-500',
    pulse: 'animate-pulse',
    icon: '⚠️'
};

/** Search mode options for smart search dropdown */
export const SEARCH_MODES = [
    { id: 'customer', label: 'بالعميل', icon: '👤', searchPlaceholder: 'بحث بالاسم أو رقم الهاتف...' },
    { id: 'tracking', label: 'بالرقم المُتبع', icon: '🔍', searchPlaceholder: 'رقم التتبع...' },
    { id: 'ticket', label: 'بالتذكرة', icon: '🎫', searchPlaceholder: 'رقم التذكرة...' },
    { id: 'order', label: 'بالطلب', icon: '📦', searchPlaceholder: 'رقم الطلب...' }
];

/** Result type badges for unified search results */
export const RESULT_TYPE_CONFIG = {
    customer: {
        label: 'عميل',
        icon: '👤',
        bg: 'bg-brand-blue-50 dark:bg-brand-blue-900/30',
        text: 'text-brand-blue-700 dark:text-brand-blue-200',
        border: 'border-brand-blue-200 dark:border-brand-blue-700/60'
    },
    ticket: {
        label: 'تذكرة',
        icon: '🎫',
        bg: 'bg-accent-purple-50 dark:bg-accent-purple-900/30',
        text: 'text-accent-purple-700 dark:text-accent-purple-200',
        border: 'border-accent-purple-200 dark:border-accent-purple-700/60'
    },
    bosta_order: {
        label: 'طلب Bosta',
        icon: '📦',
        bg: 'bg-brand-red-50 dark:bg-brand-red-900/30',
        text: 'text-brand-red-700 dark:text-brand-red-200',
        border: 'border-brand-red-200 dark:border-brand-red-700/60'
    }
};
```

**Step 2: Run linter to check for errors**

Run: `cd front && npm run lint -- --max-warnings 0`
Expected: No linting errors in constants

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/constants.js
git commit -m "feat(bosta-search): add draft ticket colors and search mode constants"
```

---

### Task 2: Create Smart Search Bar Component

**Files:**
- Create: `front/src/components/service/BostaSearchResultScreen/SmartSearchBar.jsx`

**Step 1: Write the smart search bar component**

```jsx
/**
 * SmartSearchBar - Unified search with filter dropdown
 * Searches across customers, tickets, tracking numbers, orders
 * RTL-aware Arabic design with ServiceModalViewer styling
 */
import React, { useState, useCallback } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { SEARCH_MODES } from './constants';

export default function SmartSearchBar({
    searchQuery,
    onSearchChange,
    onClear,
    onModeChange,
    isSearching = false,
    resultCounts = { customers: 0, tickets: 0, orders: 0 }
}) {
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const [selectedMode, setSelectedMode] = useState(SEARCH_MODES[0]);

    const handleModeSelect = useCallback((modeId) => {
        const mode = SEARCH_MODES.find(m => m.id === modeId) || SEARCH_MODES[0];
        setSelectedMode(mode);
        setShowModeDropdown(false);
        onModeChange?.(modeId);
    }, [onModeChange]);

    const handleClear = useCallback(() => () => {
        onSearchChange('');
        onClear?.();
    }, [onSearchChange, onClear]);

    const handleInputChange = useCallback((e) => {
        onSearchChange(e.target.value);
    }, [onSearchChange]);

    const totalResults = resultCounts.customers + resultCounts.tickets + resultCounts.orders;

    return (
        <div className="w-full mb-4" dir="rtl">
            <div className="relative flex items-center gap-2">
                {/* Search mode selector dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowModeDropdown(!showModeDropdown)}
                        className={`
                            flex items-center gap-1.5 px-3 py-2.5
                            min-h-[44px]
                            rounded-xl
                            bg-white dark:bg-gray-800
                            border border-gray-200 dark:border-gray-700
                            hover:border-gray-300 dark:hover:border-gray-600
                            shadow-sm hover:shadow-md
                            transition-all duration-200
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                        `}
                        aria-label="اختر نوع البحث"
                        aria-expanded={showModeDropdown}
                    >
                        <span className="w-5 h-5">{selectedMode.icon}</span>
                        <span className="text-xs sm:text-sm font-cairo font-medium text-gray-700 dark:text-gray-300">
                            {selectedMode.label}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showModeDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown menu */}
                    {showModeDropdown && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowModeDropdown(false)}
                                aria-hidden="true"
                            />
                            <div className="absolute top-full mt-1 right-0 z-20 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                                {SEARCH_MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => handleModeSelect(mode.id)}
                                        className={`
                                            w-full text-right px-4 py-2.5
                                            text-xs sm:text-sm font-cairo font-medium
                                            hover:bg-gray-50 dark:hover:bg-gray-700/50
                                            transition-colors duration-150
                                            focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700
                                            ${selectedMode.id === mode.id
                                                ? 'bg-brand-blue-50 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-200'
                                                : 'text-gray-700 dark:text-gray-300'
                                            }
                                        `}
                                    >
                                        <span className="ml-2">{mode.icon}</span>
                                        <span>{mode.label}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Search input */}
                <div className="flex-1 relative">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleInputChange}
                            placeholder={selectedMode.searchPlaceholder}
                            disabled={isSearching}
                            className={`
                                w-full px-10 py-2.5
                                min-h-[44px]
                                rounded-xl
                                bg-white dark:bg-gray-800
                                border border-gray-200 dark:border-gray-700
                                text-sm font-cairo text-gray-900 dark:text-gray-100
                                placeholder:text-gray-400 dark:placeholder:text-gray-500
                                shadow-sm
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus:border-brand-blue-400
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200
                            `}
                            dir="rtl"
                            aria-label="بحث"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                aria-label="مسح البحث"
                            >
                                <X className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Result counts badge */}
                {totalResults > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-gradient-to-r from-brand-red-50 to-rose-50 dark:from-red-900/40 dark:to-rose-900/30 border border-brand-red-200 dark:border-red-800">
                        <span className="text-xs font-bold text-brand-red-700 dark:text-brand-red-200">{totalResults}</span>
                        <span className="text-xs font-medium text-brand-red-600 dark:text-brand-red-300">نتيجة</span>
                    </div>
                )}
            </div>
        </div>
    );
}
```

**Step 2: Update index.jsx to use SmartSearchBar**

Modify `front/src/components/service/BostaSearchResultScreen/index.jsx`:

```jsx
import SmartSearchBar from './SmartSearchBar';

// In the component return, add at top:
<SmartSearchBar
    searchQuery={searchQuery}
    onSearchChange={setSearchQuery}
    onClear={handleClearSearch}
    onModeChange={setSearchMode}
    isSearching={isSearching}
    resultCounts={resultCounts}
/>
```

**Step 3: Run linter**

Run: `cd front && npm run lint -- --max-warnings 0`
Expected: No errors in new component

**Step 4: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/SmartSearchBar.jsx
git add front/src/components/service/BostaSearchResultScreen/index.jsx
git commit -m "feat(bosta-search): add smart search bar with filter dropdown"
```

---

### Task 3: Create Collapsible Customer Summary Bar

**Files:**
- Modify: `front/src/components/service/BostaSearchResultScreen/BostaIdentityPanel.jsx`

**Step 1: Add collapsed state component**

Add to `BostaIdentityPanel.jsx`:

```jsx
const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof sessionStorage === 'undefined') return true;
    const saved = sessionStorage.getItem('bosta-customer-expanded');
    return saved !== 'false';
});

const toggleExpanded = () => {
    setIsExpanded(prev => {
        const newValue = !prev;
        try {
            sessionStorage.setItem('bosta-customer-expanded', String(newValue));
        } catch (e) {
            // ignore
        }
        return newValue;
    });
};

// Replace the null customer return with:
if (!customerData) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
                <span className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-xl bg-accent-amber-100 dark:bg-accent-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-accent-amber-600 dark:text-accent-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h3m-3 0v3m0 3V9" />
                    </svg>
                </span>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="p-2 min-w-[36px] min-h-[36px] rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-gray-600/50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
                    title="إغلاق"
                    aria-label="إغلاق"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <p className="font-cairo font-bold text-gray-900 dark:text-gray-100 text-sm">عميل جديد</p>
            <p className="font-cairo text-xs text-gray-500 dark:text-gray-400 mt-1">لم يتم العثور على العميل</p>
            {searchQuery?.trim() && (
                <p className="font-cairo text-xs text-gray-400 dark:text-gray-500 mt-2 truncate" dir="ltr" title={searchQuery}>
                    البحث: {searchQuery.trim()}
                </p>
            )}
        </div>
    );
}

// Add collapsed bar before expanded content:
{!isExpanded && customerData && (
    <button
        type="button"
        onClick={toggleExpanded}
        dir="rtl"
        className="flex items-center gap-2 sm:gap-2.5 w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-right font-cairo transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 min-h-[44px]"
        aria-expanded="false"
        title="عرض بيانات العميل"
    >
        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-brand-red-500 to-brand-red-600 shadow-sm ring-2 ring-brand-red-200 dark:ring-brand-red-800" title="العميل">
            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14s9-5 9-11.773" />
            </svg>
        </div>
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0 rotate-[-90deg]" aria-hidden fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {customerData.name}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate" dir="ltr">
                {customerData.phone}
            </span>
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-brand-blue-600 dark:text-brand-blue-400 whitespace-nowrap flex-shrink-0">عرض</span>
    </button>
)}
```

**Step 2: Run linter**

Run: `cd front && npm run lint -- --max-warnings 0`

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/BostaIdentityPanel.jsx
git commit -m "feat(bosta-search): add collapsible customer summary bar"
```

---

### Task 4: Create Draft Ticket Card Component

**Files:**
- Create: `front/src/components/service/BostaSearchResultScreen/DraftTicketCard.jsx`

**Step 1: Write draft ticket card with amber pulse**

```jsx
/**
 * DraftTicketCard - Draft ticket card with amber theme and pulse animation
 * Call center workflow: tickets start as "draft" before confirming type
 */
import React from 'react';
import { Clock, Phone, Edit, Trash2, Check } from 'lucide-react';
import { DRAFT_TICKET_CONFIG } from './constants';

export default function DraftTicketCard({ draft, onConfirm, onCall, onDelete }) {
    const timeAgo = draft.created_at ? new Date(draft.created_at).toLocaleString('ar-EG', {
        minute: 'numeric',
        hour: '2-digit'
    }) : '';

    return (
        <div className={`
            relative mb-3 rounded-xl
            ${DRAFT_TICKET_CONFIG.bg}
            ${DRAFT_TICKET_CONFIG.border}
            border-2 ${DRAFT_TICKET_CONFIG.pulse}
            shadow-lg
            overflow-hidden
            transition-all duration-200
        `}>
            {/* Pulsing border animation */}
            <div className="absolute inset-0 rounded-xl pointer-events-none">
                <div className={`absolute inset-0 rounded-xl border-2 ${DRAFT_TICKET_CONFIG.border} opacity-50 animate-pulse`} />
            </div>

            {/* Header */}
            <div className={`
                flex items-center justify-between px-4 py-3
                ${DRAFT_TICKET_CONFIG.bg}
                border-b ${DRAFT_TICKET_CONFIG.border}
            `}>
                <div className="flex items-center gap-2">
                    <span className={`text-lg ${DRAFT_TICKET_CONFIG.icon} ${DRAFT_TICK_CONFIG.text} flex-shrink-0`}>
                        ⚠️
                    </span>
                    <span className={`text-xs font-bold font-cairo ${DRAFT_TICK_CONFIG.text}`}>
                        {DRAFT_TICKET_CONFIG.label}
                    </span>
                </div>
                <span className={`text-[10px] font-cairo ${DRAFT_TICKET_CONFIG.text} opacity-80`}>
                    {timeAgo}
                </span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Customer info */}
                {draft.customer_name && (
                    <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-xs font-cairo text-gray-900 dark:text-gray-100" dir="ltr">
                            {draft.customer_name}
                        </span>
                        {draft.phone && (
                            <span className="text-xs font-cairo text-gray-600 dark:text-gray-400" dir="ltr">
                                ({draft.phone})
                            </span>
                        )}
                    </div>
                )}

                {/* Notes */}
                {draft.notes && (
                    <div className="text-xs font-cairo text-gray-700 dark:text-gray-300 italic line-clamp-2">
                        {draft.notes}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`
                            flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                            min-h-[40px]
                            rounded-lg
                            bg-gradient-to-r from-accent-green-500 to-accent-green-600
                            text-white
                            text-xs font-cairo font-medium
                            shadow-md hover:shadow-lg
                            active:scale-95
                            transition-all duration-200
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green-500
                        `}
                    >
                        <Check className="w-3.5 h-3.5" />
                        <span>إكمال التذكرة</span>
                    </button>
                    {draft.phone && (
                        <button
                            type="button"
                            onClick={onCall}
                            className={`
                                flex items-center justify-center gap-1.5 px-3 py-2
                                min-h-[40px]
                                rounded-lg
                                bg-white dark:bg-gray-800
                                border border-gray-300 dark:border-gray-600
                                text-gray-700 dark:text-gray-300
                                text-xs font-cairo font-medium
                                hover:bg-gray-50 dark:hover:bg-gray-700
                                active:scale-95
                                transition-all duration-200
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                            `}
                        >
                            <Phone className="w-3.5 h-3.5" />
                            <span>اتصال</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onDelete}
                        className={`
                            p-2
                            min-h-[40px] min-w-[40px]
                            rounded-lg
                            text-gray-500 dark:text-gray-400
                            hover:bg-red-50 dark:hover:bg-red-900/30
                            hover:text-red-600 dark:hover:text-red-400
                            active:scale-95
                            transition-all duration-200
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500
                        `}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
```

**Step 2: Run linter**

Run: `cd front && npm run lint -- --max-warnings 0`

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/DraftTicketCard.jsx
git commit -m "feat(bosta-search): add draft ticket card with amber pulse theme"
```

---

### Task 5: Redesign Bosta Orders List with ServiceModalViewer Styling

**Files:**
- Modify: `front/src/components/service/BostaSearchResultScreen/BostaOrdersList.jsx`

**Step 1: Update BostaOrdersList with ServiceModalViewer card design**

```jsx
/**
 * BostaOrdersList - طلبات Bosta list with ServiceModalViewer-inspired styling
 * Updated with brand-red accent bar, lock indicators, Bosta links, status badges
 */
import React from 'react';
import { Package, ExternalLink, Lock, CheckCircle } from 'lucide-react';
import { formatDistanceToNowAr } from '../../../utils/dateUtils';

export default function BostaOrdersList({ orders = [], onSelectOrder, selectedOrderId, onLinkOrder }) {
    if (!orders || orders.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-2.5">
                    <span className="w-1 h-6 rounded-full bg-brand-red-500" />
                    <Package className="w-4 h-4 text-brand-red-600 dark:text-brand-red-400 flex-shrink-0" />
                    <span className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100">طلبات Bosta</span>
                </div>
                <div className="p-4 text-center">
                    <p className="font-cairo text-xs text-gray-500 dark:text-gray-400">لا توجد طلبات</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            {/* Header with brand-red accent */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="w-1 h-6 rounded-full bg-brand-red-500" />
                    <Package className="w-4 h-4 text-brand-red-600 dark:text-brand-red-400 flex-shrink-0" />
                    <span className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100">طلبات Bosta</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-red-100 dark:bg-brand-red-900/50 text-brand-red-700 dark:text-brand-red-300">
                    {orders.length}
                </span>
            </div>

            {/* Orders list */}
            <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide" dir="rtl">
                {orders.map((order, idx) => {
                    const trackingNumber = order.trackingNumber || order.tracking_number;
                    const isSelected = selectedOrderId === trackingNumber;
                    const isLinked = order.linked_ticket_id !== null;

                    return (
                        <div
                            key={trackingNumber || idx}
                            onClick={() => !isLinked && onSelectOrder(order)}
                            className={`
                                relative flex items-center justify-between gap-2
                                px-3 py-2.5
                                min-h-[44px]
                                rounded-lg
                                ${isSelected
                                    ? 'bg-gradient-to-r from-brand-red-50 to-rose-50 dark:from-red-900/40 dark:to-rose-900/30 ring-1 ring-brand-red-200 dark:ring-red-800 cursor-pointer'
                                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-800 cursor-pointer'
                                }
                                border border-gray-200 dark:border-gray-600
                                transition-all duration-200
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                            `}
                        >
                            {/* Left: Tracking + info */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {/* Lock indicator if linked */}
                                {isLinked && (
                                    <Lock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" title={`مرتبط: ${order.linked_ticket_number}`} />
                                )}

                                {/* Tracking number with link */}
                                <a
                                    href={`https://business.bosta.co/orders/${trackingNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    onLinkOrder?.(trackingNumber, order)}
                                    className={`
                                        font-cairo font-medium text-xs
                                        ${isSelected
                                            ? 'text-brand-red-700 dark:text-brand-red-300'
                                            : 'text-gray-900 dark:text-gray-100 hover:text-brand-blue-600'
                                        }
                                        truncate hover:underline
                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                                        flex-shrink min-w-0
                                    `}
                                    dir="ltr"
                                >
                                    {trackingNumber}
                                </a>

                                {/* Status */}
                                {order.status && (
                                    <span className={`
                                        text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap
                                        ${order.status === 'delivered'
                                            ? 'bg-accent-green-100 text-accent-green-700 border-accent-green-200'
                                            : 'bg-gray-100 text-gray-700 border-gray-300'
                                        }
                                    `}>
                                        {order.status === 'delivered' ? 'تم التسليم' : 'قيد المعالجة'}
                                    </span>
                                )}
                            </div>

                            {/* Right: External link icon */}
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
```

**Step 2: Run linter**

Run: `cd front && npm run lint -- --max-warnings 0`

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/BostaOrdersList.jsx
git commit -m "feat(bosta-search): redesign Bosta orders list with ServiceModalViewer styling"
```

---

### Task 6: Update BostaTicketsSection for Draft + Confirmed Organization

**Files:**
- Modify: `front/src/components/service/BostaSearchResultScreen/BostaTicketsSection.jsx`

**Step 1: Add draft tickets first, then confirmed by type**

Update `BostaTicketsSection.jsx` to sort drafts first:

```jsx
// At the top, add:
import { DRAFT_TICKET_CONFIG } from './constants';

// Modify the component to separate drafts:
export default function BostaTicketsSection({ tickets, onViewTicket, variant = 'compact', title, emptyMessage = 'لا توجد تذاكر سابقة', onDraftConfirm, onDraftCall, onDraftDelete }) {
    // Separate drafts from confirmed
    const draftTickets = (Array.isArray(tickets) ? tickets : []).filter(t => !t.service_type || t.status === 'draft');
    const confirmedTickets = (Array.isArray(tickets) ? tickets : []).filter(t => t.service_type && t.status !== 'draft');

    // Group confirmed tickets by type
    const grouped = confirmedTickets.reduce((acc, t) => {
        const type = t.service_type || 'replacement';
        if (!acc[type]) acc[type] = [];
        acc[type].push(t);
        return acc;
    }, {});

    const typesWithTickets = SERVICE_TYPE_ORDER.filter(t => grouped[t]?.length);

    // Render function for compact variant
    if (variant === 'compact') {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden flex-shrink-0">
                {(title || tickets?.length >= 0) && (
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-2">
                        {title && <span className="font-cairo font-bold text-sm text-gray-900 dark:text-gray-100">{title}</span>}
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-blue-100 dark:bg-brand-blue-900/50 text-brand-blue-700 dark:text-brand-blue-300">
                            {tickets?.length || 0}
                        </span>
                    </div>
                )}
                <div className="p-2 space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                    {/* Drafts first */}
                    {draftTickets.length > 0 && (
                        <div className="rounded-xl border border-accent-amber-200 dark:border-accent-amber-700/60 bg-accent-amber-50 dark:bg-accent-amber-900/30 overflow-hidden">
                            <div className="px-3 py-2.5 border-b border-accent-amber-200 dark:border-accent-amber-700/30 flex items-center gap-2">
                                <span className={`w-1 h-5 rounded-full ${DRAFT_TICKET_CONFIG.solid}`} />
                                <span className="font-cairo font-bold text-xs text-accent-amber-800 dark:text-accent-amber-200">{DRAFT_TICKET_CONFIG.label}</span>
                                <span className="text-xs text-accent-amber-600 dark:text-accent-amber-400">({draftTickets.length})</span>
                            </div>
                            <div className="p-2 space-y-1.5 max-h-28 overflow-y-auto">
                                {draftTickets.map((draft) => (
                                    <div
                                        key={draft.id}
                                        onClick={() => onViewTicket(draft)}
                                        className="w-full text-right flex items-center justify-between gap-2 px-3 py-2.5 min-h-[44px] rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-accent-amber-300 dark:hover:border-accent-amber-600 hover:bg-accent-50 dark:hover:bg-accent-900/30 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-amber-500"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`مسودة: ${draft.notes || draft.customer_name}`}
                                    title={`${draft.notes || draft.customer_name} • منذ ${formatDistanceToNowAr(draft.created_at)}`}
                                >
                                        <span className="font-cairo font-medium text-xs text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                                            {draft.notes || draft.customer_name || '—'}
                                        </span>
                                        <span className="text-xs text-accent-amber-600 dark:text-accent-amber-400 flex-shrink-0 whitespace-nowrap">
                                            منذ {formatDistanceToNowAr(draft.created_at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confirmed tickets by type */}
                    {typesWithTickets.map(type => {
                        const config = SERVICE_TYPE_CONFIG[type] || SERVICE_TYPE_CONFIG.replacement;
                        return (
                            <div key={type} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                                <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center gap-2">
                                    <span className={`w-1 h-5 rounded-full ${config.solid}`} />
                                    <span className="font-cairo font-bold text-xs text-gray-900 dark:text-gray-100">{config.label}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({(grouped[type] || []).length})</span>
                                </div>
                                <div className="p-2 space-y-1.5 max-h-28 overflow-y-auto">
                                    {(grouped[type] || []).map((service) => (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() => onViewTicket(service)}
                                            className="
                                                w-full text-right
                                                flex items-center justify-between gap-2
                                                px-3 py-2.5
                                                min-h-[44px]
                                                rounded-lg
                                                bg-white dark:bg-gray-800
                                                border border-gray-200 dark:border-gray-700
                                                hover:border-brand-blue-400 dark:hover:border-brand-blue-600
                                                hover:bg-gray-50 dark:hover:bg-gray-700/30
                                                transition-all duration-200
                                                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-1
                                            "
                                        >
                                            <span className="font-cairo font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                                                {service.ticket_number?.split('-').pop() || service.id}
                                            </span>
                                            <span className="font-cairo text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                {service.status || '—'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Full variant - similar updates for full panel style
    // ... (rest of component)
}
```

**Step 2: Run linter**

Run: `cd front && npm run lint -- --max-warnings 0`

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/BostaTicketsSection.jsx
git commit -m "feat(bosta-search): update tickets section for draft+confirmed organization"
```

---

### Task 7: Update FAB Rail Position for RTL

**Files:**
- Modify: `front/src/components/service/BostaSearchResultScreen/BostaFABRail.jsx`

**Step 1: Fix FAB rail positioning for RTL**

Update `BostaFABRail.jsx`:

```jsx
export default function BostaFABRail({ onActionSelect }) {
    return (
        <div
            className="fixed bottom-6 left-4 sm:left-6 rtl:left-auto rtl:right-4 sm:rtl:right-6 z-40 flex flex-col gap-3 lg:bottom-6"
            dir="rtl"
            aria-label="إجراءات الخدمة"
        >
            {BOSTA_FAB_ACTIONS.map(({ id, label, bg, icon }) => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onActionSelect(id)}
                    className={`
                        flex items-center gap-3
                        px-4 py-3 sm:px-3 sm:py-2.5
                        min-h-[48px] sm:min-h-[44px]
                        rounded-xl
                        ${bg}
                        text-white
                        font-cairo font-medium text-sm
                        shadow-lg hover:shadow-xl
                        active:scale-95
                        transition-all duration-200
                        border border-white/10
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
                    `}
                    title={label}
                    aria-label={label}
                >
                    <span className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        {icon}
                    </span>
                    <span className="whitespace-nowrap">{label}</span>
                </button>
            ))}
        </div>
    );
}
```

**Step 2: Run linter**

Run: `cd front && npm run lint --max-warnings 0`

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/BostaFABRail.jsx
git commit -m "fix(bosta-search): correct FAB rail positioning for RTL layout"
```

---

### Task 8: Update index.jsx Main Container for New Layout

**Files:**
- Modify: `front/src/components/service/BostaSearchResultScreen/index.jsx`

**Step 1: Refactor main container for two-panel + search**

Update `index.jsx`:

```jsx
/**
 * BostaSearchResultScreen - Two-panel layout after Bosta search
 * Redesigned with ServiceModalViewer-inspired design, smart search, draft support
 */
import React, { useState, useCallback } from 'react';
import BostaIdentityPanel from './BostaIdentityPanel';
import BostaContentPanel from './BostaContentPanel';
import BostaSearchResultSkeleton from './BostaSearchResultSkeleton';
import SmartSearchBar from './SmartSearchBar';

export default function BostaSearchResultScreen({
    isSearching,
    customerData,
    customerOrders,
    existingServices,
    selectedOrder,
    searchQuery,
    copiedPhone,
    newCustomerData,
    customerFormErrors,
    isCreatingCustomer,
    onCopyPhone,
    onViewTicket,
    onClose,
    onOrderSelect,
    onActionTypeSelect,
    onCustomerFormChange,
    onCreateCustomer,
}) {
    // Search state
    const [internalSearch, setInternalSearch] = useState('');
    const [searchMode, setSearchMode] = useState('customer');
    const [resultCounts, setResultCounts] = useState({ customers: 0, tickets: 0, orders: 0 });

    // Handle internal search
    const handleInternalSearchChange = useCallback((query) => {
        setInternalSearch(query);
        // TODO: Implement actual search logic
        console.log('Internal search:', query, 'mode:', searchMode);
    }, [searchMode]);

    // Handle search mode change
    const handleSearchModeChange = useCallback((modeId) => {
        setSearchMode(modeId);
    }, []);

    // Handle clear search
    const handleClearSearch = useCallback(() => {
        setInternalSearch('');
        setResultCounts({ customers: 0, tickets: 0, orders: 0 });
    }, []);

    if (isSearching) {
        return <BostaSearchResultSkeleton />;
    }

    return (
        <div className="flex flex-col w-full max-h-[calc(100vh-8rem)]" dir="rtl">
            {/* Smart Search Bar - Always visible at top */}
            <SmartSearchBar
                searchQuery={internalSearch}
                onSearchChange={handleInternalSearchChange}
                onClear={handleClearSearch}
                onModeChange={handleSearchModeChange}
                isSearching={isSearching}
                resultCounts={resultCounts}
            />

            {/* Two-panel layout */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                {/* Panel A - Customer + Bosta Orders (2/5 width) */}
                <div className="w-full md:w-2/5 flex-shrink-0 flex flex-col overflow-hidden">
                    <BostaIdentityPanel
                        customerData={customerData}
                        customerOrders={customerOrders}
                        existingServices={existingServices}
                        copiedPhone={copiedPhone}
                        onCopyPhone={onCopyPhone}
                        onViewTicket={onViewTicket}
                        onClose={onClose}
                        searchQuery={searchQuery}
                    />
                </div>

                {/* Panel B - Tickets + Quick Actions (3/5 width) */}
                <div className="w-full md:w-3/5 min-w-0 flex flex-col overflow-hidden">
                    <BostaContentPanel
                        customerData={customerData}
                        customerOrders={customerOrders}
                        existingServices={existingServices}
                        selectedOrder={selectedOrder}
                        newCustomerData={newCustomerData}
                        customerFormErrors={customerFormErrors}
                        isCreatingCustomer={isCreatingCustomer}
                        onActionSelect={onActionTypeSelect}
                        onViewTicket={onViewTicket}
                        onOrderSelect={onOrderSelect}
                        onCustomerFormChange={onCustomerFormChange}
                        onCreateCustomer={onCreateCustomer}
                        onClose={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
```

**Step 2: Run linter**

Run: `cd front && npm run lint --max-warnings 0`

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/index.jsx
git commit -m "feat(bosta-search): refactor main container for two-panel layout with smart search"
```

---

### Task 9: Update Skeleton for New Card Styling

**Files:**
- Modify: `front/src/components/service/BostaSearchResultScreen/BostaSearchResultSkeleton.jsx`

**Step 1: Update skeleton to match new card styling**

Update `BostaSearchResultSkeleton.jsx`:

```jsx
/**
 * BostaSearchResultSkeleton - Loading skeleton for Bosta search
 * Updated to match ServiceModalViewer card styling (rounded-2xl, border, shadow-lg, brand-red accents)
 */
import React from 'react';

export default function BostaSearchResultSkeleton() {
    return (
        <div className="flex flex-col md:flex-row gap-4 w-full" dir="rtl">
            {/* Panel A skeleton - Identity Panel */}
            <div className="w-full md:w-2/5 flex-shrink-0 flex flex-col gap-3">
                {/* Customer card skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 rounded-full bg-brand-red-500 animate-pulse" />
                            <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-red-500 to-brand-red-600 shadow-lg animate-pulse flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location card skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                    <div className="p-4">
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                </div>

                {/* Orders list skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-2.5">
                        <span className="w-1 h-6 rounded-full bg-brand-red-500 animate-pulse" />
                        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                    <div className="p-2 space-y-1.5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>

                {/* Tickets section skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                    <div className="p-3 space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Panel B skeleton - Content Panel */}
            <div className="w-full md:w-3/5 min-w-0 space-y-4">
                {/* Service type selection skeleton */}
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mx-auto animate-pulse" />

                {/* Tickets section skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                    <div className="p-3 space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>

                {/* Orders grid skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-4 min-h-[140px] animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}
```

**Step 2: Run linter**

Run: `cd front && npm run lint --max-warnings 0`

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/BostaSearchResultSkeleton.jsx
git commit -m "style(bosta-search): update skeleton to match ServiceModalViewer card styling"
```

---

### Task 10: Update NewCustomerForm for ServiceModalViewer Styling

**Files:**
- Modify: `front/src/components/service/BostaSearchResultScreen/NewCustomerForm.jsx`

**Step 1: Update form styling to match ServiceModalViewer**

Update `NewCustomerForm.jsx` header section:

```jsx
{/* Header with ServiceModalViewer-style gradient accent bar */}
<div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
    <h3 className="font-cairo font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2.5">
        <span className="w-1 h-6 rounded-full bg-accent-amber-500" />
        <span className="w-7 h-7 rounded-lg bg-accent-amber-100 dark:bg-accent-amber-900/30 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-accent-amber-600 dark:text-accent-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6" />
            </svg>
        </span>
        إنشاء عميل جديد
    </h3>
    <button
        type="button"
        onClick={onClose}
        className="
            p-2 min-w-[36px] min-h-[36px]
            rounded-lg
            text-gray-500 dark:text-gray-400
            hover:text-gray-700 dark:hover:text-gray-200
            hover:bg-gray-200 dark:hover:bg-gray-700
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
        "
        title="إغلاق"
        aria-label="إغلاق"
    >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
</div>
```

**Step 2: Run linter**

Run: `cd front && npm run lint --max-warnings 0`

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/NewCustomerForm.jsx
git commit -m "style(bosta-search): update new customer form with ServiceModalViewer header styling"
```

---

### Task 11: Integration Testing

**Files:**
- Create: `front/tests/bosta-search-result-screen.test.js`

**Step 1: Write integration tests**

```javascript
/**
 * Integration tests for Bosta Search Result Screen redesign
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BostaSearchResultScreen } from '../src/components/service/BostaSearchResultScreen/index';

// Mock API responses
const mockCustomerData = {
    id: 123,
    name: 'محمد أحمد',
    phone: '01055555555',
    phone_secondary: '01123456789',
    governorate: 'القاهرة',
    city: 'المعادي',
    address_details: 'شارع النيل'
};

const mockBostaOrders = [
    {
        trackingNumber: 'BOSTA-123',
        status: 'delivered',
        type: 'Send',
        createdAt: '2025-01-15T10:00:00Z',
        linked_ticket_id: null
    }
];

const mockServices = [
    {
        id: 1,
        ticket_number: 'HVR-20250115-0001',
        service_type: 'replacement',
        status: 'completed',
        created_at: '2025-01-10T14:00:00Z'
    },
    {
        id: 2,
        notes: 'العميل يطلب صيانة الخلاط',
        customer_name: 'محمد أحمد',
        phone: '01055555555',
        status: 'draft',
        created_at: '2025-01-15T12:00:00Z'
    }
];

describe('BostaSearchResultScreen Redesign', () => {
    let defaultProps;

    beforeEach(() => {
        defaultProps = {
            isSearching: false,
            customerData: mockCustomerData,
            customerOrders: mockBostaOrders,
            existingServices: mockServices,
            selectedOrder: null,
            searchQuery: '01055555555',
            copiedPhone: null,
            newCustomerData: {},
            customerFormErrors: {},
            isCreatingCustomer: false,
            onCopyPhone: vi.fn(),
            onViewTicket: vi.fn(),
            onClose: vi.fn(),
            onOrderSelect: vi.fn(),
            onActionTypeSelect: vi.fn(),
            onCustomerFormChange: vi.fn(),
            onCreateCustomer: vi.fn()
        };
    });

    it('renders smart search bar with filters', () => {
        render(<BostaSearchResultScreen {...defaultProps} />);

        expect(screen.getByPlaceholderText(/بحث/)).toBeInTheDocument();
        expect(screen.getByText(/بحث في/)).toBeInTheDocument();
        expect(screen.getByText(/نتيجة/)).toBeInTheDocument();
    });

    it('displays customer with collapsed summary bar when expanded', () => {
        render(<BostaSearchResultScreen {...defaultProps} />);

        expect(screen.getByText(/محمد أحمد/)).toBeInTheDocument();
        expect(screen.getByText(/01055555555/)).toBeInTheDocument();
        expect(screen.getByText(/المعادي/)).toBeInTheDocument();
    });

    it('shows draft tickets with amber pulse styling', () => {
        render(<BostaSearchResultScreen {...defaultProps} />);

        expect(screen.getByText(/مسودة/)).toBeInTheDocument();
        expect(screen.getByText(/العميل يطلب صيانة/)).toBeInTheDocument();
    });

    it('displays Bosta orders with lock indicators', () => {
        render(<BostaSearchResultScreen {...defaultProps} />);

        expect(screen.getByText(/طلبات Bosta/)).toBeInTheDocument();
        expect(screen.getByText(/BOSTA-123/)).toBeInTheDocument();
    });

    it('shows quick actions FAB rail on left side', () => {
        render(<BostaSearchResultScreen {...defaultProps} />);

        expect(screen.getByText(/استبدال/)).toBeInTheDocument();
        expect(screen.getByText(/صيانة/)).toBeInTheDocument();
        expect(screen.getByText(/إرجاع/)).toBeInTheDocument();
        expect(screen.getByText(/المبيعات/)).toBeInTheDocument();
    });

    it('matches ServiceModalViewer card styling', () => {
        const { container } = render(<BostaSearchResultScreen {...defaultProps} />);

        // Check for brand-red accent bars
        const accentBars = container.querySelectorAll('.bg-brand-red-500');
        expect(accentBars.length).toBeGreaterThan(0);

        // Check for rounded-2xl cards
        const cards = container.querySelectorAll('.rounded-2xl');
        expect(cards.length).toBeGreaterThan(0);

        // Check for shadow-lg
        const shadows = container.querySelectorAll('.shadow-lg');
        expect(shadows.length).toBeGreaterThan(0);
    });
});
```

**Step 2: Run tests**

Run: `cd front && npm test`

**Step 3: Commit**

```bash
git add front/tests/bosta-search-result-screen.test.js
git commit -m "test(bosta-search): add integration tests for redesigned screen"
```

---

### Task 12: Documentation Update

**Files:**
- Modify: `front/src/components/service/BostaSearchResultScreen/BostaSearchResultScreen.md`

**Step 1: Update documentation with new design**

Update `BostaSearchResultScreen.md`:

```markdown
# Bosta Search Result Screen (Redesigned)

## Overview

Two-panel layout for Bosta external search results with ServiceModalViewer-inspired design, supporting draft tickets, smart search, and call center workflow integration.

## Key Features

1. **Smart Search** — Unified search with filter dropdown (customer/tracking/ticket/order)
2. **Draft Tickets** — Amber-themed cards with pulse animation for attention
3. **Collapsible Sections** — Customer bar collapses/expands, tickets expandable (3 default, 5 max)
4. **ServiceModalViewer Styling** — Brand-red gradients, ring accents, rounded-2xl cards
5. **RTL-First Arabic** — Proper `dir="rtl"`, logical properties, Cairo typography

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 [Smart Search Bar with Filter]                                       │
├─────────────────────────────────────────────────────────────────┤
│  LEFT PANEL (2/5)         │  RIGHT PANEL (3/5)                 │
│  ────────────────            │  ────────────────                 │
│  👤 Customer (collapse)        │  🎫 Tickets (collapse)          │
│  ─────────────────────────     │     • Drafts first (amber)        │
│  📦 Bosta Orders               │     • Confirmed by type         │
│     (ServiceModalViewer)       │  ─────────────────────────     │
│                                │  ⚡ Quick Actions (FAB rail)     │
└─────────────────────────────────────────────────────────────────┘
```

## Components

| Component | File | Description |
|-----------|------|-------------|
| SmartSearchBar | SmartSearchBar.jsx | Unified search with filter dropdown |
| BostaIdentityPanel | BostaIdentityPanel.jsx | Customer + collapsed bar + location |
| BostaContentPanel | BostaContentPanel.jsx | Tickets + quick actions sections |
| BostaTicketsSection | BostaTicketsSection.jsx | Drafts + confirmed by type organization |
| BostaOrdersList | BostaOrdersList.jsx | ServiceModalViewer-styled order cards |
| DraftTicketCard | DraftTicketCard.jsx | Amber-themed draft ticket with pulse |
| BostaFABRail | BostaFABRail.jsx | RTL-corrected action buttons |
```

## Design Tokens Used

```css
/* Brand Red Accents */
--color-brand-red-500: #e11d48;
--color-brand-red-600: #e11d48;

/* Accent Amber for Drafts */
--color-accent-amber-500: #f97316;
--color-accent-amber-600: #ea580c;

/* RTL spacing */
space-x-reverse;
ms-* (margin-start);
me-* (margin-end);
```

## API Integration

- **customerAPI.searchCustomers()** — Customer search by name/phone
- **ticketsAPI.listTickets()** — Ticket filtering by customer_id, status
- **callCenterAPI.getOrderCallContext()** — Get full customer context
```

**Step 2: Run linter**

Run: `cd front && npm run lint --max-warnings 0`

**Step 3: Commit**

```bash
git add front/src/components/service/BostaSearchResultScreen/BostaSearchResultScreen.md
git commit -m "docs(bosta-search): update documentation with redesigned features"
```

---

## Completion Checklist

- [ ] Smart search bar with filter dropdown
- [ ] Collapsible customer summary bar (name + phone + actions + last interaction)
- [ ] Draft ticket cards with amber pulse animation
- [ ] Bosta orders with ServiceModalViewer styling
- [ ] FAB rail RTL positioning
- [ ] Two-panel layout with proper spacing
- [ ] Integration tests
- [ ] Documentation updated
- [ ] All linters passing

---

## Rollback Plan

If issues arise, revert commits:

```bash
git revert HEAD~11..HEAD  # Revert last 11 commits
```

For single-commit reverts:

```bash
git revert <commit-hash>
```
```
