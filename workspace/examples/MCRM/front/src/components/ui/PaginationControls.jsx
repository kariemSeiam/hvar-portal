/**
 * PaginationControls - HVAR Design System
 * 
 * Shared pagination component for stock pages and beyond.
 * Follows HVAR design genome: brand colors, Cairo font, RTL-first, dark mode.
 * 
 * Props:
 * - pagination: { page, limit, total, has_more? } - Pagination state
 * - onPageChange: (page: number) => void - Page change handler
 * - showSummary?: boolean - Show "عرض X من Y" summary (default: true)
 * - compact?: boolean - Compact mode for mobile (default: false)
 */

import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationControls = memo(({
    pagination,
    onPageChange,
    showSummary = true,
    compact = false
}) => {
    if (!pagination) return null;

    const { page = 1, limit = 20, total = 0, has_more } = pagination;
    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const hasNextPage = has_more !== undefined ? has_more : currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Don't render if single page and no summary needed
    if (totalPages <= 1 && !showSummary) return null;

    const startItem = total > 0 ? ((currentPage - 1) * limit) + 1 : 0;
    const endItem = Math.min(currentPage * limit, total);

    return (
        <nav
            className={`mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 ${compact ? 'text-xs' : ''}`}
            aria-label="التنقل بين الصفحات"
            role="navigation"
        >
            <div className="flex items-center justify-between gap-4">
                {/* Summary - RTL: appears first */}
                {showSummary && total > 0 && (
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-cairo" aria-live="polite">
                        <span className="hidden sm:inline">عرض </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{startItem}</span>
                        <span className="mx-1">-</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{endItem}</span>
                        <span className="hidden sm:inline mx-1">من</span>
                        <span className="sm:hidden mx-1">/</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{total}</span>
                    </div>
                )}

                {/* Page Controls */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1">
                    {/* Previous Page */}
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={!hasPrevPage}
                        aria-label="الصفحة السابقة"
                        className={`
                            flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2
                            text-xs sm:text-sm font-medium font-cairo
                            bg-white dark:bg-gray-700 
                            border border-gray-300 dark:border-gray-600 
                            rounded-lg
                            transition-colors duration-200
                            focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                            ${hasPrevPage
                                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-40'
                            }
                        `}
                    >
                        <ChevronRight className="w-4 h-4" />
                        <span className="hidden sm:inline">السابق</span>
                    </button>

                    {/* Page Numbers - Show on larger screens */}
                    <div className="hidden md:flex items-center gap-1">
                        {generatePageNumbers(currentPage, totalPages).map((pageNum, idx) => (
                            pageNum === '...' ? (
                                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-gray-500">...</span>
                            ) : (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    aria-label={`الصفحة ${pageNum}`}
                                    aria-current={currentPage === pageNum ? 'page' : undefined}
                                    className={`
                                        w-9 h-9 flex items-center justify-center
                                        text-sm font-medium font-cairo rounded-lg
                                        transition-colors duration-200
                                        ${currentPage === pageNum
                                            ? 'bg-brand-red-600 text-white shadow-sm'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }
                                    `}
                                >
                                    {pageNum}
                                </button>
                            )
                        ))}
                    </div>

                    {/* Page Indicator - Mobile */}
                    <span className="md:hidden px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-cairo">
                        {currentPage} / {totalPages}
                    </span>

                    {/* Next Page */}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={!hasNextPage}
                        aria-label="الصفحة التالية"
                        className={`
                            flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2
                            text-xs sm:text-sm font-medium font-cairo
                            bg-white dark:bg-gray-700 
                            border border-gray-300 dark:border-gray-600 
                            rounded-lg
                            transition-colors duration-200
                            focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                            ${hasNextPage
                                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-40'
                            }
                        `}
                    >
                        <span className="hidden sm:inline">التالي</span>
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* Placeholder for layout balance when summary is hidden */}
                {!showSummary && <div className="hidden sm:block" />}
            </div>
        </nav>
    );
});

/**
 * Generate page numbers array with ellipsis for large page counts
 * @param {number} current - Current page
 * @param {number} total - Total pages
 * @returns {Array<number|string>} Page numbers with '...' for gaps
 */
function generatePageNumbers(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    const showLeft = current <= 4;
    const showRight = current >= total - 3;

    if (showLeft) {
        // Show 1, 2, 3, 4, 5, ..., last
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
    } else if (showRight) {
        // Show 1, ..., last-4, last-3, last-2, last-1, last
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
        // Show 1, ..., current-1, current, current+1, ..., last
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
    }

    return pages;
}

PaginationControls.displayName = 'PaginationControls';

export default PaginationControls;
