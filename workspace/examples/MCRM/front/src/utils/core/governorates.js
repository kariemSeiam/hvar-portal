/**
 * Egyptian Governorates - Single Source of Truth
 * Complete list of all 27 Egyptian governorates
 * Used across all forms, filters, and selects in the application
 */

/**
 * Complete list of all 27 Egyptian governorates in Arabic
 * Organized by region for reference
 */
export const EGYPTIAN_GOVERNORATES = [
    // Greater Cairo Region
    'القاهرة',
    'الجيزة',
    'القليوبية',
    // Alexandria Region
    'الإسكندرية',
    'مطروح',
    'البحيرة',
    // Delta Region
    'دمياط',
    'الدقهلية',
    'الغربية',
    'المنوفية',
    'كفر الشيخ',
    // Canal Region
    'بورسعيد',
    'السويس',
    'الإسماعيلية',
    'الشرقية',
    'شمال سيناء',
    'جنوب سيناء',
    // Upper Egypt - North
    'الفيوم',
    'بني سويف',
    'المنيا',
    // Upper Egypt - Central
    'أسيوط',
    'الوادي الجديد',
    // Upper Egypt - South
    'البحر الأحمر',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
];

/**
 * Governorate options for Select components (value/label format)
 */
export const EGYPTIAN_GOVERNORATE_OPTIONS = EGYPTIAN_GOVERNORATES.map(gov => ({
    value: gov,
    label: gov
}));
