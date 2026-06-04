import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Coins, ArrowDownLeft, ArrowUpRight, Link2, Check } from 'lucide-react';
import { BOSTA_COD_EPS } from '../../utils/bosta/cod';

function formatMoney(n) {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Session-scale amount row: label + flow toggle + COD field.
 * optional neutralFlowUntilPick: neither تحصيل/استرداد looks selected until first tap (default on embedded).
 */
const CallCenterAmountPanel = ({
  signedAmount,
  onChange,
  flowMode,
  bostaCod,
  disabled = false,
  className = '',
  amountLabel = 'المبلغ',
  subtitle = 'COD · عند الاستلام',
  variant = 'default',
  /** If unset: embedded → true (neutral until pick), default → false */
  neutralFlowUntilPick,
  /** Embedded: show icon + amountLabel row (false when parent already has a title, e.g. SellCostAmountSummary) */
  showAmountLabel = true,
  /** Embedded + !showAmountLabel: put COD first (RTL start), toggle last (RTL end) — e.g. LeaderApprovalModal */
  embeddedCodFirst = false,
  /**
   * `compact` — ch-based narrow COD (session cards). `full` — stretch to row width + text-sm (LeaderApprovalModal).
   */
  codFieldWidth = 'compact',
}) => {
  const magnitude = Math.abs(Number(signedAmount) || 0);
  const [draft, setDraft] = useState(() => (magnitude === 0 ? '' : String(magnitude)));
  const inputRef = useRef(null);

  const isEmbedded = variant === 'embedded';
  const useNeutralUntilPick = neutralFlowUntilPick !== undefined ? neutralFlowUntilPick : isEmbedded;

  const [userPickedFlow, setUserPickedFlow] = useState(() => !useNeutralUntilPick);

  useEffect(() => {
    setUserPickedFlow(!useNeutralUntilPick);
  }, [useNeutralUntilPick]);

  /**
   * If parent hydrates a non-zero signed amount (API / items / COD), exit "neutral" so تحصيل|استرداد
   * matches the sign — same expectation as LeaderApprovalModal & SellCostAmountSummary (neutralFlowUntilPick={false}).
   */
  useEffect(() => {
    const mag = Math.abs(Number(signedAmount) || 0);
    if (mag > 0 && useNeutralUntilPick) {
      setUserPickedFlow(true);
    }
  }, [signedAmount, useNeutralUntilPick]);

  useEffect(() => {
    setDraft(magnitude === 0 ? '' : String(magnitude));
  }, [magnitude]);

  const showFlowFocus = !useNeutralUntilPick || userPickedFlow;
  const collectActive = showFlowFocus && flowMode === 'collect';
  const refundActive = showFlowFocus && flowMode === 'refund';

  const emit = useCallback(
    (flow, mag) => {
      const m = Math.max(0, mag);
      const signed = flow === 'refund' ? (m === 0 ? 0 : -m) : m;
      onChange({ flow, magnitude: m, signed });
    },
    [onChange]
  );

  const commitDraft = useCallback(() => {
    const parsed = parseFloat(String(draft).replace(/,/g, ''));
    if (Number.isNaN(parsed) || parsed < 0) {
      setDraft(magnitude === 0 ? '' : String(magnitude));
      return;
    }
    emit(flowMode, parsed);
  }, [draft, flowMode, emit, magnitude]);

  const handleFlow = (flow) => {
    if (disabled) return;
    if (userPickedFlow && flow === flowMode) return;
    if (!userPickedFlow) setUserPickedFlow(true);
    const parsed = parseFloat(String(draft).replace(/,/g, ''));
    const m = Number.isFinite(parsed) && parsed >= 0 ? parsed : magnitude;
    emit(flow, m);
  };

  const bostaMatch =
    bostaCod != null && Number.isFinite(bostaCod) && Math.abs(Number(signedAmount) - bostaCod) < BOSTA_COD_EPS;

  /** Slight headroom for longer COD; stays compact vs session chrome */
  const codWidthCh = Math.min(9, Math.max(5, draft.length || 5));

  const renderAmountLabel = () => (
    <div className="flex items-center gap-2 min-w-0 sm:pe-1 justify-self-start">
      <span
        className="
          relative flex h-7 w-7 shrink-0 items-center justify-center
          rounded-md bg-gray-100 dark:bg-gray-700/80
          ring-1 ring-inset ring-gray-200/80 dark:ring-gray-600/60
        "
        aria-hidden
      >
        <Coins
          className="w-3.5 h-3.5 text-brand-blue-600 dark:text-brand-blue-400"
          strokeWidth={2}
        />
        <span
          className="
            absolute -bottom-0.5 -end-0.5 flex h-2 w-2 rounded-full
            bg-accent-green-500 ring-2 ring-white dark:ring-gray-800
          "
          title="COD"
        />
      </span>
      <div className="min-w-0 flex flex-col gap-0 leading-tight">
        <span className="text-[11px] sm:text-xs font-bold text-gray-900 dark:text-gray-100 font-cairo">
          {amountLabel}
        </span>
        <span className="text-[9px] sm:text-[10px] font-medium text-gray-500 dark:text-gray-400 font-cairo tabular-nums">
          {subtitle}
        </span>
      </div>
    </div>
  );

  const renderFlowToggle = (embeddedChrome) => (
    <div className={`flex items-center justify-center min-w-0 w-full ${embeddedChrome ? 'py-0' : 'py-0'}`}>
      <div
        className="
          inline-flex max-w-full min-w-0 items-stretch rounded-lg shrink-0 gap-1 p-1
          border border-gray-200 dark:border-gray-700
          bg-gray-100/90 dark:bg-gray-900/30
        "
        role="group"
        aria-label="اختيار نوع الحركة المالية: تحصيل أو استرداد"
      >
        <button
          type="button"
          disabled={disabled}
          aria-pressed={collectActive}
          title="تحصيل من العميل"
          onClick={() => handleFlow('collect')}
          className={`
            relative z-0 flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md
            ${embeddedChrome ? 'px-2.5 py-1.5 min-h-[2rem]' : 'px-3 py-2 min-h-[2.25rem] sm:min-h-9'}
            text-[11px] sm:text-xs font-bold font-cairo transition-all duration-150
            ${collectActive
              ? 'bg-white text-accent-green-700 shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-700 dark:text-accent-green-400 dark:ring-gray-600/70'
              : 'bg-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="whitespace-nowrap">تحصيل</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={refundActive}
          title="استرداد للعميل"
          onClick={() => handleFlow('refund')}
          className={`
            relative z-0 flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md
            ${embeddedChrome ? 'px-2.5 py-1.5 min-h-[2rem]' : 'px-3 py-2 min-h-[2.25rem] sm:min-h-9'}
            text-[11px] sm:text-xs font-bold font-cairo transition-all duration-150
            ${refundActive
              ? 'bg-white text-brand-red-600 shadow-sm ring-1 ring-gray-200/80 dark:bg-gray-700 dark:text-brand-red-400 dark:ring-gray-600/70'
              : 'bg-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="whitespace-nowrap">استرداد</span>
        </button>
      </div>
    </div>
  );

  const flowToggle = renderFlowToggle(false);
  const flowToggleEmbedded = renderFlowToggle(true);

  const isFullCodWidth = codFieldWidth === 'full';

  const renderCodField = (embedded) => {
    return (
      <div
        className={
          isFullCodWidth
            ? 'flex-1 min-w-0 w-full'
            : 'w-fit max-w-full min-w-0 justify-self-center sm:justify-self-end'
        }
      >
        <div
          className={`
          flex min-w-0 items-stretch overflow-hidden rounded-lg
          border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800
          transition-all duration-150
          focus-within:border-brand-blue-500 focus-within:ring-2 focus-within:ring-brand-blue-500/20 dark:focus-within:border-brand-blue-400 dark:focus-within:ring-brand-blue-400/25
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
          ${isFullCodWidth ? 'w-full' : 'inline-flex w-fit max-w-full'}
        `}
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitDraft();
                inputRef.current?.blur();
              }
            }}
            onFocus={(e) => e.target.select()}
            placeholder="٠"
            dir="ltr"
            disabled={disabled}
            style={
              isFullCodWidth
                ? undefined
                : { width: `${codWidthCh}ch`, minWidth: '5ch', maxWidth: '9ch' }
            }
            className={`
            min-w-0 bg-transparent font-cairo focus:outline-none
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            ${isFullCodWidth
              ? `
              flex-1 shrink ps-2.5 pe-1.5 py-1.5 min-h-[2.25rem]
              text-sm font-semibold tabular-nums text-end
              overflow-x-auto
            `
              : `
              box-content shrink-0 ps-2 pe-1.5
              ${embedded ? 'py-1 min-h-[1.75rem]' : 'py-1.5 min-h-[2rem] sm:min-h-[2.05rem]'}
              text-xs font-bold tabular-nums text-end
              sm:text-[0.8125rem]
              overflow-x-auto
              transition-[width] duration-150 ease-out
            `}
          `}
            aria-label="مبلغ COD"
          />
          <span
            className={`
            flex shrink-0 items-center border-s border-gray-200/90 px-2.5 dark:border-gray-600/80
            bg-gray-50/90 font-bold font-cairo tabular-nums leading-none text-gray-500 dark:bg-gray-800/60 dark:text-gray-400
            ${isFullCodWidth
              ? 'min-h-[2.25rem] py-1.5 text-xs sm:text-sm'
              : embedded
                ? 'min-h-[1.75rem] text-[10px] sm:text-[11px]'
                : 'min-h-[2rem] sm:min-h-[2.05rem] text-[10px] sm:text-[11px]'}
          `}
          >
            ج.م
          </span>
        </div>
      </div>
    );
  };

  const codField = renderCodField(false);
  const codFieldEmbedded = renderCodField(true);

  const bostaRow =
    bostaCod != null && Number.isFinite(bostaCod) ? (
      <div
        className={`
          flex items-start gap-2 px-2.5 sm:px-3 py-2 border-t border-gray-200 dark:border-gray-700
          text-xs font-medium font-cairo leading-snug
          bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300
        `}
        role="status"
      >
        {bostaMatch ? (
          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 stroke-[2.5] text-accent-green-600 dark:text-accent-green-400" aria-hidden />
        ) : (
          <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        )}
        <span className="min-w-0">
          {bostaMatch
            ? `يطابق COD بوسطة (${formatMoney(bostaCod)})`
            : `يختلف عن بوسطة — المدخل ${formatMoney(Number(signedAmount) || 0)} · بوسطة ${formatMoney(bostaCod)}`}
        </span>
      </div>
    ) : null;

  /** Same shell as item rows in OrderItemsEditor / session cards */
  const embeddedShell = (body) => (
    <div className={`w-full ${isFullCodWidth ? 'min-w-0' : ''} ${className}`} dir="rtl">
      <div
        className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden ${isFullCodWidth ? 'w-full min-w-0' : ''}`}
      >
        {body}
      </div>
    </div>
  );

  if (isEmbedded) {
    if (!showAmountLabel) {
      return embeddedShell(
        <>
          <div className={`p-2.5 sm:p-3 ${isFullCodWidth ? 'w-full min-w-0' : ''}`}>
            <div
              className={`
              flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-center min-[380px]:gap-3
              ${isFullCodWidth ? 'w-full min-w-0' : 'min-[380px]:justify-between'}
            `}
            >
              {embeddedCodFirst ? (
                <>
                  {codFieldEmbedded}
                  <div
                    className={`min-w-0 flex justify-center ${isFullCodWidth ? 'shrink-0' : 'min-[380px]:flex-1'}`}
                  >
                    {flowToggleEmbedded}
                  </div>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex justify-center min-[380px]:flex-1">{flowToggleEmbedded}</div>
                  {codFieldEmbedded}
                </>
              )}
            </div>
          </div>
          {bostaRow}
        </>
      );
    }
    return embeddedShell(
      <>
        <div className="p-2.5 sm:p-3">
          <div
            className="
            grid grid-cols-1 gap-2.5
            min-[420px]:grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto]
            min-[420px]:items-center min-[420px]:gap-x-3 min-[420px]:gap-y-0
          "
          >
            {renderAmountLabel()}
            <div className="min-w-0 flex justify-center min-[420px]:px-1">{flowToggleEmbedded}</div>
            {codFieldEmbedded}
          </div>
        </div>
        {bostaRow}
      </>
    );
  }

  return (
    <div className={`w-full ${className}`} dir="rtl">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="p-2.5 sm:p-3">
          <div
            className="
            grid grid-cols-1 gap-2.5
            sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto]
            sm:items-center sm:gap-x-3 sm:gap-y-0
          "
          >
            {renderAmountLabel()}
            <div className="min-w-0 flex justify-center sm:px-1">{flowToggle}</div>
            {codField}
          </div>
        </div>
        {bostaRow}
      </div>
    </div>
  );
};

CallCenterAmountPanel.propTypes = {
  signedAmount: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  flowMode: PropTypes.oneOf(['collect', 'refund']).isRequired,
  bostaCod: PropTypes.number,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  amountLabel: PropTypes.string,
  subtitle: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'embedded']),
  neutralFlowUntilPick: PropTypes.bool,
  showAmountLabel: PropTypes.bool,
  embeddedCodFirst: PropTypes.bool,
  codFieldWidth: PropTypes.oneOf(['compact', 'full']),
};

export default CallCenterAmountPanel;
