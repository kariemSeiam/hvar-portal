import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    ExternalLink,
    Truck,
    Package,
    Settings,
    Download,
    ShoppingCart,
    X,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Bell,
    FileSpreadsheet,
    MapPin,
    Users,
    Hash,
    User,
    Activity,
} from 'lucide-react';

import { listTickets, getTicket, createTicket, executeTicketAction, cancelTicket, getFilterSummary, exportTicketsToExcel, getTicketCounts } from '../../api/ticketsAPI';
// NOTE: productAPI removed - only stockAPI authorized endpoints used
import { stockAPI } from '../../api/stockAPI';
import { customerAPI } from '../../api/customerAPI';
import useRecentSearches from '../../hooks/useRecentSearches';
import { useAuth } from '../../contexts/AuthContext';

import { GlobalNavigation } from '../';
import UnifiedServiceActionModal from '../modals/UnifiedServiceActionModal';

// Lazy load heavy modals for better performance
const ServiceActionConfirmationModal = lazy(() => import('../modals/ServiceActionConfirmationModal'));
const ServiceModalViewer = lazy(() => import('../modals/ServiceModalViewer'));
const ServiceWorkflowActionModal = lazy(() => import('../modals/ServiceWorkflowActionModal'));

// Loading fallback for lazy modals
import ModalLoadingFallback from '../ui/ModalLoadingFallback';
import { normalizeEgyptPhone, isValidEgyptPhone, formatPhoneForLocalDisplay } from '../../utils/core/phone';
import { getActionTypeConfig } from '../../utils/service/utils';
import { buildTicketListParams } from '../../utils/service/ticketParams';
import { getServiceStatusLabel, getServiceStatusBadgeColor } from '../../utils/service/utils';
import {
    getTabColorClasses,
    getTabBgClasses,
    getTabBadgeClasses,
    getSubTabColorClasses,
    getTabBorderStyle
} from '../../utils/ui/tabs';

// UI Components
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

import ServiceActionsFilters from './ServiceActionsFilters';
import BostaSearchResultScreen from './BostaSearchResultScreen';
import TicketsTabs from './TicketsTabs';
import { BOSTA_FAB_ACTIONS } from './BostaSearchResultScreen/constants';
import { useTicketsFilters, useTicketsList, useModalsState, useServiceCreation } from './hooks';
import {
    normalizeServiceTypeOrFallback,
    getServiceTypeLabelAr,
} from '../../constants/serviceTypes.js';
import { SERVICE_TYPE_ICONS, getServiceTypeHeaderIconClass } from '../../constants/serviceTypeUi.js';

// Enhanced Tickets Page with Creative Sidebar Flow
const TicketsPage = () => {
    const navigate = useNavigate();
    const { userInfo } = useAuth();

    const filters = useTicketsFilters();
    const modals = useModalsState();
    const list = useTicketsList(filters);
    const creation = useServiceCreation({
        setSearchMode: filters.setSearchMode,
        setTableSearchQuery: filters.setTableSearchQuery,
        onOpenUnifiedModal: () => modals.setShowUnifiedModal(true),
        searchMode: filters.searchMode,
    });

    const {
        activeStatus, setActiveStatus, activeSubTab, setActiveSubTab, tableSearchQuery, setTableSearchQuery, searchMode, setSearchMode,
        backendCounts, selectedServiceTypes, selectedStatuses, selectedSources, startDate, endDate, datePreset, filterSummary,
        handleServiceTypeToggle, handleStatusToggle, handleSourceToggle, handleDatePresetChange, handleStartDateChange, handleEndDateChange, handleStatusChange, handleClearAllFilters,
        fetchBackendCounts, getSubTabCount, getMainTabCount, safeStatusCounts, maintenanceIndicators, tabs, subTabsConfig, buildFilterParams,
        getTabColorClasses, getTabBgClasses, getTabBadgeClasses, getSubTabColorClasses, getTabBorderStyle,
    } = filters;

    const {
        showUnifiedModal, setShowUnifiedModal, selectedAction, setSelectedAction,
        showWorkflowModal, setShowWorkflowModal, workflowActionType, setWorkflowActionType, workflowActionTicket, setWorkflowActionTicket,
        showConfirmationModal, setShowConfirmationModal, actionToConfirm, setActionToConfirm,
        showViewModal, setShowViewModal, viewingTicket, setViewingTicket, copiedPhone, setCopiedPhone,
        openViewModal, closeViewModal, closeWorkflowModal, closeConfirmationModal,
    } = modals;

    const {
        filteredTickets, setFilteredTickets, isLoadingTickets, isLoading, ticketsPagination, pageLimit, loadingActions, setLoadingActions,
        fetchTickets, loadFilteredTickets, handleLoadMore, handlePageChange, getFilteredCards, displayedTickets, getTabLabel, loadAllTickets, handleRefresh,
    } = list;

    const {
        isSearching, customerData, customerOrders, searchQuery, setSearchQuery, selectedOrder, setSelectedOrder, selectedActionType, setSelectedActionType,
        existingServices, isLoadingServices, products, parts, recentSearches, isAvailableOrdersExpanded, setIsAvailableOrdersExpanded, isExistingServicesExpanded, setIsExistingServicesExpanded, isCustomerInfoExpanded, setIsCustomerInfoExpanded,
        newCustomerData, customerFormErrors, isCreatingCustomer, hasSearched, searchResultEmpty, loadExistingCustomerTickets, availableOrders,
        handleSearch, handleCloseExternalSearch, handleOrderSelect, handleActionTypeSelect, handleCustomerFormChange, validateCustomerForm, handleCreateCustomer, clearCustomerSearch,
        customerCandidates, selectCustomerFromCandidates, clearCustomerCandidates,
    } = creation;

    // Items tooltip state per ticket (for clickable chips)
    const [itemsTooltipState, setItemsTooltipState] = useState({});
    const itemsTooltipRefs = useRef({});
    const [showCustomerResultsDropdown, setShowCustomerResultsDropdown] = useState(false);

    // Auto-open dropdown when search returns 2+ customers; auto-close when 0/1 or after selection
    useEffect(() => {
        setShowCustomerResultsDropdown(Boolean(customerCandidates?.length > 1));
    }, [customerCandidates]);

    // Close external search and clear modal action (creation hook + modal state)
    const handleCloseExternalSearchWithModal = useCallback(() => {
        handleCloseExternalSearch();
        setSelectedAction(null);
    }, [handleCloseExternalSearch, setSelectedAction]);

    // Copy phone for Panel A (ServiceModalViewer-style identity)
    const handleCopyPhone = useCallback((phone) => {
        if (!phone) return;
        navigator.clipboard.writeText(phone).then(() => {
            setCopiedPhone(phone);
            toast.success('تم نسخ الرقم');
            setTimeout(() => setCopiedPhone(null), 2000);
        }).catch(() => toast.error('فشل النسخ'));
    }, []);

    // Handle hub actions
    const handleHubAction = useCallback((actionType, action) => {
        switch (actionType) {
            case 'refresh':
                // Refresh data after action
                handleRefresh();
                break;
            case 'view':
                // Open action details modal or navigate to details page
                // NOTE: Action details modal deferred - would show full action history for a ticket
                // Future: Create ServiceActionHistoryModal component or navigate to dedicated details page
                break;
            default:
                break;
        }
    }, [handleRefresh]);

    // Handle service action status change with workflow integration
    const handleServiceActionStatusChange = useCallback(async (actionId, newStatus, data) => {
        try {

            // Prevent duplicate confirmations - check if modal is already open for this action
            if (newStatus === 'confirm' && showConfirmationModal && actionToConfirm?.id === actionId) {
                console.log(`🚫 Duplicate confirmation prevented for action ${actionId}`);
                return;
            }

            // Find the action to get its current state - check filteredTickets
            // Also try matching with both number and string ID formats
            let action = filteredTickets.find(a =>
                a.id === actionId ||
                a._id === actionId ||
                a.id === parseInt(actionId) ||
                a._id === parseInt(actionId) ||
                String(a.id) === String(actionId) ||
                String(a._id) === String(actionId)
            );

            // If still not found, fetch from API
            if (!action) {
                // Ticket not found in local state, fetching from API
                try {
                    const ticketResult = await getTicket(actionId);
                    if (ticketResult && ticketResult.context && ticketResult.context.ticket) {
                        action = ticketResult.context.ticket;
                    } else {
                        toast.error('لم يتم العثور على التذكرة');
                        console.error('Ticket not found in API response:', ticketResult);
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching ticket from API:', error);
                    toast.error('حدث خطأ في جلب بيانات التذكرة');
                    return;
                }
            }

            // Use the available_actions from ticket data instead of workflow system
            const availableActionsFromTicket = action.available_actions || [];
            const isActionAvailable = availableActionsFromTicket.includes(newStatus);

            if (!isActionAvailable) {
                toast.error('هذا الإجراء غير متاح في الحالة الحالية');
                return;
            }

            // For confirm actions, open confirmation modal
            if (newStatus === 'confirm') {
                setActionToConfirm(action);
                setShowConfirmationModal(true);
                return;
            }

            // Get action config for other actions
            const actionType = action.action_type || action.service_type;
            const actionConfig = getActionTypeConfig(actionType);

            // For actions that require confirmation modal, open the unified modal instead of direct API call
            if (actionConfig.requiresTrackingNumber || actionConfig.id === 'scan_send') {
                // Set the selected action for workflow modal
                setSelectedAction(actionId);
                setShowUnifiedModal(true);
                return;
            }

            // Handle standard actions directly
            let result;
            result = await executeTicketAction(actionId, {
                action: newStatus.toLowerCase(),
                user_id: userInfo?.id ?? 1,
                notes: data?.notes || '',
                cost_adjustment: data?.cost || 0
            });

            if (result) {
                // 1. Optimistic removal/update - instant UI feedback
                setFilteredTickets(prev => prev.filter(t => t.id !== actionId && t._id !== actionId));

                // 2. Immediate count refresh for instant badge updates
                fetchBackendCounts();

                // 3. Delayed refresh to ensure backend processed (1500ms)
                setTimeout(async () => {
                    await fetchBackendCounts();
                    const serviceTypeTabs = ['replacement', 'maintenance', 'return', 'sell'];
                    const isServiceTypeTab = serviceTypeTabs.includes(activeStatus);
                    const tab = isServiceTypeTab ? activeStatus : activeStatus;
                    const subTab = isServiceTypeTab ? activeSubTab : null;
                    await fetchTickets(tab, subTab);
                }, 1500);

                toast.success(`تم ${actionConfig.label} بنجاح`);
            } else {
                toast.error('حدث خطأ في تحديث حالة التذكرة');
            }
        } catch (error) {
            toast.error('حدث خطأ في تحديث حالة التذكرة');
        }
    }, [filteredTickets, showConfirmationModal, actionToConfirm, activeStatus, activeSubTab, fetchTickets, fetchBackendCounts]);

    // Handle unified modal success
    const handleUnifiedModalSuccess = useCallback(async (serviceActionData) => {
        try {
            // Check if this is a creation (not a workflow action) before resetting state
            const isCreation = !selectedAction; // If selectedAction is null, it's a creation

            // Refresh backend counts
            await fetchBackendCounts();
            // Refresh customer-specific tickets if a customer is selected
            if (customerData?.id) {
                await loadExistingCustomerTickets(customerData.id);
            }
            // Refresh the general tickets list to reflect changes
            const serviceTypeTabs = ['replacement', 'maintenance', 'return', 'sell'];
            const isServiceTypeTab = serviceTypeTabs.includes(activeStatus);
            const tab = isServiceTypeTab ? activeStatus : activeStatus;
            const subTab = isServiceTypeTab ? activeSubTab : null;
            await fetchTickets(tab, subTab);

            // Reset states and close modal
            setShowUnifiedModal(false);
            setSelectedOrder(null);
            setSelectedActionType(null);
            setSelectedAction(null); // Also clear workflow action

            // Switch to internal tab after successful service creation
            if (isCreation) {
                setSearchMode('internal');
            }

            toast.success('تم تنفيذ العملية بنجاح');
        } catch (error) {
            // Make sure modal closes even on error
            setShowUnifiedModal(false);
        }
    }, [customerData, loadExistingCustomerTickets, activeStatus, activeSubTab, fetchTickets, fetchBackendCounts, selectedAction]);

    // Handle unified modal close
    const handleUnifiedModalClose = useCallback(() => {
        setShowUnifiedModal(false);
        setSelectedActionType(null);
        setSelectedAction(null);
        setSelectedOrder(null);
        // Do not clear customer search here to keep Bosta search state active
    }, []);

    // Handle confirmation modal success
    const handleConfirmationModalSuccess = useCallback(async (confirmedData) => {
        try {
            if (!actionToConfirm) {
                return;
            }


            // The modal already successfully submitted the confirmation
            // Just update the UI state - no need for another API call

            // 1. Optimistic removal - instant UI feedback
            setFilteredTickets(prev => prev.filter(t => t.id !== actionToConfirm.id && t._id !== actionToConfirm.id));

            // 2. Immediate count refresh for instant badge updates
            fetchBackendCounts();

            // 3. Delayed refresh to ensure backend processed (1500ms)
            setTimeout(async () => {
                await fetchBackendCounts();
                const serviceTypeTabs = ['replacement', 'maintenance', 'return', 'sell'];
                const isServiceTypeTab = serviceTypeTabs.includes(activeStatus);
                const tab = isServiceTypeTab ? activeStatus : activeStatus;
                const subTab = isServiceTypeTab ? activeSubTab : null;
                await fetchTickets(tab, subTab);
            }, 1500);

            toast.success('تم تأكيد التذكرة بنجاح');

            // Close modal and reset state
            setShowConfirmationModal(false);
            setActionToConfirm(null);
        } catch (error) {
            console.error('Error updating confirmation UI:', error);
            toast.error('حدث خطأ في تحديث واجهة المستخدم');
        }
    }, [actionToConfirm, loadFilteredTickets]);

    // Handle confirmation modal close
    const handleConfirmationModalClose = useCallback(() => {
        setShowConfirmationModal(false);
        setActionToConfirm(null);
    }, []);


    // Handle service action creation
    const handleCreateServiceAction = useCallback(async (actionData) => {
        try {
            // Basic validation (detailed validation handled by backend)
            if (!selectedActionType || !selectedOrder || !customerData?.phone) {
                toast.error('يرجى التأكد من اختيار نوع الخدمة والطلب وبيانات العميل');
                return;
            }

            // Prepare the complete payload - Tickets API format
            const payload = {
                type: selectedActionType,
                customer_id: customerData?.id || null, // Use existing customer ID if available, otherwise backend creates new customer
                user_id: userInfo?.id ?? 1,
                notes: actionData.notes || '',
                priority: actionData.priority || 'normal',
                items: actionData.items || [],
                original_tracking: selectedOrder.tracking_number || selectedOrder.trackingNumber,
                reason: actionData.reason || '',
                cost_adjustment: actionData.cost ? parseFloat(actionData.cost) : undefined,

                // Customer details for creation/update
                name: customerData.name,
                phone: customerData.phone,
                phone_secondary: customerData.phone_secondary || undefined,
                city: customerData.city || undefined,
                governorate: customerData.governorate || undefined,
                address_details: customerData.address_details || customerData.address || undefined
            };

            const result = await createTicket(payload);
            if (result && result.id) {
                setSelectedOrder(null);
                setSelectedActionType(null);

                // Refresh all tickets
                await loadAllTickets();

                toast.success('تم إنشاء التذكرة بنجاح');
            } else {
                toast.error('فشل في إنشاء التذكرة');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            console.error('Payload being sent:', payload);
            console.error('Customer data available:', customerData);
            toast.error('فشل في إنشاء التذكرة');
        }
    }, [selectedActionType, selectedOrder, customerData]);

    // Using centralized utilities from /utils/serviceActionUtils.js

    // Helper function to group items by direction (send/receive)
    const getItemsByDirection = useCallback((items) => {
        if (!items || items.length === 0) return { send: [], receive: [] };

        return items.reduce((acc, item) => {
            const direction = item.direction?.toLowerCase();
            if (direction === 'send') {
                acc.send.push(item);
            } else if (direction === 'receive') {
                acc.receive.push(item);
            }
            return acc;
        }, { send: [], receive: [] });
    }, []);

    // Handle items chip click (similar to ServiceActionCard)
    const handleItemsChipClick = useCallback((event, ticketId, direction, items) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        // Position tooltip below the chip, centered
        const x = rect.left + (rect.width / 2);
        const y = rect.bottom + 8;

        setItemsTooltipState(prev => ({
            ...prev,
            [ticketId]: {
                show: prev[ticketId]?.show && prev[ticketId]?.direction === direction ? false : true,
                direction,
                items,
                position: { x, y }
            }
        }));
    }, []);

    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside any tooltip
            const clickedOnChip = event.target.closest('[data-items-chip]');
            const clickedOnTooltip = Object.values(itemsTooltipRefs.current).some(ref =>
                ref && ref.contains(event.target)
            );

            if (!clickedOnChip && !clickedOnTooltip) {
                setItemsTooltipState({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Render items column with clickable chips (like ServiceActionCard)
    const renderItemsColumn = useCallback((ticket) => {
        if (!ticket.items || ticket.items.length === 0) {
            return (
                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
            );
        }

        const { send, receive } = getItemsByDirection(ticket.items);
        const ticketId = ticket.id;
        const tooltipState = itemsTooltipState[ticketId];

        if (send.length === 0 && receive.length === 0) {
            return (
                <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
            );
        }

        return (
            <div className="relative">
                <div className="flex flex-wrap gap-1.5">
                    {/* Send Chip */}
                    {send.length > 0 && (
                        <button
                            onClick={(e) => handleItemsChipClick(e, ticketId, 'send', send)}
                            className="flex items-center space-x-1 space-x-reverse px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
                            data-items-chip
                        >
                            <Truck className="w-3 h-3" />
                            <span>إرسال</span>
                            <span className="bg-blue-200 dark:bg-blue-800 px-1 py-0.5 rounded-full text-[9px] font-bold">
                                {send.length}
                            </span>
                        </button>
                    )}

                    {/* Receive Chip */}
                    {receive.length > 0 && (
                        <button
                            onClick={(e) => handleItemsChipClick(e, ticketId, 'receive', receive)}
                            className="flex items-center space-x-1 space-x-reverse px-2 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg text-[10px] font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
                            data-items-chip
                        >
                            <Package className="w-3 h-3" />
                            <span>استلام</span>
                            <span className="bg-green-200 dark:bg-green-800 px-1 py-0.5 rounded-full text-[9px] font-bold">
                                {receive.length}
                            </span>
                        </button>
                    )}
                </div>

                {/* Items Tooltip */}
                {tooltipState?.show && (
                    <div
                        ref={(el) => {
                            if (el) itemsTooltipRefs.current[ticketId] = el;
                            else delete itemsTooltipRefs.current[ticketId];
                        }}
                        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm"
                        style={{
                            top: `${tooltipState.position.y}px`,
                            left: `${tooltipState.position.x - 140}px`,
                            transform: 'translateY(8px)'
                        }}
                    >
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 rotate-45"></div>
                        <div className="text-sm">
                            <div className="flex items-center space-x-2 space-x-reverse mb-3">
                                {tooltipState.direction === 'send' ? (
                                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
                                )}
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {tooltipState.direction === 'send' ? 'عناصر الإرسال' : 'عناصر الاستلام'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {tooltipState.items.map((item, index) => {
                                    const isProduct = item.type === 'product';
                                    const isDamaged = item.condition === 'damaged';
                                    const isValid = item.condition === 'valid';

                                    return (
                                        <div key={index} className="flex items-center space-x-2 space-x-reverse text-xs">
                                            <div className={`
                                                w-4 h-4 rounded flex items-center justify-center flex-shrink-0
                                                ${isProduct
                                                    ? 'bg-blue-100 dark:bg-blue-900/30'
                                                    : 'bg-green-100 dark:bg-green-900/30'
                                                }
                                            `}>
                                                {isProduct ? (
                                                    <Package className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                                ) : (
                                                    <Settings className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                                                )}
                                            </div>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium truncate flex-1 min-w-0">
                                                {item.name}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                ({item.sku})
                                            </span>
                                            <span className={`
                                                px-1.5 py-0.5 rounded-full text-xs font-bold
                                                ${isDamaged
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                    : isValid
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                                                }
                                            `}>
                                                {item.quantity}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }, [getItemsByDirection, itemsTooltipState, handleItemsChipClick]);

    // Excel export handler
    const handleExportToExcel = useCallback(async () => {
        try {
            toast.loading('جاري تصدير البيانات...', { id: 'export' });

            const filters = buildFilterParams();
            await exportTicketsToExcel(filters);

            toast.success('تم تصدير البيانات بنجاح', { id: 'export' });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('فشل تصدير البيانات', { id: 'export' });
        }
    }, [buildFilterParams]);


    return (
        <div className="h-screen flex flex-col">
            <TicketsTabs
                activeStatus={activeStatus}
                setActiveStatus={setActiveStatus}
                activeSubTab={activeSubTab}
                setActiveSubTab={setActiveSubTab}
                tabs={tabs}
                subTabsConfig={subTabsConfig}
                getSubTabCount={getSubTabCount}
                getTabColorClasses={getTabColorClasses}
                getTabBgClasses={getTabBgClasses}
                getTabBadgeClasses={getTabBadgeClasses}
                getSubTabColorClasses={getSubTabColorClasses}
                getTabBorderStyle={getTabBorderStyle}
                searchMode={searchMode}
            />

            {/* Main Content with Sidebar */}
            <div className="flex-1 flex overflow-hidden h-full">


                {/* Right Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Main Content */}
                    {/* Scroll: vertical rhythm pt-4 pb-6 (space-4 / space-6); horizontal gutter matches header */}
                    <div className="flex-1 overflow-y-auto pt-4 pb-6 scrollbar-custom [scrollbar-gutter:stable] overscroll-contain" role="main">
                        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 space-y-4">
                            {/* Search & Filter Bar — scrolls with page (not sticky); no extra chrome */}
                            <div>
                                <div className="flex items-stretch gap-2 sm:gap-3 w-full bg-transparent" dir="rtl">
                                    {/* Mode Toggle - same height as search bar (48px sm:52px) */}
                                    <div className="flex items-stretch">
                                        <div role="group" aria-label="وضع البحث" className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setSearchMode('internal')}
                                                aria-pressed={searchMode === 'internal'}
                                                className={`flex-shrink-0 h-[48px] sm:h-[52px] px-4 sm:px-6 flex items-center justify-center text-xs sm:text-sm font-cairo font-bold rounded-2xl transition-all duration-200 border-2 ${searchMode === 'internal'
                                                    ? 'bg-brand-blue-50 dark:bg-brand-blue-900/20 text-brand-blue-600 dark:text-brand-blue-400 border-brand-blue-400/40 dark:border-brand-blue-400/30 shadow-md ring-2 ring-brand-blue-500/10'
                                                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-gray-100 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                            >
                                                <span className="whitespace-nowrap">داخلي</span>
                                            </button>
                                            <a
                                                href="https://bosta.co/ar-eg/home"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => { e.preventDefault(); setSearchMode('external'); }}
                                                className={`flex-shrink-0 h-[48px] sm:h-[52px] px-4 sm:px-6 flex items-center justify-center rounded-2xl border-2 transition-all duration-300 ease-out text-brand-red-600 ${searchMode === 'external'
                                                    ? 'bg-brand-red-600/15 dark:bg-brand-red-600/20 border-brand-red-600 shadow-lg shadow-brand-red-600/10 ring-2 ring-brand-red-600/20'
                                                    : 'bg-brand-red-600/5 dark:bg-brand-red-600/10 border-brand-red-600/20 dark:border-brand-red-600/25 hover:bg-brand-red-600/10 hover:border-brand-red-600/40 dark:hover:bg-brand-red-600/15 dark:hover:border-brand-red-600/40 shadow-sm'
                                                    }`}
                                                aria-pressed={searchMode === 'external'}
                                                role="button"
                                            >
                                                <svg width="112" height="32" viewBox="0 0 112 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`h-5 w-auto object-contain transition-opacity duration-200 text-brand-red-600 ${searchMode === 'external' ? 'opacity-100' : 'opacity-80'}`}>
                                                    <path d="M10.0955 10.9068C10.9901 10.9068 11.7355 10.1617 11.7355 9.2675C11.7355 8.37335 10.9901 7.62823 10.0955 7.62823C9.20096 7.62823 8.45549 8.37335 8.45549 9.2675C8.45549 10.1989 9.20096 10.9068 10.0955 10.9068Z" fill="currentColor" />
                                                    <path d="M6.14454 10.9068C7.0391 10.9068 7.78457 10.1617 7.78457 9.2675C7.78457 8.37335 7.0391 7.62823 6.14454 7.62823C5.24998 7.62823 4.50451 8.37335 4.50451 9.2675C4.50451 10.1989 5.24998 10.9068 6.14454 10.9068Z" fill="currentColor" />
                                                    <path d="M67.4219 20.7424H64.3282V12.3225H58.5136C55.4944 12.3225 53.0344 15.1912 53.0344 18.209C53.0344 21.2268 55.4944 23.6857 58.5136 23.6857H61.3464C61.3464 23.9837 61.2718 24.5426 60.7127 24.9524C60.1909 25.3622 58.7372 25.921 55.979 25.2877L55.3453 28.0819C56.4263 28.3427 57.3581 28.4172 58.1781 28.4172C60.2282 28.4172 61.5327 27.7839 62.3155 27.1505C63.3964 26.2936 64.03 24.9896 64.03 23.6112H70.6274V12.248H67.4219V20.7424ZM61.1227 20.7424H59.0727C57.5445 20.7424 56.2772 19.5875 56.2772 18.06C56.2772 16.5325 57.5072 15.2658 59.0727 15.2658H61.1227V20.7424Z" fill="currentColor" />
                                                    <path d="M69.0247 25.0641C68.1301 25.0641 67.3846 25.8093 67.3846 26.7034C67.3846 27.5976 68.1301 28.3427 69.0247 28.3427C69.9192 28.3427 70.6647 27.5976 70.6647 26.7034C70.6647 25.8093 69.9192 25.0641 69.0247 25.0641Z" fill="currentColor" />
                                                    <path d="M47.7043 18.8424C47.7043 19.9228 46.8843 20.7424 45.8034 20.7424C44.7224 20.7424 44.0888 19.9228 44.0888 18.8424V14.1853H40.846V18.7678C40.846 19.8483 39.9515 20.7424 38.8705 20.7424H37.7523V14.1853H34.5095V20.7424H30.484C30.484 20.7424 30.5586 20.6307 30.7077 20.4444C32.0868 18.3953 31.4904 15.3403 29.8131 13.6265C28.5831 12.3598 26.7194 11.7637 25.0048 12.0617C22.5448 12.4715 21.4266 13.9245 19.5257 16.5697V7.62823H16.2829V20.7052H13.1892V12.2853H6.03271C3.05084 12.2853 0.92627 14.6697 0.92627 18.06C0.92627 21.4876 3.31176 23.9837 6.21908 23.9837C7.82183 23.9837 9.05186 23.3876 9.87187 22.2699L9.94641 22.1582L10.5055 23.6484H39.206C40.5105 23.6484 41.666 23.1268 42.5233 22.2699C43.3806 23.1268 44.5361 23.6484 45.8406 23.6484C48.4125 23.6484 50.9471 21.5621 50.9471 18.9914V12.2853H47.7043V18.8424ZM9.94641 18.0972C9.94641 19.9973 8.79094 21.115 7.03909 21.115C5.28725 21.115 4.16904 20.0346 4.16904 18.0972C4.16904 16.1599 5.28725 15.2658 7.03909 15.2658H9.94641V18.0972ZM28.2103 18.06C28.1358 18.4325 27.9867 18.8051 27.7631 19.1777C27.1294 20.2208 25.8994 20.7424 24.6694 20.7424H19.302C19.302 20.7424 20.6066 19.1404 21.3521 18.2835C22.5448 16.905 23.7748 15.2658 25.4521 14.9677C27.3158 14.6697 28.5085 16.4207 28.2103 18.06Z" fill="currentColor" />
                                                    <path d="M110.957 8.33609L96.9424 0.25148C96.3833 -0.0838266 95.6751 -0.0838266 95.116 0.25148L81.1012 8.33609C80.5421 8.67139 80.1694 9.26749 80.1694 9.9381V21.7856C80.1694 22.4562 80.5048 23.0523 81.1012 23.3876L95.116 31.4722C95.4142 31.6213 95.7123 31.733 96.0478 31.733C96.3833 31.733 96.6815 31.6585 96.9796 31.4722L110.994 23.3876C111.554 23.0523 111.926 22.4562 111.926 21.7856V9.9381C111.889 9.26749 111.516 8.67139 110.957 8.33609ZM108.646 18.8424L103.465 15.8619L108.646 12.8814V18.8424ZM96.0105 3.45551L107.23 9.9381L96.0105 16.4207L84.7913 9.9381L96.0105 3.45551ZM83.4122 12.8441L88.5931 15.8246L83.4122 18.8051V12.8441ZM96.0105 28.2309L84.7913 21.7483L91.7987 17.6874L95.0787 19.5875C95.3769 19.7365 95.6751 19.8483 96.0105 19.8483C96.346 19.8483 96.6442 19.7738 96.9424 19.5875L100.222 17.6874L107.23 21.7483L96.0105 28.2309Z" fill="currentColor" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>

                                    {/* Search Input: one end slot = count badge | searching | search/phone/tracking icon */}
                                    <div className={`relative flex-1 min-w-0 flex items-center transition-all duration-500 ${searchMode === 'internal' ? 'max-w-[500px]' : 'max-w-[400px]'}`}>
                                        <div className="relative flex-1 min-w-0 group h-[48px] sm:h-[52px] bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 focus-within:border-brand-blue-500 dark:focus-within:border-brand-blue-400 focus-within:ring-4 focus-within:ring-brand-blue-500/10 dark:focus-within:ring-brand-blue-400/10 transition-all duration-300 overflow-hidden flex items-stretch">
                                            <input
                                                type="text"
                                                value={searchMode === 'internal' ? tableSearchQuery : searchQuery}
                                                onChange={(e) => {
                                                    if (searchMode === 'internal') {
                                                        setTableSearchQuery(e.target.value);
                                                    } else {
                                                        setSearchQuery(e.target.value);
                                                    }
                                                }}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && searchMode === 'external') {
                                                        handleSearch();
                                                    }
                                                }}
                                                placeholder={searchMode === 'internal' ? "ابحث عن تذكرة، عميل، رقم تتبع أو هاتف..." : "رقم الهاتف أو رقم التتبع"}
                                                className={`w-full h-full px-4 py-0 border-0 bg-transparent rounded-2xl font-cairo text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 focus:ring-offset-0 group-hover:border-transparent text-right ${searchMode === 'internal' ? 'pr-12 pl-4' : (customerCandidates && customerCandidates.length > 1 ? 'pr-12 pl-24' : 'pr-12 pl-14')}`}
                                                dir="rtl"
                                            />

                                            {/* Internal: search icon at end */}
                                            {searchMode === 'internal' && (
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                            )}

                                            {/* External: right = always search/phone/tracking icon */}
                                            {searchMode === 'external' && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                                    {(() => {
                                                        const trimmedQuery = searchQuery.trim();
                                                        const isPhoneNumber = /^(\+201|01|01)/.test(trimmedQuery);
                                                        const isTrackingNumber = trimmedQuery.length > 8 && /^[A-Za-z0-9]+$/.test(trimmedQuery);
                                                        const iconClass = "w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500";
                                                        if (isPhoneNumber) {
                                                            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
                                                        }
                                                        if (isTrackingNumber) {
                                                            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
                                                        }
                                                        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
                                                    })()}
                                                </div>
                                            )}

                                            {/* External: end of bar (left) = count badge | جاري البحث... | search button */}
                                            {searchMode === 'external' && (
                                                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center">
                                                    {customerCandidates && customerCandidates.length > 1 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCustomerResultsDropdown(true)}
                                                            className="font-cairo font-bold text-xs text-white bg-brand-red-500 dark:bg-brand-red-600 hover:bg-brand-red-600 dark:hover:bg-brand-red-500 px-2 py-1.5 rounded-lg shadow border border-brand-red-600/30 dark:border-brand-red-500/30 tabular-nums transition-colors"
                                                            title="عرض النتائج"
                                                        >
                                                            {customerCandidates.length} عملاء
                                                        </button>
                                                    ) : isSearching ? (
                                                        <span className="font-cairo text-xs font-medium text-brand-blue-600 dark:text-brand-blue-400 flex items-center gap-1.5 whitespace-nowrap py-1.5">
                                                            <svg className="w-4 h-4 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                                            جاري البحث...
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={handleSearch}
                                                            disabled={!searchQuery.trim()}
                                                            className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 hover:from-brand-blue-600 hover:to-brand-blue-700 text-white px-2.5 sm:px-3 py-1.5 rounded-lg font-cairo text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Inline customer results — solid structure like service modal (summary card + table) */}
                                        {searchMode === 'external' && customerCandidates && customerCandidates.length > 1 && showCustomerResultsDropdown && (
                                            <div
                                                className="absolute top-full left-0 right-0 mt-2 z-20 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
                                                dir="rtl"
                                            >
                                                <div className="p-4 sm:p-5 space-y-4">
                                                    {/* Summary card — same pattern as ReplacementPreparationItemsModal */}
                                                    <div className="bg-gradient-to-br from-brand-red-50 to-brand-red-100 dark:from-brand-red-900/20 dark:to-brand-red-800/20 rounded-lg p-3 border border-brand-red-200 dark:border-brand-red-700/50 shadow-sm">
                                                        <div className="flex items-center space-x-2 space-x-reverse">
                                                            <div className="p-2 bg-brand-red-500/10 dark:bg-brand-red-400/20 rounded-lg">
                                                                <Users className="w-4 h-4 text-brand-red-600 dark:text-brand-red-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-brand-red-600 dark:text-brand-red-400 font-cairo font-medium">عدد العملاء</div>
                                                                <div className="text-xl font-bold text-brand-red-700 dark:text-brand-red-300 font-cairo mt-0.5">
                                                                    {customerCandidates.length}
                                                                </div>
                                                                <div className="text-[10px] text-brand-red-500 dark:text-brand-red-400 font-cairo mt-0.5">اختر عميلاً من القائمة</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Table — scrollable body, same structure as modal */}
                                                    <div className="max-h-[280px] overflow-y-auto overflow-x-auto scrollbar-small rounded-lg border border-gray-200 dark:border-gray-700" style={{ WebkitOverflowScrolling: 'touch' }}>
                                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-[1]">
                                                                <tr>
                                                                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-cairo">العميل</th>
                                                                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-cairo">الهاتف</th>
                                                                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-cairo">المحافظة / المدينة</th>
                                                                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider font-cairo">الطلبات</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                                {customerCandidates.map((customer, idx) => {
                                                                    const name = customer.name || '—';
                                                                    const phone = customer.phone || '';
                                                                    const governorate = customer.governorate || null;
                                                                    const city = customer.city || null;
                                                                    const hasLocation = governorate || city;
                                                                    const orderCount = Array.isArray(customer.bosta_orders) ? customer.bosta_orders.length : 0;
                                                                    return (
                                                                        <tr
                                                                            key={customer.id || idx}
                                                                            role="button"
                                                                            tabIndex={0}
                                                                            onClick={() => { setShowCustomerResultsDropdown(false); selectCustomerFromCandidates(customer); }}
                                                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowCustomerResultsDropdown(false); selectCustomerFromCandidates(customer); } }}
                                                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-inset"
                                                                        >
                                                                            <td className="px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 font-cairo">
                                                                                {name}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-cairo" dir="ltr">{phone || '—'}</td>
                                                                            <td className="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 font-cairo">
                                                                                {hasLocation ? (
                                                                                    <span className="inline-flex items-center gap-1 flex-wrap justify-end">
                                                                                        {governorate && <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-600/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-500/50">{governorate}</span>}
                                                                                        {city && <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-600/60 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-500/50">{city}</span>}
                                                                                    </span>
                                                                                ) : '—'}
                                                                            </td>
                                                                            <td className="px-3 py-2.5 whitespace-nowrap text-sm font-bold text-brand-red-600 dark:text-brand-red-400 font-cairo">
                                                                                {orderCount}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Footer — like modal's border-t + hint */}
                                                    <div className="flex justify-center pt-3 border-t border-gray-200 dark:border-gray-700">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-cairo">انقر على صف لاختيار العميل</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Close Button - Moved: Now immediately after search input */}
                                    {searchMode === 'external' && hasSearched && (
                                        <button
                                            type="button"
                                            onClick={handleCloseExternalSearchWithModal}
                                            className="flex-shrink-0 h-[48px] sm:h-[52px] px-3 sm:px-4 flex items-center justify-center rounded-2xl border-2 transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-brand-red-600 dark:hover:text-brand-red-400 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-brand-red-200 dark:hover:border-brand-red-900/30 hover:bg-brand-red-50 dark:hover:bg-brand-red-900/10"
                                            title="إغلاق البحث"
                                            aria-label="إغلاق البحث"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}


                                    {/* Create service chips — استبدال، صيانة، إرجاع، بيع — at end, only when Bosta mode */}
                                    {searchMode === 'external' && (
                                        <div role="group" aria-label="إنشاء خدمة" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ms-auto">
                                            {BOSTA_FAB_ACTIONS.map((action) => (
                                                <button
                                                    key={action.id}
                                                    type="button"
                                                    onClick={() => handleActionTypeSelect(action.id)}
                                                    className={`flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-xl font-cairo font-bold text-xs sm:text-sm transition-all duration-200 border ${action.bg} text-white border-transparent shadow-sm hover:shadow-md cursor-pointer`}
                                                    title={`إنشاء ${action.label}`}
                                                >
                                                    {action.icon}
                                                    <span className="whitespace-nowrap">{action.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {searchMode === 'internal' && (
                                        <ServiceActionsFilters
                                            selectedServiceTypes={selectedServiceTypes}
                                            onServiceTypeToggle={handleServiceTypeToggle}
                                            selectedStatuses={selectedStatuses}
                                            onStatusToggle={handleStatusToggle}
                                            selectedSources={selectedSources}
                                            onSourceToggle={handleSourceToggle}
                                            datePreset={datePreset}
                                            startDate={startDate}
                                            endDate={endDate}
                                            onDatePresetChange={handleDatePresetChange}
                                            onStartDateChange={handleStartDateChange}
                                            onEndDateChange={handleEndDateChange}
                                        />
                                    )}

                                </div>
                            </div>

                            {/* Two-panel layout after Bosta search */}
                            {(searchMode === 'external' && hasSearched) ? (
                                <BostaSearchResultScreen
                                    isSearching={isSearching}
                                    customerData={customerData}
                                    customerOrders={customerOrders}
                                    existingServices={existingServices}
                                    selectedOrder={selectedOrder}
                                    searchQuery={searchQuery}
                                    copiedPhone={copiedPhone}
                                    newCustomerData={newCustomerData}
                                    customerFormErrors={customerFormErrors}
                                    isCreatingCustomer={isCreatingCustomer}
                                    onCopyPhone={handleCopyPhone}
                                    onViewTicket={(service) => { setViewingTicket(service); setShowViewModal(true); }}
                                    onClose={handleCloseExternalSearchWithModal}
                                    onOrderSelect={handleOrderSelect}
                                    onCustomerFormChange={handleCustomerFormChange}
                                    onCreateCustomer={handleCreateCustomer}
                                />
                            ) : searchMode === 'internal' ? null : null}

                            {/* Filter Summary Bar - same start/end margin as search bar and table */}
                            {searchMode === 'internal' && filterSummary.hasActiveFilters && (
                                <div className="w-full mt-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl shadow-sm transition-all duration-200">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        {/* Right side - Filter Summary */}
                                        <div className="flex items-center gap-6 flex-wrap">
                                            {/* Total Count */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 font-cairo">
                                                    نتائج البحث:
                                                </span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo">
                                                    {filterSummary.total || 0} تذكرة
                                                </span>
                                            </div>

                                            {/* Service Type Breakdown - Only show if count > 0 */}
                                            {filterSummary.byServiceType.replacement > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedServiceTypes.includes('replacement')
                                                        ? 'bg-orange-200 dark:bg-orange-800/50'
                                                        : 'bg-orange-100 dark:bg-orange-900/30'
                                                        }`}>
                                                        <svg className={`w-3 h-3 ${selectedServiceTypes.includes('replacement')
                                                            ? 'text-orange-700 dark:text-orange-300'
                                                            : 'text-orange-600 dark:text-orange-400'
                                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                        </svg>
                                                    </div>
                                                    <span className={`text-sm font-medium font-cairo ${selectedServiceTypes.includes('replacement')
                                                        ? 'text-orange-700 dark:text-orange-300 font-semibold'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {filterSummary.byServiceType?.replacement || 0} استبدال
                                                    </span>
                                                </div>
                                            )}

                                            {(filterSummary.byServiceType?.maintenance || 0) > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedServiceTypes.includes('maintenance')
                                                        ? 'bg-purple-200 dark:bg-purple-800/50'
                                                        : 'bg-purple-100 dark:bg-purple-900/30'
                                                        }`}>
                                                        <svg className={`w-3 h-3 ${selectedServiceTypes.includes('maintenance')
                                                            ? 'text-purple-700 dark:text-purple-300'
                                                            : 'text-purple-600 dark:text-purple-400'
                                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className={`text-sm font-medium font-cairo ${selectedServiceTypes.includes('maintenance')
                                                        ? 'text-purple-700 dark:text-purple-300 font-semibold'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {filterSummary.byServiceType?.maintenance || 0} صيانة
                                                    </span>
                                                </div>
                                            )}

                                            {(filterSummary.byServiceType?.return || 0) > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedServiceTypes.includes('return')
                                                        ? 'bg-red-200 dark:bg-red-800/50'
                                                        : 'bg-red-100 dark:bg-red-900/30'
                                                        }`}>
                                                        <svg className={`w-3 h-3 ${selectedServiceTypes.includes('return')
                                                            ? 'text-red-700 dark:text-red-300'
                                                            : 'text-red-600 dark:text-red-400'
                                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                        </svg>
                                                    </div>
                                                    <span className={`text-sm font-medium font-cairo ${selectedServiceTypes.includes('return')
                                                        ? 'text-red-700 dark:text-red-300 font-semibold'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {filterSummary.byServiceType?.return || 0} استرجاع
                                                    </span>
                                                </div>
                                            )}

                                            {(filterSummary.byServiceType?.sell || 0) > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedServiceTypes.includes('sell')
                                                        ? 'bg-green-200 dark:bg-green-800/50'
                                                        : 'bg-green-100 dark:bg-green-900/30'
                                                        }`}>
                                                        <svg className={`w-3 h-3 ${selectedServiceTypes.includes('sell')
                                                            ? 'text-green-700 dark:text-green-300'
                                                            : 'text-green-600 dark:text-green-400'
                                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className={`text-sm font-medium font-cairo ${selectedServiceTypes.includes('sell')
                                                        ? 'text-green-700 dark:text-green-300 font-semibold'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {filterSummary.byServiceType?.sell || 0} بيع
                                                    </span>
                                                </div>
                                            )}

                                            {/* Status Breakdown - Only show if status filters are active */}
                                            {filterSummary.byStatus && Object.keys(filterSummary.byStatus).length > 0 && (
                                                <>
                                                    {selectedStatuses.map((status) => {
                                                        const count = filterSummary.byStatus[status] || 0;
                                                        const statusConfig = {
                                                            'PENDING': { icon: <Bell className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />, label: 'قيد الانتظار', color: 'yellow' },
                                                            'CONFIRMED': { icon: <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />, label: 'مؤكد', color: 'blue' },
                                                            'IN_PROCESS': { icon: <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />, label: 'قيد المعالجة', color: 'orange' },
                                                            'READY_FOR_DISPATCH': { icon: <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />, label: 'جاهز للإرسال', color: 'purple' },
                                                            'SENT': { icon: <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />, label: 'مرسل', color: 'purple' },
                                                            'DELIVERED': { icon: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />, label: 'تم التسليم', color: 'green' },
                                                            'RETURNED': { icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />, label: 'مرتجع', color: 'amber' },
                                                            'COMPLETED': { icon: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />, label: 'مكتمل', color: 'green' },
                                                            'CANCELLED': { icon: <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />, label: 'ملغي', color: 'red' }
                                                        };
                                                        const config = statusConfig[status];
                                                        if (!config) return null;

                                                        return (
                                                            <div key={status} className="flex items-center gap-2">
                                                                {config.icon}
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                                    {count} {config.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            )}

                                            {/* Date Range Indicator */}
                                            {(datePreset !== 'all' || startDate || endDate) && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo">
                                                        {datePreset === 'today' ? 'اليوم' :
                                                            datePreset === 'yesterday' ? 'أمس' :
                                                                datePreset === 'lastWeek' ? 'آخر 7 أيام' :
                                                                    datePreset === 'last30Days' ? 'آخر 30 يوم' :
                                                                        datePreset === 'thisMonth' ? 'هذا الشهر' :
                                                                            datePreset === 'custom' && startDate && endDate ? `${startDate} - ${endDate}` :
                                                                                datePreset === 'custom' ? 'مخصص' : 'الكل'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Left side - Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            {/* Export to Excel Button */}
                                            <button
                                                onClick={handleExportToExcel}
                                                className="flex items-center gap-2 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 font-cairo bg-white dark:bg-green-900/30 px-3 py-2 rounded-lg border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/40 transition-all duration-200"
                                            >
                                                <FileSpreadsheet className="w-4 h-4" />
                                                <span>تصدير Excel</span>
                                            </button>

                                            {/* Clear Filters Button */}
                                            <button
                                                onClick={handleClearAllFilters}
                                                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-cairo bg-white dark:bg-blue-900/30 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all duration-200"
                                            >
                                                <X className="w-4 h-4" />
                                                <span>مسح البحث</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Internal Mode - Table - full width, same horizontal padding as top bar */}
                            {searchMode === 'internal' && (
                                <div className="w-full">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                                        <div className="overflow-x-auto scrollbar-custom [scrollbar-gutter:stable]">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
                                                        <th className="px-2 py-2 text-center text-xs font-cairo font-bold text-gray-700 dark:text-gray-300">
                                                            نوع الخدمة
                                                        </th>
                                                        <th className="px-2 py-2 text-center text-xs font-cairo font-bold text-gray-700 dark:text-gray-300">
                                                            <div className="inline-flex w-full items-center justify-center gap-1.5" dir="rtl">
                                                                <span>رقم التذكرة</span>
                                                                <Hash className="h-3.5 w-3.5 shrink-0 text-gray-500 opacity-90 dark:text-gray-400" aria-hidden />
                                                            </div>
                                                        </th>
                                                        <th className="px-2 py-2 text-center text-xs font-cairo font-bold text-gray-700 dark:text-gray-300">
                                                            <div className="inline-flex w-full items-center justify-center gap-1.5" dir="rtl">
                                                                <span>العميل</span>
                                                                <User className="h-3.5 w-3.5 shrink-0 text-gray-500 opacity-90 dark:text-gray-400" aria-hidden />
                                                            </div>
                                                        </th>
                                                        <th className="px-2 py-2 text-center text-xs font-cairo font-bold text-gray-700 dark:text-gray-300">
                                                            <div className="inline-flex w-full items-center justify-center gap-1.5" dir="rtl">
                                                                <span>الحالة</span>
                                                                <Activity className="h-3.5 w-3.5 shrink-0 text-gray-500 opacity-90 dark:text-gray-400" aria-hidden />
                                                            </div>
                                                        </th>
                                                        <th className="px-2 py-2 text-center text-xs font-cairo font-bold text-gray-700 dark:text-gray-300">
                                                            <div className="inline-flex w-full min-w-0 items-center justify-center gap-1.5" dir="rtl">
                                                                <span className="truncate">التتبع الأصلي</span>
                                                                <Truck className="h-3.5 w-3.5 shrink-0 text-gray-500 opacity-90 dark:text-gray-400" aria-hidden />
                                                            </div>
                                                        </th>
                                                        <th className="px-2 py-2 text-center text-xs font-cairo font-bold text-gray-700 dark:text-gray-300">
                                                            <div className="inline-flex w-full items-center justify-center gap-1.5" dir="rtl">
                                                                <span>المنتجات</span>
                                                                <Package className="h-3.5 w-3.5 shrink-0 text-gray-500 opacity-90 dark:text-gray-400" aria-hidden />
                                                            </div>
                                                        </th>
                                                        <th className="px-2 py-2 text-center text-xs font-cairo font-bold text-gray-700 dark:text-gray-300">
                                                            <div className="inline-flex w-full items-center justify-center gap-1.5" dir="rtl">
                                                                <span>التاريخ</span>
                                                                <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-500 opacity-90 dark:text-gray-400" aria-hidden />
                                                            </div>
                                                        </th>
                                                        <th className="px-2 py-2 text-center text-xs font-cairo font-bold text-gray-700 dark:text-gray-300">
                                                            <div className="inline-flex w-full items-center justify-center gap-1.5" dir="rtl">
                                                                <span>الإجراءات</span>
                                                                <Settings className="h-3.5 w-3.5 shrink-0 text-gray-500 opacity-90 dark:text-gray-400" aria-hidden />
                                                            </div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {(() => {
                                                        // Show loading state
                                                        if (isLoadingTickets) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan="8" className="px-4 py-8 text-center">
                                                                        <div className="flex flex-col items-center justify-center space-y-2">
                                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                                            <span className="text-sm text-gray-600 dark:text-gray-400 font-cairo">جاري تحميل التذاكر...</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        // Show empty state
                                                        if (displayedTickets.length === 0) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan="8" className="px-4 py-8 text-center">
                                                                        <div className="flex flex-col items-center justify-center space-y-2">
                                                                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                            <span className="text-sm text-gray-600 dark:text-gray-400 font-cairo">لا توجد تذاكر حالياً</span>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        // Render tickets
                                                        return displayedTickets.map((ticket) => {
                                                            const canon = normalizeServiceTypeOrFallback(ticket.service_type, { fallback: 'replacement' });
                                                            const shortTypeLabel = getServiceTypeLabelAr(ticket.service_type, { short: true });
                                                            const TypeIcon = SERVICE_TYPE_ICONS[canon] || Package;
                                                            const typeChipClass =
                                                                getServiceTypeHeaderIconClass(ticket.service_type) ||
                                                                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
                                                            return (
                                                            <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                <td className="px-2 py-2">
                                                                    <div className="flex items-center justify-start gap-2 min-w-0 cursor-default">
                                                                        <div
                                                                            className={`flex-shrink-0 inline-flex items-center justify-center rounded-md p-1 ${typeChipClass}`}
                                                                        >
                                                                            <TypeIcon className="h-4 w-4 shrink-0" aria-hidden />
                                                                        </div>
                                                                        <span className="text-xs font-cairo font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[5.5rem] sm:max-w-none">
                                                                            {shortTypeLabel}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2">
                                                                    <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100">
                                                                        {ticket.ticket_number.split('-').pop()}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-2">
                                                                    <div className="flex flex-col items-start">
                                                                        <span className="text-xs font-cairo font-semibold text-gray-900 dark:text-gray-100">
                                                                            {ticket.customer_name || 'غير محدد'}
                                                                        </span>
                                                                        {ticket.phone && (
                                                                            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400" dir="ltr">
                                                                                {formatPhoneForLocalDisplay(ticket.phone)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-cairo font-medium ${getServiceStatusBadgeColor(ticket.status?.toLowerCase())}`}>
                                                                        {getServiceStatusLabel(ticket.status?.toLowerCase())}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-2">
                                                                    <span className="text-xs font-mono font-medium text-gray-900 dark:text-gray-100">
                                                                        {ticket.original_tracking || '-'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-2">
                                                                    {renderItemsColumn(ticket)}
                                                                </td>
                                                                <td className="px-2 py-2">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400 font-cairo">
                                                                        {new Date(ticket.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-2">
                                                                    <div className="flex items-center justify-center">
                                                                        <div className="flex items-center space-x-1 space-x-reverse">
                                                                            {/* View Button - Always available */}
                                                                            <button
                                                                                onClick={() => {
                                                                                    setViewingTicket(ticket);
                                                                                    setShowViewModal(true);
                                                                                }}
                                                                                className="flex items-center justify-center w-8 h-8 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-all duration-200 hover:scale-105 border border-blue-200 dark:border-blue-800"
                                                                                title="عرض التفاصيل"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                                </svg>
                                                                            </button>

                                                                            {/* Navigate to HubPage Button - Hide if ticket has 'confirm' action */}
                                                                            {!ticket.available_actions.includes('confirm') && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        // Navigate to HubPage with serviceId parameter
                                                                                        // HubPage will automatically:
                                                                                        // 1. Fetch the ticket details
                                                                                        // 2. Select the correct tab based on service_type
                                                                                        // 3. Highlight the ticket
                                                                                        // 4. Scroll to it
                                                                                        navigate(`/?serviceId=${ticket.id}`);
                                                                                        toast.loading('جاري الانتقال إلى طلب الخدمة...', { id: `nav-${ticket.id}` });
                                                                                    }}
                                                                                    className="flex items-center justify-center w-8 h-8 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg transition-all duration-200 hover:scale-105 border border-purple-200 dark:border-purple-800"
                                                                                    title="الانتقال إلى صفحة المركز"
                                                                                >
                                                                                    <ExternalLink className="w-4 h-4" />
                                                                                </button>
                                                                            )}

                                                                            {/* Available Actions Pills */}
                                                                            {ticket.available_actions && Array.isArray(ticket.available_actions) && ticket.available_actions.length > 0 ? (
                                                                                <>
                                                                                    {/* Confirm Action */}
                                                                                    {ticket.available_actions.includes('confirm') && (
                                                                                        <button
                                                                                            onClick={async () => {
                                                                                                const actionKey = `confirm-${ticket.id}`;
                                                                                                setLoadingActions(prev => new Set(prev).add(actionKey));

                                                                                                try {
                                                                                                    await handleServiceActionStatusChange(ticket.id, 'confirm');
                                                                                                } finally {
                                                                                                    setLoadingActions(prev => {
                                                                                                        const newSet = new Set(prev);
                                                                                                        newSet.delete(actionKey);
                                                                                                        return newSet;
                                                                                                    });
                                                                                                }
                                                                                            }}
                                                                                            disabled={loadingActions.has(`confirm-${ticket.id}`)}
                                                                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 border ${loadingActions.has(`confirm-${ticket.id}`)
                                                                                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-400 dark:text-emerald-600 cursor-not-allowed'
                                                                                                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:scale-105 cursor-pointer'
                                                                                                } border-emerald-200 dark:border-emerald-800`}
                                                                                            title="تأكيد"
                                                                                        >
                                                                                            {loadingActions.has(`confirm-${ticket.id}`) ? (
                                                                                                <svg className="w-3 h-3 ml-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                                                </svg>
                                                                                            ) : (
                                                                                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                                </svg>
                                                                                            )}
                                                                                            {loadingActions.has(`confirm-${ticket.id}`) ? 'جاري التأكيد...' : 'تأكيد'}
                                                                                        </button>
                                                                                    )}

                                                                                    {/* Mark Ready Action (for maintenance completion-ready sub-tab) */}
                                                                                    {ticket.available_actions.includes('mark_ready') && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setWorkflowActionType('mark_ready');
                                                                                                setWorkflowActionTicket(ticket);
                                                                                                setShowWorkflowModal(true);
                                                                                            }}
                                                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 border bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:scale-105 cursor-pointer border-blue-200 dark:border-blue-800"
                                                                                            title="جاهز للإرسال"
                                                                                        >
                                                                                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                            </svg>
                                                                                            جاهز للإرسال
                                                                                        </button>
                                                                                    )}

                                                                                    {/* Mark Sent Action (for maintenance ready-to-ship sub-tab) */}
                                                                                    {ticket.available_actions.includes('mark_sent') && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setWorkflowActionType('mark_sent');
                                                                                                setWorkflowActionTicket(ticket);
                                                                                                setShowWorkflowModal(true);
                                                                                            }}
                                                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 border bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:scale-105 cursor-pointer border-blue-200 dark:border-blue-800"
                                                                                            title="تأكيد الإرسال"
                                                                                        >
                                                                                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                                                            </svg>
                                                                                            تأكيد الإرسال
                                                                                        </button>
                                                                                    )}

                                                                                    {/* Mark Delivered Action (for maintenance sent sub-tab) */}
                                                                                    {ticket.available_actions.includes('mark_delivered') && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setWorkflowActionType('mark_delivered');
                                                                                                setWorkflowActionTicket(ticket);
                                                                                                setShowWorkflowModal(true);
                                                                                            }}
                                                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 border bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 hover:scale-105 cursor-pointer border-green-200 dark:border-green-800"
                                                                                            title="تأكيد التسليم"
                                                                                        >
                                                                                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                            </svg>
                                                                                            تأكيد التسليم
                                                                                        </button>
                                                                                    )}

                                                                                    {/* Cancel Action */}
                                                                                    {ticket.available_actions.includes('cancel') && (
                                                                                        <button
                                                                                            onClick={async () => {
                                                                                                const actionKey = `cancel-${ticket.id}`;
                                                                                                if (window.confirm('هل أنت متأكد من إلغاء هذه التذكرة؟')) {
                                                                                                    setLoadingActions(prev => new Set(prev).add(actionKey));

                                                                                                    try {
                                                                                                        const result = await cancelTicket(ticket.id, {
                                                                                                            user_id: userInfo?.id ?? 1,
                                                                                                            reason: ''
                                                                                                        });

                                                                                                        if (result) {
                                                                                                            // 1. Optimistic removal - instant UI feedback
                                                                                                            setFilteredTickets(prev => prev.filter(t => t.id !== ticket.id && t._id !== ticket.id));

                                                                                                            // 2. Immediate count refresh for instant badge updates
                                                                                                            fetchBackendCounts();

                                                                                                            // 3. Delayed refresh to ensure backend processed (1500ms)
                                                                                                            setTimeout(async () => {
                                                                                                                await fetchBackendCounts();
                                                                                                                const serviceTypeTabsRefresh = ['replacement', 'maintenance', 'return', 'sell'];
                                                                                                                const isServiceTypeTabRefresh = serviceTypeTabsRefresh.includes(activeStatus);
                                                                                                                const tabRefresh = isServiceTypeTabRefresh ? activeStatus : activeStatus;
                                                                                                                const subTabRefresh = isServiceTypeTabRefresh ? activeSubTab : null;
                                                                                                                await fetchTickets(tabRefresh, subTabRefresh);
                                                                                                            }, 1500);

                                                                                                            toast.success('تم إلغاء التذكرة بنجاح');
                                                                                                        } else {
                                                                                                            toast.error('حدث خطأ في إلغاء التذكرة');
                                                                                                        }
                                                                                                    } catch (error) {
                                                                                                        toast.error('حدث خطأ في إلغاء التذكرة');
                                                                                                    } finally {
                                                                                                        setLoadingActions(prev => {
                                                                                                            const newSet = new Set(prev);
                                                                                                            newSet.delete(actionKey);
                                                                                                            return newSet;
                                                                                                        });
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            disabled={loadingActions.has(`cancel-${ticket.id}`)}
                                                                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 border ${loadingActions.has(`cancel-${ticket.id}`)
                                                                                                ? 'bg-red-100 dark:bg-red-900/40 text-red-400 dark:text-red-600 cursor-not-allowed'
                                                                                                : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 hover:scale-105 cursor-pointer'
                                                                                                } border-red-200 dark:border-red-800`}
                                                                                            title="إلغاء"
                                                                                        >
                                                                                            {loadingActions.has(`cancel-${ticket.id}`) ? (
                                                                                                <svg className="w-3 h-3 ml-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                                                </svg>
                                                                                            ) : (
                                                                                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                                </svg>
                                                                                            )}
                                                                                            {loadingActions.has(`cancel-${ticket.id}`) ? 'جاري الإلغاء...' : 'إلغاء'}
                                                                                        </button>
                                                                                    )}
                                                                                </>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Pagination - Show if there are more items than the limit */}
                                        {ticketsPagination && ticketsPagination.total > (ticketsPagination.limit || 20) && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => handlePageChange(Math.max(1, Math.floor(ticketsPagination.offset / (ticketsPagination.limit || 20))))}
                                                        disabled={ticketsPagination.offset === 0}
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed font-cairo transition-colors flex items-center gap-2"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                        <span>السابق</span>
                                                    </button>

                                                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 font-cairo">
                                                        صفحة {Math.floor(ticketsPagination.offset / (ticketsPagination.limit || 20)) + 1} من {Math.ceil(ticketsPagination.total / (ticketsPagination.limit || 20))}
                                                    </div>

                                                    <button
                                                        onClick={() => handlePageChange(Math.floor(ticketsPagination.offset / (ticketsPagination.limit || 20)) + 2)}
                                                        disabled={!ticketsPagination.has_more}
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed font-cairo transition-colors flex items-center gap-2"
                                                    >
                                                        <span>التالي</span>
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* View Details Modal */}
                            <Suspense fallback={null}>
                                {showViewModal && (
                                    <ServiceModalViewer
                                        isOpen={showViewModal}
                                        onClose={() => setShowViewModal(false)}
                                        ticket={viewingTicket}
                                    />
                                )}
                            </Suspense>
                        </div>
                    </div>
                </div>
            </div>


            {/* Unified Service Action Modal */}
            <UnifiedServiceActionModal
                isOpen={showUnifiedModal}
                onClose={handleUnifiedModalClose}
                actionType={selectedAction ? null : selectedActionType} // Use actionType for creation, null for workflow
                customerData={customerData}
                selectedOrder={selectedOrder}
                onSuccess={handleUnifiedModalSuccess}
                existingServiceAction={selectedAction ? filteredTickets.find(a => a.id === selectedAction) : null}
                workflowAction={selectedAction}
            />

            {/* Service Action Confirmation Modal */}
            <Suspense fallback={<ModalLoadingFallback message="جاري تحميل نافذة التأكيد..." />}>
                {showConfirmationModal && (
                    <ServiceActionConfirmationModal
                        isOpen={showConfirmationModal}
                        onClose={handleConfirmationModalClose}
                        onSuccess={handleConfirmationModalSuccess}
                        action={actionToConfirm}
                        targetStatus="confirm"
                    />
                )}
            </Suspense>

            {/* Workflow Action Modal (for mark_ready, etc.) */}
            <Suspense fallback={<ModalLoadingFallback message="جاري تحميل نافذة الإجراء..." />}>
                {workflowActionTicket && (
                    <ServiceWorkflowActionModal
                        isOpen={showWorkflowModal}
                        onClose={() => {
                            setShowWorkflowModal(false);
                            setWorkflowActionType(null);
                            setWorkflowActionTicket(null);
                        }}
                        onSuccess={async (result) => {
                            // Refresh backend counts and then fetch current tab
                            await fetchBackendCounts();
                            const serviceTypeTabs = ['replacement', 'maintenance', 'return', 'sell'];
                            const isServiceTypeTab = serviceTypeTabs.includes(activeStatus);
                            const tab = isServiceTypeTab ? activeStatus : activeStatus;
                            const subTab = isServiceTypeTab ? activeSubTab : null;
                            await fetchTickets(tab, subTab);

                            toast.success('تم تنفيذ العملية بنجاح');
                            setShowWorkflowModal(false);
                            setWorkflowActionType(null);
                            setWorkflowActionTicket(null);
                        }}
                        action={workflowActionTicket}
                        actionType={workflowActionType}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default TicketsPage;
