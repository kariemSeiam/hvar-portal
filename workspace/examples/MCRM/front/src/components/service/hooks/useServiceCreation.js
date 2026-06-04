import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { listTickets } from '../../../api/ticketsAPI';
import { customerAPI } from '../../../api/customerAPI';
import { stockAPI } from '../../../api/stockAPI';
import { useCustomerSearch } from '../../../hooks/useCustomerSearch';
import useRecentSearches from '../../../hooks/useRecentSearches';
import { normalizeEgyptPhone, isValidEgyptPhone } from '../../../utils/core/phone';
import { normalizeServiceTypeOrFallback } from '../../../constants/serviceTypes.js';

const INITIAL_CUSTOMER_DATA = {
    name: '',
    phone: '',
    phone_secondary: '',
    governorate: '',
    city: '',
    address_details: '',
};

/**
 * Service creation: customer search, selected order/action type, products/parts, create flow.
 * @param {{ setSearchMode?: (mode: string) => void, setTableSearchQuery?: (q: string) => void, onOpenUnifiedModal?: () => void, searchMode?: string }} options
 */
export function useServiceCreation(options = {}) {
    const {
        setSearchMode,
        setTableSearchQuery,
        onOpenUnifiedModal,
        searchMode = 'internal',
    } = options;

    const { isSearching, customerData, customerOrders, customerCandidates, searchCustomers, selectCustomerFromCandidates, clearCustomerCandidates, clearCustomerSearch } =
        useCustomerSearch();
    const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedActionType, setSelectedActionType] = useState(null);
    const [existingServices, setExistingServices] = useState([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [products, setProducts] = useState([]);
    const [parts, setParts] = useState([]);
    const [isAvailableOrdersExpanded, setIsAvailableOrdersExpanded] = useState(true);
    const [isExistingServicesExpanded, setIsExistingServicesExpanded] = useState(true);
    const [isCustomerInfoExpanded, setIsCustomerInfoExpanded] = useState(true);
    const [newCustomerData, setNewCustomerData] = useState(INITIAL_CUSTOMER_DATA);
    const [customerFormErrors, setCustomerFormErrors] = useState({});
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResultEmpty, setSearchResultEmpty] = useState(false);

    const loadExistingCustomerTickets = useCallback(async (customerId) => {
        if (!customerId) return;
        setIsLoadingServices(true);
        try {
            const result = await listTickets({ customer_id: customerId });
            if (result.data) {
                setExistingServices(result.data || []);
            } else {
                setExistingServices([]);
            }
        } catch (error) {
            setExistingServices([]);
        } finally {
            setIsLoadingServices(false);
        }
    }, []);

    useEffect(() => {
        if (customerData) {
            setSearchResultEmpty(false);
            addRecentSearch({
                phone: customerData.phone,
                name: customerData.name || 'غير محدد',
                address:
                    customerData.address_details ||
                    (customerData.governorate && customerData.city
                        ? `${customerData.governorate}, ${customerData.city}`
                        : customerData.address || null),
                searchedAt: new Date().toISOString(),
                orderCount: customerOrders?.length || 0,
            });
            loadExistingCustomerTickets(customerData.id);
        } else if (hasSearched && searchMode === 'external' && !isSearching) {
            const timer = setTimeout(() => {
                if (!customerData && searchMode === 'external') {
                    setSearchResultEmpty(true);
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [
        customerData,
        customerOrders?.length,
        addRecentSearch,
        hasSearched,
        searchMode,
        isSearching,
        loadExistingCustomerTickets,
    ]);

    useEffect(() => {
        if (!customerData && searchMode === 'external' && searchQuery?.trim() && searchResultEmpty) {
            const normalizedPhone = normalizeEgyptPhone(searchQuery.trim());
            if (isValidEgyptPhone(normalizedPhone)) {
                setNewCustomerData((prev) => ({
                    ...prev,
                    phone: normalizedPhone,
                }));
            }
        }
    }, [customerData, searchQuery, searchMode, searchResultEmpty]);

    useEffect(() => {
        if (searchMode === 'internal' || !searchQuery?.trim()) {
            setHasSearched(false);
            setSearchResultEmpty(false);
            setCustomerFormErrors({});
            setNewCustomerData(INITIAL_CUSTOMER_DATA);
        }
    }, [searchMode, searchQuery]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [productsResult, partsResult] = await Promise.all([
                    stockAPI.getProducts(),
                    stockAPI.getParts(),
                ]);
                if (!cancelled) {
                    if (productsResult?.success)
                        setProducts(productsResult.data?.items || []);
                    if (partsResult?.success)
                        setParts(partsResult.data?.items || []);
                }
            } catch (_) {}
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const availableOrders = useMemo(() => {
        if (!customerOrders || !Array.isArray(customerOrders) || customerOrders.length === 0)
            return [];
        const existingTrackings = (existingServices || [])
            .map((t) => t.original_tracking)
            .filter(Boolean);
        return customerOrders.filter((order) => {
            const tn = order.trackingNumber ?? order.tracking_number;
            return !existingTrackings.includes(tn);
        });
    }, [customerOrders, existingServices]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery?.trim()) return;
        setHasSearched(true);
        setSearchResultEmpty(false);
        try {
            await searchCustomers(searchQuery);
        } catch (error) {
            setSearchResultEmpty(true);
        }
    }, [searchCustomers, searchQuery]);

    const handleCloseExternalSearch = useCallback(() => {
        setHasSearched(false);
        setSearchResultEmpty(false);
        setSearchQuery('');
        setTableSearchQuery?.('');
        setCustomerFormErrors({});
        setNewCustomerData(INITIAL_CUSTOMER_DATA);
        clearCustomerSearch();
        setSelectedOrder(null);
        setSelectedActionType(null);
        setSearchMode?.('internal');
    }, [clearCustomerSearch, setSearchMode, setTableSearchQuery]);

    const handleOrderSelect = useCallback((order) => {
        setSelectedOrder(order);
        setSelectedActionType(null);
    }, []);

    const handleActionTypeSelect = useCallback(
        (actionType) => {
            const mapped = normalizeServiceTypeOrFallback(actionType, { fallback: 'replacement' });
            setSelectedActionType(mapped);
            onOpenUnifiedModal?.();
        },
        [onOpenUnifiedModal]
    );

    const handleCustomerFormChange = useCallback((field, value) => {
        let processedValue = value;
        if (field === 'phone' || field === 'phone_secondary') {
            if (value?.trim()) processedValue = normalizeEgyptPhone(value.trim());
        }
        setNewCustomerData((prev) => ({ ...prev, [field]: processedValue }));
        setCustomerFormErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    }, []);

    const validateCustomerForm = useCallback(() => {
        const errors = {};
        if (!newCustomerData.name?.trim()) errors.name = 'الاسم مطلوب';
        if (!newCustomerData.phone?.trim()) {
            errors.phone = 'رقم الهاتف مطلوب';
        } else {
            const normalized = normalizeEgyptPhone(newCustomerData.phone.trim());
            if (!isValidEgyptPhone(normalized)) {
                errors.phone = 'رقم الهاتف غير صحيح (استخدم: 01123456789)';
            }
        }
        if (newCustomerData.phone_secondary?.trim()) {
            const sec = normalizeEgyptPhone(newCustomerData.phone_secondary.trim());
            if (!isValidEgyptPhone(sec)) {
                errors.phone_secondary =
                    'رقم الهاتف الثانوي غير صحيح (استخدم: 01123456789)';
            }
        }
        setCustomerFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [newCustomerData]);

    const handleCreateCustomer = useCallback(async () => {
        if (!validateCustomerForm()) {
            toast.error('يرجى تصحيح الأخطاء في النموذج');
            return;
        }
        setIsCreatingCustomer(true);
        try {
            const normalizedPhone = normalizeEgyptPhone(newCustomerData.phone.trim());
            const normalizedSecondary = newCustomerData.phone_secondary?.trim()
                ? normalizeEgyptPhone(newCustomerData.phone_secondary.trim())
                : undefined;
            const payload = {
                name: newCustomerData.name.trim(),
                phone: normalizedPhone,
                phone_secondary: normalizedSecondary,
                governorate: newCustomerData.governorate || undefined,
                city: newCustomerData.city || undefined,
                address_details: newCustomerData.address_details?.trim() || undefined,
                created_by: 'service_page_create',
            };
            const response = await customerAPI.createOrGetCustomer(payload);
            const result = response?.customer;
            if (result && result.id != null) {
                toast.success(response?.deduplicated ? 'تم ربط الرقم بعميل موجود' : 'تم إنشاء العميل بنجاح');
                setSearchQuery(normalizedPhone);
                setTimeout(async () => {
                    try {
                        await searchCustomers(normalizedPhone);
                    } catch (searchError) {
                        toast.error('تم إنشاء العميل لكن فشل في تحديث البيانات. يرجى إعادة البحث.');
                    }
                }, 1000);
                setNewCustomerData(INITIAL_CUSTOMER_DATA);
                setCustomerFormErrors({});
                setSearchResultEmpty(false);
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            toast.error(error.response?.data?.error || 'فشل في إنشاء العميل');
        } finally {
            setIsCreatingCustomer(false);
        }
    }, [validateCustomerForm, newCustomerData, searchCustomers]);

    return {
        isSearching,
        customerData,
        customerOrders,
        searchQuery,
        setSearchQuery,
        selectedOrder,
        setSelectedOrder,
        selectedActionType,
        setSelectedActionType,
        existingServices,
        setExistingServices,
        isLoadingServices,
        products,
        parts,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        isAvailableOrdersExpanded,
        setIsAvailableOrdersExpanded,
        isExistingServicesExpanded,
        setIsExistingServicesExpanded,
        isCustomerInfoExpanded,
        setIsCustomerInfoExpanded,
        newCustomerData,
        setNewCustomerData,
        customerFormErrors,
        setCustomerFormErrors,
        isCreatingCustomer,
        hasSearched,
        setHasSearched,
        searchResultEmpty,
        setSearchResultEmpty,
        loadExistingCustomerTickets,
        availableOrders,
        handleSearch,
        handleCloseExternalSearch,
        handleOrderSelect,
        handleActionTypeSelect,
        handleCustomerFormChange,
        validateCustomerForm,
        handleCreateCustomer,
        clearCustomerSearch,
        customerCandidates,
        selectCustomerFromCandidates,
        clearCustomerCandidates,
    };
}
