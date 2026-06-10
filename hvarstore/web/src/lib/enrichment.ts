// Static product enrichment — pure data, no imports, no side effects.
// All display strings use Arabic-Indic numerals: ٠١٢٣٤٥٦٧٨٩
// This file is the authoritative source for specs, claims, accessories, chef endorsements,
// FAQs, and color variants. Pricing and stock always come from the API — never from here.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccessoryItem {
  nameAr: string;
  spec?: string; // "٦٠٠ مل", "٤ شفرات"
}

export interface ChefEndorsement {
  name: string;
  quote: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ColorVariant {
  sku: string;     // actual product SKU
  nameAr: string;  // "روز", "أسود نيو", "موف", "ليموني", "أحمر"
  hex: string;     // CSS hex color
}

export interface ProductEnrichment {
  nickname?: string;             // "البلدوزر", "النينجا", "المدفع"
  wattage?: number;              // numeric: 2000 (no unit)
  wattageDisplay?: string;       // "٢٠٠٠ وات" (Arabic-Indic numerals)
  keyClaim?: string;             // "أقوى كبة في مصر بشهادة كل شيفات مصر"
  capacity?: string;             // "٦.٥ لتر"
  speeds?: number;
  accessories?: AccessoryItem[];
  motorMaterial?: string;        // "نحاس"
  warrantyMonths: number;
  bowlWarrantyYears?: number;    // 20 for البلدوزر
  chefs?: ChefEndorsement[];
  keyFeatures?: string[];
  faq?: FaqItem[];
  colorVariants?: ColorVariant[]; // full family list — present on ALL members of the 5070 family
  comparisonGroup?: string;       // "chopper" | "blender" | "hand_blender" | "air_fryer"
  compareLabel?: string;          // "للكميات الكبيرة", "للأسرة الصغيرة"
}

// ─── Color variant arrays ─────────────────────────────────────────────────────

// Shared across all 5070-family SKUs — same motor, same bowl, different shell color.
const KEBA_2000_COLORS: ColorVariant[] = [
  { sku: "5070",    nameAr: "أسود نيو", hex: "#1C1C1C" },
  { sku: "5070+1",  nameAr: "روز",      hex: "#E8B4C8" },
  { sku: "5070+3",  nameAr: "ليموني",   hex: "#D4E06A" },
  { sku: "5070+4",  nameAr: "موف",      hex: "#9B8FA8" },
  { sku: "5070+5",  nameAr: "أحمر",     hex: "#CC3333" },
  { sku: "5070+b",  nameAr: "أسود B",   hex: "#2A2A2A" },
  { sku: "5070+C",  nameAr: "C",        hex: "#5A5A5A" },
  { sku: "5070+04", nameAr: "٤ سرعات",  hex: "#1C1C1C" },
];

// ─── Shared spec blocks ───────────────────────────────────────────────────────

// Base specs shared across every 5070-family variant (except where overridden below).
const KEBA_2000_BASE: Omit<ProductEnrichment, "warrantyMonths"> & { warrantyMonths: number } = {
  nickname: "البلدوزر",
  wattage: 2000,
  wattageDisplay: "٢٠٠٠ وات",
  keyClaim: "أقوى كبة في مصر بشهادة كل شيفات مصر",
  capacity: "٦.٥ لتر",
  speeds: 2,
  motorMaterial: "نحاس",
  warrantyMonths: 24,
  bowlWarrantyYears: 20,
  colorVariants: KEBA_2000_COLORS,
  comparisonGroup: "chopper",
  compareLabel: "للكميات الكبيرة",
  accessories: [
    { nameAr: "سلاح فرم", spec: "٤ شفرات استانلس" },
    { nameAr: "جوان تثبيت" },
    { nameAr: "سباتولا", spec: "بلاستيك" },
    { nameAr: "مريلة مطبخ" },
  ],
  chefs: [
    {
      name: "شيف سهير جاد",
      quote: "البلدوزر دي هي اللي شيلتها معايا في مطبخي من يوم ما اشتريتها",
    },
  ],
  keyFeatures: [
    "وعاء ٦.٥ لتر ضد الكسر بضمان ٢٠ سنة",
    "ماتور نحاس ٢٠٠٠ وات",
    "سلاح ٤ شفرات استانلس",
    "سباتولا ومريلة مطبخ هدية",
  ],
  faq: [
    {
      q: "هل تنفع لفرم اللحمة النيئة؟",
      a: "آه — ٢٠٠٠ وات تفرم اللحمة النيئة والكبة بكل سهولة",
    },
    {
      q: "إيه الفرق بين البلدوزر والنينجا؟",
      a: "النينجا ٣ لتر ٨٠٠ وات للأسرة الصغيرة. البلدوزر ٦.٥ لتر ٢٠٠٠ وات للكميات الكبيرة والعائلة الكبيرة",
    },
    {
      q: "هل الوعاء بيتكسر؟",
      a: "الوعاء مصنوع من البلاستيك الصعب ضد الكسر بضمان ٢٠ سنة — الأقوى في السوق",
    },
  ],
};

// ─── SKU enrichment table ─────────────────────────────────────────────────────

const SKU_ENRICHMENT: Record<string, ProductEnrichment> = {
  // ── 5070 family (البلدوزر) ──────────────────────────────────────────────────
  "5070":    { ...KEBA_2000_BASE },
  "5070+1":  { ...KEBA_2000_BASE },
  "5070+3":  { ...KEBA_2000_BASE },
  "5070+4":  { ...KEBA_2000_BASE },
  "5070+5":  { ...KEBA_2000_BASE },
  "5070+b":  { ...KEBA_2000_BASE },
  "5070+C":  { ...KEBA_2000_BASE },

  // 4-speed variant — same base, overridden speed count and label
  "5070+04": {
    ...KEBA_2000_BASE,
    speeds: 4,
    compareLabel: "٤ سرعات",
  },

  // Premium 6-blade — upgraded accessory set
  "5070 PREMIUM": {
    nickname: "PREMIUM ٦ سلاح",
    wattage: 2000,
    wattageDisplay: "٢٠٠٠ وات",
    capacity: "٦.٥ لتر",
    warrantyMonths: 24,
    bowlWarrantyYears: 20,
    colorVariants: KEBA_2000_COLORS,
    comparisonGroup: "chopper",
    compareLabel: "للكميات الكبيرة",
    accessories: [
      { nameAr: "سلاح فرم", spec: "٦ شفرات استانلس" },
      { nameAr: "جوان تثبيت" },
      { nameAr: "سباتولا", spec: "بلاستيك" },
      { nameAr: "مريلة مطبخ" },
    ],
    keyFeatures: [
      "وعاء ٦.٥ لتر ضد الكسر بضمان ٢٠ سنة",
      "ماتور نحاس ٢٠٠٠ وات",
      "سلاح ٦ شفرات استانلس",
      "سباتولا ومريلة مطبخ هدية",
    ],
    keyClaim: "أقوى كبة في مصر بشهادة كل شيفات مصر",
    motorMaterial: "نحاس",
    faq: KEBA_2000_BASE.faq,
    chefs: KEBA_2000_BASE.chefs,
  },

  // ── 5073 family (3-speed) ───────────────────────────────────────────────────
  "5073": {
    wattage: 2000,
    wattageDisplay: "٢٠٠٠ وات",
    capacity: "٦.٥ لتر",
    speeds: 3,
    warrantyMonths: 24,
    comparisonGroup: "chopper",
  },
  "5073+1": {
    wattage: 2000,
    wattageDisplay: "٢٠٠٠ وات",
    capacity: "٦.٥ لتر",
    speeds: 3,
    warrantyMonths: 24,
    comparisonGroup: "chopper",
  },

  // ── 5029 — كبة النينجا ──────────────────────────────────────────────────────
  "5029": {
    nickname: "النينجا",
    wattage: 800,
    wattageDisplay: "٨٠٠ وات",
    capacity: "٣ لتر",
    speeds: 2,
    motorMaterial: "نحاس",
    warrantyMonths: 24,
    comparisonGroup: "chopper",
    compareLabel: "للأسرة الصغيرة",
    accessories: [
      { nameAr: "سلاح فرم", spec: "٤ شفرات" },
      { nameAr: "خافق بيض" },
      { nameAr: "قشارة ثوم", spec: "سيليكون" },
      { nameAr: "سلاح خفق" },
      { nameAr: "فاصل بيض" },
    ],
    chefs: [
      {
        name: "شيف نهى الفيشاوي",
        quote: "كبة النينجا — ٥ وظائف في جهاز واحد",
      },
    ],
    keyFeatures: [
      "٥ وظائف في جهاز واحد",
      "وعاء ستيل ٣ لتر",
      "ماتور نحاس ٨٠٠ وات تربو",
      "ضمان سنتين",
    ],
    faq: [
      {
        q: "هل تنفع للكميات الكبيرة؟",
        a: "السعة ٣ لتر — مناسبة للأسرة من ٤ إلى ٦ أفراد. للكميات الأكبر، البلدوزر ٦.٥ لتر هو الخيار",
      },
    ],
  },

  // ── 5027 — الكبيرة تربو ────────────────────────────────────────────────────
  "5027": {
    nickname: "الكبيرة",
    wattage: 1000,
    wattageDisplay: "١٠٠٠ وات تربو",
    capacity: "٢.٥ لتر",
    motorMaterial: "نحاس",
    warrantyMonths: 24,
    comparisonGroup: "chopper",
    compareLabel: "للاستخدام المتوسط",
    accessories: [
      { nameAr: "سلاح فرم", spec: "٦ شفرات استانلس" },
      { nameAr: "قشارة ثوم", spec: "سيليكون طبي" },
      { nameAr: "خافق بيض" },
    ],
    keyFeatures: [
      "ماتور نحاس ١٠٠٠ وات تربو",
      "سلاح ٦ شفرات استانلس",
      "قشارة ثوم سيليكون طبي",
      "ضمان سنتين",
    ],
  },

  // ── 5025 — كبة 1200 وات ────────────────────────────────────────────────────
  "5025": {
    wattage: 1200,
    wattageDisplay: "١٢٠٠ وات",
    capacity: "٢ لتر",
    warrantyMonths: 24,
    comparisonGroup: "chopper",
  },

  // ── 5022 — كبة 1500 وات ────────────────────────────────────────────────────
  "5022": {
    wattage: 1500,
    wattageDisplay: "١٥٠٠ وات",
    capacity: "٢ لتر",
    warrantyMonths: 24,
    comparisonGroup: "chopper",
  },

  // ─── Blenders ────────────────────────────────────────────────────────────────

  // ── 5069 — خلاط 7*1 ────────────────────────────────────────────────────────
  "5069": {
    wattage: 8000,
    wattageDisplay: "٨٠٠٠ وات",
    capacity: "٧×١",
    keyClaim: "أقوى خلاط في فئته",
    warrantyMonths: 24,
    comparisonGroup: "blender",
    compareLabel: "المجموعة الكاملة",
    accessories: [
      { nameAr: "وعاء خلاط" },
      { nameAr: "كبة" },
      { nameAr: "عصارة برتقال" },
      { nameAr: "مبشرة خضار" },
      { nameAr: "قطاعة خضار" },
      { nameAr: "مضرب بيض" },
      { nameAr: "مطحنة" },
    ],
    keyFeatures: [
      "٨٠٠٠ وات",
      "٧ ملحقات في جهاز واحد",
      "ضمان سنتين",
    ],
  },

  // ── 5062 — خلاط 2*1 ────────────────────────────────────────────────────────
  "5062": {
    wattage: 8000,
    wattageDisplay: "٨٠٠٠ وات",
    capacity: "٢×١",
    warrantyMonths: 24,
    comparisonGroup: "blender",
    compareLabel: "للخلط الأساسي",
  },

  // ── 5060 — خلاط 2*1 (variant) ──────────────────────────────────────────────
  "5060": {
    wattage: 8000,
    wattageDisplay: "٨٠٠٠ وات",
    capacity: "٢×١",
    warrantyMonths: 24,
  },

  // ── 5066 — خلاط 3*1 ────────────────────────────────────────────────────────
  "5066": {
    wattage: 8000,
    wattageDisplay: "٨٠٠٠ وات",
    capacity: "٣×١",
    warrantyMonths: 24,
    comparisonGroup: "blender",
    compareLabel: "مع ملحقات إضافية",
  },

  // ─── Hand Blenders ────────────────────────────────────────────────────────────

  // ── 5057 — هاند بلندر 4*1 1500 وات ────────────────────────────────────────
  "5057": {
    wattage: 1500,
    wattageDisplay: "١٥٠٠ وات",
    capacity: "٤×١",
    motorMaterial: "نحاس",
    warrantyMonths: 24,
    comparisonGroup: "hand_blender",
    accessories: [
      { nameAr: "كبة", spec: "٦٠٠ مل، ٤ شفرات" },
      { nameAr: "سكينة هراسة", spec: "٤ شفرات" },
      { nameAr: "وعاء مدرج", spec: "٨٠٠ مل" },
      { nameAr: "مضرب بيض" },
    ],
    chefs: [
      {
        name: "شيف ساره صقر",
        quote: "هاند بلندر ٤×١ — الأقوى والأجمد في المطبخ المحترف",
      },
    ],
    keyFeatures: [
      "ماتور نحاس ١٥٠٠ وات",
      "١٥ سرعة + تربو",
      "تروس معدن",
      "ضمان سنتين",
    ],
  },

  // ── 5053 — هاند بلندر 3*1 ──────────────────────────────────────────────────
  "5053": {
    wattage: 1500,
    wattageDisplay: "١٥٠٠ وات",
    capacity: "٣×١",
    warrantyMonths: 24,
    comparisonGroup: "hand_blender",
  },

  // ── 5052 — هاند بلندر 2*1 ──────────────────────────────────────────────────
  "5052": {
    wattage: 1500,
    wattageDisplay: "١٥٠٠ وات",
    capacity: "٢×١",
    warrantyMonths: 24,
    comparisonGroup: "hand_blender",
  },

  // ─── Stand Mixers ─────────────────────────────────────────────────────────────

  // ── 10011 — العجان المدفع 11 لتر ────────────────────────────────────────────
  "10011": {
    nickname: "المدفع",
    wattage: 2200,
    wattageDisplay: "٢٢٠٠ وات",
    capacity: "١١ لتر",
    keyClaim: "أقوى عجان في مصر",
    motorMaterial: "نحاس",
    warrantyMonths: 12,
    accessories: [
      { nameAr: "ذراع عجن" },
      { nameAr: "ذراع خفق" },
      { nameAr: "ذراع شبك" },
    ],
    chefs: [
      {
        name: "شيف ميادة محمد",
        quote: "أقوى عجان في مصر بأعلى خامات في السوق",
      },
      {
        name: "شيف بسمة",
        quote: "",
      },
    ],
    keyFeatures: [
      "ماتور نحاس ٢٢٠٠ وات",
      "٦ سرعات + تربو",
      "تروس معدن",
      "قواعد تثبيت",
      "قطع غيار متاحة",
    ],
  },

  // ── 10007 — العجان 7 لتر ───────────────────────────────────────────────────
  "10007": {
    capacity: "٧ لتر",
    warrantyMonths: 12,
    chefs: [
      {
        name: "شيف ميادة محمد",
        quote: "",
      },
    ],
  },

  // ─── Hand Beaters ─────────────────────────────────────────────────────────────

  // ── 1101 — مضرب 500 وات (standalone) ──────────────────────────────────────
  "1101": {
    wattage: 500,
    wattageDisplay: "٥٠٠ وات",
    motorMaterial: "نحاس",
    warrantyMonths: 12,
    accessories: [
      { nameAr: "مضرب خفق", spec: "قطعتين" },
      { nameAr: "مضرب كيك", spec: "قطعتين" },
    ],
  },

  // ── 1104 — مضرب 500 وات + حلة ─────────────────────────────────────────────
  "1104": {
    wattage: 500,
    wattageDisplay: "٥٠٠ وات",
    capacity: "٤ لتر استيل",
    motorMaterial: "نحاس",
    warrantyMonths: 12,
    accessories: [
      { nameAr: "مضرب خفق", spec: "قطعتين" },
      { nameAr: "مضرب كيك", spec: "قطعتين" },
      { nameAr: "حلة استيل", spec: "٤ لتر" },
    ],
    keyFeatures: [
      "ماتور نحاس ٥٠٠ وات",
      "٥ سرعات + تربو",
      "حلة استيل ٤ لتر مشمولة",
    ],
  },

  // ─── Air Fryers ───────────────────────────────────────────────────────────────

  // ── 5016 — قلاية 6.5 لتر ──────────────────────────────────────────────────
  "5016": {
    capacity: "٦.٥ لتر",
    warrantyMonths: 12,
    comparisonGroup: "air_fryer",
    compareLabel: "للأسرة المتوسطة",
  },

  // ── 5019 — قلاية الجامبو 9 لتر ────────────────────────────────────────────
  "5019": {
    wattage: 2400,
    wattageDisplay: "٢٤٠٠ وات",
    capacity: "٩ لتر",
    keyClaim: "جامبو دبل هيتر ٩ لتر",
    warrantyMonths: 12,
    comparisonGroup: "air_fryer",
    compareLabel: "للأسرة الكبيرة",
    accessories: [
      { nameAr: "سلة مطلية", spec: "غير قابلة للالتصاق" },
      { nameAr: "رف معدني" },
    ],
    chefs: [
      {
        name: "شيف ياسمين صالح",
        quote: "ايرفراير هفار — صحتك وصحة أسرتك رقم ١",
      },
      {
        name: "شيف عزة",
        quote: "",
      },
    ],
    keyFeatures: [
      "دبل هيتر علوي وسفلي",
      "١٢ برنامج تشغيل",
      "شاشة لمس LED",
      "زيت أقل ٩٠%",
    ],
  },

  // ─── Irons ────────────────────────────────────────────────────────────────────

  // ── 1115 — مكواه 2800 وات ─────────────────────────────────────────────────
  "1115": {
    wattage: 2800,
    wattageDisplay: "٢٨٠٠ وات",
    warrantyMonths: 12,
    keyFeatures: [
      "قاعدة سيراميك غير قابلة للالتصاق",
      "خزان ٤٥٠ مل",
      "مانع تنقيط البخار",
      "سلك ٣٦٠ درجة",
    ],
  },

  // ── 1117 — مكواه 3200 وات ─────────────────────────────────────────────────
  "1117": {
    wattage: 3200,
    wattageDisplay: "٣٢٠٠ وات",
    warrantyMonths: 12,
  },

  // ─── Vacuum ───────────────────────────────────────────────────────────────────

  // ── 7720 — مكنسة 2000 وات تربو ────────────────────────────────────────────
  "7720": {
    wattage: 2000,
    wattageDisplay: "٢٠٠٠ وات",
    warrantyMonths: 24,
    keyFeatures: [
      "٢٠٠٠ وات تربو",
      "ملحقات كاملة مشمولة",
      "ضمان سنتين",
    ],
  },

  // ─── Oven ─────────────────────────────────────────────────────────────────────

  // ── 10046 — فرن 46 لتر ────────────────────────────────────────────────────
  "10046": {
    wattage: 2200,
    wattageDisplay: "٢٢٠٠ وات",
    capacity: "٤٦ لتر",
    warrantyMonths: 12,
  },
};

// ─── Comparison groups ─────────────────────────────────────────────────────────

export const COMPARISON_GROUPS: Record<
  string,
  {
    groupTitle: string;
    products: Array<{
      sku: string;
      nameAr: string;
      wattage?: number;
      capacity?: string;
      useCase: string;
    }>;
  }
> = {
  chopper: {
    groupTitle: "مش الحجم المناسب؟",
    products: [
      {
        sku: "5029",
        nameAr: "كبة النينجا",
        wattage: 800,
        capacity: "٣ لتر",
        useCase: "للأسرة الصغيرة",
      },
      {
        sku: "5027",
        nameAr: "الكبيرة تربو",
        wattage: 1000,
        capacity: "٢.٥ لتر",
        useCase: "للاستخدام المتوسط",
      },
      {
        sku: "5070",
        nameAr: "البلدوزر",
        wattage: 2000,
        capacity: "٦.٥ لتر",
        useCase: "للكميات الكبيرة",
      },
    ],
  },
  blender: {
    groupTitle: "اختار الحجم المناسب",
    products: [
      {
        sku: "5062",
        nameAr: "خلاط ٢×١",
        wattage: 8000,
        capacity: "٢×١",
        useCase: "للخلط الأساسي",
      },
      {
        sku: "5066",
        nameAr: "خلاط ٣×١",
        wattage: 8000,
        capacity: "٣×١",
        useCase: "مع ملحقات إضافية",
      },
      {
        sku: "5069",
        nameAr: "خلاط ٧×١",
        wattage: 8000,
        capacity: "٧×١",
        useCase: "المجموعة الكاملة",
      },
    ],
  },
  hand_blender: {
    groupTitle: "اختار مجموعة الملحقات",
    products: [
      {
        sku: "5052",
        nameAr: "هاند بلندر ٢×١",
        capacity: "٢×١",
        useCase: "الاستخدام الأساسي",
      },
      {
        sku: "5053",
        nameAr: "هاند بلندر ٣×١",
        capacity: "٣×١",
        useCase: "مع ملحقات إضافية",
      },
      {
        sku: "5057",
        nameAr: "هاند بلندر ٤×١",
        capacity: "٤×١",
        useCase: "الأكثر تكاملاً",
      },
    ],
  },
  air_fryer: {
    groupTitle: "اختار الحجم المناسب",
    products: [
      {
        sku: "5016",
        nameAr: "قلاية ٦.٥ لتر",
        capacity: "٦.٥ لتر",
        useCase: "للأسرة المتوسطة",
      },
      {
        sku: "5019",
        nameAr: "قلاية ٩ لتر جامبو",
        wattage: 2400,
        capacity: "٩ لتر",
        useCase: "للأسرة الكبيرة",
      },
    ],
  },
};

// ─── Exported functions ───────────────────────────────────────────────────────

export function getEnrichment(sku: string): ProductEnrichment | null {
  return SKU_ENRICHMENT[sku] ?? null;
}

export function getWarrantyText(sku: string): string {
  const e = getEnrichment(sku);
  const months = e?.warrantyMonths ?? 12;
  if (months === 24) return "ضمان ٢٤ شهر";
  if (months === 12) return "ضمان ١٢ شهر";
  return `ضمان ${months} شهر`;
}

export function getInstallmentText(price: number): string | null {
  if (price < 1000) return null;
  const monthly = Math.round(price / 12);
  return `أو ~ ${monthly.toLocaleString("ar-EG")} ج.م/شهر مع فاليو · سوهولا · أمان`;
}

// Fuzzy match on color name substring — used when the product API returns a color
// name that may be abbreviated or combined (e.g. "أسود نيو" → "#1C1C1C").
export function getColorHex(colorNameAr: string): string {
  if (colorNameAr.includes("أسود")) return "#1C1C1C";
  if (colorNameAr.includes("روز"))  return "#E8B4C8";
  if (colorNameAr.includes("بينك")) return "#F4C2C2";
  if (colorNameAr.includes("موف"))  return "#9B8FA8";
  if (colorNameAr.includes("ليموني")) return "#D4E06A";
  if (colorNameAr.includes("أحمر")) return "#CC3333";
  if (colorNameAr.includes("لبني")) return "#F5EDD8";
  if (colorNameAr.includes("أبيض")) return "#F5F5F0";
  if (colorNameAr.includes("شفاف")) return "#D4E8F0";
  return "#8A8A8A";
}

const COLOR_WORDS = [
  "أسود", "روز", "بينك", "موف", "ليموني",
  "أحمر", "لبني", "أبيض", "شفاف", "نيو",
] as const;

// Returns true when a variation name contains a known color word —
// used to decide whether to render a color swatch vs. a text selector.
export function isColorVariant(variationName: string): boolean {
  return COLOR_WORDS.some((word) => variationName.includes(word));
}
