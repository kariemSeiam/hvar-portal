export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الشرقية',
  'الدقهلية',
  'المنوفية',
  'الغربية',
  'القليوبية',
  'البحيرة',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'بني سويف',
  'الفيوم',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
] as const

export const WHATSAPP_URL = 'https://wa.me/201080755516'
export const FREE_SHIPPING_THRESHOLD = 3000

export type CheckoutCopy = {
  title: string
  subtitle: string
  stepCart: string
  stepAddress: string
  stepPayment: string
  address: string
  addAddress: string
  chooseGovernorate: string
  governorate: string
  district: string
  details: string
  noSavedAddress: string
  payment: string
  cod: string
  card: string
  coupon: string
  haveCoupon: string
  couponPlaceholder: string
  apply: string
  remove: string
  discount: string
  subtotal: string
  shipping: string
  total: string
  placeOrder: string
  mobileOrderSummary: string
  hideItems: string
  showItems: string
  trustFreeShipping: string
  trustWarranty: string
  trustDelivery: string
  questionsWhatsApp: string
  soon: string
  default: string
  cancel: string
  save: string
}

const ar: CheckoutCopy = {
  title: 'إتمام الطلب',
  subtitle: 'خطوات بسيطة لإتمام طلبك بسرعة وأمان',
  stepCart: 'السلة',
  stepAddress: 'العنوان',
  stepPayment: 'الدفع',
  address: 'عنوان التوصيل',
  addAddress: 'إضافة عنوان',
  chooseGovernorate: 'اختر المحافظة',
  governorate: 'المحافظة',
  district: 'المنطقة',
  details: 'العنوان بالتفصيل',
  noSavedAddress: 'لا يوجد عنوان محفوظ حالياً. أضف عنواناً جديداً للمتابعة.',
  payment: 'طريقة الدفع',
  cod: 'الدفع عند الاستلام',
  card: 'بطاقة ائتمان',
  coupon: 'كود الخصم',
  haveCoupon: 'لديك كود خصم؟',
  couponPlaceholder: 'أدخل الكود',
  apply: 'تطبيق',
  remove: 'إزالة',
  discount: 'الخصم',
  subtotal: 'المجموع الفرعي',
  shipping: 'الشحن',
  total: 'الإجمالي',
  placeOrder: 'تأكيد الطلب',
  mobileOrderSummary: 'ملخص الطلب',
  hideItems: 'إخفاء المنتجات',
  showItems: 'عرض المنتجات',
  trustFreeShipping: `شحن مجاني فوق ${FREE_SHIPPING_THRESHOLD.toLocaleString('ar-EG')} ج.م`,
  trustWarranty: 'ضمان ويلسون الأصلي 5 سنوات',
  trustDelivery: 'توصيل سريع داخل مصر',
  questionsWhatsApp: 'أسئلة؟ واتساب',
  soon: 'قريباً',
  default: 'افتراضي',
  cancel: 'إلغاء',
  save: 'حفظ',
}

const en: CheckoutCopy = {
  title: 'Checkout',
  subtitle: 'A fast and secure checkout in a few steps',
  stepCart: 'Cart',
  stepAddress: 'Address',
  stepPayment: 'Payment',
  address: 'Delivery Address',
  addAddress: 'Add Address',
  chooseGovernorate: 'Choose governorate',
  governorate: 'Governorate',
  district: 'District',
  details: 'Full Address',
  noSavedAddress: 'No saved address yet. Add a new address to continue.',
  payment: 'Payment Method',
  cod: 'Cash on Delivery',
  card: 'Credit Card',
  coupon: 'Coupon Code',
  haveCoupon: 'Have a coupon?',
  couponPlaceholder: 'Enter code',
  apply: 'Apply',
  remove: 'Remove',
  discount: 'Discount',
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  total: 'Total',
  placeOrder: 'Place Order',
  mobileOrderSummary: 'Order Summary',
  hideItems: 'Hide items',
  showItems: 'Show items',
  trustFreeShipping: `Free shipping over ${FREE_SHIPPING_THRESHOLD.toLocaleString()} EGP`,
  trustWarranty: 'Original Wilson 5-year warranty',
  trustDelivery: 'Fast delivery across Egypt',
  questionsWhatsApp: 'Questions? WhatsApp',
  soon: 'Soon',
  default: 'Default',
  cancel: 'Cancel',
  save: 'Save',
}

export function getCheckoutCopy(lang: 'ar' | 'en'): CheckoutCopy {
  return lang === 'ar' ? ar : en
}
