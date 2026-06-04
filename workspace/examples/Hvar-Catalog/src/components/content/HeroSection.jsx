import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDesignSystem } from '@/design_system/DesignSystemProvider';
import { 
  BoltIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  HeartIcon,
  StarIcon,
  ShieldCheckIcon,
  TruckIcon,
  ClockIcon,
  ChartBarIcon,
  MapPinIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export const HeroSection = () => {
  const { darkMode, dir } = useDesignSystem();
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  // Strategic HVAR Products - Focused on Market Advantages for Dealers
  const hvarProducts = useMemo(() => [
    {
      id: 6,
      sku: "hvar5070p5",
      model: "5070",
      name: "كبه هفار 6.5 لتر 2000 وات احمر",
      power: "2000W",
      capacity: "6.5L",
      speeds: 2,
      warranty: 12,
      tag: "الأكثر طلباً",
      marketGap: "فجوة سوقية فريدة: 2000W + 6.5L",
      dealerAdvantage: "منتج فريد لا يوجد له منافس مباشر",
      targetMarket: "العائلات الكبيرة والمطاعم الصغيرة",
      image: "https://hvarstore.com/public/uploads/all/FS3vVdC9RCpmsArR1dXjGoiJJpFZEJaNf0ekgqVn.jpg",
      gradient: "from-red-500 to-red-700"
    },
    {
      id: 7,
      sku: "hvar5073",
      model: "5073", 
      name: "كبه هفار 6.5 لتر 2000 وات 3 سرعات",
      power: "2000W",
      capacity: "6.5L",
      speeds: 3,
      warranty: 12,
      tag: "الأحدث",
      marketGap: "ميزة تقنية متقدمة في فئة 2000W",
      dealerAdvantage: "3 سرعات مقابل 2 سرعة في المنافسين",
      targetMarket: "الطهاة المحترفين والعائلات المتطلبة",
      image: "https://hvarstore.com/public/uploads/all/YE0TkZ8fgsBiQ7mbFQsPBD5ErIy2aLCWeFIaFfF3.jpg",
      gradient: "from-orange-500 to-red-600"
    },
    {
      id: 8,
      sku: "hvar5077",
      model: "5077",
      name: "كبه هفار 2000 وات بلاك",
      power: "2000W",
      capacity: "متعددة الاستخدامات",
      speeds: 2,
      warranty: 12,
      tag: "احترافي",
      marketGap: "قوة عالية للاستخدام التجاري",
      dealerAdvantage: "مناسب للمطاعم والكافيهات",
      targetMarket: "القطاع التجاري والمؤسسات",
      image: "https://hvarstore.com/public/uploads/all/YE0TkZ8fgsBiQ7mbFQsPBD5ErIy2aLCWeFIaFfF3.jpg",
      gradient: "from-gray-700 to-gray-900"
    }
  ], []);

  // Dealer-Focused Hero Stats - Business Benefits
  const dealerStats = useMemo(() => [
    { 
      number: 'فجوة', 
      label: 'سوقية فريدة', 
      icon: ChartBarIcon,
      description: '2000W + 6.5L لا يوجد منافس',
      gradient: "from-red-400 to-pink-500"
    },
    { 
      number: 'قطع غيار', 
      label: 'محلية متوفرة', 
      icon: CogIcon,
      description: 'خدمة سريعة وصيانة سهلة',
      gradient: "from-blue-400 to-cyan-500"
    },
    { 
      number: 'سعر', 
      label: 'تنافسي', 
      icon: StarIcon,
      description: 'أفضل قيمة مقابل المواصفات',
      gradient: "from-green-400 to-emerald-500"
    }
  ], []);

  // Performance-optimized event handlers
  const handleContactClick = useCallback(() => {
    window.open('https://wa.me/201204444196', '_blank');
  }, []);

  const nextProduct = useCallback(() => {
    setActiveProductIndex((prev) => (prev + 1) % hvarProducts.length);
  }, [hvarProducts.length]);

  const prevProduct = useCallback(() => {
    setActiveProductIndex((prev) => (prev - 1 + hvarProducts.length) % hvarProducts.length);
  }, [hvarProducts.length]);

  // Intersection Observer for performance optimization
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const activeProduct = hvarProducts[activeProductIndex];

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center"
      dir={dir}
      lang="ar"
      role="banner"
      aria-label="القسم الرئيسي - منتجات هفار للتجار"
    >
      {/* Minimal Background - Subtle and Clean */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Very Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(239,68,68,0.03)_1px,transparent_0)] bg-[length:64px_64px]"></div>
        </div>
        
        {/* Single Subtle Floating Element */}
        <div className={`absolute top-32 ${dir === 'rtl' ? 'left-32' : 'right-32'} w-32 h-32 bg-gradient-to-br from-red-200/5 via-red-300/5 to-red-400/5 dark:from-red-800/3 dark:via-red-700/3 dark:to-red-600/3 rounded-full blur-3xl`}></div>
      </div>

      {/* Main Hero Content - Dealer-Focused with Business Benefits */}
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column - Dealer-Focused Content */}
          <div className="text-center lg:text-right space-y-6">
            
            {/* Market Gap Badge - Key Selling Point for Dealers */}
            <div className="inline-flex items-center space-x-reverse space-x-2 px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200/30 dark:border-red-700/30 shadow-sm">
              <ChartBarIcon className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">فجوة سوقية فريدة: 2000W + 6.5L</span>
            </div>

            {/* Confident Business-Focused Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                <span className="text-slate-900 dark:text-slate-100">
                  كبه هفار
                </span>
                <br />
                <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  2000 وات
                </span>
                <br />
                <span className="text-slate-900 dark:text-slate-100">
                  6.5 لتر
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                <span className="font-semibold text-red-600 dark:text-red-400">منتج فريد للتجار:</span> 
                فجوة سوقية واضحة لا يوجد لها منافس مباشر. 
                <span className="font-semibold text-slate-700 dark:text-slate-200">قطع غيار محلية متوفرة</span> 
                مع شبكة خدمة واسعة وضمان شامل 12 شهر.
              </p>
            </div>

            {/* Dealer CTA Button */}
            <div className="flex justify-center lg:justify-end">
              <button 
                onClick={handleContactClick}
                className="group relative w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                aria-label="اطلب كبه هفار 2000 وات 6.5 لتر للتجار"
              >
                <span className="flex items-center justify-center space-x-reverse space-x-2">
                  <HeartIcon className="w-4 h-4" aria-hidden="true" />
                  <span>اطلب {activeProduct.name}</span>
                  <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </button>
            </div>

            {/* Dealer-Focused Stats - Business Benefits */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {dealerStats.map((stat, index) => (
                <div key={index} className="text-center group" role="group" aria-label={`${stat.label}: ${stat.number}`}>
                  <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
                    <stat.icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {stat.number}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 leading-tight">
                    {stat.description}
                  </div>
                </div>
              ))}
            </div>

            {/* Dealer Benefits - Key Selling Points */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-center lg:justify-end space-x-reverse space-x-3 text-sm text-slate-600 dark:text-slate-400">
                <MapPinIcon className="w-4 h-4 text-green-500" aria-hidden="true" />
                <span>شبكة خدمة محلية واسعة</span>
              </div>
              <div className="flex items-center justify-center lg:justify-end space-x-reverse space-x-3 text-sm text-slate-600 dark:text-slate-400">
                <CogIcon className="w-4 h-4 text-blue-500" aria-hidden="true" />
                <span>قطع غيار متوفرة ومتجددة</span>
              </div>
              <div className="flex items-center justify-center lg:justify-end space-x-reverse space-x-3 text-sm text-slate-600 dark:text-slate-400">
                <ShieldCheckIcon className="w-4 h-4 text-red-500" aria-hidden="true" />
                <span>ضمان شامل مع دعم فني</span>
              </div>
            </div>
          </div>

          {/* Right Column - Product Showcase with Dealer Focus */}
          <div className="relative flex items-center justify-center">
            
            {/* Product Showcase Card with Business Context */}
            <div className="relative w-full max-w-sm lg:max-w-md">
              <div 
                className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/40 dark:border-slate-700/60 overflow-hidden"
                role="region"
                aria-label={`عرض المنتج: ${activeProduct.name}`}
              >
                {/* Simple Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${activeProduct.gradient} opacity-5 rounded-2xl`}></div>
                
                {/* Product Tag */}
                <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-md">
                  {activeProduct.tag}
                </div>
                
                {/* Product Content */}
                <div className="relative z-10 text-center space-y-4">
                  {/* Real Product Image */}
                  <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    {activeProduct.image ? (
                      <img 
                        src={activeProduct.image} 
                        alt={activeProduct.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-16 h-16 bg-gradient-to-br ${activeProduct.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <BoltIcon className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Name */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
                      {activeProduct.name}
                    </h3>
                    <div className="flex items-center justify-center space-x-reverse space-x-2 mb-3">
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-semibold text-xs">
                        {activeProduct.power}
                      </span>
                      {activeProduct.capacity && activeProduct.capacity !== "متعددة الاستخدامات" && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-semibold text-xs">
                          {activeProduct.capacity}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-semibold text-xs">
                        {activeProduct.speeds} سرعات
                      </span>
                    </div>
                  </div>
                  
                  {/* Dealer Advantage - Business Focus */}
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-600/50">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center justify-center space-x-reverse space-x-2">
                      <ChartBarIcon className="w-4 h-4 text-green-500" aria-hidden="true" />
                      <span>ميزة تجارية</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                      {activeProduct.dealerAdvantage}
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                      السوق المستهدف: {activeProduct.targetMarket}
                    </div>
                  </div>
                </div>
                
                {/* Simple Navigation */}
                <button
                  onClick={prevProduct}
                  className="absolute top-1/2 transform -translate-y-1/2 right-2 w-10 h-10 bg-white/90 dark:bg-slate-700/90 border border-slate-200/50 dark:border-slate-600/50 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  aria-label="المنتج السابق"
                >
                  <ArrowRightIcon className="w-5 h-5" aria-hidden="true" />
                </button>
                
                <button
                  onClick={nextProduct}
                  className="absolute top-1/2 transform -translate-y-1/2 left-2 w-10 h-10 bg-white/90 dark:bg-slate-700/90 border border-slate-200/50 dark:border-slate-600/50 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  aria-label="المنتج التالي"
                >
                  <ArrowRightIcon className="w-5 h-5 rotate-180" aria-hidden="true" />
                </button>
                
                {/* Product Counter */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-reverse space-x-2">
                  {hvarProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveProductIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === activeProductIndex 
                          ? 'bg-red-500 w-4' 
                          : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                      }`}
                      aria-label={`انتقل إلى المنتج ${index + 1}`}
                      aria-current={index === activeProductIndex ? 'true' : 'false'}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
