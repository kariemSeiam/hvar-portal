#!/usr/bin/env node
// Quick scrape - saves after each product
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'uploads', 'products');
const OUTPUT_JSON = path.join(ROOT, 'docs', 'wilson-complete-with-images.json');

fs.mkdirSync(IMAGES_DIR, { recursive: true });

async function main() {
  console.log('📦 Fetching all products...');
  const response = await fetch('https://wilson-eg.com/wp-json/wc/store/v1/products?per_page=100');
  const products = await response.json();
  console.log(`  Found ${products.length} products\n`);

  const results = [];
  
  for (const p of products) {
    const id = p.id;
    const name = p.name || '';
    const prices = p.prices || {};
    const price = parseInt(prices.price || 0) / 100;
    const regularPrice = parseInt(prices.regular_price || prices.price || 0) / 100;
    const salePrice = parseInt(prices.sale_price || prices.price || 0) / 100;
    
    // Category
    let category = 'home_appliances';
    if (name.includes('فريزر')) category = 'freezers';
    else if (name.includes('كوك') || name.includes('بوتاجاز')) category = 'stoves';
    else if (name.includes('مبرد')) category = 'water_coolers';
    else if (name.includes('مكنسة')) category = 'vacuum_cleaners';
    else if (name.includes('خلاط') || name.includes('بليندر')) category = 'blenders';
    else if (name.includes('شاشة')) category = 'tvs';
    
    // Model
    const modelMatch = name.match(/[A-Z]{1,3}-?[A-Z0-9]{2,6}/);
    const specs = modelMatch ? { model: modelMatch[0] } : {};
    
    // Download images
    const images = [];
    let mainImage = null;
    
    for (let i = 0; i < (p.images || []).length; i++) {
      const img = p.images[i];
      if (!img.src) continue;
      
      const ext = path.extname(new URL(img.src).pathname) || '.png';
      const filename = `${id}_${i === 0 ? 'main' : 'g' + i}${ext}`;
      const localPath = path.join(IMAGES_DIR, filename);
      
      if (!fs.existsSync(localPath)) {
        try {
          const res = await fetch(img.src);
          fs.writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
        } catch {}
      }
      
      if (fs.existsSync(localPath)) {
        const relPath = `uploads/products/${filename}`;
        images.push({ local_path: relPath, original_url: img.src });
        if (i === 0) mainImage = relPath;
      }
    }
    
    const result = {
      id,
      name_ar: name,
      name_en: name.match(/[A-Z]{2,}[A-Z0-9\-]*/g)?.join(' ') || name,
      price,
      regular_price: regularPrice,
      sale_price: salePrice < regularPrice ? salePrice : null,
      status: p.is_in_stock ? 'in_stock' : 'out_of_stock',
      category,
      specs,
      images,
      thumbnail: mainImage,
      main_image: mainImage,
      on_sale: p.on_sale || false
    };
    
    results.push(result);
    console.log(`✓ [${id}] ${name.substring(0, 35)}... (${images.length} img)`);
    
    // Save incrementally
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify({
      meta: { extraction_date: new Date().toISOString().split('T')[0], total: results.length },
      products: results
    }, null, 2));
  }
  
  console.log(`\n✅ Complete: ${results.length} products, images saved to uploads/products/`);
}

main();
