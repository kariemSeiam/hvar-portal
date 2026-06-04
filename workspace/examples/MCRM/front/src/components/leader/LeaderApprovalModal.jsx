import React, { useState, useMemo, useEffect } from 'react';
import { Check, CheckCheck, Truck, FileText, Package, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getServiceTypeLabelAr, normalizeServiceTypeOrFallback } from '../../constants/serviceTypes';
import { SERVICE_TYPE_ICONS } from '../../constants/serviceTypeUi.js';
import { autoMatchItems } from '../../api/callCenterAPI';
import { isStockBackedRmtLine, mergeRmtCartLinesByStockId, mergeSellCartLinesByStockId } from '../../utils/callcenter/rmtNotes';
import { ServiceModalWrapper } from '../modals/shared';
import CallCenterAmountPanel from '../call-center/CallCenterAmountPanel';
import SessionStyleMoneyBadge from '../ui/SessionStyleMoneyBadge';

const inputClass =
  'w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg font-cairo text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500';

/** LTR digits but visually at RTL block start (right): use with dir="ltr" on inputs */
const inputLtrRtlAlignClass = 'text-right';

const inputErrorClass = 'border-red-400 dark:border-red-500/60 focus:ring-red-500/40';

const sectionCardClass =
  'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 p-3 space-y-2.5 shadow-sm';

const sectionTitleClass =
  'text-xs font-semibold text-gray-900 dark:text-gray-100 font-cairo border-b border-gray-100 dark:border-gray-700 pb-1.5 mb-0';

const textareaNotesClass =
  'w-full min-h-[5.5rem] px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-cairo text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500 resize-y whitespace-pre-wrap leading-relaxed';

/** Tight inline hint under a field — pairs with label row pulse when required */
function FieldErrorHint({ id, children }) {
  if (!children) return null;
  return (
    <p
      id={id}
      className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-red-200/70 bg-gradient-to-l from-red-50/90 to-white/80 px-2 py-1.5 text-[10px] leading-relaxed text-red-800 shadow-sm dark:border-red-800/45 dark:from-red-950/35 dark:to-gray-900/20 dark:text-red-100 font-cairo"
      role="alert"
    >
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-black leading-none text-white shadow-sm ring-2 ring-red-200/50 dark:ring-red-900/40"
        aria-hidden
      >
        !
      </span>
      <span>{children}</span>
    </p>
  );
}

function initialLeaderNotesFromOrder(order) {
  if (!order) return '';
  let s = order.confirmation_snapshot;
  if (typeof s === 'string') {
    try {
      s = JSON.parse(s);
    } catch {
      s = {};
    }
  }
  s = s || {};
  if (s.notes != null && String(s.notes).length > 0) return String(s.notes);
  return '';
}

/** Signed COD: positive = تحصيل، negative = استرداد (same as CallCenterAmountPanel / SessionStyleMoneyBadge) */
function initialSignedCodFromOrder(order) {
  if (!order) return 0;
  let s = order.confirmation_snapshot;
  if (typeof s === 'string') {
    try {
      s = JSON.parse(s);
    } catch {
      s = {};
    }
  }
  s = s || {};
  const raw = s.cod_amount != null ? Number(s.cod_amount) : Number(order.cod_amount) || 0;
  return Number.isFinite(raw) ? raw : 0;
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function parseConfirmationSnapshot(order) {
  if (!order?.confirmation_snapshot) return {};
  const raw = order.confirmation_snapshot;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const o = JSON.parse(raw);
      return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Same rules as CallSessionFAB / confirm-by-customer: flat matched lines → إرسال/استلام + حالة.
 */
function distributeRmtLinesFromMatched(matched, serviceType) {
  const list = Array.isArray(matched) ? matched : [];
  if (list.length === 0) return { send: [], recv: [] };
  const st = String(serviceType || '').toLowerCase();
  const toItem = (it, i, direction, condition) => ({
    ...it,
    _uid: it._uid ?? `leader-${direction}-${i}`,
    quantity: it.order_quantity ?? it.quantity ?? 1,
    order_quantity: it.order_quantity ?? it.quantity ?? 1,
    direction,
    condition
  });
  if (st === 'replacement') {
    return {
      send: list.map((it, i) => toItem(it, i, 'send', 'valid')),
      recv: list.map((it, i) => toItem(it, i, 'receive', 'damaged'))
    };
  }
  if (st === 'maintenance') {
    return {
      recv: list.map((it, i) => toItem(it, i, 'receive', 'damaged')),
      send: list.map((it, i) => toItem(it, i, 'send', 'valid'))
    };
  }
  if (st === 'return') {
    return {
      recv: list.map((it, i) => toItem(it, i, 'receive', 'damaged')),
      send: []
    };
  }
  return { send: [], recv: [] };
}

/** Live FAB lines → snapshot payload (same shape as confirm snapshot items) */
function sessionLinesToSnapshotPayload(lines, canonicalType) {
  const st = String(canonicalType || '').toLowerCase();
  if (!lines?.length) return [];
  const idOf = (it) => it.item_id ?? it.product_id ?? it.id;
  if (st === 'sell' || st === 'ask') {
    return lines
      .map((it) => ({
        item_id: idOf(it),
        quantity: it.order_quantity ?? it.quantity ?? 1,
        name: it.name,
        sku: it.sku,
        type: it.type || 'product'
      }))
      .filter((r) => r.item_id != null && String(r.item_id).trim() !== '');
  }
  return lines
    .map((it) => ({
      item_id: idOf(it),
      quantity: it.order_quantity ?? it.quantity ?? 1,
      direction: it.direction,
      condition: it.condition,
      name: it.name,
      sku: it.sku
    }))
    .filter((r) => r.item_id != null && String(r.item_id).trim() !== '');
}

/** Snapshot-shaped rows for leader-approve when snapshot.items was empty but stock match exists */
function matchedToLeaderSnapshotItems(matched, canonicalType) {
  const st = String(canonicalType || '').toLowerCase();
  const hasId = (it) => {
    const id = it?.item_id ?? it?.product_id ?? it?.id;
    return id != null && String(id).trim() !== '';
  };
  if (st === 'sell' || st === 'ask') {
    return mergeSellCartLinesByStockId(
      (matched || [])
        .filter(hasId)
        .map((it) => ({
          item_id: it.item_id ?? it.product_id ?? it.id,
          order_quantity: it.order_quantity ?? it.quantity ?? 1,
          quantity: it.order_quantity ?? it.quantity ?? 1,
          name: it.name,
          sku: it.sku,
          type: it.type || 'product'
        }))
    ).map((it) => ({
      item_id: it.item_id ?? it.product_id ?? it.id,
      quantity: it.order_quantity ?? it.quantity ?? 1,
      name: it.name,
      sku: it.sku
    }));
  }
  const { send, recv } = distributeRmtLinesFromMatched(matched, st);
  const sendM = mergeRmtCartLinesByStockId(send);
  const recvM = mergeRmtCartLinesByStockId(recv);
  const mapRow = (it) => ({
    item_id: it.item_id ?? it.product_id ?? it.id,
    quantity: it.order_quantity ?? it.quantity ?? 1,
    direction: it.direction,
    condition: it.condition,
    name: it.name,
    sku: it.sku
  });
  return [...sendM.map(mapRow), ...recvM.map(mapRow)].filter((r) => r.item_id != null && String(r.item_id).trim() !== '');
}

/**
 * Leader Approval Modal — compact final step before ticket creation.
 * Focus: tracking (إرسال/استلام)، المبلغ، ملاحظات؛ ملخص طلب صغير فقط.
 *
 * @param {object} [sessionCustomer] — Live profile from CallSessionFAB (`customerContext?.customer || order?.customer`)
 *   after CustomerCard save; merged so UI/payload match edited name/phone/address.
 * @param {Array<object>|null} [sessionItemsLines] — Current cart lines from CallSessionFAB (بيع / RMT). When set and non-empty,
 *   count + leader-approve `items` use this instead of DB snapshot or وصف الطلب inference.
 * @param {boolean} [liveSession] — When true (opened from CallSessionFAB), amount/notes/service type come from session props
 *   so they match CallCenterAmountPanel edits; order/snapshot alone can lag until confirm.
 * @param {number} [sessionSignedCod] — Live signed COD from the session (positive تحصيل، negative استرداد).
 * @param {string} [sessionCallNotes] — Live ملاحظات الاتصال from the session.
 * @param {string} [sessionServiceType] — Live نوع المكالمة from the session (sell / replacement / …).
 */
export default function LeaderApprovalModal({
  order,
  liveSession = false,
  sessionSignedCod,
  sessionCallNotes,
  sessionServiceType,
  sessionCustomer = null,
  sessionItemsLines = null,
  onApprove,
  onClose
}) {
  const snap = useMemo(() => parseConfirmationSnapshot(order), [order?.id, order?.confirmation_snapshot]);

  const serviceType =
    liveSession && sessionServiceType
      ? sessionServiceType
      : order?.service_type || snap?.call_type || 'sell';
  const canonicalType = useMemo(
    () => normalizeServiceTypeOrFallback(serviceType, { fallback: 'sell' }),
    [serviceType]
  );
  const typeLabelShort = getServiceTypeLabelAr(serviceType, { short: true });

  const [loading, setLoading] = useState(false);
  const [leaderNotes, setLeaderNotes] = useState(() =>
    liveSession ? String(sessionCallNotes ?? '') : initialLeaderNotesFromOrder(order)
  );
  const [signedCod, setSignedCod] = useState(() =>
    liveSession && sessionSignedCod != null && Number.isFinite(Number(sessionSignedCod))
      ? Number(sessionSignedCod)
      : initialSignedCodFromOrder(order)
  );

  /** Re-sync when agent confirm updates snapshot (same order id) — was only [order?.id], so تحصيل/استرداد stayed stale. */
  const snapshotFieldsSyncKey = useMemo(() => {
    if (!order?.id) return '';
    const s = parseConfirmationSnapshot(order);
    const codRaw = s.cod_amount != null ? s.cod_amount : order?.cod_amount;
    const cod = Number(codRaw);
    const notes = String(s.notes ?? '');
    return `${order.id}|${Number.isFinite(cod) ? cod : 0}|${notes}`;
  }, [order?.id, order?.confirmation_snapshot, order?.cod_amount]);

  useEffect(() => {
    if (!order?.id || liveSession) return;
    setLeaderNotes(initialLeaderNotesFromOrder(order));
    setSignedCod(initialSignedCodFromOrder(order));
  }, [order?.id, snapshotFieldsSyncKey, order, liveSession]);

  const customerPayload = useMemo(
    () => ({
      name: firstNonEmpty(
        sessionCustomer?.name,
        snap.customer_name,
        order?.customer_name,
        order?.customer?.name
      ),
      phone: firstNonEmpty(
        sessionCustomer?.phone,
        snap.customer_phone,
        order?.customer_phone,
        order?.customer?.phone
      ),
      governorate: firstNonEmpty(
        sessionCustomer?.governorate,
        snap.governorate,
        order?.address_governorate,
        order?.governorate
      ),
      city: firstNonEmpty(sessionCustomer?.city, snap.city, order?.address_city, order?.city),
      address_details: firstNonEmpty(
        sessionCustomer?.address_details,
        snap.delivery_address,
        order?.address_full,
        order?.delivery_address
      )
    }),
    [snap, order, sessionCustomer]
  );

  const [tracking, setTracking] = useState({
    original_tracking: snap.original_tracking || order?.bosta_tracking || '',
    new_tracking_send: '',
    new_tracking_receive: ''
  });

  const snapshotItems = Array.isArray(snap.items) ? snap.items : [];

  /** When snapshot.items is empty (common if confirm sent items:[]), infer lines from وصف الطلب / ملاحظات via same autoMatch as session */
  const descriptionForInfer = useMemo(
    () => firstNonEmpty(snap.order_description, order?.order_description, snap.notes),
    [snap.order_description, order?.order_description, snap.notes]
  );

  const [inferredMatched, setInferredMatched] = useState(null);
  const [inferLoading, setInferLoading] = useState(false);

  useEffect(() => {
    if (!order?.id) return;
    if (sessionItemsLines?.length > 0) {
      setInferredMatched(null);
      setInferLoading(false);
      return;
    }
    if (snapshotItems.length > 0) {
      setInferredMatched(null);
      setInferLoading(false);
      return;
    }
    if (!descriptionForInfer) {
      setInferredMatched([]);
      setInferLoading(false);
      return;
    }
    let cancelled = false;
    setInferLoading(true);
    autoMatchItems(order.id, descriptionForInfer, {
      callType: ['sell', 'replacement', 'maintenance', 'return'].includes(String(serviceType).toLowerCase())
        ? String(serviceType).toLowerCase()
        : 'sell'
    })
      .then((res) => {
        if (cancelled) return;
        setInferredMatched(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {
        if (!cancelled) setInferredMatched([]);
      })
      .finally(() => {
        if (!cancelled) setInferLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [order?.id, sessionItemsLines?.length, snapshotItems.length, descriptionForInfer, serviceType]);

  const displayItemCount = useMemo(() => {
    if (sessionItemsLines?.length > 0) return sessionItemsLines.length;
    if (snapshotItems.length > 0) return snapshotItems.length;
    if (inferredMatched != null) {
      return inferredMatched.filter(isStockBackedRmtLine).length;
    }
    return null;
  }, [sessionItemsLines?.length, snapshotItems.length, inferredMatched]);

  const showInferSpinner =
    !(sessionItemsLines?.length > 0) &&
    snapshotItems.length === 0 &&
    !!descriptionForInfer &&
    (inferLoading || inferredMatched === null);

  const trackingConfig = useMemo(() => {
    const st = String(serviceType).toLowerCase();
    return {
      showOriginal: true,
      showSend: ['sell', 'replacement'].includes(st),
      showReceive: ['maintenance', 'return'].includes(st),
      sendRequired: st === 'replacement',
      receiveRequired: ['maintenance', 'return'].includes(st),
      isReplacement: st === 'replacement'
    };
  }, [serviceType]);

  const errors = useMemo(() => {
    const errs = {};
    if (!customerPayload.name.trim()) errs.name = 'الاسم مطلوب';
    if (!customerPayload.phone.trim() || !/^01[0-9]{9}$/.test(customerPayload.phone.trim())) {
      errs.phone = 'رقم هاتف مصري صحيح (11 رقم)';
    }
    if (!customerPayload.governorate.trim()) errs.governorate = 'المحافظة مطلوبة';
    if (!customerPayload.city.trim()) errs.city = 'المدينة مطلوبة';
    if (!customerPayload.address_details.trim()) errs.address = 'العنوان التفصيلي مطلوب';

    if (trackingConfig.sendRequired && !tracking.new_tracking_send.trim()) {
      errs.tracking_send = 'رقم التتبع مطلوب للاستبدال (إرسال واستقبال)';
    }
    if (trackingConfig.receiveRequired && !tracking.new_tracking_receive.trim()) {
      errs.tracking_receive = 'رقم تتبع الاستلام مطلوب';
    }

    return errs;
  }, [customerPayload, signedCod, tracking, serviceType, trackingConfig]);

  const hasErrors = Object.keys(errors).length > 0;
  const customerFieldErrors = [errors.name, errors.phone, errors.governorate, errors.city, errors.address].filter(Boolean);

  const handleSubmit = async () => {
    if (hasErrors) {
      toast.error('يرجى إكمال جميع الحقول المطلوبة');
      return;
    }
    setLoading(true);
    try {
      const st = String(serviceType).toLowerCase();
      const replacementUnified =
        st === 'replacement' ? tracking.new_tracking_send.trim() : null;

      let itemsForPayload = snapshotItems;
      if (sessionItemsLines?.length) {
        const built = sessionLinesToSnapshotPayload(sessionItemsLines, canonicalType);
        if (built.length > 0) itemsForPayload = built;
      } else if (snapshotItems.length === 0 && inferredMatched?.length) {
        const built = matchedToLeaderSnapshotItems(inferredMatched, canonicalType);
        if (built.length > 0) itemsForPayload = built;
      }

      const payload = {
        customer: customerPayload,
        original_tracking: tracking.original_tracking,
        new_tracking_send: tracking.new_tracking_send,
        new_tracking_receive:
          replacementUnified != null && replacementUnified !== ''
            ? replacementUnified
            : tracking.new_tracking_receive,
        cod_amount: signedCod,
        /** Net amount is signedCod; delta cleared so backend does not add old snapshot adj twice */
        cost_adjustment: 0,
        notes: leaderNotes,
        /** Required for backend: leader/session may change type after agent confirm; must persist on approve */
        call_type: canonicalType,
        /** Never send `items: []` — backend replaces snapshot items and wipes lines for the ticket */
        ...(itemsForPayload.length > 0 ? { items: itemsForPayload } : {})
      };
      await onApprove(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const HeaderIcon = SERVICE_TYPE_ICONS[canonicalType] || Package;

  return (
    <ServiceModalWrapper
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-5xl"
      maxHeight="max-h-[min(92vh,800px)]"
      overflow="overflow-hidden"
    >
      <div
        className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 bg-accent-green-50 dark:bg-accent-green-900/20 flex-shrink-0"
        dir="rtl"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-green-600 text-white shadow-sm">
            <CheckCheck className="w-4 h-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-cairo leading-tight">
              تأكيد الموافقة على الطلب
            </h2>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-cairo truncate flex items-center gap-1">
              <HeaderIcon className="w-3 h-3 shrink-0 opacity-80" aria-hidden />
              <span>#{order?.id}</span>
              <span className="text-gray-400">·</span>
              <span>{typeLabelShort}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors disabled:opacity-50"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5" dir="rtl">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-0 lg:items-start">
            {/* العمود الأيمن (بداية القراءة): ملخص + تتبع */}
            <div className="flex min-w-0 flex-col gap-3">
          {/* ملخص سريع — سطرين فقط */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/90 dark:bg-gray-800/60 p-3 space-y-2 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                  <Check className="w-3.5 h-3.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-cairo truncate">
                    {customerPayload.name || '—'}
                  </p>
                  <p
                    className={`text-xs tabular-nums text-gray-600 dark:text-gray-400 font-cairo ${inputLtrRtlAlignClass}`}
                    dir="ltr"
                  >
                    {customerPayload.phone || '—'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[10px] sm:text-xs font-cairo shrink-0">
                <div className="text-start">
                  <div className="text-gray-500 dark:text-gray-400">نوع الخدمة</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{typeLabelShort}</div>
                </div>
                <div className="text-start">
                  <div className="text-gray-500 dark:text-gray-400">العناصر</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {showInferSpinner ? (
                      <span className="inline-block min-w-[1ch] animate-pulse">…</span>
                    ) : (
                      displayItemCount ?? '—'
                    )}
                  </div>
                </div>
                <div className="text-start">
                  <div className="text-gray-500 dark:text-gray-400">المبلغ</div>
                  <div className="min-w-0">
                    <SessionStyleMoneyBadge value={signedCod} size="sm" variant="plain" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-cairo leading-snug line-clamp-2 border-t border-gray-200/80 dark:border-gray-600/80 pt-2">
              {[customerPayload.governorate, customerPayload.city, customerPayload.address_details].filter(Boolean).join(' · ') || '—'}
            </p>
            {customerFieldErrors.length > 0 && (
              <div className="flex flex-wrap gap-1 border-t border-dashed border-red-200/60 pt-2 dark:border-red-800/40">
                {customerFieldErrors.map((msg, i) => (
                  <span
                    key={`inline-${i}`}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-cairo text-red-700 ring-1 ring-inset ring-red-200/70 dark:bg-red-950/40 dark:text-red-100 dark:ring-red-800/50"
                  >
                    <span className="text-[9px] font-bold">↳</span>
                    {msg}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* التتبع — القسم الأساسي */}
          <div className={`${sectionCardClass} min-w-0`}>
            <h3 className={`flex items-center gap-1.5 ${sectionTitleClass}`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                <Truck className="w-3 h-3" aria-hidden />
              </span>
              أرقام التتبع (إرسال / استلام)
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {trackingConfig.showOriginal && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                    الأصلي
                  </label>
                  <input
                    type="text"
                    value={tracking.original_tracking}
                    onChange={(e) => setTracking({ ...tracking, original_tracking: e.target.value })}
                    placeholder="رقم التتبع الأصلي"
                    dir="ltr"
                    className={`${inputClass} ${inputLtrRtlAlignClass}`}
                  />
                </div>
              )}
              {trackingConfig.showSend && (
                <div>
                  <label
                    className={`mb-1 flex items-center justify-between gap-2 text-xs font-medium font-cairo ${
                      errors.tracking_send ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    htmlFor="leader-tracking-send"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      {trackingConfig.isReplacement ? (
                        <>رقم التتبع (إرسال واستقبال)</>
                      ) : (
                        <>رقم تتبع الإرسال</>
                      )}
                      {trackingConfig.sendRequired && <span className="text-red-500">*</span>}
                      {errors.tracking_send && (
                        <span
                          className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-sm ring-2 ring-red-200/50 dark:ring-red-900/50"
                          aria-hidden
                        >
                          !
                        </span>
                      )}
                    </span>
                  </label>
                  <input
                    id="leader-tracking-send"
                    type="text"
                    value={tracking.new_tracking_send}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (trackingConfig.isReplacement) {
                        setTracking({
                          ...tracking,
                          new_tracking_send: v,
                          new_tracking_receive: v
                        });
                      } else {
                        setTracking({ ...tracking, new_tracking_send: v });
                      }
                    }}
                    placeholder={trackingConfig.isReplacement ? 'نفس الرقم لطرد الاستبدال' : undefined}
                    dir="ltr"
                    aria-invalid={errors.tracking_send ? 'true' : undefined}
                    aria-describedby={errors.tracking_send ? 'leader-err-tracking-send' : undefined}
                    className={`${inputClass} ${inputLtrRtlAlignClass} ${errors.tracking_send ? inputErrorClass : ''}`}
                  />
                  <FieldErrorHint id="leader-err-tracking-send">{errors.tracking_send}</FieldErrorHint>
                </div>
              )}
              {trackingConfig.showReceive && (
                <div>
                  <label
                    className={`mb-1 flex items-center justify-between gap-2 text-xs font-medium font-cairo ${
                      errors.tracking_receive ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    htmlFor="leader-tracking-receive"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      رقم تتبع الاستلام
                      {trackingConfig.receiveRequired && <span className="text-red-500">*</span>}
                      {errors.tracking_receive && (
                        <span
                          className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-sm ring-2 ring-red-200/50 dark:ring-red-900/50"
                          aria-hidden
                        >
                          !
                        </span>
                      )}
                    </span>
                  </label>
                  <input
                    id="leader-tracking-receive"
                    type="text"
                    value={tracking.new_tracking_receive}
                    onChange={(e) => setTracking({ ...tracking, new_tracking_receive: e.target.value })}
                    placeholder={trackingConfig.isReplacement ? '(يُملأ تلقائياً مع الإرسال للاستبدال)' : undefined}
                    dir="ltr"
                    disabled={trackingConfig.isReplacement}
                    aria-invalid={errors.tracking_receive ? 'true' : undefined}
                    aria-describedby={errors.tracking_receive ? 'leader-err-tracking-receive' : undefined}
                    className={`${inputClass} ${inputLtrRtlAlignClass} ${errors.tracking_receive ? inputErrorClass : ''} ${trackingConfig.isReplacement ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                  <FieldErrorHint id="leader-err-tracking-receive">{errors.tracking_receive}</FieldErrorHint>
                </div>
              )}
            </div>
          </div>
            </div>

            {/* العمود الأيسر: مبلغ + ملاحظات + تنبيه */}
            <div className="flex min-w-0 flex-col gap-3">
          {/* المبلغ + الملاحظات */}
          <div className={`${sectionCardClass} min-w-0`}>
            <h3 className={`flex items-center gap-1.5 ${sectionTitleClass}`}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-green-600 text-white">
                <FileText className="w-3 h-3" aria-hidden />
              </span>
              المبلغ والملاحظات
            </h3>
            <div className="space-y-1">
              <label className="mb-0 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                المبلغ (تحصيل أو استرداد)
              </label>
              <CallCenterAmountPanel
                variant="embedded"
                showAmountLabel={false}
                embeddedCodFirst
                codFieldWidth="full"
                neutralFlowUntilPick={false}
                signedAmount={signedCod}
                flowMode={signedCod < 0 ? 'refund' : 'collect'}
                onChange={({ signed }) => setSignedCod(signed)}
                amountLabel="المبلغ"
                subtitle="تحصيل أو استرداد · ج.م"
                disabled={loading}
                className="w-full min-w-0 [&>div]:w-full [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none"
              />
              <FieldErrorHint id="leader-err-cod">{errors.cod}</FieldErrorHint>
            </div>
            <div>
              <label htmlFor="leader-approval-notes" className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300 font-cairo">
                ملاحظات الاتصال
              </label>
              <textarea
                id="leader-approval-notes"
                value={leaderNotes}
                onChange={(e) => setLeaderNotes(e.target.value)}
                placeholder="تعديل الملاحظات قبل إنشاء التذكرة…"
                dir="rtl"
                rows={5}
                disabled={loading}
                className={textareaNotesClass}
                autoComplete="off"
              />
              <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-cairo">
                تُحفظ مع الطلب وتُمرَّر إلى التذكرة عند الموافقة.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 font-cairo leading-relaxed px-0.5">
            سيتم إنشاء تذكرة خدمة جديدة بناءً على بيانات هذا الطلب. هذه العملية لا يمكن التراجع عنها.
          </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end flex-shrink-0 px-6 pb-5 pt-2 gap-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/30">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-cairo disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || hasErrors}
            className="px-5 py-2 text-sm bg-accent-green-600 text-white rounded-lg hover:bg-accent-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors font-cairo font-semibold flex items-center gap-2 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                جاري التأكيد...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" aria-hidden />
                موافقة وإنشاء تذكرة
              </>
            )}
          </button>
        </div>
      </div>
    </ServiceModalWrapper>
  );
}
