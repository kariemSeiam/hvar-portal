import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Phone, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(phone, password, { remember: rememberMe });
  };

  const inputBase =
    'w-full min-h-[44px] sm:min-h-[48px] pr-11 pl-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-cairo text-base focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 dark:focus:ring-brand-blue-400 dark:focus:border-brand-blue-400 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed';

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8"
      dir="rtl"
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-0 right-0 w-[min(100%,480px)] h-[min(100%,420px)] bg-brand-blue-500/5 dark:bg-brand-blue-500/10 rounded-bl-[40%]" />
        <div className="absolute bottom-0 left-0 w-[min(100%,320px)] h-[min(100%,280px)] bg-brand-red-500/5 dark:bg-brand-red-500/10 rounded-tr-[30%]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-cairo">
            <span className="text-brand-red-600 dark:text-brand-red-400">Hvar</span>{' '}
            <span className="text-brand-blue-600 dark:text-brand-blue-400">Hub</span>
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-cairo">
            تسجيل الدخول للفريق
          </p>
        </div>

        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-red-500 via-brand-red-400 to-brand-blue-500 dark:from-brand-red-600 dark:via-brand-red-500 dark:to-brand-blue-600" aria-hidden />
          <div
            className="relative rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-800/95 shadow-xl dark:shadow-none transition-colors duration-300 p-5 sm:p-6 lg:p-8"
            style={{ boxShadow: '0 20px 40px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo mb-1.5">
                  رقم الهاتف
                </span>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 01xxxxxxxxx"
                    className={inputBase}
                    dir="ltr"
                    style={{ textAlign: 'right' }}
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-cairo mb-1.5">
                  كلمة المرور
                </span>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <Lock className="w-5 h-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded transition-colors"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputBase + ' pl-11'}
                    dir="ltr"
                    style={{ textAlign: 'right' }}
                  />
                </div>
              </label>

              {error && (
                <p className="text-sm text-brand-red-600 dark:text-brand-red-400 font-cairo bg-brand-red-50 dark:bg-brand-red-900/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <label className="flex items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400 font-cairo select-none">
                <span>تذكرني لمدة 30 يوم</span>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] sm:min-h-[48px] rounded-xl font-cairo font-semibold text-base bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800 text-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
