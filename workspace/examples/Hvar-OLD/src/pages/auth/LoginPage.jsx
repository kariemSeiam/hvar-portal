import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Eye, EyeOff, Lock, Mail, Moon, Phone, PhoneCall, Sun, User, Users } from 'lucide-react';

import { Logo } from '../../components/layout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useTheme } from '../../components/ui/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/tailwind';

// Role configurations
const roles = [
  {
    id: 'call-center',
    name: 'خدمة العملاء',
    description: 'متابعة الطلبات والدعم',
    icon: PhoneCall,
    gradient: 'from-brand-blue-500 to-brand-blue-700',
    bg: 'bg-brand-blue-50 dark:bg-brand-blue-900/20',
    border: 'border-brand-blue-200 dark:border-brand-blue-800/40',
    text: 'text-brand-blue-700 dark:text-brand-blue-300',
  },
  {
    id: 'operator',
    name: 'مشغل / محاسب',
    description: 'إدارة العمليات والمحاسبة',
    icon: Users,
    gradient: 'from-accent-purple-500 to-accent-purple-700',
    bg: 'bg-accent-purple-50 dark:bg-accent-purple-900/20',
    border: 'border-accent-purple-200 dark:border-accent-purple-800/40',
    text: 'text-accent-purple-700 dark:text-accent-purple-300',
  },
  {
    id: 'manager',
    name: 'مدير / قائد فريق',
    description: 'الإشراف والتحكم',
    icon: Crown,
    gradient: 'from-brand-red-500 to-brand-red-700',
    bg: 'bg-brand-red-50 dark:bg-brand-red-900/20',
    border: 'border-brand-red-200 dark:border-brand-red-800/40',
    text: 'text-brand-red-700 dark:text-brand-red-300',
  },
];

/**
 * Perfect HVAR Login Page
 * Logo at top end, vertical role cards | horizontal login form
 * Following HVAR design DNA
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { login, isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id || 'operator');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifierType, setIdentifierType] = useState('auto');
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  // Detect identifier type
  const detectIdentifierType = (value) => {
    if (!value) return 'auto';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
    if (/^(\+20|0)?1[0125][0-9]{8}$/.test(value.replace(/\s/g, ''))) return 'phone';
    return 'username';
  };

  // Get identifier icon
  const getIdentifierIcon = () => {
    const type = identifierType === 'auto' ? detectIdentifierType(identifier) : identifierType;
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setErrors({});
    
    // Validation
    if (!identifier.trim()) {
      setErrors({ identifier: 'هذا الحقل مطلوب' });
      setIsLoading(false);
      return;
    }
    if (!password) {
      setErrors({ password: 'كلمة المرور مطلوبة' });
      setIsLoading(false);
      return;
    }
    
    try {
      const detectedType = detectIdentifierType(identifier);
      const { success, error } = await login(identifier.trim(), password, selectedRole);
      
      if (success) {
        navigate('/');
      } else {
        setErrors({
          form: error || 'فشل تسجيل الدخول. الرجاء التحقق من بيانات الاعتماد الخاصة بك.'
        });
      }
    } catch (error) {
      setErrors({
        form: 'حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle identifier change
  const handleIdentifierChange = (e) => {
    const value = e.target.value;
    setIdentifier(value);
    setErrors({ ...errors, identifier: '' });
    if (value) {
      setIdentifierType(detectIdentifierType(value));
    } else {
      setIdentifierType('auto');
    }
  };
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-brand-red-50 via-white to-brand-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Ambient blobs */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-red-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-blue-500/20 blur-3xl" />

      {/* Top bar */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" showText={true} />
          </div>
          <button
            onClick={toggleTheme}
            className={cn(
              'p-2 rounded-lg transition-all duration-200',
              'bg-white/70 dark:bg-gray-800/70 backdrop-blur',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-white dark:hover:bg-gray-700',
              'hover:scale-105 active:scale-95',
              'border border-gray-200/70 dark:border-gray-700/70',
              'focus:outline-none focus:ring-2 focus:ring-brand-red-500/50 focus:ring-offset-1'
            )}
            aria-label={isDark ? 'تبديل إلى الوضع المضيء' : 'تبديل إلى الوضع الداكن'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          {/* Left: Brand + Roles */}
          <div className="rounded-2xl border border-white/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/70 backdrop-blur shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-red-200/70 dark:border-brand-red-900/50 bg-brand-red-50/70 dark:bg-brand-red-900/20 px-3 py-1 text-xs font-semibold text-brand-red-700 dark:text-brand-red-300">
                منصة HVAR
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-cairo">
                تسجيل الدخول إلى <span className="bg-gradient-to-l from-brand-red-600 to-brand-blue-500 bg-clip-text text-transparent">لوحة التحكم</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                اختر الدور المناسب للوصول إلى الأدوات والخدمات المخصصة لك.
              </p>
            </div>

            <div className="space-y-2">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = role.id === selectedRole;

                return (
                  <div
                    key={role.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRole(role.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedRole(role.id);
                      }
                    }}
                    className={cn(
                      'group relative rounded-xl border p-3 cursor-pointer transition-all duration-300 backdrop-blur',
                      'hover:shadow-sm hover:scale-[1.01] active:scale-[0.98]',
                      isSelected
                        ? `bg-white/90 dark:bg-gray-800/85 border-2 ${role.border} shadow-sm`
                        : 'bg-white/70 dark:bg-gray-800/70 border-gray-200/70 dark:border-gray-700/70 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex-shrink-0 p-2 rounded-lg shadow-sm ring-1 ring-white/60 dark:ring-gray-900/30',
                        `bg-gradient-to-br ${role.gradient}`
                      )}>
                        <Icon className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          'text-sm sm:text-base font-semibold font-cairo',
                          isSelected ? role.text : 'text-gray-900 dark:text-white'
                        )}>
                          {role.name}
                        </h3>
                        <p className={cn(
                          'text-xs sm:text-sm mt-0.5 leading-snug',
                          isSelected ? role.text + ' opacity-80' : 'text-gray-600 dark:text-gray-400'
                        )}>
                          {role.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-brand-red-500 to-brand-red-600">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Login form */}
          <div className="rounded-2xl border border-white/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-cairo">مرحباً بعودتك</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">أدخل بياناتك للوصول السريع</p>
            </div>

            {errors.form && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2.5">
                <p className="text-xs text-red-800 dark:text-red-200 text-center">{errors.form}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                label="اسم المستخدم / رقم الهاتف / البريد الإلكتروني"
                placeholder="أدخل بياناتك"
                value={identifier}
                onChange={handleIdentifierChange}
                error={errors.identifier}
                required
                leftIcon={getIdentifierIcon()}
                disabled={isLoading}
                autoComplete="username"
                dir="ltr"
                className="text-left"
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                label="كلمة المرور"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: '' });
                }}
                error={errors.password}
                required
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    tabIndex={0}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                disabled={isLoading}
                autoComplete="current-password"
                dir="ltr"
                className="text-left"
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                disabled={isLoading}
                className="mt-1"
              >
                تسجيل الدخول
              </Button>
            </form>

            <details className="pt-3 border-t border-gray-200/80 dark:border-gray-700/80">
              <summary className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors text-center">
                بيانات تجريبية
              </summary>
              <div className="mt-2 space-y-1 text-xs">
                {selectedRole === 'call-center' && (
                  <>
                    <div className="text-center p-2 rounded bg-gray-50/80 dark:bg-gray-800/50 font-mono text-gray-700 dark:text-gray-300">callcenter@example.com</div>
                    <div className="text-center p-2 rounded bg-gray-50/80 dark:bg-gray-800/50 font-mono text-gray-700 dark:text-gray-300">01012345678</div>
                    <div className="text-center p-2 rounded bg-gray-50/80 dark:bg-gray-800/50 font-mono text-gray-700 dark:text-gray-300">callcenter1</div>
                  </>
                )}
                {selectedRole === 'operator' && (
                  <>
                    <div className="text-center p-2 rounded bg-gray-50/80 dark:bg-gray-800/50 font-mono text-gray-700 dark:text-gray-300">operator@example.com</div>
                    <div className="text-center p-2 rounded bg-gray-50/80 dark:bg-gray-800/50 font-mono text-gray-700 dark:text-gray-300">01011111111</div>
                    <div className="text-center p-2 rounded bg-gray-50/80 dark:bg-gray-800/50 font-mono text-gray-700 dark:text-gray-300">operator1</div>
                  </>
                )}
                {selectedRole === 'manager' && (
                  <>
                    <div className="text-center p-2 rounded bg-gray-50/80 dark:bg-gray-800/50 font-mono text-gray-700 dark:text-gray-300">manager@example.com</div>
                    <div className="text-center p-2 rounded bg-gray-50/80 dark:bg-gray-800/50 font-mono text-gray-700 dark:text-gray-300">admin@example.com</div>
                    <div className="text-center p-2 rounded bg-gray-50/80 dark:bg-gray-800/50 font-mono text-gray-700 dark:text-gray-300">manager1</div>
                  </>
                )}
                <p className="text-center mt-1.5 text-xs text-gray-500 dark:text-gray-400">كلمة المرور: password123</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
