import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Settings, Wrench, Download, ShoppingCart } from 'lucide-react';
import { getTicketCounts, getFilterSummary } from '../../../api/ticketsAPI';
import {
    getTabColorClasses,
    getTabBgClasses,
    getTabBadgeClasses,
    getSubTabColorClasses,
    getTabBorderStyle,
} from '../../../utils/ui/tabs';
import { SUB_TABS_CONFIG } from './constants';

const INITIAL_BACKEND_COUNTS = {
    all: 0,
    pending: 0,
    confirmed: 0,
    inProcess: 0,
    completed: 0,
    cancelled: 0,
    replacement: 0,
    maintenance: 0,
    return: 0,
    sell: 0,
    subTabs: {
        replacement: {},
        maintenance: {},
        return: {},
        sell: {},
    },
};

/**
 * Tab/subtab, table search, search mode, backend counts, filter state and handlers.
 */
export function useTicketsFilters() {
    const [activeStatus, setActiveStatus] = useState('all');
    const [activeSubTab, setActiveSubTab] = useState(null);
    const [tableSearchQuery, setTableSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState('internal');
    const [backendCounts, setBackendCounts] = useState(INITIAL_BACKEND_COUNTS);
    const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedSources, setSelectedSources] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [datePreset, setDatePreset] = useState('all');
    const [filterSummary, setFilterSummary] = useState({
        total: 0,
        byServiceType: {},
        byStatus: null,
        hasActiveFilters: false,
    });

    const filtersRef = useRef({
        startDate,
        endDate,
        selectedServiceTypes,
        selectedStatuses,
        selectedSources,
        searchMode,
        tableSearchQuery,
    });

    useEffect(() => {
        filtersRef.current = {
            startDate,
            endDate,
            selectedServiceTypes,
            selectedStatuses,
            selectedSources,
            searchMode,
            tableSearchQuery,
        };
    }, [startDate, endDate, selectedServiceTypes, selectedStatuses, selectedSources, searchMode, tableSearchQuery]);

    const handleServiceTypeToggle = useCallback((type) => {
        setSelectedServiceTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    }, []);

    const handleStatusToggle = useCallback((status) => {
        setSelectedStatuses((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
        );
    }, []);

    const handleSourceToggle = useCallback((source) => {
        setSelectedSources((prev) =>
            prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
        );
    }, []);

    const handleDatePresetChange = useCallback((preset) => {
        setDatePreset(preset);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const formatDate = (d) => d.toISOString().split('T')[0];
        switch (preset) {
            case 'today':
                setStartDate(formatDate(today));
                setEndDate(formatDate(today));
                break;
            case 'yesterday':
                setStartDate(formatDate(yesterday));
                setEndDate(formatDate(yesterday));
                break;
            case 'lastWeek':
                setStartDate(formatDate(lastWeek));
                setEndDate(formatDate(today));
                break;
            case 'last30Days':
                setStartDate(formatDate(last30Days));
                setEndDate(formatDate(today));
                break;
            case 'thisMonth':
                setStartDate(formatDate(firstOfMonth));
                setEndDate(formatDate(today));
                break;
            case 'custom':
                break;
            case 'all':
            default:
                setStartDate('');
                setEndDate('');
                break;
        }
    }, []);

    const handleStartDateChange = useCallback((e) => {
        setStartDate(e.target.value);
        setDatePreset('custom');
    }, []);

    const handleEndDateChange = useCallback((e) => {
        setEndDate(e.target.value);
        setDatePreset('custom');
    }, []);

    const fetchBackendCounts = useCallback(async (force = false) => {
        try {
            const countsData = await getTicketCounts(force);
            const newCounts = {
                ...INITIAL_BACKEND_COUNTS,
                subTabs: {
                    replacement: countsData.replacement || {},
                    maintenance: countsData.maintenance || {},
                    return: countsData.return || {},
                    sell: countsData.sell || {},
                },
            };
            if (countsData.replacement) {
                newCounts.replacement = Object.values(countsData.replacement).reduce(
                    (sum, count) => sum + (count || 0),
                    0
                );
            }
            if (countsData.maintenance) {
                newCounts.maintenance = Object.values(countsData.maintenance).reduce(
                    (sum, count) => sum + (count || 0),
                    0
                );
            }
            if (countsData.return) {
                newCounts.return = Object.values(countsData.return).reduce(
                    (sum, count) => sum + (count || 0),
                    0
                );
            }
            if (countsData.sell) {
                newCounts.sell = Object.values(countsData.sell).reduce(
                    (sum, count) => sum + (count || 0),
                    0
                );
            }
            newCounts.all =
                newCounts.replacement +
                newCounts.maintenance +
                newCounts.return +
                (newCounts.sell || 0);
            // انتظار tab = tickets with status PENDING (قيد الانتظار in table)
            newCounts.pending = typeof countsData.pending === 'number' ? countsData.pending : 0;
            if (countsData.replacement) {
                newCounts.confirmed += countsData.replacement['in-preparation'] || 0;
                newCounts.inProcess += countsData.replacement['preparing'] || 0;
                newCounts.completed += countsData.replacement['completed'] || 0;
                newCounts.cancelled += countsData.replacement['cancelled'] || 0;
            }
            if (countsData.maintenance) {
                newCounts.confirmed += countsData.maintenance['confirmed'] || 0;
                newCounts.inProcess +=
                    (countsData.maintenance['received'] || 0) +
                    (countsData.maintenance['under-maintenance'] || 0) +
                    (countsData.maintenance['completion-ready'] || 0);
                newCounts.completed += countsData.maintenance['completed'] || 0;
                newCounts.cancelled += countsData.maintenance['cancelled'] || 0;
            }
            if (countsData.return) {
                newCounts.confirmed += countsData.return['receiving'] || 0;
                newCounts.inProcess += countsData.return['inspection'] || 0;
                newCounts.completed += countsData.return['completed'] || 0;
                newCounts.cancelled += countsData.return['cancelled'] || 0;
            }
            // Sell must be included in global status tabs (list uses STATUS_TAB_MAP same as other types)
            if (countsData.sell) {
                newCounts.confirmed += countsData.sell['new'] || 0;
                newCounts.inProcess += countsData.sell['preparing'] || 0;
                newCounts.completed += countsData.sell['completed'] || 0;
                newCounts.cancelled += countsData.sell['cancelled'] || 0;
            }
            setBackendCounts(newCounts);
        } catch (error) {
            console.error('Error fetching backend counts:', error);
            toast.error('فشل في تحميل الإحصائيات');
        }
    }, []);

    useEffect(() => {
        const serviceTypeTabs = ['replacement', 'maintenance', 'return', 'sell'];
        if (serviceTypeTabs.includes(activeStatus)) {
            const list = (SUB_TABS_CONFIG[activeStatus] || []);
            if (list.length > 0) {
                if (
                    !activeSubTab ||
                    !list.some((s) => s.id === activeSubTab)
                ) {
                    const allTab = list.find((s) => s.id === 'all');
                    setActiveSubTab(allTab ? 'all' : list[0].id);
                }
            }
        } else {
            setActiveSubTab(null);
        }
    }, [activeStatus, activeSubTab]);

    const getSubTabCount = useCallback(
        (serviceType, subTabId) => {
            const bucket = backendCounts.subTabs[serviceType] || {};
            // الصيانة → sub-tab "مؤكد" lists CONFIRMED + PENDING (see ticketTabParams); badge must match
            if (serviceType === 'maintenance' && subTabId === 'confirmed') {
                return (bucket.confirmed || 0) + (bucket.pending || 0);
            }
            if (subTabId === 'all') {
                const subTabs = SUB_TABS_CONFIG[serviceType] || [];
                return subTabs
                    .filter((subTab) => subTab.id !== 'all')
                    .reduce((total, subTab) => {
                        return total + getSubTabCount(serviceType, subTab.id);
                    }, 0);
            }
            if (bucket[subTabId] !== undefined) {
                return bucket[subTabId];
            }
            return 0;
        },
        [backendCounts]
    );

    const getMainTabCount = useCallback(
        (serviceType) => {
            if (backendCounts[serviceType] !== undefined) {
                return backendCounts[serviceType];
            }
            return 0;
        },
        [backendCounts]
    );

    const safeStatusCounts = useMemo(
        () => ({
            all: backendCounts.all || 0,
            pending: backendCounts.pending || 0,
            confirmed: backendCounts.confirmed || 0,
            inProcess: backendCounts.inProcess || 0,
            completed: backendCounts.completed || 0,
            cancelled: backendCounts.cancelled || 0,
            replacement: backendCounts.replacement || 0,
            maintenance: backendCounts.maintenance || 0,
            return: backendCounts.return || 0,
        }),
        [backendCounts]
    );

    const maintenanceIndicators = useMemo(() => {
        const indicators = [];
        const completionReadyCount = getSubTabCount('maintenance', 'completion-ready');
        const sentCount = getSubTabCount('maintenance', 'sent');
        if (completionReadyCount > 0) {
            indicators.push({
                position: 'right',
                color: 'bg-red-500',
                animate: true,
                title: `يوجد ${completionReadyCount} تذكرة في اكتمال الصيانة تحتاج إجراء`,
            });
        }
        if (sentCount > 0) {
            indicators.push({
                position: 'left',
                color: 'bg-green-500',
                animate: true,
                title: `يوجد ${sentCount} تذكرة مرسلة`,
            });
        }
        return indicators;
    }, [backendCounts, getSubTabCount]);

    const tabs = useMemo(
        () => [
            {
                id: 'all',
                label: 'الكل',
                badge: (safeStatusCounts.all || 0).toString(),
                color: 'gray',
                hasSubTabs: false,
                ariaLabel: 'تبويب الكل',
            },
            {
                id: 'pending',
                label: 'معلق',
                badge: (safeStatusCounts.pending || 0).toString(),
                color: 'yellow',
                hasSubTabs: false,
                ariaLabel: 'تبويب معلق',
            },
            {
                id: 'confirmed',
                label: 'مؤكد',
                badge: (safeStatusCounts.confirmed || 0).toString(),
                color: 'blue',
                hasSubTabs: false,
                ariaLabel: 'تبويب مؤكد',
            },
            {
                id: 'replacement',
                label: 'الاستبدال',
                badge: (safeStatusCounts.replacement || 0).toString(),
                color: 'orange',
                icon: Settings,
                hasSubTabs: true,
                ariaLabel: 'تبويب الاستبدال',
            },
            {
                id: 'maintenance',
                label: 'الصيانة',
                badge: (safeStatusCounts.maintenance || 0).toString(),
                color: 'purple',
                icon: Wrench,
                hasSubTabs: true,
                ariaLabel: 'تبويب الصيانة',
                indicators: maintenanceIndicators,
            },
            {
                id: 'return',
                label: 'الاسترجاع',
                badge: (safeStatusCounts.return || 0).toString(),
                color: 'blue',
                icon: Download,
                hasSubTabs: true,
                ariaLabel: 'تبويب الاسترجاع',
            },
            {
                id: 'sell',
                label: 'المبيعات',
                badge: (backendCounts.sell || 0).toString(),
                color: 'green',
                icon: ShoppingCart,
                hasSubTabs: true,
                ariaLabel: 'تبويب المبيعات',
            },
            {
                id: 'completed',
                label: 'مكتمل',
                badge: (safeStatusCounts.completed || 0).toString(),
                color: 'green',
                hasSubTabs: false,
                ariaLabel: 'تبويب مكتمل',
            },
            {
                id: 'cancelled',
                label: 'ملغي',
                badge: (safeStatusCounts.cancelled || 0).toString(),
                color: 'red',
                hasSubTabs: false,
                ariaLabel: 'تبويب ملغي',
            },
        ],
        [safeStatusCounts, backendCounts.sell, maintenanceIndicators]
    );

    const buildFilterParams = useCallback(() => {
        const params = {};
        if (tableSearchQuery?.trim()) params.search = tableSearchQuery.trim();
        if (selectedServiceTypes.length > 0) {
            params.service_type =
                selectedServiceTypes.length === 1
                    ? selectedServiceTypes[0]
                    : selectedServiceTypes.join(',');
        }
        if (selectedStatuses.length > 0) {
            params.status = selectedStatuses.join(',');
        }
        if (selectedSources.length > 0) {
            params.source = selectedSources.join(',');
        }
        if (datePreset !== 'all') {
            const today = new Date();
            const formatDate = (d) => d.toISOString().split('T')[0];
            switch (datePreset) {
                case 'today':
                    params.start_date = formatDate(today);
                    params.end_date = formatDate(today);
                    break;
                case 'yesterday': {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    params.start_date = formatDate(yesterday);
                    params.end_date = formatDate(yesterday);
                    break;
                }
                case 'lastWeek': {
                    const lastWeek = new Date(today);
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    params.start_date = formatDate(lastWeek);
                    params.end_date = formatDate(today);
                    break;
                }
                case 'last30Days': {
                    const last30Days = new Date(today);
                    last30Days.setDate(last30Days.getDate() - 30);
                    params.start_date = formatDate(last30Days);
                    params.end_date = formatDate(today);
                    break;
                }
                case 'thisMonth': {
                    const firstOfMonth = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                    );
                    params.start_date = formatDate(firstOfMonth);
                    params.end_date = formatDate(today);
                    break;
                }
                default:
                    break;
            }
        }
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return params;
    }, [
        tableSearchQuery,
        selectedServiceTypes,
        selectedStatuses,
        selectedSources,
        datePreset,
        startDate,
        endDate,
    ]);

    useEffect(() => {
        const hasActiveFilters =
            (tableSearchQuery && tableSearchQuery.trim()) ||
            selectedServiceTypes.length > 0 ||
            selectedStatuses.length > 0 ||
            selectedSources.length > 0 ||
            datePreset !== 'all' ||
            startDate ||
            endDate;
        if (!hasActiveFilters) {
            setFilterSummary({
                total: 0,
                byServiceType: {},
                byStatus: null,
                hasActiveFilters: false,
            });
            return;
        }
        const timeoutId = setTimeout(async () => {
            try {
                const filters = buildFilterParams();
                const summary = await getFilterSummary(filters);
                setFilterSummary({
                    ...summary,
                    hasActiveFilters: true,
                });
            } catch (error) {
                console.error('Error fetching filter summary:', error);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [
        tableSearchQuery,
        selectedServiceTypes,
        selectedStatuses,
        datePreset,
        startDate,
        endDate,
        buildFilterParams,
    ]);

    const handleClearAllFilters = useCallback(() => {
        setTableSearchQuery('');
        setSelectedServiceTypes([]);
        setSelectedStatuses([]);
        setSelectedSources([]);
        setDatePreset('all');
        setStartDate('');
        setEndDate('');
    }, []);

    const handleStatusChange = useCallback((status) => {
        setActiveStatus(status);
    }, []);

    return {
        subTabsConfig: SUB_TABS_CONFIG,
        filtersRef,
        activeStatus,
        setActiveStatus,
        activeSubTab,
        setActiveSubTab,
        tableSearchQuery,
        setTableSearchQuery,
        searchMode,
        setSearchMode,
        backendCounts,
        setBackendCounts,
        selectedServiceTypes,
        setSelectedServiceTypes,
        selectedStatuses,
        setSelectedStatuses,
        selectedSources,
        setSelectedSources,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        datePreset,
        setDatePreset,
        filterSummary,
        setFilterSummary,
        handleServiceTypeToggle,
        handleStatusToggle,
        handleSourceToggle,
        handleDatePresetChange,
        handleStartDateChange,
        handleEndDateChange,
        handleStatusChange,
        handleClearAllFilters,
        fetchBackendCounts,
        getSubTabCount,
        getMainTabCount,
        safeStatusCounts,
        maintenanceIndicators,
        tabs,
        buildFilterParams,
        getTabColorClasses,
        getTabBgClasses,
        getTabBadgeClasses,
        getSubTabColorClasses,
        getTabBorderStyle,
    };
}
