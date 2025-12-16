#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * 
 * This script generates placeholder PWA icons for all required sizes.
 * In production, replace these with actual branded icons using a tool like:
 * - https://realfavicongenerator.net/
 * - https://maskable.app/ (for maskable icons)
 * 
 * To use actual images, run:
 * npm install --save-dev sharp
 * Then provide a source SVG or PNG (at least 1024x1024)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const splashDir = path.join(publicDir, 'splash');

// Ensure directories exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
}

// Icon sizes needed
const iconSizes = [16, 32, 72, 96, 120, 128, 144, 152, 167, 180, 192, 384, 512];

// Splash screen sizes
const splashSizes = [
  { name: 'splash-640x1136.png', width: 640, height: 1136 },
  { name: 'splash-750x1334.png', width: 750, height: 1334 },
  { name: 'splash-828x1792.png', width: 828, height: 1792 },
  { name: 'splash-1125x2436.png', width: 1125, height: 2436 },
  { name: 'splash-1170x2532.png', width: 1170, height: 2532 },
  { name: 'splash-1242x2208.png', width: 1242, height: 2208 },
  { name: 'splash-1242x2688.png', width: 1242, height: 2688 },
  { name: 'splash-1284x2778.png', width: 1284, height: 2778 },
  { name: 'splash-1536x2048.png', width: 1536, height: 2048 },
  { name: 'splash-1668x2388.png', width: 1668, height: 2388 },
  { name: 'splash-2048x2732.png', width: 2048, height: 2732 }
];

// SVG icon template
function generateSVGIcon(size) {
  const iconSize = size;
  const padding = size * 0.15;
  const waveHeight = size * 0.4;
  const waveY = size / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#14b8a6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#121212" rx="${size * 0.15}"/>
  
  <!-- Wave Icon -->
  <g transform="translate(${padding}, ${padding})">
    <path d="M ${iconSize - padding * 2} ${waveY - waveHeight/2} 
             Q ${(iconSize - padding * 2) * 0.75} ${waveY - waveHeight}, 
               ${(iconSize - padding * 2) * 0.5} ${waveY}
             T 0 ${waveY + waveHeight/2}" 
          fill="none" 
          stroke="url(#gradient)" 
          stroke-width="${size * 0.08}" 
          stroke-linecap="round"/>
    
    <path d="M ${iconSize - padding * 2} ${waveY} 
             Q ${(iconSize - padding * 2) * 0.75} ${waveY + waveHeight/2}, 
               ${(iconSize - padding * 2) * 0.5} ${waveY}
             T 0 ${waveY - waveHeight/2}" 
          fill="none" 
          stroke="url(#gradient)" 
          stroke-width="${size * 0.08}" 
          stroke-linecap="round"
          opacity="0.6"/>
  </g>
</svg>`;
}

// Generate splash screen SVG
function generateSplashSVG(width, height) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#121212;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#14b8a6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  
  <!-- App Icon -->
  <g transform="translate(${width/2 - 80}, ${height/2 - 120})">
    <rect width="160" height="160" fill="url(#iconGradient)" rx="32"/>
    <path d="M 140 60 Q 105 20, 70 60 T 0 100" 
          fill="none" 
          stroke="#121212" 
          stroke-width="12" 
          stroke-linecap="round"
          transform="translate(10, 20)"/>
    <path d="M 140 80 Q 105 120, 70 80 T 0 40" 
          fill="none" 
          stroke="#121212" 
          stroke-width="12" 
          stroke-linecap="round"
          opacity="0.6"
          transform="translate(10, 20)"/>
  </g>
  
  <!-- App Name -->
  <text x="${width/2}" y="${height/2 + 80}" 
        font-family="system-ui, -apple-system" 
        font-size="36" 
        font-weight="bold"
        fill="#10b981" 
        text-anchor="middle">CloudSync</text>
</svg>`;
}

console.log('🎨 Generating PWA Icons...\n');

// Generate icons
let generatedIcons = 0;
iconSizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  const svgContent = generateSVGIcon(size);
  
  // Save as SVG (can be converted to PNG using sharp or similar)
  const svgPath = filepath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svgContent);
  
  // For this demo, we're creating SVG files
  // In production, convert to PNG using sharp:
  // const sharp = require('sharp');
  // await sharp(Buffer.from(svgContent)).png().toFile(filepath);
  
  generatedIcons++;
  console.log(`✓ Generated ${filename} (SVG)`);
});

// Generate splash screens
let generatedSplash = 0;
splashSizes.forEach(splash => {
  const filepath = path.join(splashDir, splash.name);
  const svgContent = generateSplashSVG(splash.width, splash.height);
  
  const svgPath = filepath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svgContent);
  
  generatedSplash++;
  console.log(`✓ Generated ${splash.name} (SVG)`);
});

console.log(`\n✅ Successfully generated ${generatedIcons} icons and ${generatedSplash} splash screens!`);
console.log(`\n📝 Note: Icons are in SVG format. For production, convert to PNG using:`);
console.log(`   npm install sharp`);
console.log(`   Then use sharp to convert SVG to PNG\n`);

// Create a README in the icons directory
const readmeContent = `# PWA Icons and Splash Screens

## Generated Files

This directory contains auto-generated PWA icons and splash screens.

### Icons
- Multiple sizes from 16x16 to 512x512
- Optimized for various devices and platforms
- Maskable icons for Android adaptive icons

### Splash Screens
- iOS-specific splash screens for various device sizes
- Displays during app launch in standalone mode

## For Production

Replace these placeholder SVG files with actual PNG images:

1. Create a high-resolution source image (1024x1024 minimum)
2. Use tools like:
   - https://realfavicongenerator.net/
   - https://maskable.app/
   - https://www.pwabuilder.com/imageGenerator

3. Or convert programmatically with sharp:

\`\`\`bash
npm install sharp
\`\`\`

\`\`\`javascript
const sharp = require('sharp');
await sharp('source.svg')
  .resize(512, 512)
  .png()
  .toFile('icon-512x512.png');
\`\`\`

## Maskable Icons

For best Android experience, ensure your icons have:
- Safe zone: Keep important content in center 80%
- Padding: 10% minimum on all sides
- Background: Solid color that extends to edges
`;

fs.writeFileSync(path.join(publicDir, 'ICONS-README.md'), readmeContent);
console.log('📄 Created ICONS-README.md with instructions\n');
