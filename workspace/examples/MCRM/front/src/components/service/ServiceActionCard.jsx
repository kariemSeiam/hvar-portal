/**
 * Enhanced ServiceActionCard Component
 * Supports all service action operations including scanning and completion confirmation
 */

import { memo, Fragment, useState, useCallback, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import {
    AlertTriangle, Clock, CheckCircle, Wrench, Package, Settings, RotateCcw,
    RefreshCw, Eye, Truck, User, Phone, DollarSign, FileText, X,
    QrCode, Loader, ThumbsUp, ChevronDown, Calendar, Info, Hash, Trash2,
    Send, PackageCheck
} from 'lucide-react';
import { ServiceStatusBadge } from '../ui';
import {
    calculatePriority,
    getAvailableActions,
    getWorkflowDefinition
} from '../../utils/service/workflow';
import {
    getActionTypeConfig,
    SERVICE_ACTION_STATUSES
} from '../../utils/service/utils';

// Lazy load heavy modals for better performance
const ServiceActionConfirmationModal = lazy(() => import('../modals/ServiceActionConfirmationModal'));
const ServiceModalViewer = lazy(() => import('../modals/ServiceModalViewer'));
const ServiceWorkflowActionModal = lazy(() => import('../modals/ServiceWorkflowActionModal'));

import ServiceCancelModal from '../modals/ServiceCancelModal';

// Loading fallback for lazy modals
import ModalLoadingFallback from '../ui/ModalLoadingFallback';
import ServiceDeleteModal from '../modals/ServiceDeleteModal';
import ReturnClassificationModal from '../modals/ClassificationModal';
import { getRelativeTime, formatGregorianDate } from '../../utils/core/date';
import { getSafeNotesDisplay } from '../../utils/ui/notes';
import { formatPhoneForLocalDisplay } from '../../utils/core/phone';
import { ServiceActionStatus } from '../../utils/service/types';

// Icon map at module level — avoids recreating on every render
const ICON_MAP = {
    'AlertTriangle': AlertTriangle,
    'Clock': Clock,
    'CheckCircle': CheckCircle,
    'Wrench': Wrench,
    'Package': Package,
    'Settings': Settings,
    'RotateCcw': RotateCcw,
    'RefreshCw': RefreshCw,
    'Eye': Eye,
    'Truck': Truck,
    'QrCode': QrCode,
    'Loader': Loader,
    'ThumbsUp': ThumbsUp,
    'Calendar': Calendar,
    'Info': Info,
    'X': X,
    'Trash2': Trash2,
    'Scan': QrCode,
    'ScanLine': QrCode
};
const getIconComponent = (iconName) => ICON_MAP[iconName] || CheckCircle;

// Pure helpers at module level — no per-render allocation
const STATUS_COLOR_MAP = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', bgFull: 'bg-blue-500' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', bgFull: 'bg-green-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bgFull: 'bg-orange-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', bgFull: 'bg-amber-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', bgFull: 'bg-purple-500' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', bgFull: 'bg-red-500' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-600 dark:text-gray-400', bgFull: 'bg-gray-500' }
};
const getStatusColorClasses = (color, variant = 'bg') => STATUS_COLOR_MAP[color] || STATUS_COLOR_MAP.gray;

const getPriorityBorderColor = (priorityLevel) => {
    if (priorityLevel === 'high') return 'border-2 border-red-500 dark:border-red-600';
    if (priorityLevel === 'medium') return 'border-2 border-amber-500 dark:border-amber-600';
    if (priorityLevel === 'low') return 'border-2 border-green-500 dark:border-green-600';
    return 'border-2 border-gray-400 dark:border-gray-500';
};

/**
 * Enhanced ServiceActionCard Component
 * Supports all service action operations including scanning and completion confirmation
 */
const ServiceActionCardInner = ({
    action,
    className = "",
    highlighted = false,
    children,
    onAction = () => { },
    onStatusChange = () => { },
    onRefresh = () => { }
}) => {
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showDisplayModal, setShowDisplayModal] = useState(false);
    const [showClassificationModal, setShowClassificationModal] = useState(false);
    const [showWorkflowModal, setShowWorkflowModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [workflowActionType, setWorkflowActionType] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [expandedNotes, setExpandedNotes] = useState(new Set());
    const [isNotesExpanded, setIsNotesExpanded] = useState(false);
    const [showItemsTooltip, setShowItemsTooltip] = useState(false);
    const [itemsTooltipData, setItemsTooltipData] = useState({ direction: '', items: [] });
    const [itemsTooltipPosition, setItemsTooltipPosition] = useState({ x: 0, y: 0 });
    const [hoveredStepIndex, setHoveredStepIndex] = useState(null);
    const [hoveredStepPosition, setHoveredStepPosition] = useState({ x: 0, y: 0 });
    const dropdownRef = useRef(null);
    const stepTooltipRef = useRef(null);
    const stepTooltipTimeoutRef = useRef(null);
    const itemsTooltipRef = useRef(null);

    // Normalize action type from API format (service_type) to component format (action_type)
    const actionType = action.action_type || action.service_type;
    const actionConfig = getActionTypeConfig(actionType);

    // Normalize status to lowercase for consistent processing
    const normalizedStatus = action.status ? action.status.toLowerCase() : 'pending';
    const priority = calculatePriority(action);

    // Close dropdown and tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }

            // Close items tooltip when clicking outside
            if (showItemsTooltip) {
                const isClickOnChip = event.target.closest('button[data-items-chip]');
                const isClickOnTooltip = itemsTooltipRef.current && itemsTooltipRef.current.contains(event.target);

                if (!isClickOnChip && !isClickOnTooltip) {
                    setShowItemsTooltip(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showItemsTooltip]);

    // Close items tooltip on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (showItemsTooltip) {
                setShowItemsTooltip(false);
            }
        };

        if (showItemsTooltip) {
            window.addEventListener('scroll', handleScroll, true);
            document.addEventListener('scroll', handleScroll, true);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [showItemsTooltip]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (stepTooltipTimeoutRef.current) {
                clearTimeout(stepTooltipTimeoutRef.current);
            }
        };
    }, []);

    const ActionIcon = getIconComponent(actionConfig.icon);

    // Get available actions (memoized) — prioritize backend available_actions, fallback to workflow
    const availableActionsList = useMemo(() => {
        // Debug logging removed for production

        // First, try to use available_actions from backend (tickets system)
        if (action.available_actions && Array.isArray(action.available_actions)) {
            // Debug logging removed for production

            // If action is CANCELLED, show view and delete actions
            const statusUpper = action.status?.toUpperCase();
            if (statusUpper === 'CANCELLED' || action.status === 'cancelled' || action.status === 'ملغاة') {
                // Debug logging removed for production
                return [
                    { id: 'view', label: 'عرض', icon: 'Eye', color: 'gray', variant: 'secondary' },
                    { id: 'delete', label: 'حذف', icon: 'Trash2', color: 'red', variant: 'danger' }
                ];
            }

            // If action is COMPLETED, show limited actions (view and completion confirmation if needed)
            if (statusUpper === 'COMPLETED' || action.status === 'completed' || action.status === 'مكتملة') {
                // Debug logging removed for production
                const actions = [
                    { id: 'view', label: 'عرض', icon: 'Eye', color: 'gray', variant: 'secondary' }
                ];

                // Add completion confirmation if needed
                if (action.action_data &&
                    action.action_data.pending_completion_confirmation &&
                    !action.completion_confirmed) {
                    actions.push({
                        id: 'confirm_completion',
                        label: 'تأكيد الإكمال',
                        icon: 'ThumbsUp',
                        color: 'green',
                        variant: 'primary'
                    });
                }

                return actions;
            }

            const mappedActions = action.available_actions.map(backendAction => {
                // Convert backend action format to frontend format
                const actionMap = {
                    'confirm': { id: 'confirm', label: 'تأكيد', icon: 'CheckCircle', color: 'blue', variant: 'primary' },
                    'cancel': { id: 'cancel', label: 'إلغاء', icon: 'X', color: 'red', variant: 'danger' },
                    'view': { id: 'view', label: 'عرض', icon: 'Eye', color: 'gray', variant: 'secondary' },
                    'start_preparation': { id: 'start_preparation', label: 'بدء التحضير', icon: 'Package', color: 'orange', variant: 'primary' },
                    'start_maintenance': { id: 'start_maintenance', label: 'بدء الصيانة', icon: 'Wrench', color: 'purple', variant: 'primary' },
                    'complete_maintenance': { id: 'complete_maintenance', label: 'إكمال الصيانة', icon: 'CheckCircle', color: 'green', variant: 'primary' },
                    'mark_ready': { id: 'mark_ready', label: 'جاهز للإرسال', icon: 'Truck', color: 'blue', variant: 'primary' },
                    'ready_for_dispatch': { id: 'ready_for_dispatch', label: 'جاهز للشحن', icon: 'Truck', color: 'blue', variant: 'primary' },
                    'scan_outbound': { id: 'scan_outbound', label: 'إرسال', icon: 'QrCode', color: 'blue', variant: 'primary' },
                    'scan_inbound': { id: 'scan_inbound', label: 'الاستلام', icon: 'QrCode', color: 'green', variant: 'primary' },
                    'mark_delivered': { id: 'mark_delivered', label: 'تأكيد التسليم', icon: 'CheckCircle', color: 'green', variant: 'primary' },
                    'confirm_sent': { id: 'confirm_sent', label: 'تأكيد التسليم', icon: 'CheckCircle', color: 'green', variant: 'primary' },
                    'validate_items': { id: 'validate_items', label: 'فحص المنتجات', icon: 'Eye', color: 'amber', variant: 'primary' },
                    'complete': { id: 'complete', label: 'إتمام', icon: 'CheckCircle', color: 'green', variant: 'primary' }
                };
                return actionMap[backendAction] || { id: backendAction, label: backendAction, icon: 'CheckCircle', color: 'blue', variant: 'primary' };
            }).filter(mappedAction => {
                // Filter out scan actions and confirm
                if (mappedAction.id === 'scan_outbound' || mappedAction.id === 'scan_inbound' || mappedAction.id === 'confirm') {
                    return false;
                }
                // For sell tickets in SENT status, filter out validate_items (confirm_sent does the same job)
                const currentStatus = action.status?.toUpperCase();
                if (actionType === 'sell' && currentStatus === 'SENT' && mappedAction.id === 'validate_items') {
                    return false;
                }
                return true;
            });
            // Debug logging removed for production
            return mappedActions;
        }

        // Fallback to workflow system if no backend actions
        if (import.meta.env.DEV) {
            console.log('🔄 Using workflow system fallback for action:', action.id, 'status:', action.status);
        }

        // If action is CANCELLED, show view and delete actions
        const statusUpper = action.status?.toUpperCase();
        if (statusUpper === 'CANCELLED' || action.status === 'cancelled' || action.status === 'ملغاة') {
            if (import.meta.env.DEV) console.log('🚫 CANCELLED status detected in workflow fallback');
            return [
                { id: 'view', label: 'عرض', icon: 'Eye', color: 'gray', variant: 'secondary' },
                { id: 'delete', label: 'حذف', icon: 'Trash2', color: 'red', variant: 'danger' }
            ];
        }

        // If action is COMPLETED, show limited actions (view and completion confirmation if needed)
        if (statusUpper === 'COMPLETED' || action.status === 'completed' || action.status === 'مكتملة') {
            if (import.meta.env.DEV) console.log('✅ COMPLETED status detected in workflow fallback');
            const actions = [
                { id: 'view', label: 'عرض', icon: 'Eye', color: 'gray', variant: 'secondary' }
            ];

            // Add completion confirmation if needed
            if (action.action_data &&
                action.action_data.pending_completion_confirmation &&
                !action.completion_confirmed) {
                actions.push({
                    id: 'confirm_completion',
                    label: 'تأكيد الإكمال',
                    icon: 'ThumbsUp',
                    color: 'green',
                    variant: 'primary'
                });
            }

            return actions;
        }

        if (!action.status) {
            // If no status but we have a ticket, provide basic actions
            if (action.type || action.id) {
                return [];
            }
            return [];
        }

        const standardActions = getAvailableActions(action);

        // Add completion confirmation when appropriate
        // Check if action has pending_completion_confirmation flag and is completed
        if (action.status === ServiceActionStatus.COMPLETED &&
            action.action_data &&
            action.action_data.pending_completion_confirmation &&
            !action.completion_confirmed) {
            standardActions.push({
                id: 'confirm_completion',
                label: 'تأكيد الإكمال',
                icon: 'ThumbsUp',
                color: 'green',
                variant: 'primary'
            });
        }

        if (import.meta.env.DEV) console.log('✅ Final available actions for action:', action.id, standardActions);
        return standardActions.filter(a => a.id !== 'scan_outbound' && a.id !== 'scan_inbound' && a.id !== 'confirm');
    }, [action, actionType]);

    // Simple data extraction
    const customerName = action.customer_name || action.customer_full_name ||
        `${action.customer_first_name || ''} ${action.customer_last_name || ''}`.trim() ||
        'غير محدد';

    const customerPhone = action.phone || action.customer_phone || 'غير محدد';
    const ticketNumber = action.ticket_number || action.ticketNumber || null;
    const originalTracking = action.original_tracking || action.original_tracking_number || 'غير محدد';
    const newTrackingSend = action.new_tracking_send;
    const newTrackingReceive = action.new_tracking_receive;
    const costAdjustment = action.cost_adjustment ? parseFloat(action.cost_adjustment) :
        (action.cost ? parseFloat(action.cost) : null);
    const notes = getSafeNotesDisplay(action.notes);
    const maxNotesLength = 85; // Maximum characters to show before "Read More"
    const shouldTruncateNotes = notes && notes.length > maxNotesLength;

    // Handle action click
    const handleActionClick = useCallback((actionId) => {
        if (import.meta.env.DEV) console.log(`🖱️ Action clicked: ${actionId} for action ${action.id || action._id}`);

        if (actionId === 'view') {
            setShowDisplayModal(true);
            onAction('view', action);
            return;
        }

        if (actionId === 'refresh') {
            onRefresh();
            return;
        }

        // For validate_items action, open classification modal
        if (actionId === 'validate_items') {
            if (import.meta.env.DEV) console.log(`📋 Opening classification modal for action ${action.id || action._id}`);
            setShowClassificationModal(true);
            return;
        }

        // For confirm actions, open confirmation modal
        if (actionId === 'confirm') {
            if (import.meta.env.DEV) console.log(`📋 Opening confirmation modal for confirm action ${action.id || action._id}`);
            setSelectedAction('confirm');
            setShowConfirmationModal(true);
            return;
        }

        // For cancel action, open cancel modal
        if (actionId === 'cancel') {
            if (import.meta.env.DEV) console.log(`📋 Opening cancel modal for action ${action.id || action._id}`);
            setShowCancelModal(true);
            return;
        }

        // For delete action, open delete modal
        if (actionId === 'delete') {
            if (import.meta.env.DEV) console.log(`🗑️ Opening delete modal for action ${action.id || action._id}`);
            setShowDeleteModal(true);
            return;
        }

        // For workflow actions, open workflow modal
        const workflowActions = ['mark_delivered', 'confirm_sent', 'start_maintenance', 'complete_maintenance', 'mark_ready', 'ready_for_dispatch', 'start_preparation'];
        if (workflowActions.includes(actionId)) {
            if (import.meta.env.DEV) console.log(`📋 Opening workflow modal for action ${actionId}`);
            setWorkflowActionType(actionId);
            setShowWorkflowModal(true);
            return;
        }

        // For all other actions, show confirmation modal
        setSelectedAction(actionId);
        setShowConfirmationModal(true);
        if (import.meta.env.DEV) console.log(`📋 Opening confirmation modal for action ${actionId}`);
    }, [action, onAction, onRefresh, onStatusChange]);

    // Handle confirmation modal success
    const handleConfirmationSuccess = useCallback((result) => {
        const confirmActionType = selectedAction || 'confirm';
        if (import.meta.env.DEV) console.log(`✅ Confirmation completed: ${confirmActionType} for action ${action.id || action._id}`);
        setShowConfirmationModal(false);
        const previousAction = selectedAction;
        setSelectedAction(null);
        onStatusChange(action.id || action._id, previousAction || 'confirm', result);
    }, [action.id, action._id, selectedAction, onStatusChange]);

    // Handle confirmation modal close
    const handleConfirmationClose = useCallback(() => {
        setShowConfirmationModal(false);
        setSelectedAction(null);
    }, []);

    // Handle classification modal success
    const handleClassificationSuccess = useCallback((classificationData) => {
        if (import.meta.env.DEV) console.log(`✅ Classification completed for action ${action.id || action._id}`, classificationData);
        setShowClassificationModal(false);
        onStatusChange(action.id || action._id, 'validate_items', classificationData);
    }, [action.id, action._id, onStatusChange]);

    // Handle classification modal close
    const handleClassificationClose = useCallback(() => {
        setShowClassificationModal(false);
    }, []);

    // Handle workflow modal success
    const handleWorkflowSuccess = useCallback((result) => {
        if (import.meta.env.DEV) console.log(`✅ Workflow action completed for action ${action.id || action._id}`);
        setShowWorkflowModal(false);
        setWorkflowActionType(null);
        onStatusChange(action.id || action._id, workflowActionType, result);
    }, [action.id, action._id, workflowActionType, onStatusChange]);

    // Handle workflow modal close
    const handleWorkflowClose = useCallback(() => {
        setShowWorkflowModal(false);
        setWorkflowActionType(null);
    }, []);

    // Handle cancel modal success
    const handleCancelSuccess = useCallback((result) => {
        if (import.meta.env.DEV) console.log(`✅ Cancel action completed for action ${action.id || action._id}`);
        setShowCancelModal(false);
        onStatusChange(action.id || action._id, 'cancel', result);
    }, [action.id, action._id, onStatusChange]);

    // Handle cancel modal close
    const handleCancelClose = useCallback(() => {
        setShowCancelModal(false);
    }, []);

    // Handle delete modal success
    const handleDeleteSuccess = useCallback((deletedTicketId) => {
        if (import.meta.env.DEV) console.log(`✅ Delete action completed for action ${action.id || action._id}`);
        setShowDeleteModal(false);
        // For delete, we pass the ticket ID to signal removal from UI
        onStatusChange(action.id || action._id, 'delete', { deleted: true, ticket_id: deletedTicketId });
    }, [action.id, action._id, onStatusChange]);

    // Handle delete modal close
    const handleDeleteClose = useCallback(() => {
        setShowDeleteModal(false);
    }, []);

    // Handle notes expansion toggle
    const toggleNotesExpansion = useCallback(() => {
        setIsNotesExpanded(prev => !prev);
    }, []);

    // Get scanning status display from tracking_scans array
    const getScanningStatus = () => {
        const trackingScans = action.tracking_scans || [];

        if (trackingScans.length === 0) {
            return null;
        }

        // Get the most recent scan for each type
        const outboundScan = trackingScans.find(scan => scan.scan_type === 'OUTBOUND_TO_CUSTOMER');
        const inboundScan = trackingScans.find(scan => scan.scan_type === 'INBOUND_FROM_CUSTOMER');
        const deliveredScan = trackingScans.find(scan => scan.scan_type === 'delivered');

        const scanItems = [];
        if (outboundScan) scanItems.push({ type: 'outbound', scan: outboundScan, label: 'إرسال', color: 'blue' });
        if (inboundScan) scanItems.push({ type: 'inbound', scan: inboundScan, label: 'الاستلام', color: 'green' });
        if (deliveredScan) scanItems.push({ type: 'delivered', scan: deliveredScan, label: 'تم التسليم', color: 'purple' });

        if (scanItems.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-1.5 items-center">
                {scanItems.map((item) => (
                    <div
                        key={item.type}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 min-w-fit shadow-sm ${item.color === 'blue'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : item.color === 'green'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            }`}
                    >
                        {item.type === 'delivered' ? (
                            <CheckCircle className="w-3 h-3 flex-shrink-0" />
                        ) : (
                            <QrCode className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span className="whitespace-nowrap">{item.label}</span>
                        <span className="text-[9px] opacity-80 whitespace-nowrap">{getRelativeTime(item.scan.created_at)}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Get completion confirmation status
    const getCompletionStatus = () => {
        if (!action.completion_confirmed && (!action.action_data || !action.action_data.pending_completion_confirmation)) {
            return null;
        }

        if (action.completion_confirmed) {
            return (
                <div className="mt-2 text-xs flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <ThumbsUp className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>تم تأكيد الإكمال بواسطة: {action.completion_confirmed_by || 'مدير النظام'}</span>
                </div>
            );
        }

        if (action.action_data && action.action_data.pending_completion_confirmation) {
            return (
                <div className="mt-2 text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>في انتظار تأكيد الإكمال</span>
                </div>
            );
        }

        return null;
    };

    // Get items by direction
    const getItemsByDirection = () => {
        if (!action.items || action.items.length === 0) return { send: [], receive: [] };

        return action.items.reduce((acc, item) => {
            const direction = item.direction?.toLowerCase();
            if (direction === 'send') {
                acc.send.push(item);
            } else if (direction === 'receive') {
                acc.receive.push(item);
            }
            return acc;
        }, { send: [], receive: [] });
    };

    // Get direction chips display
    const getDirectionChips = () => {
        const { send, receive } = getItemsByDirection();

        if (send.length === 0 && receive.length === 0) return null;

        // Special handling for sell tickets - focus on parts, products as hint
        if (actionType === 'sell') {
            // Separate parts and products from send items
            const parts = send.filter(item => item.type === 'part');
            const products = send.filter(item => item.type === 'product');

            return (
                <div className="flex items-start gap-3 flex-wrap">
                    {/* Parts - Main Focus (What's being sold) */}
                    {parts.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                            <Settings className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="text-gray-900 dark:text-gray-100 font-semibold">القطع للبيع:</span>
                                <div className="mt-1">
                                    <button
                                        onClick={(e) => handleItemsChipClick(e, 'send', parts)}
                                        className="flex items-center gap-1.5 sm:gap-1 px-3 sm:px-3 py-2.5 sm:py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-xl text-sm sm:text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer touch-manipulation min-h-[44px] sm:min-h-[36px] border-2 border-green-300 dark:border-green-700 shadow-sm hover:shadow-md"
                                        data-items-chip
                                    >
                                        <Settings className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                                        <span className="font-semibold">قطع ({parts.length})</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products - Hint/Reference (Related to another ticket) */}
                    {products.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="text-gray-500 dark:text-gray-400 text-xs italic">منتج المبيعات:</span>
                                <div className="mt-1">
                                    <button
                                        onClick={(e) => handleItemsChipClick(e, 'send', products)}
                                        className="flex items-center gap-1.5 sm:gap-1 px-2.5 sm:px-2.5 py-1.5 sm:py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800/70 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-normal transition-all duration-200 hover:scale-105 cursor-pointer touch-manipulation border border-gray-200 dark:border-gray-700 shadow-sm"
                                        data-items-chip
                                    >
                                        <Package className="w-3 h-3 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
                                        <span className="text-xs">{products.length} منتج</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Default behavior for other service types
        return (
            <div className="flex items-start gap-2 text-sm">
                <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">المنتجات:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                        {/* Send Chip */}
                        {send.length > 0 && (
                            <button
                                onClick={(e) => handleItemsChipClick(e, 'send', send)}
                                className="flex items-center gap-1.5 sm:gap-1 px-3 sm:px-3 py-2.5 sm:py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-sm sm:text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer touch-manipulation min-h-[44px] sm:min-h-[36px] shadow-sm hover:shadow-md"
                                data-items-chip
                            >
                                <Truck className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span>إرسال</span>
                                <span className="bg-blue-200 dark:bg-blue-800 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                    {send.length}
                                </span>
                            </button>
                        )}

                        {/* Receive Chip */}
                        {receive.length > 0 && (
                            <button
                                onClick={(e) => handleItemsChipClick(e, 'receive', receive)}
                                className="flex items-center gap-1.5 sm:gap-1 px-3 sm:px-3 py-2.5 sm:py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-xl text-sm sm:text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer touch-manipulation min-h-[44px] sm:min-h-[36px] shadow-sm hover:shadow-md"
                                data-items-chip
                            >
                                <Package className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span>استلام</span>
                                <span className="bg-green-200 dark:bg-green-800 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                    {receive.length}
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Get notes display with read more/show less functionality
    const getNotesDisplay = () => {
        if (!notes) return null;

        const displayText = isNotesExpanded ? notes : notes.substring(0, maxNotesLength);
        const needsTruncation = shouldTruncateNotes;

        return (
            <div className="flex items-start gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <span className="text-gray-600 dark:text-gray-400">ملاحظات:</span>
                    <div className="mt-1">
                        <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                            {displayText}
                            {needsTruncation && !isNotesExpanded && '...'}
                        </p>
                        {needsTruncation && (
                            <button
                                onClick={toggleNotesExpansion}
                                className="mt-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium transition-colors duration-200 focus:outline-none focus:underline"
                                aria-label={isNotesExpanded ? 'إظهار أقل' : 'قراءة المزيد'}
                            >
                                {isNotesExpanded ? 'إظهار أقل' : 'قراءة المزيد'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Get action history from action object (if available)
    const actionHistory = action.history || [];

    // Memoize timeline steps — avoids recomputing on every render
    const timelineSteps = useMemo(() => {
        // Get workflow definition based on service type
        const workflow = getWorkflowDefinition(actionType);

        // If status is CANCELLED, show minimal timeline
        const statusUpper = action.status?.toUpperCase();
        if (statusUpper === 'CANCELLED' || action.status === 'cancelled' || action.status === 'ملغاة') {
            return ['pending', 'cancelled'].filter(s => SERVICE_ACTION_STATUSES[s]);
        }

        // Get all statuses that have history data from backend
        const statusesWithHistory = new Set();
        actionHistory.forEach(item => {
            const toStatus = item.to_status?.toLowerCase() || item.new_status?.toLowerCase();
            if (toStatus) {
                statusesWithHistory.add(toStatus);
            }
        });

        // Always include current status even if no history
        const currentStatus = normalizedStatus;
        statusesWithHistory.add(currentStatus);

        // If status is COMPLETED, show timeline based on history
        if (statusUpper === 'COMPLETED' || action.status === 'completed' || action.status === 'مكتملة') {
            // Use workflow states but filter to only show steps with history or current status
            if (workflow && workflow.states) {
                const currentStatusIndex = workflow.states.findIndex(state => state.id === currentStatus);

                if (currentStatusIndex >= 0) {
                    // Get all workflow states up to current status
                    const workflowSteps = workflow.states.slice(0, currentStatusIndex + 1).map(state => state.id);

                    const filtered = workflowSteps.filter(step =>
                        statusesWithHistory.has(step) || step === currentStatus
                    );
                    return filtered.filter(s => SERVICE_ACTION_STATUSES[s]);
                }
            }
            const fallbackSteps = ['pending', 'confirmed', 'in_process', 'completed'];
            return fallbackSteps.filter(step => statusesWithHistory.has(step) || step === currentStatus).filter(s => SERVICE_ACTION_STATUSES[s]);
        }

        // For non-completed statuses, use workflow states but filter by history
        if (workflow && workflow.states) {
            const currentStatusIndex = workflow.states.findIndex(state => state.id === currentStatus);

            if (currentStatusIndex >= 0) {
                // Get all workflow states up to current status
                const workflowSteps = workflow.states.slice(0, currentStatusIndex + 1).map(state => state.id);

                const filtered = workflowSteps.filter(step =>
                    statusesWithHistory.has(step) || step === currentStatus
                );
                return filtered.filter(s => SERVICE_ACTION_STATUSES[s]);
            }
        }
        const fallbackSteps = ['pending', 'confirmed', 'in_process', 'completed'];
        return fallbackSteps.filter(step => statusesWithHistory.has(step) || step === currentStatus).filter(s => SERVICE_ACTION_STATUSES[s]);
    }, [action, actionType, normalizedStatus, actionHistory]);

    // Memoize history by status — avoids filtering/sorting on every timeline step
    const historyByStatus = useMemo(() => {
        const map = {};
        (actionHistory || []).forEach(item => {
            const status = (item.new_status || item.to_status)?.toLowerCase();
            if (status) {
                const existing = map[status];
                if (!existing || new Date(item.created_at) > new Date(existing.created_at)) {
                    map[status] = item;
                }
            }
        });
        return map;
    }, [actionHistory]);

    const getHistoryForStatus = (status) => historyByStatus[status?.toLowerCase()] ?? null;

    // Get timestamp for a specific status from history
    const getStatusTimestamp = (status) => {
        const normalizedStatusLower = status?.toLowerCase();
        const historyItem = actionHistory.find(item => {
            const newStatus = item.new_status?.toLowerCase();
            const toStatus = item.to_status?.toLowerCase();
            const oldStatus = item.old_status?.toLowerCase();
            const fromStatus = item.from_status?.toLowerCase();
            return newStatus === normalizedStatusLower || toStatus === normalizedStatusLower ||
                oldStatus === normalizedStatusLower || fromStatus === normalizedStatusLower;
        });
        return historyItem ? new Date(historyItem.created_at).toLocaleString('ar-EG') : null;
    };

    // Get history data for tooltip
    const getHistoryDataForTooltip = (stepStatus) => {
        const normalizedStepStatus = stepStatus?.toLowerCase();
        const historyItems = actionHistory.filter(item => {
            const newStatus = item.new_status?.toLowerCase();
            const toStatus = item.to_status?.toLowerCase();
            const oldStatus = item.old_status?.toLowerCase();
            const fromStatus = item.from_status?.toLowerCase();
            return newStatus === normalizedStepStatus || toStatus === normalizedStepStatus ||
                oldStatus === normalizedStepStatus || fromStatus === normalizedStepStatus;
        });

        if (historyItems.length === 0) return null;

        return historyItems.map(item => ({
            action: item.action,
            from_status: item.old_status || item.from_status,
            to_status: item.new_status || item.to_status,
            notes: item.notes,
            user_name: item.user_name || item.created_by,
            created_by: item.created_by || item.user_name,
            timestamp: item.created_at,
            action_data: item.action_data
        }));
    };

    // Get status transition info
    const getStatusTransitionInfo = (stepStatus) => {
        const normalizedStepStatus = stepStatus?.toLowerCase();
        const transition = actionHistory.find(item => {
            const toStatus = item.to_status?.toLowerCase();
            return toStatus === normalizedStepStatus;
        });
        if (!transition) return null;

        return {
            previousStatus: transition.from_status,
            action: transition.action,
            user: transition.user_name,
            notes: transition.notes
        };
    };


    // Handle items chip click for items tooltip (stable ref to avoid child re-renders)
    const handleItemsChipClick = useCallback((event, direction, items) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = rect.left + (rect.width / 2);
        const y = rect.bottom + 8;
        setItemsTooltipPosition({ x, y });
        setItemsTooltipData({ direction, items });
        setShowItemsTooltip(prev => !prev);
    }, []);

    // Get complete service actions history for tooltip
    const getCompleteHistorySteps = () => {
        if (!actionHistory || actionHistory.length === 0) return [];

        // Group history by status transitions
        const statusTransitions = {};
        const allStatuses = timelineSteps;

        // Initialize with all possible statuses
        allStatuses.forEach(status => {
            statusTransitions[status] = [];
        });

        // Add history items to their respective status transitions
        actionHistory.forEach(item => {
            if (item.to_status && statusTransitions[item.to_status]) {
                statusTransitions[item.to_status].push(item);
            }
        });

        // Convert to array format for rendering, filtering only valid statuses
        return allStatuses
            .filter(status => SERVICE_ACTION_STATUSES[status])
            .map(status => ({
                status,
                historyItems: statusTransitions[status] || [],
                config: SERVICE_ACTION_STATUSES[status]
            }));
    };

    // Get status description for timeline tooltip
    const getStatusDescription = (status) => {
        const descriptions = {
            'pending': 'تم إنشاء الطلب',
            'confirmed': 'تم تأكيد الطلب بنجاح',
            'in_process': 'جاري المعالجة',
            'ready_for_dispatch': 'جاهز للشحن',
            'sent': 'تم الإرسال',
            'delivered': 'تم التسليم',
            'completed': 'تم إكمال الطلب بنجاح',
            'cancelled': 'تم إلغاء الطلب'
        };
        return descriptions[status?.toLowerCase()] || 'تحديث الحالة';
    };

    // Get status location description
    const getStatusLocationDescription = (status) => {
        const locations = {
            'pending': 'في المركز',
            'confirmed': 'في المركز',
            'in_process': 'في المركز',
            'ready_for_dispatch': 'في المركز',
            'sent': 'في الطريق',
            'delivered': 'تم التسليم',
            'completed': 'مكتمل',
            'cancelled': 'ملغى'
        };
        return locations[status?.toLowerCase()] || 'في المركز';
    };

    // Get history item for a specific status
    // Handle step hover for detailed tooltip (stable ref)
    const handleStepHover = useCallback((event, stepIndex, stepStatus) => {
        const historyItem = getHistoryForStatus(stepStatus);
        if (!historyItem) return;
        if (stepTooltipTimeoutRef.current) {
            clearTimeout(stepTooltipTimeoutRef.current);
            stepTooltipTimeoutRef.current = null;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        setHoveredStepPosition({ x: rect.left + (rect.width / 2), y: rect.bottom + 8 });
        setHoveredStepIndex(stepIndex);
    }, [actionHistory]);

    const handleStepLeave = useCallback(() => {
        if (stepTooltipTimeoutRef.current) clearTimeout(stepTooltipTimeoutRef.current);
        stepTooltipTimeoutRef.current = setTimeout(() => setHoveredStepIndex(null), 200);
    }, []);

    const handleStepTooltipEnter = useCallback(() => {
        if (stepTooltipTimeoutRef.current) {
            clearTimeout(stepTooltipTimeoutRef.current);
            stepTooltipTimeoutRef.current = null;
        }
    }, []);

    const handleStepTooltipLeave = useCallback(() => {
        if (stepTooltipTimeoutRef.current) clearTimeout(stepTooltipTimeoutRef.current);
        stepTooltipTimeoutRef.current = setTimeout(() => setHoveredStepIndex(null), 200);
    }, []);

    const priorityBorderClass = getPriorityBorderColor(priority.level);

    return (
        <div
            className={`
 relative rounded-xl border overflow-visible h-full flex flex-col
  shadow-sm hover:shadow-md transition-all duration-300
  ${highlighted
    ? 'bg-indigo-100/90 dark:bg-indigo-950/55 border-indigo-400/80 dark:border-indigo-500/70 ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900 shadow-lg shadow-indigo-500/15 dark:shadow-indigo-950/40 z-[1]'
    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
  }
  ${className}
            `}
        >

            {/* Maintenance Cycle Timeline */}
            {(() => {
                if (timelineSteps.length === 0) return null;

                // Dynamic sizing based on number of steps
                const stepCount = timelineSteps.length;
                const getStepSize = () => {
                    if (stepCount <= 2) return { circle: 'w-8 h-8', icon: 'w-4 h-4' };
                    if (stepCount <= 4) return { circle: 'w-7 h-7', icon: 'w-3.5 h-3.5' };
                    if (stepCount <= 6) return { circle: 'w-6 h-6', icon: 'w-3 h-3' };
                    return { circle: 'w-5 h-5', icon: 'w-2.5 h-2.5' };
                };

                const { circle, icon } = getStepSize();

                return (
                    <div className="px-2 sm:px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
                        <div className={`relative flex items-center w-full ${stepCount <= 2 ? 'justify-center px-4 sm:px-6' : ''}`} style={{ gap: stepCount > 6 ? '2px' : stepCount > 4 ? '4px' : stepCount > 2 ? '8px' : '12px' }}>
                            {timelineSteps.map((stepStatus, index) => {
                                const config = SERVICE_ACTION_STATUSES[stepStatus];
                                const isActive = normalizedStatus === stepStatus;
                                const isPast = timelineSteps.indexOf(normalizedStatus) > index;
                                const historyItem = getHistoryForStatus(stepStatus);
                                const hasHistory = historyItem !== null;
                                const StepIcon = getIconComponent(config.icon);
                                const colorClasses = getStatusColorClasses(config.color);

                                // Determine icon color based on state
                                let iconBgColor = 'bg-gray-200 dark:bg-gray-700';
                                let iconColor = 'text-gray-500 dark:text-gray-400';
                                if (isActive) {
                                    iconBgColor = colorClasses.bg;
                                    iconColor = colorClasses.text;
                                } else if (isPast) {
                                    // Use the step's own color for completed steps
                                    iconBgColor = colorClasses.bg;
                                    iconColor = colorClasses.text;
                                }

                                return (
                                    <Fragment key={stepStatus}>
                                        <div
                                            className="relative flex flex-col items-center flex-shrink-0"
                                            style={{ flex: '0 0 auto' }}
                                            onMouseEnter={(e) => hasHistory && handleStepHover(e, index, stepStatus)}
                                            onMouseLeave={handleStepLeave}
                                        >
                                            <div
                                                className={`
                                                    ${circle} rounded-full flex items-center justify-center
                                                    transition-all duration-200 cursor-pointer
                                                    ${iconBgColor}
                                                    ${hasHistory ? 'hover:scale-110 hover:shadow-md' : ''}
                                                `}
                                            >
                                                <StepIcon className={`${icon} ${iconColor}`} />
                                            </div>
                                            {isActive && (
                                                <div className={`absolute inset-0 rounded-full bg-${config.color}-400 opacity-20 animate-ping`} />
                                            )}
                                        </div>
                                        {index < timelineSteps.length - 1 && (
                                            <div
                                                className="h-px bg-gray-300 dark:bg-gray-600 border-dashed border-t min-w-0"
                                                style={{ flex: '1 1 auto', maxWidth: '100%' }}
                                            ></div>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </div>

                        {/* Detailed Step Tooltip */}
                        {hoveredStepIndex !== null && (() => {
                            const stepStatus = timelineSteps[hoveredStepIndex];
                            const config = SERVICE_ACTION_STATUSES[stepStatus];
                            const historyItem = getHistoryForStatus(stepStatus);
                            if (!historyItem) return null;

                            const StepIcon = getIconComponent(config.icon);
                            const statusDesc = getStatusDescription(stepStatus);
                            const locationDesc = getStatusLocationDescription(stepStatus);
                            const formattedDate = formatGregorianDate(historyItem.created_at);
                            const relativeTime = getRelativeTime(historyItem.created_at);

                            return (
                                <div
                                    ref={stepTooltipRef}
                                    onMouseEnter={handleStepTooltipEnter}
                                    onMouseLeave={handleStepTooltipLeave}
                                    data-step-tooltip
                                    className="fixed z-[100] bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-600 min-w-[260px] max-w-[300px]"
                                    style={{
                                        top: `${hoveredStepPosition.y}px`,
                                        left: `${hoveredStepPosition.x - 130}px`,
                                    }}
                                >
                                    {/* Tooltip Arrow */}
                                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-r border-t border-gray-200 dark:border-gray-600 rotate-45" />

                                    <div className="p-3">
                                        {/* Header with Icon */}
                                        <div className="flex items-start gap-2 mb-2.5">
                                            <div className={`p-1.5 rounded-lg bg-${config.color}-100 dark:bg-${config.color}-900/30 flex-shrink-0`}>
                                                <StepIcon className={`w-4 h-4 text-${config.color}-600 dark:text-${config.color}-400`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight mb-0.5">
                                                    {statusDesc}
                                                </h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {locationDesc}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {historyItem.notes && (() => {
                                            const noteId = `${historyItem.id || historyItem.created_at}`;
                                            const isExpanded = expandedNotes.has(noteId);
                                            const notesLength = historyItem.notes.length;
                                            const needsTruncation = notesLength > 150; // Approximate 3 lines worth

                                            return (
                                                <div className="mb-2.5 pb-2.5 border-b border-gray-100 dark:border-gray-700">
                                                    <p className={`text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${!isExpanded && needsTruncation ? 'line-clamp-3' : ''}`}>
                                                        {historyItem.notes}
                                                    </p>
                                                    {needsTruncation && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedNotes(prev => {
                                                                    const newSet = new Set(prev);
                                                                    if (isExpanded) {
                                                                        newSet.delete(noteId);
                                                                    } else {
                                                                        newSet.add(noteId);
                                                                    }
                                                                    return newSet;
                                                                });
                                                            }}
                                                            className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-cairo font-medium transition-colors"
                                                        >
                                                            {isExpanded ? 'إظهار أقل' : 'إظهار المزيد'}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Date and Time Info - Date on left, Time on right */}
                                        <div className="flex items-center justify-between gap-3">
                                            {/* Date - Left side */}
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                    {formattedDate}
                                                </span>
                                            </div>

                                            {/* Relative Time - Right side */}
                                            <div className={`flex items-center gap-1.5 text-xs font-medium text-${config.color}-600 dark:text-${config.color}-400`}>
                                                <Clock className={`w-3.5 h-3.5 text-${config.color}-500 dark:text-${config.color}-400 flex-shrink-0`} />
                                                <span className="whitespace-nowrap">{relativeTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                );
            })()}

            {/* Card Content */}
            <div className="p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 sm:mb-2.5 gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div
                            className={`
                                p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm flex-shrink-0
                                ${actionConfig.bgClass}
                                ${priority.level !== 'low' ? priorityBorderClass : ''}
                            `}
                            title={priority.level === 'high' ? 'أولوية عالية' : priority.level === 'medium' ? 'أولوية متوسطة' : priority.level === 'low' ? 'أولوية منخفضة' : ''}
                            aria-label={`Priority: ${priority.level}`}
                        >
                            <ActionIcon className={`w-4 h-4 ${actionConfig.iconColor}`} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <h4 className="font-cairo font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">
                                {actionConfig.label}
                            </h4>
                            {ticketNumber && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Hash className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                    <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 truncate">{ticketNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Badge - Responsive positioning */}
                    <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
                        {action.source === 'call_center' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                <Phone className="w-3 h-3" /> مركز الاتصال
                            </span>
                        )}
                        <ServiceStatusBadge
                            status={normalizedStatus}
                            size="sm"
                            showIcon={true}
                            className="whitespace-nowrap"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                    {/* Customer Info */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{customerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <span dir="ltr">{formatPhoneForLocalDisplay(customerPhone)}</span>
                            <Phone className="w-4 h-4 flex-shrink-0" />
                        </div>
                    </div>

                    {/* Tracking Info */}
                    <div className="space-y-2">
                        {/* Original Tracking */}
                        <div className="flex items-center gap-2 text-sm">
                            <Truck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400 font-cairo">التتبع:</span>
                            <span className="font-mono font-medium text-gray-900 dark:text-gray-100 truncate flex-1 min-w-0">{originalTracking}</span>
                        </div>

                        {/* New Tracking Numbers - Horizontal (icons for إرسال/الاستلام) */}
                        {(newTrackingSend || newTrackingReceive) && (
                            <div className="flex items-center gap-1.5 flex-nowrap">
                                {newTrackingSend && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm" title="إرسال">
                                        <Send className="w-3.5 h-3.5 flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden />
                                        <span className="text-[10px] sm:text-xs font-mono font-semibold text-blue-900 dark:text-blue-100 truncate min-w-0">{newTrackingSend}</span>
                                    </div>
                                )}
                                {newTrackingReceive && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-sm" title="الاستلام">
                                        <PackageCheck className="w-3.5 h-3.5 flex-shrink-0 text-green-700 dark:text-green-300" aria-hidden />
                                        <span className="text-[10px] sm:text-xs font-mono font-semibold text-green-900 dark:text-green-100 truncate min-w-0">{newTrackingReceive}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Financial Info */}
                    {costAdjustment !== null && costAdjustment !== 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <DollarSign className={`w-4 h-4 flex-shrink-0 ${costAdjustment > 0 ? 'text-green-500' : 'text-red-500'}`} />
                                <span className="text-gray-600 dark:text-gray-400">التكلفه:</span>
                            </div>
                            <span className={`font-medium ${costAdjustment > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {costAdjustment > 0 ? '+' : ''}{costAdjustment.toLocaleString()} ج.م
                            </span>
                        </div>
                    )}

                    {/* Direction Chips */}
                    {getDirectionChips()}

                    {/* Notes with Read More/Show Less */}
                    {getNotesDisplay()}

                    {/* Scanning Status */}
                    {getScanningStatus()}

                    {/* Completion Status */}
                    {getCompletionStatus()}

                    {/* Custom Content */}
                    {children}
                </div>

                {/* Action Buttons - View on Left, Actions on Right */}
                <div className="mt-auto">
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex justify-between items-center">
                            {/* View Button - Left Side */}
                            <button
                                onClick={() => handleActionClick('view')}
                                className="flex items-center gap-1.5 sm:gap-1 px-3 sm:px-3 py-2.5 sm:py-2 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:active:bg-blue-900/70 text-blue-700 dark:text-blue-300 rounded-xl text-sm sm:text-xs font-cairo font-medium transition-all duration-200 hover:scale-105 active:scale-95 min-w-0 touch-manipulation min-h-[44px] sm:min-h-[40px] shadow-sm hover:shadow-md"
                                title="عرض التفاصيل"
                                aria-label="عرض التفاصيل"
                            >
                                <Eye className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                                <span>عرض</span>
                            </button>

                            {/* Smart Actions Button - Right Side */}
                            <div className="relative inline-block" ref={dropdownRef}>
                                {(() => {
                                    const filteredActions = availableActionsList.filter(a => a.id !== 'view');

                                    // If no actions remain after filtering, don't show the actions button
                                    if (filteredActions.length === 0) {
                                        return null;
                                    }

                                    // If exactly 2 actions, show them both as buttons
                                    if (filteredActions.length === 2) {
                                        const cancelAction = filteredActions.find(action => action.id === 'cancel');
                                        const otherAction = filteredActions.find(action => action.id !== 'cancel') || filteredActions[0];
                                        const firstAction = filteredActions[0];
                                        const secondAction = filteredActions[1];

                                        return (
                                            <div className="flex items-center gap-1.5">
                                                {/* Cancel Button - Icon Only (if cancel exists) */}
                                                {cancelAction && (
                                                    <>
                                                        {(() => {
                                                            const CancelIcon = getIconComponent(cancelAction.icon);
                                                            return (
                                                                <button
                                                                    onClick={() => handleActionClick(cancelAction.id)}
                                                                    onTouchStart={() => { }}
                                                                    className="flex items-center justify-center p-2 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] bg-red-100 hover:bg-red-200 active:bg-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:active:bg-red-900/70 text-red-700 dark:text-red-300 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation shadow-sm hover:shadow-md"
                                                                    title={cancelAction.label}
                                                                    aria-label={cancelAction.label}
                                                                >
                                                                    <CancelIcon className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                                </button>
                                                            );
                                                        })()}
                                                        {/* Other Action Button - Icon + Text */}
                                                        {otherAction && (
                                                            <button
                                                                onClick={() => handleActionClick(otherAction.id)}
                                                                onTouchStart={() => { }}
                                                                className={`
                                                                flex items-center gap-1.5 sm:gap-1 px-3 sm:px-3 py-2.5 sm:py-2 rounded-xl text-sm sm:text-xs font-cairo font-medium transition-all duration-200 hover:scale-105 active:scale-95 min-w-0 touch-manipulation min-h-[44px] sm:min-h-[40px]
                                                                ${otherAction.variant === 'primary'
                                                                        ? `bg-${otherAction.color}-600 hover:bg-${otherAction.color}-700 text-white shadow-md hover:shadow-lg`
                                                                        : otherAction.variant === 'danger'
                                                                            ? `bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg`
                                                                            : `bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md`
                                                                    }
                                                            `}
                                                                title={otherAction.label}
                                                            >
                                                                {(() => {
                                                                    const OtherIcon = getIconComponent(otherAction.icon);
                                                                    return <OtherIcon className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />;
                                                                })()}
                                                                <span>{otherAction.label}</span>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {/* If no cancel, show both actions with icon + text */}
                                                {!cancelAction && (
                                                    <>
                                                        {(() => {
                                                            const FirstIcon = getIconComponent(firstAction.icon);
                                                            const isFirstPrimary = firstAction.variant === 'primary';
                                                            const isFirstDanger = firstAction.variant === 'danger';
                                                            return (
                                                                <button
                                                                    onClick={() => handleActionClick(firstAction.id)}
                                                                    onTouchStart={() => { }}
                                                                    className={`
                                                                    flex items-center gap-1.5 sm:gap-1 px-3 sm:px-3 py-2.5 sm:py-2 rounded-xl text-sm sm:text-xs font-cairo font-medium transition-all duration-200 hover:scale-105 active:scale-95 min-w-0 touch-manipulation min-h-[44px] sm:min-h-[40px]
                                                                    ${isFirstPrimary
                                                                            ? `bg-${firstAction.color}-600 hover:bg-${firstAction.color}-700 text-white shadow-md hover:shadow-lg`
                                                                            : isFirstDanger
                                                                                ? `bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg`
                                                                                : `bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md`
                                                                        }
                                                                `}
                                                                    title={firstAction.label}
                                                                >
                                                                    <FirstIcon className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                                                                    <span>{firstAction.label}</span>
                                                                </button>
                                                            );
                                                        })()}
                                                        {(() => {
                                                            const SecondIcon = getIconComponent(secondAction.icon);
                                                            const isSecondPrimary = secondAction.variant === 'primary';
                                                            const isSecondDanger = secondAction.variant === 'danger';
                                                            return (
                                                                <button
                                                                    onClick={() => handleActionClick(secondAction.id)}
                                                                    onTouchStart={() => { }}
                                                                    className={`
                                                                    flex items-center gap-1.5 sm:gap-1 px-3 sm:px-3 py-2.5 sm:py-2 rounded-xl text-sm sm:text-xs font-cairo font-medium transition-all duration-200 hover:scale-105 active:scale-95 min-w-0 touch-manipulation min-h-[44px] sm:min-h-[40px]
                                                                    ${isSecondPrimary
                                                                            ? `bg-${secondAction.color}-600 hover:bg-${secondAction.color}-700 text-white shadow-md hover:shadow-lg`
                                                                            : isSecondDanger
                                                                                ? `bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg`
                                                                                : `bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md`
                                                                        }
                                                                `}
                                                                    title={secondAction.label}
                                                                >
                                                                    <SecondIcon className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                                                                    <span>{secondAction.label}</span>
                                                                </button>
                                                            );
                                                        })()}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    }

                                    const hasMultipleActions = filteredActions.length > 1;
                                    const primaryAction = filteredActions[0];

                                    if (!hasMultipleActions && primaryAction) {
                                        // Single action - show directly on button
                                        const PrimaryIcon = getIconComponent(primaryAction.icon);
                                        const isPrimary = primaryAction.variant === 'primary';
                                        const isDanger = primaryAction.variant === 'danger';

                                        return (
                                            <button
                                                onClick={() => handleActionClick(primaryAction.id)}
                                                onTouchStart={() => { }}
                                                className={`
                                                flex items-center gap-1.5 sm:gap-1 px-3 sm:px-3 py-2.5 sm:py-2 rounded-xl text-sm sm:text-xs font-cairo font-medium transition-all duration-200 hover:scale-105 active:scale-95 min-w-0 touch-manipulation min-h-[44px] sm:min-h-[40px]
                                                ${isPrimary
                                                        ? `bg-${primaryAction.color}-600 hover:bg-${primaryAction.color}-700 text-white shadow-md hover:shadow-lg`
                                                        : isDanger
                                                            ? `bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg`
                                                            : `bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md`
                                                    }
                                            `}
                                                title={primaryAction.label}
                                            >
                                                <PrimaryIcon className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                                                <span>{primaryAction.label}</span>
                                            </button>
                                        );
                                    } else {
                                        // Multiple actions (more than 2) - show dropdown
                                        return (
                                            <button
                                                onClick={() => setShowDropdown(!showDropdown)}
                                                onTouchStart={() => { }}
                                                className="flex items-center gap-1.5 sm:gap-1 px-3 sm:px-3 py-2.5 sm:py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-xl text-sm sm:text-xs font-cairo font-medium transition-all duration-200 hover:scale-105 active:scale-95 min-w-0 touch-manipulation min-h-[44px] sm:min-h-[40px] shadow-sm hover:shadow-md"
                                                aria-label="إجراءات متاحة"
                                            >
                                                {/* Default Action Icon based on current action type */}
                                                <ActionIcon className="w-4 h-4 sm:w-3 sm:h-3 flex-shrink-0" />
                                                <span>إجراءات</span>
                                                <ChevronDown className={`w-3 h-3 sm:w-2.5 sm:h-2.5 transition-transform duration-200 flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
                                            </button>
                                        );
                                    }
                                })()}

                                {/* Responsive Dropdown Menu */}
                                {showDropdown && (
                                    <div
                                        data-dropdown
                                        className="absolute w-32 sm:w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[70] animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                                        style={{
                                            position: 'fixed',
                                            minWidth: '128px'
                                        }}
                                        ref={(el) => {
                                            if (el && dropdownRef.current) {
                                                const button = dropdownRef.current.querySelector('button');
                                                if (button) {
                                                    const rect = button.getBoundingClientRect();
                                                    // Position dropdown on the right side of the button
                                                    el.style.left = `${rect.right + 8}px`;
                                                    el.style.top = `${rect.top}px`;
                                                }
                                            }
                                        }}
                                    >
                                        <div className="py-1">
                                            {availableActionsList.filter(a => a.id !== 'view').map((actionItem) => {
                                                const IconComponent = getIconComponent(actionItem.icon);
                                                const isPrimary = actionItem.variant === 'primary';
                                                const isDanger = actionItem.variant === 'danger';

                                                return (
                                                    <button
                                                        key={actionItem.id}
                                                        onClick={() => {
                                                            handleActionClick(actionItem.id);
                                                            setShowDropdown(false);
                                                        }}
                                                        onTouchStart={() => { }} // Enable touch events
                                                        className={`
                                                        w-full flex items-center gap-1.5 px-3 sm:px-2.5 py-2.5 sm:py-2 text-sm sm:text-xs font-cairo font-medium transition-colors duration-150 touch-manipulation min-h-[44px] sm:min-h-[40px]
                                                        ${isPrimary
                                                                ? `text-${actionItem.color}-700 hover:bg-${actionItem.color}-50 active:bg-${actionItem.color}-100 dark:text-${actionItem.color}-300 dark:hover:bg-${actionItem.color}-900/20 dark:active:bg-${actionItem.color}-900/30`
                                                                : isDanger
                                                                    ? `text-red-700 hover:bg-red-50 active:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/20 dark:active:bg-red-900/30`
                                                                    : `text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600`
                                                            }
                                                    `}
                                                    >
                                                        <IconComponent className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                                        <span className="text-right flex-1 min-w-0 truncate">{actionItem.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Suspense fallback={<ModalLoadingFallback message="جاري تحميل نافذة التأكيد..." />}>
                {showConfirmationModal && (
                    <ServiceActionConfirmationModal
                        isOpen={showConfirmationModal}
                        onClose={handleConfirmationClose}
                        onSuccess={handleConfirmationSuccess}
                        action={action}
                        targetStatus={selectedAction}
                    />
                )}
            </Suspense>

            {/* Items Tooltip */}
            {showItemsTooltip && (
                <div
                    ref={itemsTooltipRef}
                    className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 max-w-sm"
                    style={{
                        top: `${itemsTooltipPosition.y}px`,
                        left: `${itemsTooltipPosition.x - 140}px`,
                        transform: 'translateY(8px)'
                    }}
                >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 rotate-45"></div>
                    <div className="text-sm">
                        <div className="flex items-center gap-2 mb-3">
                            {itemsTooltipData.direction === 'send' ? (
                                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            ) : (
                                <Package className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            )}
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {itemsTooltipData.direction === 'send' ? 'عناصر الإرسال' : 'عناصر الاستلام'}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {itemsTooltipData.items.map((item, index) => {
                                const isProduct = item.type === 'product';
                                const isDamaged = item.condition === 'damaged';
                                const isValid = item.condition === 'valid';

                                return (
                                    <div key={index} className="flex items-center gap-2 text-xs">
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

            {/* Display Modal - Using ServiceModalViewer */}
            <Suspense fallback={null}>
                {showDisplayModal && (
                    <ServiceModalViewer
                        isOpen={showDisplayModal}
                        onClose={() => setShowDisplayModal(false)}
                        ticket={action}
                    />
                )}
            </Suspense>

            {/* Classification Modal */}
            {showClassificationModal && (
                <ReturnClassificationModal
                    isOpen={showClassificationModal}
                    onClose={handleClassificationClose}
                    ticket={action}
                    onClassificationComplete={handleClassificationSuccess}
                />
            )}

            {/* Workflow Action Modal */}
            <Suspense fallback={<ModalLoadingFallback message="جاري تحميل نافذة الإجراء..." />}>
                {showWorkflowModal && (
                    <ServiceWorkflowActionModal
                        isOpen={showWorkflowModal}
                        onClose={handleWorkflowClose}
                        onSuccess={handleWorkflowSuccess}
                        action={action}
                        actionType={workflowActionType}
                    />
                )}
            </Suspense>

            {/* Cancel Modal */}
            {showCancelModal && (
                <ServiceCancelModal
                    isOpen={showCancelModal}
                    onClose={handleCancelClose}
                    onSuccess={handleCancelSuccess}
                    action={action}
                />
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <ServiceDeleteModal
                    isOpen={showDeleteModal}
                    onClose={handleDeleteClose}
                    onSuccess={handleDeleteSuccess}
                    action={action}
                />
            )}
        </div>
    );
};

const ServiceActionCard = memo(ServiceActionCardInner);
export default ServiceActionCard;
