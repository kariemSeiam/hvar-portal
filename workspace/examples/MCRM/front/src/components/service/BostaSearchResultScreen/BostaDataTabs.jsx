/**
 * BostaDataTabs - Tabbed section for Bosta orders and service tickets
 * Styling matches ServiceModalViewer tab pattern (lines 468-520)
 * Uses BostaOrderItem and ServiceTicketItem for full item designs
 */
import React, { useState } from 'react';
import { Package, FileText } from 'lucide-react';
import BostaOrderItem from './BostaOrderItem';
import ServiceTicketItem from './ServiceTicketItem';

export default function BostaDataTabs({
    orders = [],
    tickets = [],
    selectedOrder,
    onViewTicket,
    onOrderSelect,
}) {
    const [activeTab, setActiveTab] = useState('bosta');

    const hasOrders = orders && orders.length > 0;
    const hasTickets = tickets && tickets.length > 0;

    // Sort orders by date (newest first)
    const sortedOrders = [...(orders || [])].sort((a, b) => {
        const dateA = a.createdAt || a.timestamps?.created ? new Date(a.createdAt || a.timestamps.created) : new Date(0);
        const dateB = b.createdAt || b.timestamps?.created ? new Date(b.createdAt || b.timestamps.created) : new Date(0);
        return dateB - dateA;
    });

    // Separate drafts from confirmed tickets
    const draftTickets = tickets.filter(t => !t.service_type || t.status === 'draft');
    const confirmedTickets = tickets.filter(t => t.service_type && t.status !== 'draft');

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden flex-shrink-0">
            {/* Tab Navigation - matches ServiceModalViewer style */}
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 overflow-x-auto scrollbar-hide flex-shrink-0">
                {/* Bosta Tab */}
                <button
                    onClick={() => setActiveTab('bosta')}
                    className={`
                        flex-1 min-w-[100px] px-3 py-2.5 text-xs font-bold font-cairo transition-colors whitespace-nowrap
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2
                        ${activeTab === 'bosta'
                            ? 'bg-gradient-to-r from-brand-red-50 to-rose-50 dark:from-brand-red-900/40 dark:to-rose-900/30 ring-1 ring-brand-red-200 dark:ring-brand-red-800 text-brand-red-700 dark:text-brand-red-300 border-b-2 border-brand-red-400 dark:border-brand-red-600'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }
                    `}
                >
                    <div className="flex items-center justify-center gap-1.5">
                        <Package className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">طلبات Bosta</span>
                        <span className={`
                            px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 min-w-[18px] text-center
                            ${activeTab === 'bosta'
                                ? 'bg-gradient-to-r from-brand-red-50 to-rose-50 dark:from-brand-red-900/40 dark:to-rose-900/30 ring-1 ring-brand-red-200 dark:ring-brand-red-800 text-brand-red-700 dark:text-brand-red-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }
                        `}>
                            {orders.length}
                        </span>
                    </div>
                </button>

                {/* Tickets Tab */}
                <button
                    onClick={() => setActiveTab('tickets')}
                    className={`
                        flex-1 min-w-[100px] px-3 py-2.5 text-xs font-bold font-cairo transition-colors whitespace-nowrap
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2
                        ${activeTab === 'tickets'
                            ? 'bg-white dark:bg-gray-800 text-brand-blue-600 dark:text-brand-blue-400 border-b-2 border-brand-blue-600 dark:border-brand-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }
                    `}
                >
                    <div className="flex items-center justify-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">تذاكرنا</span>
                        <span className={`
                            px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 min-w-[18px] text-center
                            ${activeTab === 'tickets'
                                ? 'bg-gradient-to-r from-brand-blue-50 to-blue-50 dark:from-brand-blue-900/40 dark:to-blue-900/30 ring-1 ring-brand-blue-200 dark:ring-brand-blue-800 text-brand-blue-700 dark:text-brand-blue-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }
                        `}>
                            {tickets.length}
                        </span>
                    </div>
                </button>
            </div>

            {/* Tab Content - no fixed height, parent handles scroll */}
            <div className="p-2 sm:p-2.5" dir="rtl">
                {/* Bosta Orders Tab */}
                {activeTab === 'bosta' && (
                    hasOrders ? (
                        <div className="space-y-2">
                            {sortedOrders.map((order, idx) => {
                                const trackingNumber = order.trackingNumber || order.tracking_number;
                                const isSelected = selectedOrder?.trackingNumber === trackingNumber || selectedOrder?.tracking_number === trackingNumber;
                                const isLinked = order.linked_ticket_id !== null;

                                return (
                                    <BostaOrderItem
                                        key={trackingNumber || idx}
                                        order={order}
                                        index={idx}
                                        isCompact={false}
                                        isSelected={isSelected}
                                        isLinked={isLinked}
                                        onSelectOrder={onOrderSelect}
                                        linkedServices={tickets}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mb-3">
                                <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo text-center">
                                لا توجد طلبات Bosta متاحة
                            </p>
                        </div>
                    )
                )}

                {/* Tickets Tab */}
                {activeTab === 'tickets' && (
                    hasTickets ? (
                        <div className="space-y-2">
                            {/* Draft tickets first */}
                            {draftTickets.map((ticket, idx) => (
                                <ServiceTicketItem
                                    key={ticket.id || `draft-${idx}`}
                                    ticket={ticket}
                                    index={idx}
                                    isCompact={false}
                                    onViewTicket={onViewTicket}
                                />
                            ))}
                            {/* Confirmed tickets */}
                            {confirmedTickets.map((ticket, idx) => (
                                <ServiceTicketItem
                                    key={ticket.id || `ticket-${idx}`}
                                    ticket={ticket}
                                    index={draftTickets.length + idx}
                                    isCompact={false}
                                    onViewTicket={onViewTicket}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mb-3">
                                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo text-center">
                                لا توجد تذاكر خدمة متاحة
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
