import GovernorateSearchSelect from '../../../ui/GovernorateSearchSelect';

/** Pickup address: governorate, city, details. */
function AddressSection({ formData, onInputChange }) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-cairo">عنوان الاستلام</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GovernorateSearchSelect
                    label="المحافظة"
                    value={formData.pickup_address?.governorate ?? ''}
                    onChange={(e) => onInputChange('pickup_address.governorate', e.target.value)}
                    placeholder="ابحث أو اختر المحافظة"
                    required
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-cairo">المدينة <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.pickup_address?.city ?? ''} onChange={(e) => onInputChange('pickup_address.city', e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" dir="rtl" placeholder="أدخل المدينة" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-cairo">تفاصيل العنوان <span className="text-red-500">*</span></label>
                <textarea value={formData.pickup_address?.details ?? ''} onChange={(e) => onInputChange('pickup_address.details', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" dir="rtl" placeholder="اكتب العنوان الكامل بالتفصيل..." />
            </div>
        </div>
    );
}

export default AddressSection;
