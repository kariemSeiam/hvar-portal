/**
 * DraftTicketCard - Draft ticket card with amber theme and pulse animation
 * Call center workflow: tickets start as "draft" before confirming type
 */
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
                    <span className={`text-lg ${DRAFT_TICKET_CONFIG.text} flex-shrink-0`}>
                        ⚠️
                    </span>
                    <span className={`text-xs font-bold font-cairo ${DRAFT_TICKET_CONFIG.text}`}>
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
