#!/usr/bin/env node
// Aggressive timeout version
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'uploads', 'products');
const OUTPUT_JSON = path.join(ROOT, 'docs', 'wilson-complete-with-images.json');

fs.mkdirSync(IMAGES_DIR, { recursive: true });

let existing = { products: [] };
if (fs.existsSync(OUTPUT_JSON)) existing = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));
const processedIds = new Set(existing.products.map(p => p.id));

async function main() {
  const response = await fetch('https://wilson-eg.com/wp-json/wc/store/v1/products?per_page=100');
  const products = await response.json();
  const toProcess = products.filter(p => !processedIds.has(p.id));
  
  console.log(`Remaining: ${toProcess.length}`);

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
    
    // Only first image, 5 second timeout
    const img = (p.images || [])[0];
    if (img?.src) {
      const ext = path.extname(new URL(img.src).pathname) || '.png';
      const filename = `${id}_main${ext}`;
      const localPath = path.join(IMAGES_DIR, filename);
      
      if (!fs.existsSync(localPath)) {
        try {
          const res = await fetch(img.src, { signal: AbortSignal.timeout(5000) });
          fs.writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
        } catch (e) {
          console.log(`  [${id}] Image timeout, skipping...`);
        }
      }
      
      if (fs.existsSync(localPath)) {
        mainImage = `uploads/products/${filename}`;
        images.push({ local_path: mainImage });
      }
    }
    
    existing.products.push({
      id, name_ar: name, name_en: name.match(/[A-Z]{2,}[A-Z0-9\-]*/g)?.join(' ') || name,
      price, regular_price: regularPrice, sale_price: salePrice < regularPrice ? salePrice : null,
      status: p.is_in_stock ? 'in_stock' : 'out_of_stock', category, specs,
      images, thumbnail: mainImage, main_image: mainImage, on_sale: p.on_sale || false
    });
    
    console.log(`✓ [${id}] ${name.substring(0, 30)}...`);
    
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify({
      meta: { total: existing.products.length },
      products: existing.products
    }, null, 2));
  }
  
  console.log(`\n✅ Total: ${existing.products.length}`);
}

main();
