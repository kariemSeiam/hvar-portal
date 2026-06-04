import React from 'react';
import { Crown, Mail, Phone, PhoneCall, Users } from 'lucide-react';
import { cn } from '../../utils/tailwind';
import Card from './Card';

/**
 * TeamMemberCardHorizontal Component
 * Horizontal card design for displaying team members
 * Following HVAR DNA patterns
 * 
 * @param {Object} props
 * @param {string} props.name - Member name
 * @param {string} props.role - Member role (call-center, operator, manager)
 * @param {string} [props.phone] - Phone number
 * @param {string} [props.email] - Email address
 * @param {string} [props.avatar] - Avatar image URL
 * @param {string} [props.status='offline'] - Status (online, offline, busy, away)
 * @param {boolean} [props.isSelected=false] - Whether card is selected
 * @param {Function} [props.onClick] - Click handler
 * @param {boolean} [props.disabled=false] - Whether card is disabled
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {string} [props.className] - Additional classes
 */
const TeamMemberCardHorizontal = ({
  name,
  role,
  phone,
  email,
  avatar,
  status = 'offline',
  isSelected = false,
  onClick,
  disabled = false,
  isLoading = false,
  className = '',
  ...props
}) => {
  // Role configuration (DNA colors)
  const roleConfig = {
    'call-center': {
      label: 'خدمة العملاء',
      description: 'متابعة الطلبات والدعم',
      icon: PhoneCall,
      gradient: 'from-brand-blue-500 to-brand-blue-700',
      bg: 'bg-brand-blue-50 dark:bg-brand-blue-900/20',
      border: 'border-brand-blue-200 dark:border-brand-blue-800/40',
      text: 'text-brand-blue-700 dark:text-brand-blue-300',
    },
    'operator': {
      label: 'مشغل / محاسب',
      description: 'إدارة العمليات والمحاسبة',
      icon: Users,
      gradient: 'from-accent-purple-500 to-accent-purple-700',
      bg: 'bg-accent-purple-50 dark:bg-accent-purple-900/20',
      border: 'border-accent-purple-200 dark:border-accent-purple-800/40',
      text: 'text-accent-purple-700 dark:text-accent-purple-300',
    },
    'manager': {
      label: 'مدير / قائد فريق',
      description: 'الإشراف والتحكم',
      icon: Crown,
      gradient: 'from-brand-red-500 to-brand-red-700',
      bg: 'bg-brand-red-50 dark:bg-brand-red-900/20',
      border: 'border-brand-red-200 dark:border-brand-red-800/40',
      text: 'text-brand-red-700 dark:text-brand-red-300',
    },
  };

  const config = roleConfig[role] || roleConfig['operator'];
  const Icon = config.icon;

  // Status colors (DNA semantic colors)
  const statusColors = {
    online: 'bg-accent-green-500',
    offline: 'bg-gray-400 dark:bg-gray-500',
    busy: 'bg-accent-amber-500',
    away: 'bg-brand-blue-500',
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle click with disabled check
  const handleClick = (e) => {
    if (disabled || isLoading || !onClick) return;
    onClick(e);
  };

  // Handle keyboard interaction
  const handleKeyDown = (e) => {
    if (disabled || isLoading || !onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <Card
      variant={isSelected ? 'elevated' : 'default'}
      hover={!disabled && !isLoading}
      isClickable={!!onClick && !disabled && !isLoading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative transition-all duration-300', // DNA NORMAL timing
        'hover:scale-[1.02] active:scale-[0.98]', // DNA micro-interactions
        isSelected && 'ring-2 ring-brand-red-500 shadow-red',
        disabled && 'opacity-50 cursor-not-allowed',
        isLoading && 'opacity-75 pointer-events-none',
        className
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled && !isLoading ? 0 : undefined}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg z-10">
          <div className="w-6 h-6 border-2 border-t-brand-red-600 border-gray-200 dark:border-gray-700 rounded-full animate-spin" />
        </div>
      )}

      {/* Horizontal Layout */}
      <div className="flex items-center gap-4">
        {/* Avatar Section - Left */}
        <div className="flex-shrink-0 relative">
          <div
            className={cn(
              'h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md', // DNA shadow-md
              `bg-gradient-to-br ${config.gradient}`
            )}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="h-full w-full rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="font-cairo">{getInitials(name)}</span>
            )}
          </div>
          
          {/* Status Indicator */}
          <div
            className={cn(
              'absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white dark:border-gray-900',
              statusColors[status]
            )}
            aria-label={`الحالة: ${status === 'online' ? 'متصل' : status === 'offline' ? 'غير متصل' : status === 'busy' ? 'مشغول' : 'بعيد'}`}
          />
        </div>

        {/* Content Section - Right */}
        <div className="flex-1 min-w-0">
          {/* Name and Role Row */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-cairo truncate">
              {name}
            </h3>
            
            {/* Role Badge */}
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0',
                config.bg,
                config.text
              )}
            >
              <Icon className="h-3 w-3" aria-hidden="true" />
              <span>{config.label}</span>
            </div>
          </div>

          {/* Role Description */}
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-tajawal">
            {config.description}
          </p>

          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
            {phone && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 min-w-0">
                <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-500 dark:text-gray-500" aria-hidden="true" />
                <span className="truncate" dir="ltr">{phone}</span>
              </div>
            )}
            
            {email && (
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 min-w-0">
                <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-500 dark:text-gray-500" aria-hidden="true" />
                <span className="truncate" dir="ltr">{email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Selection Indicator - Right Edge */}
        {isSelected && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 rounded-full bg-brand-red-500 animate-pulse" aria-label="محدد" />
          </div>
        )}
      </div>
    </Card>
  );
};

TeamMemberCardHorizontal.displayName = 'TeamMemberCardHorizontal';

export default TeamMemberCardHorizontal;
