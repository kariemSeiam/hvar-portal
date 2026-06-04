/**
 * BostaSearchResultSkeleton - Loading skeleton for Bosta search
 * Updated to match ServiceModalViewer card styling (rounded-2xl, border, shadow-lg, brand-red accents)
 */
export default function BostaSearchResultSkeleton() {
    return (
        <div className="flex flex-col md:flex-row gap-4 w-full" dir="rtl">
            {/* Panel A skeleton - Identity Panel */}
            <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col gap-3">
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
            <div className="w-full md:w-2/3 min-w-0 space-y-4">
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
