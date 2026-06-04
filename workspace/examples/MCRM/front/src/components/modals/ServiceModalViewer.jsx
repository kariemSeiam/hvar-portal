import { Fragment, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Phone, User, MapPin, Edit2, Calendar, FileText, RotateCcw, Wrench, RefreshCw, Package, Send, PackageCheck, ExternalLink, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2, Truck, Settings, Star, Ticket } from 'lucide-react';
import { formatPhoneForLocalDisplay } from '../../utils/core/phone';
import { formatPriority } from '../../utils/service/utils';
import { getTicketViewerHeaderProps } from '../../utils/service/serviceModalShell';
import { formatDateOnly, getRelativeTime } from '../../utils/core/date';
import { getBostaCodValue, getBostaFeesValues, getBostaOrderDisplayNote, bostaFeesChipVisible } from '../../utils/bosta/cod';
import { BostaCodMainChip, BostaFeesCompactChip } from '../service/BostaSearchResultScreen/BostaOrderMoneyChips';
import { getSafeNotesDisplay } from '../../utils/ui/notes';
import {
  getTicketNotesRawForDisplay,
  normalizeTicketItemsArray,
  enrichTicketNotesFromBosta,
  getTicketItemsForDisplay,
} from '../../utils/service/ticketSnapshotDisplay.js';
import { parseCustomerJSONFields } from '../../utils/callcenter/customerParsers';
import customerAPI from '../../api/customerAPI';
import { ServiceModalWrapper, ServiceModalHeader } from './shared';
import { CollapsibleItemsList } from '../call-center/CallCenterItemsSelection';
import { SessionItemCardReadonly } from '../call-center/SessionItemCard';
import { ServiceStatusBadge, SessionStyleMoneyBadge } from '../ui';
import { buildPrintHtml } from './ServiceModalViewer/printHtml';
import CustomerCard from './ServiceModalViewer/CustomerCard';
import LocationCard from './ServiceModalViewer/LocationCard';
import CallHistoryCard from './ServiceModalViewer/CallHistoryCard';
import { toast } from 'react-hot-toast';
import { debug } from '../../config/environment';
import { SERVICE_TYPE_CONFIG, translateOrderType, getBostaOrderStatus, getStatusBadgeColor, getStatusLabel } from '../service/BostaSearchResultScreen/constants';
import { normalizeServiceTypeOrFallback } from '../../constants/serviceTypes.js';
import {
    SERVICE_TYPE_ICONS as TYPE_ICONS,
    SERVICE_TYPE_STRIP_BG as TYPE_STRIP_BG,
    SERVICE_TYPE_TAB_STYLES,
} from '../../constants/serviceTypeUi.js';

const NOTES_TRUNCATE = 48;

function ticketServiceTypeKey(ticket) {
    return normalizeServiceTypeOrFallback(ticket?.service_type, { fallback: 'replacement' });
}

function getTicketStatusBadge(status) {
    const s = (status || '').toLowerCase();
    const map = {
        draft: 'bg-accent-amber-100 text-accent-amber-800 border-accent-amber-200 dark:bg-accent-amber-900/30 dark:text-accent-amber-200 dark:border-accent-amber-700/60',
        pending: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
        confirmed: 'bg-ui-warning-100 text-ui-warning-800 border-ui-warning-200 dark:bg-ui-warning-900/30 dark:text-ui-warning-200 dark:border-ui-warning-700/60',
        in_process: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-200 dark:bg-brand-blue-900/30 dark:text-brand-blue-200 dark:border-brand-blue-700/60',
        in_transit: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-200 dark:bg-brand-blue-900/30 dark:text-brand-blue-200 dark:border-brand-blue-700/60',
        delivered: 'bg-accent-green-100 text-accent-green-800 border-accent-green-200 dark:bg-accent-green-900/30 dark:text-accent-green-200 dark:border-accent-green-700/60',
        completed: 'bg-accent-green-100 text-accent-green-800 border-accent-green-200 dark:bg-accent-green-900/30 dark:text-accent-green-200 dark:border-accent-green-700/60',
        cancelled: 'bg-brand-red-100 text-brand-red-800 border-brand-red-200 dark:bg-brand-red-900/40 dark:text-brand-red-200 dark:border-brand-red-700/60',
        failed: 'bg-brand-red-100 text-brand-red-800 border-brand-red-200 dark:bg-brand-red-900/40 dark:text-brand-red-200 dark:border-brand-red-700/60',
    };
    const labels = {
        draft: 'مسودة', pending: 'قيد الانتظار', confirmed: 'مؤكد', in_process: 'قيد المعالجة',
        in_transit: 'قيد الشحن', delivered: 'تم التسليم', completed: 'مكتمل', cancelled: 'ملغي', failed: 'فشل',
    };
    return { className: map[s] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600', label: labels[s] || status || '—' };
}

/**
 * ServiceModalViewer - Read-only modal for viewing ticket details (customer, location, Bosta orders, service tickets).
 * Opened from ticket cards in HubPage and ServiceActionCard.
 * Follows the design standards of UnifiedServiceActionModal.jsx.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Callback when modal is closed
 * @param {Object} [props.ticket] - Ticket object (id, ticket_number, phone, customer_name, governorate, city, items, etc.)
 */
const ServiceModalViewer = ({
    isOpen,
    onClose,
    ticket
}) => {
    const navigate = useNavigate();

    // Copy phone state
    const [copiedPhone, setCopiedPhone] = useState(null);
    const [copiedTracking, setCopiedTracking] = useState(null);

    // Customer profile state
    const [customerProfile, setCustomerProfile] = useState(null);
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [customerError, setCustomerError] = useState(null);

    // Tab state
    const [activeTab, setActiveTab] = useState('services'); // 'services' (tickets) default; 'bosta' or 'services'
    const [activeServiceType, setActiveServiceType] = useState(null); // 'replacement', 'maintenance', 'return', 'sell', or null for all
    const [expandedDescriptions, setExpandedDescriptions] = useState({}); // Track which descriptions are expanded
    const [expandedStarDetails, setExpandedStarDetails] = useState({}); // Track which star details are expanded (default collapsed)
    const [modalItemsTooltip, setModalItemsTooltip] = useState(null); // { direction, items, anchorRect } for إرسال/استلام tooltip in services tab
    const modalItemsTooltipRef = useRef(null);
    const [savingCustomer, setSavingCustomer] = useState(false);
    const [savingAddress, setSavingAddress] = useState(false);
    /** إرسال + استلام item lists: one toggle expands/collapses both columns */
    const [viewerItemListsExpanded, setViewerItemListsExpanded] = useState(false);

    useEffect(() => {
        setViewerItemListsExpanded(false);
    }, [ticket?.id]);

    useEffect(() => {
        if (!modalItemsTooltip) return;
        const close = (e) => {
            if (modalItemsTooltipRef.current && !modalItemsTooltipRef.current.contains(e.target) && !e.target.closest('[data-modal-items-chip]')) setModalItemsTooltip(null);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [modalItemsTooltip]);

    // Customer + Location block collapse (persist in sessionStorage)
    const [customerLocationExpanded, setCustomerLocationExpanded] = useState(() => {
        if (typeof sessionStorage === 'undefined') return true;
        const saved = sessionStorage.getItem('service-modal-viewer-customer-location-expanded');
        if (saved === null) return true;
        return saved === 'true';
    });
    const setCustomerLocationExpandedPersisted = (value) => {
        setCustomerLocationExpanded(value);
        try {
            sessionStorage.setItem('service-modal-viewer-customer-location-expanded', String(value));
        } catch (e) {
            // ignore
        }
    };

    // Load customer profile when modal opens
    useEffect(() => {
        if (!isOpen || !ticket) {
            // Reset state when modal closes
            setCustomerProfile(null);
            setCustomerError(null);
            setLoadingCustomer(false);
            return;
        }

        const loadCustomerProfile = async () => {
            setLoadingCustomer(true);
            setCustomerError(null);

            try {
                let customer = null;

                // Priority 1: Use customer_id from ticket
                if (ticket.customer_id) {
                    try {
                        const response = await customerAPI.getCustomerById(ticket.customer_id);
                        // Handle response format - API returns customer directly or wrapped in data/warning
                        // Format 1: Direct customer object
                        // Format 2: { data: customer }
                        // Format 3: { warning: "...", data: customer }
                        // Format 4: { error: "..." } - check for errors first
                        if (response) {
                            // Check for error object first
                            if (response.error && typeof response.error === 'string') {
                                throw new Error(response.error);
                            }

                            // Extract customer from response
                            customer = response.data || response;

                            // Validate customer is an object (not array, not null, not primitive)
                            if (customer && typeof customer === 'object' && !Array.isArray(customer)) {
                                // Parse JSON fields (bosta_orders, customer_services) using utility
                                customer = parseCustomerJSONFields(customer);

                                // Ensure customer has required fields and is valid structure
                                if (customer && typeof customer === 'object' && !Array.isArray(customer) &&
                                    (customer.id || customer.bosta_orders || customer.customer_services)) {
                                    // Ensure arrays are actually arrays
                                    if (customer.bosta_orders && !Array.isArray(customer.bosta_orders)) {
                                        customer.bosta_orders = [];
                                    }
                                    if (customer.customer_services && !Array.isArray(customer.customer_services)) {
                                        customer.customer_services = [];
                                    }

                                    if (import.meta.env.DEV) {
                                        console.log('[ServiceModalViewer] Loaded customer profile:', {
                                            id: customer.id,
                                            bostaOrdersCount: customer.bosta_orders?.length || 0,
                                            servicesCount: customer.customer_services?.length || 0
                                        });
                                    }
                                    setCustomerProfile(customer);
                                    setLoadingCustomer(false);
                                    return;
                                }
                            }
                        }
                    } catch (error) {
                        if (import.meta.env.DEV) debug.error('ServiceModalViewer: load customer by ID', error);
                        // Continue to try phone search
                    }
                }

                // Priority 2: Search by phone if customer_id not available or failed
                const phone = ticket.phone || ticket.customer?.phone || ticket.customer_phone;
                if (phone && !customer) {
                    try {
                        const results = await customerAPI.searchCustomers(phone, { type: 'phone' });

                        // Check for error object first
                        if (results && typeof results === 'object' && !Array.isArray(results) && results.error) {
                            throw new Error(results.error);
                        }

                        // Validate results is an array
                        if (results && Array.isArray(results) && results.length > 0) {
                            customer = results[0];

                            // Validate customer is an object
                            if (customer && typeof customer === 'object' && !Array.isArray(customer)) {
                                // Parse JSON fields using utility
                                customer = parseCustomerJSONFields(customer);

                                // Ensure arrays are actually arrays
                                if (customer.bosta_orders && !Array.isArray(customer.bosta_orders)) {
                                    customer.bosta_orders = [];
                                }
                                if (customer.customer_services && !Array.isArray(customer.customer_services)) {
                                    customer.customer_services = [];
                                }

                                if (customer && customer.id) {
                                    if (import.meta.env.DEV) {
                                        console.log('[ServiceModalViewer] Loaded customer via phone search:', {
                                            id: customer.id,
                                            bostaOrdersCount: customer.bosta_orders?.length || 0,
                                            servicesCount: customer.customer_services?.length || 0
                                        });
                                    }
                                    setCustomerProfile(customer);
                                    setLoadingCustomer(false);
                                    return;
                                }
                            }
                        }
                    } catch (error) {
                        if (import.meta.env.DEV) debug.error('ServiceModalViewer: search customer by phone', error);
                    }
                }

                // No customer found
                setCustomerProfile(null);
                setLoadingCustomer(false);
            } catch (error) {
                if (import.meta.env.DEV) debug.error('ServiceModalViewer: load customer profile', error);
                setCustomerError(error.message || 'فشل تحميل بيانات العميل');
                setLoadingCustomer(false);
            }
        };

        loadCustomerProfile();
    }, [isOpen, ticket?.id, ticket?.customer_id, ticket?.phone]); // Reload if ticket ID, customer_id, or phone changes

    // Tab (Bosta vs Services) is purely user-driven; no effect syncs it to data.
    // Collapse/expand of customer+location is independent and always available.

    // Compute data for rendering - memoized to prevent infinite loops
    // Prioritize customerProfile data (most complete), but merge with ticket data if needed
    // Deduplicate Bosta orders by tracking number
    const bostaOrders = useMemo(() => {
        if (!ticket) return [];

        // Ensure arrays are actually arrays
        const profileOrders = Array.isArray(customerProfile?.bosta_orders) ? customerProfile.bosta_orders : [];
        const ticketOrders = Array.isArray(ticket.bosta_orders) ? ticket.bosta_orders : [];

        // If we have profile orders, use them (they're the most complete)
        if (profileOrders.length > 0) {
            // Deduplicate by tracking number
            const seen = new Set();
            return profileOrders.filter(order => {
                // Validate order is an object
                if (!order || typeof order !== 'object' || Array.isArray(order)) return false;
                const tracking = order.trackingNumber || order.tracking_number;
                if (!tracking) return true; // Include orders without tracking
                const normalizedTracking = String(tracking).trim();
                if (!normalizedTracking || normalizedTracking === '-') return true;
                if (seen.has(normalizedTracking)) return false; // Skip duplicates
                seen.add(normalizedTracking);
                return true;
            });
        }

        // Fallback to ticket orders - validate each order
        return ticketOrders.filter(order => {
            return order && typeof order === 'object' && !Array.isArray(order);
        });
    }, [customerProfile?.bosta_orders, ticket?.bosta_orders]);

    // Deduplicate service tickets by ID or ticket_number
    const relatedTickets = useMemo(() => {
        if (!ticket) return [];

        // Ensure arrays are actually arrays
        const profileTickets = Array.isArray(customerProfile?.customer_services) ? customerProfile.customer_services : [];
        const ticketRelated = Array.isArray(ticket.related_tickets) ? ticket.related_tickets :
                             (Array.isArray(ticket.related_service_tickets) ? ticket.related_service_tickets : []);

        // If we have profile tickets, use them (they're the most complete)
        if (profileTickets.length > 0) {
            // Deduplicate by id or ticket_number
            const seen = new Set();
            return profileTickets.filter(t => {
                // Validate ticket is an object
                if (!t || typeof t !== 'object' || Array.isArray(t)) return false;
                const key = t.id || t.ticket_id || t.ticket_number;
                if (!key) return true;
                const normalizedKey = String(key).trim();
                if (!normalizedKey) return true;
                if (seen.has(normalizedKey)) return false;
                seen.add(normalizedKey);
                return true;
            });
        }

        // Fallback to ticket related tickets - validate each ticket
        return ticketRelated.filter(t => {
            return t && typeof t === 'object' && !Array.isArray(t);
        });
    }, [customerProfile?.customer_services, ticket?.related_tickets, ticket?.related_service_tickets]);

    /** Open modal ticket first in the list (stable order for the rest). */
    const orderedRelatedTickets = useMemo(() => {
        if (!ticket || relatedTickets.length === 0) return relatedTickets;
        const openId = ticket.id != null ? String(ticket.id) : null;
        const openNum = ticket.ticket_number != null ? String(ticket.ticket_number).trim().toUpperCase() : null;
        const head = [];
        const tail = [];
        for (const t of relatedTickets) {
            if (!t || typeof t !== 'object' || Array.isArray(t)) continue;
            const tid = t.id != null ? String(t.id) : null;
            const tnum = t.ticket_number != null ? String(t.ticket_number).trim().toUpperCase() : null;
            const isOpen = (openId && tid && openId === tid) || (openNum && tnum && openNum === tnum);
            if (isOpen) head.push(t);
            else tail.push(t);
        }
        return [...head, ...tail];
    }, [relatedTickets, ticket?.id, ticket?.ticket_number]);

    /** Map Bosta tracking # → customer_services row (for correct تذكرة badge per shipment). */
    const serviceTicketByTracking = useMemo(() => {
        const m = new Map();
        if (!Array.isArray(relatedTickets)) return m;
        for (const cs of relatedTickets) {
            if (!cs || typeof cs !== 'object') continue;
            for (const k of ['original_tracking', 'new_tracking_send', 'new_tracking_receive']) {
                const v = cs[k];
                if (v == null) continue;
                const norm = String(v).trim();
                if (norm) m.set(norm, cs);
            }
        }
        return m;
    }, [relatedTickets]);

    /** Ticket notes when Bosta package.description is empty (cached bosta_orders). */
    const servicesForBostaDisplayNotes = useMemo(() => {
        const out = [];
        const seen = new Set();
        for (const x of [ticket, ...(relatedTickets || [])]) {
            if (!x || typeof x !== 'object' || Array.isArray(x)) continue;
            const key = x.id != null ? String(x.id) : x.ticket_number != null ? String(x.ticket_number) : null;
            if (key) {
                if (seen.has(key)) continue;
                seen.add(key);
            }
            out.push(x);
        }
        return out;
    }, [ticket, relatedTickets]);

    const hasBosta = bostaOrders.length > 0;
    const hasServices = relatedTickets.length > 0;

    // Bosta: shipments tied to the open ticket first (original_tracking > send > receive), then newest
    const getBostaLinkScore = useCallback((order) => {
        if (!ticket || !order) return 0;
        const tr = String(order.trackingNumber || order.tracking_number || '').trim();
        if (!tr || tr === '-') return 0;
        const eq = (field) => field != null && String(field).trim() === tr;
        if (eq(ticket.original_tracking)) return 4;
        if (eq(ticket.new_tracking_send)) return 3;
        if (eq(ticket.new_tracking_receive)) return 2;
        return 0;
    }, [ticket?.original_tracking, ticket?.new_tracking_send, ticket?.new_tracking_receive]);

    const sortedBostaOrders = useMemo(() => {
        return [...bostaOrders].sort((a, b) => {
            if (!a || typeof a !== 'object' || Array.isArray(a)) return 1;
            if (!b || typeof b !== 'object' || Array.isArray(b)) return -1;

            const scoreA = getBostaLinkScore(a);
            const scoreB = getBostaLinkScore(b);
            if (scoreA !== scoreB) return scoreB - scoreA;

            const getDateValue = (order) => {
                const createdAt = order.createdAt || order.timestamps?.created;
                if (!createdAt) return 0;
                try {
                    const date = new Date(createdAt);
                    return isNaN(date.getTime()) ? 0 : date.getTime();
                } catch {
                    return 0;
                }
            };

            return getDateValue(b) - getDateValue(a);
        });
    }, [bostaOrders, getBostaLinkScore]);

    // Memoize phone for CallHistoryCard to prevent unnecessary re-renders
    const callHistoryPhone = useMemo(() => {
        // Safely extract phone with validation
        const profilePhone = (customerProfile && typeof customerProfile === 'object' && !Array.isArray(customerProfile))
            ? customerProfile.phone
            : null;
        const ticketPhone = (ticket && typeof ticket === 'object' && !Array.isArray(ticket))
            ? ticket.phone
            : null;
        const phone = profilePhone ?? ticketPhone ?? null;
        if (!phone) return null;
        const phoneStr = String(phone).trim();
        return phoneStr ? phoneStr : null;
    }, [customerProfile?.phone, ticket?.phone]);

    // Debug logging - moved to useEffect to prevent render loop
    useEffect(() => {
        if (import.meta.env.DEV && customerProfile && isOpen && ticket) {
            console.log('[ServiceModalViewer] Data summary:', {
                bostaOrdersFromProfile: customerProfile.bosta_orders?.length || 0,
                bostaOrdersFromTicket: ticket.bosta_orders?.length || 0,
                finalBostaOrdersCount: bostaOrders.length,
                servicesFromProfile: customerProfile.customer_services?.length || 0,
                servicesFromTicket: (ticket.related_tickets || ticket.related_service_tickets || []).length,
                finalServicesCount: relatedTickets.length
            });
        }
    }, [customerProfile, ticket, bostaOrders.length, relatedTickets.length, isOpen]);

    // Early return AFTER all hooks
    if (!isOpen || !ticket) return null;

    // Helper to safely get item direction
    const getItemDirection = (item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return 'send'; // Default
        }
        const direction = item.direction?.toLowerCase() || 'send';
        return direction === 'receive' ? 'receive' : 'send';
    };

    // Debug: Log items for verification - safely extract items with validation
    const ticketItems = (ticket && typeof ticket === 'object' && !Array.isArray(ticket) && Array.isArray(ticket.items))
        ? ticket.items
        : [];
    const sendItems = ticketItems.filter(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
        return getItemDirection(item) === 'send';
    });
    const receiveItems = ticketItems.filter(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
        return getItemDirection(item) === 'receive';
    });
    /** Column order matches CallCenterItemsSelection EditableItemsView (maintenance: استلام then إرسال). */
    const isMaintenanceItemsOrder = ticketServiceTypeKey(ticket) === 'maintenance';

    // Print function - uses extracted builder with escaped content (XSS-safe)
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const printContent = buildPrintHtml(ticket);
        printWindow.document.write(printContent);
        printWindow.document.close();
    };

    /* Print template: ServiceModalViewer/printHtml.js */
    const headerSubtitle = ticket.ticket_number
        ? `عرض معلومات التذكرة - ${ticket.ticket_number}`
        : 'عرض معلومات التذكرة';

    // Helper function to check if a number is a tracking number (not ticket number)
    // Tracking numbers are typically longer, alphanumeric, and not just numeric
    const isTrackingNumber = (value) => {
        if (!value) return false;
        // Ticket numbers are typically short numeric strings (e.g., "12345")
        // Tracking numbers are longer and often contain letters/dashes (e.g., "BOSTA-20260104-001")
        const str = String(value);
        // If it's the same as ticket number, it's not a tracking number
        if (str === String(ticket?.ticket_number || '')) return false;
        // If it's very short (less than 6 chars), likely not a tracking number
        if (str.length < 6) return false;
        // If it contains letters or special chars, likely a tracking number
        return /[A-Za-z-]/.test(str) || str.length >= 10;
    };

    // Generate Bosta link for tracking numbers
    const getBostaLink = (trackingNumber) => {
        if (!isTrackingNumber(trackingNumber)) return null;
        return `https://business.bosta.co/orders/${trackingNumber}`;
    };

    // Handle copy phone (store copied value so cards can show Check on the right phone)
    const handleCopyPhone = (phone) => {
        navigator.clipboard.writeText(phone);
        setCopiedPhone(phone);
        setTimeout(() => setCopiedPhone(null), 2000);
    };

    const customerId = customerProfile?.id ?? ticket?.customer_id;

    const handleSaveCustomer = async (payload, onDone) => {
        if (!customerId) {
            setCustomerError('لا يمكن التحديث: لم يتم العثور على عميل');
            return;
        }
        setSavingCustomer(true);
        setCustomerError(null);
        try {
            const res = await customerAPI.updateCustomer(customerId, {
                name: payload.name,
                phone: payload.phone,
                phone_secondary: payload.phone_secondary
            });
            const updated = res?.data ?? res;
            if (updated) setCustomerProfile(updated);
            onDone?.();
        } catch (err) {
            setCustomerError(err.response?.data?.error || err.message || 'فشل تحديث بيانات العميل');
        } finally {
            setSavingCustomer(false);
        }
    };

    const handleSaveAddress = async (payload, onDone) => {
        if (!customerId) {
            setCustomerError('لا يمكن التحديث: لم يتم العثور على عميل');
            return;
        }
        setSavingAddress(true);
        setCustomerError(null);
        try {
            const res = await customerAPI.updateCustomer(customerId, {
                governorate: payload.governorate,
                city: payload.city,
                address_details: payload.address_details
            });
            const updated = res?.data ?? res;
            if (updated) setCustomerProfile(updated);
            onDone?.();
        } catch (err) {
            setCustomerError(err.response?.data?.error || err.message || 'فشل تحديث العنوان');
        } finally {
            setSavingAddress(false);
        }
    };

    const formatTicketNumberLabel = (ticketItem) => {
        if (!ticketItem) return null;
        const prefixMap = {
            'replacement': 'HVR',
            'maintenance': 'HVM',
            'return': 'HVT',
            'sell': 'HVS'
        };
        const prefix = prefixMap[ticketItem.service_type] || 'HVR';
        if (ticketItem.ticket_number) {
            const numberMatch = ticketItem.ticket_number.match(/-(\d+)$/);
            const ticketNum = numberMatch ? numberMatch[1] : ticketItem.ticket_number;
            if (ticketItem.ticket_number.startsWith(prefix)) {
                return `# ${ticketItem.ticket_number}`;
            }
            return `# ${prefix}-${ticketNum}`;
        }
        if (ticketItem.id) {
            return `# ${prefix}-${String(ticketItem.id).padStart(4, '0')}`;
        }
        return null;
    };

    /** Parse ticket_number into prefix (colored) + YY·MM·DD·seq for readable display. */
    const formatTicketNumberForDisplay = (ticketNumber) => {
        if (!ticketNumber || typeof ticketNumber !== 'string') return null;
        const t = ticketNumber.trim();
        const match = t.match(/^([A-Za-z]+)(\d{2})(\d{2})(\d{2})(\d{2,4})$/);
        if (match) {
            const [, prefix, yy, mm, dd, seq] = match;
            return { prefix, yy, mm, dd, seq };
        }
        const fallback = t.match(/^([A-Za-z]+)(.*)$/);
        if (fallback) return { prefix: fallback[1], raw: fallback[2] || '' };
        return { prefix: '', raw: t };
    };

    const headerTicketNumber = formatTicketNumberLabel(ticket);

    const viewerHeaderProps = useMemo(() => getTicketViewerHeaderProps(ticket), [ticket]);

    return (
        <ServiceModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-6xl"
            maxHeight="max-h-[95vh]"
        >
            <ServiceModalHeader
                {...viewerHeaderProps}
                subtitle={headerTicketNumber}
                onClose={onClose}
            />

            {/* Content - Two Column Layout Similar to CallSessionFAB - Scrollable Area; min-h ensures modal doesn't collapse when one column is empty */}
            <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-3 md:gap-4 px-2 sm:px-3 md:px-4 lg:px-5 pt-2 sm:pt-3 md:pt-4 lg:pt-5 pb-0 min-h-[min(40vh,360px)] overflow-hidden">
                {/* Left Column - Customer & Location (profile) + Bosta/Tickets directly under */}
                <div className="flex-1 lg:flex-[0_0_45%] flex flex-col min-h-0 overflow-y-auto scrollbar-hide space-y-2 sm:space-y-2.5 md:space-y-3 pr-1 sm:pr-2 pb-4 sm:pb-6">
                    {/* Profile: collapse bar or cards - same width as Bosta/Tickets section below (no inset) */}
                    <div className="flex-shrink-0 flex flex-col w-full">
                        {/* Collapsed: summary bar (name · phone · city) - compact, matches section standards */}
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
                                        customerProfile?.name ?? ticket?.customer_name ?? '—',
                                        customerProfile?.phone ?? ticket?.phone
                                            ? formatPhoneForLocalDisplay(customerProfile?.phone ?? ticket?.phone)
                                            : null,
                                        customerProfile?.city ?? ticket?.city ?? null
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold text-brand-blue-600 dark:text-brand-blue-400 whitespace-nowrap flex-shrink-0">عرض</span>
                            </button>
                        )}
                        {/* Expanded: cards (collapse control inside CustomerCard) */}
                                        {customerLocationExpanded && (
                                            <>
                                                <div className="flex flex-col space-y-2 sm:space-y-2.5 md:space-y-3 min-w-0">
                                                    <CustomerCard
                                                        ticket={ticket}
                                                        customerProfile={customerProfile}
                                                        copiedPhone={copiedPhone}
                                                        onCopyPhone={handleCopyPhone}
                                                        onSaveCustomer={handleSaveCustomer}
                                                        saving={savingCustomer}
                                                        onCollapse={() => setCustomerLocationExpandedPersisted(false)}
                                                    />
                                                    <LocationCard
                                                        ticket={ticket}
                                                        customerProfile={customerProfile}
                                                        onSaveAddress={handleSaveAddress}
                                                        saving={savingAddress}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                    {/* Call history: always visible under profile (collapsed or expanded), above Bosta/Tickets tabs */}
                    <div className="flex-shrink-0 w-full">
                        <CallHistoryCard
                            phone={callHistoryPhone}
                            customerId={customerProfile?.id ?? ticket?.customer_id}
                        />
                    </div>

                    {/* Bosta/Tickets section — under call history; takes remaining space, content scrolls */}
                    {(hasBosta || hasServices || loadingCustomer || customerError) && (
                        <div className="flex flex-col shrink-0">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col flex-shrink-0">
                                {/* Tab Navigation - underline style (origin/main) */}
                                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 overflow-x-auto scrollbar-hide flex-shrink-0">
                                    {/* Bosta Tab */}
                                    {(hasBosta || loadingCustomer) && (
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

                                    {/* Services Tab */}
                                    {(hasServices || loadingCustomer) && (
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
                                                    {relatedTickets.length}
                                                </span>
                                            </div>
                                        </button>
                                    )}
                                </div>

                                {/* Tab Content - origin/main padding */}
                                <div
                                    className="px-2 sm:px-2.5 md:px-3 pt-2 sm:pt-2.5 md:pt-3 pb-2 sm:pb-2.5 md:pb-3 overflow-y-auto scrollbar-hide min-h-0 flex-1"
                                    dir="rtl"
                                    style={{ scrollPaddingBottom: '2rem', scrollBehavior: 'smooth' }}
                                >
                                    {/* Loading State */}
                                    {loadingCustomer && (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600 dark:text-brand-blue-400" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo">
                                                    جاري تحميل بيانات العميل...
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error State */}
                                    {customerError && !loadingCustomer && (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="flex flex-col items-center gap-2 p-4 bg-brand-red-50 dark:bg-brand-red-900/20 border border-brand-red-200 dark:border-brand-red-800 rounded-lg">
                                                <XCircle className="w-6 h-6 text-brand-red-600 dark:text-brand-red-400" />
                                                <p className="text-sm text-brand-red-700 dark:text-brand-red-300 font-cairo text-center">
                                                    {customerError}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setCustomerError(null);
                                                        setLoadingCustomer(true);
                                                        // Reload customer profile
                                                        const loadCustomerProfile = async () => {
                                                            try {
                                                                let customer = null;
                                                                if (ticket.customer_id) {
                                                                    try {
                                                                        const response = await customerAPI.getCustomerById(ticket.customer_id);
                                                                        // Check for error object
                                                                        if (response && typeof response === 'object' && !Array.isArray(response) && response.error) {
                                                                            throw new Error(response.error);
                                                                        }
                                                                        customer = response?.data || response;
                                                                        if (customer && typeof customer === 'object' && !Array.isArray(customer)) {
                                                                            customer = parseCustomerJSONFields(customer);
                                                                            // Ensure arrays are actually arrays
                                                                            if (customer.bosta_orders && !Array.isArray(customer.bosta_orders)) {
                                                                                customer.bosta_orders = [];
                                                                            }
                                                                            if (customer.customer_services && !Array.isArray(customer.customer_services)) {
                                                                                customer.customer_services = [];
                                                                            }
                                                                            if (customer && (customer.id || customer.bosta_orders || customer.customer_services)) {
                                                                                setCustomerProfile(customer);
                                                                                setLoadingCustomer(false);
                                                                                return;
                                                                            }
                                                                        }
                                                                    } catch (error) {
                                                                        if (import.meta.env.DEV) debug.error('ServiceModalViewer: load customer by ID', error);
                                                                    }
                                                                }
                                                                const phone = ticket.phone || ticket.customer?.phone || ticket.customer_phone;
                                                                if (phone && !customer) {
                                                                    try {
                                                                        const results = await customerAPI.searchCustomers(phone, { type: 'phone' });
                                                                        // Check for error object
                                                                        if (results && typeof results === 'object' && !Array.isArray(results) && results.error) {
                                                                            throw new Error(results.error);
                                                                        }
                                                                        if (results && Array.isArray(results) && results.length > 0) {
                                                                            customer = results[0];
                                                                            if (customer && typeof customer === 'object' && !Array.isArray(customer)) {
                                                                                customer = parseCustomerJSONFields(customer);
                                                                                // Ensure arrays are actually arrays
                                                                                if (customer.bosta_orders && !Array.isArray(customer.bosta_orders)) {
                                                                                    customer.bosta_orders = [];
                                                                                }
                                                                                if (customer.customer_services && !Array.isArray(customer.customer_services)) {
                                                                                    customer.customer_services = [];
                                                                                }
                                                                                if (customer && customer.id) {
                                                                                    setCustomerProfile(customer);
                                                                                    setLoadingCustomer(false);
                                                                                    return;
                                                                                }
                                                                            }
                                                                        }
                                                                    } catch (error) {
                                                                        if (import.meta.env.DEV) debug.error('ServiceModalViewer: search customer by phone', error);
                                                                    }
                                                                }
                                                                setCustomerProfile(null);
                                                                setLoadingCustomer(false);
                                                            } catch (error) {
                                                                if (import.meta.env.DEV) debug.error('ServiceModalViewer: load customer profile', error);
                                                                setCustomerError(error.message || 'فشل تحميل بيانات العميل');
                                                                setLoadingCustomer(false);
                                                            }
                                                        };
                                                        loadCustomerProfile();
                                                    }}
                                                    className="mt-2 px-4 py-2 text-xs bg-brand-red-600 hover:bg-brand-red-700 text-white rounded-lg font-cairo transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500"
                                                >
                                                    إعادة المحاولة
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bosta Orders Tab */}
                                    {activeTab === 'bosta' && hasBosta && !loadingCustomer && (
                                        <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-6">
                                            {sortedBostaOrders.map((bostaOrder, idx) => {
                                                // Validate bostaOrder is an object
                                                if (!bostaOrder || typeof bostaOrder !== 'object' || Array.isArray(bostaOrder)) {
                                                    return null;
                                                }

                                                // Safely extract date with null checks
                                                const createdAt = bostaOrder.createdAt || bostaOrder.timestamps?.created;
                                                const orderDate = createdAt ? (() => {
                                                    try {
                                                        const date = new Date(createdAt);
                                                        return isNaN(date.getTime()) ? null : date;
                                                    } catch {
                                                        return null;
                                                    }
                                                })() : null;
                                                const formattedDate = orderDate ? formatDateOnly(orderDate.toISOString()) : null;
                                                const relativeTime = orderDate ? getRelativeTime(orderDate.toISOString()) : null;

                                                const displayNote = getBostaOrderDisplayNote(bostaOrder, servicesForBostaDisplayNotes);
                                                const packageDescriptionKey = `bosta-package-${idx}`;
                                                const isPackageExpanded = expandedDescriptions[packageDescriptionKey] || false;
                                                const MAX_PACKAGE_DESCRIPTION_LENGTH = 80;

                                                const codValue = getBostaCodValue(bostaOrder) ?? 0;
                                                const fees = getBostaFeesValues(bostaOrder);

                                                // Get package info - validate package is object
                                                const packageObj = (bostaOrder.package && typeof bostaOrder.package === 'object' && !Array.isArray(bostaOrder.package))
                                                    ? bostaOrder.package
                                                    : null;
                                                const packageTypeRaw = packageObj?.type || bostaOrder.type || null;
                                                const itemsCount = packageObj?.itemsCount ?? bostaOrder.itemsCount ?? null;

                                                // Translate package type to Arabic
                                                const getPackageTypeLabel = (type) => {
                                                    if (!type) return null;
                                                    const typeLower = type.toLowerCase();
                                                    const translations = {
                                                        'small': 'صغير',
                                                        'medium': 'متوسط',
                                                        'large': 'كبير',
                                                        'parcel': 'طرد',
                                                        'package': 'طرد',
                                                        'box': 'صندوق',
                                                        'envelope': 'ظرف'
                                                    };
                                                    return translations[typeLower] || type;
                                                };
                                                const packageType = getPackageTypeLabel(packageTypeRaw);

                                                // Get order type - use translateOrderType for correct Arabic labels
                                                const orderType = bostaOrder.type || 'Send';
                                                const orderTypeLabel = translateOrderType(orderType);

                                                // Get star information - validate star is object
                                                const star = (bostaOrder.star && typeof bostaOrder.star === 'object' && !Array.isArray(bostaOrder.star))
                                                    ? bostaOrder.star
                                                    : null;
                                                const starName = star?.name || null;
                                                const starPhone = star?.phone || null;

                                                // Get communication info - validate communication is object
                                                const communication = (bostaOrder.communication && typeof bostaOrder.communication === 'object' && !Array.isArray(bostaOrder.communication))
                                                    ? bostaOrder.communication
                                                    : null;
                                                const communicationAttempts = communication?.attempts ?? 0;
                                                const callsCount = communication?.calls ?? 0;

                                                // Extract order ID from tracking number or use id field - with null checks
                                                const extractOrderId = () => {
                                                    if (bostaOrder.id != null) {
                                                        const idStr = String(bostaOrder.id).trim();
                                                        if (idStr) return idStr;
                                                    }
                                                    if (bostaOrder.order_id != null) {
                                                        const orderIdStr = String(bostaOrder.order_id).trim();
                                                        if (orderIdStr) return orderIdStr;
                                                    }
                                                    const tracking = bostaOrder.trackingNumber || bostaOrder.tracking_number;
                                                    if (tracking && typeof tracking === 'string') {
                                                        const trackingStr = tracking.trim();
                                                        if (trackingStr && trackingStr !== '-') {
                                                            const parts = trackingStr.split('-');
                                                            if (parts.length > 0) {
                                                                const lastPart = parts[parts.length - 1]?.trim();
                                                                if (lastPart && /^\d+$/.test(lastPart)) {
                                                                    return lastPart;
                                                                }
                                                            }
                                                            const numericMatch = trackingStr.match(/\d+/);
                                                            if (numericMatch && numericMatch[0]) {
                                                                return numericMatch[0];
                                                            }
                                                        }
                                                    }
                                                    return null;
                                                };

                                                const bostaOrderId = extractOrderId();
                                                const bostaLink = bostaOrderId ? `https://business.bosta.co/orders/${bostaOrderId}` : null;
                                                const trackingNumber = bostaOrder.trackingNumber || bostaOrder.tracking_number || '-';
                                                const normalizedTrackingNumber = (trackingNumber && trackingNumber !== '-' && typeof trackingNumber === 'string')
                                                    ? String(trackingNumber).trim() || null
                                                    : null;
                                                const ticketTrackings = [
                                                    ticket?.original_tracking,
                                                    ticket?.new_tracking_send,
                                                    ticket?.new_tracking_receive
                                                ].filter(Boolean).map(String);
                                                const matchedTrackingType = normalizedTrackingNumber
                                                    ? (ticket?.new_tracking_send === normalizedTrackingNumber
                                                        ? 'send'
                                                        : ticket?.new_tracking_receive === normalizedTrackingNumber
                                                            ? 'receive'
                                                            : ticket?.original_tracking === normalizedTrackingNumber
                                                                ? 'original'
                                                                : null)
                                                    : null;
                                                const isTrackingLinked = matchedTrackingType || (normalizedTrackingNumber && ticketTrackings.includes(normalizedTrackingNumber));
                                                const matchedServiceTicketForShipment = normalizedTrackingNumber
                                                    ? serviceTicketByTracking.get(normalizedTrackingNumber)
                                                    : null;
                                                const bostaLinkScore = getBostaLinkScore(bostaOrder);
                                                const isBostaCurrentShipment = Boolean(isTrackingLinked && bostaLinkScore > 0);

                                                // Extract Bosta order status using centralized function
                                                const bostaStatus = getBostaOrderStatus(bostaOrder);

                                                const hasCod = codValue !== 0;
                                                const hasFeesChip = bostaFeesChipVisible(fees);

                                                return (
                                                    <Fragment key={normalizedTrackingNumber || idx}>
                                                        <article
                                                            className={`
                                                                w-full flex items-start gap-0 rounded-xl border transition-all duration-200 text-right min-h-0 overflow-hidden
                                                                ${isBostaCurrentShipment
                                                                    ? 'border border-amber-300/45 dark:border-amber-600/35 shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-900/35 bg-white dark:bg-gray-800'
                                                                    : isTrackingLinked
                                                                        ? 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-red-600 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:shadow-md'
                                                                }
                                                                focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-800 ${isBostaCurrentShipment ? 'focus-within:ring-amber-500/30' : 'focus-within:ring-brand-blue-500/40'}
                                                            `}
                                                            dir="rtl"
                                                            aria-label={`طلب Bosta ${trackingNumber}`}
                                                        >
                                                            {/* Accent strip — Bosta red (same as BostaOrdersGrid) */}
                                                            <div className="w-1 flex-shrink-0 self-stretch bg-brand-red-500" aria-hidden />
                                                            {/* Icon column + ribbon: word «الحالية» = icon width (w-10) */}
                                                            <div className="flex-shrink-0 flex flex-col items-center p-3 pl-2">
                                                                <div className="flex w-10 flex-col items-stretch gap-0">
                                                                {isBostaCurrentShipment && (
                                                                    <div
                                                                        className="flex w-10 shrink-0 items-center justify-center rounded-t-xl border border-b-0 border-amber-200/80 dark:border-amber-700/45 bg-amber-50/95 dark:bg-amber-950/35 px-0 py-1"
                                                                        role="status"
                                                                        aria-label="الشحنة الحالية"
                                                                    >
                                                                        <span className="font-cairo text-[8px] font-semibold leading-none text-amber-950 dark:text-amber-100">
                                                                            الحالية
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className={`w-10 h-10 bg-brand-red-600 dark:bg-brand-red-500 flex items-center justify-center shadow-sm ${isBostaCurrentShipment ? 'rounded-t-none rounded-b-xl ring-1 ring-amber-200/50 dark:ring-amber-800/40' : 'rounded-lg'}`}>
                                                                    <Package className="w-5 h-5 text-white drop-shadow-sm" />
                                                                </div>
                                                                </div>
                                                                {starName && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedStarDetails(prev => ({ ...prev, [`star-${idx}`]: !prev[`star-${idx}`] }))}
                                                                        className={`mt-1.5 flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border transition-all duration-200 ${
                                                                            expandedStarDetails[`star-${idx}`]
                                                                                ? 'bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 border-amber-400 dark:border-amber-600 shadow-sm'
                                                                                : 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-300 dark:border-amber-700 hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-900/50 dark:hover:to-orange-900/50'
                                                                        }`}
                                                                    >
                                                                        <Star className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${expandedStarDetails[`star-${idx}`] ? 'rotate-180' : ''}`} />
                                                                        <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-300 font-cairo whitespace-nowrap leading-tight">المندوب</span>
                                                                        {expandedStarDetails[`star-${idx}`] ? (
                                                                            <ChevronUp className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                                                        ) : (
                                                                            <ChevronDown className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Content — horizontal padding matches Bosta; bottom padding lives on footer */}
                                                            <div className="flex-1 min-w-0 flex flex-col pt-3 pb-0 pe-3 ps-2 gap-2 sm:gap-2.5">
                                                            {/* One bar: Bosta link + ticket badge (same row) + status badge */}
                                                            <header className="flex items-center justify-between gap-1.5 sm:gap-2 w-full shrink-0 flex-wrap sm:flex-nowrap">
                                                                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap order-2 sm:order-1">
                                                                    {bostaLink ? (
                                                                        <a
                                                                            href={bostaLink}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="font-cairo font-bold text-brand-red-600 dark:text-brand-red-400 hover:text-brand-red-700 dark:hover:text-brand-red-300 text-[10px] sm:text-xs md:text-sm tracking-tight cursor-pointer shrink-0 whitespace-nowrap"
                                                                            dir="ltr"
                                                                        >
                                                                            #{trackingNumber}
                                                                        </a>
                                                                    ) : (
                                                                        <span className="font-cairo font-bold text-gray-900 dark:text-gray-100 text-[10px] sm:text-xs md:text-sm tracking-tight shrink-0 whitespace-nowrap" dir="ltr">
                                                                            #{trackingNumber}
                                                                        </span>
                                                                    )}
                                                                    {matchedServiceTicketForShipment?.ticket_number && (
                                                                        <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-800 dark:text-emerald-300/90 bg-emerald-50/80 dark:bg-emerald-950/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-emerald-200/60 dark:border-emerald-800/35 shrink-0 whitespace-nowrap">
                                                                            تذكرة: {matchedServiceTicketForShipment.ticket_number}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-md whitespace-nowrap border shrink-0 order-1 sm:order-2 ${getStatusBadgeColor(bostaStatus).replace('bg-ui-warning-100', 'bg-ui-warning-100 border-ui-warning-200').replace('bg-brand-blue-100', 'bg-brand-blue-100 border-brand-blue-200').replace('bg-accent-green-100', 'bg-accent-green-100 border-accent-green-200').replace('bg-gray-100', 'bg-gray-100 border-gray-200')}`}>
                                                                    {orderTypeLabel && orderTypeLabel !== "توصيل عادي" ? orderTypeLabel : getStatusLabel(bostaStatus)}
                                                                </span>
                                                            </header>

                                                            {/* Parcel description — card (clean sizing: icon md = 8×8, text xs) */}
                                                            {displayNote && (
                                                                <section className="flex-1 min-w-0" aria-label="وصف الطرد">
                                                                    <div className={`rounded-lg border p-2 space-y-1.5 ${isBostaCurrentShipment ? 'border-amber-200/55 dark:border-amber-800/35 bg-amber-50/20 dark:bg-gray-800/90' : 'border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/40'}`}>
                                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                                            <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center ${isBostaCurrentShipment ? 'bg-amber-100/90 dark:bg-amber-950/35' : 'bg-brand-red-100 dark:bg-brand-red-900/40'}`}>
                                                                                <Package className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isBostaCurrentShipment ? 'text-amber-800 dark:text-amber-300' : 'text-brand-red-600 dark:text-brand-red-400'}`} />
                                                                            </div>
                                                                            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 font-cairo leading-tight">
                                                                                وصف الطرد
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-gray-800 dark:text-gray-200 font-tajawal leading-relaxed">
                                                                            {(() => {
                                                                                const desc = displayNote;
                                                                                const shouldTruncate = desc && desc.length > MAX_PACKAGE_DESCRIPTION_LENGTH;
                                                                                const display = shouldTruncate && !isPackageExpanded
                                                                                    ? desc.substring(0, MAX_PACKAGE_DESCRIPTION_LENGTH) + '...'
                                                                                    : desc;
                                                                                if (shouldTruncate) {
                                                                                    return (
                                                                                        <>
                                                                                            {!isPackageExpanded ? (
                                                                                                <span className="line-clamp-2">{display}</span>
                                                                                            ) : (
                                                                                                <span className="whitespace-pre-line break-words">{desc}</span>
                                                                                            )}
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setExpandedDescriptions(prev => ({ ...prev, [packageDescriptionKey]: !prev[packageDescriptionKey] }));
                                                                                                }}
                                                                                                className="mt-1 text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 text-[10px] font-semibold font-cairo inline-flex items-center gap-1"
                                                                                            >
                                                                                                {isPackageExpanded ? (
                                                                                                    <><ChevronUp className="w-3 h-3" /> عرض أقل</>
                                                                                                ) : (
                                                                                                    <><ChevronDown className="w-3 h-3" /> عرض المزيد</>
                                                                                                )}
                                                                                            </button>
                                                                                        </>
                                                                                    );
                                                                                }
                                                                                return <span className="break-words">{desc}</span>;
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </section>
                                                            )}

                                                            {/* Expandable المندوب Details (same scale: 10px labels, xs body) */}
                                                            {starName && expandedStarDetails[`star-${idx}`] && (
                                                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 space-y-2">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                                                                <div className="p-1 rounded-md bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
                                                                                    <User className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0 space-y-1">
                                                                                    <div>
                                                                                        <div className="text-[10px] text-gray-500 dark:text-gray-500 font-medium font-cairo mb-0.5">
                                                                                            اسم المندوب
                                                                                        </div>
                                                                                        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 font-cairo truncate">
                                                                                            {starName}
                                                                                        </div>
                                                                                    </div>
                                                                                    {starPhone && (
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <Phone className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                                                            <a
                                                                                                href={`tel:${starPhone}`}
                                                                                                className="text-xs font-semibold text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 font-cairo transition-colors"
                                                                                            >
                                                                                                {starPhone}
                                                                                            </a>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    navigator.clipboard.writeText(starPhone);
                                                                                                    setCopiedPhone(starPhone);
                                                                                                    setTimeout(() => setCopiedPhone(null), 2000);
                                                                                                }}
                                                                                                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                                                                                                title="نسخ الرقم"
                                                                                            >
                                                                                                {copiedPhone === starPhone ? (
                                                                                                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                                                                ) : (
                                                                                                    <Copy className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                                                                                )}
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {communicationAttempts > 0 && (
                                                                                <div className="flex flex-col items-end gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600 flex-shrink-0">
                                                                                    <div className="flex items-center gap-1">
                                                                                        <Phone className="w-3 h-3 text-red-500 dark:text-red-400 flex-shrink-0" />
                                                                                        <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 font-cairo">
                                                                                            {communicationAttempts}
                                                                                        </span>
                                                                                    </div>
                                                                                    {callsCount > 0 && (
                                                                                        <div className="flex items-center gap-1">
                                                                                            <Phone className="w-3 h-3 text-green-500 dark:text-green-400 flex-shrink-0" />
                                                                                            <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 font-cairo">
                                                                                                {callsCount}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Footer — time + COD + Bosta fees (spacing matches service ticket cards) */}
                                                            <footer className="mt-auto w-full border-t border-gray-100 dark:border-gray-700/50 pt-3 sm:pt-3.5 pb-3 sm:pb-3.5 flex items-center justify-between gap-2 sm:gap-3 flex-wrap flex-row-reverse">
                                                                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 font-cairo min-w-0 shrink-0 leading-snug">
                                                                    <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    <span>{relativeTime || formattedDate}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-start self-center">
                                                                    {hasCod && <BostaCodMainChip codValue={codValue} bostaOrder={bostaOrder} />}
                                                                    {hasFeesChip && <BostaFeesCompactChip fees={fees} />}
                                                                </div>
                                                            </footer>
                                                            </div>
                                                        </article>
                                                    </Fragment>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Empty State - No Bosta Orders */}
                                    {activeTab === 'bosta' && !hasBosta && !loadingCustomer && (
                                        <div className="flex flex-col items-center justify-center py-12 px-4">
                                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mb-3">
                                                <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo text-center">
                                                لا توجد طلبات Bosta متاحة
                                            </p>
                                        </div>
                                    )}

                                    {/* Services Tab with Sub-tabs */}
                                    {activeTab === 'services' && hasServices && !loadingCustomer && (
                                        <>
                                        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                                            {/* Service Type Sub-tabs */}
                                            {(() => {
                                                const serviceTypes = ['replacement', 'maintenance', 'return', 'sell'];
                                                const availableTypes = serviceTypes.filter(type =>
                                                    orderedRelatedTickets.some(t =>
                                                        t && typeof t === 'object' && !Array.isArray(t) && ticketServiceTypeKey(t) === type
                                                    )
                                                );

                                                if (availableTypes.length <= 1) {
                                                    return null;
                                                }

                                                return (
                                                    <div
                                                        dir="rtl"
                                                        className="flex w-full min-w-0 flex-nowrap items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide pb-2 sm:pb-2.5 [-webkit-overflow-scrolling:touch] border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveServiceType(null)}
                                                            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg py-2 ps-3 pe-3 text-[10px] sm:text-xs font-medium font-cairo transition-colors whitespace-nowrap touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 ${!activeServiceType ? 'bg-brand-blue-100 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                        >
                                                            <span className="shrink-0">الكل</span>
                                                            <span className={`inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[9px] font-bold tabular-nums leading-none ${!activeServiceType ? 'bg-brand-blue-200 dark:bg-brand-blue-800' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                                                {relatedTickets.length}
                                                            </span>
                                                        </button>
                                                        {availableTypes.map(type => {
                                                            const typeInfo = { replacement: { icon: RotateCcw, label: 'استبدال' }, maintenance: { icon: Wrench, label: 'صيانة' }, return: { icon: RefreshCw, label: 'استرجاع' }, sell: { icon: Package, label: 'بيع' } }[type];
                                                            const TypeIcon = typeInfo?.icon || FileText;
                                                            const count = relatedTickets.filter(t =>
                                                                t && typeof t === 'object' && !Array.isArray(t) && ticketServiceTypeKey(t) === type
                                                            ).length;
                                                            const tabStyle = SERVICE_TYPE_TAB_STYLES[type] || SERVICE_TYPE_TAB_STYLES.replacement;
                                                            const isActive = activeServiceType === type;
                                                            return (
                                                                <button
                                                                    key={type}
                                                                    type="button"
                                                                    onClick={() => setActiveServiceType(type)}
                                                                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg py-2 ps-3 pe-3 text-[10px] sm:text-xs font-medium font-cairo transition-colors whitespace-nowrap touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 ${isActive ? tabStyle.active : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                                >
                                                                    <TypeIcon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                                                                    <span className="shrink-0">{typeInfo?.label || type}</span>
                                                                    <span className={`inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full px-1.5 text-[9px] font-bold tabular-nums leading-none ${isActive ? tabStyle.badge : 'bg-gray-200 dark:bg-gray-600'}`}>
                                                                        {count}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}

                                            {/* Service Tickets List */}
                                            <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-6">
                                                {(() => {
                                                const serviceTypes = ['replacement', 'maintenance', 'return', 'sell'];
                                                const availableTypes = serviceTypes.filter(type =>
                                                    orderedRelatedTickets.some(t =>
                                                        t && typeof t === 'object' && !Array.isArray(t) && ticketServiceTypeKey(t) === type
                                                    )
                                                );

                                                    return orderedRelatedTickets
                                                        .filter(ticketItem => {
                                                            const tKey = ticketServiceTypeKey(ticketItem);
                                                            if (availableTypes.length === 1) {
                                                                return tKey === availableTypes[0];
                                                            }
                                                            return !activeServiceType || tKey === activeServiceType;
                                                        })
                                                        .map((ticketItem, idx) => {
                                                            // Validate ticketItem is an object
                                                            if (!ticketItem || typeof ticketItem !== 'object' || Array.isArray(ticketItem)) {
                                                                return null;
                                                            }

                                                            // Check if this is the current ticket being viewed (same rules as orderedRelatedTickets)
                                                            const isCurrentTicket = (() => {
                                                                if (!ticket) return false;
                                                                if (ticketItem.id != null && ticket.id != null && String(ticketItem.id) === String(ticket.id)) return true;
                                                                const a = ticketItem.ticket_number != null ? String(ticketItem.ticket_number).trim().toUpperCase() : '';
                                                                const b = ticket.ticket_number != null ? String(ticket.ticket_number).trim().toUpperCase() : '';
                                                                return Boolean(a && b && a === b);
                                                            })();

                                                            // Prefer DB/snapshot; if customer_services is stale (no notes/items), enrich from linked Bosta order by tracking #
                                                            const rawNotes = (() => {
                                                              const fromTicket = isCurrentTicket && ticket
                                                                ? (getTicketNotesRawForDisplay(ticket) ?? getTicketNotesRawForDisplay(ticketItem))
                                                                : getTicketNotesRawForDisplay(ticketItem);
                                                              if (fromTicket) return fromTicket;
                                                              const b1 = enrichTicketNotesFromBosta(ticketItem, bostaOrders);
                                                              if (b1) return b1;
                                                              return isCurrentTicket && ticket ? enrichTicketNotesFromBosta(ticket, bostaOrders) : null;
                                                            })();
                                                            const ticketNotes = getSafeNotesDisplay(rawNotes);

                                                            const itemsArray = (() => {
                                                              if (isCurrentTicket && ticket && typeof ticket === 'object' && !Array.isArray(ticket)) {
                                                                const a = normalizeTicketItemsArray(ticket);
                                                                if (a.length > 0) return a;
                                                              }
                                                              const snap = normalizeTicketItemsArray(ticketItem);
                                                              if (snap.length > 0) return snap;
                                                              return getTicketItemsForDisplay(ticketItem, bostaOrders);
                                                            })();

                                                            // Handle ticket click - navigate to ticket
                                                            const handleTicketClick = () => {
                                                                const ticketId = ticketItem.id || ticketItem.ticket_id;
                                                                if (ticketId && ticketId !== ticket.id) {
                                                                    onClose();
                                                                    navigate(`/?serviceId=${ticketId}`);
                                                                }
                                                            };
                                                            const itemCanon = ticketServiceTypeKey(ticketItem);
                                                            const serviceInfo = {
                                                                'replacement': { icon: RotateCcw, color: 'from-blue-500 to-cyan-500', label: 'استبدال', bgColor: 'blue' },
                                                                'maintenance': { icon: Wrench, color: 'from-amber-500 to-orange-500', label: 'صيانة', bgColor: 'amber' },
                                                                'return': { icon: RefreshCw, color: 'from-brand-red-500 to-pink-500', label: 'استرجاع', bgColor: 'red' },
                                                                'sell': { icon: Package, color: 'from-accent-green-500 to-emerald-500', label: 'بيع', bgColor: 'green' }
                                                            }[itemCanon] || { icon: FileText, color: 'from-gray-500 to-gray-600', label: ticketItem.service_type, bgColor: 'gray' };
                                                            const ServiceIcon = serviceInfo.icon;

                                                            // Safely extract and parse date
                                                            const createdAt = ticketItem.created_at || (isCurrentTicket && ticket?.created_at);
                                                            const ticketDate = createdAt ? (() => {
                                                                try {
                                                                    const date = new Date(createdAt);
                                                                    return isNaN(date.getTime()) ? null : date;
                                                                } catch {
                                                                    return null;
                                                                }
                                                            })() : null;
                                                            const formattedDate = ticketDate ? formatDateOnly(ticketDate.toISOString()) : null;
                                                            const relativeTime = ticketDate ? getRelativeTime(ticketDate.toISOString()) : null;

                                                            // Get items by direction (use merged items so current ticket shows full data)
                                                            const getItemsByDirection = () => {
                                                                if (!itemsArray.length) return { send: [], receive: [] };
                                                                const buckets = itemsArray.reduce((acc, item) => {
                                                                    if (!item || typeof item !== 'object' || Array.isArray(item)) return acc;
                                                                    const direction = (item.direction && String(item.direction).toLowerCase()) || '';
                                                                    if (direction === 'send') acc.send.push(item);
                                                                    else if (direction === 'receive') acc.receive.push(item);
                                                                    else acc.undirected.push(item);
                                                                    return acc;
                                                                }, { send: [], receive: [], undirected: [] });
                                                                if (buckets.undirected.length && itemCanon !== 'sell') {
                                                                    buckets.receive.push(...buckets.undirected);
                                                                } else if (buckets.undirected.length) {
                                                                    buckets.send.push(...buckets.undirected);
                                                                }
                                                                return { send: buckets.send, receive: buckets.receive };
                                                            };

                                                            const { send, receive } = getItemsByDirection();

                                                            // Get items display component
                                                            const getItemsDisplay = () => {
                                                                // Special handling for sell tickets - focus on parts, products as hint
                                                                if (itemCanon === 'sell') {
                                                                    // Separate parts and products from send items - validate each item
                                                                    const parts = send.filter(item =>
                                                                        item && typeof item === 'object' && !Array.isArray(item) && item.type === 'part'
                                                                    );
                                                                    const products = send.filter(item =>
                                                                        item && typeof item === 'object' && !Array.isArray(item) && item.type === 'product'
                                                                    );

                                                                    if (parts.length === 0 && products.length === 0) return null;

                                                                    return (
                                                                        <div className="mb-2 flex items-start gap-2 flex-wrap">
                                                                            {/* Parts - Main Focus (What's being sold) */}
                                                                            {parts.length > 0 && (
                                                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-accent-green-100 dark:bg-accent-green-900/30 border border-accent-green-200 dark:border-accent-green-700 rounded-md">
                                                                                    <Settings className="w-3 h-3 text-accent-green-600 dark:text-accent-green-400 flex-shrink-0" />
                                                                                    <span className="text-[10px] font-medium text-accent-green-700 dark:text-accent-green-300 font-cairo">
                                                                                        قطع ({parts.length})
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {/* Products - Hint/Reference */}
                                                                            {products.length > 0 && (
                                                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
                                                                                    <Package className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 font-cairo">
                                                                                        {products.length} منتج
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }

                                                                // Default behavior for other service types
                                                                if (send.length === 0 && receive.length === 0) return null;

                                                                return (
                                                                    <>
                                                                        {send.length > 0 && (
                                                                            <button
                                                                                type="button"
                                                                                data-modal-items-chip
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setModalItemsTooltip({ direction: 'send', items: send, anchorRect: e.currentTarget.getBoundingClientRect() });
                                                                                }}
                                                                                className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-md text-[10px] font-medium text-blue-700 dark:text-blue-300 font-cairo cursor-pointer transition-colors"
                                                                            >
                                                                                <Truck className="w-3 h-3 flex-shrink-0" />
                                                                                <span>إرسال</span>
                                                                                <span className="text-[9px] font-bold bg-blue-200 dark:bg-blue-800 px-1 py-0.5 rounded-full text-blue-800 dark:text-blue-200">{send.length}</span>
                                                                            </button>
                                                                        )}
                                                                        {receive.length > 0 && (
                                                                            <button
                                                                                type="button"
                                                                                data-modal-items-chip
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setModalItemsTooltip({ direction: 'receive', items: receive, anchorRect: e.currentTarget.getBoundingClientRect() });
                                                                                }}
                                                                                className="flex items-center gap-1.5 px-2 py-1 bg-accent-green-100 hover:bg-accent-green-200 dark:bg-accent-green-900/30 dark:hover:bg-accent-green-900/50 border border-accent-green-200 dark:border-accent-green-700 rounded-md text-[10px] font-medium text-accent-green-700 dark:text-accent-green-300 font-cairo cursor-pointer transition-colors"
                                                                            >
                                                                                <Package className="w-3 h-3 flex-shrink-0" />
                                                                                <span>استلام</span>
                                                                                <span className="text-[9px] font-bold bg-accent-green-200 dark:bg-accent-green-800 px-1 py-0.5 rounded-full text-accent-green-800 dark:text-accent-green-200">{receive.length}</span>
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                );
                                                            };

                                                            const itemsRow = getItemsDisplay();

                                                            const type = itemCanon;
                                                            const config = SERVICE_TYPE_CONFIG[type] || SERVICE_TYPE_CONFIG.replacement;
                                                            const TypeIcon = TYPE_ICONS[type] || RotateCcw;

                                                            // Safely extract ticket number short form
                                                            const ticketShort = (ticketItem.ticket_number && typeof ticketItem.ticket_number === 'string')
                                                                ? ticketItem.ticket_number.split('-').pop() || ticketItem.id
                                                                : ticketItem.id;

                                                            // Safely extract and normalize status
                                                            const ticketStatus = ticketItem.status || (isCurrentTicket && ticket?.status) || '';
                                                            const normalizedStatus = String(ticketStatus).toLowerCase().replace(/\s+/g, '_');

                                                            // Safely extract cost adjustment
                                                            const ticketCost = (isCurrentTicket && ticket && typeof ticket === 'object' && !Array.isArray(ticket))
                                                                ? ticket.cost_adjustment
                                                                : ticketItem.cost_adjustment;
                                                            const hasCost = ticketCost != null && String(ticketCost).trim() !== '';
                                                            const showNotesBlock = ticketNotes && ticketNotes.length > 0;
                                                            const notesKey = `ticket-notes-${ticketItem.id ?? idx}`;
                                                            const isNotesExpanded = expandedDescriptions[notesKey];

                                                            const CardWrapper = isCurrentTicket ? 'div' : 'button';
                                                            return (
                                                                <CardWrapper
                                                                    key={ticketItem.id ?? ticketItem.ticket_number ?? idx}
                                                                    type={isCurrentTicket ? undefined : 'button'}
                                                                    onClick={!isCurrentTicket ? handleTicketClick : undefined}
                                                                    className={`w-full flex items-start gap-0 rounded-xl border transition-all duration-200 text-right min-h-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800
                                                                        ${isCurrentTicket
                                                                            ? 'cursor-default border border-teal-300/40 dark:border-teal-600/30 shadow-sm ring-1 ring-teal-200/45 dark:ring-teal-800/45 bg-white dark:bg-gray-800'
                                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-blue-400 dark:hover:border-brand-blue-500 hover:bg-brand-blue-50/50 dark:hover:bg-brand-blue-900/10 hover:shadow-md cursor-pointer'
                                                                        }`}
                                                                    dir="rtl"
                                                                    aria-label={isCurrentTicket ? undefined : `تذكرة ${ticketItem.ticket_number || ticketShort}`}
                                                                >
                                                                    {/* Accent strip — same pattern as BostaOrdersGrid (no rounded, no min-h) */}
                                                                    <div className={`w-1 flex-shrink-0 self-stretch ${TYPE_STRIP_BG[type] || 'bg-brand-blue-500'}`} aria-hidden />
                                                                    {/* Icon column + ribbon: «الحالية» = same width as icon (w-10) */}
                                                                    <div className="flex-shrink-0 flex flex-col items-center p-3 pl-2">
                                                                        <div className="flex w-10 flex-col items-stretch gap-0">
                                                                        {isCurrentTicket && (
                                                                            <div
                                                                                className="flex w-10 shrink-0 items-center justify-center rounded-t-xl border border-b-0 border-teal-200/75 dark:border-teal-700/45 bg-teal-50/95 dark:bg-teal-950/40 px-0 py-1"
                                                                                role="status"
                                                                                aria-label="التذكرة الحالية"
                                                                            >
                                                                                <span className="font-cairo text-[8px] font-semibold leading-none text-teal-900 dark:text-teal-100">
                                                                                    الحالية
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <div className={`w-10 h-10 flex items-center justify-center shadow-sm bg-gradient-to-br ${config.gradient} ${isCurrentTicket ? 'rounded-t-none rounded-b-xl ring-1 ring-teal-200/40 dark:ring-teal-700/35' : 'rounded-lg'}`}>
                                                                            <TypeIcon className="w-5 h-5 text-white drop-shadow-sm" />
                                                                        </div>
                                                                        </div>
                                                                    </div>
                                                                    {/* Content — horizontal padding matches Bosta; bottom padding on footer */}
                                                                    <div className="flex-1 min-w-0 flex flex-col pt-3 pb-0 pe-3 ps-2 gap-2 sm:gap-2.5">
                                                                        <header className="flex items-center justify-between gap-1.5 sm:gap-2 w-full shrink-0 flex-wrap sm:flex-nowrap">
                                                                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap order-2 sm:order-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const toCopy = String(ticketItem.ticket_number || ticketShort || '')
                                                                                            .replace(/^\s*#\s*/, '')
                                                                                            .trim();
                                                                                        navigator.clipboard.writeText(toCopy);
                                                                                        toast.success('تم نسخ رقم التذكرة');
                                                                                    }}
                                                                                    className="font-cairo font-bold text-[10px] sm:text-xs md:text-sm tracking-tight text-gray-900 dark:text-gray-100 min-w-0 flex items-baseline gap-1 sm:gap-1.5 flex-wrap sm:flex-nowrap rounded-md px-1 sm:px-1.5 py-0.5 -mx-1 sm:-mx-1.5 -my-0.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-right border border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-1 shrink-0 max-w-full overflow-hidden" dir="ltr" title="نسخ رقم التذكرة"
                                                                                >
                                                                                    {(() => {
                                                                                        const parsed = formatTicketNumberForDisplay(ticketItem.ticket_number || ticketShort);
                                                                                        if (!parsed) return <span className="truncate">#{ticketItem.ticket_number || ticketShort}</span>;
                                                                                        if (parsed.yy != null) {
                                                                                            return (
                                                                                                <>
                                                                                                    <span className="text-gray-700 dark:text-gray-300 font-semibold shrink-0 text-[9px] sm:text-[10px] md:text-xs">#</span>
                                                                                                    <span className="text-brand-blue-600 dark:text-brand-blue-400 font-extrabold shrink-0 text-[9px] sm:text-[10px] md:text-xs">{parsed.prefix}</span>
                                                                                                    <span className="tabular-nums text-gray-700 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/50 rounded px-1 sm:px-1.5 py-0.5 font-semibold text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap">{parsed.yy} · {parsed.mm} · {parsed.dd} · {parsed.seq}</span>
                                                                                                </>
                                                                                            );
                                                                                        }
                                                                                        return (
                                                                                            <>
                                                                                                <span className="text-gray-700 dark:text-gray-300 font-semibold shrink-0 text-[9px] sm:text-[10px] md:text-xs">#</span>
                                                                                                {parsed.prefix && <span className="text-brand-blue-600 dark:text-brand-blue-400 font-extrabold shrink-0 text-[9px] sm:text-[10px] md:text-xs">{parsed.prefix}</span>}
                                                                                                <span className="bg-gray-100/80 dark:bg-gray-700/50 rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] md:text-xs whitespace-nowrap truncate max-w-[120px] sm:max-w-none">{parsed.raw}</span>
                                                                                            </>
                                                                                        );
                                                                                    })()}
                                                                                </button>
                                                                                <span className={`shrink-0 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-md border whitespace-nowrap ${config.bg} ${config.text} ${config.border}`}>
                                                                                    {config.label}
                                                                                </span>
                                                                            </div>
                                                                            <div className="shrink-0 flex items-center order-1 sm:order-2">
                                                                                <ServiceStatusBadge status={normalizedStatus} size="xs" showIcon={true} className="shrink-0" />
                                                                            </div>
                                                                        </header>
                                                                        {showNotesBlock && (
                                                                            <section className="flex-1 min-w-0" aria-label="الملاحظات">
                                                                                <div className={`rounded-lg border p-2 space-y-1.5 ${isCurrentTicket ? 'border-teal-200/55 dark:border-teal-700/35 bg-teal-50/25 dark:bg-gray-800/80' : 'border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/40'}`}>
                                                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                        <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center ${isCurrentTicket ? 'bg-teal-100/90 dark:bg-teal-900/35' : 'bg-brand-blue-100 dark:bg-brand-blue-900/40'}`}>
                                                                                            <FileText className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isCurrentTicket ? 'text-teal-700 dark:text-teal-300' : 'text-brand-blue-600 dark:text-brand-blue-400'}`} />
                                                                                        </div>
                                                                                        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 font-cairo leading-tight">الملاحظات</span>
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-800 dark:text-gray-200 font-tajawal leading-relaxed">
                                                                                        {ticketNotes.length > NOTES_TRUNCATE ? (
                                                                                            <>
                                                                                                <span className={!isNotesExpanded ? 'line-clamp-2' : 'whitespace-pre-line break-words'}>{isNotesExpanded ? ticketNotes : `${ticketNotes.slice(0, NOTES_TRUNCATE)}…`}</span>
                                                                                                <button type="button" onClick={(e) => { e.stopPropagation(); setExpandedDescriptions(prev => ({ ...prev, [notesKey]: !prev[notesKey] })); }} className="mt-1 text-brand-blue-600 dark:text-brand-blue-400 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 text-[10px] font-semibold font-cairo inline-flex items-center gap-1">
                                                                                                    {isNotesExpanded ? 'عرض أقل' : 'عرض المزيد'}
                                                                                                </button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <span className="break-words">{ticketNotes}</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </section>
                                                                        )}
                                                                        {itemsRow && (itemCanon === 'sell' ? itemsRow : <div className="flex flex-wrap gap-1.5 mb-2">{itemsRow}</div>)}
                                                                        <footer className="mt-auto w-full border-t border-gray-100 dark:border-gray-700/50 pt-3 sm:pt-3.5 pb-3 sm:pb-3.5 flex items-center justify-between gap-2 sm:gap-3 flex-wrap flex-row-reverse">
                                                                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 font-cairo min-w-0 shrink-0 leading-snug">
                                                                                {relativeTime && (
                                                                                    <>
                                                                                        <svg className="w-4 h-4 opacity-80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                                        <span>{relativeTime}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                            {hasCost && (
                                                                                <div className="shrink-0 flex items-center self-center">
                                                                                    <SessionStyleMoneyBadge value={ticketCost} size="sm" />
                                                                                </div>
                                                                            )}
                                                                        </footer>
                                                                    </div>
                                                                </CardWrapper>
                                                            );
                                                        });
                                                })()}
                                            </div>
                                        </div>
                                        </>
                                    )}

                                    {/* Floating items tooltip — outside fragment so it can be sibling */}
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
                                            <div
                                                ref={modalItemsTooltipRef}
                                                role="tooltip"
                                                className="fixed z-[60] rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl p-3 max-w-[min(18rem,90vw)] transition-all duration-200 ease-out opacity-100"
                                                style={{ top: `${top}px`, left: `${left}px` }}
                                            >
                                                <div className="absolute w-3 h-3 rotate-45 border-t border-s border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800" style={{ [isAbove ? 'bottom' : 'top']: '-5px', left: `${arrowOffsetPx}px`, transform: isAbove ? 'rotate(45deg)' : 'rotate(-135deg)' }} />
                                                <div className="relative">
                                                    <div className="flex items-center gap-2 space-x-reverse mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                                        {modalItemsTooltip.direction === 'send' ? (
                                                            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                        ) : (
                                                            <Package className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                                        )}
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100 font-cairo text-sm">
                                                            {modalItemsTooltip.direction === 'send' ? 'عناصر الإرسال' : 'عناصر الاستلام'}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {Array.isArray(modalItemsTooltip.items) ? modalItemsTooltip.items
                                                            .filter(item => item && typeof item === 'object' && !Array.isArray(item))
                                                            .map((item, index) => {
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

                                    {/* Empty State - No Service Tickets */}
                                    {activeTab === 'services' && !hasServices && !loadingCustomer && (
                                        <div className="flex flex-col items-center justify-center py-12 px-4">
                                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mb-3">
                                                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-cairo text-center">
                                                لا توجد تذاكر خدمة متاحة
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Ticket Details (55%) - aligned with left panel padding */}
                <div className="flex-1 lg:flex-[0_0_55%] flex flex-col min-h-0 overflow-hidden border-l-0 lg:border-l border-t lg:border-t-0 border-gray-200 dark:border-gray-700 pt-2 lg:pt-0 pl-0 lg:pl-4">
                    <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col space-y-2 sm:space-y-3 pt-0 pb-4 sm:pb-6 bg-gray-50 dark:bg-gray-800 rounded-lg">

                        {/* Tracking Information - Always Visible - Single Horizontal Line */}
                        {(ticket.original_tracking || ticket.new_tracking_send || ticket.new_tracking_receive) && (
                            <div className="flex-shrink-0">
                                <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-auto scrollbar-hide py-1.5 sm:py-2 min-h-0">
                                    {/* Original Tracking Chip */}
                                    {ticket.original_tracking && (() => {
                                        const bostaLink = getBostaLink(ticket.original_tracking);
                                        const ChipContent = (
                                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-1.5 flex-shrink-0 whitespace-nowrap rounded-lg border border-transparent">
                                                <PackageCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-red-600 dark:text-brand-red-400 flex-shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <div className="text-[10px] sm:text-xs font-semibold text-brand-red-700 dark:text-brand-red-300 font-cairo leading-tight">
                                                        الإرسال الأصلي
                                                    </div>
                                                    <div className="text-xs sm:text-sm font-bold text-brand-red-800 dark:text-brand-red-200 font-cairo font-mono truncate flex items-center gap-1">
                                                        <span>{ticket.original_tracking}</span>
                                                        {bostaLink && (
                                                            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-brand-red-600 dark:text-brand-red-400" />
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(ticket.original_tracking);
                                                        setCopiedTracking(ticket.original_tracking);
                                                        setTimeout(() => setCopiedTracking(null), 2000);
                                                    }}
                                                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center transition-colors flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                    title="نسخ"
                                                >
                                                    {copiedTracking === ticket.original_tracking ? (
                                                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-green-600 dark:text-accent-green-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-red-600 dark:text-brand-red-400 hover:text-brand-red-700 dark:hover:text-brand-red-300" />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                        return (
                                            <>
                                                {bostaLink ? (
                                                    <a
                                                        href={bostaLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {ChipContent}
                                                    </a>
                                                ) : (
                                                    <div className="flex-shrink-0">
                                                        {ChipContent}
                                                    </div>
                                                )}
                                                {(ticket.new_tracking_send || ticket.new_tracking_receive) && (
                                                    <span className="text-gray-300 dark:text-gray-600 mx-0.5 sm:mx-1 flex-shrink-0 text-xs">|</span>
                                                )}
                                            </>
                                        );
                                    })()}

                                    {/* Send Tracking Chip */}
                                    {ticket.new_tracking_send && (() => {
                                        const bostaLink = getBostaLink(ticket.new_tracking_send);
                                        const ChipContent = (
                                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-1.5 flex-shrink-0 whitespace-nowrap rounded-lg border border-transparent">
                                                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-blue-500 dark:text-brand-blue-400 flex-shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <div className="text-[10px] sm:text-xs font-semibold text-brand-blue-600 dark:text-brand-blue-400 font-cairo leading-tight">
                                                        الإرسال
                                                    </div>
                                                    <div className="text-xs sm:text-sm font-bold text-brand-blue-700 dark:text-brand-blue-300 font-cairo font-mono truncate flex items-center gap-1">
                                                        <span>{ticket.new_tracking_send}</span>
                                                        {bostaLink && (
                                                            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-brand-blue-400 dark:text-brand-blue-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(ticket.new_tracking_send);
                                                        setCopiedTracking(ticket.new_tracking_send);
                                                        setTimeout(() => setCopiedTracking(null), 2000);
                                                    }}
                                                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center transition-colors flex-shrink-0 hover:bg-brand-blue-100/50 dark:hover:bg-brand-blue-800/30 rounded"
                                                    title="نسخ"
                                                >
                                                    {copiedTracking === ticket.new_tracking_send ? (
                                                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-green-600 dark:text-accent-green-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-blue-400 dark:text-brand-blue-500 hover:text-brand-blue-600 dark:hover:text-brand-blue-300" />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                        return (
                                            <>
                                                {bostaLink ? (
                                                    <a
                                                        href={bostaLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {ChipContent}
                                                    </a>
                                                ) : (
                                                    <div className="flex-shrink-0">
                                                        {ChipContent}
                                                    </div>
                                                )}
                                                {ticket.new_tracking_receive && (
                                                    <span className="text-gray-300 dark:text-gray-600 mx-0.5 sm:mx-1 flex-shrink-0 text-xs">|</span>
                                                )}
                                            </>
                                        );
                                    })()}

                                    {/* Receive Tracking Chip */}
                                    {ticket.new_tracking_receive && (() => {
                                        const bostaLink = getBostaLink(ticket.new_tracking_receive);
                                        const ChipContent = (
                                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-1.5 flex-shrink-0 whitespace-nowrap rounded-lg border border-transparent">
                                                <PackageCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-green-500 dark:text-accent-green-400 flex-shrink-0" />
                                                <div className="flex flex-col min-w-0">
                                                    <div className="text-[10px] sm:text-xs font-semibold text-accent-green-600 dark:text-accent-green-400 font-cairo leading-tight">
                                                        الاستلام
                                                    </div>
                                                    <div className="text-xs sm:text-sm font-bold text-accent-green-700 dark:text-accent-green-300 font-cairo font-mono truncate flex items-center gap-1">
                                                        <span>{ticket.new_tracking_receive}</span>
                                                        {bostaLink && (
                                                            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-accent-green-400 dark:text-accent-green-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(ticket.new_tracking_receive);
                                                        setCopiedTracking(ticket.new_tracking_receive);
                                                        setTimeout(() => setCopiedTracking(null), 2000);
                                                    }}
                                                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center transition-colors flex-shrink-0 hover:bg-accent-green-100/50 dark:hover:bg-accent-green-800/30 rounded"
                                                    title="نسخ"
                                                >
                                                    {copiedTracking === ticket.new_tracking_receive ? (
                                                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-green-600 dark:text-accent-green-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-green-400 dark:text-accent-green-500 hover:text-accent-green-600 dark:hover:text-accent-green-300" />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                        return bostaLink ? (
                                            <a
                                                href={bostaLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {ChipContent}
                                            </a>
                                        ) : (
                                            <div className="flex-shrink-0">
                                                {ChipContent}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Items — CollapsibleItemsList: عرض الكل / تصغير القائمة syncs both columns */}
                        {ticket.items && ticket.items.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-2.5 md:p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="space-y-2" dir="rtl">
                                    <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
                                        {isMaintenanceItemsOrder ? (
                                            <>
                                                <div className="min-w-0 border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20 overflow-hidden">
                                                    <div className="px-2.5 py-2 sm:px-3 sm:py-2 border-b border-green-200 dark:border-green-700">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <RefreshCw className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                                <h5 className="text-xs font-semibold text-green-800 dark:text-green-200 font-cairo">
                                                                    العناصر للاستلام ({receiveItems.length})
                                                                </h5>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <CollapsibleItemsList
                                                        compact
                                                        syncExpanded={viewerItemListsExpanded}
                                                        onSyncExpandedChange={setViewerItemListsExpanded}
                                                        items={receiveItems}
                                                        tone="green"
                                                        empty={
                                                            <div className="py-3 text-center text-[11px] text-gray-500 dark:text-gray-400">
                                                                <Package className="mx-auto mb-0.5 h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                                                                لا توجد عناصر للاستلام
                                                            </div>
                                                        }
                                                        renderItem={(item, index) => (
                                                            <SessionItemCardReadonly
                                                                key={`vr-${item?.id ?? item?.item_id ?? item?.product_id ?? index}`}
                                                                role="receive"
                                                                item={item}
                                                                sendItems={sendItems}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                                <div className="min-w-0 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
                                                    <div className="px-2.5 py-2 sm:px-3 sm:py-2 border-b border-blue-200 dark:border-blue-700">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                                <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 font-cairo">
                                                                    العناصر للإرسال ({sendItems.length})
                                                                </h5>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <CollapsibleItemsList
                                                        compact
                                                        syncExpanded={viewerItemListsExpanded}
                                                        onSyncExpandedChange={setViewerItemListsExpanded}
                                                        items={sendItems}
                                                        tone="blue"
                                                        empty={
                                                            <div className="py-3 text-center text-[11px] text-gray-500 dark:text-gray-400">
                                                                <Package className="mx-auto mb-0.5 h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                                                                لا توجد عناصر للإرسال
                                                            </div>
                                                        }
                                                        renderItem={(item, index) => (
                                                            <SessionItemCardReadonly
                                                                key={`vs-${item?.id ?? item?.item_id ?? item?.product_id ?? index}`}
                                                                role="send"
                                                                item={item}
                                                                receiveItems={receiveItems}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="min-w-0 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
                                                    <div className="px-2.5 py-2 sm:px-3 sm:py-2 border-b border-blue-200 dark:border-blue-700">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                                <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 font-cairo">
                                                                    العناصر للإرسال ({sendItems.length})
                                                                </h5>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <CollapsibleItemsList
                                                        compact
                                                        syncExpanded={viewerItemListsExpanded}
                                                        onSyncExpandedChange={setViewerItemListsExpanded}
                                                        items={sendItems}
                                                        tone="blue"
                                                        empty={
                                                            <div className="py-3 text-center text-[11px] text-gray-500 dark:text-gray-400">
                                                                <Package className="mx-auto mb-0.5 h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                                                                لا توجد عناصر للإرسال
                                                            </div>
                                                        }
                                                        renderItem={(item, index) => (
                                                            <SessionItemCardReadonly
                                                                key={`vs-${item?.id ?? item?.item_id ?? item?.product_id ?? index}`}
                                                                role="send"
                                                                item={item}
                                                                receiveItems={receiveItems}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                                <div className="min-w-0 border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20 overflow-hidden">
                                                    <div className="px-2.5 py-2 sm:px-3 sm:py-2 border-b border-green-200 dark:border-green-700">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <RefreshCw className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                                <h5 className="text-xs font-semibold text-green-800 dark:text-green-200 font-cairo">
                                                                    العناصر للاستلام ({receiveItems.length})
                                                                </h5>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <CollapsibleItemsList
                                                        compact
                                                        syncExpanded={viewerItemListsExpanded}
                                                        onSyncExpandedChange={setViewerItemListsExpanded}
                                                        items={receiveItems}
                                                        tone="green"
                                                        empty={
                                                            <div className="py-3 text-center text-[11px] text-gray-500 dark:text-gray-400">
                                                                <Package className="mx-auto mb-0.5 h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                                                                لا توجد عناصر للاستلام
                                                            </div>
                                                        }
                                                        renderItem={(item, index) => (
                                                            <SessionItemCardReadonly
                                                                key={`vr-${item?.id ?? item?.item_id ?? item?.product_id ?? index}`}
                                                                role="receive"
                                                                item={item}
                                                                sendItems={sendItems}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottom Row - Bosta Data - Professional Grid */}
                        {ticket.bosta_data && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Bosta Data - Professional */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo mb-3">
                                        بيانات بوسطة
                                    </h3>
                                    <div className="space-y-2">
                                        {ticket.bosta_data.package && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-cairo">
                                                        وصف الطرد
                                                    </label>
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-cairo">
                                                        {ticket.bosta_data.package.description}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-cairo">
                                                        نوع الطرد
                                                    </label>
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 font-cairo">
                                                        {ticket.bosta_data.package.type}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {ticket.bosta_data.status && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 font-cairo">
                                                    حالة التأكيد
                                                </label>
                                                <div className={`px-3 py-2 rounded-lg border text-sm font-semibold font-cairo ${ticket.bosta_data.status.confirmed
                                                    ? 'bg-accent-green-50 dark:bg-accent-green-900/20 text-accent-green-700 dark:text-accent-green-300 border-accent-green-300 dark:border-accent-green-600'
                                                    : 'bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-700 dark:text-brand-red-300 border-brand-red-300 dark:border-brand-red-600'
                                                    }`}>
                                                    {ticket.bosta_data.status.confirmed ? '✅ مؤكد' : '❌ غير مؤكد'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes - Always visible; placeholder when empty */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 md:p-4 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-blue-600 dark:text-brand-blue-400 flex-shrink-0" />
                                <span className="whitespace-nowrap">الملاحظات</span>
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg min-h-[5rem] max-h-[150px] overflow-y-auto scrollbar-small">
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-cairo leading-relaxed whitespace-pre-line">
                                    {getSafeNotesDisplay(ticket.notes) || <span className="text-gray-400 dark:text-gray-500 italic">لا توجد ملاحظات</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Compact Design with Cost and Date */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 pt-2 pb-2 sm:pt-2.5 sm:pb-2.5 px-3 sm:px-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                {/* Cost Display - Start */}
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-cairo whitespace-nowrap">
                            التكلفة:
                        </span>
                        <SessionStyleMoneyBadge value={ticket.cost_adjustment} size="sm" />
                    </div>
                </div>

                {/* Buttons - End (RTL Layout) */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0" dir="rtl">
                    {/* Print Button */}
                    {(ticket?.service_type === 'replacement' ||
                        ticket?.service_type === 'sell' ||
                        ticket?.status === "CONFIRMED" ||
                        (ticket?.available_actions &&
                            Array.isArray(ticket.available_actions) &&
                            ticket.available_actions.includes('scan_outbound'))) && (
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors duration-200 font-cairo font-bold shadow-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                                data-testid="service-modal-viewer-print-button"
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span className="hidden sm:inline">طباعة</span>
                            </button>
                        )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-cairo font-semibold whitespace-nowrap"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </ServiceModalWrapper >
    );
};

const ticketShape = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ticket_number: PropTypes.string,
    phone: PropTypes.string,
    customer_name: PropTypes.string,
    customer: PropTypes.object,
    customer_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    governorate: PropTypes.string,
    city: PropTypes.string,
    customer_address: PropTypes.string,
    service_type: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.object),
    available_actions: PropTypes.arrayOf(PropTypes.string),
    new_tracking_send: PropTypes.string,
    new_tracking_receive: PropTypes.string,
    original_tracking: PropTypes.string,
    bosta_orders: PropTypes.array,
    related_tickets: PropTypes.array,
    related_service_tickets: PropTypes.array,
    created_at: PropTypes.string,
    notes: PropTypes.string,
    sec_phone: PropTypes.string,
    customer_phone: PropTypes.string
};

ServiceModalViewer.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    ticket: PropTypes.shape(ticketShape)
};

export default ServiceModalViewer;
