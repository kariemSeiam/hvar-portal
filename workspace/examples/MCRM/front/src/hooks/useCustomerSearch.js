import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { customerAPI } from "../api/customerAPI";
import { normalizeEgyptPhone, detectSearchType } from "../utils/core/phone";

/**
 * Customer search for service creation (phone / tracking / general).
 * Uses {@link customerAPI.searchCustomers} — single HTTP layer, no duplicate clients.
 */
export function useCustomerSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerCandidates, setCustomerCandidates] = useState(null);

  const searchCustomers = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setCustomerData(null);
    setCustomerOrders([]);
    setCustomerCandidates(null);

    const searchType = detectSearchType(searchQuery.trim());
    const normalizedQuery =
      searchType === "phone"
        ? normalizeEgyptPhone(searchQuery.trim())
        : searchQuery.trim();

    try {
      const data = await customerAPI.searchCustomers(normalizedQuery, {
        type: searchType,
      });
      const list = Array.isArray(data) ? data : [];

      if (list.length > 1) {
        setCustomerCandidates(list);
        setCustomerData(null);
        setCustomerOrders([]);
        toast.success(`تم العثور على ${list.length} عملاء — اختر العميل`);
      } else if (list.length === 1) {
        const fetchedCustomer = list[0];
        setCustomerData(fetchedCustomer);
        setCustomerOrders(fetchedCustomer.bosta_orders || []);
        setCustomerCandidates(null);
        toast.success(
          `تم العثور على ${fetchedCustomer.bosta_orders?.length || 0} طلب للعميل ${fetchedCustomer.name}`
        );
      } else {
        setCustomerData(null);
        setCustomerOrders([]);
        setCustomerCandidates(null);
        toast.error("لم يتم العثور على بيانات للبحث المحدد.");
      }
    } catch (error) {
      console.error("Error during customer search or data processing:", error);
      const message =
        error.response?.data?.error ||
        error.message ||
        "حدث خطأ أثناء البحث عن العميل أو معالجة البيانات.";
      toast.error(message);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectCustomerFromCandidates = useCallback((customer) => {
    if (!customer) return;
    setCustomerData(customer);
    setCustomerOrders(customer.bosta_orders || []);
    setCustomerCandidates(null);
  }, []);

  const clearCustomerCandidates = useCallback(() => {
    setCustomerCandidates(null);
  }, []);

  const clearCustomerSearch = useCallback(() => {
    setCustomerData(null);
    setCustomerOrders([]);
    setCustomerCandidates(null);
    setIsSearching(false);
  }, []);

  return {
    isSearching,
    customerData,
    customerOrders,
    customerCandidates,
    searchCustomers,
    selectCustomerFromCandidates,
    clearCustomerCandidates,
    clearCustomerSearch,
  };
}
