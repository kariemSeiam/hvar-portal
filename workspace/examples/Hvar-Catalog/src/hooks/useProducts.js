import { useState, useEffect, useCallback } from 'react';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/data/products.json');
      if (!response.ok) {
        throw new Error('فشل في تحميل البيانات');
      }
      
      const raw = await response.json();

      // Normalize and deduplicate by SKU (keep the richest record)
      const skuToProduct = new Map();

      const normalized = Array.isArray(raw) ? raw.map((p) => {
        const freeShippingFromBadges = Array.isArray(p.badges) && p.badges.some((b) => `${b}`.includes('شحن'));
        return {
          ...p,
          brand: p.brand || 'Hvar',
          free_shipping: typeof p.free_shipping === 'boolean' ? p.free_shipping : freeShippingFromBadges,
          featured: Boolean(p.featured),
          images: Array.isArray(p.images) ? p.images : [],
          specs: typeof p.specs === 'object' && p.specs !== null ? p.specs : {},
        };
      }) : [];

      for (const product of normalized) {
        const key = (product.sku || product.slug || product.id)?.toString().toLowerCase();
        if (!key) continue;

        if (!skuToProduct.has(key)) {
          skuToProduct.set(key, product);
        } else {
          const existing = skuToProduct.get(key);
          // Prefer item with: more images, has description/specs, higher price_original_egp as a proxy for completeness
          const existingScore = (existing.images?.length || 0)
            + (existing.description_ar ? 2 : 0)
            + (existing.specs && Object.keys(existing.specs).length ? 2 : 0)
            + (existing.price_original_egp ? 1 : 0)
            + (existing.featured ? 1 : 0);
          const candidateScore = (product.images?.length || 0)
            + (product.description_ar ? 2 : 0)
            + (product.specs && Object.keys(product.specs).length ? 2 : 0)
            + (product.price_original_egp ? 1 : 0)
            + (product.featured ? 1 : 0);
          if (candidateScore > existingScore) {
            skuToProduct.set(key, { ...existing, ...product });
          }
        }
      }

      // Sorted featured-first then by current price desc (hero-first merchandising)
      const deduped = Array.from(skuToProduct.values()).sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        const pa = Number.isFinite(a.price_current_egp) ? a.price_current_egp : 0;
        const pb = Number.isFinite(b.price_current_egp) ? b.price_current_egp : 0;
        return pb - pa;
      });

      setProducts(deduped);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const retry = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filterByCategory = useCallback((categorySlug) => {
    if (categorySlug === 'all') {
      return products;
    }
    return products.filter(product => product.category_slug === categorySlug);
  }, [products]);

  const searchProducts = useCallback((query) => {
    if (!query.trim()) {
      return products;
    }
    
    const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return products.filter(product => {
      const normalizedName = product.name_ar.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedDescription = product.description_ar.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      return normalizedName.includes(normalizedQuery) || 
             normalizedDescription.includes(normalizedQuery) ||
             product.sku.toLowerCase().includes(query.toLowerCase());
    });
  }, [products]);

  return {
    products,
    loading,
    error,
    retry,
    filterByCategory,
    searchProducts
  };
};
