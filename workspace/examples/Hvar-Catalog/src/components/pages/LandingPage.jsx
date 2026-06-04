import React from 'react';
import { useDesignSystem } from '../../design_system/DesignSystemProvider';
import { HeroSection } from '../content/HeroSection';
import { useProducts } from '../../hooks/useProducts';
import CategorySection from '../product/CategorySection';
import { SparklesIcon, StarIcon, ShieldCheckIcon, BoltIcon, PlayIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export const LandingPage = () => {
  const { darkMode, dir } = useDesignSystem();
  const { products, loading, error } = useProducts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950" dir={dir} lang="ar">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Products Section - Creative & Compact */}
      <section id="featured" className="relative py-12 lg:py-16 overflow-hidden">
        {/* Creative Background Elements */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className={`absolute top-10 ${dir === 'rtl' ? 'right-10' : 'left-10'} w-20 h-20 bg-gradient-to-br from-red-200/20 to-red-300/20 dark:from-red-800/10 dark:to-red-700/10 rounded-full blur-xl animate-pulse`}></div>
          <div className={`absolute bottom-10 ${dir === 'rtl' ? 'left-10' : 'right-10'} w-16 h-16 bg-gradient-to-br from-blue-200/20 to-blue-300/20 dark:from-blue-800/10 dark:to-blue-700/10 rounded-full blur-xl animate-pulse`} style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Creative Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-full border border-red-200 dark:border-red-700/30 shadow-sm mb-4">
              <SparklesIcon className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">المنتجات المميزة</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
              <span className="bg-gradient-to-r from-slate-900 via-red-600 to-red-700 dark:from-white dark:via-red-400 dark:to-red-500 bg-clip-text text-transparent">
                اكتشف أفضل منتجاتنا
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              بأسعار منافسة وجودة عالية مع ضمان شامل
            </p>
          </div>
          
          <CategorySection
            products={products.filter(p => p.featured)}
            loading={loading}
            error={error}
            compact={true}
          />
        </div>
      </section>

      {/* All Products by Category Section - Creative & Compact */}
      <section id="categories" className="relative py-12 lg:py-16 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden">
        {/* Creative Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(239,68,68,0.15)_1px,transparent_0)] bg-[length:24px_24px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Creative Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full border border-blue-200 dark:border-blue-700/30 shadow-sm mb-4">
              <StarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">جميع المنتجات</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
              <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-blue-700 dark:from-white dark:via-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                تصفح حسب الفئة
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              مع التفاصيل المهمة للتجار والمواصفات الكاملة
            </p>
          </div>
          
          <CategorySection
            products={products}
            loading={loading}
            error={error}
            compact={true}
          />
        </div>
      </section>

      {/* Reviews Section - Creative & Compact */}
      <section id="reviews" className="relative py-12 lg:py-16 overflow-hidden">
        {/* Creative Background Elements */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className={`absolute top-20 ${dir === 'rtl' ? 'right-20' : 'left-20'} w-24 h-24 bg-gradient-to-br from-purple-200/20 to-purple-300/20 dark:from-purple-800/10 dark:to-purple-700/10 rounded-full blur-xl animate-pulse`}></div>
          <div className={`absolute bottom-20 ${dir === 'rtl' ? 'left-20' : 'right-20'} w-20 h-20 bg-gradient-to-br from-green-200/20 to-green-300/20 dark:from-green-800/10 dark:to-green-700/10 rounded-full blur-xl animate-pulse`} style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Creative Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-full border border-purple-200 dark:border-purple-700/30 shadow-sm mb-4">
              <StarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">مراجعات البلوجرز</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
              <span className="bg-gradient-to-r from-slate-900 via-purple-600 to-purple-700 dark:from-white dark:via-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                شاهد آراء عملائنا
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              تعرف على تجارب المستخدمين مع منتجاتنا
            </p>
          </div>
          
          {/* Creative Coming Soon Card */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 transform hover:rotate-1 transition-transform duration-500 border border-white/20 dark:border-gray-700/50">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/10 rounded-3xl"></div>
              
              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <PlayIcon className="w-10 h-10 text-white" aria-hidden="true" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    قريباً - مراجعات البلوجرز
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    سنقوم بإضافة مراجعات البلوجرز قريباً لتقديم تجربة أفضل لعملائنا
                  </p>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className={`absolute w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-300 dark:to-orange-400 rounded-2xl flex items-center justify-center shadow-lg animate-float ${dir === 'rtl' ? '-top-3 -left-3' : '-top-3 -right-3'}`}>
                <StarIcon className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              
              <div className={`absolute w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-300 dark:to-green-400 rounded-xl flex items-center justify-center shadow-lg animate-float ${dir === 'rtl' ? '-bottom-3 -right-3' : '-bottom-3 -left-3'}`} style={{ animationDelay: '1s' }}>
                <BoltIcon className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section - Creative & Compact */}
      <section id="support" className="relative py-12 lg:py-16 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden">
        {/* Creative Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:24px_24px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Creative Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-full border border-blue-200 dark:border-blue-700/30 shadow-sm mb-4">
              <ShieldCheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">الدعم الفني</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
              <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-blue-700 dark:from-white dark:via-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                نحن هنا لمساعدتك
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              خدمة دعم فني متكاملة على مدار الساعة
            </p>
          </div>
          
          {/* Creative Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheckIcon,
                title: "ضمان شامل",
                description: "جميع منتجاتنا مضمونة بضمان شامل يغطي جميع الأجزاء والقطع",
                gradient: "from-blue-500 to-blue-600",
                bgGradient: "from-blue-100 to-blue-200",
                darkBgGradient: "from-blue-900/30 to-blue-800/30"
              },
              {
                icon: BoltIcon,
                title: "خدمة عملاء 24/7",
                description: "فريق دعم متاح على مدار الساعة للإجابة على جميع استفساراتكم",
                gradient: "from-green-500 to-green-600",
                bgGradient: "from-green-100 to-green-200",
                darkBgGradient: "from-green-900/30 to-green-800/30"
              },
              {
                icon: StarIcon,
                title: "صيانة وإصلاح",
                description: "خدمات صيانة وإصلاح احترافية مع ضمان الجودة والأداء",
                gradient: "from-purple-500 to-purple-600",
                bgGradient: "from-purple-100 to-purple-200",
                darkBgGradient: "from-purple-900/30 to-purple-800/30"
              }
            ].map((service, index) => (
              <div key={index} className="group relative">
                <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 transform hover:scale-105 hover:-rotate-1 transition-all duration-500 border border-white/20 dark:border-gray-700/50">
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.bgGradient} dark:${service.darkBgGradient} rounded-2xl opacity-20`}></div>
                  
                  <div className="relative z-10 text-center space-y-4">
                    <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${service.gradient} dark:${service.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <service.icon className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {service.title}
                    </h3>
                    
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Creative & Compact */}
      <section id="contact" className="relative py-12 lg:py-16 overflow-hidden">
        {/* Creative Background Elements */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className={`absolute top-10 ${dir === 'rtl' ? 'right-10' : 'left-10'} w-20 h-20 bg-gradient-to-br from-red-200/20 to-red-300/20 dark:from-red-800/10 dark:to-red-700/10 rounded-full blur-xl animate-pulse`}></div>
          <div className={`absolute bottom-10 ${dir === 'rtl' ? 'left-10' : 'right-10'} w-16 h-16 bg-gradient-to-br from-green-200/20 to-green-300/20 dark:from-green-800/10 dark:to-green-700/10 rounded-full blur-xl animate-pulse`} style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Creative Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-full border border-red-200 dark:border-red-700/30 shadow-sm mb-4">
              <StarIcon className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">اتصل بنا</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
              <span className="bg-gradient-to-r from-slate-900 via-red-600 to-red-700 dark:from-white dark:via-red-400 dark:to-red-500 bg-clip-text text-transparent">
                نحن هنا للإجابة
              </span>
            </h2>
            
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              على جميع استفساراتكم وتقديم أفضل خدمة
            </p>
          </div>
          
          {/* Creative Contact Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="text-center lg:text-right">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                معلومات الاتصال
              </h3>
              
              <div className="space-y-4">
                {[
                  { icon: "📞", label: "الهاتف", value: "01204444196", href: "tel:01204444196", color: "blue" },
                  { icon: "✉️", label: "البريد الإلكتروني", value: "info@hvarstore.com", href: "mailto:info@hvarstore.com", color: "red" },
                  { icon: "💬", label: "واتساب", value: "+20 120 444 4196", href: "https://wa.me/201204444196", color: "green" }
                ].map((contact, index) => (
                  <div key={index} className="flex items-center justify-center lg:justify-end space-x-4 rtl:space-x-reverse">
                    <div className={`w-12 h-12 bg-gradient-to-br from-${contact.color}-100 to-${contact.color}-200 dark:from-${contact.color}-900/30 dark:to-${contact.color}-800/30 rounded-xl flex items-center justify-center`}>
                      <span className="text-2xl">{contact.icon}</span>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white text-lg">
                        {contact.label}
                      </p>
                      <a 
                        href={contact.href} 
                        target={contact.href.startsWith('http') ? '_blank' : undefined}
                        rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className={`text-${contact.color}-600 dark:text-${contact.color}-400 hover:text-${contact.color}-700 dark:hover:text-${contact.color}-300 text-lg font-medium transition-colors`}
                      >
                        {contact.value}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Working Hours */}
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                ساعات العمل
              </h3>
              
              <div className="space-y-3">
                {[
                  { day: "الأحد - الخميس", time: "9:00 ص - 6:00 م" },
                  { day: "الجمعة", time: "9:00 ص - 2:00 م" },
                  { day: "السبت", time: "مغلق" }
                ].map((schedule, index) => (
                  <div key={index} className="bg-white/50 dark:bg-gray-700/50 p-4 rounded-xl backdrop-blur-sm border border-white/20 dark:border-gray-600/30">
                    <p className="text-slate-900 dark:text-white">
                      <span className="font-bold text-lg">{schedule.day}</span>
                      <span className="text-slate-600 dark:text-slate-400 block mt-1">{schedule.time}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
