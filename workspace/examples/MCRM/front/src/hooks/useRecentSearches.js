import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";

const STORAGE_KEY = "hvar_recent_customer_searches";
const MAX_RECENT_SEARCHES = 10;

const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState([]);

  const loadRecentSearches = useCallback(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.error("Failed to load recent customer searches:", error);
      setRecentSearches([]);
    }
  }, []);

  const saveRecentSearches = useCallback((searches) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error("Failed to save recent customer searches:", error);
    }
  }, []);

  const addRecentSearch = useCallback(
    (searchData) => {
      const newSearch = {
        id: Date.now().toString(),
        phone: searchData.phone,
        name: searchData.name || "غير محدد",
        address: searchData.address || null,
        trackingNumber: searchData.trackingNumber || null,
        searchedAt: new Date().toISOString(),
        orderCount: searchData.orderCount || 0,
      };

      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (search) => search.phone !== newSearch.phone
        );
        const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        saveRecentSearches(updated);
        return updated;
      });
    },
    [saveRecentSearches]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("تم مسح عمليات البحث الأخيرة");
  }, []);

  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
};

export default useRecentSearches;
