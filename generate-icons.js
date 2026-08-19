const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Gradients -->
    <radialGradient id="bg-grad" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#EDF2F7" />
    </radialGradient>

    <linearGradient id="navy-ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E2E4A" />
      <stop offset="50%" stop-color="#142136" />
      <stop offset="100%" stop-color="#0A1322" />
    </linearGradient>

    <linearGradient id="orange-ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A1A" />
      <stop offset="50%" stop-color="#FF5400" />
      <stop offset="100%" stop-color="#D83F00" />
    </linearGradient>

    <linearGradient id="orange-text" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FF6315" />
      <stop offset="100%" stop-color="#E04600" />
    </linearGradient>

    <linearGradient id="navy-text" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E3253" />
      <stop offset="100%" stop-color="#101D33" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="badge-shadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.18" />
    </filter>

    <filter id="inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.12" />
    </filter>

    <filter id="text-3d" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="2" flood-color="#000000" flood-opacity="0.18" />
    </filter>

    <!-- Path for curved Bengali text along bottom inside -->
    <path id="bengali-path" d="M 105,335 A 165,165 0 0,0 407,335" fill="none" />
  </defs>

  <!-- Outer Soft Shadow Container -->
  <circle cx="256" cy="256" r="236" fill="url(#navy-ring)" filter="url(#badge-shadow)" />

  <!-- Outer Navy 3D Rim -->
  <circle cx="256" cy="256" r="234" fill="none" stroke="url(#navy-ring)" stroke-width="18" />
  <circle cx="256" cy="256" r="243" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1.5" />

  <!-- Inner Orange 3D Ring -->
  <circle cx="256" cy="256" r="217" fill="none" stroke="url(#orange-ring)" stroke-width="15" />
  <circle cx="256" cy="256" r="224" fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1" />

  <!-- Inner Circle Canvas -->
  <circle cx="256" cy="256" r="208" fill="url(#bg-grad)" />

  <!-- Subtly recessed ring border inside -->
  <circle cx="256" cy="256" r="208" fill="none" stroke="#CBD5E1" stroke-width="1.5" stroke-opacity="0.6" />

  <!-- ==================== TOP ICON (GRADUATION CAP + OPEN BOOK) ==================== -->
  <g transform="translate(256, 142) scale(1.02)" filter="url(#text-3d)">
    <!-- Mortarboard Top Diamond -->
    <path d="M 0,-48 L 56,-22 L 0,4 L -56,-22 Z" fill="#142136" />
    
    <!-- Mortarboard Cap Base / Skullcap -->
    <path d="M -30,-12 L -30,12 C -30,22 30,22 30,12 L 30,-12 Z" fill="#1B2B44" />
    
    <!-- Tassel Loop & String on Left -->
    <path d="M -42,-16 L -48,12" stroke="#142136" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <circle cx="-42" cy="-16" r="2.5" fill="#FF5400" />
    <!-- Tassel Fringe -->
    <path d="M -51,12 L -45,12 L -46.5,23 L -49.5,23 Z" fill="#142136" />

    <!-- Open Book Below Cap -->
    <g transform="translate(0, 10)">
      <!-- Left Page -->
      <path d="M -4,2 C -15,-3 -32,-3 -44,2 L -44,28 C -32,23 -15,23 -4,28 Z" fill="#FFFFFF" stroke="#142136" stroke-width="5" stroke-linejoin="round" />
      <line x1="-36" y1="10" x2="-12" y2="10" stroke="#142136" stroke-width="3" stroke-linecap="round" />
      <line x1="-36" y1="18" x2="-12" y2="18" stroke="#142136" stroke-width="3" stroke-linecap="round" />

      <!-- Right Page -->
      <path d="M 4,2 C 15,-3 32,-3 44,2 L 44,28 C 32,23 15,23 4,28 Z" fill="#FFFFFF" stroke="#142136" stroke-width="5" stroke-linejoin="round" />
      <line x1="12" y1="10" x2="36" y2="10" stroke="#142136" stroke-width="3" stroke-linecap="round" />
      <line x1="12" y1="18" x2="36" y2="18" stroke="#142136" stroke-width="3" stroke-linecap="round" />

      <!-- Book Spine -->
      <line x1="0" y1="3" x2="0" y2="28" stroke="#142136" stroke-width="4" stroke-linecap="round" />
    </g>
  </g>

  <!-- ==================== CENTER BRAND TYPOGRAPHY ==================== -->
  <!-- "JOB" -->
  <g filter="url(#text-3d)">
    <text x="256" y="278" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="94" fill="url(#navy-text)" text-anchor="middle" letter-spacing="3">JOB</text>
  </g>

  <!-- "MASTER" -->
  <g filter="url(#text-3d)">
    <text x="256" y="348" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="78" fill="url(#orange-text)" text-anchor="middle" letter-spacing="2">MASTER</text>
  </g>

  <!-- Accent underline bar below MASTER with center gap -->
  <g filter="url(#inner-shadow)">
    <line x1="150" y1="365" x2="242" y2="365" stroke="#FF5400" stroke-width="4.5" stroke-linecap="round" />
    <line x1="270" y1="365" x2="362" y2="365" stroke="#FF5400" stroke-width="4.5" stroke-linecap="round" />
  </g>

  <!-- ==================== CURVED BENGALI SLOGAN ==================== -->
  <!-- "চাকরি এখন হাতের মুঠোয়!" -->
  <text font-family="'Hind Siliguri', 'Noto Sans Bengali', 'SolaimanLipi', 'Kalpurush', sans-serif" font-weight="800" font-size="28" fill="#142136" letter-spacing="1">
    <textPath href="#bengali-path" startOffset="50%" text-anchor="middle">
      চাকরি এখন হাতের মুঠোয়!
    </textPath>
  </text>
</svg>
`;

async function buildAllIcons() {
  console.log('Generating crisp icons...');
  fs.writeFileSync('public/icon.svg', svgContent.trim());

  const svgBuffer = Buffer.from(svgContent);

  // 1. icon-512.png (512x512)
  const img512 = await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 100 })
    .toBuffer();
  fs.writeFileSync('public/icon-512.png', img512);
  fs.writeFileSync('public/icon.png', img512);
  console.log('Created icon-512.png and icon.png');

  // 2. icon-192.png (192x192)
  const img192 = await sharp(svgBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 100 })
    .toBuffer();
  fs.writeFileSync('public/icon-192.png', img192);
  console.log('Created icon-192.png');

  // 3. apple-icon.png (180x180)
  const imgApple = await sharp(svgBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 100 })
    .toBuffer();
  fs.writeFileSync('public/apple-icon.png', imgApple);
  console.log('Created apple-icon.png');

  // 4. favicon.png and favicon.ico (64x64)
  const imgFav = await sharp(svgBuffer)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 100 })
    .toBuffer();
  fs.writeFileSync('public/favicon.png', imgFav);
  fs.writeFileSync('public/favicon.ico', imgFav);
  console.log('Created favicon.png and favicon.ico');

  console.log('All icons generated and validated successfully!');
}

buildAllIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
