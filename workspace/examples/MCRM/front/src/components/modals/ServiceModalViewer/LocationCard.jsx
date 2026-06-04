import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MapPin } from 'lucide-react';
import GovernorateSearchSelect from '../../ui/GovernorateSearchSelect';

const chipCore =
    'inline-flex items-start gap-1 sm:gap-1.5 md:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-2 md:px-3 md:py-2 rounded-lg sm:rounded-xl transition-all align-top';
const chipBase = `${chipCore} w-fit flex-shrink-0`;
// Gov + city share the row; city gets a bit more width (longer values wrap less).
const chipRowGrowGovernorate = `${chipCore.replace('inline-flex', 'flex')} flex-[0.92] min-w-0 basis-0 max-w-full`;
const chipRowGrowCity = `${chipCore.replace('inline-flex', 'flex')} flex-[1.08] min-w-0 basis-0 max-w-full`;
// Same as التفاصيل block: title on top, value full width under (no cramped label|value row).
const chipStackBody = 'flex flex-col gap-0.5 min-w-0 flex-1 w-full max-w-full';
const chipStackBodyEdit = 'flex flex-col gap-0.5 min-w-0 flex-1 w-full max-w-full basis-0';
const chipPrimary = 'bg-brand-blue-50 dark:bg-brand-blue-900/20 border border-brand-blue-200 dark:border-brand-blue-800 shadow-sm';
const chipSecondary = 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm';
const chipEmpty = 'bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50';

const inputBase = 'bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-[11px] sm:text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo min-w-0 placeholder-gray-400 dark:placeholder-gray-500';

const govCityRowClass =
    'flex flex-row flex-nowrap items-start justify-start gap-x-2 sm:gap-x-3 w-full min-w-0';
/** Edit mode: always stack المحافظة + المدينة — side-by-side flex was shrinking المدينة (basis-0) next to the gov control. */
const govCityRowEditClass = 'flex flex-col gap-2 w-full min-w-0';
/** Full-width chips in edit mode (same pattern as التفاصيل textarea row). */
const chipRowFullWidthEdit = `${chipCore.replace('inline-flex', 'flex')} w-full min-w-0 max-w-full flex-nowrap items-start`;

/**
 * Location card — matches CustomerCard chip pattern.
 * Gov + City + Address as chips with edit mode and empty state each.
 */
function LocationCard({ ticket, customerProfile = null, onSaveAddress, saving = false }) {
    const detailsTextareaRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState({ governorate: '', city: '', address_details: '' });

    const displayGovernorate = (customerProfile && typeof customerProfile === 'object' && !Array.isArray(customerProfile))
        ? (customerProfile.governorate ?? '')
        : ((ticket && typeof ticket === 'object' && !Array.isArray(ticket)) ? (ticket.governorate ?? '') : '');

    const displayCity = (customerProfile && typeof customerProfile === 'object' && !Array.isArray(customerProfile))
        ? (customerProfile.city ?? '')
        : ((ticket && typeof ticket === 'object' && !Array.isArray(ticket)) ? (ticket.city ?? '') : '');

    const displayAddress = (customerProfile && typeof customerProfile === 'object' && !Array.isArray(customerProfile))
        ? (customerProfile.address_details ?? '')
        : ((ticket && typeof ticket === 'object' && !Array.isArray(ticket)) ? (ticket.customer_address ?? '') : '');

    useEffect(() => {
        if (!isEditing) return;
        setDraft({
            governorate: displayGovernorate || '',
            city: displayCity || '',
            address_details: displayAddress || ''
        });
    }, [isEditing, displayGovernorate, displayCity, displayAddress]);

    useLayoutEffect(() => {
        if (!isEditing) return;
        const el = detailsTextareaRef.current;
        if (!el) return;
        el.style.height = '0px';
        el.style.height = `${el.scrollHeight}px`;
    }, [isEditing, draft.address_details]);

    const handleConfirm = () => {
        onSaveAddress({
            governorate: draft.governorate?.trim() || undefined,
            city: draft.city?.trim() || undefined,
            address_details: draft.address_details?.trim() || undefined
        }, () => setIsEditing(false));
    };

    const handleCancel = () => {
        setDraft({
            governorate: displayGovernorate || '',
            city: displayCity || '',
            address_details: displayAddress || ''
        });
        setIsEditing(false);
    };

    const textActionBtn =
        'inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-cairo font-medium leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-0 active:scale-[0.98] flex-shrink-0';
    const actionSlot =
        'absolute top-2 end-2 sm:top-2.5 sm:end-3 flex items-center justify-end gap-1 z-10 max-w-[55%] sm:max-w-none flex-wrap';
    const actionPill = 'flex items-center justify-end gap-1 min-w-0 flex-wrap';
    const cardBase = 'bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200 dark:border-gray-700 shadow-md sm:shadow-lg relative transition-all duration-200 shrink-0';
    const cardEditing = 'ring-2 ring-brand-blue-200/80 dark:ring-brand-blue-800/60 ring-inset';
    const contentPad = 'ps-2 pe-[5.25rem] sm:ps-3 sm:pe-[6.5rem] md:pe-28';

    // Edit mode — same chip layout as CustomerCard
    if (isEditing) {
        return (
            <div className={`${cardBase} ${cardEditing}`} data-testid="service-modal-viewer-location-card" role="form" aria-label="تعديل العنوان">
                <div className={actionSlot}>
                    <div className={actionPill}>
                        <button type="button" onClick={handleCancel} className={`${textActionBtn} text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200`}>
                            إلغاء
                        </button>
                        <button type="button" disabled={saving} onClick={handleConfirm} className={`${textActionBtn} text-accent-green-700 dark:text-accent-green-400 hover:bg-accent-green-50 dark:hover:bg-accent-green-900/30 disabled:opacity-50 disabled:pointer-events-none`}>
                            حفظ
                        </button>
                    </div>
                </div>
                <div className={`${contentPad} flex flex-col gap-2 sm:gap-y-3`}>
                    <div className={govCityRowEditClass} dir="rtl">
                        <div
                            className={`${chipRowFullWidthEdit} ${chipPrimary} focus-within:ring-2 focus-within:ring-brand-blue-500/20 focus-within:border-brand-blue-400 dark:focus-within:border-brand-blue-500`}
                            role="group"
                            aria-label="المحافظة"
                        >
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-blue-600 dark:text-brand-blue-400 flex-shrink-0 mt-0.5" aria-hidden />
                            <div className={chipStackBodyEdit}>
                                <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo">المحافظة</span>
                                <GovernorateSearchSelect
                                    value={draft.governorate}
                                    onChange={(e) => setDraft((p) => ({ ...p, governorate: e.target.value }))}
                                    placeholder="—"
                                    inline
                                    className="!mb-0 w-full min-w-0"
                                />
                            </div>
                        </div>
                        <div
                            className={`${chipRowFullWidthEdit} ${chipSecondary} focus-within:ring-2 focus-within:ring-brand-blue-500/20 focus-within:border-brand-blue-400 dark:focus-within:border-brand-blue-500`}
                            role="group"
                            aria-label="المدينة"
                        >
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" aria-hidden />
                            <div className={chipStackBodyEdit}>
                                <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo">المدينة</span>
                                <input
                                    type="text"
                                    value={draft.city}
                                    placeholder="—"
                                    onChange={(e) => setDraft((p) => ({ ...p, city: e.target.value }))}
                                    className={`${inputBase} box-border block w-full min-w-0 max-w-full`}
                                    dir="rtl"
                                    aria-label="المدينة"
                                />
                            </div>
                        </div>
                    </div>
                    <div className={`${chipBase} ${chipSecondary} focus-within:ring-2 focus-within:ring-brand-blue-500/20 focus-within:border-brand-blue-400 dark:focus-within:border-brand-blue-500 w-full min-w-0 flex items-start gap-1 sm:gap-1.5`} dir="rtl" role="group" aria-label="التفاصيل">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" aria-hidden />
                        <div className={chipStackBody}>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo">التفاصيل</span>
                            <textarea
                                ref={detailsTextareaRef}
                                value={draft.address_details}
                                onChange={(e) => setDraft((p) => ({ ...p, address_details: e.target.value }))}
                                placeholder="—"
                                className={`${inputBase} box-border w-full min-h-0 max-h-[50vh] resize-none overflow-y-auto overflow-x-hidden`}
                                dir="rtl"
                                rows={1}
                                aria-label="تفاصيل العنوان"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // View mode — chips with value or empty state (like PhoneChipView)
    const hasGov = !!displayGovernorate;
    const hasCity = !!displayCity;
    const hasAddr = !!displayAddress;

    return (
        <div className={cardBase} data-testid="service-modal-viewer-location-card">
            <div className={actionSlot}>
                <div className={actionPill}>
                    <button
                        type="button"
                        className={`${textActionBtn} text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-blue-700 dark:hover:text-brand-blue-400`}
                        onClick={() => setIsEditing(true)}
                    >
                        تعديل
                    </button>
                </div>
            </div>
            <div className={`${contentPad} flex flex-col gap-2 sm:gap-y-3`}>
                <div className={govCityRowClass} dir="rtl">
                    <div
                        className={`${chipRowGrowGovernorate} ${hasGov ? chipPrimary : chipEmpty} ${hasGov ? 'hover:shadow-md' : ''}`}
                        role="group"
                        aria-label="المحافظة"
                    >
                        <MapPin
                            className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${hasGov ? 'text-brand-blue-600 dark:text-brand-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                            aria-hidden
                        />
                        <div className={chipStackBody}>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo">المحافظة</span>
                            <span
                                className={`w-full min-w-0 text-[11px] sm:text-xs md:text-sm font-cairo whitespace-normal break-words text-start leading-snug ${hasGov ? 'font-bold text-brand-blue-900 dark:text-brand-blue-100' : 'font-medium text-gray-400 dark:text-gray-500'}`}
                                dir="rtl"
                            >
                                {displayGovernorate || '—'}
                            </span>
                        </div>
                    </div>
                    <div
                        className={`${chipRowGrowCity} ${hasCity ? chipSecondary : chipEmpty} ${hasCity ? 'hover:shadow-md' : ''}`}
                        role="group"
                        aria-label="المدينة"
                    >
                        <MapPin
                            className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${hasCity ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}
                            aria-hidden
                        />
                        <div className={chipStackBody}>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo">المدينة</span>
                            <span
                                className={`w-full min-w-0 text-[11px] sm:text-xs md:text-sm font-cairo whitespace-normal break-words text-start leading-snug ${hasCity ? 'font-medium text-gray-700 dark:text-gray-300' : 'font-medium text-gray-400 dark:text-gray-500'}`}
                                dir="rtl"
                            >
                                {displayCity || '—'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={`${chipBase} ${hasAddr ? chipSecondary : chipEmpty} ${hasAddr ? 'hover:shadow-md' : ''} w-full min-w-0 flex items-start gap-1 sm:gap-1.5`} dir="rtl" role="group" aria-label="التفاصيل">
                    <MapPin className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${hasAddr ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`} aria-hidden />
                    <div className={chipStackBody}>
                        <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo">التفاصيل</span>
                        <span className={`w-full min-w-0 text-[11px] sm:text-xs md:text-sm font-cairo whitespace-pre-line break-words text-start ${hasAddr ? 'font-medium text-gray-700 dark:text-gray-300' : 'font-medium text-gray-400 dark:text-gray-500'}`} dir="rtl">
                            {displayAddress || '—'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

LocationCard.propTypes = {
    ticket: PropTypes.shape({
        governorate: PropTypes.string,
        city: PropTypes.string,
        customer_address: PropTypes.string
    }).isRequired,
    customerProfile: PropTypes.shape({
        governorate: PropTypes.string,
        city: PropTypes.string,
        address_details: PropTypes.string
    }),
    onSaveAddress: PropTypes.func.isRequired,
    saving: PropTypes.bool
};

export default LocationCard;
