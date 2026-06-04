/**
 * BostaIdentityPanel - Panel A: Customer identity, location, Bosta orders, existing tickets
 * Updated with rounded-2xl cards, proper touch targets, design token spacing
 * When customerData is null, shows "عميل جديد" empty state.
 * Added collapsible customer summary bar for space-efficient view.
 */
import { useState, useCallback } from 'react';
import CustomerCard from '../../modals/ServiceModalViewer/CustomerCard';
import LocationCard from '../../modals/ServiceModalViewer/LocationCard';
import CallHistoryCard from '../../modals/ServiceModalViewer/CallHistoryCard';

export default function BostaIdentityPanel({
    customerData,
    customerOrders,
    existingServices,
    copiedPhone,
    onCopyPhone,
    onViewTicket,
    onClose,
    searchQuery,
}) {
    const [isExpanded, setIsExpanded] = useState(() => {
        if (typeof sessionStorage === 'undefined') return true;
        try {
            const saved = sessionStorage.getItem('bosta-customer-expanded');
            return saved !== 'false';
        } catch {
            return true;
        }
    });

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => {
            const newValue = !prev;
            try {
                sessionStorage.setItem('bosta-customer-expanded', String(newValue));
            } catch {
                // ignore
            }
            return newValue;
        });
    }, []);

    if (!customerData) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-xl bg-accent-amber-100 dark:bg-accent-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-accent-amber-600 dark:text-accent-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="
                            p-2 min-w-[36px] min-h-[36px]
                            rounded-xl
                            text-gray-500 dark:text-gray-400
                            hover:text-gray-700 dark:hover:text-gray-200
                            hover:bg-gray-200/80 dark:hover:bg-gray-600/50
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

    return (
        <div className="flex flex-col gap-3 pr-1">
            {/* Collapsed summary bar */}
            {!isExpanded && (
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

            {/* Expanded content — flex-shrink-0 so cards keep content height and column scrolls */}
            {isExpanded && (
                <div className="flex flex-col gap-3 flex-shrink-0">
                    <CustomerCard
                        ticket={{ customer_name: customerData.name, phone: customerData.phone, sec_phone: customerData.phone_secondary, customer: customerData }}
                        customerProfile={customerData}
                        copiedPhone={copiedPhone}
                        onCopyPhone={onCopyPhone}
                        onSaveCustomer={(_, cb) => cb && cb()}
                        saving={false}
                    />
                    <LocationCard
                        ticket={{ governorate: customerData.governorate, city: customerData.city, customer_address: customerData.address_details }}
                        customerProfile={customerData}
                        onSaveAddress={(_, cb) => cb && cb()}
                        saving={false}
                    />
                    <CallHistoryCard phone={customerData.phone} customerId={customerData.id} />
                </div>
            )}
        </div>
    );
}
