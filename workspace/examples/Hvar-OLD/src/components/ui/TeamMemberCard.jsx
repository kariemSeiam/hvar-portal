import React from 'react';
import { User, Phone, Mail, Shield, Crown, Users } from 'lucide-react';
import { cn } from '../../utils/tailwind';
import Card from './Card';

/**
 * TeamMemberCard Component
 * Perfect, clean card design for displaying team members
 * 
 * @param {Object} props
 * @param {string} props.name - Member name
 * @param {string} props.role - Member role (call-center, operator, manager)
 * @param {string} [props.phone] - Phone number
 * @param {string} [props.email] - Email address
 * @param {string} [props.avatar] - Avatar image URL
 * @param {string} [props.status] - Status (online, offline, busy, away)
 * @param {boolean} [props.isSelected=false] - Whether card is selected
 * @param {Function} [props.onClick] - Click handler
 */
const TeamMemberCard = ({
  name,
  role,
  phone,
  email,
  avatar,
  status = 'offline',
  isSelected = false,
  onClick,
  className = '',
}) => {
  // Role configuration
  const roleConfig = {
    'call-center': {
      label: 'خدمة العملاء',
      icon: Phone,
      gradient: 'from-brand-blue-500 to-brand-blue-700',
      bg: 'bg-brand-blue-50 dark:bg-brand-blue-900/20',
      text: 'text-brand-blue-700 dark:text-brand-blue-300',
    },
    'operator': {
      label: 'مشغل / محاسب',
      icon: Users,
      gradient: 'from-accent-purple-500 to-accent-purple-700',
      bg: 'bg-accent-purple-50 dark:bg-accent-purple-900/20',
      text: 'text-accent-purple-700 dark:text-accent-purple-300',
    },
    'manager': {
      label: 'مدير / قائد فريق',
      icon: Crown,
      gradient: 'from-brand-red-500 to-brand-red-700',
      bg: 'bg-brand-red-50 dark:bg-brand-red-900/20',
      text: 'text-brand-red-700 dark:text-brand-red-300',
    },
  };

  const config = roleConfig[role] || roleConfig['operator'];
  const Icon = config.icon;

  // Status colors
  const statusColors = {
    online: 'bg-accent-green-500',
    offline: 'bg-gray-400',
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

  return (
    <Card
      variant={isSelected ? 'elevated' : 'default'}
      hover={true}
      isClickable={!!onClick}
      onClick={onClick}
      className={cn(
        'relative transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        isSelected && 'ring-2 ring-brand-red-500 shadow-red',
        className
      )}
    >
      {/* Role Badge */}
      <div className="absolute top-3 left-3 rtl:right-3 rtl:left-auto">
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            config.bg,
            config.text
          )}
        >
          <Icon className="h-3 w-3" />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center pt-8 pb-4">
        <div className="relative">
          <div
            className={cn(
              'h-20 w-20 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg',
              `bg-gradient-to-br ${config.gradient}`
            )}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span>{getInitials(name)}</span>
            )}
          </div>
          
          {/* Status Indicator */}
          <div
            className={cn(
              'absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-white dark:border-gray-900',
              statusColors[status]
            )}
          />
        </div>

        {/* Name */}
        <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
          {name}
        </h3>
      </div>

      {/* Details Section */}
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        {phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{phone}</span>
          </div>
        )}
        
        {email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 rtl:left-2 rtl:right-auto">
          <div className="h-2 w-2 rounded-full bg-brand-red-500 animate-pulse" />
        </div>
      )}
    </Card>
  );
};

export default TeamMemberCard;
