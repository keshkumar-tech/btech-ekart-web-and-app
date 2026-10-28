/**
 * Generates the B.Tech eKart launcher icon set (no external assets needed).
 *
 *   node scripts/make-icons.js
 *
 * Draws a rounded "e" monogram on a blue→violet gradient with a graduation cap,
 * matching the in-app brand mark, then writes:
 *   assets/icon.png            1024  full-bleed square icon
 *   assets/adaptive-icon.png   1024  Android adaptive foreground (safe zone)
 *   assets/splash.png          1284x2778 splash lockup
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "assets");
const S = 1024;

// ---------------------------------------------------------------- PNG encoder
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(w, h, rgba) {
  // Filter type 0 (None) on every scanline — universally decodable.
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --------------------------------------------------------------- tiny canvas
class Canvas {
  constructor(size) {
    this.size = size;
    this.px = new Float32Array(size * size * 4);
  }
  blend(x, y, r, g, b, a) {
    if (a <= 0 || x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    x = Math.floor(x);
    y = Math.floor(y);
    const i = (y * this.size + x) * 4;
    const p = this.px;
    const na = a + p[i + 3] * (1 - a);
    if (na <= 0) return;
    p[i] = (r * a + p[i] * p[i + 3] * (1 - a)) / na;
    p[i + 1] = (g * a + p[i + 1] * p[i + 3] * (1 - a)) / na;
    p[i + 2] = (b * a + p[i + 2] * p[i + 3] * (1 - a)) / na;
    p[i + 3] = na;
  }
  // Anti-aliased shape fill: `inside(x,y)` decides coverage, 2x2 MSAA.
  // Only pixels near the shape are touched, so a full-screen fill is cheap.
  fill(inside, color, alpha = 1) {
    const { size } = this;
    const [r, g, b] = color;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Fast path: the pixel centre is clearly outside → skip the 4 samples
        // only when no sub-sample can hit (checked by sampling the corners).
        let hits = 0;
        for (let sy = 0; sy < 2; sy++)
          for (let sx = 0; sx < 2; sx++) {
            if (inside(x + (sx + 0.5) / 2, y + (sy + 0.5) / 2)) hits++;
          }
        if (hits) this.blend(x, y, r, g, b, (hits / 4) * alpha);
      }
    }
  }
  rect(x0, y0, x1, y1) {
    this.fill(
      (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1,
      [255, 255, 255],
      1,
    );
  }
  gradient(fn) {
    const { size } = this;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const [r, g, b, a] = fn(x / size, y / size);
        this.blend(x, y, r, g, b, a);
      }
  }
  toBuffer() {
    const out = Buffer.alloc(this.size * this.size * 4);
    for (let i = 0; i < this.px.length; i += 4) {
      // Flatten against the brand blue so no pixel is left semi-transparent
      // (some launchers render alpha strangely on squares).
      const a = Math.max(0, Math.min(1, this.px[i + 3]));
      out[i] = Math.max(
        0,
        Math.min(255, Math.round(this.px[i] * a + 40 * (1 - a))),
      );
      out[i + 1] = Math.max(
        0,
        Math.min(255, Math.round(this.px[i + 1] * a + 116 * (1 - a))),
      );
      out[i + 2] = Math.max(
        0,
        Math.min(255, Math.round(this.px[i + 2] * a + 240 * (1 - a))),
      );
      out[i + 3] = 255;
    }
    return encodePNG(this.size, this.size, out);
  }
}

const lerp = (a, b, t) => a + (b - a) * t;
const rgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

// ------------------------------------------------------------------- artwork
function drawMark(canvas, scale = 1) {
  const S2 = canvas.size;
  const c = S2 / 2;
  const R = S2 * 0.33 * scale; // "e" radius
  const stroke = S2 * 0.105 * scale;

  // Graduation cap sitting above the "e"
  const capY = c - R * 1.18;
  const capW = S2 * 0.46 * scale;
  const capH = S2 * 0.115 * scale;
  canvas.fill(
    (x, y) =>
      Math.abs(y - capY) < capH &&
      Math.abs(x - c) < capW * (1 - Math.abs(y - capY) / capH),
    rgb("#ffc93c"),
    1,
  );
  // Tassel
  canvas.fill(
    (x, y) =>
      x > c + capW - S2 * 0.02 * scale &&
      x < c + capW + S2 * 0.012 * scale &&
      y > capY &&
      y < capY + S2 * 0.13 * scale,
    rgb("#ffffff"),
    0.95,
  );
  canvas.fill(
    (x, y) =>
      (x - (c + capW - S2 * 0.004 * scale)) ** 2 +
        (y - (capY + S2 * 0.14 * scale)) ** 2 <
      (S2 * 0.022 * scale) ** 2,
    rgb("#ffc93c"),
    1,
  );

  // "e" glyph: a ring with a gap on the right, plus the horizontal bar.
  const inRing = (x, y) => {
    const d = Math.hypot(x - c, y - c);
    if (d > R || d < R - stroke) return false;
    // Gap on the right side (upper-right quadrant).
    const ang = Math.atan2(y - c, x - c);
    if (ang > -0.55 && ang < 0.22) return false;
    return true;
  };
  canvas.fill(inRing, rgb("#ffffff"), 1);
  // Crossbar of the "e"
  canvas.fill(
    (x, y) => x > c - R && x < c + R * 0.92 && Math.abs(y - c) < stroke * 0.46,
    rgb("#ffffff"),
    1,
  );
}

function makeIcon({ adaptive = false, round = false } = {}) {
  // Output size: a 1024 icon scaled down (nearest-neighbour is fine at these
  // sizes because we render from scratch at the target size instead).
  const canvas = new Canvas(S);
  // Blue → violet diagonal gradient (same palette as the app).
  const from = rgb("#2874f0");
  const to = rgb("#6d28d9");
  canvas.gradient((u, v) => {
    const t = Math.min(1, u * 0.7 + v * 0.5);
    if (round) {
      // Circular icon for launchers that use `ic_launcher_round`.
      if (Math.hypot(u - 0.5, v - 0.5) > 0.5) return [0, 0, 0, 0];
    }
    return [
      lerp(from[0], to[0], t),
      lerp(from[1], to[1], t),
      lerp(from[2], to[2], t),
      1,
    ];
  });

  if (!adaptive) {
    // Soft highlight in the top-left.
    canvas.gradient((u, v) => {
      const d = Math.hypot(u - 0.22, v - 0.18);
      const a = Math.max(0, 0.35 - d) * 0.9;
      return [255, 255, 255, a];
    });
    if (!round) {
      // Rounded-square corners (modern launchers expect a squircle).
      const r = S * 0.22;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          if ((x >= r && x <= S - r) || (y >= r && y <= S - r)) continue;
          const cx = x < r ? r : S - r;
          const cy = y < r ? r : S - r;
          if (Math.hypot(x - cx, y - cy) > r) {
            canvas.px[(y * S + x) * 4 + 3] = 0;
          }
        }
      }
    }
  }
  // Adaptive icons get their mask from Android, so keep the mark inside the
  // 66% safe zone and leave the background full-bleed.
  drawMark(canvas, adaptive ? 0.72 : 0.86);
  return canvas.toBuffer();
}

function makeSplash() {
  const W = 1284;
  const H = 2778;
  const MARK = 620;
  const buf = Buffer.alloc(W * H * 4);

  // Brand-blue background, with the launcher mark centred.
  // Build the mark exactly like the launcher icon: an opaque blue→violet
  // disc, then the white "e" + yellow cap drawn on top of it. (Tinting the
  // glyph with the same gradient would make it vanish into the background.)
  const mark = new Canvas(MARK);
  const mc = MARK / 2;
  const disc = MARK * 0.42;
  mark.gradient((u, v) => {
    const d = Math.hypot(u - 0.5, v - 0.5) * MARK;
    if (d > disc) return [0, 0, 0, 0];
    const t = Math.min(1, u * 0.7 + v * 0.5);
    return [lerp(40, 109, t), lerp(116, 40, t), lerp(240, 217, t), 1];
  });
  // Glyph scaled to the smaller disc.
  drawMark(mark, 0.95 * (disc / (MARK * 0.33)) * 0.78);

  const offX = Math.floor((W - MARK) / 2);
  const offY = Math.floor((H - MARK) / 2);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      // Background: vertical blue gradient.
      const t = y / H;
      let r = Math.round(lerp(40, 31, t));
      let g = Math.round(lerp(116, 95, t));
      let b = Math.round(lerp(240, 208, t));

      const mx = x - offX;
      const my = y - offY;
      if (mx >= 0 && mx < MARK && my >= 0 && my < MARK) {
        const j = (my * MARK + mx) * 4;
        const a = mark.px[j + 3];
        if (a > 0) {
          r = Math.round(mark.px[j] * a + r * (1 - a));
          g = Math.round(mark.px[j + 1] * a + g * (1 - a));
          b = Math.round(mark.px[j + 2] * a + b * (1 - a));
        }
      }

      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 255;
    }
  }
  return encodePNG(W, H, buf);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "icon.png"), makeIcon());
fs.writeFileSync(
  path.join(OUT, "adaptive-icon.png"),
  makeIcon({ adaptive: true }),
);
fs.writeFileSync(path.join(OUT, "favicon.png"), makeIcon());
console.log(
  "Wrote assets/icon.png, assets/adaptive-icon.png, assets/favicon.png",
);
try {
  fs.writeFileSync(path.join(OUT, "splash.png"), makeSplash());
  console.log("Wrote assets/splash.png");
} catch (e) {
  console.warn("splash skipped:", e.message);
}

// ---------------------------------------------------------------------------
// Also write the NATIVE Android launcher resources. Without these the APK keeps
// the default Android robot icon, no matter what app.json says.
// ---------------------------------------------------------------------------
const RES = path.join(__dirname, "..", "android", "app", "src", "main", "res");
const DENSITIES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

// Draw at a given size by scaling the supersampled 1024 artwork.
function scaled(bufferFn, size) {
  const big = new Canvas(1024);
  bufferFn(big);
  const out = new Canvas(size);
  const ratio = 1024 / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.floor(x * ratio);
      const sy = Math.floor(y * ratio);
      const j = (sy * 1024 + sx) * 4;
      const i = (y * size + x) * 4;
      out.px[i] = big.px[j];
      out.px[i + 1] = big.px[j + 1];
      out.px[i + 2] = big.px[j + 2];
      out.px[i + 3] = big.px[j + 3];
    }
  }
  return out.toBuffer();
}

function roundedIcon(size) {
  return scaled((c) => {
    const from = rgb("#2874f0");
    const to = rgb("#6d28d9");
    c.gradient((u, v) => {
      const t = Math.min(1, u * 0.7 + v * 0.5);
      return [
        lerp(from[0], to[0], t),
        lerp(from[1], to[1], t),
        lerp(from[2], to[2], t),
        1,
      ];
    });
    const r = 1024 * 0.22;
    for (let y = 0; y < 1024; y++)
      for (let x = 0; x < 1024; x++) {
        if ((x >= r && x <= 1024 - r) || (y >= r && y <= 1024 - r)) continue;
        const cx = x < r ? r : 1024 - r;
        const cy = y < r ? r : 1024 - r;
        if (Math.hypot(x - cx, y - cy) > r) c.px[(y * 1024 + x) * 4 + 3] = 0;
      }
    drawMark(c, 0.86);
  }, size);
}

function roundIcon(size) {
  return scaled((c) => {
    const from = rgb("#2874f0");
    const to = rgb("#6d28d9");
    c.gradient((u, v) => {
      if (Math.hypot(u - 0.5, v - 0.5) > 0.5) return [0, 0, 0, 0];
      const t = Math.min(1, u * 0.7 + v * 0.5);
      return [
        lerp(from[0], to[0], t),
        lerp(from[1], to[1], t),
        lerp(from[2], to[2], t),
        1,
      ];
    });
    drawMark(c, 0.8);
  }, size);
}

// Adaptive foreground: transparent background + centred mark in the safe zone.
function adaptiveForeground(size) {
  return scaled((c) => {
    drawMark(c, 0.62);
  }, size);
}

for (const [name, size] of Object.entries(DENSITIES)) {
  const dir = path.join(RES, `mipmap-${name}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "ic_launcher.png"), roundedIcon(size));
  fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), roundIcon(size));
  fs.writeFileSync(
    path.join(dir, "ic_launcher_foreground.png"),
    adaptiveForeground(Math.round(size * 2.2)),
  );
}
console.log("Wrote native mipmap launcher icons (all densities)");
