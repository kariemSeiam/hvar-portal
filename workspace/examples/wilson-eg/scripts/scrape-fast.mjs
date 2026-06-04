#!/usr/bin/env node
/**
 * Wilson Egypt Complete Scraper (Parallel Version)
 * Fetches ALL products + downloads ALL images locally (parallel)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const API_BASE = 'https://wilson-eg.com/wp-json/wc/store/v1/products';
const OUTPUT_DIR = path.join(ROOT, 'docs');
const IMAGES_DIR = path.join(ROOT, 'uploads', 'products');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'wilson-complete-with-images.json');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

async function fetchAllProducts() {
  console.log('📦 Fetching products...');
  const response = await fetch(`${API_BASE}?per_page=100`);
  const products = await response.json();
  console.log(`  ✓ Fetched ${products.length} products\n`);
  return products;
}

async function downloadImage(url, filename) {
  if (!url) return null;
  
  const localPath = path.join(IMAGES_DIR, filename);
  
  if (fs.existsSync(localPath)) {
    return `uploads/products/${filename}`;
  }
  
  try {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(localPath, buffer);
    return `uploads/products/${filename}`;
  } catch {
    return null;
  }
}

async function processProduct(product) {
  const id = product.id;
  const name = product.name || '';
  const prices = product.prices || {};
  const price = parseInt(prices.price || 0) / 100;
  const regularPrice = parseInt(prices.regular_price || prices.price || 0) / 100;
  const salePrice = parseInt(prices.sale_price || prices.price || 0) / 100;
  
  // Category detection
  let category = 'home_appliances';
  const nameLower = name.toLowerCase();
  if (name.includes('فريزر')) category = 'freezers';
  else if (name.includes('كوك') || name.includes('بوتاجاز')) category = 'stoves';
  else if (name.includes('مبرد')) category = 'water_coolers';
  else if (name.includes('مكنسة')) category = 'vacuum_cleaners';
  else if (name.includes('خلاط') || name.includes('بليندر')) category = 'blenders';
  else if (name.includes('تلفزيون') || name.includes('شاشة')) category = 'tvs';
  
  // Specs
  const specs = {};
  const modelMatch = name.match(/[A-Z]{1,3}-?[A-Z0-9]{2,6}/);
  if (modelMatch) specs.model = modelMatch[0];
  
  const text = (product.description || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  const features = text.split('\n').filter(l => l.trim().length > 3).slice(0, 10);
  if (features.length > 0) specs.features = features;
  
  // Download images in parallel
  const images = product.images || [];
  const imageDownloads = images.map((img, i) => {
    const ext = path.extname(new URL(img.src).pathname) || '.png';
    return {
      src: img.src,
      filename: `${id}_${i === 0 ? 'main' : 'gallery_' + i}${ext}`,
      index: i
    };
  });
  
  const downloadResults = await Promise.all(
    imageDownloads.map(d => downloadImage(d.src, d.filename))
  );
  
  const downloadedImages = imageDownloads.map((d, i) => ({
    local_path: downloadResults[i],
    original_url: d.src
  })).filter(img => img.local_path);
  
  const mainImage = downloadedImages[0]?.local_path || null;
  
  console.log(`  ✓ [${id}] ${name.substring(0, 40)}... (${downloadedImages.length} images)`);
  
  return {
    id,
    name_ar: name,
    name_en: name.match(/[A-Z]{2,}[A-Z0-9\-]*/g)?.join(' ') || name,
    price,
    regular_price: regularPrice,
    sale_price: salePrice < regularPrice ? salePrice : null,
    price_formatted: `${price.toLocaleString()} EGP`,
    status: product.is_in_stock ? 'in_stock' : 'out_of_stock',
    category,
    rating: parseFloat(product.average_rating || 0),
    reviews: parseInt(product.review_count || 0),
    description: product.description || '',
    specs,
    images: downloadedImages,
    thumbnail: mainImage,
    main_image: mainImage,
    sku: product.sku || '',
    on_sale: product.on_sale || false
  };
}

async function main() {
  console.log('🐙 Wilson Egypt Scraper (Parallel)\n');
  
  const rawProducts = await fetchAllProducts();
  
  console.log('📥 Processing products in parallel...\n');
  const processedProducts = await Promise.all(rawProducts.map(processProduct));
  
  const output = {
    meta: {
      site: 'wilson-eg.com',
      extraction_date: new Date().toISOString().split('T')[0],
      total_products: processedProducts.length
    },
    summary: {
      total_products: processedProducts.length,
      with_images: processedProducts.filter(p => p.images.length > 0).length,
      categories: [...new Set(processedProducts.map(p => p.category))]
    },
    products: processedProducts
  };
  
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2), 'utf8');
  
  const totalImages = processedProducts.reduce((sum, p) => sum + p.images.length, 0);
  
  console.log(`\n✅ DONE!`);
  console.log(`   Products: ${processedProducts.length}`);
  console.log(`   Images: ${totalImages}`);
  console.log(`   JSON: ${OUTPUT_JSON}`);
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
