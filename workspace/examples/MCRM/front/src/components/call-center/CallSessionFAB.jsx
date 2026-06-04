import { Fragment, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Phone, CheckCircle, PhoneOff, Calendar, XCircle, Loader2, Copy, Check, ChevronUp, ChevronDown, Package, User, MapPin, FileText, Wrench, RotateCcw, RefreshCw, Settings, Truck, Edit2, MessageCircleQuestion, ShoppingBag, ExternalLink, Star, AlertTriangle, CheckCheck, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../';
import OrderItemsEditor from './OrderItemsEditor';
import CallCenterItemsSelection from './CallCenterItemsSelection';
import CallCenterAmountPanel from './CallCenterAmountPanel';
import { getBostaCodValue, getBostaFeesValues, getBostaOrderDisplayNote, BOSTA_COD_EPS, bostaFeesChipVisible } from '../../utils/bosta/cod';
import { getShipmentTextForItemMatch } from '../../utils/callcenter/bostaShipmentItems';
import { BostaCodMainChip, BostaFeesCompactChip } from '../service/BostaSearchResultScreen/BostaOrderMoneyChips';
import CustomerCard from '../modals/ServiceModalViewer/CustomerCard';
import LocationCard from '../modals/ServiceModalViewer/LocationCard';
import CallHistoryCard from '../modals/ServiceModalViewer/CallHistoryCard';
import { ServiceModalWrapper, ServiceModalHeader } from '../modals/shared';
import LeaderApprovalModal from '../leader/LeaderApprovalModal';
import { formatDateOnly, getRelativeTime, formatDateWithArabicMonth } from '../../utils/core/date';
import { formatPhoneForLocalDisplay } from '../../utils/core/phone';
import { formatAddressForDisplay } from '../../utils/ui/address';
import { useAuth } from '../../contexts/AuthContext';
import { useCallSession } from '../../contexts/CallSessionContext';
import { toast } from 'react-hot-toast';
import { customerAPI } from '../../api/customerAPI';
import { CALL_TYPES, getStatusBadgeColor, getStatusLabel } from '../../utils/bosta/status';
import { getServiceStatusLabel, getServiceStatusBadgeColor } from '../../utils/service/utils';
import { getBostaOrderStatus } from '../../utils/bosta/status';
import { getSafeNotesDisplay } from '../../utils/ui/notes';
import {
  mergeRmtCallNotes,
  mergeRmtCartLinesByStockId,
  mergeSellCartLinesByStockId,
  mergeSellSessionNotes
} from '../../utils/callcenter/rmtNotes';
import { ServiceStatusBadge, SessionStyleMoneyBadge } from '../ui';
import { SERVICE_TYPE_CONFIG, translateOrderType } from '../service/BostaSearchResultScreen/constants';
import {
  getOrderCallContext,
  autoMatchItems,
  getOrderItemsFromSnapshot,
  searchStockItems,
  itemsToDescriptionText,
  confirmOrder,
  createDirectOrder,
  cancelOrder,
  scheduleOrder,
  noAnswerOrder,
  lockOrder,
  unlockOrder,
  getOrderCalls,
  askOnly,
  getCustomerContextByPhone
} from '../../api/callCenterAPI';
import { normalizeServiceTypeOrFallback, getServiceTypeLabelAr } from '../../constants/serviceTypes.js';
import {
  SERVICE_TYPE_ICONS as TYPE_ICONS,
  SERVICE_TYPE_STRIP_BG as TYPE_STRIP_BG,
  SERVICE_TYPE_TAB_STYLES,
} from '../../constants/serviceTypeUi.js';
import {
  getTicketNotesRawForDisplay,
  ticketHasBostaTracking,
  enrichTicketNotesFromBosta,
  getTicketItemsForDisplay,
} from '../../utils/service/ticketSnapshotDisplay.js';

const NOTES_TRUNCATE = 48;
/** Minimum length to send `original_tracking` on confirm (matches service modals). */
const ORIGINAL_TRACKING_MIN_LEN = 3;

/** Sell row must reference stock — snapshot/API may use product_id or id instead of item_id */
function sellLineHasStockId(it) {
  if (!it || typeof it !== 'object') return false;
  const id = it.item_id ?? it.product_id ?? it.id;
  return id != null && String(id).trim() !== '';
}

/**
 * Split flat matched lines into إرسال / استلام (same rules as Bosta auto-fill).
 * Used when: (1) RMT order has no snapshot but وصف الطلب matches stock; (2) legacy snapshot items without direction.
 */
function distributeRmtLinesFromMatched(matched, serviceType) {
  const list = Array.isArray(matched) ? matched : [];
  if (list.length === 0) return { send: [], recv: [] };
  const toItem = (it, i, direction, condition) => ({
    ...it,
    _uid: it._uid ?? `rmt-${direction}-${i}-${Date.now()}`,
    quantity: it.order_quantity ?? it.quantity ?? 1,
    order_quantity: it.order_quantity ?? it.quantity ?? 1,
    direction,
    condition
  });
  if (serviceType === 'replacement') {
    return {
      send: mergeRmtCartLinesByStockId(list.map((it, i) => toItem(it, i, 'send', 'valid'))),
      recv: mergeRmtCartLinesByStockId(list.map((it, i) => toItem(it, i, 'receive', 'damaged')))
    };
  }
  if (serviceType === 'maintenance') {
    return {
      recv: mergeRmtCartLinesByStockId(list.map((it, i) => toItem(it, i, 'receive', 'damaged'))),
      send: mergeRmtCartLinesByStockId(list.map((it, i) => toItem(it, i, 'send', 'valid')))
    };
  }
  return {
    recv: mergeRmtCartLinesByStockId(list.map((it, i) => toItem(it, i, 'receive', 'damaged'))),
    send: []
  };
}

function sessionClone(obj) {
  try {
    return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
}

/** Restore COD/total when switching back to sell without a per-type stash — COD from snapshot/DB only, not Σ items. */
function baselineSellStateFromOrder(orderEntity, orderItemsBaseline) {
  const items = sessionClone(orderItemsBaseline || []);
  const snap = orderEntity?.confirmation_snapshot;
  const snapCodRaw = snap?.cod_amount;
  const snapCodNum = snapCodRaw != null && snapCodRaw !== '' ? Number(snapCodRaw) : NaN;
  const rawCod = parseFloat(orderEntity?.cod_amount);
  let signed = 0;
  if (Number.isFinite(snapCodNum)) signed = snapCodNum;
  else if (Number.isFinite(rawCod)) signed = rawCod;
  return {
    editableItems: items,
    editableTotal: signed,
    totalAmount: signed,
    cashFlowMode: signed < 0 ? 'refund' : 'collect'
  };
}

/** Restore signed total when switching to R/M/T without stash — COD from snapshot/DB only, not Σ line prices. */
function baselineRmtTotalsFromOrder(orderEntity, _sendArr, _recvArr, serviceType) {
  const snap = orderEntity?.confirmation_snapshot;
  const snapCodRaw = snap?.cod_amount;
  const snapCodNum = snapCodRaw != null && snapCodRaw !== '' ? Number(snapCodRaw) : NaN;
  const rawCodSigned = parseFloat(orderEntity?.cod_amount);
  let signedTotal = 0;
  let cashFlowMode = serviceType === 'return' ? 'refund' : 'collect';

  if (Number.isFinite(snapCodNum)) {
    signedTotal = snapCodNum;
    if (snapCodNum < 0) cashFlowMode = 'refund';
    else if (snapCodNum > 0) cashFlowMode = 'collect';
    else cashFlowMode = serviceType === 'return' ? 'refund' : 'collect';
  } else if (Number.isFinite(rawCodSigned)) {
    signedTotal = rawCodSigned;
    cashFlowMode = rawCodSigned < 0 ? 'refund' : 'collect';
  } else {
    signedTotal = 0;
    cashFlowMode = serviceType === 'return' ? 'refund' : 'collect';
  }
  return { signedTotal, cashFlowMode };
}

function ticketServiceTypeKey(ticket) {
  return normalizeServiceTypeOrFallback(ticket?.service_type, { fallback: 'replacement' });
}

/**
 * Call Session FAB Component
 * FAB-based call session with expandable view
 *
 * @param {object} order - Order object (null for Phase B direct call)
 * @param {object} customerContext - Pre-loaded context when order=null (Phase B)
 * @param {function} onClose - Close handler (clears session)
 * @param {function} onComplete - Completion handler (after action)
 * @param {function} onModification - Handler when order is modified (for hint display)
 */
const CallSessionFAB = ({ order, customerContext: customerContextProp, onClose, onComplete, onModification }) => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const { updateActiveOrder } = useCallSession();

  // FAB state
  const [isExpanded, setIsExpanded] = useState(true); // Auto-expand on mount
  const [copiedPhone, setCopiedPhone] = useState(null);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [customerContext, setCustomerContext] = useState(null);
  /** Latest context for effects that must not depend on `services` array identity (prevents Bosta auto-fill re-runs that wipe item edits). */
  const customerContextRef = useRef(null);
  customerContextRef.current = customerContext;
  const [orderItems, setOrderItems] = useState([]);
  const [orderItemsToSend, setOrderItemsToSend] = useState([]);
  const [orderItemsToReceive, setOrderItemsToReceive] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  // Tab state — Bosta | Services (matches ServiceModalViewer)
  const [activeTab, setActiveTab] = useState('bosta');
  const [selectedBostaOrder, setSelectedBostaOrder] = useState(null);
  /** none | list | manual — list = shipment picked from grid; manual = typed tracking (may or may not match a loaded shipment). */
  const [trackingEntryMode, setTrackingEntryMode] = useState('none');
  const [manualTrackingInput, setManualTrackingInput] = useState('');
  const manualTrackingInputRef = useRef(null);
  const bostaTrackingHydratedRef = useRef(null);
  /** Last autoMatch fetch key = order|tracking|desc|callType */
  const bostaShipmentLastFetchKeyRef = useRef('');
  const bostaMatchedRowsRef = useRef(null);
  /** وصف الطلب من الطلب عند ربط order.id — لا يُخلط مع تحرير المستخدم الحي حتى لا يُعاد autoMatch على نص عشوائي / ملاحظات. */
  const orderDescriptionForBostaSnapshotRef = useRef('');
  const [activeServiceType, setActiveServiceType] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [expandedStarDetails, setExpandedStarDetails] = useState({});
  const [modalItemsTooltip, setModalItemsTooltip] = useState(null);
  const modalItemsTooltipRef = useRef(null);
  const [leaderActionModal, setLeaderActionModal] = useState({ isOpen: false, type: null, value: '' });
  const [leaderActionLoading, setLeaderActionLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    if (!modalItemsTooltip) return;
    const close = (e) => {
      if (modalItemsTooltipRef.current && !modalItemsTooltipRef.current.contains(e.target) && !e.target.closest('[data-modal-items-chip]')) setModalItemsTooltip(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [modalItemsTooltip]);

  useEffect(() => {
    if (!showScheduleModal) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !actionLoading) setShowScheduleModal(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showScheduleModal, actionLoading]);

  // Reset schedule state when modal opens
  useEffect(() => {
    if (showScheduleModal) {
      setScheduleChip(null);
      setScheduledDate('');
      setScheduledTime('');
      const d = new Date();
      setScheduleCalendarView({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [showScheduleModal]);

  const isDirectCall = !order;
  const isReadOnly = customerContextProp?.readOnly || false; // Read-only mode (for View button)
  // Call type: default ASK for direct call, else from order
  const [callType, setCallType] = useState(isDirectCall ? 'ask' : 'sell');
  /** Keeps latest نوع المكالمة for async Bosta auto-fill (must be declared after callType) */
  const callTypeRef = useRef(callType);
  callTypeRef.current = callType;
  // Track whether agent has manually overridden the call type — prevents init effects from resetting it
  const callTypeManualRef = useRef(false);

  // Call type configuration — defines requirements and behavior per type
  // Defined early so it's accessible throughout the component
  const CALL_TYPE_CONFIG = {
    ask: {
      label: 'استفسار',
      Icon: MessageCircleQuestion,
      color: 'emerald',
      requiresItems: false,
      requiresAddress: false,
      requiresDeliveryDate: false,
      createsTicket: false,
      showItemsEditor: false,
      showAddress: true, // Always show for customer records, but optional
      allowedActions: ['confirm', 'cancel']
    },
    sell: {
      label: 'بيع',
      Icon: ShoppingBag,
      color: 'blue',
      requiresItems: true,
      requiresAddress: true,
      requiresDeliveryDate: true,
      createsTicket: true,
      showItemsEditor: true,
      showAddress: true,
      allowedActions: ['confirm', 'schedule', 'no_answer', 'cancel']
    },
    replacement: {
      label: 'استبدال',
      Icon: RefreshCw,
      color: 'amber',
      requiresItems: true,
      requiresAddress: true,
      requiresDeliveryDate: true,
      createsTicket: true,
      showItemsEditor: true,
      showAddress: true,
      allowedActions: ['confirm', 'schedule', 'no_answer', 'cancel']
    },
    maintenance: {
      label: 'صيانة',
      Icon: Wrench,
      color: 'violet',
      requiresItems: false, // Optional for maintenance
      requiresAddress: true,
      requiresDeliveryDate: true,
      createsTicket: true,
      showItemsEditor: true, // Show but optional
      showAddress: true,
      allowedActions: ['confirm', 'schedule', 'no_answer', 'cancel']
    },
    return: {
      label: 'إرجاع',
      Icon: RotateCcw,
      color: 'teal',
      requiresItems: true, // Must have استلام lines with stock id or snapshot stays empty → ticket without items
      requiresAddress: true,
      requiresDeliveryDate: true,
      createsTicket: true,
      showItemsEditor: true, // Show but optional
      showAddress: true,
      allowedActions: ['confirm', 'schedule', 'no_answer', 'cancel']
    }
  };

  const currentCallTypeConfig = CALL_TYPE_CONFIG[callType] || CALL_TYPE_CONFIG.sell;

  const orderIsCanceled = Boolean(
    order && ['canceled', 'cancelled'].includes(String(order.status || '').toLowerCase())
  );

  // Editable state (only applies on confirm)
  const [editableItems, setEditableItems] = useState([]);
  const [editableTotal, setEditableTotal] = useState(0);
  /** collect = نحصل من العميل (+)، refund = نسترد للعميل (−) */
  const [cashFlowMode, setCashFlowMode] = useState('collect');
  const prevCallTypeRef = useRef(null);
  const [itemsToSend, setItemsToSend] = useState([]);
  const [itemsToReceive, setItemsToReceive] = useState([]);
  const [editableNotes, setEditableNotes] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [descriptionEditHistory, setDescriptionEditHistory] = useState([]); // Array of { agentName, editDate, oldValue, newValue }
  const [tempDescription, setTempDescription] = useState(''); // Temporary value while editing
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  /** Per نوع المكالمة cart — tab switches must not clear send/receive vs sell (session-only; reset on order/customer change). */
  const callTypeSessionStashRef = useRef({});
  /** After manual tab switch: skip applyMatched only if we restored a non-empty stashed cart for that type (do not overwrite). */
  const skipBostaApplyMatchedRef = useRef(false);
  /** After manual tab switch: suppress Bosta auto-fill success toast. */
  const suppressBostaShipmentToastRef = useRef(false);
  /**
   * Agent set COD via amount panel (بيع أو RMT) — including صريح 0. Do not overwrite from line-item sum on confirm or cart edits.
   */
  const codAmountUserLockedRef = useRef(false);

  // Reset manual override when the order being viewed changes
  const prevOrderIdRef = useRef(order?.id);
  const initialCallNotesRef = useRef(''); // Track loaded call notes for hasEdits
  useEffect(() => {
    if (order?.id !== prevOrderIdRef.current) {
      callTypeManualRef.current = false;
      prevOrderIdRef.current = order?.id;
      prevCallTypeRef.current = null;
    }
  }, [order?.id]);

  // Initialize notes, description, and call type from order (sync when order changes)
  // Call notes (editableNotes) stay empty by default; وصف الطلب (editableDescription) gets order_description
  useEffect(() => {
    if (order) {
      if (order.order_description) {
        setEditableDescription(order.order_description);
        setTempDescription(order.order_description);
      }
      // Only set callType from order if the agent hasn't manually overridden it
      if (!callTypeManualRef.current) {
        const raw = (order.confirmation_snapshot?.call_type || order.service_type || 'sell');
        const orderType = typeof raw === 'string' ? raw.toLowerCase().trim() : 'sell';
        const resolved = ['sell', 'replacement', 'maintenance', 'return'].includes(orderType) ? orderType : 'sell';
        setCallType(resolved);
      }
    } else {
      callTypeManualRef.current = false;
      setCallType('ask');
    }
  }, [order?.id, order?.service_type, order?.confirmation_snapshot?.call_type, isDirectCall]);

  // Action modals
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form states
  const [deliveryDate, setDeliveryDate] = useState('');
  const [cancellationReasonNotes, setCancellationReasonNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduleChip, setScheduleChip] = useState(null); // 'tomorrow'|'day2'|'day3'|'week'|'custom'
  const [scheduleCalendarView, setScheduleCalendarView] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Customer/location save state (real API persistence)
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Profile (Customer+Location) expand/collapse — like ServiceModalViewer
  // If all required fields filled (name, phone, gov, city, address): default collapsed
  // If any missing: default expanded + hint to ask customer and fill
  // Sec phone is optional, not used for expand/collapse
  const customer = customerContext?.customer || order?.customer;
  /** Fresh GET /orders/:id from loadData — queue row `order` can lag behind agent confirm (cod_amount / snapshot). */
  const orderForLeaderApproval = useMemo(() => {
    if (!order) return null;
    const live = customerContext?.order;
    if (!live) return order;
    return { ...order, ...live };
  }, [order, customerContext?.order]);
  const hasName = !!(customer?.name || order?.customer?.name || '').toString().trim();
  const hasPhone = !!(customer?.phone || order?.customer?.phone || order?.customer_phone || '').toString().trim();
  const hasGov = !!(customer?.governorate || order?.address_governorate || '').toString().trim();
  const hasCity = !!(customer?.city || order?.address_city || '').toString().trim();
  const hasAddress = !!(customer?.address_details || order?.address_full || '').toString().trim();
  const isProfileComplete = hasName && hasPhone && hasGov && hasCity && hasAddress;
  const missingFields = [];
  if (!hasName) missingFields.push('الاسم');
  if (!hasPhone) missingFields.push('رقم الهاتف');
  if (!hasGov) missingFields.push('المحافظة');
  if (!hasCity) missingFields.push('المدينة');
  if (!hasAddress) missingFields.push('التفاصيل');

  const [customerLocationExpanded, setCustomerLocationExpanded] = useState(() => {
    if (typeof sessionStorage === 'undefined') return true;
    const saved = sessionStorage.getItem('call-session-fab-customer-location-expanded');
    if (saved !== null) return saved === 'true';
    return !isProfileComplete; // incomplete → expanded; complete → collapsed
  });

  const setCustomerLocationExpandedPersisted = useCallback((value) => {
    setCustomerLocationExpanded(value);
    try {
      sessionStorage.setItem('call-session-fab-customer-location-expanded', String(value));
    } catch (e) { /* ignore */ }
  }, []);

  // When profile becomes complete and user never toggled, auto-collapse
  useEffect(() => {
    if (!isProfileComplete) return;
    const saved = sessionStorage.getItem('call-session-fab-customer-location-expanded');
    if (saved === null) setCustomerLocationExpandedPersisted(false);
  }, [isProfileComplete, setCustomerLocationExpandedPersisted]);

  // Load customer context and items when session identity changes (order id or direct-call customer).
  // Intentionally NOT dependent on customerContextProp reference so we don't overwrite local edits
  // when parent re-renders; only refetch when user opens a different order or different direct-call customer.
  const orderId = order?.id;
  const directCallKey = isDirectCall ? (customerContextProp?.customer?.id ?? customerContextProp?.customer?.phone ?? '') : '';
  // Always expand session when user clicks call icon (new order or different customer)
  useEffect(() => {
    setIsExpanded(true);
  }, [orderId, directCallKey]);

  useEffect(() => {
    if (isDirectCall) prevCallTypeRef.current = null;
  }, [isDirectCall, directCallKey]);

  useEffect(() => {
    callTypeSessionStashRef.current = {};
    codAmountUserLockedRef.current = false;
  }, [orderId, directCallKey]);

  useEffect(() => {
    const loadData = async () => {
      if (isDirectCall) {
        const ctx = customerContextProp || { customer: null, orders: [], services: [] };
        const phone = ctx?.customer?.phone;
        const phoneSecondary = ctx?.customer?.phone_secondary;
        const hasServerShape =
          ctx?.customer?.id != null
          || (Array.isArray(ctx?.orders) && ctx.orders.length > 0)
          || (Array.isArray(ctx?.services) && ctx.services.length > 0);

        setEditableNotes('');
        initialCallNotesRef.current = '';

        if (!phone || !String(phone).trim()) {
          setCustomerContext(ctx);
          setLoading(false);
          return;
        }

        if (hasServerShape) {
          setCustomerContext(ctx);
          setLoading(false);
          return;
        }

        // Same UX as order row: open FAB immediately, load profile inside (SearchBar / استفسار)
        setLoading(true);
        setCustomerContext(ctx);
        try {
          const full = await getCustomerContextByPhone(String(phone).trim(), phoneSecondary);
          setCustomerContext(full);
        } catch (e) {
          if (import.meta.env.DEV) console.error('Error loading customer context by phone:', e);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!order) return;

      setLoading(true);
      try {
        // Lock is view-only: try to acquire but don't block opening if another agent has it
        lockOrder(order.id).catch(() => {});
        const prelimSvc = String(
          order?.service_type || order?.confirmation_snapshot?.call_type || 'sell'
        ).toLowerCase();
        const autoMatchSvc = ['sell', 'replacement', 'maintenance', 'return'].includes(prelimSvc)
          ? prelimSvc
          : 'sell';
        const [context, matchedItemsRes, callsRes] = await Promise.all([
          getOrderCallContext(order.id),
          autoMatchItems(order.id, order.order_description ?? null, { callType: autoMatchSvc }),
          getOrderCalls(order.id)
        ]);
        setCustomerContext(context);
        const calls = Array.isArray(callsRes) ? callsRes : [];

        const orderFromContext = context.order;
        const snap = orderFromContext?.confirmation_snapshot;
        const hasSnapshotItems = snap?.items?.length > 0;

        let items = [];
        let sendItems = [];
        let receiveItems = [];
        const rawSvc = snap?.call_type || orderFromContext?.service_type || order?.service_type || 'sell';
        const svcType = typeof rawSvc === 'string' ? rawSvc.toLowerCase().trim() : 'sell';
        const resolvedType = ['sell', 'replacement', 'maintenance', 'return'].includes(svcType) ? svcType : 'sell';
        // Only override callType if agent hasn't manually selected a type
        if (!callTypeManualRef.current) {
          setCallType(resolvedType);
        }
        const isRMT = ['replacement', 'maintenance', 'return'].includes(resolvedType);

        if (hasSnapshotItems) {
          const snapshotRes = await getOrderItemsFromSnapshot(orderFromContext);
          items = snapshotRes.items || [];
          sendItems = snapshotRes.itemsToSend || [];
          receiveItems = snapshotRes.itemsToReceive || [];
          // Legacy snapshot: بنود بدون direction — واجهة RMT تعتمد على إرسال/استلام فقط
          if (isRMT && sendItems.length === 0 && receiveItems.length === 0 && items.length > 0) {
            const { send, recv } = distributeRmtLinesFromMatched(items, resolvedType);
            sendItems = send;
            receiveItems = recv;
            items = [];
          }
        } else if (isRMT) {
          items = [];
          const matched = matchedItemsRes?.items || [];
          if (matched.length > 0) {
            const { send, recv } = distributeRmtLinesFromMatched(matched, resolvedType);
            sendItems = send;
            receiveItems = recv;
          } else {
            sendItems = [];
            receiveItems = [];
          }
        } else {
          items = matchedItemsRes.items || [];
        }

        const rawCodSigned = parseFloat(orderFromContext?.cod_amount);
        const snapCodRaw = snap?.cod_amount;
        const snapCodNum = snapCodRaw != null && snapCodRaw !== '' ? Number(snapCodRaw) : NaN;
        const hasSnapshotCod = Number.isFinite(snapCodNum);

        /** COD: snapshot → order row — never Σ line prices */
        let signedTotal = 0;
        let flow = resolvedType === 'return' ? 'refund' : 'collect';

        if (hasSnapshotCod) {
          signedTotal = snapCodNum;
          if (snapCodNum < 0) {
            flow = 'refund';
          } else if (snapCodNum > 0) {
            flow = 'collect';
          } else {
            flow = resolvedType === 'return' ? 'refund' : 'collect';
          }
        } else if (Number.isFinite(rawCodSigned)) {
          signedTotal = rawCodSigned;
          flow = rawCodSigned < 0 ? 'refund' : (resolvedType === 'return' ? 'refund' : 'collect');
        } else if (resolvedType === 'return') {
          signedTotal = 0;
          flow = 'refund';
        } else {
          signedTotal = 0;
          flow = 'collect';
        }

        if (isRMT) {
          sendItems = mergeRmtCartLinesByStockId(sendItems);
          receiveItems = mergeRmtCartLinesByStockId(receiveItems);
        }

        setOrderItems(items);
        setOrderItemsToSend(isRMT ? sendItems : []);
        setOrderItemsToReceive(isRMT ? receiveItems : []);
        setEditableItems(isRMT ? [] : items);
        setItemsToSend(isRMT ? sendItems : []);
        setItemsToReceive(isRMT ? receiveItems : []);
        setCashFlowMode(flow);
        codAmountUserLockedRef.current = false;
        setTotalAmount(signedTotal);
        setEditableTotal(signedTotal);

        const notesFromSnapshot = snap?.notes;
        const latestCall = calls.length > 0 ? calls.sort((a, b) => new Date(b.call_datetime || b.created_at || 0) - new Date(a.call_datetime || a.created_at || 0))[0] : null;
        const notesFromCall = latestCall?.notes ?? latestCall?.history;
        // Call notes: empty by default; only pre-fill from previous call/snapshot (never وصف الطلب)
        const notesToUse = notesFromSnapshot ?? notesFromCall ?? '';
        setEditableNotes(notesToUse);
        initialCallNotesRef.current = notesToUse;
        // وصف الطلب: from items or order_description
        const descToUse = items.length > 0 ? itemsToDescriptionText(items) : (orderFromContext?.order_description ?? order?.order_description ?? '');
        setEditableDescription(descToUse);
        setTempDescription(descToUse);

      } catch (error) {
        if (import.meta.env.DEV) console.error('Error loading call context:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (order) {
        unlockOrder(order.id).catch(err => { if (import.meta.env.DEV) console.error('Error unlocking order:', err); });
      }
    };
  }, [orderId, isDirectCall, directCallKey]);

  // Reset Bosta selection + tracking entry when order/customer changes
  useEffect(() => {
    setSelectedBostaOrder(null);
    setTrackingEntryMode('none');
    setManualTrackingInput('');
    bostaTrackingHydratedRef.current = null;
    bostaShipmentLastFetchKeyRef.current = '';
    bostaMatchedRowsRef.current = null;
  }, [orderId, directCallKey]);

  // Hydrate tracking from order snapshot / ERP once per order when context is available (list vs manual).
  useEffect(() => {
    if (isDirectCall || !order?.id) return;
    if (bostaTrackingHydratedRef.current === order.id) return;
    const t = String(
      order.confirmation_snapshot?.original_tracking
        ?? order.bosta_tracking_number
        ?? order.bosta_tracking
        ?? ''
    ).trim();
    if (!t) {
      bostaTrackingHydratedRef.current = order.id;
      return;
    }
    const orders = customerContext?.orders || [];
    const norm = (o) => String(o?.trackingNumber ?? o?.tracking_number ?? '').trim();
    const found = orders.find((o) => norm(o) === t);
    if (found) {
      setTrackingEntryMode('list');
      setSelectedBostaOrder(found);
      setManualTrackingInput('');
    } else {
      setTrackingEntryMode('manual');
      setManualTrackingInput(t);
      setSelectedBostaOrder(null);
    }
    bostaTrackingHydratedRef.current = order.id;
  }, [
    isDirectCall,
    order?.id,
    order?.confirmation_snapshot?.original_tracking,
    order?.bosta_tracking_number,
    order?.bosta_tracking,
    customerContext?.orders,
  ]);

  useEffect(() => {
    orderDescriptionForBostaSnapshotRef.current = order?.order_description || '';
  }, [order?.id]);

  // Bosta card → items: autoMatch per shipment + callType. Manual tab switch still runs this effect so R/M/T get lines;
  // we skip applyMatched only when switching back to a tab that had a saved non-empty cart.
  const callTypesWithBostaShipmentAutofill = ['sell', 'replacement', 'maintenance', 'return'];
  useEffect(() => {
    const clearBostaTabSwitchFlags = () => {
      skipBostaApplyMatchedRef.current = false;
      suppressBostaShipmentToastRef.current = false;
    };

    if (!selectedBostaOrder || !callTypesWithBostaShipmentAutofill.includes(callType)) {
      clearBostaTabSwitchFlags();
      return;
    }
    const hasSnapshotItems = order?.confirmation_snapshot?.items?.length > 0;
    if (hasSnapshotItems) {
      clearBostaTabSwitchFlags();
      return;
    }

    const normTr = (o) => String(o?.trackingNumber ?? o?.tracking_number ?? '').trim();
    const tr = normTr(selectedBostaOrder);
    const desc = getShipmentTextForItemMatch(
      selectedBostaOrder,
      customerContextRef.current?.services || [],
      orderDescriptionForBostaSnapshotRef.current
    );
    if (!desc) {
      clearBostaTabSwitchFlags();
      return;
    }

    const fetchKey = `${order?.id ?? ''}|${tr}|${desc}|${callType}`;
    const skipApplyOnce = skipBostaApplyMatchedRef.current;
    const suppressToastOnce = suppressBostaShipmentToastRef.current;
    suppressBostaShipmentToastRef.current = false;

    const applyMatched = (matched, showToast) => {
      const ct = callTypeRef.current;
      if (!callTypesWithBostaShipmentAutofill.includes(ct)) return;
      if (!matched?.length) return;

      const toItem = (it, i, direction, condition) => ({
        ...it,
        _uid: `bosta-${direction}-${i}-${Date.now()}`,
        quantity: it.order_quantity ?? it.quantity ?? 1,
        order_quantity: it.order_quantity ?? it.quantity ?? 1,
        direction,
        condition
      });

      if (ct === 'sell') {
        const flat = mergeSellCartLinesByStockId(
          matched.map((it, i) => ({
            ...it,
            _uid: `bosta-sell-${i}-${Date.now()}`,
            item_id: it.item_id ?? it.product_id ?? it.id,
            order_quantity: it.order_quantity ?? it.quantity ?? 1,
            quantity: it.order_quantity ?? it.quantity ?? 1
          }))
        );
        setEditableItems(flat);
        setOrderItems(flat);
        const descText = itemsToDescriptionText(flat);
        setEditableDescription(descText);
        setTempDescription(descText);
      } else if (ct === 'replacement') {
        setItemsToSend(mergeRmtCartLinesByStockId(matched.map((it, i) => toItem(it, i, 'send', 'valid'))));
        setItemsToReceive(mergeRmtCartLinesByStockId(matched.map((it, i) => toItem(it, i, 'receive', 'damaged'))));
      } else if (ct === 'maintenance') {
        setItemsToReceive(mergeRmtCartLinesByStockId(matched.map((it, i) => toItem(it, i, 'receive', 'damaged'))));
        setItemsToSend(mergeRmtCartLinesByStockId(matched.map((it, i) => toItem(it, i, 'send', 'valid'))));
      } else {
        setItemsToReceive(mergeRmtCartLinesByStockId(matched.map((it, i) => toItem(it, i, 'receive', 'damaged'))));
        setItemsToSend([]);
      }
      if (showToast) {
        toast.success(
          ct === 'sell'
            ? `تم تعبئة المنتجات من وصف الشحنة (${matched.length})`
            : `تم تعبئة العناصر من وصف الشحنة (${matched.length})`
        );
      }
    };

    if (bostaShipmentLastFetchKeyRef.current === fetchKey && bostaMatchedRowsRef.current) {
      if (!skipApplyOnce) {
        applyMatched(bostaMatchedRowsRef.current, false);
      }
      skipBostaApplyMatchedRef.current = false;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await autoMatchItems(order?.id ?? null, desc, { callType });
        if (cancelled) return;
        const matched = res?.items || [];
        bostaMatchedRowsRef.current = matched;
        bostaShipmentLastFetchKeyRef.current = fetchKey;
        if (cancelled) return;
        if (!skipApplyOnce) {
          applyMatched(matched, !suppressToastOnce);
        }
        skipBostaApplyMatchedRef.current = false;
      } catch (e) {
        if (import.meta.env.DEV) console.error('Bosta auto-fill items:', e);
        skipBostaApplyMatchedRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    selectedBostaOrder,
    callType,
    order?.id,
    order?.confirmation_snapshot?.items?.length,
    customerContext?.services?.length
  ]);

  useEffect(() => {
    if (!selectedBostaOrder) {
      bostaShipmentLastFetchKeyRef.current = '';
      bostaMatchedRowsRef.current = null;
    }
  }, [selectedBostaOrder]);

  // Initialize active tab based on available data (matches ServiceModalViewer)
  useEffect(() => {
    if (customerContext) {
      const hasBosta = (customerContext.orders || []).length > 0;
      const hasServices = (customerContext.services || []).length > 0;
      if (hasBosta) setActiveTab('bosta');
      else if (hasServices) setActiveTab('services');
    }
  }, [customerContext]);

  // Track edits
  const isRMT = ['replacement', 'maintenance', 'return'].includes(callType);

  /** Stable signature so item selection updates ملاحظات الاتصال without spurious effect runs. */
  const rmtItemsSig = useMemo(() => {
    const sig = (arr) =>
      (arr || [])
        .map(
          (it) =>
            `${it?.item_id ?? ''}:${String(it?.name || '').trim()}:${it?.order_quantity ?? it?.quantity ?? 1}:${it?.sku ?? ''}`
        )
        .join('|');
    return `${sig(itemsToSend)}@@${sig(itemsToReceive)}`;
  }, [itemsToSend, itemsToReceive]);

  /** Bosta package / shipment note — when empty, ملاحظات الاتصال use only هنسلم/هنستلم (no old snapshot text under السبب). */
  const bostaDisplayNoteText = useMemo(() => {
    if (!selectedBostaOrder) return '';
    return (getBostaOrderDisplayNote(selectedBostaOrder, customerContext?.services || []) || '').trim();
  }, [selectedBostaOrder, customerContext?.services]);

  const discardLegacyCallNotes = !bostaDisplayNoteText;

  // استبدال / صيانة / إرجاع: auto-fill هنسلم / هنستلم / السبب من أسماء العناصر في المخزون
  useEffect(() => {
    if (!isRMT || isReadOnly) return;
    if (!itemsToSend?.length && !itemsToReceive?.length) return;
    setEditableNotes((prev) =>
      mergeRmtCallNotes(prev, itemsToSend, itemsToReceive, callType, { discardLegacyCallNotes })
    );
  }, [rmtItemsSig, callType, isRMT, isReadOnly, discardLegacyCallNotes]);

  const sellItemsSig = useMemo(() => {
    const sig = (arr) =>
      (arr || [])
        .map(
          (it) =>
            `${it?.item_id ?? ''}:${String(it?.name || '').trim()}:${it?.order_quantity ?? it?.quantity ?? 1}:${it?.sku ?? ''}`
        )
        .join('|');
    return sig(editableItems);
  }, [editableItems]);

  /** بيع: ملاحظات الاتصال — نفس فكرة RMT (قالب + السبب:) لكن من سطر المنتجات فقط؛ وصف الطلب منفصل داخل المحرر. */
  useEffect(() => {
    if (callType !== 'sell' || isReadOnly) return;
    if (!editableItems?.length) return;
    setEditableNotes((prev) => mergeSellSessionNotes(prev, editableItems, { discardLegacyCallNotes }));
  }, [sellItemsSig, callType, isReadOnly, discardLegacyCallNotes]);

  // When agent switches call-type chip (manual only): default flow + re-sign magnitude.
  // Do not run when loadData/sync sets callType (e.g. sell → replacement) — that was forcing تحصيل and wiping snapshot استرداد (-COD).
  useEffect(() => {
    if (callType === 'ask') {
      prevCallTypeRef.current = callType;
      return;
    }
    if (prevCallTypeRef.current === null) {
      prevCallTypeRef.current = callType;
      return;
    }
    if (prevCallTypeRef.current === callType) return;
    if (!callTypeManualRef.current) {
      prevCallTypeRef.current = callType;
      return;
    }
    callTypeManualRef.current = false;
    prevCallTypeRef.current = callType;
    const refund = callType === 'return';
    setCashFlowMode(refund ? 'refund' : 'collect');
    setEditableTotal((t) => {
      const m = Math.abs(Number(t) || 0);
      if (m === 0) return 0;
      return refund ? -m : m;
    });
    setTotalAmount((t) => {
      const m = Math.abs(Number(t) || 0);
      if (m === 0) return 0;
      return refund ? -m : m;
    });
  }, [callType]);

  useEffect(() => {
    if (!order) {
      setHasEdits(editableNotes.trim().length > 0 || editableDescription.trim().length > 0);
      return;
    }
    let itemsChanged = false;
    if (isRMT) {
      itemsChanged =
        JSON.stringify(itemsToSend) !== JSON.stringify(orderItemsToSend) ||
        JSON.stringify(itemsToReceive) !== JSON.stringify(orderItemsToReceive);
    } else {
      itemsChanged = JSON.stringify(editableItems) !== JSON.stringify(orderItems);
    }
    const totalChanged = Math.abs(editableTotal - totalAmount) > 0.01;
    const notesChanged = editableNotes.trim() !== (initialCallNotesRef.current || '').trim();
    const descriptionChanged = editableDescription.trim() !== (order.order_description || '').trim();

    setHasEdits(itemsChanged || totalChanged || notesChanged || descriptionChanged);
  }, [editableItems, editableTotal, editableNotes, editableDescription, orderItems, totalAmount, order, isRMT, itemsToSend, itemsToReceive, orderItemsToSend, orderItemsToReceive]);

  /** Cart lines in the session editor — always use live state so leader modal matches the panel (hasEdits is false for amount-only edits). */
  const leaderSessionItemLines = useMemo(() => {
    if (isRMT) {
      return [...(itemsToSend || []), ...(itemsToReceive || [])];
    }
    return editableItems || [];
  }, [isRMT, itemsToSend, itemsToReceive, editableItems]);

  /**
   * Manual نوع المكالمة only: save current cart for `callType`, then restore stash for `next` (or server baseline).
   * Replaces the old effect that cleared send/receive on sell and cleared sell lines on R/M/T.
   */
  const switchCallType = useCallback(
    (next) => {
      const allowed = ['ask', 'sell', 'replacement', 'maintenance', 'return'];
      if (!allowed.includes(next) || next === callType) return;
      callTypeManualRef.current = true;
      codAmountUserLockedRef.current = false;

      const prev = callType;
      const stash = callTypeSessionStashRef.current;

      if (prev === 'sell') {
        stash.sell = {
          editableItems: sessionClone(editableItems),
          editableTotal,
          totalAmount,
          cashFlowMode
        };
      } else if (['replacement', 'maintenance', 'return'].includes(prev)) {
        stash[prev] = {
          itemsToSend: sessionClone(itemsToSend),
          itemsToReceive: sessionClone(itemsToReceive),
          editableTotal,
          totalAmount,
          cashFlowMode
        };
      }

      setCallType(next);

      const applySell = (fromStash) => {
        if (fromStash) {
          setEditableItems(sessionClone(fromStash.editableItems || []));
          setEditableTotal(fromStash.editableTotal ?? 0);
          setTotalAmount(fromStash.totalAmount ?? 0);
          setCashFlowMode(fromStash.cashFlowMode || 'collect');
          setEditableDescription(itemsToDescriptionText(fromStash.editableItems || []));
          setTempDescription(itemsToDescriptionText(fromStash.editableItems || []));
        } else if (order) {
          const b = baselineSellStateFromOrder(order, orderItems);
          setEditableItems(b.editableItems);
          setEditableTotal(b.editableTotal);
          setTotalAmount(b.totalAmount);
          setCashFlowMode(b.cashFlowMode);
          const d = (orderItems || []).length ? itemsToDescriptionText(orderItems) : (order.order_description || '');
          setEditableDescription(d);
          setTempDescription(d);
        } else {
          setEditableItems([]);
          setEditableTotal(0);
          setTotalAmount(0);
          setCashFlowMode('collect');
        }
      };

      const applyRmt = (key) => {
        const saved = stash[key];
        if (saved && (Array.isArray(saved.itemsToSend) || Array.isArray(saved.itemsToReceive))) {
          const s = sessionClone(saved.itemsToSend || []);
          const r = sessionClone(saved.itemsToReceive || []);
          setItemsToSend(s);
          setItemsToReceive(r);
          setEditableTotal(saved.editableTotal ?? 0);
          setTotalAmount(saved.totalAmount ?? 0);
          setCashFlowMode(saved.cashFlowMode || (key === 'return' ? 'refund' : 'collect'));
        } else if (order) {
          const s = sessionClone(orderItemsToSend || []);
          const r = sessionClone(orderItemsToReceive || []);
          setItemsToSend(s);
          setItemsToReceive(r);
          const { signedTotal, cashFlowMode: flow } = baselineRmtTotalsFromOrder(order, s, r, key);
          setEditableTotal(signedTotal);
          setTotalAmount(signedTotal);
          setCashFlowMode(flow);
        } else {
          setItemsToSend([]);
          setItemsToReceive([]);
          setEditableTotal(0);
          setTotalAmount(0);
          setCashFlowMode(key === 'return' ? 'refund' : 'collect');
        }
      };

      if (next === 'sell') {
        applySell(stash.sell);
      } else if (['replacement', 'maintenance', 'return'].includes(next)) {
        applyRmt(next);
      }

      let skipBostaApply = false;
      if (next === 'sell') {
        const s = stash.sell;
        if (s && Array.isArray(s.editableItems) && s.editableItems.length > 0) skipBostaApply = true;
      } else if (['replacement', 'maintenance', 'return'].includes(next)) {
        const s = stash[next];
        if (
          s &&
          ((Array.isArray(s.itemsToSend) && s.itemsToSend.length > 0) ||
            (Array.isArray(s.itemsToReceive) && s.itemsToReceive.length > 0))
        ) {
          skipBostaApply = true;
        }
      }
      skipBostaApplyMatchedRef.current = skipBostaApply;
      suppressBostaShipmentToastRef.current = true;

      // So the effect below does not re-apply sign flip on totals after we restored stash/baseline
      prevCallTypeRef.current = next;
    },
    [
      callType,
      editableItems,
      editableTotal,
      totalAmount,
      cashFlowMode,
      itemsToSend,
      itemsToReceive,
      order,
      orderItems,
      orderItemsToSend,
      orderItemsToReceive
    ]
  );

  // Initialize cancel reason notes with call notes when modal opens
  useEffect(() => {
    if (showCancelModal && editableNotes && editableNotes.trim()) {
      setCancellationReasonNotes(editableNotes.trim());
    } else if (showCancelModal && !editableNotes) {
      setCancellationReasonNotes('');
    }
  }, [showCancelModal, editableNotes]);

  const handleCallCenterAmountChange = useCallback(({ flow, signed }) => {
    codAmountUserLockedRef.current = true;
    setCashFlowMode(flow);
    setEditableTotal(signed);
    setTotalAmount(signed);
  }, []);

  // Handle items change (from OrderItemsEditor). COD is only from amount panel (onUserCodChange) / hydrated load.
  const handleItemsChange = useCallback((items) => {
    setEditableItems(items);
    setEditableDescription(itemsToDescriptionText(items));
  }, []);

  const handleSellUserCodChange = useCallback(({ flow, signed }) => {
    codAmountUserLockedRef.current = true;
    setCashFlowMode(flow);
    setEditableTotal(signed);
    setTotalAmount(signed);
  }, []);

  // Handle notes change
  const handleNotesChange = useCallback((notes) => {
    setEditableNotes(notes);
  }, []);

  // Start editing description
  const handleStartEditDescription = useCallback(() => {
    setTempDescription(editableDescription);
    setIsEditingDescription(true);
  }, [editableDescription]);

  // Cancel editing description
  const handleCancelEditDescription = useCallback(() => {
    setTempDescription(editableDescription);
    setIsEditingDescription(false);
  }, [editableDescription]);

  // Confirm description edit
  const handleConfirmEditDescription = useCallback(() => {
    if (tempDescription.trim() !== editableDescription.trim()) {
      const agentName = userInfo?.name || userInfo?.username || 'وكيل غير معروف';
      const editDate = new Date().toISOString();

      // Add to history
      setDescriptionEditHistory(prev => [{
        agentName,
        editDate,
        oldValue: editableDescription,
        newValue: tempDescription
      }, ...prev]);

      // Update current description
      setEditableDescription(tempDescription);
    }
    setIsEditingDescription(false);
  }, [tempDescription, editableDescription, userInfo]);

  // Copy phone number
  const handleCopyPhone = useCallback(async (phone) => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to copy phone:', error);
    }
  }, []);

  const handleCopyCallNotes = useCallback(async () => {
    const text = editableNotes ?? '';
    if (!String(text).trim()) {
      toast.error('لا يوجد نص للنسخ');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('تم نسخ ملاحظات الاتصال');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to copy call notes:', err);
      toast.error('تعذر النسخ');
    }
  }, [editableNotes]);

  // Persist customer info (name, phones) — update existing or create new
  const handleSaveCustomer = useCallback(async (payload, onDone) => {
    const customer = customerContext?.customer;
    const phone = payload.phone?.trim() || customer?.phone || order?.customer?.phone || order?.customer_phone;
    if (!phone) {
      toast.error('رقم الهاتف مطلوب');
      onDone?.();
      return;
    }
    setSavingCustomer(true);
    try {
      if (customer?.id) {
        const res = await customerAPI.updateCustomer(customer.id, {
          name: payload.name?.trim() || undefined,
          phone: payload.phone?.trim() || undefined,
          phone_secondary: payload.phone_secondary?.trim() || undefined
        });
        const updated = res?.data ?? res;
        if (updated) {
          setCustomerContext(prev => prev ? { ...prev, customer: updated } : { customer: updated, orders: [], services: [] });
        }
        toast.success('تم تحديث بيانات العميل');
      } else {
        const result = await customerAPI.createOrGetCustomer({
          name: payload.name?.trim() || customer?.name || order?.customer?.name || 'عميل من جلسة اتصال',
          phone: payload.phone?.trim() || phone,
          phone_secondary: payload.phone_secondary?.trim() || undefined,
          governorate: customer?.governorate,
          city: customer?.city,
          address_details: customer?.address_details,
          created_by: 'call_session'
        });
        const newCustomer = result?.customer;
        if (newCustomer) {
          setCustomerContext(prev => prev ? { ...prev, customer: newCustomer } : { customer: newCustomer, orders: [], services: [] });
        }
        toast.success(result?.deduplicated ? 'تم ربط الرقم بعميل موجود' : 'تم إنشاء العميل');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'فشل حفظ بيانات العميل';
      toast.error(msg);
    } finally {
      setSavingCustomer(false);
      onDone?.();
    }
  }, [customerContext, order]);

  // Persist address — update existing or create customer with address
  const handleSaveAddress = useCallback(async (payload, onDone) => {
    const customer = customerContext?.customer;
    const phone = customer?.phone || order?.customer?.phone || order?.customer_phone;
    setSavingAddress(true);
    try {
      if (customer?.id) {
        const res = await customerAPI.updateCustomer(customer.id, {
          governorate: payload.governorate || undefined,
          city: payload.city || undefined,
          address_details: payload.address_details || undefined
        });
        const updated = res?.data ?? res;
        if (updated) {
          setCustomerContext(prev => prev ? { ...prev, customer: updated } : { customer: updated, orders: [], services: [] });
        }
        toast.success('تم تحديث العنوان');
      } else if (phone) {
        const result = await customerAPI.createOrGetCustomer({
          name: customer?.name || order?.customer?.name || 'عميل من جلسة اتصال',
          phone,
          phone_secondary: customer?.phone_secondary,
          governorate: payload.governorate || undefined,
          city: payload.city || undefined,
          address_details: payload.address_details || undefined,
          created_by: 'call_session'
        });
        const newCustomer = result?.customer;
        if (newCustomer) {
          setCustomerContext(prev => prev ? { ...prev, customer: newCustomer } : { customer: newCustomer, orders: [], services: [] });
        }
        toast.success(result?.deduplicated ? 'تم ربط العنوان بعميل موجود' : 'تم إنشاء العميل والعنوان');
      } else {
        toast.error('رقم الهاتف مطلوب لربط العنوان');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'فشل حفظ العنوان';
      toast.error(msg);
    } finally {
      setSavingAddress(false);
      onDone?.();
    }
  }, [customerContext, order]);

  // Navigate to service ticket
  const handleServiceTicketClick = useCallback((ticket) => {
    // Try to get ticket ID from various possible fields
    const ticketId = ticket.id || ticket.ticket_id || ticket.service_id;

    // If no ID, try to extract from ticket_number (format: HVR-YYYYMMDD-XXXX)
    // But we need the actual ticket ID, not the number
    // For now, navigate with ticket_number as fallback
    if (ticketId) {
      navigate(`/?serviceId=${ticketId}`);
    } else if (ticket.ticket_number) {
      // Try to find ticket by number - this might not work, but it's a fallback
      if (import.meta.env.DEV) console.warn('No ticket ID found, using ticket_number:', ticket.ticket_number);
      // Could search for ticket by number, but for now just log
    }
  }, [navigate]);

  // Phase B: Handle confirm for ASK-only (direct call, no order)
  const handleConfirmAsk = useCallback(async () => {
    const phone = customerContext?.customer?.phone;
    if (!phone || !String(phone).trim()) {
      toast.error('رقم الهاتف مطلوب لتسجيل الاستفسار');
      return;
    }
    setActionLoading(true);
    try {
      await askOnly({
        customer_phone: String(phone).trim(),
        notes: editableNotes || 'استفسار',
        agent_id: userInfo?.id ?? 1,
        agent_name: userInfo?.name || userInfo?.phone || ''
      });
      toast.success('تم تسجيل الاستفسار بنجاح');
      setIsExpanded(false);
      if (onComplete) onComplete();
    } catch (error) {
      toast.error(error?.message || 'حدث خطأ أثناء تسجيل الاستفسار');
    } finally {
      setActionLoading(false);
    }
  }, [customerContext?.customer?.phone, editableNotes, userInfo?.id, onComplete]);

  // Handle confirm
  const handleConfirm = useCallback(async () => {
    // Validate based on call type requirements
    const config = CALL_TYPE_CONFIG[callType];
    const effectiveDeliveryDate = deliveryDate || (config?.requiresDeliveryDate ? new Date().toISOString().split('T')[0] : '');
    if (config?.requiresDeliveryDate && !effectiveDeliveryDate) {
      alert('يرجى تحديد تاريخ التسليم');
      return;
    }
    if (config?.requiresItems) {
      if (['replacement', 'maintenance', 'return'].includes(callType)) {
        const hasSend = (itemsToSend?.length || 0) > 0;
        const hasReceive = (itemsToReceive?.length || 0) > 0;
        if (callType === 'replacement' && (!hasSend || !hasReceive)) {
          alert('يجب إضافة عناصر للإرسال وعناصر للاستلام للاستبدال');
          return;
        }
        if (callType === 'maintenance' && (!hasSend || !hasReceive)) {
          alert('يجب إضافة عناصر للإرسال وللاستلام للصيانة');
          return;
        }
        if (callType === 'return' && !hasReceive) {
          alert('يجب إضافة عناصر للاستلام للإرجاع (مرتبطة بالمخزون)');
          return;
        }
        const recv = hasEdits ? itemsToReceive : orderItemsToReceive || [];
        const send = hasEdits ? itemsToSend : orderItemsToSend || [];
        const rmtLines = callType === 'return' ? recv : [...send, ...recv];
        if (
          (callType === 'return' || callType === 'maintenance') &&
          rmtLines.length > 0 &&
          rmtLines.every((i) => !sellLineHasStockId(i))
        ) {
          alert('كل البنود بدون ربط مخزون — اختر المنتج من البحث حتى تُحفظ في الطلب والتذكرة');
          return;
        }
      } else if (!editableItems?.length || editableItems.every((i) => !sellLineHasStockId(i))) {
        alert('يجب إضافة عناصر');
        return;
      }
    }

    setActionLoading(true);
    try {
      const finalNotes = hasEdits ? editableNotes : (order.order_description || '');
      const finalDescription = hasEdits ? editableDescription : (order.order_description || '');
      const finalTotal = hasEdits ? editableTotal : totalAmount;
      const finalItems = ['replacement', 'maintenance', 'return'].includes(callType)
        ? [
            ...(hasEdits ? itemsToSend : orderItemsToSend || []).map((it) => ({ ...it, direction: 'send' })),
            ...(hasEdits ? itemsToReceive : orderItemsToReceive || []).map((it) => ({ ...it, direction: 'receive' }))
          ]
        : (hasEdits ? editableItems : orderItems) || [];

      const customer = customerContext?.customer || order?.customer;
      // cod_amount: exactly what the agent entered in the session (including 0). Never Σ line prices.
      const codAmount = Number.isFinite(Number(finalTotal)) ? Number(finalTotal) : 0;
      const confirmPayload = {
        delivery_date: effectiveDeliveryDate,
        total: codAmount,
        cod_amount: codAmount,
        history: finalNotes || 'تم تأكيد الطلب',
        order_description: finalDescription,
        call_type: callType,
        _userInfo: userInfo
      };
      if (customer?.phone) confirmPayload.customer_phone = String(customer.phone).trim();
      const trResolved = (() => {
        if (callType === 'ask') return '';
        if (trackingEntryMode === 'manual') return (manualTrackingInput || '').trim();
        const tr = selectedBostaOrder?.trackingNumber || selectedBostaOrder?.tracking_number;
        return tr ? String(tr).trim() : '';
      })();
      if (trResolved.length >= ORIGINAL_TRACKING_MIN_LEN) confirmPayload.original_tracking = trResolved;

      // Validation: call_type consistency
      if (import.meta.env.DEV && confirmPayload.call_type !== callType) {
        console.error('[CallSessionFAB] call_type mismatch:', { payload: confirmPayload.call_type, state: callType });
      }

      if (['replacement', 'maintenance', 'return'].includes(callType)) {
        confirmPayload.itemsToSend = hasEdits ? itemsToSend : orderItemsToSend;
        confirmPayload.itemsToReceive = hasEdits ? itemsToReceive : orderItemsToReceive;
        /** Unified list for confirmOrder when send/receive arrays are empty ([] is truthy — API must use .length); mirrors snapshot `items`. */
        confirmPayload.items = finalItems;
      } else {
        confirmPayload.items = hasEdits ? editableItems : orderItems;
      }

      await confirmOrder(order.id, confirmPayload);

      // Unlock order
      await unlockOrder(order.id);

      // Notify about modification if edits were applied
      if (hasEdits && onModification) {
        onModification(order.id, {
          items: finalItems,
          total: finalTotal,
          notes: finalNotes
        });
      }

      setIsExpanded(false);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'حدث خطأ أثناء تأكيد الطلب';
      if (import.meta.env.DEV) console.error('Error confirming order:', error?.response?.data || error);
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  }, [order, customerContext, deliveryDate, callType, hasEdits, editableItems, editableTotal, editableNotes, editableDescription, orderItems, totalAmount, itemsToSend, itemsToReceive, orderItemsToSend, orderItemsToReceive, selectedBostaOrder, trackingEntryMode, manualTrackingInput, userInfo, onComplete, onModification, cashFlowMode]);

  // Handle confirm (direct call, sell/R/M/T) — create order + confirm
  const handleConfirmDirect = useCallback(async () => {
    const phone = customerContext?.customer?.phone;
    if (!phone || !String(phone).trim()) {
      toast.error('رقم الهاتف مطلوب');
      return;
    }
    const effectiveDate = deliveryDate || new Date().toISOString().split('T')[0];
    if (!effectiveDate) {
      toast.error('يرجى تحديد تاريخ التسليم');
      return;
    }
    const customer = customerContext?.customer;
    const bostaOrders = customerContext?.orders || [];
    const firstBosta = bostaOrders?.[0];
    const addrFromBosta = firstBosta?.customerAddress && typeof firstBosta.customerAddress === 'object'
      ? firstBosta.customerAddress
      : firstBosta?.dropOffAddress || firstBosta?.pickupAddress;
    const governorate = customer?.governorate || addrFromBosta?.city?.nameAr || addrFromBosta?.city || '';
    const city = customer?.city || addrFromBosta?.zone?.nameAr || addrFromBosta?.zone || '';
    const addressDetails = customer?.address_details || addrFromBosta?.fullAddress || addrFromBosta?.firstLine || '';
    const deliveryAddress = [addressDetails, city, governorate].filter(Boolean).join(' — ') || addressDetails;
    const hasAddress = !!(governorate || deliveryAddress);
    if (!hasAddress) {
      toast.error('العنوان مطلوب');
      return;
    }
    // Validate based on call type requirements
    const config = CALL_TYPE_CONFIG[callType];
    if (config?.requiresItems) {
      if (['replacement', 'maintenance', 'return'].includes(callType)) {
        const hasSend = (itemsToSend?.length || 0) > 0;
        const hasReceive = (itemsToReceive?.length || 0) > 0;
        if (callType === 'replacement' && (!hasSend || !hasReceive)) {
          toast.error('يجب إضافة عناصر للإرسال وعناصر للاستلام للاستبدال');
          return;
        }
        if (callType === 'maintenance' && (!hasSend || !hasReceive)) {
          toast.error('يجب إضافة عناصر للإرسال وللاستلام للصيانة');
          return;
        }
        if (callType === 'return' && !hasReceive) {
          toast.error('يجب إضافة عناصر للاستلام للإرجاع (مرتبطة بالمخزون)');
          return;
        }
        const rmtLines = callType === 'return' ? (itemsToReceive || []) : [...(itemsToSend || []), ...(itemsToReceive || [])];
        if (
          (callType === 'return' || callType === 'maintenance') &&
          rmtLines.length > 0 &&
          rmtLines.every((i) => !sellLineHasStockId(i))
        ) {
          toast.error('كل البنود بدون ربط مخزون — اختر المنتج من البحث');
          return;
        }
      } else if (!editableItems?.length || editableItems.every((i) => !sellLineHasStockId(i))) {
        toast.error('يجب إضافة عناصر');
        return;
      }
    }
    if (config?.requiresAddress && !hasAddress) {
      toast.error('العنوان مطلوب');
      return;
    }
    setActionLoading(true);
    try {
      const codAmount = Number.isFinite(Number(editableTotal)) ? Number(editableTotal) : 0;
      const { order: newOrder } = await createDirectOrder({
        customer_phone: String(phone).trim(),
        customer_name: customer?.name || '',
        source: 'direct',
        service_type: callType,
        delivery_address: deliveryAddress || undefined,
        governorate: governorate || undefined,
        city: city || undefined,
        cod_amount: codAmount
      });
      const orderId = newOrder?.id;
      if (!orderId) {
        throw new Error('لم يتم إنشاء الطلب');
      }
      const confirmPayload = {
        delivery_date: effectiveDate,
        total: codAmount,
        cod_amount: codAmount,
        call_type: callType,
        history: editableNotes || 'تم التأكيد',
        _userInfo: userInfo
      };
      const trDirect = (() => {
        if (callType === 'ask') return '';
        if (trackingEntryMode === 'manual') return (manualTrackingInput || '').trim();
        const tr = selectedBostaOrder?.trackingNumber || selectedBostaOrder?.tracking_number;
        return tr ? String(tr).trim() : '';
      })();
      if (trDirect.length >= ORIGINAL_TRACKING_MIN_LEN) confirmPayload.original_tracking = trDirect;
      if (['replacement', 'maintenance', 'return'].includes(callType)) {
        confirmPayload.itemsToSend = itemsToSend || [];
        confirmPayload.itemsToReceive = itemsToReceive || [];
        confirmPayload.items = [
          ...(itemsToSend || []).map((it) => ({ ...it, direction: 'send' })),
          ...(itemsToReceive || []).map((it) => ({ ...it, direction: 'receive' }))
        ];
      } else {
        confirmPayload.items = editableItems || [];
      }
      await confirmOrder(orderId, confirmPayload);
      setIsExpanded(false);
      toast.success('تم التأكيد. بانتظار موافقة المشرف.');
      if (onComplete) onComplete();
    } catch (error) {
      toast.error(error?.message || 'حدث خطأ أثناء التأكيد');
    } finally {
      setActionLoading(false);
    }
  }, [customerContext, deliveryDate, callType, editableItems, editableTotal, editableNotes, itemsToSend, itemsToReceive, selectedBostaOrder, trackingEntryMode, manualTrackingInput, userInfo, onComplete, cashFlowMode]);

  // Handle cancel
  const handleCancel = useCallback(async () => {
    const reason = cancellationReasonNotes.trim();
    if (!reason) {
      toast.error('يرجى إدخال سبب الإلغاء');
      return;
    }

    setActionLoading(true);
    /** Leader رفض on مؤكدة — close session. Agent إلغاء on جديد/مجدولة — stay open to reactivate. */
    const endSessionAfterCancel = order?.status === 'confirmed';
    try {
      await cancelOrder(order.id, reason, editableNotes || reason, callType, userInfo);
      setShowCancelModal(false);
      setCancellationReasonNotes('');
      updateActiveOrder({ status: 'canceled', cancellation_reason: reason });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('callCenterQueueRefresh'));
      }
      if (endSessionAfterCancel) {
        toast.success('تم إلغاء الطلب');
        if (onComplete) onComplete();
      } else {
        toast.success('تم إلغاء الطلب. يمكنك تأكيد أو مؤجلة أو «لم يرد» لإعادة تفعيل الطلب.');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error canceling order:', error);
      const msg = error?.response?.data?.message || 'حدث خطأ أثناء إلغاء الطلب';
      toast.error(msg);
    } finally {
      // Unlock failure should never hide successful cancel/update in UI.
      if (order?.id) {
        await unlockOrder(order.id).catch((err) => {
          if (import.meta.env.DEV) console.error('Error unlocking after cancel:', err);
        });
      }
      setActionLoading(false);
    }
  }, [order, cancellationReasonNotes, callType, editableNotes, userInfo, updateActiveOrder, onComplete]);

  // Handle schedule — date only, default 10:00
  const handleSchedule = useCallback(async () => {
    if (!scheduledDate) {
      alert('يرجى تحديد تاريخ التأجيل');
      return;
    }

    setActionLoading(true);
    try {
      const scheduledDateTime = `${scheduledDate}T10:00:00`;
      await scheduleOrder(order.id, scheduledDateTime, editableNotes || 'تم تأجيل الطلب', callType, userInfo);
      await unlockOrder(order.id);
      setShowScheduleModal(false);
      setIsExpanded(false);
      if (onComplete) onComplete();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error scheduling order:', error);
      alert('حدث خطأ أثناء تأجيل الطلب');
    } finally {
      setActionLoading(false);
    }
  }, [order, scheduledDate, callType, editableNotes, onComplete]);

  // Handle no answer
  const handleNoAnswer = useCallback(async () => {
    setActionLoading(true);
    try {
      // Don't apply edits on no answer
      await noAnswerOrder(order.id, editableNotes || 'لم يرد العميل', callType, userInfo);

      // Unlock order
      await unlockOrder(order.id);

      setIsExpanded(false);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error logging no answer:', error);
      alert('حدث خطأ أثناء تسجيل عدم الرد');
    } finally {
      setActionLoading(false);
    }
  }, [order, editableNotes, callType, onComplete]);

  // Handle end session (collapse)
  const handleEndSession = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // Handle FAB close (clear session)
  const handleFABClose = useCallback(async () => {
    if (order) {
      await unlockOrder(order.id).catch(err => { if (import.meta.env.DEV) console.error('Error unlocking order:', err); });
    }
    if (onClose) {
      onClose();
    }
  }, [order, onClose]);

  const sortedBostaOrders = useMemo(() => {
    const bostaOrders = customerContext?.orders || [];
    const ord = order;
    const tracking = ord?.bosta_tracking_number || ord?.bosta_tracking;
    const codFromOrder = ord?.cod_amount;
    const feesFromOrder = ord?.bosta_fees;
    const sortByDate = (a, b) => {
      const getDate = (o) => {
        const d = o?.createdAt || o?.timestamps?.created;
        return d ? new Date(d).getTime() : 0;
      };
      return getDate(b) - getDate(a);
    };
    if (!tracking && codFromOrder == null && feesFromOrder == null) {
      return [...bostaOrders].sort(sortByDate);
    }
    const enriched = bostaOrders.map((o) => {
      const tr = o?.trackingNumber || o?.tracking_number;
      const match = tr && String(tr).trim() === String(tracking).trim();
      if (!match) return o;
      const fin = o?.financial && typeof o.financial === 'object'
        ? { ...o.financial }
        : { cod: 0, bostaFees: 0, bostaFeesNet: 0, bostaFeesGross: 0 };
      if (codFromOrder != null && (fin.cod === 0 || fin.cod === undefined)) fin.cod = Number(codFromOrder) || 0;
      if (feesFromOrder != null && (fin.bostaFees === 0 || fin.bostaFees === undefined)) {
        const fee = Number(feesFromOrder) || 0;
        fin.bostaFees = fee;
        if (fin.bostaFeesNet == null || fin.bostaFeesNet === 0) fin.bostaFeesNet = fee;
        if (fin.bostaFeesGross == null || fin.bostaFeesGross === 0) fin.bostaFeesGross = fee;
      }
      return { ...o, financial: fin };
    });
    return [...enriched].sort(sortByDate);
  }, [customerContext?.orders, order?.bosta_tracking_number, order?.bosta_tracking, order?.cod_amount, order?.bosta_fees]);

  const resolvedOriginalTracking = useMemo(() => {
    if (callType === 'ask') return '';
    if (trackingEntryMode === 'manual') return (manualTrackingInput || '').trim();
    if (trackingEntryMode === 'list' && selectedBostaOrder) {
      const tr = selectedBostaOrder.trackingNumber || selectedBostaOrder.tracking_number;
      return tr ? String(tr).trim() : '';
    }
    return '';
  }, [callType, trackingEntryMode, manualTrackingInput, selectedBostaOrder]);

  const bostaRowForCod = useMemo(() => {
    if (callType === 'ask') return null;
    if (trackingEntryMode === 'list' && selectedBostaOrder) return selectedBostaOrder;
    const t = (manualTrackingInput || '').trim();
    if (trackingEntryMode === 'manual' && t) {
      const norm = (o) => String(o?.trackingNumber ?? o?.tracking_number ?? '').trim();
      return sortedBostaOrders.find((o) => norm(o) === t) || null;
    }
    return null;
  }, [callType, trackingEntryMode, manualTrackingInput, selectedBostaOrder, sortedBostaOrders]);

  const bostaCodVerify = useMemo(() => {
    if (callType === 'ask' || isReadOnly) return { status: 'idle', message: '' };
    const tr = resolvedOriginalTracking;
    if (!tr || tr.length < ORIGINAL_TRACKING_MIN_LEN) return { status: 'idle', message: '' };
    const row = bostaRowForCod;
    const codRaw = row != null ? getBostaCodValue(row) : null;
    const cod = codRaw != null && Number.isFinite(Number(codRaw)) ? Number(codRaw) : null;
    if (row == null || cod == null || Math.abs(cod) < BOSTA_COD_EPS) {
      if (trackingEntryMode === 'manual' && tr) {
        return {
          status: 'unverified',
          message: 'لم يُعثر على COD لهذا الرقم في قائمة الشحنات الحالية',
        };
      }
      return { status: 'unverified', message: 'لا COD متاح للتحقق لهذه الشحنة' };
    }
    const entered = Number(editableTotal);
    if (!Number.isFinite(entered)) return { status: 'idle', message: '' };
    const match = Math.abs(entered - cod) < BOSTA_COD_EPS;
    return {
      status: match ? 'match' : 'mismatch',
      message: match
        ? 'المبلغ المدخل يطابق COD الشحنة المربوطة'
        : 'يختلف المبلغ المدخل عن COD الشحنة المربوطة',
    };
  }, [callType, isReadOnly, resolvedOriginalTracking, bostaRowForCod, trackingEntryMode, editableTotal]);

  if (!order && !customerContextProp) return null;

  const customerName = customer?.name || (isDirectCall ? 'استفسار جديد' : 'غير محدد');
  const customerPhone = customer?.phone || order?.customer?.phone || '-';
  const bostaOrders = customerContext?.orders || [];
  const serviceTickets = customerContext?.services || [];

  const clearBostaTrackingLink = () => {
    setSelectedBostaOrder(null);
    setManualTrackingInput('');
    setTrackingEntryMode('none');
  };

  const toggleBostaCardSelection = (bostaOrder) => {
    if (selectedBostaOrder === bostaOrder) {
      setSelectedBostaOrder(null);
      setTrackingEntryMode('none');
      setManualTrackingInput('');
    } else {
      setManualTrackingInput('');
      setTrackingEntryMode('list');
      setSelectedBostaOrder(bostaOrder);
    }
  };

  const formatTicketNumberForDisplay = (ticketNumber) => {
    if (!ticketNumber || typeof ticketNumber !== 'string') return null;
    const t = String(ticketNumber).trim();
    const match = t.match(/^([A-Za-z]+)(\d{2})(\d{2})(\d{2})(\d{2,4})$/);
    if (match) {
      const [, prefix, yy, mm, dd, seq] = match;
      return { prefix, yy, mm, dd, seq };
    }
    const fallback = t.match(/^([A-Za-z]+)(.*)$/);
    if (fallback) return { prefix: fallback[1], raw: fallback[2] || '' };
    return { prefix: '', raw: t };
  };

  // Get service type label
  const getServiceTypeLabel = (type) => {
    const labels = {
      'maintenance': 'صيانة',
      'replacement': 'استبدال',
      'return': 'استرجاع',
      'sell': 'بيع'
    };
    return labels[type] || type;
  };

  const getStatusLabelHelper = (val, isBostaOrder = false) =>
    isBostaOrder ? getStatusLabel(val) : getServiceStatusLabel(val);
  const getStatusBadgeColorHelper = (val, isBostaOrder = false) =>
    isBostaOrder ? getStatusBadgeColor(val) : getServiceStatusBadgeColor(val);

  return (
    <>
      {/* FAB Button with Actions */}
      <div
        className={`
          fixed z-50
          transition-all duration-300 ease-out
          bottom-4 left-4
          sm:bottom-4 sm:left-4
          flex items-center gap-2 sm:gap-3
          ${isExpanded ? 'flex-col sm:flex-row' : 'flex-row'}
        `}
        dir="ltr"
      >
        {/* Main FAB - Call State Indicator */}
        <div
          className={`
            bg-brand-blue-600 dark:bg-brand-blue-700
            text-white
            rounded-2xl
            shadow-2xl
            flex items-center gap-2 sm:gap-3
            transition-all duration-300 ease-out
            px-3 py-2 sm:px-4 sm:py-3
            ${!isExpanded ? 'cursor-pointer hover:bg-brand-blue-700 dark:hover:bg-brand-blue-600' : ''}
            relative
          `}
          onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
          dir="rtl"
        >
          {/* Call Indicator - Pulsing Dot */}
          <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-400 dark:bg-green-500 rounded-full shadow-lg animate-pulse">
            <div className="absolute inset-0 bg-green-400 dark:bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>

          {/* Client Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1 hidden sm:block">
              <div className="text-sm font-bold font-cairo truncate">
                {customerName}
              </div>
              <div className="text-xs opacity-90 font-cairo truncate">
                {customerPhone}
              </div>
            </div>
            {/* Mobile: Show only phone */}
            <div className="min-w-0 flex-1 sm:hidden">
              <div className="text-xs font-bold font-cairo truncate">
                {customerPhone}
              </div>
            </div>
          </div>

          {/* Creative Icon at End */}
          <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer">
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Action Buttons - Creative Floating Pills - On the Right Side - Hidden when expanded */}
        {isExpanded && false && (
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap" dir="rtl">
            {/* Confirm Button */}
            <button
              onClick={isDirectCall && callType === 'ask' ? handleConfirmAsk : (isDirectCall ? handleConfirmDirect : handleConfirm)}
              disabled={actionLoading || loading}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-accent-green-500 hover:bg-accent-green-600 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group font-cairo"
            >
              <CheckCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="text-xs sm:text-sm font-bold font-cairo whitespace-nowrap">تأكيد</span>
            </button>

            {/* No Answer Button */}
            <button
              onClick={handleNoAnswer}
              disabled={actionLoading || loading}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-accent-amber-500 hover:bg-accent-amber-600 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group font-cairo"
            >
              <PhoneOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="text-xs sm:text-sm font-bold font-cairo whitespace-nowrap">لم يرد</span>
            </button>

            {/* Schedule Button */}
            <button
              onClick={() => setShowScheduleModal(true)}
              disabled={actionLoading || loading}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group font-cairo"
            >
              <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="text-xs sm:text-sm font-bold font-cairo whitespace-nowrap">مؤجلة</span>
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading || loading}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-red-600 hover:bg-brand-red-700 text-white rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group font-cairo"
            >
              <XCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              <span className="text-xs sm:text-sm font-bold font-cairo whitespace-nowrap">إلغاء</span>
            </button>
          </div>
        )}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={handleEndSession}
          />

          {/* Expanded Content */}
          <div
            className={`
              fixed z-40
              bg-white dark:bg-gray-800
              rounded-xl shadow-2xl
              transition-all duration-300 ease-out
              flex flex-col
              w-[95%] sm:w-[80%]
              max-w-[1200px]
              h-[90vh] sm:h-[85vh]
              max-h-[90vh] sm:max-h-[85vh]
              bottom-20 sm:bottom-[100px]
              left-1/2
              -translate-x-1/2
            `}
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Call Type Selector — Chip row, RTL, touch-friendly, theme colors from CALL_TYPES */}
            {(() => {
              const callTypeOptions = Object.entries(CALL_TYPE_CONFIG).map(([value, config]) => ({
                value,
                label: config.label,
                Icon: config.Icon,
                typeColors: CALL_TYPES[value]?.colors || CALL_TYPES.ask.colors
              }));
              return (
                <div className="flex-shrink-0 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/95 rounded-t-xl">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3" dir="rtl">
                    <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 font-cairo uppercase tracking-wide shrink-0">
                      نوع المكالمة
                    </span>
                    {callTypeOptions.map(({ value, label, Icon, typeColors }) => {
                      const isSelected = callType === value;
                      const gradient = typeColors?.gradient || 'from-brand-blue-500 to-cyan-500';
                      const bg = typeColors?.bg || 'bg-brand-blue-100 dark:bg-brand-blue-900/40';
                      const text = typeColors?.text || 'text-brand-blue-700 dark:text-brand-blue-200';
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => switchCallType(value)}
                          className={`
                            inline-flex items-center gap-1.5 sm:gap-2
                            min-h-[36px] sm:min-h-[40px] px-3 sm:px-4 py-2
                            rounded-xl font-cairo text-xs sm:text-sm font-semibold
                            transition-all duration-200 ease-out
                            focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                            touch-manipulation
                            ${isSelected
                              ? `bg-gradient-to-r ${gradient} text-white shadow-md hover:opacity-95 focus:ring-2 focus:ring-offset-2 focus:ring-white/50`
                              : `${bg} ${text} border border-gray-200/80 dark:border-gray-600/60 hover:border-gray-300 dark:hover:border-gray-500 focus:ring-gray-400`
                            }
                          `}
                          aria-pressed={isSelected}
                          aria-label={label}
                        >
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Leader info request — show when order was sent back for more info */}
            {order?.confirmation_snapshot?.info_request_message && (
              <div className="flex-shrink-0 mx-3 sm:mx-4 mt-2 p-3 rounded-xl border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20" dir="rtl">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1 font-cairo">طلب المشرف</div>
                <p className="text-sm text-amber-900 dark:text-amber-100 font-cairo leading-relaxed">
                  {order.confirmation_snapshot.info_request_message}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-cairo">
                  عدّل البيانات أو الملاحظات ثم اضغط تأكيد لإعادة الإرسال للمشرف.
                </p>
              </div>
            )}

            {/* Content - Responsive Two Column Layout */}
            <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 lg:p-5 min-h-0 overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 flex-1 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600 dark:text-brand-blue-500 flex-shrink-0" />
                  {(order || isDirectCall) && (
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400 font-cairo" dir="rtl">
                      <div className="font-bold truncate max-w-[200px] sm:max-w-[280px] mx-auto">
                        {order
                          ? (order.customer?.name || order.customer_name || 'تحميل...')
                          : (customerContextProp?.customer?.name
                            || (customerContextProp?.customer?.phone
                              ? formatPhoneForLocalDisplay(customerContextProp.customer.phone)
                              : null)
                            || 'تحميل...')}
                      </div>
                      {order?.id && (
                        <div className="text-xs mt-0.5 opacity-80">طلب #{order.id}</div>
                      )}
                      {isDirectCall && !order && customerContextProp?.customer?.phone && (
                        <div className="text-xs mt-0.5 opacity-80">جاري تحميل ملف العميل...</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Left Column - Customer Context - Matches ServiceModalViewer layout */}
                  <div className="flex-1 lg:flex-[0_0_45%] flex flex-col min-h-0 overflow-y-auto scrollbar-hide space-y-2 sm:space-y-2.5 md:space-y-3 pr-1 sm:pr-2 pb-4 sm:pb-6">
                    {/* Profile: collapse bar or CustomerCard + LocationCard — like ServiceModalViewer */}
                    {(customer || order?.customer) && (
                      <div className="flex-shrink-0 flex flex-col w-full space-y-2 sm:space-y-2.5 md:space-y-3">
                        {/* Hint: always visible when profile incomplete — outside collapsible */}
                        {!isProfileComplete && missingFields.length > 0 && (
                          <div className="flex items-center gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 font-cairo" dir="rtl">
                            <span className="text-[10px] sm:text-xs font-semibold text-amber-800 dark:text-amber-200">
                              اسأل العميل واملأ: {missingFields.join('، ')}
                            </span>
                          </div>
                        )}
                        {/* Collapsed: summary bar (name · phone · city) */}
                        {!customerLocationExpanded && (
                          <button
                            type="button"
                            onClick={() => setCustomerLocationExpandedPersisted(true)}
                            dir="rtl"
                            className="flex items-center gap-2 sm:gap-2.5 w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow text-right font-cairo transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 flex-shrink-0"
                            aria-expanded="false"
                            title="عرض بيانات العميل والعنوان"
                          >
                            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-red-600 text-white shadow-sm" title="العميل">
                              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" aria-hidden />
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0 rotate-[-90deg]" aria-hidden />
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate min-w-0 flex-1">
                              {[
                                (customer?.name || order?.customer?.name || '').trim() || '—',
                                (customer?.phone || order?.customer?.phone || order?.customer_phone)
                                  ? formatPhoneForLocalDisplay(customer?.phone || order?.customer?.phone || order?.customer_phone)
                                  : null,
                                (customer?.city || order?.address_city || '').trim() || null
                              ]
                                .filter(Boolean)
                                .join(' · ') || '—'}
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold text-brand-blue-600 dark:text-brand-blue-400 whitespace-nowrap flex-shrink-0">عرض</span>
                          </button>
                        )}
                        {/* Expanded: cards */}
                        {customerLocationExpanded && (
                          <div className="flex flex-col space-y-2 sm:space-y-2.5 md:space-y-3 min-w-0">
                              <CustomerCard
                                ticket={{
                                  customer_name: customer?.name || order?.customer?.name,
                                  phone: customer?.phone || order?.customer?.phone,
                                  sec_phone: customer?.phone_secondary,
                                  customer: customer
                                }}
                                customerProfile={customerContext?.customer || null}
                                copiedPhone={copiedPhone}
                                onCopyPhone={handleCopyPhone}
                                onSaveCustomer={handleSaveCustomer}
                                saving={savingCustomer}
                                onCollapse={() => setCustomerLocationExpandedPersisted(false)}
                              />
                              {currentCallTypeConfig.showAddress && (
                                <LocationCard
                                  ticket={{
                                    governorate: customer?.governorate || order?.address_governorate,
                                    city: customer?.city || order?.address_city,
                                    customer_address: customer?.address_details || order?.address_full
                                  }}
                                  customerProfile={customerContext?.customer || null}
                                  onSaveAddress={handleSaveAddress}
                                  saving={savingAddress}
                                />
                              )}
                            </div>
                        )}
                      </div>
                    )}

                    {/* Call history: always visible under profile — matches ServiceModalViewer CallHistoryCard */}
                    <div className="flex-shrink-0 w-full">
                      <CallHistoryCard
                        phone={customer?.phone || order?.customer?.phone || order?.customer_phone}
                        customerId={customer?.id ?? order?.customer_id ?? order?.customer?.id}
                      />
                    </div>

                    {/* Bosta/Tickets section — under call history; matches ServiceModalViewer */}
                    {(bostaOrders.length > 0 || serviceTickets.length > 0) && (
                      <div className="flex flex-col shrink-0">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col flex-shrink-0">
                          {/* Tab Navigation - underline style (matches ServiceModalViewer) */}
                          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 overflow-x-auto scrollbar-hide flex-shrink-0">
                            {/* Bosta Tab — exact ServiceModalViewer styling */}
                            {bostaOrders.length > 0 && (
                              <button
                                onClick={() => setActiveTab('bosta')}
                                className={`
                                  flex-1 min-w-[120px] px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold font-cairo transition-colors whitespace-nowrap touch-target
                                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2
                                  ${activeTab === 'bosta'
                                    ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/40 dark:to-rose-900/30 ring-1 ring-red-200 dark:ring-red-800 text-red-700 dark:text-red-300 border-b-2 border-red-400 dark:border-red-600'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                  }
                                `}
                              >
                                <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                                  <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                  <span className="truncate">طلبات Bosta</span>
                                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm text-[9px] sm:text-[10px] font-bold flex-shrink-0 min-w-[18px] text-center ${activeTab === 'bosta'
                                    ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/40 dark:to-rose-900/30 ring-1 ring-red-200 dark:ring-red-800 text-red-700 dark:text-red-300'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {bostaOrders.length}
                                  </span>
                                </div>
                              </button>
                            )}

                            {/* Services Tab — exact ServiceModalViewer styling */}
                            {serviceTickets.length > 0 && (
                              <button
                                onClick={() => setActiveTab('services')}
                                className={`
                                  flex-1 min-w-[120px] px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold font-cairo transition-colors whitespace-nowrap touch-target
                                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2
                                  ${activeTab === 'services'
                                    ? 'bg-white dark:bg-gray-800 text-brand-blue-600 dark:text-brand-blue-400 border-b-2 border-brand-blue-600 dark:border-brand-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                  }
                                `}
                              >
                                <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                                  <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                  <span className="truncate">تذاكر الخدمة</span>
                                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm text-[9px] sm:text-[10px] font-bold flex-shrink-0 min-w-[18px] text-center ${activeTab === 'services'
                                    ? 'bg-brand-blue-50 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {serviceTickets.length}
                                  </span>
                                </div>
                              </button>
                            )}
                          </div>

                          {/* Tab Content — exact ServiceModalViewer padding/scroll */}
                          <div
                            className="px-2 sm:px-2.5 md:px-3 pt-2 sm:pt-2.5 md:pt-3 pb-2 sm:pb-2.5 md:pb-3 overflow-y-auto scrollbar-hide min-h-0 flex-1"
                            dir="rtl"
                            style={{ scrollPaddingBottom: '2rem', scrollBehavior: 'smooth' }}
                          >
                            {/* Bosta Orders Tab — exact ServiceModalViewer card structure */}
                            {activeTab === 'bosta' && sortedBostaOrders.length > 0 && (
                              <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-6">
                                {!isReadOnly && (
                                  <p className="text-[11px] sm:text-sm font-semibold text-gray-700 dark:text-gray-200 font-cairo mb-1.5 leading-snug" dir="rtl">
                                    <span className="font-bold text-gray-900 dark:text-gray-100">ربط شحنة Bosta</span>
                                    {' (اختياري) — اختر بطاقةً'}
                                  </p>
                                )}
                                {sortedBostaOrders.map((bostaOrder, idx) => {
                                  if (!bostaOrder || typeof bostaOrder !== 'object' || Array.isArray(bostaOrder)) return null;
                                  const createdAt = bostaOrder.createdAt || bostaOrder.timestamps?.created;
                                  const orderDate = createdAt ? (() => { try { const d = new Date(createdAt); return isNaN(d.getTime()) ? null : d; } catch { return null; } })() : null;
                                  const formattedDate = orderDate ? formatDateOnly(orderDate.toISOString()) : null;
                                  const relativeTime = orderDate ? getRelativeTime(orderDate.toISOString()) : null;
                                  const displayNote = getBostaOrderDisplayNote(bostaOrder, serviceTickets) || (order?.order_description && String(order.order_description).trim()) || null;
                                  const MAX_PACKAGE_DESCRIPTION_LENGTH = 80;
                                  const packageDescriptionKey = `bosta-package-${idx}`;
                                  const isPackageExpanded = expandedDescriptions[packageDescriptionKey] || false;
                                  const codValue = getBostaCodValue(bostaOrder) ?? 0;
                                  const fees = getBostaFeesValues(bostaOrder);
                                  const star = (bostaOrder.star && typeof bostaOrder.star === 'object' && !Array.isArray(bostaOrder.star)) ? bostaOrder.star : null;
                                  const starName = star?.name || null;
                                  const starPhone = star?.phone || null;
                                  const extractOrderId = () => {
                                    if (bostaOrder.id != null) { const s = String(bostaOrder.id).trim(); if (s) return s; }
                                    if (bostaOrder.order_id != null) { const s = String(bostaOrder.order_id).trim(); if (s) return s; }
                                    const tr = bostaOrder.trackingNumber || bostaOrder.tracking_number;
                                    if (tr && typeof tr === 'string') {
                                      const parts = tr.trim().split('-');
                                      if (parts.length > 0) { const lp = parts[parts.length - 1]?.trim(); if (lp && /^\d+$/.test(lp)) return lp; }
                                      const m = tr.match(/\d+/); if (m && m[0]) return m[0];
                                    }
                                    return null;
                                  };
                                  const bostaOrderId = extractOrderId();
                                  const bostaLink = bostaOrderId ? `https://business.bosta.co/orders/${bostaOrderId}` : null;
                                  const trackingNumber = bostaOrder.trackingNumber || bostaOrder.tracking_number || '-';
                                  const bostaStatus = getBostaOrderStatus(bostaOrder);
                                  const orderType = bostaOrder.type || 'Send';
                                  const orderTypeLabel = translateOrderType(orderType);
                                  const hasCod = codValue !== 0;
                                  const hasFeesChip = bostaFeesChipVisible(fees);
                                  const desc = displayNote;
                                  const shouldTruncate = desc && desc.length > MAX_PACKAGE_DESCRIPTION_LENGTH;
                                  const displayDesc = shouldTruncate && !isPackageExpanded ? desc.substring(0, MAX_PACKAGE_DESCRIPTION_LENGTH) + '...' : desc;
                                  const manualTrim = (manualTrackingInput || '').trim();
                                  const isCardLinkedToManual = !isReadOnly
                                    && trackingEntryMode === 'manual'
                                    && manualTrim.length >= ORIGINAL_TRACKING_MIN_LEN
                                    && String(trackingNumber).trim() === manualTrim;
                                  const isSelected = (!isReadOnly && trackingEntryMode === 'list' && selectedBostaOrder === bostaOrder) || isCardLinkedToManual;

                                  return (
                                    <Fragment key={idx}>
                                      <article
                                        role={isReadOnly ? undefined : 'button'}
                                        tabIndex={isReadOnly ? undefined : 0}
                                        onClick={isReadOnly ? undefined : () => toggleBostaCardSelection(bostaOrder)}
                                        onKeyDown={isReadOnly ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBostaCardSelection(bostaOrder); } }}
                                        className={`w-full flex items-start gap-0 rounded-xl border transition-all duration-200 text-right bg-white dark:bg-gray-800 min-h-0 overflow-hidden ${isSelected ? 'ring-2 ring-brand-red-500 ring-offset-2 dark:ring-offset-gray-800 border-brand-red-500 dark:border-brand-red-600' : 'border-gray-200 dark:border-gray-700 hover:border-red-600 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:shadow-md'} ${!isReadOnly ? 'cursor-pointer' : ''}`}
                                        dir="rtl"
                                        aria-label={`طلب Bosta ${trackingNumber}`}
                                        aria-pressed={isReadOnly ? undefined : isSelected}
                                      >
                                        <div className="w-1 flex-shrink-0 self-stretch bg-brand-red-500" aria-hidden />
                                        <div className="flex-shrink-0 flex flex-col items-center gap-1 p-3 pl-2">
                                          <div className="w-10 h-10 rounded-lg bg-brand-red-600 dark:bg-brand-red-500 flex items-center justify-center shadow-sm">
                                            <Package className="w-5 h-5 text-white" />
                                          </div>
                                          {starName && (
                                            <button
                                              type="button"
                                              onClick={() => setExpandedStarDetails(prev => ({ ...prev, [`star-${idx}`]: !prev[`star-${idx}`] }))}
                                              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border transition-all duration-200 ${expandedStarDetails[`star-${idx}`] ? 'bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 border-amber-400 dark:border-amber-600 shadow-sm' : 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-300 dark:border-amber-700 hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-900/50 dark:hover:to-orange-900/50'}`}
                                            >
                                              <Star className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${expandedStarDetails[`star-${idx}`] ? 'rotate-180' : ''}`} />
                                              <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-300 font-cairo whitespace-nowrap leading-tight">المندوب</span>
                                              {expandedStarDetails[`star-${idx}`] ? <ChevronUp className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> : <ChevronDown className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />}
                                            </button>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col pt-3 pb-0 pe-3 ps-2 gap-2 sm:gap-2.5">
                                          <header className="flex items-center justify-between gap-1.5 sm:gap-2 w-full shrink-0 flex-wrap sm:flex-nowrap">
                                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap order-2 sm:order-1">
                                              {bostaLink ? (
                                                <a href={bostaLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-cairo font-bold text-brand-red-600 dark:text-brand-red-400 hover:text-brand-red-700 dark:hover:text-brand-red-300 text-[10px] sm:text-xs md:text-sm tracking-tight cursor-pointer shrink-0 whitespace-nowrap" dir="ltr">
                                                  #{trackingNumber}
                                                </a>
                                              ) : (
                                                <span className="font-cairo font-bold text-gray-900 dark:text-gray-100 text-[10px] sm:text-xs md:text-sm tracking-tight shrink-0 whitespace-nowrap" dir="ltr">#{trackingNumber}</span>
                                              )}
                                            </div>
                                            <span className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-md whitespace-nowrap border shrink-0 order-1 sm:order-2 ${getStatusBadgeColor(bostaStatus).replace('bg-ui-warning-100', 'bg-ui-warning-100 border-ui-warning-200').replace('bg-brand-blue-100', 'bg-brand-blue-100 border-brand-blue-200').replace('bg-accent-green-100', 'bg-accent-green-100 border-accent-green-200').replace('bg-gray-100', 'bg-gray-100 border-gray-200')}`}>
                                              {orderTypeLabel && orderTypeLabel !== 'توصيل عادي' ? orderTypeLabel : getStatusLabel(bostaStatus)}
                                            </span>
                                          </header>
                                          {displayNote && (
                                            <section className="min-w-0 shrink-0" aria-label="وصف الطرد">
                                              <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/40 p-2 space-y-1.5">
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                  <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-brand-red-100 dark:bg-brand-red-900/40 flex items-center justify-center">
                                                    <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-red-600 dark:text-brand-red-400" />
                                                  </div>
                                                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 font-cairo leading-tight">وصف الطرد</span>
                                                </div>
                                                <div className="text-xs text-gray-800 dark:text-gray-200 font-tajawal leading-relaxed">
                                                  {shouldTruncate ? (
                                                    <>
                                                      {!isPackageExpanded ? <span className="line-clamp-2">{displayDesc}</span> : <span className="whitespace-pre-line break-words">{desc}</span>}
                                                      <button type="button" onClick={(e) => { e.stopPropagation(); setExpandedDescriptions(prev => ({ ...prev, [packageDescriptionKey]: !prev[packageDescriptionKey] })); }} className="mt-1 text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 text-[10px] font-semibold font-cairo inline-flex items-center gap-1">
                                                        {isPackageExpanded ? <><ChevronUp className="w-3 h-3" /> عرض أقل</> : <><ChevronDown className="w-3 h-3" /> عرض المزيد</>}
                                                      </button>
                                                    </>
                                                  ) : <span className="break-words">{desc}</span>}
                                                </div>
                                              </div>
                                            </section>
                                          )}
                                          {starName && expandedStarDetails[`star-${idx}`] && (
                                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 space-y-2">
                                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                                  <div className="p-1 rounded-md bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
                                                    <User className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                                                  </div>
                                                  <div className="flex-1 min-w-0 space-y-1">
                                                    <div>
                                                      <div className="text-[10px] text-gray-500 dark:text-gray-500 font-medium font-cairo mb-0.5">اسم المندوب</div>
                                                      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 font-cairo truncate">{starName}</div>
                                                    </div>
                                                    {starPhone && (
                                                      <div className="flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                        <a href={`tel:${starPhone}`} className="text-xs font-semibold text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 font-cairo">{starPhone}</a>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(starPhone); setCopiedPhone(starPhone); setTimeout(() => setCopiedPhone(null), 2000); }} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0" title="نسخ الرقم">
                                                          {copiedPhone === starPhone ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> : <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400" />}
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          <footer className="mt-auto w-full border-t border-gray-100 dark:border-gray-700/50 pt-3 sm:pt-3.5 pb-3 sm:pb-3.5 flex flex-col gap-2 sm:gap-2 shrink-0">
                                            <div className="flex w-full items-center justify-between gap-2 sm:gap-3 flex-wrap flex-row-reverse">
                                              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 font-cairo min-w-0 shrink-0 leading-snug">
                                                <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span>{relativeTime || formattedDate}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-start self-center">
                                                {hasCod && <BostaCodMainChip codValue={codValue} bostaOrder={bostaOrder} />}
                                                {hasFeesChip && <BostaFeesCompactChip fees={fees} />}
                                              </div>
                                            </div>
                                            {(isSelected || isCardLinkedToManual) && callType !== 'ask' && hasCod && (() => {
                                              const entered = Number(editableTotal);
                                              const comparable = Number.isFinite(entered);
                                              const match = comparable && Math.abs(entered - codValue) < BOSTA_COD_EPS;
                                              return (
                                                <p
                                                  className={`text-[9px] font-cairo font-semibold leading-snug w-full ${match ? 'text-accent-green-600 dark:text-accent-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                                                >
                                                  {match
                                                    ? '✓ المبلغ المدخل يطابق COD هذه الشحنة'
                                                    : '⚠ يختلف المبلغ المدخل عن COD هذه الشحنة'}
                                                </p>
                                              );
                                            })()}
                                          </footer>
                                        </div>
                                      </article>
                                    </Fragment>
                                  );
                                })}
                              </div>
                            )}

                            {/* Empty State - No Bosta Orders */}
                            {activeTab === 'bosta' && bostaOrders.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mb-3">
                                  <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo text-center">لا توجد طلبات Bosta متاحة</p>
                              </div>
                            )}

                            {/* Services Tab — exact ServiceModalViewer structure */}
                            {activeTab === 'services' && (
                              <>
                                {serviceTickets.length > 0 ? (
                                <>
                                <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                                  {/* Service Type Sub-tabs */}
                                  {(() => {
                                    const serviceTypes = ['replacement', 'maintenance', 'return', 'sell'];
                                    const availableTypes = serviceTypes.filter(type => serviceTickets.some(t => t && typeof t === 'object' && !Array.isArray(t) && ticketServiceTypeKey(t) === type));
                                    if (availableTypes.length <= 1) return null;
                                    return (
                                      <div
                                        dir="rtl"
                                        className="flex w-full min-w-0 flex-nowrap items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide pb-2 sm:pb-2.5 [-webkit-overflow-scrolling:touch] border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
                                      >
                                        <button type="button" onClick={() => setActiveServiceType(null)} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg py-2 ps-3 pe-3 text-[10px] sm:text-xs font-medium font-cairo transition-colors whitespace-nowrap touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 ${!activeServiceType ? 'bg-brand-blue-100 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                          <span className="shrink-0">الكل</span>
                                          <span className={`inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[9px] font-bold tabular-nums leading-none ${!activeServiceType ? 'bg-brand-blue-200 dark:bg-brand-blue-800' : 'bg-gray-200 dark:bg-gray-600'}`}>{serviceTickets.length}</span>
                                        </button>
                                        {availableTypes.map(type => {
                                          const typeInfo = { replacement: { icon: RotateCcw, label: 'استبدال' }, maintenance: { icon: Wrench, label: 'صيانة' }, return: { icon: RefreshCw, label: 'استرجاع' }, sell: { icon: Package, label: 'بيع' } }[type];
                                          const TypeIcon = typeInfo?.icon || FileText;
                                          const count = serviceTickets.filter(t => t && typeof t === 'object' && !Array.isArray(t) && ticketServiceTypeKey(t) === type).length;
                                          const tabStyle = SERVICE_TYPE_TAB_STYLES[type] || SERVICE_TYPE_TAB_STYLES.replacement;
                                          const isActive = activeServiceType === type;
                                          return (
                                            <button key={type} type="button" onClick={() => setActiveServiceType(type)} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg py-2 ps-3 pe-3 text-[10px] sm:text-xs font-medium font-cairo transition-colors whitespace-nowrap touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 ${isActive ? tabStyle.active : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                              <TypeIcon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                                              <span className="shrink-0">{typeInfo?.label || type}</span>
                                              <span className={`inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[9px] font-bold tabular-nums leading-none ${isActive ? tabStyle.badge : 'bg-gray-200 dark:bg-gray-600'}`}>{count}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}

                                  {/* Service tickets — stack + card chrome matches ServiceModalViewer related-ticket list */}
                                  <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-6">
                                  {(() => {
                                    const formatTicketNumberForDisplay = (ticketNumber) => {
                                      if (!ticketNumber || typeof ticketNumber !== 'string') return null;
                                      const t = String(ticketNumber).trim();
                                      const match = t.match(/^([A-Za-z]+)(\d{2})(\d{2})(\d{2})(\d{2,4})$/);
                                      if (match) {
                                        const [, prefix, yy, mm, dd, seq] = match;
                                        return { prefix, yy, mm, dd, seq };
                                      }
                                      const fallback = t.match(/^([A-Za-z]+)(.*)$/);
                                      if (fallback) return { prefix: fallback[1], raw: fallback[2] || '' };
                                      return { prefix: '', raw: t };
                                    };
                                    const serviceTypes = ['replacement', 'maintenance', 'return', 'sell'];
                                    const availableTypes = serviceTypes.filter(type => serviceTickets.some(t => t && ticketServiceTypeKey(t) === type));

                                    return serviceTickets
                                      .filter(ticket => {
                                        const tKey = ticketServiceTypeKey(ticket);
                                        if (availableTypes.length === 1) return tKey === availableTypes[0];
                                        return !activeServiceType || tKey === activeServiceType;
                                      })
                                      .map((ticket, idx) => {
                                        const type = ticketServiceTypeKey(ticket);
                                        const config = SERVICE_TYPE_CONFIG[type] || SERVICE_TYPE_CONFIG.replacement;
                                        const TypeIcon = TYPE_ICONS[type] || RotateCcw;
                                        const ticketShort = (ticket.ticket_number && typeof ticket.ticket_number === 'string') ? ticket.ticket_number.split('-').pop() || ticket.id : ticket.id;
                                        const normalizedStatus = String(ticket.status || '').toLowerCase().replace(/\s+/g, '_');
                                        const ticketCost = ticket.cost_adjustment;
                                        const hasCost = ticketCost != null && String(ticketCost).trim() !== '';
                                        const rawNotes = getTicketNotesRawForDisplay(ticket) || enrichTicketNotesFromBosta(ticket, bostaOrders);
                                        const ticketNotes = getSafeNotesDisplay(rawNotes);
                                        const showNotesBlock = ticketNotes && ticketNotes.length > 0;
                                        const notesKey = `ticket-notes-${ticket.id ?? idx}`;
                                        const isNotesExpanded = expandedDescriptions[notesKey];
                                        const ticketDate = ticket.created_at ? new Date(ticket.created_at) : null;
                                        const relativeTime = ticketDate ? getRelativeTime(ticketDate.toISOString()) : null;
                                        const calendarDateLine = ticketDate && !Number.isNaN(ticketDate.getTime())
                                          ? formatDateWithArabicMonth(ticketDate.toISOString())
                                          : null;
                                        const linkedToBosta = ticketHasBostaTracking(ticket);

                                        const itemsArray = getTicketItemsForDisplay(ticket, bostaOrders);
                                        const getItemsByDirection = () => {
                                          if (!itemsArray.length) return { send: [], receive: [] };
                                          const buckets = itemsArray.reduce((acc, item) => {
                                            if (!item || typeof item !== 'object' || Array.isArray(item)) return acc;
                                            const d = (item.direction && String(item.direction).toLowerCase()) || '';
                                            if (d === 'send') acc.send.push(item);
                                            else if (d === 'receive') acc.receive.push(item);
                                            else acc.undirected.push(item);
                                            return acc;
                                          }, { send: [], receive: [], undirected: [] });
                                          // Snapshots / legacy rows may omit direction — show as استلام for non-sell
                                          if (buckets.undirected.length && type !== 'sell') {
                                            buckets.receive.push(...buckets.undirected);
                                          } else if (buckets.undirected.length) {
                                            buckets.send.push(...buckets.undirected);
                                          }
                                          return { send: buckets.send, receive: buckets.receive };
                                        };
                                        const { send, receive } = getItemsByDirection();

                                        const getItemsDisplay = () => {
                                          if (type === 'sell') {
                                            const parts = send.filter(i => i && i.type === 'part');
                                            const products = send.filter(i => i && i.type === 'product');
                                            if (parts.length === 0 && products.length === 0) return null;
                                            return (
                                              <div className="mb-2 flex items-start gap-2 flex-wrap">
                                                {parts.length > 0 && (
                                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-accent-green-100 dark:bg-accent-green-900/30 border border-accent-green-200 dark:border-accent-green-700 rounded-md">
                                                    <Settings className="w-3 h-3 text-accent-green-600 dark:text-accent-green-400 flex-shrink-0" />
                                                    <span className="text-[10px] font-medium text-accent-green-700 dark:text-accent-green-300 font-cairo">قطع ({parts.length})</span>
                                                  </div>
                                                )}
                                                {products.length > 0 && (
                                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
                                                    <Package className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 font-cairo">{products.length} منتج</span>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          }
                                          if (send.length === 0 && receive.length === 0) return null;
                                          return (
                                            <>
                                              {send.length > 0 && (
                                                <button type="button" data-modal-items-chip onClick={(e) => { e.stopPropagation(); setModalItemsTooltip({ direction: 'send', items: send, anchorRect: e.currentTarget.getBoundingClientRect() }); }} className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-md text-[10px] font-medium text-blue-700 dark:text-blue-300 font-cairo cursor-pointer transition-colors">
                                                  <Truck className="w-3 h-3 flex-shrink-0" />
                                                  <span>إرسال</span>
                                                  <span className="text-[9px] font-bold bg-blue-200 dark:bg-blue-800 px-1 py-0.5 rounded-full text-blue-800 dark:text-blue-200">{send.length}</span>
                                                </button>
                                              )}
                                              {receive.length > 0 && (
                                                <button type="button" data-modal-items-chip onClick={(e) => { e.stopPropagation(); setModalItemsTooltip({ direction: 'receive', items: receive, anchorRect: e.currentTarget.getBoundingClientRect() }); }} className="flex items-center gap-1.5 px-2 py-1 bg-accent-green-100 hover:bg-accent-green-200 dark:bg-accent-green-900/30 dark:hover:bg-accent-green-900/50 border border-accent-green-200 dark:border-accent-green-700 rounded-md text-[10px] font-medium text-accent-green-700 dark:text-accent-green-300 font-cairo cursor-pointer transition-colors">
                                                  <Package className="w-3 h-3 flex-shrink-0" />
                                                  <span>استلام</span>
                                                  <span className="text-[9px] font-bold bg-accent-green-200 dark:bg-accent-green-800 px-1 py-0.5 rounded-full text-accent-green-800 dark:text-accent-green-200">{receive.length}</span>
                                                </button>
                                              )}
                                            </>
                                          );
                                        };

                                        const itemsRow = getItemsDisplay();

                                        return (
                                          <div key={ticket.id ?? idx} className="min-w-0">
                                          <button onClick={() => handleServiceTicketClick(ticket)} type="button" className={`w-full flex items-start gap-0 rounded-xl border transition-all duration-200 text-right bg-white dark:bg-gray-800 min-h-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-blue-400 dark:hover:border-brand-blue-500 hover:bg-brand-blue-50/50 dark:hover:bg-brand-blue-900/10 hover:shadow-md cursor-pointer ${linkedToBosta ? 'ring-1 ring-brand-red-200 dark:ring-brand-red-800/50' : ''}`} dir="rtl" aria-label={`تذكرة ${ticket.ticket_number || ticketShort}`}>
                                            <div className={`w-1 flex-shrink-0 self-stretch ${TYPE_STRIP_BG[type] || 'bg-brand-blue-500'}`} aria-hidden />
                                            <div className="flex-shrink-0 flex flex-col items-center gap-1 p-3 pl-2">
                                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}>
                                                <TypeIcon className="w-5 h-5 text-white" />
                                              </div>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col pt-3 pb-0 pe-3 ps-2 gap-2 sm:gap-2.5">
                                              <header className="flex items-center justify-between gap-1.5 sm:gap-2 w-full shrink-0 flex-wrap sm:flex-nowrap">
                                                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap order-2 sm:order-1">
                                                  <button type="button" onClick={(e) => { e.stopPropagation(); const toCopy = String(ticket.ticket_number || ticketShort || '').replace(/^\s*#\s*/, '').trim(); navigator.clipboard.writeText(toCopy); toast.success('تم نسخ رقم التذكرة'); }} className="font-cairo font-bold text-[10px] sm:text-xs md:text-sm tracking-tight text-gray-900 dark:text-gray-100 min-w-0 flex items-baseline gap-1 sm:gap-1.5 flex-wrap sm:flex-nowrap rounded-md px-1 sm:px-1.5 py-0.5 -mx-1 sm:-mx-1.5 -my-0.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-right border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-1 shrink-0 max-w-full overflow-hidden" dir="ltr" title="نسخ رقم التذكرة">
                                                    {(() => {
                                                      const parsed = formatTicketNumberForDisplay(String(ticket.ticket_number || ticketShort || ''));
                                                      if (!parsed) return <span className="truncate">#{ticket.ticket_number || ticketShort}</span>;
                                                      if (parsed.yy != null) {
                                                        return (<><span className="text-gray-700 dark:text-gray-300 font-semibold shrink-0 text-[9px] sm:text-[10px] md:text-xs">#</span><span className="text-brand-blue-600 dark:text-brand-blue-400 font-extrabold shrink-0 text-[9px] sm:text-[10px] md:text-xs">{parsed.prefix}</span><span className="tabular-nums text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/50 rounded px-1 sm:px-1.5 py-0.5 font-semibold text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap">{parsed.yy} · {parsed.mm} · {parsed.dd} · {parsed.seq}</span></>);
                                                      }
                                                      return (<><span className="text-gray-700 dark:text-gray-300 font-semibold shrink-0 text-[9px] sm:text-[10px] md:text-xs">#</span>{parsed.prefix && <span className="text-brand-blue-600 dark:text-brand-blue-400 font-extrabold shrink-0 text-[9px] sm:text-[10px] md:text-xs">{parsed.prefix}</span>}<span className="bg-gray-100/80 dark:bg-gray-700/50 rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap truncate max-w-[120px] sm:max-w-none">{parsed.raw}</span></>);
                                                    })()}
                                                  </button>
                                                  <span className={`shrink-0 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-md border whitespace-nowrap ${config.bg} ${config.text} ${config.border}`}>{config.label}</span>
                                                </div>
                                                <div className="shrink-0 flex items-center order-1 sm:order-2">
                                                  <ServiceStatusBadge status={normalizedStatus} size="xs" showIcon={true} className="shrink-0" />
                                                </div>
                                              </header>
                                              {showNotesBlock && (
                                                <section className="flex-1 min-w-0" aria-label="الملاحظات">
                                                  <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/40 p-2 space-y-1.5">
                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                      <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-brand-blue-100 dark:bg-brand-blue-900/40 flex items-center justify-center">
                                                        <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-blue-600 dark:text-brand-blue-400" />
                                                      </div>
                                                      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 font-cairo leading-tight">الملاحظات</span>
                                                    </div>
                                                    <div className="text-xs text-gray-800 dark:text-gray-200 font-tajawal leading-relaxed">
                                                      {ticketNotes.length > NOTES_TRUNCATE ? (
                                                        <><span className={!isNotesExpanded ? 'line-clamp-2' : 'whitespace-pre-line break-words'}>{isNotesExpanded ? ticketNotes : `${ticketNotes.slice(0, NOTES_TRUNCATE)}…`}</span>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setExpandedDescriptions(prev => ({ ...prev, [notesKey]: !prev[notesKey] })); }} className="mt-1 text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 text-[10px] font-semibold font-cairo inline-flex items-center gap-1">{isNotesExpanded ? 'عرض أقل' : 'عرض المزيد'}</button></>
                                                      ) : (<span className="break-words">{ticketNotes}</span>)}
                                                    </div>
                                                  </div>
                                                </section>
                                              )}
                                              {itemsRow && (type === 'sell' ? itemsRow : <div className="flex flex-wrap gap-1.5 mb-2">{itemsRow}</div>)}
                                              {(relativeTime || calendarDateLine || hasCost) && (
                                              <footer className="mt-auto w-full border-t border-gray-100 dark:border-gray-700/50 pt-3 sm:pt-3.5 pb-3 sm:pb-3.5 flex items-center justify-between gap-2 sm:gap-3 flex-wrap flex-row-reverse">
                                                <div className="flex flex-col items-end gap-1 min-w-0 shrink-0">
                                                  {relativeTime && (
                                                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 font-cairo leading-snug">
                                                      <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                      <span>{relativeTime}</span>
                                                    </div>
                                                  )}
                                                  {calendarDateLine && (
                                                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-cairo leading-snug">{calendarDateLine}</span>
                                                  )}
                                                </div>
                                                {hasCost && (
                                                  <span className="inline-flex items-center gap-1 shrink-0 self-center" dir="rtl">
                                                    <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo whitespace-nowrap">التكلفة:</span>
                                                    <SessionStyleMoneyBadge value={ticketCost} size="sm" />
                                                  </span>
                                                )}
                                              </footer>
                                              )}
                                            </div>
                                          </button>
                                          </div>
                                        );
                                      });
                                  })()}
                                </div>

                                {/* Floating items tooltip — same as ServiceModalViewer */}
                                {activeTab === 'services' && modalItemsTooltip?.items?.length > 0 && modalItemsTooltip?.anchorRect && (() => {
                                  const r = modalItemsTooltip.anchorRect;
                                  const gap = 8;
                                  const tooltipW = 280;
                                  const tooltipH = 180;
                                  let top = r.bottom + gap;
                                  let left = r.left + (r.width / 2) - (tooltipW / 2);
                                  left = Math.max(12, Math.min(left, typeof window !== 'undefined' ? window.innerWidth - tooltipW - 12 : left));
                                  const isAbove = typeof window !== 'undefined' && top + tooltipH > window.innerHeight - 12;
                                  if (isAbove) top = r.top - tooltipH - gap;
                                  const arrowOffsetPx = Math.max(12, Math.min(tooltipW - 20, r.left + (r.width / 2) - left - 8));
                                  return (
                                    <div ref={modalItemsTooltipRef} role="tooltip" className="fixed z-[60] rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl p-3 max-w-[min(18rem,90vw)] transition-all duration-200 ease-out opacity-100" style={{ top: `${top}px`, left: `${left}px` }}>
                                      <div className="absolute w-3 h-3 rotate-45 border-t border-s border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800" style={{ [isAbove ? 'bottom' : 'top']: '-5px', left: `${arrowOffsetPx}px`, transform: isAbove ? 'rotate(45deg)' : 'rotate(-135deg)' }} />
                                      <div className="relative">
                                        <div className="flex items-center gap-2 space-x-reverse mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                          {modalItemsTooltip.direction === 'send' ? <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" /> : <Package className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />}
                                          <span className="font-semibold text-gray-900 dark:text-gray-100 font-cairo text-sm">{modalItemsTooltip.direction === 'send' ? 'عناصر الإرسال' : 'عناصر الاستلام'}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                          {Array.isArray(modalItemsTooltip.items) ? modalItemsTooltip.items.filter(item => item && typeof item === 'object' && !Array.isArray(item)).map((item, index) => {
                                            const isProduct = (item.type || '').toLowerCase() === 'product';
                                            const name = item.name || item.item_name || item.sku || item.product_name || `عنصر ${index + 1}`;
                                            const qty = item.quantity ?? item.qty ?? 1;
                                            return (
                                              <div key={index} className="flex items-center gap-2 space-x-reverse text-xs font-cairo">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isProduct ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                                                  {isProduct ? <Package className="w-3 h-3 text-blue-600 dark:text-blue-400" /> : <Settings className="w-3 h-3 text-green-600 dark:text-green-400" />}
                                                </div>
                                                <span className="text-gray-900 dark:text-gray-100 font-medium truncate flex-1 min-w-0">{name}</span>
                                                <span className="text-gray-500 dark:text-gray-400 tabular-nums">{qty}</span>
                                              </div>
                                            );
                                          }) : null}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                  })()}

                                </div>
                                </>
                                ) : (
                                /* Empty State - No Service Tickets */
                                  <div className="flex flex-col items-center justify-center py-12 px-4">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mb-3">
                                      <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo text-center">لا توجد تذاكر خدمة متاحة</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Order Details - Responsive */}
                  <div className="flex-1 lg:flex-[0_0_55%] flex flex-col min-h-0 overflow-hidden border-l-0 lg:border-l border-t lg:border-t-0 border-gray-200 dark:border-gray-700 pt-2 lg:pt-0 pl-0 lg:pl-3 md:pl-4">
                    <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col space-y-2 sm:space-y-2.5 md:space-y-3">
                      {callType !== 'ask' && !isReadOnly && (
                        <div
                          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-l from-brand-red-50/50 via-white to-white dark:from-brand-red-900/15 dark:via-gray-800 dark:to-gray-800 px-2.5 py-2 sm:px-3 sm:py-2 shadow-sm"
                          dir="rtl"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-brand-red-200/80 bg-brand-red-100 dark:border-brand-red-800/50 dark:bg-brand-red-900/40"
                                aria-hidden
                              >
                                <Truck className="h-3.5 w-3.5 text-brand-red-600 dark:text-brand-red-400 sm:h-4 sm:w-4" />
                              </div>
                              <p className="min-w-0 flex-1 text-[11px] font-semibold leading-tight text-gray-700 dark:text-gray-200 sm:text-sm font-cairo">
                                <span className="font-bold text-gray-900 dark:text-gray-100">ربط شحنة Bosta</span>
                                {' (اختياري) — اختر بطاقةً'}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:flex-nowrap sm:justify-start">
                              {(resolvedOriginalTracking.length >= ORIGINAL_TRACKING_MIN_LEN || trackingEntryMode === 'manual') && (
                                <button
                                  type="button"
                                  onClick={clearBostaTrackingLink}
                                  className="inline-flex h-8 min-h-8 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-[10px] font-bold text-gray-600 transition-colors hover:bg-gray-100 sm:text-xs font-cairo dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/80"
                                >
                                  <XCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                                  إزالة
                                </button>
                              )}
                              {resolvedOriginalTracking.length >= ORIGINAL_TRACKING_MIN_LEN ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setManualTrackingInput(resolvedOriginalTracking);
                                    setTrackingEntryMode('manual');
                                    setSelectedBostaOrder(null);
                                    queueMicrotask(() => {
                                      try {
                                        manualTrackingInputRef.current?.focus?.();
                                      } catch (_) { /* ignore */ }
                                    });
                                  }}
                                  title={
                                    bostaCodVerify.status === 'match'
                                      ? 'الربط متسق مع COD — اضغط للتعديل'
                                      : bostaCodVerify.status === 'mismatch'
                                        ? 'تحقق من المبلغ — اضغط للتعديل'
                                        : 'اضغط لتعديل رقم التتبع'
                                  }
                                  className={[
                                    'inline-flex h-8 min-h-8 max-w-[11rem] sm:max-w-[13rem] items-center justify-center gap-1 rounded-lg border px-2 text-[10px] font-semibold font-cairo shadow-sm transition-all duration-200',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
                                    'hover:brightness-[1.02] active:scale-[0.98]',
                                    bostaCodVerify.status === 'match'
                                      ? 'border-accent-green-200 bg-accent-green-50 text-accent-green-800 dark:border-accent-green-700 dark:bg-accent-green-900/25 dark:text-accent-green-200'
                                      : bostaCodVerify.status === 'mismatch'
                                        ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-900/25 dark:text-amber-100'
                                        : 'border-brand-red-200 bg-brand-red-50 text-brand-red-800 dark:border-brand-red-700 dark:bg-brand-red-900/35 dark:text-brand-red-200',
                                  ].filter(Boolean).join(' ')}
                                >
                                  <Package className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                                  <span dir="ltr" className="truncate tabular-nums">{`#${resolvedOriginalTracking}`}</span>
                                  {bostaCodVerify.status === 'match' && (
                                    <CheckCheck className="h-3.5 w-3.5 shrink-0 text-accent-green-600 dark:text-accent-green-400" aria-hidden />
                                  )}
                                  {bostaCodVerify.status === 'mismatch' && (
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
                                  )}
                                  {bostaCodVerify.status !== 'match' && bostaCodVerify.status !== 'mismatch' && (
                                    <Edit2 className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                                  )}
                                </button>
                              ) : (
                                <span
                                  className="inline-flex h-8 min-h-8 max-w-[6.5rem] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/60 px-2 text-[9px] font-bold text-gray-400 dark:border-gray-600 dark:bg-gray-800/40 dark:text-gray-500 font-cairo"
                                  title="لم يُختر ربط بعد"
                                >
                                  بدون ربط
                                </span>
                              )}
                              {resolvedOriginalTracking.length < ORIGINAL_TRACKING_MIN_LEN && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTrackingEntryMode('manual');
                                    setSelectedBostaOrder(null);
                                    queueMicrotask(() => {
                                      try {
                                        manualTrackingInputRef.current?.focus?.();
                                      } catch (_) { /* ignore */ }
                                    });
                                  }}
                                  className={`inline-flex h-8 min-h-8 items-center justify-center gap-1 rounded-md border px-2.5 text-[10px] font-bold transition-colors sm:text-xs font-cairo ${trackingEntryMode === 'manual' ? 'border-brand-red-400 bg-brand-red-50 text-brand-red-800 dark:border-brand-red-600 dark:bg-brand-red-900/30 dark:text-brand-red-200' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/80'}`}
                                >
                                  <Edit2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                                  إدخال يدوي
                                </button>
                              )}
                            </div>
                          </div>
                          {trackingEntryMode === 'manual' && (
                            <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-2 dark:border-gray-700/80 sm:flex-row sm:items-center sm:gap-2">
                              <label className="sr-only" htmlFor="call-session-manual-bosta-tracking">رقم تتبع Bosta</label>
                              <input
                                id="call-session-manual-bosta-tracking"
                                ref={manualTrackingInputRef}
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={manualTrackingInput}
                                onChange={(e) => {
                                  setManualTrackingInput(e.target.value);
                                  setTrackingEntryMode('manual');
                                  setSelectedBostaOrder(null);
                                }}
                                placeholder="مثال: 69424512"
                                dir="ltr"
                                className="h-8 min-h-8 w-full min-w-0 rounded-md border border-gray-300 bg-white px-2.5 text-xs font-mono tracking-wide text-gray-900 transition-all focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-red-500 sm:flex-1 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                              />
                              {manualTrackingInput.trim().length > 0 && manualTrackingInput.trim().length < ORIGINAL_TRACKING_MIN_LEN && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-cairo sm:shrink-0">أقل من 3 أرقام — لن يُرسل مع التأكيد حتى يكتمل الطول.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Editable Items & Notes - Conditional based on call type */}
                      {currentCallTypeConfig.showItemsEditor ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                          {callType === 'sell' ? (
                            <OrderItemsEditor
                              key={isDirectCall ? `dc-${directCallKey}` : String(order?.id ?? 'o')}
                              items={editableItems}
                              onItemsChange={handleItemsChange}
                              onUserCodChange={handleSellUserCodChange}
                              onStockSearch={searchStockItems}
                              defaultViewMode="items"
                              notes={editableDescription}
                              onNotesChange={(value) => {
                                setEditableDescription(value);
                              }}
                              initialTotal={totalAmount}
                              cashFlowMode={cashFlowMode}
                              onCashFlowModeChange={setCashFlowMode}
                              bostaCod={getBostaCodValue(bostaRowForCod)}
                              amountPanelDisabled={actionLoading || isReadOnly}
                            />
                          ) : (
                            <>
                              <CallCenterItemsSelection
                                callType={callType}
                                itemsToSend={itemsToSend}
                                itemsToReceive={itemsToReceive}
                                onItemsToSendChange={setItemsToSend}
                                onItemsToReceiveChange={setItemsToReceive}
                                onStockSearch={searchStockItems}
                                disabled={actionLoading}
                                viewOnly={isReadOnly}
                              />
                              <CallCenterAmountPanel
                                className="mt-2 sm:mt-2.5"
                                neutralFlowUntilPick
                                signedAmount={editableTotal}
                                flowMode={cashFlowMode}
                                onChange={handleCallCenterAmountChange}
                                bostaCod={getBostaCodValue(bostaRowForCod)}
                                disabled={actionLoading || isReadOnly}
                              />
                            </>
                          )}
                        </div>
                      ) : (
                        /* Notes only for ASK calls */
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-blue-600 dark:text-brand-blue-400 flex-shrink-0" />
                            <span className="whitespace-nowrap">ملاحظات الاستفسار</span>
                          </h3>
                          <textarea
                            value={editableNotes}
                            onChange={(e) => {
                              setEditableNotes(e.target.value);
                              setEditableDescription(e.target.value);
                            }}
                            rows={4}
                            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-cairo focus:outline-none focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500 transition-all duration-150 resize-y min-h-[100px] sm:min-h-[120px]"
                            placeholder="أدخل ملاحظات حول الاستفسار..."
                            dir="rtl"
                          />
                        </div>
                      )}

                      {/* Call Notes Section - Only for non-ASK calls (ASK uses inquiry notes above) */}
                      {callType !== 'ask' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3" dir="rtl">
                            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-blue-600 dark:text-brand-blue-400 flex-shrink-0" />
                              <span className="whitespace-nowrap">ملاحظات الاتصال</span>
                            </h3>
                            <button
                              type="button"
                              onClick={handleCopyCallNotes}
                              disabled={actionLoading}
                              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold font-cairo text-brand-blue-700 dark:text-brand-blue-300 bg-brand-blue-50 dark:bg-brand-blue-900/30 hover:bg-brand-blue-100 dark:hover:bg-brand-blue-900/50 border border-brand-blue-200/80 dark:border-brand-blue-700/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                              title="نسخ ملاحظات الاتصال"
                            >
                              <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden />
                              نسخ
                            </button>
                          </div>
                          <textarea
                            value={editableNotes}
                            onChange={(e) => setEditableNotes(e.target.value)}
                            rows={isRMT ? 5 : 2}
                            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-cairo focus:outline-none focus:ring-1 focus:ring-brand-red-500 focus:border-brand-blue-500 transition-all duration-150 resize-y min-h-[60px] sm:min-h-[70px]"
                            placeholder={
                              isRMT
                                ? 'يُبنى تلقائياً من العناصر (استبدال/صيانة/إرجاع). أكمل التفاصيل بعد «السبب:».'
                                : callType === 'sell'
                                  ? 'يُبنى تلقائياً من سلة البيع (بيع — المنتجات: …). أكمل بعد «السبب:».'
                                  : 'أدخل ملاحظات حول الاتصال...'
                            }
                            dir="rtl"
                          />
                        </div>
                      )}

                      {/* Actions: تأكيد | لم يرد | مؤجلة | إلغاء — hidden for confirmed orders (only leader actions show) */}
                      {!isReadOnly && order?.status !== 'confirmed' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-2.5 md:p-3 border border-gray-200 dark:border-gray-700 transition-all duration-300">
                          {orderIsCanceled && (
                            <div className="mb-2 sm:mb-2.5 p-2 sm:p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-800/60" dir="rtl">
                              <p className="text-[11px] sm:text-xs text-amber-900 dark:text-amber-100 font-cairo leading-relaxed">
                                الطلب <span className="font-bold">ملغى</span> — استخدم تأكيد أو مؤجلة أو «لم يرد» لإعادة تفعيله في النظام (يُحتفظ بسجل المكالمات السابق).
                              </p>
                            </div>
                          )}
                          <div className="space-y-2 sm:space-y-2.5">
                            <div className="pt-0">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                {/* Confirm Button — ASK: askOnly; direct sell/R/M/T: open confirm modal; order: open confirm modal */}
                                <button
                                  onClick={isDirectCall && callType === 'ask'
                                    ? handleConfirmAsk
                                    : (isDirectCall ? handleConfirmDirect : handleConfirm)}
                                  disabled={actionLoading || loading || (isDirectCall && callType === 'ask' && !customerContext?.customer?.phone)}
                                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 bg-accent-green-500 hover:bg-accent-green-600 text-white focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group touch-target shadow-sm font-cairo"
                                  aria-label={callType === 'ask' ? 'تسجيل الاستفسار' : 'تأكيد الطلب'}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs font-bold font-cairo whitespace-nowrap">{callType === 'ask' ? 'تسجيل' : 'تأكيد'}</span>
                                </button>

                                {/* No Answer - disabled for direct call or when not allowed */}
                                <button
                                  onClick={handleNoAnswer}
                                  disabled={actionLoading || loading || isDirectCall || !currentCallTypeConfig.allowedActions.includes('no_answer')}
                                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 bg-accent-amber-500 hover:bg-accent-amber-600 text-white focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group touch-target shadow-sm font-cairo"
                                  aria-label="لم يرد العميل"
                                >
                                  <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs font-bold font-cairo whitespace-nowrap">لم يرد</span>
                                </button>

                                {/* Schedule - disabled for direct call or when not allowed */}
                                <button
                                  onClick={() => setShowScheduleModal(true)}
                                  disabled={actionLoading || loading || isDirectCall || !currentCallTypeConfig.allowedActions.includes('schedule')}
                                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group touch-target shadow-sm font-cairo"
                                  aria-label="مؤجلة الطلب"
                                >
                                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs font-bold font-cairo whitespace-nowrap">مؤجلة</span>
                                </button>

                                {/* Cancel - for direct call: end session; else open cancel modal */}
                                <button
                                  onClick={isDirectCall ? () => { setIsExpanded(false); onClose?.(); } : () => setShowCancelModal(true)}
                                  disabled={actionLoading || loading}
                                  className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 bg-brand-red-600 hover:bg-brand-red-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group touch-target shadow-sm font-cairo"
                                  aria-label={isDirectCall ? 'إغلاق الجلسة' : 'إلغاء الطلب'}
                                >
                                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs font-bold font-cairo whitespace-nowrap">إلغاء</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Leader actions for confirmed orders (show whenever leaderActions provided, not only when readOnly) */}
                      {customerContextProp?.leaderActions ? (
                        <div className="flex flex-wrap items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50">
                          <span className="text-xs font-cairo text-gray-600 dark:text-gray-400 me-2">إجراءات المشرف:</span>
                          <button
                            onClick={() => setLeaderActionModal({ isOpen: true, type: 'approve', value: '' })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-green-600 hover:bg-accent-green-700 text-white text-sm font-cairo font-bold transition-colors"
                            title="موافقة وإنشاء تذكرة"
                          >
                            <CheckCheck className="w-4 h-4" />
                            موافقة
                          </button>
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-cairo font-bold transition-colors"
                            title="رفض الطلب"
                          >
                            <XCircle className="w-4 h-4" />
                            رفض
                          </button>
                          {/* طلب معلومات — hidden until implementation complete */}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <ServiceModalWrapper
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setCancellationReasonNotes('');
          }}
          maxWidth="max-w-lg"
          maxHeight="max-h-[90vh]"
        >
          <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <ServiceModalHeader
              title="إلغاء الطلب"
              subtitle="تسجيل الإلغاء مع إبقاء الجلسة مفتوحة — يمكنك لاحقاً تأكيد أو مؤجلة أو لم يرد"
              icon={AlertTriangle}
              iconColor="from-red-500 to-red-600"
              onClose={() => {
                setShowCancelModal(false);
                setCancellationReasonNotes('');
              }}
              isSubmitting={actionLoading}
            />
          </div>

          {/* Content - Scrollable Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 space-y-4" dir="rtl">
              {hasEdits && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-cairo">
                    ⚠️ سيتم تجاهل التعديلات عند الإلغاء.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 font-cairo">
                  تفاصيل سبب الإلغاء
                </label>
                <textarea
                  value={cancellationReasonNotes}
                  onChange={(e) => setCancellationReasonNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-right font-cairo bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm"
                  placeholder="أدخل تفاصيل سبب الإلغاء..."
                  dir="rtl"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReasonNotes('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-cairo disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={actionLoading || !cancellationReasonNotes.trim()}
                  className="px-6 py-2 text-sm text-white rounded-lg transition-all font-cairo font-bold disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500"
                >
                  {actionLoading ? (
                    <span className="flex items-center space-x-2 space-x-reverse">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>جاري المعالجة...</span>
                    </span>
                  ) : (
                    'إلغاء الطلب'
                  )}
                </button>
              </div>
            </div>
          </div>
        </ServiceModalWrapper>
      )}

      {/* Schedule Modal — ServiceModalWrapper, responsive, design genome */}
      {showScheduleModal && order && (() => {
        const o = order;
        const typeLabel = (o.service_type === 'ask' || o.service_type === 'استفسار')
          ? 'استفسار'
          : getServiceTypeLabelAr(o.service_type, { short: true });
        const amountVal = parseFloat(o.cod_amount || 0) || 0;
        const amountFmt = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(amountVal);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const addDays = (n) => {
          const d = new Date(today);
          d.setDate(d.getDate() + n);
          return d.toISOString().split('T')[0];
        };
        const SCHEDULE_CHIPS = [
          { id: 'tomorrow', label: 'غداً', date: addDays(1) },
          { id: 'day2', label: 'بعد يومين', date: addDays(2) },
          { id: 'day3', label: 'بعد 3 أيام', date: addDays(3) },
          { id: 'week', label: 'الأسبوع القادم', date: addDays(7) },
          { id: 'custom', label: 'مخصص', date: null }
        ];

        const handleChipClick = (chip) => {
          setScheduleChip(chip.id);
          if (chip.date) setScheduledDate(chip.date);
          else setScheduledDate('');
        };

        const { year, month } = scheduleCalendarView;
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const weekDays = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
        const prevMonth = () => {
          if (month === 0) setScheduleCalendarView({ year: year - 1, month: 11 });
          else setScheduleCalendarView({ year, month: month - 1 });
        };
        const nextMonth = () => {
          if (month === 11) setScheduleCalendarView({ year: year + 1, month: 0 });
          else setScheduleCalendarView({ year, month: month + 1 });
        };
        const pad = (n) => String(n).padStart(2, '0');
        const toDateStr = (d) => `${year}-${pad(month + 1)}-${pad(d)}`;
        const isPast = (d) => new Date(year, month, d) < today;
        const isSelected = (d) => toDateStr(d) === scheduledDate;

        const formatDateAr = (dateStr) => {
          try {
            return new Date(dateStr + 'T12:00:00').toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          } catch {
            return dateStr;
          }
        };

        const closeSchedule = () => {
          if (!actionLoading) {
            setShowScheduleModal(false);
            setScheduleChip(null);
            setScheduledDate('');
          }
        };

        return (
          <ServiceModalWrapper
            isOpen={showScheduleModal}
            onClose={closeSchedule}
            maxWidth="max-w-xl"
            maxHeight="max-h-[90vh]"
          >
            <div className="flex flex-col h-full max-h-[90vh]" dir="rtl">
              {/* Header — matches Cancel modal */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ServiceModalHeader
                  title="مؤجلة الطلب"
                  subtitle="اختر تاريخ إعادة الاتصال بالعميل"
                  icon={Calendar}
                  iconBgColor="bg-brand-blue-600"
                  onClose={closeSchedule}
                  isSubmitting={actionLoading}
                />
              </div>

              {/* Content — scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="p-4 sm:p-5 space-y-4 pb-safe">
                  {/* Order summary card — genome: rounded-lg shadow-sm border */}
                  <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-3 bg-gray-50/50 dark:bg-gray-700/30">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-blue-100 dark:bg-brand-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-brand-blue-600 dark:text-brand-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-bold font-cairo text-gray-900 dark:text-gray-100 truncate">{o.customer?.name || 'غير محدد'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-cairo">{o.customer?.phone || ''}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="text-center p-2 rounded-lg bg-white/60 dark:bg-gray-800/60">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-cairo">نوع الخدمة</p>
                        <p className="text-xs font-bold font-cairo text-gray-800 dark:text-gray-200 truncate">{typeLabel}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/60 dark:bg-gray-800/60">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-cairo">العناصر</p>
                        <p className="text-xs font-bold font-cairo text-gray-800 dark:text-gray-200">{o.items_count ?? 0}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/60 dark:bg-gray-800/60">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-cairo">المبلغ</p>
                        <p className="text-xs font-bold font-cairo text-gray-800 dark:text-gray-200 truncate">{amountFmt}</p>
                      </div>
                    </div>
                    {o.address_governorate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-cairo flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        {o.address_governorate}
                        {o.address_city && o.address_city !== o.address_governorate ? ` · ${o.address_city}` : ''}
                      </p>
                    )}
                  </div>

                  {hasEdits && (
                    <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                      <p className="text-xs text-amber-800 dark:text-amber-200 font-cairo">⚠️ سيتم تجاهل التعديلات عند التأجيل.</p>
                    </div>
                  )}

                  {/* Quick chips — touch-friendly, responsive */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 font-cairo">اختر التاريخ</p>
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {SCHEDULE_CHIPS.map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleChipClick(chip)}
                          className={`min-h-[44px] px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg font-cairo text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 touch-manipulation ${
                            scheduleChip === chip.id
                              ? chip.id === 'custom'
                                ? 'bg-brand-blue-100 dark:bg-brand-blue-900/40 text-brand-blue-700 dark:text-brand-blue-300 ring-2 ring-brand-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                                : 'bg-brand-blue-600 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                    {scheduledDate && scheduleChip !== 'custom' && (
                      <p className="text-xs text-brand-blue-600 dark:text-brand-blue-400 font-cairo flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                        {formatDateAr(scheduledDate)}
                      </p>
                    )}
                  </div>

                  {/* Custom calendar — wider, responsive grid */}
                  {scheduleChip === 'custom' && (
                    <div className="rounded-lg shadow-sm border-2 border-brand-blue-200 dark:border-brand-blue-800 bg-gradient-to-br from-brand-blue-50/50 to-white dark:from-brand-blue-900/10 dark:to-gray-800 p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={prevMonth}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-brand-blue-100 dark:hover:bg-brand-blue-900/30 text-brand-blue-600 dark:text-brand-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red-500 touch-manipulation"
                          aria-label="الشهر السابق"
                        >
                          <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>
                        <span className="text-sm sm:text-base font-bold font-cairo text-gray-900 dark:text-gray-100">
                          {monthNames[month]} {year}
                        </span>
                        <button
                          type="button"
                          onClick={nextMonth}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-brand-blue-100 dark:hover:bg-brand-blue-900/30 text-brand-blue-600 dark:text-brand-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red-500 touch-manipulation"
                          aria-label="الشهر التالي"
                        >
                          <ChevronUp className="w-5 h-5 rotate-90" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 min-w-0">
                        {weekDays.map((d) => (
                          <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo py-1 truncate">
                            {d}
                          </div>
                        ))}
                        {Array.from({ length: firstDay }, (_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                          const disabled = isPast(d);
                          const selected = isSelected(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => !disabled && setScheduledDate(toDateStr(d))}
                              disabled={disabled}
                              className={`aspect-square min-w-[2rem] sm:min-w-[2.5rem] rounded-lg text-xs sm:text-sm font-cairo font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red-500 touch-manipulation ${
                                disabled
                                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                  : selected
                                    ? 'bg-brand-blue-600 text-white shadow-md'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-brand-blue-100 dark:hover:bg-brand-blue-900/30'
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                      {scheduleChip === 'custom' && scheduledDate && (
                        <p className="text-xs text-brand-blue-600 dark:text-brand-blue-400 font-cairo flex items-center gap-1.5 pt-1">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                          {formatDateAr(scheduledDate)}
                        </p>
                      )}
                      {scheduleChip === 'custom' && !scheduledDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-cairo">اختر يوماً من التقويم</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer — sticky, genome buttons */}
              <div className="sticky bottom-0 flex-shrink-0 px-4 sm:px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeSchedule}
                  disabled={actionLoading}
                  className="min-h-[44px] px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-cairo font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-red-500 touch-manipulation"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={actionLoading || !scheduledDate}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg font-cairo font-bold disabled:opacity-50 disabled:cursor-not-allowed text-white bg-brand-blue-600 hover:bg-brand-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red-500 touch-manipulation"
                >
                  {actionLoading ? 'جاري...' : 'مؤجلة'}
                </button>
              </div>
            </div>
          </ServiceModalWrapper>
        );
      })()}

      {/* Leader Action Modal — approve only */}
      {leaderActionModal.isOpen && leaderActionModal.type === 'approve' && order && customerContextProp?.leaderActions && (() => {
        const la = customerContextProp.leaderActions;
        return (
          <LeaderApprovalModal
            order={orderForLeaderApproval}
            liveSession
            sessionSignedCod={editableTotal}
            sessionCallNotes={editableNotes}
            sessionServiceType={callType !== 'ask' ? callType : undefined}
            sessionCustomer={customer}
            sessionItemsLines={leaderSessionItemLines}
            onApprove={async (payload) => {
              setLeaderActionLoading(true);
              try {
                await la.onProcessToHub(orderForLeaderApproval ?? order, payload);
                setLeaderActionModal({ isOpen: false, type: null, value: '' });
                onClose?.();
              } catch (err) {
                // Handled by API/toast
              } finally {
                setLeaderActionLoading(false);
              }
            }}
            onClose={() => setLeaderActionModal({ isOpen: false, type: null, value: '' })}
          />
        );
      })()}
    </>
  );
};

export default CallSessionFAB;
