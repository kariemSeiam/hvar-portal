# What's Left — Remaining Research Gaps

> We extracted everything from the codebase. These gaps require **live access** (screenshots, DB query, or admin panel).

## Easy (if you provide)

| # | What | How |
|---|------|-----|
| 1 | **hvarstore.com full-page screenshot** (homepage + product page) | Browser screenshot → I extract live brand colors, fonts, layout patterns |
| 2 | **HVAR logo** (SVG/PNG) | Any format — needed for all software projects |
| 3 | **Settings > General** from admin panel | Shows `base_color`, `website_name`, `site_icon`, `meta_image` — the actual brand values |
| 4 | **Product list screenshot** from admin | See the real SKUs, prices, stock levels |

## Medium (needs DB or code search)

| # | What | How |
|---|------|-----|
| 5 | **Settings table from DB** | `SELECT * FROM settings WHERE type LIKE '%color%' OR type LIKE '%site%' OR type LIKE '%theme%'` |
| 6 | **Live CSS file** | `curl https://hvarstore.com/assets/css/aiz-core.css` or just send the `<style>` block URL |
| 7 | **WhatsApp wholesale integration** | Search codebase for "whatsapp" or "wa.me" — I can do this if you point me to the right dir |

## Hard (needs API credentials or access)

| # | What | Why |
|---|------|-----|
| 8 | **ValU/Souhoola/Aman API keys or docs** | To check if installment payments can integrate with our POS |
| 9 | **Bosta API credentials** | Already in the code — just need to know if it's active |
| 10 | **TikTok Pixel ID / Meta Pixel** | For the marketing/ad engine recommendation |
