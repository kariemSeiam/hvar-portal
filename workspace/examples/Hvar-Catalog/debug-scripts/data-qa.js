/* Data QA script for public/data JSON files (Node ESM). Run with: node debug-scripts/data-qa.js */
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'public', 'data');

/** Allowed verdicts */
const VERDICTS = new Set(['better', 'similar', 'worse', 'pending']);
const PRICE_FLAGS = new Set(['needs_review', 'verify_low']);

function ok(msg) { console.log(`✔ ${msg}`); }
function warn(msg) { console.warn(`⚠ ${msg}`); }
function err(msg) { console.error(`✖ ${msg}`); }

async function readJson(file) {
  const full = path.join(dataDir, file);
  const txt = await fs.readFile(full, 'utf8');
  return JSON.parse(txt);
}

async function main() {
  const products = await readJson('products.json');
  const comparison = await readJson('comparison.json');
  const parts = await readJson('parts.json');

  ok(`Loaded ${products.length} products, ${comparison.competitor_products?.length ?? 0} competitors, ${parts.length} parts.`);

  // Products checks
  for (const p of products) {
    if (p.price_flag && !PRICE_FLAGS.has(p.price_flag)) warn(`Unknown price_flag: ${p.price_flag} (sku=${p.sku})`);
    const tf = p.trade_facts || {};
    if (tf.power_watts != null && Number.isNaN(Number(tf.power_watts))) warn(`Non-numeric power_watts for sku=${p.sku}`);
    if (tf.capacity_liters != null && Number.isNaN(Number(tf.capacity_liters))) warn(`Non-numeric capacity_liters for sku=${p.sku}`);
    if (p.price_original_egp != null && p.price_current_egp != null && p.price_original_egp < p.price_current_egp) warn(`price_original_egp < price_current_egp for sku=${p.sku}`);
  }
  ok('Products validated.');

  // Competitors checks
  for (const c of comparison.competitor_products || []) {
    for (const ax of c?.comparison_to_hvar?.axes || []) {
      if (!VERDICTS.has(ax.verdict)) warn(`Invalid verdict '${ax.verdict}' in competitor ${c.brand} ${c.model}`);
    }
  }
  ok('Competitors validated.');

  // Parts checks
  for (const prt of parts) {
    if (typeof prt.product_id !== 'number') warn(`Part without numeric product_id: ${prt.part_sku}`);
    if (typeof prt.is_replaceable !== 'boolean') warn(`Part is_replaceable not boolean: ${prt.part_sku}`);
  }
  ok('Parts validated.');
}

main().catch((e) => {
  err(e?.stack || e?.message || String(e));
  process.exitCode = 1;
});
