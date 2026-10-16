# Generated landing images

Every image in this folder was generated for the NOD landing with [ima2-gen](https://github.com/lidge-ai/ima2-gen) 3.26.2 on the GPT OAuth lane (model `gpt-6-luna`), on 2026-10-16. No stock or third-party image is used. The OAuth lane returns at most 1536x1024, even when a larger size is requested.

## ledger-plate-{1536,768}.{avif,webp} (hero)

Command: `ima2 gen --stdin --provider oauth -q high -s 1536x1024 -n 2` (the second of the two results is used).

```text
Photorealistic photograph of an open archival ledger book lying flat on a warm wooden desk, seen from a low 30-degree three-quarter angle, the right-hand page filling most of the frame. The pages are completely blank: only fine warm-grey horizontal ruled lines (#DCD8CF) and one thin vertical margin rule near the left edge of each page, forming an empty grid of about twelve rows. No writing, no numbers, no letters, no text of any kind anywhere, no highlighter. Warm cream paper (#FFFDFA) with visible fibres and subtle grain, soft window daylight from the upper left, gentle falloff and shallow depth of field toward the far edge. Calm, quiet, editorial, generous negative space. Near-black ink tones only in shadows. No people, no hands, no pens, no logos, no watermark.
```

Processing:
- The plate has no text. The ledger rows are HTML text. `landing.js` maps them onto the ruled page with a homography.
- Ruled area of the right page, in plate pixels (`QUAD` in `landing.js`): top-left 458,215 / top-right 1150,143 / bottom-right 1420,697 / bottom-left 566,820.
- The 13 ruling lines were detected from the pixels (column minima at x = 700, 900, 1100). The 12 row heights in `.ld-page` (`landing.css`) come from those lines.
- Encoding: `ffmpeg -vf scale=W:-2 -c:v libsvtav1 -crf 34|36 -preset 4 -pix_fmt yuv420p10le` (AVIF) and `cwebp -q 74` (WebP).

## card-drawer-{1440,720}.{avif,webp} (01 Save)

Command: `ima2 gen --stdin --provider oauth -q high -s 2048x1536 -n 2` (the first result is used; the lane returned 1448x1086).

```text
Photorealistic still-life photograph of a long oak archival index-card drawer seen from above at a slight three-quarter angle, filled with warm cream index cards standing upright in strict order, each card with a small blank tab on its top edge. Exactly one empty gap in the row, about one card wide, in the left third of the drawer, as if one card is missing. No writing, no numbers, no letters, no text of any kind. Soft diffuse window daylight from the upper left, gentle shadows, visible paper fibres. Palette: cream paper #FFFDFA, warm oak, near-black ink only in shadows. Calm, quiet, editorial. No people, no hands, no logos, no watermark.
```

Processing: `crop=1440:600:4:182` keeps the empty slot and the space above it. Then the same AVIF/WebP encoding as the plate.

## card-yellow-240.webp (01 Save)

Command: `ima2 gen "<prompt>" --provider oauth -q high -s 1024x1536 --bg transparent -n 2 --ref <drawer source PNG>` (the second result is used).

```text
Image 1 is a reference only for camera angle, perspective, lighting and paper. Create ONE single upright index card that matches the cards standing in that drawer exactly: same three-quarter viewing angle and perspective, same warm cream card stock (#FFFDFA) with fine fibres, same soft daylight from the upper left. Its tab on the top edge is highlighter yellow (#E8B931). Blank card: no writing, no numbers, no text. Isolated on a transparent background: no drawer, no other cards, no wood, no drop shadow, nothing else.
```

Processing:
- The source PNG has a real alpha channel: 675,168 pixels with alpha > 240, 14,751 semi-transparent edge pixels and 882,945 fully transparent pixels.
- The image was trimmed to the alpha bounding box (913x1121 at 67,213), scaled to 240 px wide and saved with `cwebp -q 82 -alpha_q 90`. The output is yuva420p.
