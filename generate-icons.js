const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Delete extra screenshot images from public directory
const extraFilesToDelete = [
  'screenshot-1.png',
  'screenshot-2.png',
  'screenshot-3.png',
  'screenshot-4.png',
  'launchericon-48x48.png',
  'launchericon-72x72.png',
  'launchericon-96x96.png',
  'launchericon-144x144.png',
  'launchericon-192x192.png',
  'launchericon-512x512.png',
];

extraFilesToDelete.forEach(file => {
  const p = path.join('public', file);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Deleted extra image: ${file}`);
  }
});

// High-definition SVG with Logo Icon + "JOB MASTER" Text + Bengali Slogan
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF7A1A" />
      <stop offset="45%" stop-color="#FF5400" />
      <stop offset="100%" stop-color="#D83F00" />
    </linearGradient>

    <!-- Badge Inner Gradient -->
    <linearGradient id="inner-dark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E2E4A" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>

    <linearGradient id="gold-tassel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE082" />
      <stop offset="100%" stop-color="#FFB300" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="shadow-heavy" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.3" />
    </filter>

    <filter id="text-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Squircle Canvas Background -->
  <rect x="16" y="16" width="480" height="480" rx="104" ry="104" fill="url(#brand-grad)" filter="url(#shadow-heavy)" />
  
  <!-- Subtle Outer Border Accent -->
  <rect x="18" y="18" width="476" height="476" rx="102" ry="102" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="3" />

  <!-- Inner Badge Container for Contrast -->
  <circle cx="256" cy="180" r="100" fill="url(#inner-dark)" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="4" />

  <!-- ==================== LOGO ICON: GRADUATION CAP & BOOK ==================== -->
  <g transform="translate(256, 175) scale(1.35)" filter="url(#text-glow)">
    <!-- Mortarboard Diamond Top -->
    <path d="M 0,-34 L 46,-14 L 0,6 L -46,-14 Z" fill="#FFFFFF" />
    
    <!-- Cap Base -->
    <path d="M -24,-8 L -24,10 C -24,18 24,18 24,10 L 24,-8 Z" fill="#F1F5F9" />
    
    <!-- Tassel -->
    <path d="M -35,-11 L -40,12" stroke="url(#gold-tassel)" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <circle cx="-35" cy="-11" r="2.5" fill="#FFE082" />
    <path d="M -43,12 L -37,12 L -38.5,22 L -41.5,22 Z" fill="url(#gold-tassel)" />

    <!-- Open Book Accent -->
    <g transform="translate(0, 14) scale(0.7)">
      <!-- Left Page -->
      <path d="M -2,2 C -12,-2 -26,-2 -36,2 L -36,22 C -26,18 -12,18 -2,22 Z" fill="#FFFFFF" stroke="#FF5400" stroke-width="3" stroke-linejoin="round" />
      <!-- Right Page -->
      <path d="M 2,2 C 12,-2 26,-2 36,2 L 36,22 C 26,18 12,18 2,22 Z" fill="#FFFFFF" stroke="#FF5400" stroke-width="3" stroke-linejoin="round" />
    </g>
  </g>

  <!-- ==================== BRAND TEXT: "JOB MASTER" ==================== -->
  <!-- "JOB" -->
  <g filter="url(#text-glow)">
    <text 
      x="256" 
      y="338" 
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
      font-weight="900" 
      font-size="68" 
      fill="#FFFFFF" 
      text-anchor="middle" 
      letter-spacing="4"
    >
      JOB
    </text>
  </g>

  <!-- "MASTER" -->
  <g filter="url(#text-glow)">
    <text 
      x="256" 
      y="398" 
      font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
      font-weight="900" 
      font-size="52" 
      fill="#FFE8D6" 
      text-anchor="middle" 
      letter-spacing="3"
    >
      MASTER
    </text>
  </g>

  <!-- Divider Pill Line -->
  <rect x="176" y="416" width="160" height="4" rx="2" fill="#FFFFFF" fill-opacity="0.6" />

  <!-- ==================== BENGALI TAGLINE ==================== -->
  <text 
    x="256" 
    y="448" 
    font-family="'Hind Siliguri', 'Noto Sans Bengali', 'SolaimanLipi', sans-serif" 
    font-weight="700" 
    font-size="22" 
    fill="#FFFFFF" 
    text-anchor="middle" 
    letter-spacing="1"
    fill-opacity="0.95"
  >
    চাকরি আপনার হাতে!
  </text>
</svg>
`;

async function generateAll() {
  console.log('Generating crisp clean logo icons with Icon & Text...');
  fs.writeFileSync('public/icon.svg', svgContent.trim());

  const svgBuffer = Buffer.from(svgContent);

  const targets = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-icon.png', size: 180 },
    { name: 'favicon.ico', size: 64 },
  ];

  for (const t of targets) {
    const buf = await sharp(svgBuffer)
      .resize(t.size, t.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ palette: false, compressionLevel: 6, quality: 100 })
      .toBuffer();
    fs.writeFileSync(path.join('public', t.name), buf);
    console.log(`Generated public/${t.name} (${t.size}x${t.size})`);
  }

  // Generate PWA Manifest screenshots
  const screenshotWideSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <rect width="1280" height="720" fill="#0F172A"/>
    <rect x="40" y="40" width="1200" height="640" rx="24" fill="#1E293B" stroke="#FF6A00" stroke-width="4"/>
    <g transform="translate(640, 360)">
      ${svgContent.replace(/<svg[^>]*>|<\/svg>/g, '')}
    </g>
  </svg>`;
  
  const screenshotNarrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960">
    <rect width="540" height="960" fill="#0F172A"/>
    <rect x="20" y="20" width="500" height="920" rx="20" fill="#1E293B" stroke="#FF6A00" stroke-width="3"/>
    <g transform="translate(270, 480)">
      ${svgContent.replace(/<svg[^>]*>|<\/svg>/g, '')}
    </g>
  </svg>`;

  const wideBuf = await sharp(Buffer.from(screenshotWideSvg))
    .resize(1280, 720)
    .png({ quality: 90 })
    .toBuffer();
  fs.writeFileSync('public/screenshot-wide.png', wideBuf);
  console.log('Generated public/screenshot-wide.png (1280x720)');

  const narrowBuf = await sharp(Buffer.from(screenshotNarrowSvg))
    .resize(540, 960)
    .png({ quality: 90 })
    .toBuffer();
  fs.writeFileSync('public/screenshot-narrow.png', narrowBuf);
  console.log('Generated public/screenshot-narrow.png (540x960)');

  // Synchronize icons-base64.ts
  const base64Obj = {};
  for (const t of targets) {
    base64Obj[t.name] = fs.readFileSync(path.join('public', t.name)).toString('base64');
  }
  base64Obj['icon.svg'] = svgBuffer.toString('base64');

  const tsContent = `export const ICON_BASE64: Record<string, string> = ${JSON.stringify(base64Obj, null, 2)};\n`;
  fs.writeFileSync('src/app/api/icons/icons-base64.ts', tsContent);
  console.log('Synchronized src/app/api/icons/icons-base64.ts');

  console.log('All icons generated successfully!');
}

generateAll().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
