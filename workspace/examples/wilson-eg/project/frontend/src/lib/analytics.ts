/**
 * Analytics module — ready for GA4, PostHog, or custom backend.
 * Set VITE_ANALYTICS_ID (or VITE_GA_ID) in env to enable.
 * In production, inject the provider script in index.html.
 */

const GA_ID = import.meta.env.VITE_GA_ID ?? import.meta.env.VITE_ANALYTICS_ID ?? ''

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function pushToDataLayer(event: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({ event, ...params })
  }
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params)
  }
}

export const analytics = {
  pageView: (path: string, title?: string, locale?: string) => {
    pushToDataLayer('page_view', {
      page_path: path,
      page_title: title,
      page_locale: locale,
    })
  },

  event: (name: string, params?: Record<string, unknown>) => {
    pushToDataLayer(name, params)
  },

  productView: (productId: string, name: string, price: number) => {
    analytics.event('view_item', {
      items: [{ item_id: productId, item_name: name, price }],
    })
  },

  addToCart: (productId: string, name: string, price: number, quantity: number) => {
    analytics.event('add_to_cart', {
      items: [{ item_id: productId, item_name: name, price, quantity }],
    })
  },

  beginCheckout: (value: number, items: number) => {
    analytics.event('begin_checkout', { value, item_count: items })
  },

  purchase: (orderId: string, value: number) => {
    analytics.event('purchase', { transaction_id: orderId, value })
  },

  isEnabled: () => !!GA_ID,
}
