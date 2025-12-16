# PWA Icons and Splash Screens

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

```bash
npm install sharp
```

```javascript
const sharp = require('sharp');
await sharp('source.svg')
  .resize(512, 512)
  .png()
  .toFile('icon-512x512.png');
```

## Maskable Icons

For best Android experience, ensure your icons have:
- Safe zone: Keep important content in center 80%
- Padding: 10% minimum on all sides
- Background: Solid color that extends to edges
