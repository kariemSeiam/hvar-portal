import PropTypes from 'prop-types';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { parseMoneyValue, formatMoneyArEGP } from '../../utils/erp/signedMoney';

/**
 * Read-only money: تحصيل / استرداد (same semantics as CallCenterAmountPanel).
 *
 * Sizing (aligned with card footers: time row uses text-xs sm:text-sm + leading-snug):
 * - sm + plain: min-h matches that row; amount uses text-xs sm:text-sm; flow word one step smaller.
 * - md + badge: larger chip for modals / detail blocks.
 */
export default function SessionStyleMoneyBadge({
  value,
  size = 'sm',
  showFlowLabel = true,
  variant = 'plain',
  className = '',
}) {
  const n = parseMoneyValue(value);
  const isZero = Math.abs(n) < 1e-8;
  const isRefund = n < 0;
  const formatted = formatMoneyArEGP(n);

  const isPlain = variant === 'plain';

  const flowCls = isRefund
    ? 'text-brand-red-600 dark:text-brand-red-400'
    : 'text-accent-green-700 dark:text-accent-green-400';

  const amountCls = isRefund
    ? 'text-brand-red-700 dark:text-brand-red-300'
    : 'text-accent-green-800 dark:text-accent-green-300';

  const iconColorCls = isRefund
    ? 'text-brand-red-500 dark:text-brand-red-400'
    : 'text-accent-green-600 dark:text-accent-green-400';

  /* ---- size + variant tokens (single source) ---- */
  const plainSm = {
    shell: 'inline-flex items-center gap-1.5 min-h-[1.375rem] sm:min-h-6 py-0 px-0',
    icon: 'h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4',
    flow: 'text-[10px] sm:text-[11px] font-bold leading-tight font-cairo shrink-0',
    amount: 'text-xs sm:text-sm font-bold tabular-nums leading-tight font-cairo',
    currency: 'text-[10px] sm:text-xs font-bold leading-tight font-cairo',
    zero: 'text-xs sm:text-sm font-semibold tabular-nums leading-tight font-cairo',
  };
  const plainMd = {
    shell: 'inline-flex items-center gap-2 min-h-8 py-0.5 px-0',
    icon: 'h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]',
    flow: 'text-xs sm:text-sm font-bold leading-tight font-cairo shrink-0',
    amount: 'text-sm sm:text-base font-bold tabular-nums leading-tight font-cairo',
    currency: 'text-xs sm:text-sm font-bold leading-tight font-cairo',
    zero: 'text-sm sm:text-base font-semibold tabular-nums leading-tight font-cairo',
  };
  const badgeSm = {
    pad: 'px-2 sm:px-2.5 py-1 sm:py-1.5 min-h-[2rem] sm:min-h-[2.25rem]',
    gap: 'gap-1 sm:gap-1.5',
    text: 'text-xs sm:text-sm',
    icon: 'h-3 w-3 sm:h-3.5 sm:w-3.5',
  };
  const badgeMd = {
    pad: 'px-3 py-2 sm:px-3.5 sm:py-2 min-h-[2.75rem]',
    gap: 'gap-1.5 sm:gap-2',
    text: 'text-sm sm:text-base',
    icon: 'w-4 h-4',
  };

  const P = size === 'md' ? plainMd : plainSm;
  const B = size === 'md' ? badgeMd : badgeSm;

  if (isZero) {
    if (isPlain) {
      return (
        <span
          className={`inline-flex items-baseline gap-1 ${P.zero} text-gray-500 dark:text-gray-400 ${className}`}
          dir="rtl"
        >
          {formatMoneyArEGP(0)}{' '}
          <span className="font-bold opacity-90">ج.م</span>
        </span>
      );
    }
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 ${B.pad} font-cairo ${className}`}
        dir="rtl"
      >
        <span className={`font-semibold text-gray-500 dark:text-gray-400 tabular-nums ${B.text}`}>
          {formatMoneyArEGP(0)} ج.م
        </span>
      </div>
    );
  }

  if (isPlain) {
    return (
      <div className={`${P.shell} bg-transparent border-0 shadow-none ring-0 ${className}`} dir="rtl">
        {isRefund ? (
          <ArrowUpRight className={`${P.icon} ${iconColorCls}`} strokeWidth={2.25} aria-hidden />
        ) : (
          <ArrowDownLeft className={`${P.icon} ${iconColorCls}`} strokeWidth={2.25} aria-hidden />
        )}
        <span
          className="inline-flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5"
          dir="rtl"
          style={{ unicodeBidi: 'isolate' }}
        >
          {showFlowLabel && (
            <span className={`${P.flow} ${flowCls}`}>{isRefund ? 'استرداد' : 'تحصيل'}</span>
          )}
          <span className={`${P.amount} ${amountCls}`} dir="ltr">
            {formatted}
          </span>
          <span className={`${P.currency} ${amountCls} opacity-95`}>ج.م</span>
        </span>
      </div>
    );
  }

  /* badge */
  const badgeTone = isRefund
    ? 'border-brand-red-300 dark:border-brand-red-600 bg-brand-red-50/90 dark:bg-brand-red-900/25 text-brand-red-700 dark:text-brand-red-300'
    : 'border-accent-green-300 dark:border-accent-green-600 bg-accent-green-50/90 dark:bg-accent-green-900/25 text-accent-green-700 dark:text-accent-green-300';

  return (
    <div
      className={`
        inline-flex items-center rounded-md border font-cairo ${B.pad} ${B.gap}
        ${badgeTone}
        ${className}
      `}
      dir="rtl"
    >
      {isRefund ? (
        <ArrowUpRight className={`${B.icon} shrink-0 opacity-90`} strokeWidth={2.25} aria-hidden />
      ) : (
        <ArrowDownLeft className={`${B.icon} shrink-0 opacity-90`} strokeWidth={2.25} aria-hidden />
      )}
      <span
        className="inline-flex min-w-0 shrink-0 items-baseline gap-1 sm:gap-1.5"
        dir="rtl"
        style={{ unicodeBidi: 'isolate' }}
      >
        {showFlowLabel && (
          <span className={`font-bold text-[9px] sm:text-[10px] shrink-0 ${flowCls}`}>
            {isRefund ? 'استرداد' : 'تحصيل'}
          </span>
        )}
        <span className={`font-bold tabular-nums ${B.text}`} dir="ltr">
          {formatted}
        </span>
        <span className={`font-bold ${B.text}`}>ج.م</span>
      </span>
    </div>
  );
}

SessionStyleMoneyBadge.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  size: PropTypes.oneOf(['sm', 'md']),
  showFlowLabel: PropTypes.bool,
  variant: PropTypes.oneOf(['plain', 'badge']),
  className: PropTypes.string,
};
