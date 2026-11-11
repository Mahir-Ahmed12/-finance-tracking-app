import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcPayload = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcPayload, crcBuf]);
}

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlineSize = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineSize;
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Render NEONVAULT minimal vault icon:
// A stylish rounded charcoal tile (#171717) with subtle sage green (#A3B18A) geometric vault emblem
function renderIconPixel(x, y, size, isMaskable = false) {
  // Center is size/2, normalize to -1 to 1
  const nx = (x - size / 2) / (size / 2);
  const ny = (y - size / 2) / (size / 2);
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Colors
  const bg = [23, 23, 23, 255]; // #171717
  const sage = [163, 177, 138, 255]; // #A3B18A
  const sageMuted = [88, 129, 87, 255]; // #588157
  const white = [255, 255, 255, 255];
  const border = [42, 43, 48, 255]; // #2A2B30

  if (isMaskable) {
    // Full bleed #171717 background for Android squircle cropping
    // Scale emblem down by 0.70 to guarantee 15% safe margin
    const sx = nx / 0.68;
    const sy = ny / 0.68;
    return renderEmblem(sx, sy, bg, sage, sageMuted, white, border);
  } else {
    // Squircle container
    // Superellipse: |x|^4 + |y|^4 <= 0.88^4
    const superDist = Math.pow(Math.abs(nx), 3.8) + Math.pow(Math.abs(ny), 3.8);
    if (superDist > 0.88) {
      // Outside squircle: transparent
      return [0, 0, 0, 0];
    }
    // Thin outer border
    if (superDist > 0.84) {
      return border;
    }
    return renderEmblem(nx / 0.82, ny / 0.82, bg, sage, sageMuted, white, border);
  }
}

function renderEmblem(x, y, bg, sage, sageMuted, white, border) {
  // Emblem consists of:
  // 1. Concentric thin geometric vault ring
  const r = Math.sqrt(x * x + y * y);
  if (r >= 0.74 && r <= 0.78) {
    return [sage[0], sage[1], sage[2], 120];
  }

  // 2. Futuristic geometric "N" / "V" Interlocking Vault Symbol
  // V shape bottom: y from 0.0 down to 0.45
  // Left arm of V: line from (-0.35, -0.35) to (0.0, 0.40)
  // Right arm of V: line from (0.35, -0.35) to (0.0, 0.40)
  const vDistLeft = distToSegment(x, y, -0.32, -0.36, 0.0, 0.38);
  const vDistRight = distToSegment(x, y, 0.32, -0.36, 0.0, 0.38);

  if (vDistLeft < 0.075 || vDistRight < 0.075) {
    return white;
  }

  // Horizontal vault crossbar (giving an 'A'/'Vault' lock feeling):
  const barDist = distToSegment(x, y, -0.34, 0.02, 0.34, 0.02);
  if (barDist < 0.055) {
    return sage;
  }

  // Center diamond vault node at (0, -0.08)
  const dX = Math.abs(x);
  const dY = Math.abs(y - (-0.08));
  if (dX + dY < 0.12) {
    return sage;
  }

  return bg;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Generate files into /public
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. pwa-192x192.png
const png192 = createPng(192, 192, (x, y) => renderIconPixel(x, y, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// 2. pwa-512x512.png
const png512 = createPng(512, 512, (x, y) => renderIconPixel(x, y, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// 3. pwa-maskable-512x512.png
const pngMaskable = createPng(512, 512, (x, y) => renderIconPixel(x, y, 512, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// 4. apple-touch-icon.png (180x180)
const pngApple = createPng(180, 180, (x, y) => renderIconPixel(x, y, 180, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

// 5. favicon-32x32.png
const png32 = createPng(32, 32, (x, y) => renderIconPixel(x, y, 32, false));
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);

// 6. public/icon.svg (Vector version)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#171717"/>
  <rect width="504" height="504" x="4" y="4" rx="124" fill="none" stroke="#2A2B30" stroke-width="4"/>
  <circle cx="256" cy="256" r="192" fill="none" stroke="#A3B18A" stroke-opacity="0.35" stroke-width="6" stroke-dasharray="8 8"/>
  <path d="M168 156 L256 364 L344 156" fill="none" stroke="#FFFFFF" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="160" y1="260" x2="352" y2="260" stroke="#A3B18A" stroke-width="20" stroke-linecap="round"/>
  <polygon points="256,216 284,244 256,272 228,244" fill="#A3B18A"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('Successfully generated all PWA icons in /public:');
console.log('- pwa-192x192.png');
console.log('- pwa-512x512.png');
console.log('- pwa-maskable-512x512.png');
console.log('- apple-touch-icon.png');
console.log('- favicon-32x32.png');
console.log('- icon.svg');
