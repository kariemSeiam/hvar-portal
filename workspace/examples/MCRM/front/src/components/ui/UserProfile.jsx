import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Crown, Briefcase, Headphones, ShieldCheck, User, LogOut } from 'lucide-react';

/**
 * UserProfile - Header Identity Pill
 * Click to open dropdown with logout.
 */
const UserProfile = ({ className = "" }) => {
  const { userInfo, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login', { replace: true });
  };

  const ROLE_MAP = {
    owner: {
      label: 'المالك',
      icon: <Crown className="w-4 h-4 text-white" />,
      gradient: 'from-amber-500 to-orange-600',
      badge: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700',
    },
    accountant: {
      label: 'المحاسب',
      icon: <Briefcase className="w-4 h-4 text-white" />,
      gradient: 'from-emerald-500 to-teal-600',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700',
    },
    agent: {
      label: 'خدمة العملاء',
      icon: <Headphones className="w-4 h-4 text-white" />,
      gradient: 'from-teal-500 to-teal-600',
      badge: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-700',
    },
    team_leader: {
      label: 'قائد الفريق',
      icon: <ShieldCheck className="w-4 h-4 text-white" />,
      gradient: 'from-blue-500 to-blue-600',
      badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
    },
    default: {
      label: 'موظف',
      icon: <User className="w-4 h-4 text-white" />,
      gradient: 'from-gray-500 to-gray-600',
      badge: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
    },
  };

  const role = ROLE_MAP[userInfo?.role] || ROLE_MAP.default;

  return (
    <div ref={ref} className={`relative flex items-center space-x-2.5 space-x-reverse ${className}`} dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center space-x-2.5 space-x-reverse rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 p-1 -m-1 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar Icon */}
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 lg:w-9 lg:h-9 bg-gradient-to-br ${role.gradient} rounded-lg flex items-center justify-center shadow-md`}>
            {userInfo?.avatar ? (
              <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              role.icon
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
        </div>

        {/* Text — hidden on mobile */}
        <div className="hidden lg:flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-900 dark:text-white font-cairo leading-tight truncate max-w-[120px]">
            {userInfo?.name || 'المستخدم'}
          </span>
          <span className={`mt-0.5 inline-flex items-center space-x-1 space-x-reverse px-2 py-0.5 rounded-full border text-[11px] font-medium font-cairo ${role.badge}`}>
            {role.label}
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full end-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1 z-50">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-right text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-cairo text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
