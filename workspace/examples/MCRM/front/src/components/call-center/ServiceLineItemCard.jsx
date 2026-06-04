import { Package, Wrench, Minus, Plus, X, CheckCircle, RotateCcw } from 'lucide-react';
import PropTypes from 'prop-types';

const fmtLine = (n) =>
    new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 2 }).format(
        Number(n) || 0
    );

/**
 * Unified line row: same shell as OrderItemsEditor / CallSessionFAB.
 *
 * - sell: unit price input, × qty, EGP line total
 * - service (return / replacement / maintenance): × qty only; optional condition read-only or toggle
 */
function ServiceLineItemCard({
    itemType,
    name,
    sku,
    quantity,
    showPrice = false,
    effectiveUnitPrice = 0,
    priceInputValue = 0,
    onPriceInputChange = () => {},
    conditionMode = 'none',
    condition = 'valid',
    onConditionToggle,
    qtyDraft,
    onQtyDraftChange,
    onQtyFocus,
    onQtyBlur,
    onQuantityDelta,
    onRemove,
    disabled = false,
}) {
    const isPart = itemType === 'part';
    const Icon = isPart ? Wrench : Package;
    const iconClass = isPart
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-brand-blue-600 dark:text-brand-blue-400';
    const lineTotalClass = isPart
        ? 'text-amber-700 dark:text-amber-300'
        : 'text-accent-green-700 dark:text-accent-green-300';

    const qty = quantity || 1;
    const unit = Number(effectiveUnitPrice) || 0;
    const lineTotal = unit * qty;

    const conditionBlock =
        conditionMode === 'toggle' && onConditionToggle ? (
            <button
                type="button"
                onClick={onConditionToggle}
                disabled={disabled}
                className="flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-600/80 transition-colors disabled:opacity-50"
            >
                {condition === 'valid' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                    <RotateCcw className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo whitespace-nowrap">
                    {condition === 'valid' ? 'سليم' : 'تالف'}
                </span>
            </button>
        ) : conditionMode === 'readOnly' ? (
            <div className="flex items-center gap-1 shrink-0">
                {condition === 'valid' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                    <RotateCcw className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo whitespace-nowrap">
                    {condition === 'valid' ? 'سليم' : 'تالف'}
                </span>
            </div>
        ) : null;

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3">
                <div className="flex-1 min-w-0" dir="rtl">
                    <div className="flex items-center gap-2 mb-1.5 min-w-0 flex-wrap">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo truncate min-w-0">
                            {name}
                        </h4>
                        {sku ? (
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 font-cairo flex-shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700/70">
                                {sku}
                            </span>
                        ) : null}
                        {conditionBlock}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {showPrice ? (
                            <>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-cairo">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={priceInputValue}
                                        onChange={(e) => onPriceInputChange(parseFloat(e.target.value) || 0)}
                                        disabled={disabled}
                                        className="w-[5.25rem] px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-right font-cairo text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-2 focus:ring-brand-blue-500/40 dark:focus:ring-brand-blue-400/30 disabled:opacity-50"
                                        dir="rtl"
                                        aria-label="سعر الوحدة"
                                    />
                                    <span className="mx-0.5 text-gray-400">×</span>
                                    <span className="tabular-nums">{qty}</span>
                                </div>
                                {unit > 0 ? (
                                    <span className={`text-sm font-bold font-cairo ${lineTotalClass}`}>{fmtLine(lineTotal)}</span>
                                ) : null}
                            </>
                        ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-cairo tabular-nums">
                                <span className="text-gray-400">×</span>
                                <span className="mx-1">{qty}</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0" dir="rtl">
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <button
                            type="button"
                            onClick={() => onQuantityDelta(-1)}
                            disabled={disabled || qty <= 1}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="نقص الكمية"
                        >
                            <Minus className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <input
                            type="number"
                            min={1}
                            max={9999}
                            inputMode="numeric"
                            disabled={disabled}
                            className="w-10 px-2.5 py-1.5 text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo text-center bg-transparent border-0 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-0 disabled:opacity-50"
                            value={qtyDraft !== undefined && qtyDraft !== '' ? qtyDraft : String(qty)}
                            onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, '');
                                onQtyDraftChange(v === '' ? '' : v);
                            }}
                            onFocus={onQtyFocus}
                            onBlur={onQtyBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') e.target.blur();
                            }}
                            aria-label="الكمية"
                        />
                        <button
                            type="button"
                            onClick={() => onQuantityDelta(1)}
                            disabled={disabled}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-l-lg transition-colors disabled:opacity-50"
                            aria-label="زيادة الكمية"
                        >
                            <Plus className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={disabled}
                        className="p-1.5 sm:p-2 text-brand-red-600 dark:text-brand-red-400 hover:bg-brand-red-50 dark:hover:bg-brand-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="حذف"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

ServiceLineItemCard.propTypes = {
    itemType: PropTypes.oneOf(['product', 'part']).isRequired,
    name: PropTypes.string.isRequired,
    sku: PropTypes.string,
    quantity: PropTypes.number,
    showPrice: PropTypes.bool,
    effectiveUnitPrice: PropTypes.number,
    priceInputValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onPriceInputChange: PropTypes.func, // unused when showPrice is false
    conditionMode: PropTypes.oneOf(['none', 'readOnly', 'toggle']),
    condition: PropTypes.string,
    onConditionToggle: PropTypes.func,
    qtyDraft: PropTypes.string,
    onQtyDraftChange: PropTypes.func.isRequired,
    onQtyFocus: PropTypes.func.isRequired,
    onQtyBlur: PropTypes.func.isRequired,
    onQuantityDelta: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

export default ServiceLineItemCard;
