import React, { useState } from 'react';
import { AlertTriangle, X, Package, AlertCircle, Info } from 'lucide-react';

const AlertChip = ({ alerts = [], onDismiss, onNavigate }) => {
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

    // Filter out dismissed alerts
    const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

    if (activeAlerts.length === 0) return null;

    const criticalAlerts = activeAlerts.filter(alert => alert.level === 'critical');
    const warningAlerts = activeAlerts.filter(alert => alert.level === 'warning');
    const infoAlerts = activeAlerts.filter(alert => alert.level === 'info');

    const getAlertIcon = (level) => {
        switch (level) {
            case 'critical':
                return <AlertCircle className="w-4 h-4" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4" />;
            default:
                return <Info className="w-4 h-4" />;
        }
    };

    const getAlertColor = (level) => {
        switch (level) {
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700';
            case 'warning':
                return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700';
        }
    };

    const handleDismiss = (alertId) => {
        setDismissedAlerts(prev => new Set([...prev, alertId]));
        if (onDismiss) onDismiss(alertId);
    };

    const handleAlertClick = (alert) => {
        if (onNavigate && alert.item) {
            // Navigate to appropriate tab based on item type
            if (alert.item.type === 'product') {
                onNavigate('products');
            } else if (alert.item.type === 'part') {
                onNavigate('parts');
            } else if (alert.item.type === 'movement') {
                onNavigate('movements');
            }
        }
    };

    const totalAlerts = activeAlerts.length;

    return (
        <div className="flex items-center space-x-2 space-x-reverse">
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
                <div
                    className={`flex items-center space-x-1 space-x-reverse px-2 py-1 rounded-full border text-xs font-medium font-cairo cursor-pointer hover:opacity-80 transition-opacity ${getAlertColor('critical')}`}
                    title={`${criticalAlerts.length} تنبيه حرج - انقر للانتقال`}
                    onClick={() => handleAlertClick(criticalAlerts[0])}
                >
                    {getAlertIcon('critical')}
                    <span>{criticalAlerts.length}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(criticalAlerts[0].id);
                        }}
                        className="hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Warning Alerts */}
            {warningAlerts.length > 0 && (
                <div
                    className={`flex items-center space-x-1 space-x-reverse px-2 py-1 rounded-full border text-xs font-medium font-cairo cursor-pointer hover:opacity-80 transition-opacity ${getAlertColor('warning')}`}
                    title={`${warningAlerts.length} تنبيه تحذيري - انقر للانتقال`}
                    onClick={() => handleAlertClick(warningAlerts[0])}
                >
                    {getAlertIcon('warning')}
                    <span>{warningAlerts.length}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(warningAlerts[0].id);
                        }}
                        className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Info Alerts */}
            {infoAlerts.length > 0 && (
                <div
                    className={`flex items-center space-x-1 space-x-reverse px-2 py-1 rounded-full border text-xs font-medium font-cairo cursor-pointer hover:opacity-80 transition-opacity ${getAlertColor('info')}`}
                    title={`${infoAlerts.length} تنبيه معلوماتي - انقر للانتقال`}
                    onClick={() => handleAlertClick(infoAlerts[0])}
                >
                    {getAlertIcon('info')}
                    <span>{infoAlerts.length}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(infoAlerts[0].id);
                        }}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AlertChip;
