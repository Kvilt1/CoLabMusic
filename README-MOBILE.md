# CloudSync Music - Mobile & PWA Setup Guide

## Quick Start

Your app now has full mobile support! Here's what you can do:

### 📱 Install as App

#### iOS (iPhone/iPad)
1. Open in Safari
2. Tap Share button → "Add to Home Screen"
3. The app will open fullscreen without Safari UI

#### Android (Chrome)
1. Open in Chrome
2. Tap menu → "Add to Home Screen" or "Install App"
3. Confirm installation

### 🎵 Mobile Features

✅ **Responsive Design** - Works on all screen sizes
✅ **Bottom Navigation** - Spotify-style tab bar
✅ **Full-Screen Player** - Swipe-up mini-player
✅ **Lock Screen Controls** - iOS & Android media controls
✅ **Offline Caching** - PWA service worker
✅ **iOS Optimized** - Safe area support, splash screens
✅ **Touch Gestures** - Native-feeling interactions

## What Was Built

### 1. PWA Configuration

**Files Created:**
- `/public/manifest.json` - App manifest with icons and metadata
- `/public/sw.js` - Service worker for offline support
- `/public/icons/` - App icons (13 sizes, SVG format)
- `/public/splash/` - iOS splash screens (11 sizes)

**HTML Updates:**
- iOS meta tags for fullscreen mode
- PWA manifest link
- Service worker registration
- Safe area viewport

### 2. Mobile Components

**New Components:**
- `MobileNavigation.jsx` - Bottom tab bar (Home, Search, Library, Profile)
- `MobilePlayerBar.jsx` - Compact mini-player at bottom
- `MobilePlayerSheet.jsx` - Full-screen player modal
- `InstallPrompt.jsx` - Smart PWA install prompt

**Updated Components:**
- `App.jsx` - Responsive layout switching
- `Hero.jsx` - Mobile-optimized hero section
- `SongList.jsx` - Mobile card view + desktop table view
- `MainView.jsx` - Responsive header and spacing

### 3. iOS Media Integration

**PlayerContext Enhancements:**
- Media Session API with multiple artwork sizes
- Lock screen playback info
- Hardware button controls (headphones, AirPods)
- Seek/scrub support on iOS lock screen
- Position state for progress tracking
- Wake lock to prevent screen sleep

### 4. Mobile Styles

**CSS Updates (`index.css`):**
- iOS safe area insets
- Touch-optimized tap targets (44x44px)
- Smooth scrolling
- Hidden scrollbars on mobile
- Prevent text selection on UI elements
- Standalone mode detection
- Custom animations

### 5. Custom Hooks

**`useInstallPrompt.js`:**
- Detects iOS vs Android
- Handles PWA install prompt
- Tracks standalone mode
- Provides install function

## Development

### Local Testing

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Test on Real Device

1. **Option A: Deploy to HTTPS server**
   - PWA requires HTTPS
   - Deploy to Vercel, Netlify, etc.

2. **Option B: Use ngrok for local testing**
   ```bash
   npm run dev
   # In another terminal:
   npx ngrok http 5173
   # Open ngrok URL on mobile device
   ```

### Generate Production Icons

The current icons are SVG placeholders. For production:

1. Install sharp: `npm install sharp`
2. Create 1024x1024 source icon
3. Use online tools:
   - https://realfavicongenerator.net/
   - https://maskable.app/
   - https://www.pwabuilder.com/imageGenerator

Or run:
```bash
node scripts/generate-pwa-icons.js
```

## Architecture

### Responsive Breakpoints

- **Mobile**: < 768px (Tailwind `md:` breakpoint)
- **Desktop**: ≥ 768px

### Layout Strategy

```
Mobile Layout:
├── MainView (full width)
├── MobilePlayerBar (bottom compact player)
└── MobileNavigation (bottom tabs)

Desktop Layout:
├── LeftSidebar (vaults/navigation)
├── MainView (scrollable content)
├── RightSidebar (queue, conditional)
└── PlayerBar (full controls at bottom)
```

### State Management

- **PlayerContext**: Global playback state, queue, controls
- **usePlayer**: Hook to access player context
- **Local State**: Component-specific UI state (modals, sheets)

### Audio Playback

- **Library**: Howler.js for cross-browser audio
- **Format**: HTML5 Audio with fallbacks
- **iOS**: Inline playback, no autoplay restrictions
- **Controls**: Media Session API for hardware integration

## Features Breakdown

### Home Screen Install

- **Android**: Native A2HS prompt
- **iOS**: Manual instructions via InstallPrompt component
- **Dismissible**: LocalStorage persistence
- **Smart**: Only shows when installable

### Media Session API

Enables:
- Lock screen album art and song info
- Play/Pause from lock screen
- Previous/Next track buttons
- Headphone control support
- CarPlay integration (iOS)
- Notification controls (Android)

### Offline Support

Service Worker caches:
- HTML, CSS, JS files
- Static assets (icons, splash screens)
- Previously visited pages

**NOT cached:**
- Music files (too large)
- User-uploaded content
- API responses (requires network)

### Mobile Optimizations

- **Touch**: 44px minimum tap targets
- **Performance**: Hardware-accelerated animations
- **UX**: Active states with scale transforms
- **A11y**: Semantic HTML, ARIA labels
- **Visual**: Safe areas for notched devices

## Browser Support

| Browser | PWA Install | Media Session | Service Worker |
|---------|------------|---------------|----------------|
| iOS Safari 15+ | ✅ Manual | ✅ | ✅ |
| Android Chrome | ✅ Auto | ✅ | ✅ |
| Desktop Chrome | ✅ Auto | ✅ | ✅ |
| Desktop Safari | ✅ Manual | ✅ | ✅ |
| Firefox | ⚠️ Limited | ✅ | ✅ |

## Known Limitations

### iOS
- No push notifications
- No background sync
- Install requires manual steps
- Audio may pause when screen locks (depends on iOS version)

### Android
- Install banner may not show if dismissed repeatedly
- Background playback depends on browser

### General
- Requires HTTPS for PWA features
- Audio requires user interaction to start
- Service Worker cache has ~50MB limit

## Testing Checklist

- [ ] App installs on iOS Safari
- [ ] App installs on Android Chrome
- [ ] Lock screen controls work
- [ ] Album art shows on lock screen
- [ ] Bottom navigation works
- [ ] Mini-player expands to full screen
- [ ] All touch targets are easily tappable
- [ ] Responsive at all screen sizes
- [ ] Service worker registers
- [ ] Offline mode shows cached pages
- [ ] No console errors

## Troubleshooting

### App Won't Install

- Verify HTTPS connection
- Check manifest.json is accessible at `/manifest.json`
- Clear browser cache
- Check DevTools → Application → Manifest for errors

### Lock Screen Controls Don't Work

- Ensure Media Session API is supported (iOS 15+, Android Chrome)
- Check audio is actually playing
- Verify no console errors in PlayerContext
- Test on real device (not simulator)

### Service Worker Not Registering

- HTTPS required (except localhost)
- Check browser console for registration errors
- Verify `/sw.js` is accessible
- Try unregistering old workers: DevTools → Application → Service Workers

### Audio Won't Play on iOS

- User must interact with page first (tap anything)
- Check file format (iOS prefers M4A/AAC)
- Verify audio URLs are valid and HTTPS
- Check browser console for errors

### Styles Look Wrong on Mobile

- Clear browser cache
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Check viewport meta tag is present
- Verify Tailwind classes are correct

## Performance Tips

1. **Code Splitting**: Use dynamic imports for large features
2. **Image Optimization**: Convert to WebP, use responsive images
3. **Lazy Loading**: Load components only when needed
4. **Caching**: Use service worker more aggressively
5. **Compression**: Enable gzip/brotli on server

## Security Considerations

1. **HTTPS Only**: PWA requires secure connection
2. **CSP**: Add Content-Security-Policy headers
3. **CORS**: Configure for your domain
4. **Auth**: Secure Supabase with RLS policies
5. **Uploads**: Validate file types and sizes

## Future Enhancements

Potential additions:
- Push notifications for new uploads
- Background sync for offline uploads
- Download songs for offline playback
- Share to social media
- Voice commands via Web Speech API
- Bluetooth audio device switching
- Lyrics display
- Equalizer controls

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Media Session API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)
- [iOS Web App Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Service Worker Cookbook](https://serviceworke.rs/)

## Support

For detailed mobile features documentation, see `MOBILE-FEATURES.md`.

For questions or issues:
1. Check browser console for errors
2. Test on real device (not simulator)
3. Verify HTTPS is enabled
4. Check Lighthouse PWA audit score

---

Built with ❤️ using React, Vite, Tailwind CSS, and Howler.js
