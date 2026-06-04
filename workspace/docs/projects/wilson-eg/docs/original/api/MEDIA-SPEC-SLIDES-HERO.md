# Media spec — Hero & slider images

Standard dimensions for UI/UX and design so media works on mobile and web.

---

## Wilson home hero (current)

- **Source:** Admin → Slides. The same slides appear in the home hero when available (fallback: static images).
- **Display:** Square **1:1** viewport (hidden on mobile; from 768px: ~208px, from 1024px: ~224px). Images use `object-fit: cover` and `object-position: center`.

| Use | Width | Height | Aspect | Format |
|-----|-------|--------|--------|--------|
| **Recommended** | **800px** | **800px** | 1:1 | JPG/WebP |
| Retina / high-DPI | 1000px | 1000px | 1:1 | JPG/WebP |

- Keep important content in the **center** (cropping is center-based).
- Max file size: ~200–300 KB per image after optimization.

---

## Common hero/slider sizes (general reference)

| Context | Width | Height | Aspect | Notes |
|---------|-------|--------|--------|--------|
| Desktop full-width hero | 1920px | 600–800px | 16:5 – 24:10 | Safe content within 1440px |
| Tablet hero | 1280px | 640px | 2:1 | |
| Mobile hero / banner | 828px | 466–828px | 16:9 – 1:1 | 828 = common mobile width |
| Square (cards, Wilson hero) | 800–1000px | 800–1000px | 1:1 | Min 400px for 2× retina |
| Story / vertical | 1080px | 1920px | 9:16 | If needed later |

---

## Rules of thumb

1. **Retina:** Export at 2× the largest display size (e.g. 224px → 448px min; 800px is safe).
2. **Aspect:** Match the display aspect (Wilson home hero = 1:1) to avoid heavy crop.
3. **Format:** WebP preferred; JPG fallback. PNG only if transparency needed.
4. **Weight:** Compress; hero images &lt; 300 KB each for fast load.

---

*Reference: `project/frontend/src/styles/globals.css` (`.hero-wilson-viewport__stage` aspect-ratio 1/1, max-width 13–14rem).*
