#!/usr/bin/env node
/**
 * Wilson Egypt Complete Scraper
 * Fetches ALL products + downloads ALL images locally
 * 
 * Usage: node scripts/scrape-wilson-complete.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Config
const API_BASE = 'https://wilson-eg.com/wp-json/wc/store/v1/products';
const OUTPUT_DIR = path.join(ROOT, 'docs');
const IMAGES_DIR = path.join(ROOT, 'uploads', 'products');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'wilson-complete-with-images.json');

// Ensure directories exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

/**
 * Fetch all products from WooCommerce API
 */
async function fetchAllProducts() {
  console.log('📦 Fetching products from WooCommerce API...\n');
  
  const allProducts = [];
  let page = 1;
  const perPage = 50;
  
  while (true) {
    const url = `${API_BASE}?per_page=${perPage}&page=${page}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`  ✗ Error: ${response.status} ${response.statusText}`);
        break;
      }
      
      const products = await response.json();
      
      if (!Array.isArray(products) || products.length === 0) {
        break;
      }
      
      allProducts.push(...products);
      console.log(`  ✓ Page ${page}: ${products.length} products (total: ${allProducts.length})`);
      
      if (products.length < perPage) {
        break;
      }
      
      page++;
    } catch (error) {
      console.error(`  ✗ Error fetching page ${page}:`, error.message);
      break;
    }
  }
  
  return allProducts;
}

/**
 * Download an image and save locally
 */
async function downloadImage(url, productId, imageType) {
  if (!url) return null;
  
  const ext = path.extname(new URL(url).pathname) || '.png';
  const hash = Buffer.from(url).toString('base64').slice(0, 8);
  const filename = `${productId}_${imageType}_${hash}${ext}`;
  const localPath = path.join(IMAGES_DIR, filename);
  
  // Skip if already downloaded
  if (fs.existsSync(localPath)) {
    console.log(`    ✓ Already exists: ${filename}`);
    return `uploads/products/${filename}`;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`    ✗ Failed: ${response.status}`);
      return null;
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(localPath, buffer);
    
    console.log(`    ✓ Downloaded: ${filename}`);
    return `uploads/products/${filename}`;
  } catch (error) {
    console.log(`    ✗ Error: ${error.message}`);
    return null;
  }
}

/**
 * Parse HTML description to extract specs
 */
function parseSpecs(description, name) {
  const specs = {};
  
  // Extract model from name
  const modelMatch = name.match(/[A-Z]{1,3}-?[A-Z0-9]{2,6}/);
  if (modelMatch) {
    specs.model = modelMatch[0];
  }
  
  if (!description) return specs;
  
  // Clean HTML
  const text = description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<strong>([^<]+)<\/strong>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
  
  const features = [];
  
  for (const line of text.split('\n')) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.length < 3) continue;
    
    if (cleanLine.includes(':')) {
      const [key, ...valueParts] = cleanLine.split(':');
      const value = valueParts.join(':').trim();
      const keyLower = key.toLowerCase();
      
      if (key.includes('موديل') || keyLower.includes('model')) {
        specs.model = value || specs.model;
      } else if (key.includes('ضمان') || keyLower.includes('warranty')) {
        specs.warranty = value;
      } else if (key.includes('سعة') || keyLower.includes('capacity')) {
        specs.capacity = value;
      } else if (key.includes('قدرة') || keyLower.includes('power')) {
        specs.power = value;
      } else if (key.includes('بعد') || key.includes('أبعاد') || keyLower.includes('dimension') || key.includes('مقاس')) {
        specs.dimensions = value;
      } else {
        features.push(cleanLine);
      }
    } else {
      features.push(cleanLine);
    }
  }
  
  if (features.length > 0) {
    specs.features = features.slice(0, 15);
  }
  
  return specs;
}

/**
 * Extract English name from Arabic/English mixed name
 */
function extractEnglishName(name) {
  const englishParts = name.match(/[A-Z]{2,}[A-Z0-9\-]*/g);
  if (englishParts) {
    return englishParts.join(' ');
  }
  
  const modelMatch = name.match(/[A-Z]{1,3}-?[A-Z0-9]{2,6}/);
  if (modelMatch) {
    return `Wilson ${modelMatch[0]}`;
  }
  
  return name;
}

/**
 * Determine category from product name
 */
function determineCategory(name, categories) {
  // Check WooCommerce categories first
  if (categories && categories.length > 0) {
    const catName = categories[0].name.toLowerCase();
    if (catName.includes('بوتوجاز') || catName.includes('بوتاجاز')) return 'stoves';
  }
  
  const nameLower = name.toLowerCase();
  
  if (name.includes('فريزر') || nameLower.includes('freezer')) return 'freezers';
  if (name.includes('كوك') || name.includes('بوتاجاز') || nameLower.includes('cooker') || nameLower.includes('stove')) return 'stoves';
  if (name.includes('مبرد') || nameLower.includes('cooler')) return 'water_coolers';
  if (name.includes('مكنسة') || nameLower.includes('vacuum')) return 'vacuum_cleaners';
  if (name.includes('خلاط') || name.includes('بليندر') || nameLower.includes('blender')) return 'blenders';
  if (name.includes('تلفزيون') || name.includes('شاشة') || nameLower.includes('tv')) return 'tvs';
  
  return 'home_appliances';
}

/**
 * Process a single product
 */
async function processProduct(product) {
  const id = product.id;
  const name = product.name || '';
  
  console.log(`\n  [${id}] ${name.substring(0, 50)}...`);
  
  // Prices (WooCommerce stores in minor units)
  const prices = product.prices || {};
  const price = parseInt(prices.price || 0) / 100;
  const regularPrice = parseInt(prices.regular_price || prices.price || 0) / 100;
  const salePrice = parseInt(prices.sale_price || prices.price || 0) / 100;
  
  // Category
  const category = determineCategory(name, product.categories);
  
  // Specs
  const specs = parseSpecs(product.description, name);
  
  // Download images
  const images = product.images || [];
  const downloadedImages = [];
  let mainImage = null;
  let thumbnail = null;
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgType = i === 0 ? 'main' : `gallery_${i}`;
    
    // Download main image
    if (img.src) {
      const localPath = await downloadImage(img.src, id, imgType);
      if (localPath) {
        downloadedImages.push({
          original_url: img.src,
          local_path: localPath,
          type: imgType,
          name: img.name || '',
          alt: img.alt || ''
        });
        
        if (i === 0) {
          mainImage = localPath;
        }
      }
    }
    
    // Download thumbnail (if different)
    if (img.thumbnail && img.thumbnail !== img.src && i === 0) {
      const thumbPath = await downloadImage(img.thumbnail, id, `thumb_${i}`);
      if (thumbPath) {
        thumbnail = thumbPath;
      }
    }
  }
  
  // Use main image as thumbnail if not downloaded separately
  if (!thumbnail && mainImage) {
    thumbnail = mainImage;
  }
  
  return {
    id,
    name_ar: name,
    name_en: extractEnglishName(name),
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
    thumbnail,
    main_image: mainImage,
    sku: product.sku || '',
    slug: product.slug || '',
    permalink: product.permalink || '',
    on_sale: product.on_sale || false
  };
}

/**
 * Main
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🐙 Wilson Egypt Complete Scraper');
  console.log('='.repeat(60));
  console.log();
  
  // Fetch all products
  const rawProducts = await fetchAllProducts();
  
  if (rawProducts.length === 0) {
    console.log('\n✗ No products found!');
    process.exit(1);
  }
  
  console.log(`\n✓ Total products fetched: ${rawProducts.length}`);
  
  // Process each product
  console.log('\n📥 Processing products and downloading images...');
  const processedProducts = [];
  
  for (const product of rawProducts) {
    try {
      const processed = await processProduct(product);
      processedProducts.push(processed);
    } catch (error) {
      console.error(`\n  ✗ Error processing product ${product.id}:`, error.message);
    }
  }
  
  // Build final JSON
  const output = {
    meta: {
      site: 'wilson-eg.com',
      company: 'Wilson (ويلسن)',
      extraction_date: new Date().toISOString().split('T')[0],
      currency: 'EGP (Egyptian Pound)',
      platform: 'WordPress + WooCommerce',
      images: 'downloaded_locally',
      total_products: processedProducts.length
    },
    summary: {
      total_products: processedProducts.length,
      with_images: processedProducts.filter(p => p.images.length > 0).length,
      categories: [...new Set(processedProducts.map(p => p.category))]
    },
    products: processedProducts
  };
  
  // Save JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2), 'utf8');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ COMPLETE!');
  console.log('='.repeat(60));
  console.log(`  Products: ${processedProducts.length}`);
  console.log(`  With images: ${output.summary.with_images}`);
  console.log(`  JSON saved: ${OUTPUT_JSON}`);
  console.log(`  Images saved: ${IMAGES_DIR}`);
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
