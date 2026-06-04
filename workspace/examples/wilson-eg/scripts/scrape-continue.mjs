#!/usr/bin/env node
// Skip already processed - continues from where it stopped
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'uploads', 'products');
const OUTPUT_JSON = path.join(ROOT, 'docs', 'wilson-complete-with-images.json');

fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Load existing
let existing = { products: [] };
if (fs.existsSync(OUTPUT_JSON)) {
  existing = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));
}
const processedIds = new Set(existing.products.map(p => p.id));

async function main() {
  console.log('📦 Fetching products...');
  const response = await fetch('https://wilson-eg.com/wp-json/wc/store/v1/products?per_page=100');
  const products = await response.json();
  
  const toProcess = products.filter(p => !processedIds.has(p.id));
  console.log(`  Total: ${products.length}, Already done: ${processedIds.size}, Remaining: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log('✅ All products already processed!');
    return;
  }

  for (const p of toProcess) {
    const id = p.id;
    const name = p.name || '';
    const prices = p.prices || {};
    const price = parseInt(prices.price || 0) / 100;
    const regularPrice = parseInt(prices.regular_price || prices.price || 0) / 100;
    const salePrice = parseInt(prices.sale_price || prices.price || 0) / 100;
    
    let category = 'home_appliances';
    if (name.includes('فريزر')) category = 'freezers';
    else if (name.includes('كوك') || name.includes('بوتاجاز')) category = 'stoves';
    else if (name.includes('مبرد')) category = 'water_coolers';
    else if (name.includes('مكنسة')) category = 'vacuum_cleaners';
    else if (name.includes('خلاط') || name.includes('بليندر')) category = 'blenders';
    else if (name.includes('شاشة')) category = 'tvs';
    
    const modelMatch = name.match(/[A-Z]{1,3}-?[A-Z0-9]{2,6}/);
    const specs = modelMatch ? { model: modelMatch[0] } : {};
    
    const images = [];
    let mainImage = null;
    
    for (let i = 0; i < Math.min((p.images || []).length, 3); i++) { // Limit to 3 images
      const img = p.images[i];
      if (!img.src) continue;
      
      const ext = path.extname(new URL(img.src).pathname) || '.png';
      const filename = `${id}_${i === 0 ? 'main' : 'g' + i}${ext}`;
      const localPath = path.join(IMAGES_DIR, filename);
      
      if (!fs.existsSync(localPath)) {
        try {
          const res = await fetch(img.src, { signal: AbortSignal.timeout(15000) });
          fs.writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
        } catch {}
      }
      
      if (fs.existsSync(localPath)) {
        const relPath = `uploads/products/${filename}`;
        images.push({ local_path: relPath });
        if (i === 0) mainImage = relPath;
      }
    }
    
    existing.products.push({
      id, name_ar: name, name_en: name.match(/[A-Z]{2,}[A-Z0-9\-]*/g)?.join(' ') || name,
      price, regular_price: regularPrice, sale_price: salePrice < regularPrice ? salePrice : null,
      status: p.is_in_stock ? 'in_stock' : 'out_of_stock', category, specs,
      images, thumbnail: mainImage, main_image: mainImage, on_sale: p.on_sale || false
    });
    
    console.log(`✓ [${id}] ${name.substring(0, 35)}... (${images.length} img)`);
    
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify({
      meta: { extraction_date: new Date().toISOString().split('T')[0], total: existing.products.length },
      products: existing.products
    }, null, 2));
  }
  
  console.log(`\n✅ Total: ${existing.products.length} products`);
}

main();
