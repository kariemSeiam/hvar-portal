import React from 'react';
import { useDesignSystem } from '@/design_system/DesignSystemProvider';

export const Footer = () => {
  const { darkMode, dir } = useDesignSystem();

  return (
    <footer 
      className="bg-gray-900 dark:bg-gray-950 text-white border-t border-gray-800 dark:border-gray-700"
      role="contentinfo"
      dir={dir}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className={`text-xl font-bold mb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>هفار للأجهزة المنزلية</h3>
            <p className={`text-gray-300 mb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              نقدم أفضل الأجهزة المنزلية بجودة عالية وأسعار منافسة. 
              نضمن لكم الرضا التام مع خدمة عملاء متميزة.
            </p>
            <div className={`flex items-center space-x-4 rtl:space-x-reverse ${dir === 'rtl' ? 'justify-end' : 'justify-start'}`}>
              <a 
                href="tel:01204444196" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
                aria-label="اتصل بنا: 01204444196"
              >
                📞 01204444196
              </a>
              <a 
                href="mailto:info@hvarstore.com" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
                aria-label="راسلنا عبر البريد الإلكتروني"
              >
                ✉️ info@hvarstore.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`text-lg font-semibold mb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>روابط سريعة</h4>
            <ul className={`space-y-2 rtl:space-y-reverse ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              <li>
                <a 
                  href="#featured" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  المنتجات المميزة
                </a>
              </li>
              <li>
                <a 
                  href="#categories" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  أقسام المنتجات
                </a>
              </li>
              <li>
                <a 
                  href="#reviews" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  مراجعات البلوجرز
                </a>
              </li>
              <li>
                <a 
                  href="#support" 
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  الدعم الفني
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className={`text-lg font-semibold mb-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>تابعنا</h4>
            <div className={`flex space-x-4 rtl:space-x-reverse ${dir === 'rtl' ? 'justify-end' : 'justify-start'}`}>
              <a 
                href="https://facebook.com/hvarstore" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-blue-400 transition-colors"
                aria-label="تابعنا على فيسبوك"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/hvarstore" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-pink-400 transition-colors"
                aria-label="تابعنا على انستغرام"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                </svg>
              </a>
              <a 
                href="https://youtube.com/hvarstore" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-red-400 transition-colors"
                aria-label="تابعنا على يوتيوب"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center text-gray-400 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <p>&copy; {new Date().getFullYear()} هفار للأجهزة المنزلية. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};
