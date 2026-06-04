import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { getOrderCountsBatch, getOrderDatesWithData } from '../../api/callCenterAPI';
import { toLocalDateKey } from '../../utils/core/date';

/**
 * Queue Status Bar - Call Center Work Queue
 *
 * Creative design with:
 * - Arabic greeting first (مساء الخير)
 * - Small creative day chips showing total orders
 * - Perfect horizontal layout
 */
const QueueStatusBar = ({
  selectedDate = null,
  onDateChange,
  isLoading = false
}) => {
  const [dayCounts, setDayCounts] = useState({});
  /** Dates that have at least one order (YYYY-MM-DD). Empty = use fallback (today + 6). */
  const [datesWithData, setDatesWithData] = useState([]);
  const [datesLoaded, setDatesLoaded] = useState(false);

  // Get Arabic day names
  const getArabicDayName = (date) => {
    const days = [
      'الأحد',
      'الإثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت'
    ];
    return days[date.getDay()];
  };

  // Get Arabic month names
  const getArabicMonthName = (date) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[date.getMonth()];
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'صباح الخير';
    } else {
      return 'مساء الخير';
    }
  };

  // RTL order: old dates (past) first (right side), then current day, then coming (future) last (left). Array = [past desc..., today, ...future asc].
  const todayKey = toLocalDateKey(new Date());
  const dateKeysToShow = (() => {
    if (datesWithData.length > 0) {
      const set = new Set(datesWithData);
      if (!set.has(todayKey)) set.add(todayKey);
      const sorted = Array.from(set).sort();
      const past = sorted.filter(k => k < todayKey).sort((a, b) => b.localeCompare(a));
      const future = sorted.filter(k => k > todayKey).sort((a, b) => a.localeCompare(b));
      return [...past, todayKey, ...future];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const keys = [todayKey];
    for (let i = 1; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      keys.push(toLocalDateKey(d));
    }
    const past = keys.filter(k => k < todayKey).sort((a, b) => b.localeCompare(a));
    const future = keys.filter(k => k > todayKey).sort((a, b) => a.localeCompare(b));
    return [...past, todayKey, ...future];
  })();

  // Generate day chips from date keys (only dates that have data, plus today)
  const generateDays = () => {
    const days = [];
    const todayKey = toLocalDateKey(new Date());

    for (const dateKey of dateKeysToShow) {
      const [y, m, d] = dateKey.split('-').map(Number);
      const date = new Date(y, m - 1, d);

      const dayName = getArabicDayName(date);
      const dayNumber = date.getDate();
      const monthNumber = date.getMonth() + 1;
      const monthName = getArabicMonthName(date);
      const isToday = dateKey === todayKey;
      const isSelected = selectedDate
        ? (typeof selectedDate === 'string' && selectedDate.length === 10
            ? selectedDate === dateKey
            : new Date(selectedDate).toDateString() === date.toDateString())
        : isToday;
      const totalOrders = typeof dayCounts[dateKey] === 'number' ? dayCounts[dateKey] : 0;

      days.push({
        date,
        dayName,
        dayNumber,
        monthNumber,
        monthName,
        dateKey,
        totalOrders,
        isToday,
        isSelected
      });
    }

    return days;
  };

  // Single batch request for all day chips (reduces N requests to 1)
  const fetchDayCounts = useCallback(async () => {
    const keys = dateKeysToShow;
    if (keys.length === 0) {
      setDayCounts({});
      return;
    }
    try {
      const datesPayload = await getOrderCountsBatch(keys);
      const newCounts = {};
      for (const dateKey of keys) {
        const response = datesPayload[dateKey] || {};
        const total = Object.entries(response)
          .filter(([key]) => key !== 'attempts' && key !== '_date')
          .reduce((sum, [, count]) => sum + (typeof count === 'number' ? count : 0), 0);
        newCounts[dateKey] = total;
      }
      setDayCounts(newCounts);
    } catch {
      setDayCounts({});
    }
  }, [dateKeysToShow.join(',')]);


  // Load dates first, then fetch counts once (avoids double getOrderCountsBatch)
  useEffect(() => {
    getOrderDatesWithData()
      .then(list => {
        setDatesWithData(list);
        setDatesLoaded(true);
      })
      .catch(() => {
        setDatesWithData([]);
        setDatesLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!datesLoaded || dateKeysToShow.length === 0) return;
    fetchDayCounts();
  }, [datesLoaded, dateKeysToShow.join(','), fetchDayCounts]);

  // Refresh counts when refresh completes
  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      // Loading just finished, refresh counts
      fetchDayCounts();
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, fetchDayCounts]);

  const days = generateDays();
  // Show today always; for the rest only days that have counts
  const daysToShow = days.filter(d => d.isToday || d.totalOrders > 0);
  const greeting = getGreeting();

  const handleDayClick = (day) => {
    if (onDateChange) {
      onDateChange(day.dateKey);
    }
  };

  const selectedDay = daysToShow.find(d => d.isSelected) || daysToShow[0] || days[0];
  const resolvedSelectedKey = selectedDate ? (typeof selectedDate === 'string' ? selectedDate.slice(0, 10) : toLocalDateKey(new Date(selectedDate))) : todayKey;
  const isTodaySelected = resolvedSelectedKey === todayKey;

  return (
    <div className="bg-transparent w-full max-w-full">
      <div className="w-full max-w-full flex items-center gap-3 sm:gap-4 lg:gap-5 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-4">
          {/* RTL: greeting (right) + today badge + scrollable day chips */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 flex-1 min-w-0 max-w-full" dir="rtl">
            {/* Greeting + creative "today" badge */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-sm sm:text-base lg:text-lg font-cairo font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {greeting}، <span className="text-brand-blue-600 dark:text-brand-blue-400 font-bold">كريم</span> 👋
              </span>
              <button
                type="button"
                onClick={() => onDateChange && onDateChange(todayKey)}
                className={`
                  inline-flex items-center gap-1.5 font-cairo whitespace-nowrap
                  px-2.5 py-1.5 rounded-xl
                  transition-all duration-200 ease-out
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
                  active:scale-[0.98]
                  ${isTodaySelected
                    ? 'bg-brand-blue-500 dark:bg-brand-blue-600 text-white shadow-md ring-2 ring-brand-blue-400/30 dark:ring-brand-blue-500/40 focus:ring-brand-blue-400'
                    : 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700/80 dark:to-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-600/60 hover:border-brand-blue-300 dark:hover:border-brand-blue-600/50 hover:from-brand-blue-50 hover:to-brand-blue-100/80 dark:hover:from-brand-blue-900/30 dark:hover:to-brand-blue-900/20 hover:text-brand-blue-700 dark:hover:text-brand-blue-300 hover:shadow-sm focus:ring-brand-blue-500'
                  }
                `}
                aria-label={`اختر اليوم: ${getArabicDayName(new Date())}`}
                title="انقر لعرض طلبات اليوم"
              >
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0 opacity-90" aria-hidden />
                <span className="text-xs font-semibold">{getArabicDayName(new Date())}</span>
              </button>
            </div>

            {/* Day chips: max expand, internal horizontal scroll, perfect view */}
            <div
              className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0 overflow-x-auto overflow-y-hidden py-1 -my-1 scrollbar-tabs scroll-smooth"
              dir="rtl"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {daysToShow.map((day, index) => {
                const isActive = day.isSelected;

                return (
                  <button
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative flex items-center
                      px-2 sm:px-3 py-2 sm:py-3
                      shrink-0
                      transition-all duration-200
                      font-cairo
                      group
                      rounded-lg
                      hover:bg-gray-100/50 dark:hover:bg-gray-800/50
                    `}
                  >
                    {/* Horizontal Layout: All elements in one line */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Orders Count - Rounded chip at the start */}
                      <span className={`
                        text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap transition-all duration-200
                        ${
                          isActive
                            ? 'bg-brand-blue-100 dark:bg-brand-blue-900/40 text-brand-blue-700 dark:text-brand-blue-300'
                            : day.totalOrders > 0
                            ? 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                            : 'bg-gray-50 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500'
                        }
                      `}>
                        {day.totalOrders}
                      </span>

                      {/* Day Name and Date Container - Underline will be under this */}
                      <div className="relative flex items-center gap-1.5 sm:gap-2">
                        {/* Day Name */}
                        <span className={`text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                          isActive
                            ? 'text-brand-blue-600 dark:text-brand-blue-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                        }`}>
                          {day.dayName}
                        </span>

                        {/* Separator */}
                        <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>

                        {/* Date */}
                        <span className={`text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                          isActive
                            ? 'text-brand-blue-600 dark:text-brand-blue-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                        }`}>
                          {day.dayNumber}/{day.monthNumber}
                        </span>

                        {/* Underline Hint for Selected Date - Only under day name and date */}
                        {isActive && (
                          <div className="absolute top-full left-0 right-0 flex items-center justify-center mt-1">
                            {/* Simple centered line with small dots on sides */}
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-brand-blue-600 dark:bg-brand-blue-400 rounded-full"></div>
                              <div className="w-10 sm:w-12 h-0.5 bg-brand-blue-600 dark:bg-brand-blue-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-brand-blue-600 dark:bg-brand-blue-400 rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
      </div>
    </div>
  );
};

export default QueueStatusBar;
