import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanLine, 
  Search, 
  Loader, 
  Camera, 
  XCircle, 
  QrCode, 
  Smartphone, 
  Package,
  AlertCircle,
  CheckCircle,
  Zap,
  Target,
  QrCode as BarCode,
  FileText,
  RefreshCw,
  User,
  Calendar,
  MapPin,
  Tag,
  DollarSign
} from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { useTheme } from '../../../components/ui/DesignSystem';
import { api } from '../../../services/api';

const Scanner = ({ onScan, isScanning, error }) => {
  const { direction } = useTheme();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [scanMode, setScanMode] = useState('manual'); // 'manual', 'camera', 'barcode'
  const [scanHistory, setScanHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const videoRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && scanMode === 'manual') {
      inputRef.current.focus();
    }
  }, [scanMode]);

  // Load recent scans from API
  useEffect(() => {
    const loadRecentScans = async () => {
      setIsLoadingRecent(true);
      try {
        const response = await api.unifiedCustomerService.getServiceActions({
          action_status: 'scanned,hub_confirmed',
          limit: 5,
          sort_by: 'updated_at',
          sort_dir: 'desc'
        });
        
        if (response.success && response.data) {
          setRecentScans(response.data);
        }
      } catch (err) {
        console.error('Error loading recent scans:', err);
      } finally {
        setIsLoadingRecent(false);
      }
    };

    loadRecentScans();
  }, []);

  // Helper function to normalize tracking numbers
  const normalizeTrackingNumber = (tracking) => {
    if (!tracking) return tracking;
    
    // Remove any existing prefixes
    if (tracking.startsWith('RET')) {
      return tracking.substring(3); // Remove RET prefix
    } else if (tracking.startsWith('RTN-')) {
      // Extract the base tracking number from RTN-base-timestamp format
      const parts = tracking.split('-');
      if (parts.length >= 2) {
        return parts[1]; // Return the base tracking number
      }
    }
    
    // For original order tracking numbers, return as-is
    // This allows scanning both return tracking numbers and original order tracking numbers
    return tracking;
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim() || isScanning) return;
    
    setIsProcessing(true);
    try {
      // Normalize the tracking number before sending
      const normalizedTracking = normalizeTrackingNumber(trackingNumber);
      await onScan(normalizedTracking);
      
      // Add to scan history
      setScanHistory(prev => [
        {
          id: Date.now(),
          trackingNumber: trackingNumber,
          timestamp: new Date().toISOString(),
          status: 'success'
        },
        ...prev.slice(0, 4) // Keep only last 5 scans
      ]);
      
      setTrackingNumber('');
    } catch (err) {
      // Add failed scan to history
      setScanHistory(prev => [
        {
          id: Date.now(),
          trackingNumber: trackingNumber,
          timestamp: new Date().toISOString(),
          status: 'error'
        },
        ...prev.slice(0, 4)
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setScanMode('camera');
        
        // Simulate barcode detection (in real implementation, use a barcode library)
        setTimeout(() => {
          // This would be replaced with actual barcode detection
          console.log('Camera scanning active');
        }, 1000);
      } catch (err) {
        console.error('Camera error:', err);
        setScanMode('manual');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraOn(false);
    setScanMode('manual');
  };

  const handleQuickScan = (presetTracking) => {
    setTrackingNumber(presetTracking);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const ScanModeButton = ({ mode, icon: Icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
        active 
          ? 'border-brand-red-500 bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-700 dark:text-brand-red-300' 
          : 'border-gray-200 dark:border-gray-700 hover:border-brand-red-300 dark:hover:border-brand-red-700 text-gray-600 dark:text-gray-400 hover:text-brand-red-600 dark:hover:text-brand-red-400'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <Icon className="w-6 h-6" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </button>
  );

  const ScanHistoryItem = ({ scan }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-1 rounded-full ${
          scan.status === 'success' 
            ? 'bg-green-100 dark:bg-green-900/30' 
            : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          {scan.status === 'success' ? (
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div>
          <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-200">
            {scan.trackingNumber}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(scan.timestamp).toLocaleTimeString('ar-SA')}
          </p>
        </div>
      </div>
      <button
        onClick={() => handleQuickScan(scan.trackingNumber)}
        className="p-1 text-gray-400 hover:text-brand-red-600 dark:hover:text-brand-red-400 transition-colors"
        title="إعادة المسح"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );

  const RecentScanItem = ({ scan }) => (
    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-200">
            {scan.return_tracking_number || `ACTION-${scan.action_id}`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {scan.product_name || 'غير محدد'} - {new Date(scan.updated_at || scan.created_at).toLocaleString('ar-SA')}
          </p>
          {scan.tracking_number && scan.tracking_number !== scan.return_tracking_number && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              الأصل: {scan.tracking_number}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => handleQuickScan(scan.return_tracking_number || scan.tracking_number)}
        className="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        title="إعادة المسح"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="w-full space-y-6" dir={direction}>
      {/* Scan Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScanModeButton
          mode="manual"
          icon={FileText}
          label="إدخال يدوي"
          active={scanMode === 'manual'}
          onClick={() => setScanMode('manual')}
        />
        <ScanModeButton
          mode="camera"
          icon={Camera}
          label="كاميرا"
          active={scanMode === 'camera'}
          onClick={startCamera}
        />
        <ScanModeButton
          mode="barcode"
          icon={BarCode}
          label="باركود"
          active={scanMode === 'barcode'}
          onClick={() => setScanMode('barcode')}
        />
      </div>

      {/* Main Scanner Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Scanner Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-brand-red-50 to-brand-blue-50 dark:from-brand-red-900/20 dark:to-brand-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <Target className="w-8 h-8 text-brand-red-600 dark:text-brand-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  مسح رقم التتبع
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  أدخل أو امسح رقم تتبع العودة للبدء في الفحص
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  يدعم: أرقام التتبع الأصلية • أرقام العودة • باركود الطرود
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Zap className="w-5 h-5 text-brand-red-600 dark:text-brand-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Scanner Input */}
        <div className="p-6">
          <form onSubmit={handleScanSubmit} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <ScanLine className="w-6 h-6 text-gray-400" />
              </div>
              <Input
                ref={inputRef}
                placeholder="أدخل رقم التتبع (أصلي أو عودة)..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full pr-12 pl-4 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 rounded-xl"
                disabled={isScanning || isProcessing}
                dir="ltr"
              />
            </div>

            {/* Camera View */}
            {isCameraOn && (
              <div className="relative rounded-xl overflow-hidden border-2 border-brand-red-200 dark:border-brand-red-800">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-64 object-cover" 
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="text-center text-white">
                    <QrCode className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">قم بتوجيه الكاميرا نحو الباركود</p>
                  </div>
                </div>
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!trackingNumber.trim() || isScanning || isProcessing}
              className="w-full py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-medium rounded-xl transition-colors"
            >
              {isScanning || isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>جاري المسح...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ScanLine className="w-5 h-5" />
                  <span>مسح المنتج</span>
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Recent Scans Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-red-600" />
          المسح الأخير
        </h3>
        
        {isLoadingRecent ? (
          <div className="flex items-center justify-center gap-2 text-gray-500 py-8">
            <Loader className="w-5 h-5 animate-spin" />
            <span>جاري تحميل المسح الأخير...</span>
          </div>
        ) : recentScans.length > 0 ? (
          <div className="space-y-3">
            {recentScans.map(scan => (
              <RecentScanItem key={scan.action_id} scan={scan} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد عمليات مسح حديثة</p>
          </div>
        )}
      </div>

      {/* Scan History Section */}
      {scanHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-red-600" />
            سجل المسح
          </h3>
          <div className="space-y-3">
            {scanHistory.map(scan => (
              <ScanHistoryItem key={scan.id} scan={scan} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner; 