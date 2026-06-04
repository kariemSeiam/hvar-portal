import PropTypes from 'prop-types';
import { Coins } from 'lucide-react';
import CallCenterAmountPanel from '../../call-center/CallCenterAmountPanel';

/**
 * Sell — صف مضغوط: عنوان + تحكم المبلغ، بدون نصوص ثانوية طويلة.
 */
function SellCostAmountSummary({ costValue, isLoadingPrices, onCostChange, calculatedTotal }) {
    const raw = isLoadingPrices ? '' : costValue;
    const v = parseFloat(String(raw || '').replace(/,/g, ''));
    const signedAmount = Number.isFinite(v) ? v : 0;
    const flowMode = Number.isFinite(v) && v < 0 ? 'refund' : 'collect';

    return (
        <div className="space-y-2" dir="rtl">
            <div className="flex items-center justify-between gap-2 min-h-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="
                          flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                          bg-gray-100 dark:bg-gray-700/80
                          ring-1 ring-inset ring-gray-200/80 dark:ring-gray-600/60
                        "
                        aria-hidden
                    >
                        <Coins className="h-3.5 w-3.5 text-brand-blue-600 dark:text-brand-blue-400" strokeWidth={2} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 font-cairo leading-none truncate">
                        التكلفة والتحصيل
                    </h3>
                    {!isLoadingPrices && calculatedTotal !== null && calculatedTotal !== undefined && (
                        <span
                            className="
                              shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium font-cairo
                              bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300
                            "
                        >
                            من العناصر
                        </span>
                    )}
                </div>
                {isLoadingPrices && (
                    <span className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-cairo shrink-0">
                        <span
                            className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
                            aria-hidden
                        />
                        تحميل
                    </span>
                )}
            </div>

            <CallCenterAmountPanel
                variant="embedded"
                showAmountLabel={false}
                neutralFlowUntilPick={false}
                signedAmount={signedAmount}
                flowMode={flowMode}
                onChange={({ signed }) => onCostChange(String(signed))}
                disabled={isLoadingPrices}
                amountLabel="الإجمالي"
                subtitle=""
            />
        </div>
    );
}

SellCostAmountSummary.propTypes = {
    costValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isLoadingPrices: PropTypes.bool,
    onCostChange: PropTypes.func.isRequired,
    calculatedTotal: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
};

SellCostAmountSummary.defaultProps = {
    costValue: '',
    isLoadingPrices: false,
    calculatedTotal: null,
};

export default SellCostAmountSummary;
