import { useMemo, useCallback } from 'react';
import CallCenterAmountPanel from '../../../call-center/CallCenterAmountPanel';
import { parseMoneyValue } from '../../../../utils/erp/signedMoney';

/**
 * Cost / refund row — same تحصيل · استرداد toggle + amount field as call-center session.
 */
function RefundSection({ actionType, formData, onInputChange, calculatedTotal, isSellReadOnly }) {
    const isSell = actionType === 'sell';
    const isReturn = actionType === 'return';

    const { signedAmount, flowMode } = useMemo(() => {
        if (isSell) {
            const c = parseMoneyValue(formData.cost);
            return { signedAmount: c, flowMode: 'collect' };
        }
        if (isReturn) {
            const r = parseMoneyValue(formData.refund_amount);
            const c = parseMoneyValue(formData.cost);
            if (r > 0) return { signedAmount: -Math.abs(r), flowMode: 'refund' };
            if (c !== 0) return { signedAmount: Math.abs(c), flowMode: 'collect' };
            return { signedAmount: 0, flowMode: 'collect' };
        }
        const c = parseMoneyValue(formData.cost);
        return { signedAmount: c, flowMode: c < 0 ? 'refund' : 'collect' };
    }, [isSell, isReturn, formData.cost, formData.refund_amount]);

    const handlePanelChange = useCallback(
        ({ flow, magnitude, signed }) => {
            if (isReturn) {
                if (flow === 'refund') {
                    onInputChange('refund_amount', magnitude === 0 ? '' : String(magnitude));
                    onInputChange('cost', '');
                } else {
                    onInputChange('cost', magnitude === 0 ? '' : String(magnitude));
                    onInputChange('refund_amount', '');
                }
                return;
            }
            onInputChange('cost', String(signed));
        },
        [isReturn, onInputChange]
    );

    const amountLabel = isSell ? 'الإجمالي' : isReturn ? 'المبلغ' : 'التكلفة';
    const subtitle = isSell
        ? 'إجمالي البيع · تحصيل (من العناصر)'
        : isReturn
          ? 'استرداد للعميل أو تحصيل · كما في جلسة الاتصال'
          : 'التكلفة المتوقعة · تحصيل أو استرداد';

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">معلومات إضافية</h3>
            <div className="flex flex-col gap-3">
                <div className="min-w-0 w-full">
                    <CallCenterAmountPanel
                        signedAmount={signedAmount}
                        flowMode={flowMode}
                        onChange={handlePanelChange}
                        disabled={isSellReadOnly}
                        amountLabel={amountLabel}
                        subtitle={subtitle}
                        className="!shadow-none"
                    />
                    {isSell && calculatedTotal !== null && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-cairo">
                            محسوب تلقائياً من العناصر المحددة
                        </p>
                    )}
                </div>
                <div className="w-full min-w-0">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-cairo">الأولوية</label>
                    <div className="flex items-center space-x-1 space-x-reverse h-[38px]">
                        {['low', 'medium', 'high'].map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onInputChange('priority', p)}
                                className={`flex-1 px-2 py-1.5 rounded-md font-cairo text-xs transition-colors duration-200 ${formData.priority === p ? (p === 'low' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-600' : p === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600') : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                            >
                                <div className="flex items-center justify-center space-x-1 space-x-reverse">
                                    <div className={`w-1.5 h-1.5 rounded-full ${formData.priority === p ? (p === 'low' ? 'bg-green-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-red-500') : 'bg-gray-400'}`} />
                                    <span>{p === 'low' ? 'عادي' : p === 'medium' ? 'متوسط' : 'عاجل'}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 font-cairo">ملاحظات</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => onInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500"
                    dir="rtl"
                    placeholder="أضف أي ملاحظات إضافية..."
                />
            </div>
        </div>
    );
}

export default RefundSection;
