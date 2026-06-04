import { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Package } from 'lucide-react';
import GlobalNavigation from '../components/layout/GlobalNavigation';
import ServiceActionCard from '../components/service/ServiceActionCard';
import HubScanModal from '../components/hub/HubScanModal';
import ReplacementPreparationItemsModal from '../components/modals/ReplacementPreparationItemsModal';
import { listTickets, executeTicketAction, getTicket, getTicketCounts } from '../api/ticketsAPI';
import { scanTracking } from '../api/hubAPI';
import CompactFilterBar from '../components/filters/CompactFilterBar';
import { buildTicketListParams } from '../utils/service/ticketParams';
import {
    getTabColorClasses,
    getTabBgClasses,
    getTabBadgeClasses,
    getSubTabColorClasses,
    getTabBorderStyle
} from '../utils/ui/tabs';
import {
    getDeviceInfo,
    getOptimizedCameraConstraints,
    getOptimizedScannerSettings,
    recordScanPerformance,
    startPerformanceMonitoring,
    optimizeMemoryUsage
} from '../utils/core/performance';
import { scanSuccessFeedback, scanErrorFeedback, hapticFeedback } from '../utils/hardware/feedback';
import logger from '../utils/core/logger';
import { invalidateServiceDataCaches } from '../utils/core/request';
import { normalizeHubLookupInput } from '../utils/hub/normalizeHubLookupInput';

/** Toast id while hub scan HTTP request is in flight (before ticket id is known). */
const HUB_SCAN_PROGRESS_TOAST_ID = 'hub-scan-in-flight';

/** Match hub list items by numeric service / ticket id (handles string vs number from API). */
function ticketMatchesId(t, rawId) {
    const id = rawId != null ? Number(rawId) : NaN;
    if (Number.isNaN(id)) return false;
    return (
        t.id === id ||
        t._id === id ||
        t.ticket_id === id ||
        String(t.id) === String(id) ||
        String(t.ticket_id) === String(id)
    );
}

const HubPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Refs for QR and Barcode scanner
    const videoRef = useRef(null);
    const qrScannerRef = useRef(null);
    const barcodeScannerRef = useRef(null);
    const scannerInputRef = useRef(null);

    // Sidebar state for responsive behavior
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Responsive sidebar state
        const saved = localStorage.getItem('hvar-hub-sidebar-collapsed');
        return saved === 'true' || window.innerWidth < 1024; // Collapse on smaller screens
    });

    // Mobile sidebar state
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Sidebar ref for focus management
    const sidebarRef = useRef(null);

    // Mock scanner state (no real functionality)
    const [scannerState, setScannerState] = useState({
        showCamera: false,
        isScanning: false,
        isProcessing: false,
        isInitializing: false,
        hasPermission: false,
        error: null,
        deviceInfo: null,
        scanMode: 'auto'
    });

    const [manualInput, setManualInput] = useState('');
    const [isManualSubmitting, setIsManualSubmitting] = useState(false);
    const [scannerBuffer, setScannerBuffer] = useState('');
    const [isScannerInput, setIsScannerInput] = useState(false);

    // Scanning state
    const [scannedTicket, setScannedTicket] = useState(null);
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanActionType, setScanActionType] = useState(null); // 'receive' or 'send'
    const [scannedTrackingNumber, setScannedTrackingNumber] = useState('');
    const [highlightedTicketId, setHighlightedTicketId] = useState(null);
    const processingServiceIdRef = useRef(false);
    /** Full ticket row to pin into the current list when API page does not include it (scan + deep link). */
    const pendingHighlightTicketRef = useRef(null);
    /** Scan path: show finalize toast only in auto mode (modal modes already toast). */
    const pendingScanHighlightIsAutoRef = useRef(false);
    /** Merge into the next hub list response so the scanned row survives highlight clearing pending ref. */
    const pinnedScanTicketRef = useRef(null);
    /** Scan switched tab/subtab — list fetch will run; keep pin until fetchHubData/filter fetch completes. */
    const expectListFetchAfterScanRef = useRef(false);
    const scannerBusyRef = useRef(false);
    const handleQRDetectedRef = useRef(null);
    const handleScanTrackingRef = useRef(null);

    // Tickets data state
    const [tickets, setTickets] = useState([]);
    const [ticketCounts, setTicketCounts] = useState({
        replacement: {},
        maintenance: {},
        return: {},
        sell: {}
    }); // Store optimized counts from API
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        has_more: false,
        offset: 0,
        limit: 100,
        total: 0
    });

    // Active tab state - service-based tabs
    const [activeTab, setActiveTab] = useState('replacement');
    const [activeSubTab, setActiveSubTab] = useState('in-preparation');

    // Preparation items modal state
    const [showPreparationModal, setShowPreparationModal] = useState(false);

    // Filter state
    const [filters, setFilters] = useState({});

    // Global search state (across all services)
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(0);
    const [isSearchingGlobally, setIsSearchingGlobally] = useState(false);

    // Track previous tab/subtab to detect user-initiated changes
    const previousTabRef = useRef(activeTab);
    const previousSubTabRef = useRef(activeSubTab);
    const isNavigatingFromSearchRef = useRef(false);

    // Enhanced tab change handlers that auto-clear search
    const handleTabChange = useCallback((newTab) => {
        // Don't clear if navigating from search result
        if (!isNavigatingFromSearchRef.current && newTab !== activeTab) {
            // Clear search with smooth transition
            if (filters.search || globalSearchResults.length > 0) {
                setFilters(prev => {
                    const updated = { ...prev };
                    delete updated.search;
                    return updated;
                });
                setGlobalSearchResults([]);
                setCurrentSearchResultIndex(0);
                setHighlightedTicketId(null);
            }
        }
        setActiveTab(newTab);
    }, [activeTab, filters.search, globalSearchResults.length]);

    // Enhanced sub-tab change handler that auto-clear search
    const handleSubTabChange = useCallback((newSubTab) => {
        // Don't clear if navigating from search result
        if (!isNavigatingFromSearchRef.current && newSubTab !== activeSubTab) {
            // Clear search with smooth transition
            if (filters.search || globalSearchResults.length > 0) {
                setFilters(prev => {
                    const updated = { ...prev };
                    delete updated.search;
                    return updated;
                });
                setGlobalSearchResults([]);
                setCurrentSearchResultIndex(0);
                setHighlightedTicketId(null);
            }
        }
        setActiveSubTab(newSubTab);
    }, [activeSubTab, filters.search, globalSearchResults.length]);

    // AbortController for request cancellation
    const abortControllerRef = useRef(null);

    // Build request params for tickets API based on tab/subTab and filters
    const buildTicketParams = useCallback((tab, subTab, offset = 0, appliedFilters = {}) => {
        const params = buildTicketListParams(tab, subTab, { limit: 50, offset });

        if (appliedFilters.search) {
            params.search = appliedFilters.search;
        }

        if (appliedFilters.createdDate?.start) params.start_date = appliedFilters.createdDate.start;
        if (appliedFilters.createdDate?.end) params.end_date = appliedFilters.createdDate.end;
        if (appliedFilters.confirmedDate?.start) params.start_date = appliedFilters.confirmedDate.start;
        if (appliedFilters.confirmedDate?.end) params.end_date = appliedFilters.confirmedDate.end;
        if (appliedFilters.sentDate?.start) params.start_date = appliedFilters.sentDate.start;
        if (appliedFilters.sentDate?.end) params.end_date = appliedFilters.sentDate.end;
        if (appliedFilters.completedDate?.start) params.start_date = appliedFilters.completedDate.start;
        if (appliedFilters.completedDate?.end) params.end_date = appliedFilters.completedDate.end;
        if (appliedFilters.cancelledDate?.start) params.start_date = appliedFilters.cancelledDate.start;
        if (appliedFilters.cancelledDate?.end) params.end_date = appliedFilters.cancelledDate.end;
        if (appliedFilters.receivedDate?.start) params.start_date = appliedFilters.receivedDate.start;
        if (appliedFilters.receivedDate?.end) params.end_date = appliedFilters.receivedDate.end;
        if (appliedFilters.readyDate?.start) params.start_date = appliedFilters.readyDate.start;
        if (appliedFilters.readyDate?.end) params.end_date = appliedFilters.readyDate.end;
        if (appliedFilters.returnedDate?.start) params.start_date = appliedFilters.returnedDate.start;
        if (appliedFilters.returnedDate?.end) params.end_date = appliedFilters.returnedDate.end;
        if (appliedFilters.startedDate?.start) params.start_date = appliedFilters.startedDate.start;
        if (appliedFilters.startedDate?.end) params.end_date = appliedFilters.startedDate.end;
        if (appliedFilters.maintenanceStartDate?.start) params.start_date = appliedFilters.maintenanceStartDate.start;
        if (appliedFilters.maintenanceStartDate?.end) params.end_date = appliedFilters.maintenanceStartDate.end;
        if (appliedFilters.maintenanceCompletedDate?.start) params.start_date = appliedFilters.maintenanceCompletedDate.start;
        if (appliedFilters.maintenanceCompletedDate?.end) params.end_date = appliedFilters.maintenanceCompletedDate.end;
        if (appliedFilters.inspectionStartDate?.start) params.start_date = appliedFilters.inspectionStartDate.start;
        if (appliedFilters.inspectionStartDate?.end) params.end_date = appliedFilters.inspectionStartDate.end;

        if (appliedFilters.trackingNumber) {
            params.search = params.search ? `${params.search} ${appliedFilters.trackingNumber}` : appliedFilters.trackingNumber;
        }

        return params;
    }, []);

    // Unified function to fetch tickets and counts together
    const fetchHubData = useCallback(async (tab, subTab, loadMore = false, signal = null) => {
        let requestAborted = false;
        try {
            if (!loadMore) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            // Calculate offset for load more
            let currentOffset = 0;
            if (loadMore) {
                setPagination(prev => {
                    currentOffset = prev.offset + prev.limit;
                    return prev;
                });
            }

            // Build params with filters
            const params = buildTicketParams(tab, subTab, currentOffset, filters);

            // Fetch tickets and counts in parallel
            const [ticketsResponse, countsResponse] = await Promise.all([
                listTickets(params, { signal }),
                getTicketCounts(false, signal)
            ]);

            // Handle tickets response — pin target ticket if the filtered page omits it (common for large queues).
            let ticketsData = ticketsResponse.data || [];
            const paginationData = ticketsResponse.pagination || {};
            if (!loadMore) {
                const mergeRow = pinnedScanTicketRef.current || pendingHighlightTicketRef.current;
                if (mergeRow) {
                    const pid = mergeRow.id ?? mergeRow.ticket_id;
                    if (pid != null && !ticketsData.some((t) => ticketMatchesId(t, pid))) {
                        ticketsData = [mergeRow, ...ticketsData];
                    }
                }
            }

            if (loadMore) {
                setTickets(prev => [...prev, ...ticketsData]);
            } else {
                setTickets(ticketsData);
            }

            // Update pagination
            setPagination(prev => ({
                has_more: paginationData.has_more || false,
                offset: paginationData.offset !== undefined ? paginationData.offset : currentOffset,
                limit: paginationData.limit || 50,
                total: paginationData.total || 0
            }));

            // Update counts
            setTicketCounts(countsResponse || {
                replacement: {},
                maintenance: {},
                return: {},
                sell: {}
            });

            setError(null);
        } catch (err) {
            // Ignore cancellation errors (do not clear scan pin — a newer fetch may still need it)
            if (err.name === 'CanceledError' || err.name === 'AbortError') {
                requestAborted = true;
                return;
            }
            logger.error('Error fetching hub data:', err);
            setError('فشل تحميل البيانات');
            if (!loadMore) {
                setTickets([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
            if (!loadMore && !requestAborted) {
                expectListFetchAfterScanRef.current = false;
                pinnedScanTicketRef.current = null;
            }
        }
    }, [buildTicketParams, filters]);

    // Load more tickets for current tab/sub-tab
    const handleLoadMore = useCallback(async () => {
        if (abortControllerRef.current) {
            const signal = abortControllerRef.current.signal;
            await fetchHubData(activeTab, activeSubTab, true, signal);
        }
    }, [activeTab, activeSubTab, fetchHubData]);

    // Unified effect to fetch data when tab/sub-tab changes
    useEffect(() => {
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Fetch data
        fetchHubData(activeTab, activeSubTab, false, controller.signal);

        // Cleanup: abort request if component unmounts or dependencies change
        return () => {
            controller.abort();
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
        };
    }, [activeTab, activeSubTab, fetchHubData]);

    // Helper function to determine the correct sub-tab based on service type, status, and available actions
    const getSubTabForStatus = useCallback((serviceType, status, availableActions = []) => {
        const statusUpper = status?.toUpperCase();
        const actions = Array.isArray(availableActions) ? availableActions : [];

        if (serviceType === 'replacement') {
            if (statusUpper === 'PENDING') return 'in-preparation';
            if (statusUpper === 'CONFIRMED') return 'in-preparation';
            if (statusUpper === 'IN_PROCESS') {
                // Check available_actions to determine correct sub-tab
                if (actions.includes('ready_for_dispatch')) return 'preparing';
                if (actions.includes('start_preparation')) return 'in-preparation';
                return 'preparing'; // Default for IN_PROCESS
            }
            if (statusUpper === 'READY_FOR_DISPATCH') return 'ready-to-ship';
            if (statusUpper === 'SENT') return 'sent';
            if (statusUpper === 'RETURNED') return 'validate-returns';
            if (statusUpper === 'COMPLETED') return 'completed';
            if (statusUpper === 'CANCELLED') return 'cancelled';
        } else if (serviceType === 'maintenance') {
            if (statusUpper === 'PENDING') return 'confirmed';
            if (statusUpper === 'CONFIRMED') return 'confirmed';
            if (statusUpper === 'IN_PROCESS') {
                // Check available_actions to determine correct sub-tab
                if (actions.includes('mark_ready')) return 'completion-ready';
                if (actions.includes('complete_maintenance')) return 'under-maintenance';
                if (actions.includes('start_maintenance')) return 'received';
                return 'received'; // Default for IN_PROCESS
            }
            if (statusUpper === 'READY_FOR_DISPATCH') return 'ready-to-ship';
            if (statusUpper === 'SENT') return 'sent';
            if (statusUpper === 'COMPLETED') return 'completed';
            if (statusUpper === 'CANCELLED') return 'cancelled';
        } else if (serviceType === 'return') {
            if (statusUpper === 'PENDING') return 'receiving';
            if (statusUpper === 'CONFIRMED') return 'receiving';
            if (statusUpper === 'IN_PROCESS') return 'inspection';
            if (statusUpper === 'COMPLETED') return 'completed';
            if (statusUpper === 'CANCELLED') return 'cancelled';
        } else if (serviceType === 'sell') {
            if (statusUpper === 'PENDING') return 'new';
            if (statusUpper === 'CONFIRMED') return 'new';
            if (statusUpper === 'IN_PROCESS') {
                // Check available_actions to determine correct sub-tab
                if (actions.includes('ready_for_dispatch')) return 'preparing';
                if (actions.includes('start_preparation')) return 'new';
                return 'preparing'; // Default for IN_PROCESS
            }
            if (statusUpper === 'READY_FOR_DISPATCH') return 'ready-to-ship';
            if (statusUpper === 'SENT') return 'sent';
            if (statusUpper === 'COMPLETED') return 'completed';
            if (statusUpper === 'CANCELLED') return 'cancelled';
        }
        return 'in-preparation'; // Default fallback
    }, []);

    // Navigate to a specific search result
    const navigateToSearchResult = useCallback((ticket, index) => {
        if (!ticket) return;

        const ticketServiceType = ticket.service_type || ticket.serviceType;
        const ticketStatus = ticket.status;
        const availableActions = ticket.available_actions || [];

        // Determine correct tab and sub-tab
        const tabMap = {
            'replacement': 'replacement',
            'maintenance': 'maintenance',
            'return': 'return',
            'sell': 'sell'
        };

        const targetTab = tabMap[ticketServiceType] || 'replacement';
        const targetSubTab = getSubTabForStatus(ticketServiceType, ticketStatus, availableActions);

        // Set highlighted ticket ID
        const ticketId = ticket.id || ticket.ticket_id;
        setHighlightedTicketId(ticketId);
        setCurrentSearchResultIndex(index);

        // Switch tabs if needed
        if (activeTab !== targetTab || activeSubTab !== targetSubTab) {
            // Mark that we're navigating from search (don't clear search)
            isNavigatingFromSearchRef.current = true;
            setActiveTab(targetTab);
            setActiveSubTab(targetSubTab);
            
            // Reset flag after tab switch completes
            setTimeout(() => {
                isNavigatingFromSearchRef.current = false;
            }, 100);
            
            // Fetch tickets for the new tab, but keep search results
            // The search results will be displayed via mappedCards
        }

        // Scroll to the ticket after a short delay to allow tab switch and render
        setTimeout(() => {
            const element = document.getElementById(`ticket-${ticketId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }
        }, 400);
    }, [activeTab, activeSubTab, getSubTabForStatus]);

    // Navigate to next/previous search result
    const navigateSearchResult = useCallback((direction) => {
        if (globalSearchResults.length === 0) return;

        let newIndex;
        if (direction === 'next') {
            newIndex = (currentSearchResultIndex + 1) % globalSearchResults.length;
        } else {
            newIndex = currentSearchResultIndex === 0 
                ? globalSearchResults.length - 1 
                : currentSearchResultIndex - 1;
        }

        navigateToSearchResult(globalSearchResults[newIndex], newIndex);
    }, [globalSearchResults, currentSearchResultIndex, navigateToSearchResult]);

    // Global search across all services
    const performGlobalSearch = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.trim() === '') {
            setGlobalSearchResults([]);
            setCurrentSearchResultIndex(0);
            setIsSearchingGlobally(false);
            return;
        }

        setIsSearchingGlobally(true);
        try {
            // Search across all service types
            const serviceTypes = ['replacement', 'maintenance', 'return', 'sell'];
            const searchPromises = serviceTypes.map(serviceType => 
                listTickets({ 
                    service_type: serviceType,
                    search: searchQuery.trim(),
                    limit: 100 // Get more results for global search
                })
            );

            const results = await Promise.all(searchPromises);
            
            // Flatten and combine all results
            const allResults = results.flatMap((response, index) => {
                const tickets = response.data || [];
                return tickets.map(ticket => ({
                    ...ticket,
                    serviceType: serviceTypes[index]
                }));
            });

            setGlobalSearchResults(allResults);
            setCurrentSearchResultIndex(0);

            // If we have results, navigate to the first one
            if (allResults.length > 0) {
                navigateToSearchResult(allResults[0], 0);
            } else {
                toast.info('لم يتم العثور على نتائج', { duration: 2000 });
            }
        } catch (error) {
            logger.error('Error performing global search:', error);
            toast.error('حدث خطأ أثناء البحث');
            setGlobalSearchResults([]);
        } finally {
            setIsSearchingGlobally(false);
        }
    }, [navigateToSearchResult]);

    // Auto-apply filters when they change (debounced for search)
    // Skip initial load - let fetchHubData handle it
    const filtersRef = useRef(filters);
    const isInitialLoad = useRef(true);
    
    useEffect(() => {
        filtersRef.current = filters;
        
        // Skip on initial mount
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        // If search filter exists, perform global search
        if (filters.search && filters.search.trim() !== '') {
            const timer = setTimeout(() => {
                performGlobalSearch(filters.search);
            }, 500); // Debounce search
            return () => clearTimeout(timer);
        } else {
            // Clear global search results when search is cleared
            setGlobalSearchResults([]);
            setCurrentSearchResultIndex(0);
        }

        // Skip if filters are empty (let fetchHubData handle it)
        if (Object.keys(filters).length === 0) {
            // Reset to default fetch
            fetchHubData(activeTab, activeSubTab, false, null);
            return;
        }

        // For non-search filters, use regular filtering
        if (!filters.search || filters.search.trim() === '') {
            const timer = setTimeout(() => {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
                const controller = new AbortController();
                abortControllerRef.current = controller;
                
                const params = buildTicketParams(activeTab, activeSubTab, 0, filters);
                setLoading(true);
                listTickets(params, { signal: controller.signal })
                    .then(ticketsResponse => {
                        let ticketsData = ticketsResponse.data || [];
                        const mergeRow = pinnedScanTicketRef.current || pendingHighlightTicketRef.current;
                        if (mergeRow) {
                            const pid = mergeRow.id ?? mergeRow.ticket_id;
                            if (pid != null && !ticketsData.some((t) => ticketMatchesId(t, pid))) {
                                ticketsData = [mergeRow, ...ticketsData];
                            }
                        }
                        const paginationData = ticketsResponse.pagination || {};
                        setTickets(ticketsData);
                        setPagination(prev => ({
                            has_more: paginationData.has_more || false,
                            offset: paginationData.offset !== undefined ? paginationData.offset : 0,
                            limit: paginationData.limit || 50,
                            total: paginationData.total || 0
                        }));
                        setError(null);
                    })
                    .catch(err => {
                        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                            logger.error('Error fetching filtered tickets:', err);
                            setError('فشل تحميل البيانات');
                            setTickets([]);
                        }
                    })
                    .finally(() => {
                        setLoading(false);
                        expectListFetchAfterScanRef.current = false;
                        pinnedScanTicketRef.current = null;
                    });
            }, 0); // Immediate for non-search filters

            return () => clearTimeout(timer);
        }
    }, [filters, activeTab, activeSubTab, buildTicketParams, fetchHubData, performGlobalSearch]);

    // Auto-clear search when user clicks tabs/sub-tabs (creative smooth transition)
    useEffect(() => {
        // Skip on initial mount
        if (previousTabRef.current === activeTab && previousSubTabRef.current === activeSubTab) {
            return;
        }

        // Don't clear if navigating from search result
        if (isNavigatingFromSearchRef.current) {
            previousTabRef.current = activeTab;
            previousSubTabRef.current = activeSubTab;
            return;
        }

        // User-initiated tab/subtab change - clear search
        const tabChanged = previousTabRef.current !== activeTab;
        const subTabChanged = previousSubTabRef.current !== activeSubTab;

        if ((tabChanged || subTabChanged) && (filters.search || globalSearchResults.length > 0)) {
            // Smooth clear with visual feedback
            setFilters(prev => {
                const updated = { ...prev };
                delete updated.search;
                return updated;
            });
            setGlobalSearchResults([]);
            setCurrentSearchResultIndex(0);
            setHighlightedTicketId(null);
        }

        // Update refs
        previousTabRef.current = activeTab;
        previousSubTabRef.current = activeSubTab;
    }, [activeTab, activeSubTab, filters.search, globalSearchResults.length]);

    // Handle service ID from URL parameter
    useEffect(() => {
        const serviceId = searchParams.get('serviceId');
        if (serviceId && !processingServiceIdRef.current) {
            const serviceIdNum = parseInt(serviceId, 10);
            if (isNaN(serviceIdNum)) return;

            processingServiceIdRef.current = true;

            // Fetch the ticket by ID to get its full details
            const fetchAndHighlightTicket = async () => {
                try {
                    logger.log(`🔍 Fetching ticket ${serviceIdNum} for highlighting...`);
                    // Hub highlight: skip Bosta enrichment (faster); list fetch provides fresh row shape when present.
                    const ticketData = await getTicket(serviceIdNum, false, false);
                    logger.log(`📦 Raw ticket data:`, ticketData);

                    // Extract ticket from response - matching scanTracking pattern: result.data.context.ticket
                    // getTicket returns response.data, so we check:
                    // 1. ticketData.context.ticket (like scanTracking)
                    // 2. ticketData.context (if context IS the ticket)
                    // 3. ticketData.data.context.ticket (if wrapped in data)
                    // 4. ticketData.ticket (direct ticket property)
                    // 5. ticketData itself (if it's the ticket)
                    let finalTicket = null;
                    let availableActions = [];

                    if (ticketData?.context?.ticket) {
                        finalTicket = ticketData.context.ticket;
                        availableActions = ticketData.context.available_actions || finalTicket.available_actions || [];
                    } else if (ticketData?.context && (ticketData.context.service_type || ticketData.context.status || ticketData.context.id)) {
                        // Context itself might be the ticket
                        finalTicket = ticketData.context;
                        availableActions = finalTicket.available_actions || [];
                    } else if (ticketData?.data?.context?.ticket) {
                        finalTicket = ticketData.data.context.ticket;
                        availableActions = ticketData.data.context.available_actions || finalTicket.available_actions || [];
                    } else if (ticketData?.data?.context) {
                        finalTicket = ticketData.data.context;
                        availableActions = finalTicket.available_actions || [];
                    } else if (ticketData?.ticket) {
                        finalTicket = ticketData.ticket;
                        availableActions = finalTicket.available_actions || [];
                    } else if (ticketData && (ticketData.service_type || ticketData.status || ticketData.id || ticketData.ticket_id)) {
                        finalTicket = ticketData;
                        availableActions = finalTicket.available_actions || [];
                    }

                    if (!finalTicket) {
                        logger.warn(`Ticket ${serviceIdNum} not found in response:`, ticketData);
                        pendingHighlightTicketRef.current = null;
                        // Dismiss navigation toast if exists
                        toast.dismiss(`nav-${serviceIdNum}`);
                        toast.error(`لم يتم العثور على طلب الخدمة #${serviceIdNum}`);
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('serviceId');
                        setSearchParams(newParams, { replace: true });
                        processingServiceIdRef.current = false;
                        return;
                    }

                    pendingHighlightTicketRef.current = finalTicket;

                    logger.log(`✅ Ticket extracted:`, finalTicket);
                    logger.log(`📋 Ticket ID: ${finalTicket.id || finalTicket.ticket_id}, Service Type: ${finalTicket.service_type}, Status: ${finalTicket.status}`);
                    logger.log(`🔧 Available actions:`, availableActions);

                    // Determine the correct tab and sub-tab based on ticket service_type and status
                    const ticketServiceType = finalTicket.service_type || finalTicket.type;
                    const ticketStatus = finalTicket.status;

                    logger.log(`📍 Service Type: ${ticketServiceType}, Status: ${ticketStatus}`);

                    // Map service type to tab
                    const tabMap = {
                        'replacement': 'replacement',
                        'maintenance': 'maintenance',
                        'return': 'return',
                        'sell': 'sell'
                    };

                    const targetTab = tabMap[ticketServiceType] || 'replacement';
                    const targetSubTab = getSubTabForStatus(ticketServiceType, ticketStatus, availableActions);

                    logger.log(`🎯 Target Tab: ${targetTab}, SubTab: ${targetSubTab}`);
                    logger.log(`📊 Current Tab: ${activeTab}, SubTab: ${activeSubTab}`);

                    // Switch to the correct tab if needed
                    if (activeTab !== targetTab || activeSubTab !== targetSubTab) {
                        logger.log(`🔄 Switching tabs...`);
                        setActiveTab(targetTab);
                        setActiveSubTab(targetSubTab);

                        // Wait for tickets to load after tab switch - use watch effect instead of interval
                        // The watch effect below will handle highlighting when tickets are loaded
                    } else {
                        // Already on the correct tab - let the watch effect handle highlighting
                        logger.log(`✅ Already on correct tab, waiting for tickets to load...`);
                    }
                } catch (error) {
                    logger.error(`❌ Error fetching ticket ${serviceIdNum}:`, error);
                    pendingHighlightTicketRef.current = null;
                    // Dismiss navigation toast if exists
                    toast.dismiss(`nav-${serviceIdNum}`);
                    toast.error(`خطأ في جلب طلب الخدمة #${serviceIdNum}`);

                    // Clear the query parameter even on error
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('serviceId');
                    setSearchParams(newParams, { replace: true });
                    processingServiceIdRef.current = false;
                }
            };

            fetchAndHighlightTicket();
        }
    }, [searchParams, setSearchParams, activeTab, activeSubTab]);

    // Watch for tickets to load when we're waiting to highlight a ticket (single source of truth)
    useEffect(() => {
        const serviceId = searchParams.get('serviceId');
        if (!serviceId || !processingServiceIdRef.current) return;

        const serviceIdNum = parseInt(serviceId, 10);
        if (isNaN(serviceIdNum)) return;

        // Only check if not loading and tickets are available
        if (loading || tickets.length === 0) return;

        // Check if ticket is now in the list and we can highlight it
        const matchingTicket = tickets.find(t => ticketMatchesId(t, serviceIdNum));

        if (matchingTicket && processingServiceIdRef.current) {
            logger.log(`✅ Ticket ${serviceIdNum} found in tickets list, highlighting...`);

            // Check if we need to update sub-tab based on available_actions from the list
            const ticketServiceType = matchingTicket.service_type || matchingTicket.type;
            const ticketStatus = matchingTicket.status;
            const ticketAvailableActions = matchingTicket.available_actions || [];

            if (ticketServiceType && ticketStatus && Array.isArray(ticketAvailableActions)) {
                const correctSubTab = getSubTabForStatus(ticketServiceType, ticketStatus, ticketAvailableActions);
                logger.log(`🔧 Ticket from list - Actions:`, ticketAvailableActions, `Correct SubTab:`, correctSubTab);

                // Only update if we're on the correct tab but wrong sub-tab
                const tabMap = {
                    'replacement': 'replacement',
                    'maintenance': 'maintenance',
                    'return': 'return',
                    'sell': 'sell'
                };
                const correctTab = tabMap[ticketServiceType] || 'replacement';

                if (activeTab === correctTab && activeSubTab !== correctSubTab) {
                    logger.log(`🔄 Updating sub-tab from ${activeSubTab} to ${correctSubTab} based on ticket's available_actions`);
                    setActiveSubTab(correctSubTab);
                }
            }

            setHighlightedTicketId(serviceIdNum);

            // Mark as processed to prevent duplicate processing
            processingServiceIdRef.current = false;
            pendingHighlightTicketRef.current = null;

            // Dismiss navigation toast if exists
            toast.dismiss(`nav-${serviceIdNum}`);
            
            // Show success toast with available actions if they exist
            if (ticketAvailableActions.length > 0) {
                const actionLabelMap = {
                    'confirm': 'تأكيد',
                    'cancel': 'إلغاء',
                    'view': 'عرض',
                    'start_preparation': 'بدء التحضير',
                    'start_maintenance': 'بدء الصيانة',
                    'complete_maintenance': 'إكمال الصيانة',
                    'mark_ready': 'جاهز للإرسال',
                    'ready_for_dispatch': 'جاهز للشحن',
                    'scan_outbound': 'إرسال',
                    'scan_inbound': 'الاستلام',
                    'mark_delivered': 'تأكيد التسليم',
                    'confirm_sent': 'تأكيد التسليم',
                    'validate_items': 'فحص المنتجات',
                    'complete': 'إتمام',
                    'receive': 'الاستلام'
                };
                const arabicActionLabels = ticketAvailableActions
                    .map(actionId => actionLabelMap[actionId] || actionId)
                    .join('، ');
                const availableActionsText = `الإجراءات المتاحة: ${arabicActionLabels}`;
                const ticketNumber = matchingTicket.ticket_number || `#${serviceIdNum}`;
                toast.success(`تم العثور على التذكرة: ${ticketNumber}\n${availableActionsText}`, { duration: 4000 });
            } else {
                toast.success(`تم العثور على طلب الخدمة #${serviceIdNum}`, { duration: 2000 });
            }

            // Scroll so pinned card (now first in grid) sits at top of viewport
            setTimeout(() => {
                const element = document.getElementById(`ticket-${serviceIdNum}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                    logger.log(`📍 Scrolled to ticket ${serviceIdNum}`);
                }
            }, 200);

            // Clear the query parameter after highlighting
            setTimeout(() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('serviceId');
                setSearchParams(newParams, { replace: true });
            }, 1000);
        } else if (!loading && tickets.length > 0 && processingServiceIdRef.current) {
            // Ticket not found after loading completes - timeout after 3 seconds
            const timeoutId = setTimeout(() => {
                if (processingServiceIdRef.current) {
                    logger.error(`❌ Timeout: Could not find ticket ${serviceIdNum} in loaded tickets`);
                    toast.dismiss(`nav-${serviceIdNum}`);
                    toast.error(`لم يتم العثور على التذكرة في القائمة`);
                    processingServiceIdRef.current = false;
                    pendingHighlightTicketRef.current = null;

                    // Clear the query parameter
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('serviceId');
                    setSearchParams(newParams, { replace: true });
                }
            }, 3000);

            return () => clearTimeout(timeoutId);
        }
    }, [tickets, loading, searchParams, setSearchParams, activeTab, activeSubTab, getSubTabForStatus]);

    // Reset processing flag when serviceId is removed from URL
    useEffect(() => {
        if (!searchParams.get('serviceId')) {
            processingServiceIdRef.current = false;
        }
    }, [searchParams]);

    // Scan / inline navigation: highlight as soon as the pinned ticket is in the list (no ?serviceId=).
    // useLayoutEffect: run before paint so highlight + scroll feel instant with optimistic rows.
    useLayoutEffect(() => {
        if (searchParams.get('serviceId')) return;

        const pending = pendingHighlightTicketRef.current;
        if (!pending) return;

        const rawId = pending.id ?? pending.ticket_id;
        if (rawId == null) return;
        const inList = tickets.some((t) => ticketMatchesId(t, rawId));
        if (!inList) {
            if (loading) return;
            return;
        }

        pendingHighlightTicketRef.current = null;
        const sid = Number(rawId);
        setHighlightedTicketId(sid);
        toast.dismiss(HUB_SCAN_PROGRESS_TOAST_ID);
        toast.dismiss(`nav-${sid}`);
        if (pendingScanHighlightIsAutoRef.current) {
            pendingScanHighlightIsAutoRef.current = false;
            const ticketNo = pending.ticket_number || `#${sid}`;
            toast.success(`تم العثور على التذكرة: ${ticketNo}`, { duration: 2200 });
        }

        requestAnimationFrame(() => {
            const element = document.getElementById(`ticket-${sid}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }
        });

        if (!loading && !expectListFetchAfterScanRef.current) {
            pinnedScanTicketRef.current = null;
        }
    }, [tickets, loading, searchParams]);


    // Enhanced QR and Barcode Scanner initialization with comprehensive error handling
    // Supports both QR codes and Code 128 barcodes
    const initializeQRScanner = useCallback(async () => {
        if (!videoRef.current) {
            setScannerState((prev) => ({ ...prev, isInitializing: false }));
            return;
        }

        setScannerState(prev => ({ ...prev, isInitializing: true, error: null }));

        try {
            if (typeof window !== 'undefined' && window.HVARInitializeCamera) {
                window.HVARInitializeCamera();
            }

            startPerformanceMonitoring();

            const deviceInfo = getDeviceInfo();
            const optimizedSettings = getOptimizedScannerSettings();
            const optimizedConstraints = getOptimizedCameraConstraints('environment');

            // Single getUserMedia path: html5-qrcode / qr-scanner (no pre-flight — avoids double prompt + leaked stream)

            // Try to use html5-qrcode which supports both QR codes and Code 128 barcodes
            // If not available, fall back to qr-scanner (QR codes only)
            try {
                // Ensure container has an ID for html5-qrcode
                const containerId = videoRef.current.id || `qr-reader-${Date.now()}`;
                if (!videoRef.current.id) {
                    videoRef.current.id = containerId;
                }

                const html5QrcodeModule = await import('html5-qrcode');
                const { Html5Qrcode, Html5QrcodeSupportedFormats } = html5QrcodeModule;

                // Create barcode scanner that supports both QR codes and Code 128
                // html5-qrcode creates its own video element inside the container
                barcodeScannerRef.current = new Html5Qrcode(containerId);

                // Configure to scan both QR codes and Code 128 barcodes
                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E
                    ]
                };

                // Start scanning with camera
                await barcodeScannerRef.current.start(
                    { facingMode: 'environment' },
                    config,
                    (decodedText) => {
                        if (scannerBusyRef.current) return;
                        recordScanPerformance();
                        const run = handleQRDetectedRef.current;
                        if (run) void run(decodedText);
                    },
                    (errorMessage) => {
                        // Ignore decode errors, just log them
                        logger.debug('QR/Barcode decode error:', errorMessage);
                    }
                );
            } catch (html5QrcodeError) {
                // Fallback to qr-scanner if html5-qrcode is not available
                logger.warn('html5-qrcode not available, falling back to qr-scanner (QR codes only):', html5QrcodeError);

                // For qr-scanner, we need a video element
                // Find or create video element in the container
                let videoElement = videoRef.current.querySelector('video');
                if (!videoElement) {
                    videoElement = document.createElement('video');
                    videoElement.className = 'w-full h-full object-cover';
                    videoElement.setAttribute('autoplay', '');
                    videoElement.setAttribute('playsinline', '');
                    videoElement.setAttribute('muted', '');
                    videoElement.setAttribute('aria-label', 'عارض الكاميرا للمسح الضوئي');
                    videoRef.current.appendChild(videoElement);
                }
                // Show video element for qr-scanner
                videoElement.style.display = 'block';

                const { default: QrScanner } = await import('qr-scanner');
                qrScannerRef.current = new QrScanner(
                    videoElement,
                    (result) => {
                        if (scannerBusyRef.current) return;
                        recordScanPerformance();
                        const run = handleQRDetectedRef.current;
                        if (run) void run(result.data);
                    },
                    {
                        ...optimizedSettings,
                        preferredCamera: 'environment',
                        constraints: {
                            video: optimizedConstraints
                        },
                        onDecodeError: (error) => {
                            logger.debug('QR decode error:', error);
                        },
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                        maxScansPerSecond: 10,
                        validateScan: (result) => {
                            if (!result || !result.data) return false;
                            const data = result.data.trim();
                            return data.length >= 3 && data.length <= 50;
                        }
                    }
                );

                await qrScannerRef.current.start();
            }
            setScannerState(prev => ({
                ...prev,
                isScanning: true,
                isInitializing: false,
                hasPermission: true,
                deviceInfo,
                error: null
            }));

        } catch (err) {
            logger.error('QR/Barcode Scanner initialization error:', err);

            let errorMessage = 'فشل في بدء مسح رمز QR أو الباركود.';

            if (err.name === 'NotAllowedError' || err.message.includes('إذن الكاميرا')) {
                errorMessage = 'تم رفض إذن الكاميرا. يرجى السماح بالوصول للكاميرا في إعدادات المتصفح.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'لم يتم العثور على كاميرا. تأكد من وجود كاميرا متصلة.';
            } else if (err.name === 'NotSupportedError') {
                errorMessage = 'هذا المتصفح لا يدعم مسح رمز QR أو الباركود. جرب متصفح آخر.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'الكاميرا مشغولة من قبل تطبيق آخر. أغلق التطبيقات الأخرى.';
            }

            setScannerState(prev => ({
                ...prev,
                error: errorMessage,
                isInitializing: false,
                isScanning: false
            }));

            scanErrorFeedback();
        }
    }, []);

    // Handle QR detection
    const handleQRDetected = useCallback(async (data) => {
        if (scannerBusyRef.current) return;

        const cleanTrackingNumber = data.trim();

        if (cleanTrackingNumber.length < 3) {
            setScannerState(prev => ({ ...prev, error: 'رقم التتبع قصير جداً' }));
            scanErrorFeedback();
            hapticFeedback('error');

            setTimeout(() => {
                setScannerState(prev => ({ ...prev, error: null }));
                if (qrScannerRef.current && typeof qrScannerRef.current.resume === 'function') {
                    qrScannerRef.current.resume();
                }
            }, 3000);
            return;
        }

        scannerBusyRef.current = true;
        setScannerState(prev => ({ ...prev, isProcessing: true }));

        try {
            const runScan = handleScanTrackingRef.current;
            if (runScan) await runScan(cleanTrackingNumber);
            scanSuccessFeedback();
            hapticFeedback('success');
        } catch (error) {
            logger.error('Error processing QR:', error);
            scanErrorFeedback();
            hapticFeedback('error');
        } finally {
            scannerBusyRef.current = false;
            setScannerState(prev => ({ ...prev, isProcessing: false }));
        }
    }, []);

    useEffect(() => {
        handleQRDetectedRef.current = handleQRDetected;
    }, [handleQRDetected]);

    // Stop camera (called when hide btn clicked or unmount)
    const stopCamera = useCallback(async () => {
        try {
            // Stop QR scanner if exists
            if (qrScannerRef.current) {
                qrScannerRef.current.stop();
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
            }

            // Stop barcode scanner if exists
            if (barcodeScannerRef.current) {
                try {
                    await barcodeScannerRef.current.stop();
                    barcodeScannerRef.current.clear();
                } catch (e) {
                    logger.debug('Error stopping barcode scanner:', e);
                }
                barcodeScannerRef.current = null;
            }

            // Stop HVAR global stream if any
            if (window.HVARStopCamera) {
                window.HVARStopCamera();
            }

            setScannerState(prev => ({
                ...prev,
                isScanning: false,
                isProcessing: false,
                isInitializing: false,
                hasPermission: false,
                error: null
            }));

            optimizeMemoryUsage();
        } catch (err) {
            logger.error('Error stopping camera:', err);
        }
    }, []);

    // Start camera (getUserMedia) — only call from user actions (e.g. إظهار الكاميرا / بدء المسح / إعادة المحاولة)
    const startCamera = useCallback(async () => {
        setScannerState(prev => ({ ...prev, error: null }));
        await initializeQRScanner();
    }, [initializeQRScanner]);

    // Toggle camera — opening requests permission only here (after panel mounts), not on Hub load
    const toggleCamera = useCallback(() => {
        if (scannerState.showCamera) {
            void stopCamera();
            setScannerState((prev) => ({ ...prev, showCamera: false }));
            return;
        }
        setScannerState((prev) => ({
            ...prev,
            showCamera: true,
            error: null,
            isInitializing: true,
        }));
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!videoRef.current) {
                    setScannerState((prev) => ({ ...prev, isInitializing: false }));
                    return;
                }
                void startCamera();
            });
        });
    }, [scannerState.showCamera, stopCamera, startCamera]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);


    // Scan tracking number
    const handleScanTracking = useCallback(async (trackingNumber) => {
        const { value: lookupToken, reason: normReason } = normalizeHubLookupInput(trackingNumber);
        if (!lookupToken) {
            if (normReason === 'invalid_paste') {
                toast.error('لا يمكن البحث برابط الخادم فقط. الصق رقم التتبع، أو رابط يحتوي على رقم التتبع بعد ‎/scan/‎');
            } else if (normReason === 'host_only') {
                toast.error('أدخل رقم التتبع أو التذكرة، وليس عنوان الـ API أو ‎/api‎ فقط');
            }
            return;
        }

        setIsManualSubmitting(true);
        try {
            toast.loading('جاري البحث عن التذكرة...', { id: HUB_SCAN_PROGRESS_TOAST_ID });
            const result = await scanTracking(lookupToken);

            if (result.success && result.data.found) {
                toast.dismiss(HUB_SCAN_PROGRESS_TOAST_ID);
                const ticket = result.data.context.ticket;
                const originalAvailableActions = result.data.context.available_actions || [];

                // Check if receive or send actions are available (BEFORE filtering)
                const hasReceiveAction = originalAvailableActions.includes('scan_inbound') || originalAvailableActions.includes('receive');
                const hasSendAction = originalAvailableActions.includes('scan_outbound') || originalAvailableActions.includes('dispatch');

                logger.log('📦 Scanned ticket:', ticket.ticket_number);
                logger.log('📋 Original available actions:', originalAvailableActions);
                logger.log('🔧 Current scan mode:', scannerState.scanMode);
                logger.log('✅ Has receive action:', hasReceiveAction);
                logger.log('✅ Has send action:', hasSendAction);

                // Determine the correct tab and sub-tab based on ticket service_type and status
                const ticketServiceType = ticket.service_type || ticket.type;
                const ticketStatus = ticket.status;
                const ticketAvailableActions = ticket.available_actions || originalAvailableActions;

                logger.log(`📍 Service Type: ${ticketServiceType}, Status: ${ticketStatus}`);

                // Map service type to tab
                const tabMap = {
                    'replacement': 'replacement',
                    'maintenance': 'maintenance',
                    'return': 'return',
                    'sell': 'sell'
                };

                const targetTab = tabMap[ticketServiceType] || 'replacement';
                const targetSubTab = getSubTabForStatus(ticketServiceType, ticketStatus, ticketAvailableActions);

                logger.log(`🎯 Target Tab: ${targetTab}, SubTab: ${targetSubTab}`);
                logger.log(`📊 Current Tab: ${activeTab}, SubTab: ${activeSubTab}`);

                const ticketId = ticket.id || ticket.ticket_id;
                const willFetchList = activeTab !== targetTab || activeSubTab !== targetSubTab;

                // In-memory navigation: pin the scanned row and refresh the tab list (no ?serviceId= / no second getTicket).
                expectListFetchAfterScanRef.current = willFetchList;
                pinnedScanTicketRef.current = ticket;
                pendingHighlightTicketRef.current = ticket;
                pendingScanHighlightIsAutoRef.current = scannerState.scanMode === 'auto';

                toast.loading('جاري عرض التذكرة...', { id: `nav-${ticketId}` });

                setScannedTicket(ticket);
                setScannedTrackingNumber(trackingNumber);

                if (willFetchList) {
                    logger.log(`🔄 Navigating to tab ${targetTab}, sub-tab ${targetSubTab}...`);
                    setActiveTab(targetTab);
                    setActiveSubTab(targetSubTab);
                    setTickets([ticket]);
                } else {
                    setTickets((prev) => {
                        if (prev.some((t) => ticketMatchesId(t, ticketId))) return prev;
                        return [ticket, ...prev];
                    });
                }

                if (scannerState.scanMode === 'auto') {
                    logger.log('🔍 Auto search mode: navigating to ticket without opening modal');
                }
                // Receive mode: auto-open receive modal if action is available
                else if (hasReceiveAction && scannerState.scanMode === 'receive') {
                    logger.log('📥 Opening receive modal');
                    // Show toast with ticket info and actions
                    const actionLabelMap = {
                        'confirm': 'تأكيد',
                        'cancel': 'إلغاء',
                        'view': 'عرض',
                        'start_preparation': 'بدء التحضير',
                        'start_maintenance': 'بدء الصيانة',
                        'complete_maintenance': 'إكمال الصيانة',
                        'mark_ready': 'جاهز للإرسال',
                        'ready_for_dispatch': 'جاهز للشحن',
                        'scan_outbound': 'إرسال',
                        'scan_inbound': 'الاستلام',
                        'mark_delivered': 'تأكيد التسليم',
                        'confirm_sent': 'تأكيد التسليم',
                        'validate_items': 'فحص المنتجات',
                        'complete': 'إتمام'
                    };
                    const arabicActionLabels = originalAvailableActions
                        .map(actionId => actionLabelMap[actionId] || actionId)
                        .join('، ');
                    const availableActionsText = originalAvailableActions.length > 0
                        ? `الإجراءات المتاحة: ${arabicActionLabels}`
                        : 'لا توجد إجراءات متاحة';
                    toast.success(`تم العثور على التذكرة: ${ticket.ticket_number}\n${availableActionsText}`, {
                        duration: 4000
                    });
                    setScanActionType('receive');
                    setShowScanModal(true);
                }
                // Send mode: auto-open send modal if action is available
                else if (hasSendAction && scannerState.scanMode === 'send') {
                    logger.log('📤 Opening send modal');
                    // Show toast with ticket info and actions
                    const actionLabelMap = {
                        'confirm': 'تأكيد',
                        'cancel': 'إلغاء',
                        'view': 'عرض',
                        'start_preparation': 'بدء التحضير',
                        'start_maintenance': 'بدء الصيانة',
                        'complete_maintenance': 'إكمال الصيانة',
                        'mark_ready': 'جاهز للإرسال',
                        'ready_for_dispatch': 'جاهز للشحن',
                        'scan_outbound': 'إرسال',
                        'scan_inbound': 'الاستلام',
                        'mark_delivered': 'تأكيد التسليم',
                        'confirm_sent': 'تأكيد التسليم',
                        'validate_items': 'فحص المنتجات',
                        'complete': 'إتمام'
                    };
                    const arabicActionLabels = originalAvailableActions
                        .map(actionId => actionLabelMap[actionId] || actionId)
                        .join('، ');
                    const availableActionsText = originalAvailableActions.length > 0
                        ? `الإجراءات المتاحة: ${arabicActionLabels}`
                        : 'لا توجد إجراءات متاحة';
                    toast.success(`تم العثور على التذكرة: ${ticket.ticket_number}\n${availableActionsText}`, {
                        duration: 4000
                    });
                    setScanActionType('send');
                    setShowScanModal(true);
                } else {
                    // Convert action IDs to Arabic labels
                    const actionLabelMap = {
                        'confirm': 'تأكيد',
                        'cancel': 'إلغاء',
                        'view': 'عرض',
                        'start_preparation': 'بدء التحضير',
                        'start_maintenance': 'بدء الصيانة',
                        'complete_maintenance': 'إكمال الصيانة',
                        'mark_ready': 'جاهز للإرسال',
                        'ready_for_dispatch': 'جاهز للشحن',
                        'scan_outbound': 'إرسال',
                        'scan_inbound': 'الاستلام',
                        'mark_delivered': 'تأكيد التسليم',
                        'confirm_sent': 'تأكيد التسليم',
                        'validate_items': 'فحص المنتجات',
                        'complete': 'إتمام'
                    };

                    const arabicActionLabels = originalAvailableActions
                        .map(actionId => actionLabelMap[actionId] || actionId)
                        .join('، ');

                    // Show all available actions in toast
                    const availableActionsText = originalAvailableActions.length > 0
                        ? `الإجراءات المتاحة: ${arabicActionLabels}`
                        : 'لا توجد إجراءات متاحة';
                    toast.success(`تم العثور على التذكرة: ${ticket.ticket_number}\n${availableActionsText}`, {
                        duration: 4000
                    });

                    // Handle scan actions by opening appropriate modal
                    if (originalAvailableActions.includes('scan_outbound') && scannerState.scanMode === 'send') {
                        logger.log('📤 Opening send modal for scan_outbound action');
                        setScanActionType('send');
                        setShowScanModal(true);
                    } else if (originalAvailableActions.includes('scan_inbound') && scannerState.scanMode === 'receive') {
                        logger.log('📥 Opening receive modal for scan_inbound action');
                        setScanActionType('receive');
                        setShowScanModal(true);
                    }
                    // If user wants a different action than current mode, suggest switching
                    else if (hasReceiveAction && scannerState.scanMode === 'send') {
                        toast.info('اضغط على "استلام سريع" لإتمام العملية', { duration: 3000 });
                    } else if (hasSendAction && scannerState.scanMode === 'receive') {
                        toast.info('اضغط على "إرسال سريع" لإتمام العملية', { duration: 3000 });
                    }
                }
            } else {
                toast.dismiss(HUB_SCAN_PROGRESS_TOAST_ID);
                toast.error('لا توجد تذكرة مرتبطة برقم التتبع هذا');
            }
        } catch (error) {
            logger.error('Error scanning tracking:', error);
            toast.dismiss(HUB_SCAN_PROGRESS_TOAST_ID);
            toast.error('حدث خطأ في المسح');
        } finally {
            setIsManualSubmitting(false);
            setManualInput('');
        }
    }, [scannerState.scanMode, activeTab, activeSubTab, getSubTabForStatus]);

    useEffect(() => {
        handleScanTrackingRef.current = handleScanTracking;
    }, [handleScanTracking]);

    // Global scanner input detection (for physical barcode scanners)
    useEffect(() => {
        let scannerBuffer = '';
        let scannerTimeout = null;
        let lastKeyTime = 0;

        const handleKeyPress = (e) => {
            const currentTime = Date.now();
            const timeSinceLastKey = currentTime - lastKeyTime;

            // If user is typing in OTHER inputs/textareas (not our tracking input), ignore scanner
            if (
                (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) &&
                e.target !== scannerInputRef.current
            ) {
                scannerBuffer = '';
                lastKeyTime = 0;
                return;
            }

            // Reset if too much time has passed (more than 100ms = manual typing)
            if (timeSinceLastKey > 100 && scannerBuffer.length > 0) {
                scannerBuffer = '';
                setScannerBuffer('');
            }

            // Handle Enter key (end of scan)
            if (e.key === 'Enter' && scannerBuffer.length >= 3) {
                e.preventDefault();
                e.stopPropagation();

                const scannedNumber = scannerBuffer.trim();
                scannerBuffer = '';
                lastKeyTime = 0;
                setScannerBuffer('');

                // Auto-focus input and populate it
                if (scannerInputRef.current) {
                    scannerInputRef.current.focus();
                    setManualInput(scannedNumber);
                    setIsScannerInput(true); // Mark as scanner input
                    // Trigger scan based on selected mode - auto process
                    handleScanTracking(scannedNumber);
                }

                return;
            }

            // Handle normal character input (scanner input is fast, <100ms between keys)
            // Allow scanner to type even if input is focused
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // If input is not focused, capture scanner input globally
                if (document.activeElement !== scannerInputRef.current) {
                    scannerBuffer += e.key;
                    lastKeyTime = currentTime;

                    // Update visual indicator
                    setScannerBuffer(scannerBuffer);

                    // Clear buffer if it gets too long (manual typing)
                    if (scannerBuffer.length > 50) {
                        scannerBuffer = '';
                        setScannerBuffer('');
                    }

                    // Reset timeout
                    if (scannerTimeout) {
                        clearTimeout(scannerTimeout);
                    }
                    scannerTimeout = setTimeout(() => {
                        scannerBuffer = '';
                        setScannerBuffer('');
                    }, 500);
                } else {
                    // If input is focused, mark as scanner input if typing is fast
                    // This helps detect when scanner types directly into focused input
                    if (timeSinceLastKey < 100) {
                        setIsScannerInput(true);
                        setScannerBuffer(prev => prev + e.key);
                    } else {
                        // Manual typing - reset scanner flag
                        setIsScannerInput(false);
                        setScannerBuffer('');
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            if (scannerTimeout) {
                clearTimeout(scannerTimeout);
            }
        };
    }, [handleScanTracking]);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualInput.trim()) return;
        // Reset scanner flag when manually submitting
        setIsScannerInput(false);
        setScannerBuffer('');
        handleScanTracking(manualInput);
    };

    // Map API tickets to component format
    const mapTicketToCard = useCallback((ticket) => {
        return {
            ...ticket,
            action_type: ticket.service_type, // Map service_type to action_type for ServiceActionCard
            customer_full_name: ticket.customer_name,
            customer_phone: ticket.phone
        };
    }, []); // Pure function, no dependencies

    // Map API returns to component format
    const mapReturnToCard = (returnTicket) => {
        return {
            ...returnTicket,
            action_type: returnTicket.service_type, // Map service_type to action_type for ServiceActionCard
            customer_full_name: returnTicket.customer_name,
            customer_phone: returnTicket.phone,
            id: returnTicket.id, // Ensure ID is available for ServiceActionCard
            status: returnTicket.status // Ensure status is available
        };
    };

    // Map API replacements to component format
    const mapReplacementToCard = (replacementTicket) => {
        return {
            ...replacementTicket,
            action_type: replacementTicket.service_type, // Map service_type to action_type for ServiceActionCard
            customer_full_name: replacementTicket.customer_name,
            customer_phone: replacementTicket.phone,
            id: replacementTicket.id, // Ensure ID is available for ServiceActionCard
            status: replacementTicket.status // Ensure status is available
        };
    };

    // Calculate count for a specific sub-tab (using optimized counts from API)
    const getSubTabCount = useCallback((tabId, subTabId, subTabsConfig) => {
        const tabCounts = ticketCounts[tabId] || {};
        // Align with /counts: maintenance "confirmed" sub-tab = CONFIRMED + PENDING (same as list filter)
        if (tabId === 'maintenance' && subTabId === 'confirmed') {
            return (tabCounts.confirmed || 0) + (tabCounts.pending || 0);
        }
        return tabCounts[subTabId] || 0;
    }, [ticketCounts]);

    // Calculate total count for a main tab (sum of all sub-tabs)
    const getMainTabCount = useCallback((tabId, subTabsConfig) => {
        const subTabs = subTabsConfig[tabId] || [];
        return subTabs.reduce((total, subTab) => total + getSubTabCount(tabId, subTab.id, subTabsConfig), 0);
    }, [getSubTabCount]);

    // Sub-tabs configuration (memoized as it's used in dependencies)
    const subTabsConfig = useMemo(() => ({
        replacement: [
            { id: 'in-preparation', label: 'جديد', description: 'استبدال - جديد', color: 'blue' },
            { id: 'preparing', label: 'جاري التحضير', description: 'استبدال - جاري التحضير', color: 'yellow' },
            { id: 'ready-to-ship', label: 'جاهز للإرسال', description: 'استبدال - جاهز للإرسال', color: 'green' },
            { id: 'sent', label: 'جاهز للاستلام', description: 'استبدال - جاهز للاستلام', color: 'cyan' },
            { id: 'validate-returns', label: 'فحص المرتجعات', description: 'استبدال - فحص المرتجعات', color: 'orange' },
            { id: 'completed', label: 'مكتملة', description: 'استبدال - مكتملة', color: 'gray' },
            { id: 'cancelled', label: 'ملغاة', description: 'استبدال - ملغاة', color: 'red' }
        ],
        maintenance: [
            { id: 'confirmed', label: 'انتظار الاستلام', description: 'صيانة - انتظار الاستلام', color: 'yellow' },
            { id: 'received', label: 'تم الاستلام', description: 'صيانة - تم الاستلام', color: 'blue' },
            { id: 'under-maintenance', label: 'قيد الصيانة', description: 'صيانة - قيد الصيانة', color: 'purple' },
            { id: 'completion-ready', label: 'اكتمال الصيانة', description: 'صيانة - اكتمال الصيانة', color: 'green' },
            { id: 'ready-to-ship', label: 'جاهز للإرسال', description: 'صيانة - جاهز للإرسال', color: 'green' },
            { id: 'sent', label: 'المرسلة', description: 'صيانة - المرسلة', color: 'cyan' },
            { id: 'completed', label: 'مكتملة', description: 'صيانة - مكتملة', color: 'gray' },
            { id: 'cancelled', label: 'ملغاة', description: 'صيانة - ملغاة', color: 'red' }
        ],
        return: [
            { id: 'receiving', label: 'انتظار الاستلام', description: 'استرجاع - انتظار الاستلام', color: 'yellow' },
            { id: 'inspection', label: 'الفحص', description: 'استرجاع - الفحص', color: 'purple' },
            { id: 'completed', label: 'مكتملة', description: 'استرجاع - مكتملة', color: 'gray' },
            { id: 'cancelled', label: 'ملغاة', description: 'استرجاع - ملغاة', color: 'red' }
        ],
        sell: [
            { id: 'new', label: 'جديد', description: 'المبيعات - جديد', color: 'blue' },
            { id: 'preparing', label: 'جاري التحضير', description: 'المبيعات - جاري التحضير', color: 'yellow' },
            { id: 'ready-to-ship', label: 'جاهز للإرسال', description: 'المبيعات - جاهز للإرسال', color: 'green' },
            { id: 'sent', label: 'مرسلة', description: 'المبيعات - مرسلة', color: 'cyan' },
            { id: 'completed', label: 'مكتملة', description: 'المبيعات - مكتملة', color: 'gray' },
            { id: 'cancelled', label: 'ملغاة', description: 'المبيعات - ملغاة', color: 'red' }
        ]
    }), []);

    // Tab Configuration - Service-based Tabs with dynamic counts
    // Include tickets in dependencies so counts update when tickets change
    const tabs = useMemo(() => [
        {
            id: 'replacement',
            label: 'الاستبدال',
            badge: getMainTabCount('replacement', subTabsConfig).toString(),
            color: 'orange',
            icon: 'settings',
            description: 'إدارة عمليات الاستبدال حسب دورة العمل',
            ariaLabel: 'تبويب الاستبدال',
            hasSubTabs: true
        },
        {
            id: 'maintenance',
            label: 'الصيانة',
            badge: getMainTabCount('maintenance', subTabsConfig).toString(),
            color: 'purple',
            icon: 'wrench',
            description: 'إدارة عمليات الصيانة حسب دورة العمل',
            ariaLabel: 'تبويب الصيانة',
            hasSubTabs: true
        },
        {
            id: 'return',
            label: 'الاسترجاع',
            badge: getMainTabCount('return', subTabsConfig).toString(),
            color: 'blue',
            icon: 'download',
            description: 'إدارة طلبات الاسترجاع حسب دورة العمل',
            ariaLabel: 'تبويب الاسترجاع',
            hasSubTabs: true
        },
        {
            id: 'sell',
            label: 'المبيعات',
            badge: getMainTabCount('sell', subTabsConfig).toString(),
            color: 'green',
            icon: 'shopping-cart',
            description: 'إدارة عمليات بيع القطع حسب دورة العمل',
            ariaLabel: 'تبويب المبيعات',
            hasSubTabs: true
        }
    ], [getMainTabCount, subTabsConfig, ticketCounts]);

    // Ensure a valid sub-tab is selected when switching tabs
    useEffect(() => {
        const current = tabs.find(t => t.id === activeTab);
        if (current?.hasSubTabs) {
            const list = subTabsConfig[activeTab] || [];
            const first = list[0]?.id || 'all';
            setActiveSubTab(prev => (list.some(s => s.id === prev) ? prev : first));
        } else {
            // Reset to 'all' for tabs without subtabs to keep state clean
            setActiveSubTab('all');
        }
    }, [activeTab]);

    // Utility Functions for Enhanced UI/UX
    const getIconComponent = (iconName, className = "w-5 h-5") => {
        const icons = {
            'menu': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            ),
            'close': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ),
            'chevron-left': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            ),
            'chevron-right': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            ),
            'zap': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            'qr-code': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                </svg>
            ),
            'bar-chart': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            'trending-up': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            'settings': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            'wrench': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
            ),
            'help-circle': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            'camera': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            'camera-off': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 1l22 22" />
                </svg>
            ),
            'search': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
            'download': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V10" />
                </svg>
            ),
            'upload': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
            ),
            'alert-triangle': (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            ),
        };
        return icons[iconName] || icons['menu'];
    };

    // Get filtered replacement tickets (with items) for preparation modal
    // Backend already filters, so we just return tickets for replacement tab
    const getFilteredReplacementTickets = useCallback(() => {
        if (activeTab !== 'replacement') return [];
        return tickets;
    }, [activeTab, tickets]);

    const getFilteredSellTickets = useCallback(() => {
        if (activeTab !== 'sell') return [];
        return tickets;
    }, [activeTab, tickets]);

    // Apply client-side filters for filters not supported by backend
    const applyClientSideFilters = useCallback((ticketsList) => {
        let filtered = [...ticketsList];

        // Priority filter (client-side)
        if (filters.priority && Array.isArray(filters.priority) && filters.priority.length > 0) {
            filtered = filtered.filter(ticket => {
                const ticketPriority = ticket.priority || 'normal';
                return filters.priority.includes(ticketPriority);
            });
        }

        // Governorate filter (client-side)
        if (filters.governorate && Array.isArray(filters.governorate) && filters.governorate.length > 0) {
            filtered = filtered.filter(ticket => {
                const ticketGovernorate = ticket.governorate || '';
                return filters.governorate.includes(ticketGovernorate);
            });
        }

        // Cost adjustment filter (client-side)
        if (filters.costAdjustment?.min !== undefined || filters.costAdjustment?.max !== undefined) {
            filtered = filtered.filter(ticket => {
                const cost = parseFloat(ticket.cost_adjustment || 0);
                const min = filters.costAdjustment.min !== undefined ? parseFloat(filters.costAdjustment.min) : -Infinity;
                const max = filters.costAdjustment.max !== undefined ? parseFloat(filters.costAdjustment.max) : Infinity;
                return cost >= min && cost <= max;
            });
        }

        // Total cost filter (client-side)
        if (filters.totalCost?.min !== undefined || filters.totalCost?.max !== undefined) {
            filtered = filtered.filter(ticket => {
                // Calculate total cost from items if available
                const items = ticket.items || [];
                const totalCost = items.reduce((sum, item) => {
                    return sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0));
                }, 0) + parseFloat(ticket.cost_adjustment || 0);
                const min = filters.totalCost.min !== undefined ? parseFloat(filters.totalCost.min) : -Infinity;
                const max = filters.totalCost.max !== undefined ? parseFloat(filters.totalCost.max) : Infinity;
                return totalCost >= min && totalCost <= max;
            });
        }

        // Return value filter (client-side)
        if (filters.returnValue?.min !== undefined || filters.returnValue?.max !== undefined) {
            filtered = filtered.filter(ticket => {
                const items = ticket.items || [];
                const returnValue = items.reduce((sum, item) => {
                    return sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0));
                }, 0);
                const min = filters.returnValue.min !== undefined ? parseFloat(filters.returnValue.min) : -Infinity;
                const max = filters.returnValue.max !== undefined ? parseFloat(filters.returnValue.max) : Infinity;
                return returnValue >= min && returnValue <= max;
            });
        }

        // Total amount filter (sell) (client-side)
        if (filters.totalAmount?.min !== undefined || filters.totalAmount?.max !== undefined) {
            filtered = filtered.filter(ticket => {
                const items = ticket.items || [];
                const totalAmount = items.reduce((sum, item) => {
                    return sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0));
                }, 0);
                const min = filters.totalAmount.min !== undefined ? parseFloat(filters.totalAmount.min) : -Infinity;
                const max = filters.totalAmount.max !== undefined ? parseFloat(filters.totalAmount.max) : Infinity;
                return totalAmount >= min && totalAmount <= max;
            });
        }

        // Customer type filter (client-side)
        if (filters.customerType && Array.isArray(filters.customerType) && filters.customerType.length > 0) {
            filtered = filtered.filter(ticket => {
                const ticketCustomerType = ticket.customer_type || 'customer';
                return filters.customerType.includes(ticketCustomerType);
            });
        }

        // Waiting days filter (client-side) - for ready-to-ship
        if (filters.waitingDays?.min !== undefined || filters.waitingDays?.max !== undefined) {
            filtered = filtered.filter(ticket => {
                if (!ticket.updated_at) return false;
                const updatedDate = new Date(ticket.updated_at);
                const now = new Date();
                const daysDiff = Math.floor((now - updatedDate) / (1000 * 60 * 60 * 24));
                const min = filters.waitingDays.min !== undefined ? parseInt(filters.waitingDays.min) : 0;
                const max = filters.waitingDays.max !== undefined ? parseInt(filters.waitingDays.max) : Infinity;
                return daysDiff >= min && daysDiff <= max;
            });
        }

        // Maintenance days filter (client-side)
        if (filters.maintenanceDays?.min !== undefined || filters.maintenanceDays?.max !== undefined) {
            filtered = filtered.filter(ticket => {
                // Calculate maintenance duration from history
                const history = ticket.history || [];
                const maintenanceStart = history.find(h => 
                    h.old_status === 'CONFIRMED' && h.new_status === 'IN_PROCESS'
                );
                if (!maintenanceStart) return false;
                const startDate = new Date(maintenanceStart.created_at);
                const now = new Date();
                const daysDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
                const min = filters.maintenanceDays.min !== undefined ? parseInt(filters.maintenanceDays.min) : 0;
                const max = filters.maintenanceDays.max !== undefined ? parseInt(filters.maintenanceDays.max) : Infinity;
                return daysDiff >= min && daysDiff <= max;
            });
        }

        return filtered;
    }, [filters]);

    const mappedCards = useMemo(() => {
        // If global search is active, use search results instead of regular tickets
        let ticketsToUse = tickets;
        if (globalSearchResults.length > 0 && filters.search && filters.search.trim() !== '') {
            // Filter search results to only show results for the current tab
            const tabMap = {
                'replacement': 'replacement',
                'maintenance': 'maintenance',
                'return': 'return',
                'sell': 'sell'
            };
            ticketsToUse = globalSearchResults.filter(ticket => {
                const ticketServiceType = ticket.service_type || ticket.serviceType;
                return tabMap[ticketServiceType] === activeTab;
            });
        }
        
        const filteredTickets = applyClientSideFilters(ticketsToUse);
        const cards = filteredTickets.map(mapTicketToCard);
        // Pin lookup / search match to top (clearer than scrolling to a random grid cell).
        if (highlightedTicketId == null) return cards;
        const pinned = [];
        const rest = [];
        for (const c of cards) {
            if (ticketMatchesId(c, highlightedTicketId)) pinned.push(c);
            else rest.push(c);
        }
        return [...pinned, ...rest];
    }, [tickets, globalSearchResults, filters.search, activeTab, mapTicketToCard, applyClientSideFilters, highlightedTicketId]);

    // Helper function for backward compatibility
    const getFilteredCards = useCallback(() => mappedCards, [mappedCards]);

    // Responsive sidebar toggle
    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem('hvar-hub-sidebar-collapsed', newState.toString());
            return newState;
        });
    }, []);

    // Sync sidebar state with window resize
    useEffect(() => {
        const handleResize = () => {
            // On mobile (< 1024px), auto-collapse if expanded
            if (window.innerWidth < 1024 && !sidebarCollapsed) {
                setSidebarCollapsed(true);
                localStorage.setItem('hvar-hub-sidebar-collapsed', 'true');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarCollapsed]);

    // Focus trap for mobile sidebar
    useEffect(() => {
        if (!sidebarCollapsed && window.innerWidth < 1024 && sidebarRef.current) {
            // Focus first focusable element when sidebar opens on mobile
            const firstFocusable = sidebarRef.current.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            firstFocusable?.focus();
        }
    }, [sidebarCollapsed]);

    // Keyboard navigation handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Escape key closes sidebar
            if (e.key === 'Escape' && !sidebarCollapsed) {
                toggleSidebar();
            }
            // Ctrl/Cmd + B toggles sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                toggleSidebar();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sidebarCollapsed, toggleSidebar]);

    // Handle service action status change
    const handleStatusChange = useCallback(async (actionId, newStatus, data) => {
        try {
            logger.log(`🔄 Status change triggered: ${actionId} → ${newStatus}`);

            // Store current tab/subtab before action
            const currentTab = activeTab;
            const currentSubTab = activeSubTab;

            // Workflow actions that are already executed by modals
            const workflowActions = ['start_maintenance', 'complete_maintenance', 'mark_ready', 'mark_delivered', 'ready_for_dispatch', 'start_preparation'];
            const isWorkflowAction = workflowActions.includes(newStatus?.toLowerCase());
            const isConfirmAction = newStatus?.toLowerCase() === 'confirm';
            const isDeleteAction = newStatus?.toLowerCase() === 'delete';

            // Optimistically remove ticket from current view for instant feedback
            setTickets(prev => prev.filter(a => a.id !== actionId && a._id !== actionId));

            // Execute non-workflow, non-confirm, non-delete actions
            // Delete is already handled by ServiceDeleteModal
            if (!isWorkflowAction && !isConfirmAction && !isDeleteAction) {
                await executeTicketAction(actionId, {
                    action: newStatus.toLowerCase(),
                    user_id: localStorage.getItem('user_id') || '1',
                    ...(data?.notes && { notes: data.notes }),
                    ...(data?.cost && parseFloat(data.cost) !== 0 && { cost_adjustment: parseFloat(data.cost) })
                });
            }

            // Create new AbortController for refresh
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            // Workflow / confirm paths skip executeTicketAction — still bust cache so list + counts refetch fresh rows.
            invalidateServiceDataCaches();
            // Immediate refresh - backend filtering ensures correct tickets are returned
            await fetchHubData(currentTab, currentSubTab, false, controller.signal);

        } catch (error) {
            // Ignore cancellation errors
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
                return;
            }
            logger.error('Error changing status:', error);
            toast.error('فشل تنفيذ العملية');

            // On error, refresh to show accurate state
            try {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
                const controller = new AbortController();
                abortControllerRef.current = controller;
                invalidateServiceDataCaches();
                await fetchHubData(activeTab, activeSubTab, false, controller.signal);
            } catch (refreshError) {
                logger.error('Error during error recovery refresh:', refreshError);
            }
        }
    }, [activeTab, activeSubTab, fetchHubData, executeTicketAction]);

    // Handle service action
    const handleAction = useCallback((actionType, action) => {
        logger.log('Action triggered:', actionType, action);
        // Handle any custom actions here if needed
    }, []);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        logger.log('Refreshing tickets...');
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        invalidateServiceDataCaches();
        fetchHubData(activeTab, activeSubTab, false, controller.signal);
        setHighlightedTicketId(null);
    }, [fetchHubData, activeTab, activeSubTab]);

    // Handle scan modal success
    const handleScanSuccess = useCallback(async () => {
        // Refresh all data including counts
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        invalidateServiceDataCaches();
        await fetchHubData(activeTab, activeSubTab, false, controller.signal);
        // Clear scan state
        setScannedTicket(null);
        setScannedTrackingNumber('');
        setHighlightedTicketId(null);
    }, [fetchHubData, activeTab, activeSubTab]);

    // Handle scan modal close
    const handleScanClose = useCallback(() => {
        setShowScanModal(false);
        setScanActionType(null);
    }, []);

    return (
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors" dir="rtl">
            {/* Custom Scrollbar Styles */}
            <style>{`
                /* Custom scrollbar for webkit browsers */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: rgb(31 41 55); /* dark:bg-gray-800 */
                }
                ::-webkit-scrollbar-thumb {
                    background: rgb(75 85 99); /* gray-600 */
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgb(107 114 128); /* gray-500 */
                }
                
                /* For Firefox */
                * {
                    scrollbar-width: thin;
                    scrollbar-color: rgb(75 85 99) rgb(31 41 55);
                }
                
                /* Ensure no white backgrounds on scroll */
                body {
                    background-color: rgb(17 24 39) !important; /* dark:bg-gray-900 */
                }
                
                html {
                    background-color: rgb(17 24 39) !important; /* dark:bg-gray-900 */
                }
            `}</style>

            {/* Enhanced Sidebar with Responsive Design */}
            <aside
                ref={sidebarRef}
                id="sidebar-content"
                className={`
          ${sidebarCollapsed ? 'w-16 lg:w-16' : 'w-80 lg:w-80'}
          bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700
          flex flex-col transition-all duration-300
          fixed inset-y-0 right-0 z-40 h-screen shadow-lg
          ${sidebarCollapsed 
            ? 'translate-x-[calc(100%-64px)] lg:translate-x-0' // Show 64px toggle button on mobile, fully visible on desktop
            : 'translate-x-0'
          }
        `}
                aria-label="الشريط الجانبي للتنقل"
                aria-hidden={sidebarCollapsed && window.innerWidth < 1024 ? 'true' : 'false'}
            >
                {/* Sidebar Header - Standard Page Style */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-tl-xl">
                    <div className="flex items-center justify-between gap-3">
                        {!sidebarCollapsed && (
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <GlobalNavigation />
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-cairo-play bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                                        مخزن هفار
                                    </h1>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-cairo">
                                        الصفحة الرئيسية
                                    </p>
                                </div>
                            </div>
                        )}

                        {sidebarCollapsed && (
                            <div className="flex items-center justify-center w-full">
                                <GlobalNavigation />
                            </div>
                        )}

                        <button
                            onClick={toggleSidebar}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    toggleSidebar();
                                }
                            }}
                            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                            aria-label={sidebarCollapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'}
                            aria-expanded={!sidebarCollapsed}
                            aria-controls="sidebar-content"
                            title={sidebarCollapsed ? 'توسيع الشريط الجانبي (Ctrl+B)' : 'طي الشريط الجانبي (Ctrl+B أو Esc)'}
                        >
                            <span className="mr-2">
                                {getIconComponent(sidebarCollapsed ? 'chevron-left' : 'chevron-right', 'w-5 h-5')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Quick Actions Section - Scrollable Area */}
                <div
                    className={`flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain ${
                        sidebarCollapsed ? 'scrollbar-hub-sidebar-collapsed' : 'scrollbar-hub-sidebar-expanded'
                    }`}
                >
                    {!sidebarCollapsed ? (
                        <div className="p-4 space-y-3 min-w-0">
                            {/* Camera Toggle */}
                            <div className="flex gap-2 items-stretch">
                                <button
                                    onClick={toggleCamera}
                                    className={`flex-1 rounded-xl p-3 transition-all duration-200 font-cairo text-sm font-medium shadow-sm hover:shadow-md ${scannerState.showCamera
                                        ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                                        }`}
                                    aria-label={scannerState.showCamera ? 'إخفاء الكاميرا' : 'إظهار الكاميرا وطلب إذن الكاميرا للمسح'}
                                    title={scannerState.showCamera ? 'إخفاء الكاميرا' : 'إظهار الكاميرا وطلب الإذن عند الحاجة للمسح'}
                                >
                                    <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                                        {getIconComponent(scannerState.showCamera ? 'camera-off' : 'camera', 'w-3.5 h-3.5')}
                                        <span>{scannerState.showCamera ? 'إخفاء الكاميرا' : 'إظهار الكاميرا'}</span>
                                    </div>
                                </button>
                            </div>

                            {/* Camera View */}
                            {scannerState.showCamera && (
                                <div className="relative">
                                    <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-700/50 shadow-lg">
                                        {/* Container for html5-qrcode scanner (creates its own video element) */}
                                        {/* For qr-scanner fallback, we'll use a video element */}
                                        <div
                                            ref={videoRef}
                                            className="w-full h-full relative"
                                            id="scanner-container"
                                        >
                                            {/* Video element for qr-scanner fallback */}
                                            <video
                                                className="w-full h-full object-cover"
                                                playsInline
                                                muted
                                                aria-label="عارض الكاميرا للمسح الضوئي"
                                                style={{ display: 'none' }}
                                            />
                                        </div>

                                        {/* Scanning overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="relative">
                                                {/* Main scanning frame */}
                                                <div className="w-24 h-24 border-2 border-white/50 rounded-xl relative">
                                                    {/* Corner indicators */}
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-400 rounded-tr"></div>
                                                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400 rounded-tl"></div>
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400 rounded-br"></div>
                                                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-400 rounded-bl"></div>

                                                    {scannerState.isScanning && !scannerState.isProcessing && (
                                                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-bounce"></div>
                                                    )}

                                                    {scannerState.isProcessing && (
                                                        <div className="absolute inset-0 bg-green-400/20 border-2 border-green-400 rounded animate-pulse">
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-cairo">
                                                                    ✓
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {!scannerState.isScanning && !scannerState.error && !scannerState.isInitializing && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                                <button
                                                    type="button"
                                                    onClick={() => void startCamera()}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-cairo hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                                >
                                                    بدء المسح
                                                </button>
                                            </div>
                                        )}

                                        {scannerState.error && !scannerState.isInitializing && (
                                            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-3 p-4 z-20 pointer-events-auto">
                                                <p className="text-white text-xs sm:text-sm text-center font-cairo leading-relaxed max-w-[280px]">
                                                    {scannerState.error}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setScannerState((prev) => ({ ...prev, error: null }));
                                                        void startCamera();
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-cairo hover:bg-blue-700 transition-all duration-200 shadow-md"
                                                >
                                                    إعادة المحاولة
                                                </button>
                                            </div>
                                        )}

                                        {scannerState.isInitializing && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span className="text-white text-xs font-cairo">
                                                        جاري تشغيل الكاميرا...
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {scannerState.isScanning && (
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <div className="bg-black/70 rounded-xl p-2.5 text-center shadow-lg">
                                                    <p className="text-white text-sm font-cairo">
                                                        {scannerState.isProcessing ? 'جاري جلب البيانات...' : 'امسح رمز QR'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Quick lookup: hub scan API (tracking / ticket id). */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                                <p className="text-xs font-cairo font-semibold text-gray-700 dark:text-gray-200 mb-3">
                                    مسح وبحث سريع
                                </p>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    // Handle form submit (Enter key or button click)
                                    if (manualInput.trim() && !isManualSubmitting) {
                                        handleManualSubmit(e);
                                    }
                                }} className="space-y-3">
                                    <div className="relative">
                                        <input
                                            ref={scannerInputRef}
                                            type="text"
                                            inputMode="search"
                                            autoComplete="off"
                                            value={manualInput}
                                            onChange={(e) => {
                                                setManualInput(e.target.value);
                                                // If user manually types, mark as manual input
                                                if (!isScannerInput) {
                                                    setIsScannerInput(false);
                                                }
                                            }}
                                            onPaste={(e) => {
                                                const text = e.clipboardData?.getData('text') ?? '';
                                                const { value, reason } = normalizeHubLookupInput(text);
                                                if (reason === 'invalid_paste' || reason === 'host_only') {
                                                    e.preventDefault();
                                                    toast.error('الصق رقم التتبع أو رقم التذكرة، وليس عنوان الخادم أو ‎/api‎ فقط');
                                                    return;
                                                }
                                                if (value && value !== text.trim()) {
                                                    e.preventDefault();
                                                    setManualInput(value);
                                                    toast.success('تم استخراج رقم البحث من الرابط', { duration: 1800 });
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                // Handle Enter key - works for both scanner and manual input
                                                if (e.key === 'Enter' && manualInput.trim()) {
                                                    e.preventDefault();
                                                    // If it's scanner input, it's already processed by global handler
                                                    // For manual typing, process it here
                                                    if (!isScannerInput && scannerBuffer.length === 0) {
                                                        // Manual typing - process on Enter
                                                        handleScanTracking(manualInput);
                                                    } else {
                                                        // Scanner input was already processed, just clear flags
                                                        setScannerBuffer('');
                                                        setIsScannerInput(false);
                                                    }
                                                }
                                            }}
                                            onClick={(e) => {
                                                // Ensure input is focused when clicked
                                                e.target.focus();
                                            }}
                                            placeholder="تتبع بوسطة، رقم تذكرة، أو لصق رابط يحتوي على التتبع"
                                            className="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-sm font-cairo text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500 hover:border-gray-400 dark:hover:border-gray-500 cursor-text transition-all duration-200 shadow-sm focus:shadow-md"
                                            dir="rtl"
                                            aria-label="رقم التتبع أو التذكرة للمسح السريع"
                                            autoFocus
                                            readOnly={false}
                                            disabled={false}
                                        />
                                        {scannerBuffer && (
                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!manualInput.trim() || isManualSubmitting}
                                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 text-white rounded-xl text-sm font-cairo font-medium transition-all duration-200 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:shadow-none"
                                        aria-label="تنفيذ المسح السريع"
                                    >
                                        <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                                            {isManualSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                    <span>جاري البحث...</span>
                                                </>
                                            ) : (
                                                <>
                                                    {getIconComponent('search', 'w-3.5 h-3.5')}
                                                    <span>بحث</span>
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </form>

                                {/* Scanner Status */}
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 font-cairo">الماسح:</span>
                                        <div className="flex items-center space-x-1 space-x-reverse">
                                            <div className={`w-1.5 h-1.5 rounded-full ${scannerBuffer ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                            <span className={`font-cairo ${scannerBuffer ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'}`}>
                                                {scannerBuffer ? 'نشط' : 'جاهز'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions - Auto Search Button */}
                            <button
                                onClick={() => {
                                    setScannerState(prev => ({ ...prev, scanMode: 'auto' }));
                                    toast.success('تم تفعيل وضع البحث التلقائي', { duration: 2000 });
                                }}
                                className={`w-full rounded-xl p-3 transition-all duration-200 group shadow-sm hover:shadow-md ${scannerState.scanMode === 'auto'
                                    ? 'bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-500 dark:border-purple-600'
                                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                                    }`}
                                aria-label="بحث تلقائي"
                            >
                                <div className="flex items-center justify-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 shadow-sm ${scannerState.scanMode === 'auto'
                                        ? 'bg-purple-100 dark:bg-purple-900/40'
                                        : 'bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30'
                                        }`}>
                                        {getIconComponent('search', 'w-4 h-4 text-purple-600 dark:text-purple-400')}
                                    </div>
                                    <span className={`text-sm font-semibold font-cairo ${scannerState.scanMode === 'auto'
                                        ? 'text-purple-700 dark:text-purple-300'
                                        : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        بحث تلقائي
                                    </span>
                                </div>
                            </button>

                            {/* Quick Actions - Horizontal Layout */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Quick Receive Button */}
                                <button
                                    onClick={() => {
                                        setScannerState(prev => ({ ...prev, scanMode: 'receive' }));
                                        toast.success('تم تفعيل وضع الاستلام', { duration: 2000 });
                                    }}
                                    className={`rounded-xl p-3 transition-all duration-200 group shadow-sm hover:shadow-md ${scannerState.scanMode === 'receive'
                                        ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600'
                                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                                        }`}
                                    aria-label="الاستلام"
                                >
                                    <div className="flex flex-col items-center space-y-1.5">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-sm ${scannerState.scanMode === 'receive'
                                            ? 'bg-green-100 dark:bg-green-900/40'
                                            : 'bg-green-50 dark:bg-green-900/20 group-hover:bg-green-100 dark:group-hover:bg-green-900/30'
                                            }`}>
                                            {getIconComponent('download', 'w-4 h-4 text-green-600 dark:text-green-400')}
                                        </div>
                                        <span className={`text-sm font-semibold font-cairo ${scannerState.scanMode === 'receive'
                                            ? 'text-green-700 dark:text-green-300'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            الاستلام
                                        </span>
                                    </div>
                                </button>

                                {/* Quick Dispatch Button */}
                                <button
                                    onClick={() => {
                                        setScannerState(prev => ({ ...prev, scanMode: 'send' }));
                                        toast.success('تم تفعيل وضع الإرسال', { duration: 2000 });
                                    }}
                                    className={`rounded-xl p-3 transition-all duration-200 group shadow-sm hover:shadow-md ${scannerState.scanMode === 'send'
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-600'
                                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                                        }`}
                                    aria-label="إرسال سريع"
                                >
                                    <div className="flex flex-col items-center space-y-1.5">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-sm ${scannerState.scanMode === 'send'
                                            ? 'bg-blue-100 dark:bg-blue-900/40'
                                            : 'bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                                            }`}>
                                            {getIconComponent('upload', 'w-4 h-4 text-blue-600 dark:text-blue-400')}
                                        </div>
                                        <span className={`text-sm font-semibold font-cairo ${scannerState.scanMode === 'send'
                                            ? 'text-blue-700 dark:text-blue-300'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            إرسال سريع
                                        </span>
                                    </div>
                                </button>
                            </div>

                        </div>
                    ) : (
                        // Collapsed: icon-only buttons + dedicated scrollbar (no stable gutter — rail is w-16)
                        <div className="px-1.5 py-2 space-y-2 min-w-0">
                            {/* 1. Camera Toggle - Top Position */}
                            <button
                                onClick={toggleCamera}
                                className={`w-full h-11 rounded-xl transition-all duration-200 relative group shadow-sm hover:shadow-md flex items-center justify-center ${
                                    scannerState.showCamera
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-2 border-red-500 dark:border-red-600 hover:bg-red-200 dark:hover:bg-red-900/40'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border-2 border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-700/40'
                                }`}
                                aria-label={scannerState.showCamera ? 'إخفاء الكاميرا' : 'إظهار الكاميرا وطلب إذن المسح'}
                                title={scannerState.showCamera ? 'إخفاء الكاميرا' : 'كاميرا — يطلب الإذن عند الفتح'}
                            >
                                {getIconComponent('camera', 'w-5 h-5')}
                            </button>

                            {/* Camera View - Collapsed State */}
                            {scannerState.showCamera && (
                                <div className="relative w-full">
                                    <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-700/50 shadow-lg">
                                        {/* Container for html5-qrcode scanner */}
                                        <div
                                            ref={videoRef}
                                            className="w-full h-full relative"
                                            id="scanner-container-collapsed"
                                        >
                                            {/* Video element for qr-scanner fallback */}
                                            <video
                                                className="w-full h-full object-cover"
                                                playsInline
                                                muted
                                                aria-label="عارض الكاميرا للمسح الضوئي"
                                                style={{ display: 'none' }}
                                            />
                                        </div>

                                        {/* Scanning overlay - Compact version */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="relative">
                                                {/* Compact scanning frame */}
                                                <div className="w-16 h-16 border-2 border-white/50 rounded-xl relative">
                                                    {/* Corner indicators */}
                                                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t border-r border-blue-400 rounded-tr"></div>
                                                    <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-blue-400 rounded-tl"></div>
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-blue-400 rounded-br"></div>
                                                    <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b border-l border-blue-400 rounded-bl"></div>

                                                    {scannerState.isScanning && !scannerState.isProcessing && (
                                                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-bounce"></div>
                                                    )}

                                                    {scannerState.isProcessing && (
                                                        <div className="absolute inset-0 bg-green-400/20 border-2 border-green-400 rounded animate-pulse">
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-cairo">
                                                                    ✓
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {!scannerState.isScanning && !scannerState.error && !scannerState.isInitializing && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-auto z-10">
                                                <button
                                                    type="button"
                                                    onClick={() => void startCamera()}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-cairo hover:bg-blue-700 transition-colors"
                                                >
                                                    بدء المسح
                                                </button>
                                            </div>
                                        )}

                                        {scannerState.error && !scannerState.isInitializing && (
                                            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2 p-3 z-20 pointer-events-auto">
                                                <p className="text-white text-[10px] sm:text-xs text-center font-cairo leading-snug max-w-[200px]">
                                                    {scannerState.error}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setScannerState((prev) => ({ ...prev, error: null }));
                                                        void startCamera();
                                                    }}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-cairo hover:bg-blue-700"
                                                >
                                                    إعادة المحاولة
                                                </button>
                                            </div>
                                        )}

                                        {scannerState.isInitializing && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-auto z-10">
                                                <div className="flex items-center gap-2 text-white text-xs font-cairo">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                    جاري التشغيل...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1.5"></div>

                            {/* 2. Scanner Mode Buttons - Grouped together */}
                            {/* Auto Search Button */}
                            <button
                                onClick={() => {
                                    setScannerState(prev => ({ ...prev, scanMode: 'auto' }));
                                    toast.success('تم تفعيل وضع البحث التلقائي', { duration: 2000 });
                                }}
                                className={`w-full h-11 rounded-xl transition-all duration-200 relative group shadow-sm hover:shadow-md flex items-center justify-center ${
                                    scannerState.scanMode === 'auto'
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-2 border-purple-500 dark:border-purple-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700/40'
                                }`}
                                aria-label="بحث تلقائي"
                                title="بحث تلقائي"
                            >
                                {getIconComponent('search', 'w-5 h-5')}
                                <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 right-full mr-2">
                                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                        بحث تلقائي
                                        <div className="absolute top-1/2 -translate-y-1/2 border-4 border-transparent left-full border-l-gray-900 dark:border-l-gray-700" />
                                    </div>
                                </div>
                            </button>

                            {/* Receive Button */}
                            <button
                                onClick={() => {
                                    setScannerState(prev => ({ ...prev, scanMode: 'receive' }));
                                    toast.success('تم تفعيل وضع الاستلام', { duration: 2000 });
                                }}
                                className={`w-full h-11 rounded-xl transition-all duration-200 relative group shadow-sm hover:shadow-md flex items-center justify-center ${
                                    scannerState.scanMode === 'receive'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-500 dark:border-green-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 border-2 border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700/40'
                                }`}
                                aria-label="الاستلام"
                                title="الاستلام"
                            >
                                {getIconComponent('download', 'w-5 h-5')}
                                <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 right-full mr-2">
                                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                        الاستلام
                                        <div className="absolute top-1/2 -translate-y-1/2 border-4 border-transparent left-full border-l-gray-900 dark:border-l-gray-700" />
                                    </div>
                                </div>
                            </button>

                            {/* Send Button */}
                            <button
                                onClick={() => {
                                    setScannerState(prev => ({ ...prev, scanMode: 'send' }));
                                    toast.success('تم تفعيل وضع الإرسال', { duration: 2000 });
                                }}
                                className={`w-full h-11 rounded-xl transition-all duration-200 relative group shadow-sm hover:shadow-md flex items-center justify-center ${
                                    scannerState.scanMode === 'send'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500 dark:border-blue-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700/40'
                                }`}
                                aria-label="إرسال سريع"
                                title="إرسال سريع"
                            >
                                {getIconComponent('upload', 'w-5 h-5')}
                                <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 right-full mr-2">
                                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                        إرسال سريع
                                        <div className="absolute top-1/2 -translate-y-1/2 border-4 border-transparent left-full border-l-gray-900 dark:border-l-gray-700" />
                                    </div>
                                </div>
                            </button>

                            {/* Divider */}
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1.5"></div>

                            {/* 3. Scanner Status Indicator - Enhanced for Team */}
                            <div 
                                className={`w-full h-11 rounded-xl transition-all duration-200 relative group shadow-sm flex items-center justify-center ${
                                    scannerBuffer 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700/50' 
                                        : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50'
                                }`}
                                title={scannerBuffer ? 'الماسح نشط' : 'الماسح جاهز'}
                                role="status"
                                aria-label={scannerBuffer ? 'الماسح نشط' : 'الماسح جاهز'}
                            >
                                <div className={`w-3 h-3 rounded-full ${scannerBuffer ? 'bg-green-500 dark:bg-green-400 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                <div className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 right-full mr-2">
                                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                        {scannerBuffer ? 'الماسح نشط' : 'الماسح جاهز'}
                                        <div className="absolute top-1/2 -translate-y-1/2 border-4 border-transparent left-full border-l-gray-900 dark:border-l-gray-700" />
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1.5"></div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-y-auto scrollbar-custom [scrollbar-gutter:stable] overscroll-contain transition-all duration-300 ${sidebarCollapsed ? 'mr-16 lg:mr-16' : 'mr-80 lg:mr-80'}`}>
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className={`py-2 sm:py-3 flex flex-col items-center`}>
                        {/* Creative Compact Tabs - Centered, Clear Design */}
                        <nav 
                            role="tablist" 
                            className={`flex gap-1 sm:gap-1.5 bg-transparent overflow-x-auto scrollbar-tabs scroll-smooth justify-center w-full ${sidebarCollapsed ? 'px-3 sm:px-4' : 'px-3 sm:px-4 md:px-5 lg:px-6'}`}
                            style={{ scrollbarGutter: 'stable', WebkitOverflowScrolling: 'touch' }}
                        >
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    aria-controls={`panel-${tab.id}`}
                                    aria-label={tab.ariaLabel}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-cairo font-medium rounded-xl transition-colors duration-150 ${activeTab === tab.id
                                        ? `${getTabBgClasses(tab.color, true)} ${getTabColorClasses(tab.color, true)} border-2 shadow-sm`
                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-2 border-transparent'
                                        }`}
                                    style={activeTab === tab.id ? getTabBorderStyle(tab.color) : {}}
                                >
                                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                        {getIconComponent(tab.icon, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                                        <span className="whitespace-nowrap">{tab.label}</span>
                                        {tab.badge && (
                                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[20px] sm:min-w-[22px] flex items-center justify-center ${getTabBadgeClasses(tab.color, activeTab === tab.id)}`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </nav>

                        {/* Clean Separator - Perfect Separation */}
                        {tabs.find(t => t.id === activeTab)?.hasSubTabs && (
                            <div className="w-full flex justify-center my-2.5 sm:my-3">
                                <div className="h-[1px] w-20 sm:w-28 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                            </div>
                        )}

                        {/* Sub-tabs - Centered, Matching Creative Style */}
                        {tabs.find(t => t.id === activeTab)?.hasSubTabs && (
                            <nav 
                                role="tablist" 
                                className={`flex gap-1 sm:gap-1.5 bg-transparent overflow-x-auto scrollbar-tabs scroll-smooth justify-center w-full ${sidebarCollapsed ? 'px-3 sm:px-4' : 'px-3 sm:px-4 md:px-5 lg:px-6'}`}
                                style={{ scrollbarGutter: 'stable', WebkitOverflowScrolling: 'touch' }}
                            >
                                {(subTabsConfig[activeTab] || []).map((subTab) => {
                                    const count = getSubTabCount(activeTab, subTab.id, subTabsConfig);
                                    return (
                                        <button
                                            key={subTab.id}
                                            role="tab"
                                            aria-selected={activeSubTab === subTab.id}
                                            onClick={() => handleSubTabChange(subTab.id)}
                                            className={`flex-shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-cairo font-medium rounded-xl transition-colors duration-150 ${activeSubTab === subTab.id
                                                ? `${getTabBgClasses(subTab.color, true)} ${getSubTabColorClasses(subTab.color)} border-2 shadow-sm`
                                                : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-2 border-transparent'
                                                }`}
                                            style={activeSubTab === subTab.id ? getTabBorderStyle(subTab.color) : {}}
                                        >
                                            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                                <span className="whitespace-nowrap">{subTab.label}</span>
                                                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[18px] sm:min-w-[20px] flex items-center justify-center ${getTabBadgeClasses(subTab.color, activeSubTab === subTab.id)}`}>
                                                    {count}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className={`flex-1 p-3 sm:p-4 md:p-5 lg:p-6 bg-gray-50 dark:bg-gray-900 ${sidebarCollapsed ? '' : 'lg:pr-0'}`}>
                    <div className={`w-full ${sidebarCollapsed ? 'px-0' : 'lg:pr-4'}`}>
                        {/* Tab Content - Replacement */}
                        {activeTab === 'replacement' && (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="mb-3 sm:mb-4">
                                    <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 font-cairo flex-shrink-0">
                                            {(subTabsConfig['replacement'] || []).find(t => t.id === activeSubTab)?.description || 'الاستبدال'}
                                        </h3>
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Compact Filter Bar - Search + Total + Date */}
                                            <CompactFilterBar
                                                activeTab={activeTab}
                                                activeSubTab={activeSubTab}
                                                filters={filters}
                                                onFiltersChange={setFilters}
                                                totalCount={mappedCards.length}
                                                globalSearchResults={globalSearchResults}
                                                currentSearchResultIndex={currentSearchResultIndex}
                                                onNavigateSearchResult={navigateSearchResult}
                                            />
                                        </div>
                                        {activeSubTab === 'preparing' && (
                                            <button
                                                onClick={() => setShowPreparationModal(true)}
                                                className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 text-sm bg-orange-600/10 hover:bg-orange-600/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-700 rounded-xl font-cairo font-medium transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md"
                                            >
                                                <Package className="w-4 h-4" />
                                                <span>قائمة التحضير</span>
                                                <span className="px-2 py-0.5 bg-orange-600/20 dark:bg-orange-500/30 rounded text-xs font-bold text-orange-700 dark:text-orange-300">
                                                    {mappedCards.length}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-8 sm:py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
                                    </div>
                                ) : error ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 text-center shadow-sm">
                                        <p className="text-red-600 dark:text-red-400 font-cairo text-sm sm:text-base">{error}</p>
                                    </div>
                                ) : mappedCards.length === 0 ? (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <p className="text-gray-600 dark:text-gray-400 font-cairo text-sm sm:text-base">لا توجد طرود للاستلام</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 ${sidebarCollapsed ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-3'}`}>
                                            {mappedCards.map((card) => (
                                                <div id={`ticket-${card.id}`} key={card.id} className="h-full">
                                                    <ServiceActionCard
                                                        action={card}
                                                        highlighted={highlightedTicketId != null && ticketMatchesId(card, highlightedTicketId)}
                                                        onAction={handleAction}
                                                        onStatusChange={handleStatusChange}
                                                        onRefresh={handleRefresh}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {pagination.has_more && (
                                            <div className="flex justify-center mt-4 sm:mt-6">
                                                <button
                                                    onClick={handleLoadMore}
                                                    disabled={loadingMore}
                                                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 text-white rounded-xl font-cairo font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse shadow-md hover:shadow-lg disabled:shadow-none text-sm sm:text-base"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            <span>جاري التحميل...</span>
                                                        </>
                                                    ) : (
                                                        <span>تحميل المزيد</span>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Tab Content - Maintenance */}
                        {activeTab === 'maintenance' && (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="mb-3 sm:mb-4">
                                    <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 font-cairo flex-shrink-0">
                                            {(subTabsConfig['maintenance'] || []).find(t => t.id === activeSubTab)?.description || 'الصيانة'}
                                        </h3>
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Compact Filter Bar - Search + Total + Date */}
                                            <CompactFilterBar
                                                activeTab={activeTab}
                                                activeSubTab={activeSubTab}
                                                filters={filters}
                                                onFiltersChange={setFilters}
                                                totalCount={mappedCards.length}
                                                globalSearchResults={globalSearchResults}
                                                currentSearchResultIndex={currentSearchResultIndex}
                                                onNavigateSearchResult={navigateSearchResult}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-orange-600"></div>
                                    </div>
                                ) : error ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 text-center shadow-sm">
                                        <p className="text-red-600 dark:text-red-400 font-cairo text-sm sm:text-base">{error}</p>
                                    </div>
                                ) : mappedCards.length === 0 ? (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <p className="text-gray-600 dark:text-gray-400 font-cairo text-sm sm:text-base">لا توجد عناصر في هذا القسم</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 ${sidebarCollapsed ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-3'}`}>
                                            {mappedCards.map((card) => (
                                                <div id={`ticket-${card.id}`} key={card.id} className="h-full">
                                                    <ServiceActionCard
                                                        action={card}
                                                        highlighted={highlightedTicketId != null && ticketMatchesId(card, highlightedTicketId)}
                                                        onAction={handleAction}
                                                        onStatusChange={handleStatusChange}
                                                        onRefresh={handleRefresh}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {pagination.has_more && (
                                            <div className="flex justify-center mt-4 sm:mt-6">
                                                <button
                                                    onClick={handleLoadMore}
                                                    disabled={loadingMore}
                                                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 text-white rounded-xl font-cairo font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse shadow-md hover:shadow-lg disabled:shadow-none text-sm sm:text-base"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            <span>جاري التحميل...</span>
                                                        </>
                                                    ) : (
                                                        <span>تحميل المزيد</span>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Tab Content - Return */}
                        {activeTab === 'return' && (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="mb-3 sm:mb-4">
                                    <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 font-cairo flex-shrink-0">
                                            {(subTabsConfig['return'] || []).find(t => t.id === activeSubTab)?.description || 'الاسترجاع'}
                                        </h3>
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Compact Filter Bar - Search + Total + Date */}
                                            <CompactFilterBar
                                                activeTab={activeTab}
                                                activeSubTab={activeSubTab}
                                                filters={filters}
                                                onFiltersChange={setFilters}
                                                totalCount={mappedCards.length}
                                                globalSearchResults={globalSearchResults}
                                                currentSearchResultIndex={currentSearchResultIndex}
                                                onNavigateSearchResult={navigateSearchResult}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : error ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 text-center shadow-sm">
                                        <p className="text-red-600 dark:text-red-400 font-cairo text-sm sm:text-base">{error}</p>
                                    </div>
                                ) : mappedCards.length === 0 ? (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <p className="text-gray-600 dark:text-gray-400 font-cairo text-sm sm:text-base">لا توجد طرود جاهزة للإرسال</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 ${sidebarCollapsed ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-3'}`}>
                                            {mappedCards.map((card) => (
                                                <div id={`ticket-${card.id}`} key={card.id} className="h-full">
                                                    <ServiceActionCard
                                                        action={card}
                                                        highlighted={highlightedTicketId != null && ticketMatchesId(card, highlightedTicketId)}
                                                        onAction={handleAction}
                                                        onStatusChange={handleStatusChange}
                                                        onRefresh={handleRefresh}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {pagination.has_more && (
                                            <div className="flex justify-center mt-4 sm:mt-6">
                                                <button
                                                    onClick={handleLoadMore}
                                                    disabled={loadingMore}
                                                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 text-white rounded-xl font-cairo font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse shadow-md hover:shadow-lg disabled:shadow-none text-sm sm:text-base"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            <span>جاري التحميل...</span>
                                                        </>
                                                    ) : (
                                                        <span>تحميل المزيد</span>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Tab Content - Sell */}
                        {activeTab === 'sell' && (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="mb-3 sm:mb-4">
                                    <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 font-cairo flex-shrink-0">
                                            {(subTabsConfig['sell'] || []).find(t => t.id === activeSubTab)?.description || 'المبيعات'}
                                        </h3>
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Compact Filter Bar - Search + Total + Date */}
                                            <CompactFilterBar
                                                activeTab={activeTab}
                                                activeSubTab={activeSubTab}
                                                filters={filters}
                                                onFiltersChange={setFilters}
                                                totalCount={mappedCards.length}
                                                globalSearchResults={globalSearchResults}
                                                currentSearchResultIndex={currentSearchResultIndex}
                                                onNavigateSearchResult={navigateSearchResult}
                                            />
                                        </div>
                                        {activeSubTab === 'preparing' && (
                                            <button
                                                type="button"
                                                onClick={() => setShowPreparationModal(true)}
                                                className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 text-sm bg-orange-600/10 hover:bg-orange-600/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-700 rounded-xl font-cairo font-medium transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md"
                                            >
                                                <Package className="w-4 h-4" />
                                                <span>قائمة التحضير</span>
                                                <span className="px-2 py-0.5 bg-orange-600/20 dark:bg-orange-500/30 rounded text-xs font-bold text-orange-700 dark:text-orange-300">
                                                    {mappedCards.length}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center py-8 sm:py-12">
                                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
                                    </div>
                                ) : error ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 text-center shadow-sm">
                                        <p className="text-red-600 dark:text-red-400 font-cairo text-sm sm:text-base">{error}</p>
                                    </div>
                                ) : mappedCards.length === 0 ? (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <p className="text-gray-600 dark:text-gray-400 font-cairo text-sm sm:text-base">لا توجد طلبات بيع في هذا القسم</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 ${sidebarCollapsed ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-3 xl:grid-cols-3'}`}>
                                            {mappedCards.map((card) => (
                                                <div id={`ticket-${card.id}`} key={card.id} className="h-full">
                                                    <ServiceActionCard
                                                        action={card}
                                                        highlighted={highlightedTicketId != null && ticketMatchesId(card, highlightedTicketId)}
                                                        onAction={handleAction}
                                                        onStatusChange={handleStatusChange}
                                                        onRefresh={handleRefresh}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {pagination.has_more && (
                                            <div className="flex justify-center mt-6">
                                                <button
                                                    onClick={handleLoadMore}
                                                    disabled={loadingMore}
                                                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600 text-white rounded-lg font-cairo font-medium transition-all duration-200 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            <span>جاري التحميل...</span>
                                                        </>
                                                    ) : (
                                                        <span>تحميل المزيد</span>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* No separate completed tab in new structure; covered within each service tab */}


                    </div>
                </div>
            </main>

            {/* Hub Scan Modal */}
            {showScanModal && scannedTicket && (
                <HubScanModal
                    isOpen={showScanModal}
                    onClose={handleScanClose}
                    onSuccess={handleScanSuccess}
                    ticket={scannedTicket}
                    actionType={scanActionType}
                    scannedTrackingNumber={scannedTrackingNumber}
                />
            )}

            {/* Preparation list: replacement or sell (جاري التحضير) */}
            {(activeTab === 'replacement' || activeTab === 'sell') && (
                <ReplacementPreparationItemsModal
                    isOpen={showPreparationModal}
                    onClose={() => setShowPreparationModal(false)}
                    tickets={
                        activeTab === 'replacement'
                            ? getFilteredReplacementTickets()
                            : getFilteredSellTickets()
                    }
                    serviceType={activeTab === 'sell' ? 'sell' : 'replacement'}
                />
            )}
        </div>
    );
};

export default HubPage;
