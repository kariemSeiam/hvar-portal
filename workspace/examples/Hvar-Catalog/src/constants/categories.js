/**
 * Product categories for Hvar appliances
 */
export const PRODUCT_CATEGORIES = [
  {
    slug: 'all',
    name_ar: 'الكل',
    description_ar: 'جميع المنتجات'
  },
  {
    slug: 'hand_blender',
    name_ar: 'هاند بلندر',
    description_ar: 'خلاطات يدوية قوية ومتعددة الاستخدامات'
  },
  {
    slug: 'blender_juicer',
    name_ar: 'خلاط وعصارة',
    description_ar: 'خلاطات وعصارات احترافية'
  },
  {
    slug: 'chopper',
    name_ar: 'كبه',
    description_ar: 'كبات كهربائية للفرم والتقطيع'
  },
  {
    slug: 'iron',
    name_ar: 'مكواه',
    description_ar: 'مكاوي كهربائية عالية الجودة'
  },
  {
    slug: 'vacuum',
    name_ar: 'مكنسة كهربائية',
    description_ar: 'مكنسات كهربائية قوية وفعالة'
  },
  {
    slug: 'air_fryer',
    name_ar: 'قلاية كهربائية',
    description_ar: 'قلايات هوائية صحية'
  },
  {
    slug: 'stand_mixer',
    name_ar: 'عجان',
    description_ar: 'عجانات كهربائية احترافية'
  },
  {
    slug: 'oven',
    name_ar: 'فرن',
    description_ar: 'أفران كهربائية متعددة الوظائف'
  },
  {
    slug: 'grinder',
    name_ar: 'مطحنة',
    description_ar: 'مطاحن كهربائية للقهوة والتوابل'
  }
];

/**
 * Get category by slug
 * @param {string} slug - Category slug
 * @returns {Object|null} Category object or null
 */
export const getCategoryBySlug = (slug) => {
  return PRODUCT_CATEGORIES.find(category => category.slug === slug) || null;
};

/**
 * Get category name in Arabic
 * @param {string} slug - Category slug
 * @returns {string} Category name in Arabic
 */
export const getCategoryName = (slug) => {
  const category = getCategoryBySlug(slug);
  return category ? category.name_ar : 'غير محدد';
};
