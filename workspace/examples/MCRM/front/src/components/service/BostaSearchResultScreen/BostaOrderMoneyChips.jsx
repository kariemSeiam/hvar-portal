/**
 * Shared COD + Bosta fee chips for all Bosta order cards (grid, FAB, modal, full item).
 * Main COD chip stays one compact badge (ar-EG amount + ج.م); fees merge into one Bosta-labeled chip.
 */
import PropTypes from 'prop-types';
import { isBostaCodRefundFlow } from '../../../utils/bosta/cod';

/** Green = تحصيل (we collect); red = استرداد / سحب (negative COD or return-pickup order). */
export function BostaCodMainChip({ codValue, bostaOrder = null }) {
    if (codValue === 0) return null;
    const isRefund =
        codValue < 0 || (bostaOrder != null && isBostaCodRefundFlow(bostaOrder));
    const absVal = Math.abs(Number(codValue));
    const formatted = absVal.toLocaleString('ar-EG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    const showMinus = codValue < 0;
    return (
        <span
            className={`inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-xl border font-cairo shrink-0 ${
                isRefund
                    ? 'border-brand-red-400 dark:border-brand-red-600 bg-brand-red-50/80 dark:bg-brand-red-900/20 text-brand-red-700 dark:text-brand-red-300'
                    : 'border-accent-green-400 dark:border-accent-green-600 bg-accent-green-50/80 dark:bg-accent-green-900/20 text-accent-green-700 dark:text-accent-green-300'
            }`}
        >
            <span className="tabular-nums font-bold text-xs" dir="ltr">
                {showMinus ? '−' : ''}
                {formatted} ج.م
            </span>
        </span>
    );
}

BostaCodMainChip.propTypes = {
    codValue: PropTypes.number.isRequired,
    bostaOrder: PropTypes.object,
};

/**
 * Single-line fee chip (same footprint as BostaCodMainChip): «رسوم» + one amount (إجمالي preferred, else صافي).
 */
export function BostaFeesCompactChip({ fees }) {
    const net = fees?.net ?? 0;
    const gross = fees?.gross ?? 0;
    if (net <= 0 && gross <= 0) return null;

    const fmt = (n) =>
        Number(n).toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const displayAmount = gross > 0 ? gross : net;
    const title =
        net > 0 && gross > 0 && Math.abs(net - gross) > 0.001
            ? `صافي ${fmt(net)} ج.م · إجمالي ${fmt(gross)} ج.م`
            : 'رسوم بوسطة';

    return (
        <span
            className="inline-flex items-center justify-center gap-1.5 min-w-0 px-2.5 py-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/80 font-cairo shrink-0"
            title={title}
            dir="rtl"
        >
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                رسوم
            </span>
            <span className="tabular-nums font-bold text-xs text-gray-800 dark:text-gray-200" dir="ltr">
                {fmt(displayAmount)} ج.م
            </span>
        </span>
    );
}

BostaFeesCompactChip.propTypes = {
    fees: PropTypes.shape({
        net: PropTypes.number,
        gross: PropTypes.number,
    }),
};

BostaFeesCompactChip.defaultProps = {
    fees: null,
};
