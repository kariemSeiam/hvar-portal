import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User, Copy, Check, Phone, PhoneIncoming } from 'lucide-react';
import { formatPhoneForLocalDisplay } from '../../../utils/core/phone';

const chipBase = 'flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2 rounded-lg sm:rounded-xl w-fit flex-shrink-0 transition-all';
const chipPrimary = 'bg-brand-blue-50 dark:bg-brand-blue-900/20 border border-brand-blue-200 dark:border-brand-blue-800 shadow-sm';
const chipSecondary = 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm';
const chipEmpty = 'bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50';

const phoneIconSize = 'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0';

function PhoneChipEdit({ label, value, onChange, variant, copiedPhone, onCopyPhone, ariaLabel, placeholder = '—' }) {
    const isPrimary = variant === 'primary';
    const Icon = isPrimary ? Phone : PhoneIncoming;
    return (
        <div className={`${chipBase} ${isPrimary ? chipPrimary : chipSecondary} focus-within:ring-2 focus-within:ring-brand-blue-500/20 focus-within:border-brand-blue-400 dark:focus-within:border-brand-blue-500`} role="group" aria-label={label}>
            <Icon className={`${phoneIconSize} ${isPrimary ? 'text-brand-blue-600 dark:text-brand-blue-400' : 'text-gray-500 dark:text-gray-400'}`} aria-hidden />
            <div className="m-0 flex items-center gap-0.5 sm:gap-1 w-[11ch]">
                <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10,11}"
                    minLength={10}
                    maxLength={11}
                    value={value}
                    onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="w-full min-w-0 bg-transparent text-[11px] sm:text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo border-none focus:outline-none focus:ring-0 p-0 placeholder-gray-400 dark:placeholder-gray-500 tabular-nums"
                    placeholder={placeholder}
                    aria-label={ariaLabel}
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => onCopyPhone(value)}
                        className={`p-0.5 rounded transition-colors flex-shrink-0 ${isPrimary ? 'hover:bg-brand-blue-100 dark:hover:bg-brand-blue-800/40' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        title="نسخ الرقم"
                        aria-label="نسخ الرقم"
                    >
                        {copiedPhone === value ? (
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-green-600 dark:text-accent-green-400" />
                        ) : (
                            <Copy className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isPrimary ? 'text-brand-blue-600 dark:text-brand-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

function PhoneChipView({ label, value, emptyText, variant, copiedPhone, onCopyPhone }) {
    const hasValue = !!value;
    const isPrimary = variant === 'primary';
    const chipClass = hasValue ? (isPrimary ? chipPrimary : chipSecondary) : chipEmpty;
    const Icon = isPrimary ? Phone : PhoneIncoming;
    return (
        <div className={`${chipBase} ${chipClass} ${hasValue ? 'hover:shadow-md' : ''}`} role="group" aria-label={label}>
            <Icon className={`${phoneIconSize} ${hasValue ? (isPrimary ? 'text-brand-blue-600 dark:text-brand-blue-400' : 'text-gray-500 dark:text-gray-400') : 'text-gray-400 dark:text-gray-500'}`} aria-hidden />
            <div className="m-0 flex items-center gap-0.5 sm:gap-1 min-w-[11ch]">
                {hasValue ? (
                    <>
                        <span
                            className={`text-[11px] sm:text-xs md:text-sm font-cairo tabular-nums min-w-[11ch] whitespace-nowrap ${isPrimary ? 'font-bold text-brand-blue-900 dark:text-brand-blue-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}
                            title={formatPhoneForLocalDisplay(value)}
                        >
                            {formatPhoneForLocalDisplay(value)}
                        </span>
                        <button
                            type="button"
                            onClick={() => onCopyPhone(value)}
                            className={`p-0.5 rounded transition-colors flex-shrink-0 ${isPrimary ? 'hover:bg-brand-blue-100 dark:hover:bg-brand-blue-800/40' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            title="نسخ الرقم"
                            aria-label="نسخ الرقم"
                        >
                            {copiedPhone === value ? (
                                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-green-600 dark:text-accent-green-400" />
                            ) : (
                                <Copy className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isPrimary ? 'text-brand-blue-600 dark:text-brand-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                            )}
                        </button>
                    </>
                ) : (
                    <span className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-400 dark:text-gray-500 font-cairo">{emptyText}</span>
                )}
            </div>
        </div>
    );
}

/**
 * Customer card: identity only — name + phone(s).
 * Address lives in LocationCard (no duplication).
 * Structured like LocationCard: labeled sections (الاسم, رقم رئيسي, رقم إضافي).
 * - Inline edit for name + phones only
 */
function CustomerCard({
    ticket,
    customerProfile = null,
    copiedPhone = null,
    onCopyPhone,
    onSaveCustomer,
    saving = false,
    onCollapse = null
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState({ name: '', phone: '', sec_phone: '' });

    // Safely extract display values with validation
    const displayName = (customerProfile && typeof customerProfile === 'object' && !Array.isArray(customerProfile))
        ? (customerProfile.name ?? '')
        : ((ticket && typeof ticket === 'object' && !Array.isArray(ticket)) ? (ticket.customer_name ?? '') : '');

    const displayPhone = (customerProfile && typeof customerProfile === 'object' && !Array.isArray(customerProfile))
        ? (customerProfile.phone ?? '')
        : ((ticket && typeof ticket === 'object' && !Array.isArray(ticket)) ? (ticket.phone ?? '') : '');

    const ticketCustomer = (ticket && typeof ticket === 'object' && !Array.isArray(ticket) && ticket.customer && typeof ticket.customer === 'object' && !Array.isArray(ticket.customer))
        ? ticket.customer
        : null;
    const displaySecPhone = (customerProfile && typeof customerProfile === 'object' && !Array.isArray(customerProfile))
        ? (customerProfile.phone_secondary ?? '')
        : (ticketCustomer?.sec_phone ?? ((ticket && typeof ticket === 'object' && !Array.isArray(ticket)) ? (ticket.sec_phone ?? '') : ''));

    useEffect(() => {
        if (!isEditing) return;
        setDraft({
            name: displayName || '',
            phone: displayPhone || '',
            sec_phone: displaySecPhone || ''
        });
    }, [isEditing, displayName, displayPhone, displaySecPhone]);

    const handleConfirm = () => {
        onSaveCustomer(
            {
                name: draft.name?.trim() || undefined,
                phone: draft.phone?.trim() || undefined,
                phone_secondary: draft.sec_phone?.trim() || undefined
            },
            () => setIsEditing(false)
        );
    };

    const handleCancel = () => {
        setDraft({ name: displayName || '', phone: displayPhone || '', sec_phone: displaySecPhone || '' });
        setIsEditing(false);
    };

    // Action strip: text labels (same scale as modal section actions — text-xs font-cairo)
    const textActionBtn =
        'inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-cairo font-medium leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-0 active:scale-[0.98] flex-shrink-0';
    const actionSlot =
        'absolute top-2 end-2 sm:top-2.5 sm:end-3 flex items-center justify-end gap-1 z-10 max-w-[55%] sm:max-w-none flex-wrap';
    const actionPill = 'flex items-center justify-end gap-1 min-w-0 flex-wrap';
    // Matches "عرض" on the collapsed profile bar in ServiceModalViewer (same type scale + brand blue); separate from textActionBtn to avoid text-xs/font-medium clash.
    const collapseActionBtn =
        'inline-flex items-center justify-center px-2 py-1 rounded-md leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-0 active:scale-[0.98] flex-shrink-0 text-[10px] sm:text-xs font-bold font-cairo text-brand-blue-600 dark:text-brand-blue-400 whitespace-nowrap hover:text-brand-blue-700 dark:hover:text-brand-blue-300 hover:bg-brand-blue-50/60 dark:hover:bg-brand-blue-900/25';

    const cardBase =
        'bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200 dark:border-gray-700 shadow-md sm:shadow-lg relative transition-all duration-200 min-h-0 shrink-0';
    const cardEditing = 'ring-2 ring-brand-blue-200/80 dark:ring-brand-blue-800/60 ring-inset';
    const contentPad = onCollapse
        ? 'ps-6 pe-[5.25rem] sm:ps-7 sm:pe-[6.5rem] md:ps-8 md:pe-28'
        : 'ps-2 pe-[5.25rem] sm:ps-3 sm:pe-[6.5rem] md:pe-28';

    // Edit Mode — same layout/size as view; only swap content for inputs
    if (isEditing) {
        return (
            <div
                className={`${cardBase} ${cardEditing}`}
                data-testid="service-modal-viewer-customer-card"
                role="form"
                aria-label="تعديل بيانات العميل"
            >
                <div className={actionSlot}>
                    <div className={actionPill}>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className={`${textActionBtn} text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200`}
                        >
                            إلغاء
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={handleConfirm}
                            className={`${textActionBtn} text-accent-green-700 dark:text-accent-green-400 hover:bg-accent-green-50 dark:hover:bg-accent-green-900/30 disabled:opacity-50 disabled:pointer-events-none`}
                        >
                            حفظ
                        </button>
                    </div>
                </div>

                <div className={`${contentPad} flex flex-row flex-wrap items-center justify-start gap-x-2 sm:gap-x-3 gap-y-2 sm:gap-y-3`} dir="rtl">
                    <div className="flex flex-row items-center gap-1 sm:gap-2 w-fit flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-brand-red-500 dark:text-brand-red-400 flex-shrink-0" aria-hidden />
                        <div className="flex flex-row items-center gap-0.5 sm:gap-2">
                            <label className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo flex-shrink-0">الاسم</label>
                            <input
                                type="text"
                                value={draft.name}
                                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                                className="min-w-[8ch] w-[12ch] max-w-[24ch] text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo bg-transparent border-none focus:outline-none focus:ring-0 rounded leading-tight placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="—"
                                dir="rtl"
                                aria-label="اسم العميل"
                            />
                        </div>
                    </div>
                    <div className="flex flex-row flex-nowrap items-center gap-2 sm:gap-3 w-fit flex-shrink-0 -me-[5.25rem] sm:-me-[6.5rem] md:-me-28" dir="rtl">
                        <PhoneChipEdit
                            label="رقم رئيسي"
                            value={draft.phone}
                            onChange={(v) => setDraft((p) => ({ ...p, phone: v }))}
                            variant="primary"
                            copiedPhone={copiedPhone}
                            onCopyPhone={onCopyPhone}
                            ariaLabel="رقم الهاتف الرئيسي"
                        />
                        <PhoneChipEdit
                            label="رقم إضافي"
                            value={draft.sec_phone}
                            onChange={(v) => setDraft((p) => ({ ...p, sec_phone: v }))}
                            variant="secondary"
                            copiedPhone={copiedPhone}
                            onCopyPhone={onCopyPhone}
                            ariaLabel="رقم إضافي"
                            placeholder="اختياري"
                        />
                    </div>
                </div>
            </div>
        );
    }

    // View Mode — identical layout/size to edit; only content differs
    return (
            <div
            className={cardBase}
            data-testid="service-modal-viewer-customer-card"
        >
                <div className={actionSlot} dir="rtl">
                    <div className={actionPill}>
                        <button
                            type="button"
                            className={`${textActionBtn} text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-blue-700 dark:hover:text-brand-blue-400`}
                            onClick={() => setIsEditing(true)}
                        >
                            تعديل
                        </button>
                    </div>
                    {onCollapse && (
                        <button
                            type="button"
                            onClick={onCollapse}
                            className={collapseActionBtn}
                            aria-expanded="true"
                            title="تصغير بيانات العميل والعنوان"
                            aria-label="تصغير بيانات العميل والعنوان"
                        >
                            تصغير
                        </button>
                    )}
                </div>

                <div className={`${contentPad} flex flex-row flex-wrap items-center justify-start gap-x-2 sm:gap-x-3 gap-y-2 sm:gap-y-3`} dir="rtl">
                    <div className="flex flex-row items-center gap-1 sm:gap-2 w-fit flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-brand-red-500 dark:text-brand-red-400 flex-shrink-0" aria-hidden />
                        <dl className="flex flex-row items-center gap-0.5 sm:gap-2">
                            <dt className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo flex-shrink-0">الاسم</dt>
                            <dd className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo break-words m-0 leading-tight" dir="rtl">
                                {displayName || '—'}
                            </dd>
                        </dl>
                    </div>
                    <div className="flex flex-row flex-nowrap items-center gap-2 sm:gap-3 w-fit flex-shrink-0 -me-[5.25rem] sm:-me-[6.5rem] md:-me-28" dir="rtl">
                        <PhoneChipView
                            label="رقم رئيسي"
                            value={displayPhone}
                            emptyText="لا يوجد"
                            variant="primary"
                            copiedPhone={copiedPhone}
                            onCopyPhone={onCopyPhone}
                        />
                        <PhoneChipView
                            label="رقم إضافي"
                            value={displaySecPhone}
                            emptyText="اختياري"
                            variant="secondary"
                            copiedPhone={copiedPhone}
                            onCopyPhone={onCopyPhone}
                        />
                    </div>
                </div>
        </div>
    );
}

CustomerCard.propTypes = {
    ticket: PropTypes.shape({
        customer_name: PropTypes.string,
        phone: PropTypes.string,
        sec_phone: PropTypes.string,
        customer: PropTypes.object
    }).isRequired,
    customerProfile: PropTypes.shape({
        name: PropTypes.string,
        phone: PropTypes.string,
        phone_secondary: PropTypes.string
    }),
    copiedPhone: PropTypes.string,
    onCopyPhone: PropTypes.func.isRequired,
    onSaveCustomer: PropTypes.func.isRequired,
    saving: PropTypes.bool,
    onCollapse: PropTypes.func
};

export default CustomerCard;
