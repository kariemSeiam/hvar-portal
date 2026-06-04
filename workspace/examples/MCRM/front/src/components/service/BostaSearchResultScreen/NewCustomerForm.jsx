/**
 * NewCustomerForm - إنشاء عميل جديد form for Bosta search when customer not found
 * Updated to match ServiceModalViewer card styling with rounded-2xl, proper touch targets, design token colors
 */
import Input from '../../ui/Input';
import Textarea from '../../ui/Textarea';
import GovernorateSearchSelect from '../../ui/GovernorateSearchSelect';

export default function NewCustomerForm({
    formData,
    formErrors,
    isCreating,
    onFieldChange,
    onSubmit,
    onClose,
}) {
    return (
        <div className="w-full" dir="rtl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="font-cairo font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2.5">
                        <span className="w-1 h-6 rounded-full bg-accent-amber-500" />
                        <span className="w-7 h-7 rounded-lg bg-accent-amber-100 dark:bg-accent-amber-900/30 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-accent-amber-600 dark:text-accent-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </span>
                        إنشاء عميل جديد
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            p-2 min-w-[36px] min-h-[36px]
                            rounded-lg
                            text-gray-500 dark:text-gray-400
                            hover:text-gray-700 dark:hover:text-gray-200
                            hover:bg-gray-200 dark:hover:bg-gray-700
                            transition-all duration-200
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500
                        "
                        title="إغلاق"
                        aria-label="إغلاق"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        <div className="md:col-span-2">
                            <Input
                                label="الاسم"
                                value={formData.name}
                                onChange={(e) => onFieldChange('name', e.target.value)}
                                placeholder="أدخل اسم العميل"
                                required
                                error={formErrors.name}
                                className="font-cairo"
                                dir="rtl"
                            />
                        </div>

                        <Input
                            label="رقم الهاتف"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => onFieldChange('phone', e.target.value)}
                            placeholder="01123456789 أو +201123456789"
                            required
                            error={formErrors.phone}
                            className="font-cairo"
                            dir="ltr"
                        />

                        <Input
                            label="رقم الهاتف الثانوي (اختياري)"
                            type="tel"
                            value={formData.phone_secondary}
                            onChange={(e) => onFieldChange('phone_secondary', e.target.value)}
                            placeholder="01123456789 أو +201123456789"
                            error={formErrors.phone_secondary}
                            className="font-cairo"
                            dir="ltr"
                        />

                        <GovernorateSearchSelect
                            label="المحافظة (اختياري)"
                            value={formData.governorate}
                            onChange={(e) => onFieldChange('governorate', e.target.value)}
                            placeholder="ابحث أو اختر المحافظة"
                        />

                        <Input
                            label="المدينة (اختياري)"
                            value={formData.city}
                            onChange={(e) => onFieldChange('city', e.target.value)}
                            placeholder="أدخل اسم المدينة"
                            className="font-cairo"
                            dir="rtl"
                        />

                        <div className="md:col-span-2">
                            <Textarea
                                label="تفاصيل العنوان (اختياري)"
                                value={formData.address_details}
                                onChange={(e) => onFieldChange('address_details', e.target.value)}
                                placeholder="أدخل تفاصيل العنوان بالكامل"
                                rows={3}
                                className="font-cairo"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-cairo">
                            * الحقول المطلوبة
                        </div>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isCreating}
                            className="
                                bg-accent-green-600 hover:bg-accent-green-700
                                text-white
                                px-5 py-3
                                min-h-[48px] sm:min-h-[44px]
                                rounded-xl
                                font-cairo font-medium text-sm
                                transition-all duration-200
                                shadow-md hover:shadow-lg
                                disabled:opacity-50 disabled:cursor-not-allowed
                                flex items-center justify-center gap-2
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green-500 focus-visible:ring-offset-2
                                active:scale-95
                            "
                        >
                            {isCreating ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>جاري الإنشاء...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>إنشاء العميل</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
