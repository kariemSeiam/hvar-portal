/**
 * Filter Configuration for HubPage
 * 
 * Defines filters available for each tab and sub-tab combination
 * Uses lucide-react icons for modern UI
 */

import {
    Search, Calendar, MapPin, DollarSign, Clock, Truck, 
    Package, AlertCircle, Star, User, Hash
} from 'lucide-react';
import { EGYPTIAN_GOVERNORATE_OPTIONS } from '../utils/core/governorates';

/**
 * Priority options
 */
const priorityOptions = [
    { value: 'normal', label: 'عادي' },
    { value: 'high', label: 'عالي' },
    { value: 'urgent', label: 'عاجل' }
];

/**
 * Governorate options - Using centralized complete list of all 27 governorates
 */
const governorateOptions = EGYPTIAN_GOVERNORATE_OPTIONS;

/**
 * Customer type options
 */
const customerTypeOptions = [
    { value: 'customer', label: 'عميل' },
    { value: 'merchant', label: 'تاجر' }
];

/**
 * Filter configuration by tab and sub-tab
 */
export const filterConfig = {
    replacement: {
        'in-preparation': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإنشاء',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'createdDate',
                        type: 'dateRange',
                        label: 'تاريخ الإنشاء'
                    }
                ]
            },
            {
                id: 'priority',
                label: 'الأولوية',
                description: 'فلترة حسب مستوى الأولوية',
                icon: Star,
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                filters: [
                    {
                        id: 'priority',
                        type: 'multiSelect',
                        label: 'مستوى الأولوية',
                        options: priorityOptions
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            },
            {
                id: 'cost',
                label: 'التكلفة',
                description: 'فلترة حسب تعديل التكلفة',
                icon: DollarSign,
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                filters: [
                    {
                        id: 'costAdjustment',
                        type: 'numberRange',
                        label: 'نطاق تعديل التكلفة'
                    }
                ]
            }
        ],
        'preparing': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ بدء التحضير',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'startedDate',
                        type: 'dateRange',
                        label: 'تاريخ بدء التحضير'
                    }
                ]
            },
            {
                id: 'priority',
                label: 'الأولوية',
                description: 'فلترة حسب مستوى الأولوية',
                icon: Star,
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                filters: [
                    {
                        id: 'priority',
                        type: 'multiSelect',
                        label: 'مستوى الأولوية',
                        options: priorityOptions
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'ready-to-ship': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الاستعداد',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'readyDate',
                        type: 'dateRange',
                        label: 'تاريخ الاستعداد'
                    }
                ]
            },
            {
                id: 'tracking',
                label: 'التتبع',
                description: 'فلترة حسب رقم التتبع',
                icon: Truck,
                iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                filters: [
                    {
                        id: 'trackingNumber',
                        type: 'search',
                        label: 'رقم التتبع',
                        placeholder: 'أدخل رقم التتبع...'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            },
            {
                id: 'waiting',
                label: 'مدة الانتظار',
                description: 'فلترة حسب مدة الانتظار',
                icon: Clock,
                iconBg: 'bg-orange-100 dark:bg-orange-900/30',
                iconColor: 'text-orange-600 dark:text-orange-400',
                filters: [
                    {
                        id: 'waitingDays',
                        type: 'numberRange',
                        label: 'عدد الأيام'
                    }
                ]
            }
        ],
        'sent': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإرسال',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'sentDate',
                        type: 'dateRange',
                        label: 'تاريخ الإرسال'
                    }
                ]
            },
            {
                id: 'tracking',
                label: 'التتبع',
                description: 'فلترة حسب رقم التتبع',
                icon: Truck,
                iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                filters: [
                    {
                        id: 'trackingNumber',
                        type: 'search',
                        label: 'رقم التتبع',
                        placeholder: 'أدخل رقم التتبع...'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'validate-returns': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الاسترجاع',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'returnedDate',
                        type: 'dateRange',
                        label: 'تاريخ الاسترجاع'
                    }
                ]
            },
            {
                id: 'tracking',
                label: 'التتبع',
                description: 'فلترة حسب رقم التتبع',
                icon: Truck,
                iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                filters: [
                    {
                        id: 'trackingNumber',
                        type: 'search',
                        label: 'رقم التتبع',
                        placeholder: 'أدخل رقم التتبع...'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'completed': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإكمال',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'completedDate',
                        type: 'dateRange',
                        label: 'تاريخ الإكمال'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            },
            {
                id: 'cost',
                label: 'التكلفة',
                description: 'فلترة حسب إجمالي التكلفة',
                icon: DollarSign,
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                filters: [
                    {
                        id: 'totalCost',
                        type: 'numberRange',
                        label: 'نطاق التكلفة'
                    }
                ]
            }
        ],
        'cancelled': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإلغاء',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'cancelledDate',
                        type: 'dateRange',
                        label: 'تاريخ الإلغاء'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ]
    },
    maintenance: {
        'confirmed': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ التأكيد',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'confirmedDate',
                        type: 'dateRange',
                        label: 'تاريخ التأكيد'
                    }
                ]
            },
            {
                id: 'priority',
                label: 'الأولوية',
                description: 'فلترة حسب مستوى الأولوية',
                icon: Star,
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                filters: [
                    {
                        id: 'priority',
                        type: 'multiSelect',
                        label: 'مستوى الأولوية',
                        options: priorityOptions
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'received': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الاستلام',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'receivedDate',
                        type: 'dateRange',
                        label: 'تاريخ الاستلام'
                    }
                ]
            },
            {
                id: 'priority',
                label: 'الأولوية',
                description: 'فلترة حسب مستوى الأولوية',
                icon: Star,
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                filters: [
                    {
                        id: 'priority',
                        type: 'multiSelect',
                        label: 'مستوى الأولوية',
                        options: priorityOptions
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'under-maintenance': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ بدء الصيانة',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'maintenanceStartDate',
                        type: 'dateRange',
                        label: 'تاريخ بدء الصيانة'
                    }
                ]
            },
            {
                id: 'priority',
                label: 'الأولوية',
                description: 'فلترة حسب مستوى الأولوية',
                icon: Star,
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                filters: [
                    {
                        id: 'priority',
                        type: 'multiSelect',
                        label: 'مستوى الأولوية',
                        options: priorityOptions
                    }
                ]
            },
            {
                id: 'duration',
                label: 'مدة الصيانة',
                description: 'فلترة حسب مدة الصيانة',
                icon: Clock,
                iconBg: 'bg-orange-100 dark:bg-orange-900/30',
                iconColor: 'text-orange-600 dark:text-orange-400',
                filters: [
                    {
                        id: 'maintenanceDays',
                        type: 'numberRange',
                        label: 'عدد الأيام'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'completion-ready': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ اكتمال الصيانة',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'maintenanceCompletedDate',
                        type: 'dateRange',
                        label: 'تاريخ اكتمال الصيانة'
                    }
                ]
            },
            {
                id: 'priority',
                label: 'الأولوية',
                description: 'فلترة حسب مستوى الأولوية',
                icon: Star,
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                filters: [
                    {
                        id: 'priority',
                        type: 'multiSelect',
                        label: 'مستوى الأولوية',
                        options: priorityOptions
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'ready-to-ship': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الاستعداد',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'readyDate',
                        type: 'dateRange',
                        label: 'تاريخ الاستعداد'
                    }
                ]
            },
            {
                id: 'tracking',
                label: 'التتبع',
                description: 'فلترة حسب رقم التتبع',
                icon: Truck,
                iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                filters: [
                    {
                        id: 'trackingNumber',
                        type: 'search',
                        label: 'رقم التتبع',
                        placeholder: 'أدخل رقم التتبع...'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'sent': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإرسال',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'sentDate',
                        type: 'dateRange',
                        label: 'تاريخ الإرسال'
                    }
                ]
            },
            {
                id: 'tracking',
                label: 'التتبع',
                description: 'فلترة حسب رقم التتبع',
                icon: Truck,
                iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                filters: [
                    {
                        id: 'trackingNumber',
                        type: 'search',
                        label: 'رقم التتبع',
                        placeholder: 'أدخل رقم التتبع...'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'completed': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإكمال',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'completedDate',
                        type: 'dateRange',
                        label: 'تاريخ الإكمال'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            },
            {
                id: 'cost',
                label: 'التكلفة',
                description: 'فلترة حسب إجمالي التكلفة',
                icon: DollarSign,
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                filters: [
                    {
                        id: 'totalCost',
                        type: 'numberRange',
                        label: 'نطاق التكلفة'
                    }
                ]
            }
        ],
        'cancelled': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإلغاء',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'cancelledDate',
                        type: 'dateRange',
                        label: 'تاريخ الإلغاء'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ]
    },
    return: {
        'receiving': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ التأكيد',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'confirmedDate',
                        type: 'dateRange',
                        label: 'تاريخ التأكيد'
                    }
                ]
            },
            {
                id: 'priority',
                label: 'الأولوية',
                description: 'فلترة حسب مستوى الأولوية',
                icon: Star,
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                filters: [
                    {
                        id: 'priority',
                        type: 'multiSelect',
                        label: 'مستوى الأولوية',
                        options: priorityOptions
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'inspection': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ بدء الفحص',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'inspectionStartDate',
                        type: 'dateRange',
                        label: 'تاريخ بدء الفحص'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'completed': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإكمال',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'completedDate',
                        type: 'dateRange',
                        label: 'تاريخ الإكمال'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            },
            {
                id: 'cost',
                label: 'قيمة الاسترجاع',
                description: 'فلترة حسب قيمة الاسترجاع',
                icon: DollarSign,
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                filters: [
                    {
                        id: 'returnValue',
                        type: 'numberRange',
                        label: 'نطاق القيمة'
                    }
                ]
            }
        ],
        'cancelled': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإلغاء',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'cancelledDate',
                        type: 'dateRange',
                        label: 'تاريخ الإلغاء'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ]
    },
    sell: {
        'new': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإنشاء',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'createdDate',
                        type: 'dateRange',
                        label: 'تاريخ الإنشاء'
                    }
                ]
            },
            {
                id: 'priority',
                label: 'الأولوية',
                description: 'فلترة حسب مستوى الأولوية',
                icon: Star,
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                filters: [
                    {
                        id: 'priority',
                        type: 'multiSelect',
                        label: 'مستوى الأولوية',
                        options: priorityOptions
                    }
                ]
            },
            {
                id: 'customerType',
                label: 'نوع العميل',
                description: 'فلترة حسب نوع العميل',
                icon: User,
                iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
                iconColor: 'text-cyan-600 dark:text-cyan-400',
                filters: [
                    {
                        id: 'customerType',
                        type: 'multiSelect',
                        label: 'النوع',
                        options: customerTypeOptions
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'preparing': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ بدء التحضير',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'startedDate',
                        type: 'dateRange',
                        label: 'تاريخ بدء التحضير'
                    }
                ]
            },
            {
                id: 'priority',
                label: 'الأولوية',
                description: 'فلترة حسب مستوى الأولوية',
                icon: Star,
                iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                iconColor: 'text-amber-600 dark:text-amber-400',
                filters: [
                    {
                        id: 'priority',
                        type: 'multiSelect',
                        label: 'مستوى الأولوية',
                        options: priorityOptions
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'ready-to-ship': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الاستعداد',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'readyDate',
                        type: 'dateRange',
                        label: 'تاريخ الاستعداد'
                    }
                ]
            },
            {
                id: 'tracking',
                label: 'التتبع',
                description: 'فلترة حسب رقم التتبع',
                icon: Truck,
                iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                filters: [
                    {
                        id: 'trackingNumber',
                        type: 'search',
                        label: 'رقم التتبع',
                        placeholder: 'أدخل رقم التتبع...'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'sent': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإرسال',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'sentDate',
                        type: 'dateRange',
                        label: 'تاريخ الإرسال'
                    }
                ]
            },
            {
                id: 'tracking',
                label: 'التتبع',
                description: 'فلترة حسب رقم التتبع',
                icon: Truck,
                iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                iconColor: 'text-indigo-600 dark:text-indigo-400',
                filters: [
                    {
                        id: 'trackingNumber',
                        type: 'search',
                        label: 'رقم التتبع',
                        placeholder: 'أدخل رقم التتبع...'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ],
        'completed': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإكمال',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'completedDate',
                        type: 'dateRange',
                        label: 'تاريخ الإكمال'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            },
            {
                id: 'cost',
                label: 'المبلغ',
                description: 'فلترة حسب إجمالي المبلغ',
                icon: DollarSign,
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                filters: [
                    {
                        id: 'totalAmount',
                        type: 'numberRange',
                        label: 'نطاق المبلغ'
                    }
                ]
            }
        ],
        'cancelled': [
            {
                id: 'search',
                label: 'بحث',
                description: 'ابحث عن رقم التذكرة، اسم العميل، هاتف أو رقم تتبع',
                icon: Search,
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                filters: [
                    {
                        id: 'search',
                        type: 'search',
                        label: 'بحث شامل',
                        placeholder: 'رقم التذكرة، اسم العميل، هاتف...'
                    }
                ]
            },
            {
                id: 'dates',
                label: 'التواريخ',
                description: 'فلترة حسب تاريخ الإلغاء',
                icon: Calendar,
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                filters: [
                    {
                        id: 'cancelledDate',
                        type: 'dateRange',
                        label: 'تاريخ الإلغاء'
                    }
                ]
            },
            {
                id: 'location',
                label: 'الموقع',
                description: 'فلترة حسب المحافظة',
                icon: MapPin,
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                filters: [
                    {
                        id: 'governorate',
                        type: 'multiSelect',
                        label: 'المحافظة',
                        options: governorateOptions
                    }
                ]
            }
        ]
    }
};
