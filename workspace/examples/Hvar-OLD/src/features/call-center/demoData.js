const formatDate = (date) => date.toISOString().split('T')[0];

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addHours = (date, hours) => {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
};

const today = new Date();
const todayKey = formatDate(today);
const tomorrowKey = formatDate(addDays(today, 1));
const afterTomorrowKey = formatDate(addDays(today, 2));
const yesterdayKey = formatDate(addDays(today, -1));

export const demoAgents = [
  { id: 1, name: 'أحمد محمد', color: 'bg-brand-red-500' },
  { id: 2, name: 'سارة أحمد', color: 'bg-brand-blue-500' },
  { id: 3, name: 'محمد علي', color: 'bg-amber-500' },
  { id: 4, name: 'نور الدين', color: 'bg-green-500' }
];

export const demoCustomers = [
  {
    id: 101,
    name: 'سناء السيد معروف احمد',
    phone: '01096627148',
    phoneSecondary: '01123456789',
    governorate: 'الشرقية',
    city: 'فاقوس',
    address: 'محافظه الشرقيه فاقوس قريه البيروم بجوار جامع الحساينه ومكتب البريد',
    ordersHistory: [
      { tracking: 'BOS-11321', status: 'delivered', cod: 2450, date: '2025-11-20' },
      { tracking: 'BOS-11883', status: 'returned', cod: 1980, date: '2025-10-02' }
    ],
    servicesHistory: [
      { ticket: 'HVR-2025-0011', type: 'maintenance', status: 'completed', date: '2025-08-14' }
    ]
  },
  {
    id: 102,
    name: 'ام حمزه',
    phone: '01002170594',
    phoneSecondary: '',
    governorate: 'الفيوم',
    city: 'الفيوم',
    address: 'محافظه الفيوم المسله الإصلاح الزراعي عند كشري الاسكندراني',
    ordersHistory: [{ tracking: 'BOS-9981', status: 'delivered', cod: 3800, date: '2025-12-01' }],
    servicesHistory: []
  },
  {
    id: 103,
    name: 'ليلى محمود',
    phone: '01011223344',
    phoneSecondary: '01233445566',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    address: 'شارع مصطفى النحاس، مدينة نصر',
    ordersHistory: [{ tracking: 'BOS-20212', status: 'delivered', cod: 3120, date: '2025-09-18' }],
    servicesHistory: [
      { ticket: 'HVR-2025-0098', type: 'replacement', status: 'completed', date: '2025-07-09' }
    ]
  },
  {
    id: 104,
    name: 'حسن عبدالله',
    phone: '01055667788',
    phoneSecondary: '',
    governorate: 'الإسكندرية',
    city: 'العجمي',
    address: 'شارع المستشار بدوى رياض ابو يوسف العجمى، الإسكندرية',
    ordersHistory: [],
    servicesHistory: [
      { ticket: 'HVR-2025-0113', type: 'return', status: 'pending', date: '2025-12-29' }
    ]
  }
];

export const demoOrders = [
  {
    id: 5001,
    orderNumber: 'DR2025/26920',
    draftDate: '2025-12-30 16:55:00',
    queueDate: todayKey,
    customerId: 101,
    status: 'new',
    attemptCount: 0,
    nextActionAt: formatDate(addHours(today, -2)),
    amount: 2450,
    itemsCount: 1,
    description: '1 * خلاط هفار 8000 وات 7*1 (5069)',
    branch: 'مخزن اون لاين',
    user: 'حسين مصطفى',
    salesRep: '',
    whatsapp: true,
    items: [
      { name: 'خلاط هفار 8000 وات 7*1', sku: '5069', quantity: 1, price: 2450 }
    ],
    callHistory: []
  },
  {
    id: 5002,
    orderNumber: 'DR2025/26699',
    draftDate: '2025-12-30 09:20:00',
    queueDate: todayKey,
    customerId: 102,
    status: 'new',
    attemptCount: 1,
    nextActionAt: formatDate(addHours(today, -1)),
    amount: 3800,
    itemsCount: 2,
    description: '1 * خلاط هفار 8000 وات 7*1 (5069)\n1 * كبه هفار 1000 وات تربو أبيض (5027)',
    branch: 'مخزن اون لاين',
    user: 'محمود سليم',
    salesRep: '',
    whatsapp: false,
    items: [
      { name: 'خلاط هفار 8000 وات 7*1', sku: '5069', quantity: 1, price: 2450 },
      { name: 'كبه هفار 1000 وات تربو أبيض', sku: '5027', quantity: 1, price: 1350 }
    ],
    callHistory: [
      {
        id: 1,
        status: 'no_answer',
        agentId: 1,
        agentName: 'أحمد محمد',
        timestamp: '2026-01-17 09:35'
      }
    ]
  },
  {
    id: 5003,
    orderNumber: 'DR2025/26474',
    draftDate: '2025-12-29 20:10:00',
    queueDate: todayKey,
    customerId: 104,
    status: 'scheduled',
    attemptCount: 2,
    nextActionAt: formatDate(addHours(today, 3)),
    scheduledDate: `${todayKey} 15:30`,
    amount: 1980,
    itemsCount: 1,
    description: '1 * كبه هفار 1000 وات تربو أبيض (5027)',
    branch: 'مخزن اون لاين',
    user: 'سمر عادل',
    salesRep: '',
    whatsapp: true,
    items: [
      { name: 'كبه هفار 1000 وات تربو أبيض', sku: '5027', quantity: 1, price: 1980 }
    ],
    callHistory: [
      {
        id: 1,
        status: 'no_answer',
        agentId: 2,
        agentName: 'سارة أحمد',
        timestamp: '2026-01-17 10:10'
      },
      {
        id: 2,
        status: 'scheduled',
        agentId: 2,
        agentName: 'سارة أحمد',
        timestamp: '2026-01-17 11:20'
      }
    ]
  },
  {
    id: 5004,
    orderNumber: 'DR2025/27001',
    draftDate: '2025-12-31 13:45:00',
    queueDate: tomorrowKey,
    customerId: 103,
    status: 'scheduled',
    attemptCount: 0,
    nextActionAt: `${tomorrowKey} 10:00`,
    scheduledDate: `${tomorrowKey} 10:00`,
    amount: 3120,
    itemsCount: 1,
    description: '1 * محضر طعام هفار برو (5099)',
    branch: 'فرع مدينة نصر',
    user: 'نادر رامي',
    salesRep: '',
    whatsapp: true,
    items: [
      { name: 'محضر طعام هفار برو', sku: '5099', quantity: 1, price: 3120 }
    ],
    callHistory: []
  },
  {
    id: 5005,
    orderNumber: 'DR2025/26811',
    draftDate: '2025-12-28 18:05:00',
    queueDate: todayKey,
    customerId: 101,
    status: 'confirmed',
    attemptCount: 1,
    nextActionAt: formatDate(addHours(today, -4)),
    confirmedDeliveryDate: todayKey,
    amount: 2550,
    itemsCount: 1,
    description: '1 * خلاط هفار 9000 وات 10*1 (5072)',
    branch: 'مخزن اون لاين',
    user: 'حسين مصطفى',
    salesRep: '',
    whatsapp: true,
    items: [
      { name: 'خلاط هفار 9000 وات 10*1', sku: '5072', quantity: 1, price: 2550 }
    ],
    callHistory: [
      {
        id: 1,
        status: 'confirmed',
        agentId: 3,
        agentName: 'محمد علي',
        timestamp: '2026-01-17 12:40'
      }
    ]
  },
  {
    id: 5006,
    orderNumber: 'DR2025/26790',
    draftDate: '2025-12-28 11:30:00',
    queueDate: afterTomorrowKey,
    customerId: 102,
    status: 'new',
    attemptCount: 3,
    nextActionAt: `${afterTomorrowKey} 09:00`,
    amount: 1490,
    itemsCount: 1,
    description: '1 * غلاية هفار ستيل (5101)',
    branch: 'فرع الفيوم',
    user: 'محمود سليم',
    salesRep: '',
    whatsapp: false,
    items: [
      { name: 'غلاية هفار ستيل', sku: '5101', quantity: 1, price: 1490 }
    ],
    callHistory: [
      { id: 1, status: 'no_answer', agentId: 4, agentName: 'نور الدين', timestamp: '2026-01-16 10:00' },
      { id: 2, status: 'no_answer', agentId: 4, agentName: 'نور الدين', timestamp: '2026-01-16 14:30' },
      { id: 3, status: 'no_answer', agentId: 4, agentName: 'نور الدين', timestamp: '2026-01-16 19:10' }
    ]
  },
  {
    id: 5007,
    orderNumber: 'DR2025/26988',
    draftDate: '2025-12-30 14:10:00',
    queueDate: todayKey,
    customerId: 104,
    status: 'canceled',
    attemptCount: 1,
    nextActionAt: formatDate(addHours(today, -6)),
    amount: 1890,
    itemsCount: 1,
    description: '1 * خلاط هفار 7000 وات 5*1 (5055)',
    branch: 'فرع الإسكندرية',
    user: 'سمر عادل',
    salesRep: '',
    whatsapp: true,
    cancellationReason: 'رفض السعر',
    items: [
      { name: 'خلاط هفار 7000 وات 5*1', sku: '5055', quantity: 1, price: 1890 }
    ],
    callHistory: [
      {
        id: 1,
        status: 'canceled',
        agentId: 2,
        agentName: 'سارة أحمد',
        timestamp: '2026-01-17 11:55'
      }
    ]
  },
  {
    id: 5008,
    orderNumber: 'DR2025/26844',
    draftDate: '2025-12-29 08:30:00',
    queueDate: yesterdayKey,
    customerId: 103,
    status: 'completed',
    attemptCount: 1,
    nextActionAt: formatDate(addHours(today, -24)),
    amount: 2990,
    itemsCount: 1,
    description: '1 * خلاط هفار برو (5088)',
    branch: 'فرع مدينة نصر',
    user: 'نادر رامي',
    salesRep: '',
    whatsapp: true,
    items: [
      { name: 'خلاط هفار برو', sku: '5088', quantity: 1, price: 2990 }
    ],
    callHistory: [
      {
        id: 1,
        status: 'confirmed',
        agentId: 1,
        agentName: 'أحمد محمد',
        timestamp: '2026-01-16 16:20'
      }
    ]
  }
];

export const demoDateChips = Array.from({ length: 7 }).map((_, index) => {
  const date = addDays(today, index);
  return {
    dateKey: formatDate(date),
    label: index === 0 ? 'اليوم' : date.toLocaleDateString('ar-EG', { weekday: 'short' }),
    dateLabel: date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
  };
});

export const callCenterSeed = {
  agents: demoAgents,
  customers: demoCustomers,
  orders: demoOrders,
  dateChips: demoDateChips
};
