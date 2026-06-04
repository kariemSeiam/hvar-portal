import { Plus, CheckCircle, Package, Check, X, RefreshCw, Send, Building, Settings, RotateCcw } from 'lucide-react';
import { getServiceStatusLabel, getServiceStatusLabelCompact, getServiceStatusBadgeColor, getServiceStatusIconName } from '../../utils/service/utils';

const ServiceStatusBadge = ({
    status,
    size = 'sm',
    showIcon = true,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full border transition-all duration-200';

    const sizes = {
        xs: 'px-2 py-0.5 text-[10px]',
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    const statusColor = getServiceStatusBadgeColor(status);
    const statusLabel = getServiceStatusLabel(status);
    const statusLabelCompact = getServiceStatusLabelCompact(status);
    const iconName = getServiceStatusIconName(status);

    // Map icon names to Lucide components
    const iconMap = {
        'Plus': Plus,
        'CheckCircle': CheckCircle,
        'Package': Package,
        'Check': Check,
        'X': X,
        'RefreshCw': RefreshCw,
        'Send': Send,
        'Building': Building,
        'Settings': Settings,
        'RotateCcw': RotateCcw
    };

    const IconComponent = iconMap[iconName] || Plus;

    // Show compact label when card is in smaller sizing (4-column grid)
    // Full label when card is in larger sizing (3-column grid)
    // Use lg breakpoint: on lg screens, cards can be in 4-column mode (smaller), show compact
    // On xl screens, cards are typically larger (3-column when sidebar expanded), show full
    // This ensures badges fit properly in smaller card widths
    
    return (
        <span
            className={`${baseClasses} ${statusColor} ${sizes[size]} ${className}`}
            {...props}
        >
            {showIcon && (
                <span className={`flex items-center justify-center flex-shrink-0 ${size === 'xs' ? 'ml-0.5 mr-0.5' : 'ml-1 mr-1'}`}>
                    <IconComponent className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                </span>
            )}
            {size === 'xs' ? (
                <span className="font-cairo font-semibold">{statusLabelCompact}</span>
            ) : (
                <>
                    <span className="font-cairo font-semibold hidden xl:inline">{statusLabel}</span>
                    <span className="font-cairo font-semibold xl:hidden">{statusLabelCompact}</span>
                </>
            )}
        </span>
    );
};

export default ServiceStatusBadge;
