import { useState } from 'react';
import PropTypes from 'prop-types';
import { Package, Wrench, PackageCheck, CheckCircle, XCircle } from 'lucide-react';

/**
 * Shared shell for call-session line items — matches ServiceModalViewer (darker card, icon tile, SKU row, footer strip).
 * Used by SessionItemCardReadonly (viewer) and ItemCard in CallCenterItemsSelection (interactive).
 */

export function getIconTileClass(listRole, isProduct) {
  if (!isProduct) {
    return 'border-amber-200/80 bg-amber-50/90 dark:border-amber-800/50 dark:bg-amber-900/20';
  }
  if (listRole === 'receive') {
    return 'border-accent-green-300/80 bg-accent-green-50/90 dark:border-accent-green-700/60 dark:bg-accent-green-900/25';
  }
  return 'border-brand-blue-200/80 bg-brand-blue-50/90 dark:border-brand-blue-700/60 dark:bg-brand-blue-900/25';
}

function ItemTypeIcon({ listRole, isProduct }) {
  if (!isProduct) {
    return <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={2.25} aria-hidden />;
  }
  if (listRole === 'receive') {
    return <PackageCheck className="h-4 w-4 text-accent-green-600 dark:text-accent-green-400" strokeWidth={2.25} aria-hidden />;
  }
  return <Package className="h-4 w-4 text-brand-blue-600 dark:text-brand-blue-400" strokeWidth={2.25} aria-hidden />;
}

export function SessionItemCardLayout({
  listRole,
  isProduct,
  itemName,
  itemSku,
  showSku = true,
  topAccent,
  children,
}) {
  const [titleExpanded, setTitleExpanded] = useState(false);
  const iconTile = getIconTileClass(listRole, isProduct);
  const skuStr = itemSku != null ? String(itemSku).trim() : '';
  const showSkuLine = showSku && skuStr !== '' && skuStr !== '—';

  return (
    <div className="w-full min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {topAccent === 'blue' && (
        <div className="h-px w-full bg-brand-blue-500 dark:bg-brand-blue-400" aria-hidden />
      )}
      {topAccent === 'green' && (
        <div className="h-px w-full bg-accent-green-500 dark:bg-accent-green-400" aria-hidden />
      )}
      <div className="p-2.5 sm:p-3">
        <div className="grid min-w-0 grid-cols-[2rem_1fr] items-start gap-x-2 sm:gap-x-2.5 gap-y-1" dir="rtl">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${iconTile}`}
            aria-hidden
          >
            <ItemTypeIcon listRole={listRole} isProduct={isProduct} />
          </div>
          <div className="min-w-0 pt-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTitleExpanded((v) => !v);
              }}
              title={titleExpanded ? 'طي الاسم' : 'عرض الاسم كاملاً'}
              className={`block w-full min-w-0 text-right text-xs font-semibold leading-tight text-gray-900 dark:text-gray-100 font-cairo transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-1 rounded-sm ${
                titleExpanded ? 'break-words' : 'truncate'
              }`}
            >
              {itemName}
            </button>
            {showSkuLine && (
              <p
                className="mt-1 truncate font-mono text-[10px] leading-tight text-gray-500 tabular-nums dark:text-gray-400"
                title={skuStr}
              >
                {skuStr}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

SessionItemCardLayout.propTypes = {
  listRole: PropTypes.oneOf(['send', 'receive']).isRequired,
  isProduct: PropTypes.bool.isRequired,
  itemName: PropTypes.string.isRequired,
  itemSku: PropTypes.string,
  showSku: PropTypes.bool,
  topAccent: PropTypes.oneOf(['blue', 'green']),
  children: PropTypes.node,
};

function SessionItemCardReadonlyFooter({ itemQuantity, itemCondition }) {
  const condOk = itemCondition === 'valid';
  const qty = Math.max(1, Number(itemQuantity) || 1);
  return (
    <div
      className="mt-2 flex w-full min-w-0 items-center justify-between gap-2 border-t border-gray-200 pt-2 dark:border-gray-700/70"
      dir="rtl"
    >
      <span
        className="inline-flex min-w-0 shrink-0 items-center gap-2 text-xs leading-snug text-gray-600 dark:text-gray-300 font-cairo"
        title={`الكمية: ${qty}`}
      >
        <span className="text-gray-500 dark:text-gray-400">الكمية</span>
        <span className="h-3 w-px shrink-0 bg-gray-300 dark:bg-gray-600" aria-hidden />
        <span className="tabular-nums font-semibold text-gray-900 dark:text-gray-100" dir="ltr">
          {qty}
        </span>
      </span>
      <span
        className={`inline-flex shrink-0 items-center gap-0.5 px-1.5 py-px rounded text-[10px] font-medium font-cairo border ${
          condOk
            ? 'border-accent-green-300 dark:border-accent-green-700 bg-accent-green-50 dark:bg-accent-green-900/25 text-accent-green-800 dark:text-accent-green-200'
            : 'border-brand-red-300 dark:border-brand-red-700 bg-brand-red-50 dark:bg-brand-red-900/25 text-brand-red-800 dark:text-brand-red-200'
        }`}
      >
        {condOk ? <CheckCircle className="w-3 h-3 flex-shrink-0" /> : <XCircle className="w-3 h-3 flex-shrink-0" />}
        {condOk ? 'سليم' : 'تالف'}
      </span>
    </div>
  );
}

function itemMatchesId(row, itemId) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
  return row.id === itemId || row.item_id === itemId || row.product_id === itemId;
}

/**
 * Read-only row — same visuals as ServiceModalViewer send/receive cards (dual-presence top accent preserved).
 */
export function SessionItemCardReadonly({ role, item, receiveItems = [], sendItems = [] }) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const itemId = item.id || item.item_id || item.product_id;
  if (!itemId) return null;

  const isSend = role === 'send';
  const dualPresence = isSend
    ? receiveItems.some((ri) => itemMatchesId(ri, itemId))
    : sendItems.some((si) => itemMatchesId(si, itemId));

  const topAccent = dualPresence ? (isSend ? 'blue' : 'green') : undefined;
  const itemType = item.type || 'part';
  const isProduct = itemType === 'product';
  const itemCondition = item.condition || 'invalid';
  const itemQuantity = item.quantity ?? item.qty ?? 1;
  const itemName = item.item_name || item.name || item.product_name || 'عنصر';
  const itemSku = item.sku || item.product_sku || '—';
  const showSku = itemSku && String(itemSku).trim() !== '' && itemSku !== '—';

  return (
    <SessionItemCardLayout
      listRole={isSend ? 'send' : 'receive'}
      isProduct={isProduct}
      itemName={itemName}
      itemSku={itemSku}
      showSku={showSku}
      topAccent={topAccent}
    >
      <SessionItemCardReadonlyFooter itemQuantity={itemQuantity} itemCondition={itemCondition} />
    </SessionItemCardLayout>
  );
}

SessionItemCardReadonly.propTypes = {
  role: PropTypes.oneOf(['send', 'receive']).isRequired,
  item: PropTypes.object.isRequired,
  receiveItems: PropTypes.array,
  sendItems: PropTypes.array,
};
