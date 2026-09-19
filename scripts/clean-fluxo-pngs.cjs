const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'fluxos');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png'));

function rgba(img, x, y) {
  return Jimp.intToRGBA(img.getPixelColor(x, y));
}

function isDark(c) {
  return c.r < 100 && c.g < 100 && c.b < 100 && c.a > 180;
}

function isNearWhite(c) {
  return c.r > 225 && c.g > 225 && c.b > 225;
}

/** Bounding box of dark pixels in a corner window. */
function cornerBBox(img, xMin, xMax, yMax) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  let n = 0;
  for (let y = 0; y < yMax; y++) {
    for (let x = xMin; x < xMax; x++) {
      if (isDark(rgba(img, x, y))) {
        n++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (n < 80 || x1 < 0) return null;
  return { x0, y0, x1, y1, n };
}

function hollowRatio(img, b) {
  let white = 0;
  let total = 0;
  const ix0 = b.x0 + 5;
  const ix1 = b.x1 - 5;
  const iy0 = b.y0 + 5;
  const iy1 = b.y1 - 5;
  if (ix1 <= ix0 || iy1 <= iy0) return 0;
  for (let y = iy0; y < iy1; y += 2) {
    for (let x = ix0; x < ix1; x += 2) {
      total++;
      if (isNearWhite(rgba(img, x, y))) white++;
    }
  }
  return total ? white / total : 0;
}

function isEmptyFrame(img, b) {
  if (!b) return false;
  const bw = b.x1 - b.x0 + 1;
  const bh = b.y1 - b.y0 + 1;
  if (bw < 80 || bh < 40) return false;
  if (bw > 700 || bh > 200) return false;
  if (b.y0 > 60) return false;
  return hollowRatio(img, b) > 0.8;
}

function fillWhite(img, b, pad = 4) {
  const white = Jimp.rgbaToInt(255, 255, 255, 255);
  const x0 = Math.max(0, b.x0 - pad);
  const y0 = Math.max(0, b.y0 - pad);
  const x1 = Math.min(img.bitmap.width - 1, b.x1 + pad);
  const y1 = Math.min(img.bitmap.height - 1, b.y1 + pad);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      img.setPixelColor(white, x, y);
    }
  }
}

(async () => {
  for (const file of files) {
    const full = path.join(dir, file);
    const img = await Jimp.read(full);
    const w = img.bitmap.width;
    const cornerW = Math.min(520, Math.floor(w * 0.28));
    const yMax = 170;

    const left = cornerBBox(img, 0, cornerW, yMax);
    const right = cornerBBox(img, w - cornerW, w, yMax);

    const boxes = [];
    if (isEmptyFrame(img, left)) boxes.push(['L', left]);
    if (isEmptyFrame(img, right)) boxes.push(['R', right]);

    console.log(
      file,
      boxes.map(([side, b]) => `${side}:${b.x0},${b.y0}-${b.x1},${b.y1}`).join(' ') || 'none',
    );

    for (const [, b] of boxes) fillWhite(img, b);
    if (boxes.length) await img.writeAsync(full);
  }
  console.log('done');
})();
