import { useState, useCallback, useRef } from "react";

/**
 * Custom hook for Hub scanning functionality
 * Integrates with the backend scan API endpoint
 */
export const useScanHub = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scanInputRef = useRef(null);

  /**
   * Perform a scan operation
   * @param {string} trackingNumber - The tracking number or ticket number to scan
   * @param {boolean} includeBosta - Whether to include Bosta data (default: auto)
   */
  const performScan = useCallback(
    async (trackingNumber, includeBosta = "auto") => {
      if (!trackingNumber || !trackingNumber.trim()) {
        setError("يرجى إدخال رقم التتبع أو رقم التذكرة");
        return;
      }

      setIsLoading(true);
      setError(null);
      setScanResult(null);

      try {
        const response = await fetch(
          `/api/hub/scan/${encodeURIComponent(
            trackingNumber.trim()
          )}?include_bosta=${includeBosta}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "خطأ في المسح");
        }

        if (!data.found) {
          setError(data.message || "لا توجد تذكرة مرتبطة برقم التتبع هذا");
          return;
        }

        // Update scan result
        setScanResult(data.context);

        // Add to scan history
        setScanHistory((prev) => [
          {
            id: Date.now(),
            timestamp: new Date(),
            trackingNumber: trackingNumber.trim(),
            result: data.context,
            searchType: data.context.search_type,
          },
          ...prev.slice(0, 9), // Keep last 10 scans
        ]);

        // Clear any previous errors on success
        setError(null);

        // Clear input
        if (scanInputRef.current) {
          scanInputRef.current.value = "";
        }
      } catch (err) {
        const errorMessage = err.message || "حدث خطأ أثناء المسح";
        setError(errorMessage);
        console.error("Scan error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Clear current scan result
   */
  const clearScanResult = useCallback(() => {
    setScanResult(null);
    setError(null);
  }, []);

  /**
   * Clear scan history
   */
  const clearScanHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  /**
   * Remove a specific scan from history
   */
  const removeScanFromHistory = useCallback((scanId) => {
    setScanHistory((prev) => prev.filter((scan) => scan.id !== scanId));
  }, []);

  /**
   * Get scan summary for display
   */
  const getScanSummary = useCallback(() => {
    if (!scanResult) return null;

    const { ticket, search_summary } = scanResult;

    return {
      ticketNumber: ticket.ticket_number,
      serviceType: ticket.service_type,
      status: ticket.status,
      customerName: ticket.customer_name,
      scansCount: search_summary.scans_count,
      hasWarnings: search_summary.has_warnings,
      warnings: scanResult.warnings || [],
      availableActions: scanResult.available_actions || [],
    };
  }, [scanResult]);

  /**
   * Get status color for UI display
   */
  const getStatusColor = useCallback((status) => {
    const statusColors = {
      PENDING: "yellow",
      CONFIRMED: "blue",
      IN_PROCESS: "orange",
      READY_FOR_DISPATCH: "purple",
      SENT: "indigo",
      DELIVERED: "green",
      COMPLETED: "green",
      CANCELLED: "red",
    };
    return statusColors[status] || "gray";
  }, []);

  /**
   * Get service type display name
   */
  const getServiceTypeDisplay = useCallback((serviceType) => {
    const typeNames = {
      replacement: "استبدال",
      maintenance: "صيانة",
      return: "إرجاع",
    };
    return typeNames[serviceType] || serviceType;
  }, []);

  /**
   * Get action display name
   */
  const getActionDisplayName = useCallback((action) => {
    const actionNames = {
      confirm: "تأكيد",
      cancel: "إلغاء",
      start_preparation: "بدء التحضير",
      ready_for_dispatch: "جاهز للإرسال",
      scan_outbound: "إرسال",
      scan_inbound: "الاستلام",
      validate_items: "التحقق من العناصر",
      complete: "إكمال",
    };
    return actionNames[action] || action;
  }, []);

  return {
    // State
    isScanning,
    scanResult,
    scanHistory,
    isLoading,
    error,
    scanInputRef,

    // Actions
    performScan,
    clearScanResult,
    clearScanHistory,
    removeScanFromHistory,

    // Utilities
    getScanSummary,
    getStatusColor,
    getServiceTypeDisplay,
    getActionDisplayName,

    // Computed values
    hasScanResult: !!scanResult,
    hasScanHistory: scanHistory.length > 0,
    hasError: !!error,
  };
};
