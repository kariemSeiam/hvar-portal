import { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { splitCallNotesForDisplay } from '../../utils/callcenter/rmtNotes';

/**
 * Call notes: optional collapsible block for lines before «السبب:» (هنسلم / هنستلم template).
 * السبب text is always shown in full below.
 */
export function CallNotesDisplay({ text, className = '' }) {
  const [beforeOpen, setBeforeOpen] = useState(false);

  const raw = String(text ?? '').trim();
  if (!raw) return null;

  const { before, afterReason } = splitCallNotesForDisplay(raw);
  const wrap = `rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/40 p-2 ${className}`;
  const bodyClass =
    'text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 font-cairo leading-relaxed whitespace-pre-wrap break-words';

  if (afterReason === null) {
    return (
      <div className={wrap} dir="rtl">
        <p className={bodyClass}>{before}</p>
      </div>
    );
  }

  return (
    <div className={wrap} dir="rtl">
      {before ? (
        <div className="mb-2">
          {!beforeOpen ? (
            <button
              type="button"
              onClick={() => setBeforeOpen(true)}
              className="w-full flex items-center justify-between gap-2 rounded-md border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-800/50 px-2 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
              aria-expanded="false"
            >
              <span className="text-[10px] sm:text-xs font-cairo font-semibold text-brand-blue-700 dark:text-brand-blue-300">
                عرض تفاصيل الطلب (هنسلم / هنستلم)
              </span>
              <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
            </button>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setBeforeOpen(false)}
                className="w-full flex items-center justify-between gap-2 rounded-md px-1 py-1 mb-1.5 text-right hover:bg-gray-100/80 dark:hover:bg-gray-700/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
                aria-expanded="true"
              >
                <span className="text-[9px] font-cairo text-gray-500 dark:text-gray-400">إخفاء التفاصيل</span>
                <ChevronUp className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
              </button>
              <p className={bodyClass}>{before}</p>
            </div>
          )}
        </div>
      ) : null}

      <div
        className={
          before
            ? 'pt-2 border-t border-dashed border-amber-200/80 dark:border-amber-700/50'
            : ''
        }
      >
        <p className="text-[9px] font-bold text-amber-900/90 dark:text-amber-200/95 font-cairo mb-1">السبب</p>
        <p className="text-[10px] sm:text-xs text-gray-900 dark:text-gray-100 font-cairo leading-relaxed whitespace-pre-wrap break-words">
          {afterReason.trim() || '—'}
        </p>
      </div>
    </div>
  );
}

CallNotesDisplay.propTypes = {
  text: PropTypes.string,
  className: PropTypes.string,
};

export default CallNotesDisplay;
