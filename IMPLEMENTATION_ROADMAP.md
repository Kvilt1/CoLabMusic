# 🎵 CoLabMusic - Implementation Roadmap

> A comprehensive analysis of missing features and a phase-by-phase plan to make CoLabMusic consumer-ready.

---

## 📊 Current State Overview

**CoLabMusic/CloudSync** is a collaborative music streaming web app where users organize tracks into "Vaults" (shared playlists/groups). 

### Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS v4
- **Audio**: Howler.js
- **Backend**: Supabase (Auth, Database, Storage)
- **Icons**: Lucide React

### What's Working ✅
- User authentication (email/password)
- Vault creation, editing, deletion
- Vault invite codes & joining
- Member management with roles
- Song upload with TUS chunked uploads
- Audio playback with queue system
- Shuffle, repeat, skip controls
- Global & list search
- Real-time updates via Supabase subscriptions
- Media Session API (hardware controls)
- Keyboard shortcuts (Space, Cmd+K)

---

## 🔴 Critical Missing Features

### 1. User Profile & Account Management
| Feature | Status | Priority |
|---------|--------|----------|
| User profile page/settings | ❌ Missing | Critical |
| Display name editing | ❌ Missing | Critical |
| Profile picture upload | ❌ Missing | High |
| Change password | ❌ Missing | High |
| Account deletion | ❌ Missing | Medium |
| Logout button (visible in UI) | ❌ Missing | Critical |
| User initials hardcoded as "R" | 🐛 Bug | Critical |

### 2. Song Management
| Feature | Status | Priority |
|---------|--------|----------|
| Delete song | ❌ Missing | Critical |
| Edit song metadata | ❌ Missing | High |
| Move song between vaults | ❌ Missing | Medium |
| "Date Added" shows real date | 🐛 Bug (hardcoded "2 weeks ago") | High |
| Song attribution (uploaded by) | ❌ Missing | Medium |
| Bulk operations | ❌ Missing | Low |

### 3. Authentication Gaps
| Feature | Status | Priority |
|---------|--------|----------|
| Password reset flow | ❌ Missing | Critical |
| Email verification feedback | ❌ Missing | High |
| OAuth providers (Google, etc.) | ❌ Missing | High |
| "Remember me" option | ❌ Missing | Low |

### 4. Permission Enforcement
| Feature | Status | Priority |
|---------|--------|----------|
| Role-based upload restrictions | ❌ Not enforced | Critical |
| Role-based delete permissions | ❌ Not enforced | Critical |
| Viewer role limitations | ❌ Not enforced | High |
| UI visibility based on role | ❌ Missing | High |

---

## 🟠 Major Gaps for Consumer Readiness

### 5. Error Handling & UX
| Feature | Status | Priority |
|---------|--------|----------|
| Global error boundary | ❌ Missing | Critical |
| Toast notification system | ❌ Missing | Critical |
| Offline mode indication | ❌ Missing | Medium |
| Network error recovery | ❌ Missing | High |
| Loading skeletons | ❌ Missing | Medium |
| Upload retry mechanism | ❌ Missing | High |

### 6. Mobile Responsiveness
| Feature | Status | Priority |
|---------|--------|----------|
| Mobile-optimized layout | ❌ Missing | Critical |
| Touch gestures | ❌ Missing | Medium |
| Bottom navigation (mobile) | ❌ Missing | High |
| Responsive player bar | ❌ Missing | High |
| Collapsible sidebars | ❌ Missing | High |

### 7. Audio Player Improvements
| Feature | Status | Priority |
|---------|--------|----------|
| Playback position persistence | ❌ Missing | High |
| Crossfade between tracks | ❌ Missing | Low |
| Equalizer settings | ❌ Missing | Low |
| Sleep timer | ❌ Missing | Low |
| Lyrics display | ❌ Missing | Medium |
| Waveform visualization | ❌ Missing | Low |

### 8. Vault Features
| Feature | Status | Priority |
|---------|--------|----------|
| Vault cover image upload (broken) | 🐛 Bug | High |
| Vault description in Hero | ❌ Missing | Low |
| Sort songs within vault | ❌ Missing | Medium |
| Public vaults discovery | ❌ Missing | Medium |

### 9. Queue System
| Feature | Status | Priority |
|---------|--------|----------|
| Drag-and-drop reorder | ❌ Missing | Medium |
| Remove songs from queue | ❌ Missing | High |
| "Clear Queue" (non-functional) | 🐛 Bug | High |
| Queue persistence | ❌ Missing | Medium |

### 10. Playlists
| Feature | Status | Priority |
|---------|--------|----------|
| Personal playlists | ❌ Completely Missing | High |
| Collaborative playlists | ❌ Missing | Medium |
| Smart playlists | ❌ Missing | Low |

---

## 🟡 Polish & Quality of Life

### 11. Search Enhancements
- Recent searches history
- Search suggestions/autocomplete
- Advanced filters (vault, date, duration)
- Fuzzy search for typos

### 12. Performance & Optimization
- Virtual scrolling for large lists
- Image lazy loading
- Audio preloading
- Service worker caching
- PWA manifest

### 13. Data & Analytics
- Play count tracking
- Recently played section
- Most played songs
- Activity feed within vaults

### 14. Social Features
- Comments on songs
- Functional likes/favorites (Heart button non-functional)
- Share song/vault links
- Activity notifications

### 15. Content Moderation
- Report content feature
- Admin panel
- DMCA handling workflow

---

## 🔵 Security & Infrastructure

### 16. Security Concerns
| Issue | Status | Priority |
|-------|--------|----------|
| Supabase key exposed in client | ⚠️ Normal for anon key | Low |
| Rate limiting on uploads | ❌ Missing | High |
| Server-side file validation | ❌ Missing | Critical |
| Virus scanning | ❌ Missing | Medium |

### 17. Database Issues
| Issue | Status | Priority |
|-------|--------|----------|
| `songs.group_id` type mismatch (text vs uuid) | 🐛 Schema Bug | High |
| Missing `uploaded_by` on songs | ❌ Missing | High |
| Cascade delete rules | ❌ Missing | Medium |
| Foreign key constraints | ❌ Incomplete | High |

### 18. Storage
- Storage quota per user/vault
- File deduplication
- CDN configuration
- Bandwidth tracking

---

## 🟣 Environment & Deployment

### 19. Configuration
- Environment variables (currently hardcoded)
- Dev/prod environment switching
- Analytics integration

### 20. Testing
- Unit tests
- Integration tests
- E2E tests
- CI/CD pipeline

---

# 📅 Implementation Plan

## Phase 1: Critical Fixes (Week 1-2)
> **Goal**: Fix breaking issues and essential missing functionality

### 1.1 Authentication & User Identity
- [ ] **Add logout functionality**
  - Add logout button to header/sidebar
  - Implement `supabase.auth.signOut()`
  - Clear local state on logout

- [ ] **Fix hardcoded user initials**
  - Fetch user from `currentUser` in PlayerContext
  - Display actual initials from email or display_name
  - Add user avatar support

- [ ] **Password reset flow**
  - Add "Forgot password?" link to Login
  - Implement reset email trigger
  - Create password reset page

### 1.2 Song Management Basics
- [ ] **Add delete song functionality**
  - Add "Delete" option to SongMenu
  - Implement delete in PlayerContext
  - Add confirmation dialog
  - Handle storage file deletion

- [ ] **Fix "Date Added" display**
  - Use `created_at` from database
  - Format as relative time (x days ago)
  - Show full date on hover

### 1.3 Error Handling
- [ ] **Global error boundary**
  - Create ErrorBoundary component
  - Wrap App in error boundary
  - Display friendly error UI

- [ ] **Toast notification system**
  - Create Toast component
  - Create ToastContext provider
  - Add success/error/info variants
  - Integrate with existing actions

### 1.4 Permission Enforcement
- [ ] **Role-based action restrictions**
  - Check user role before upload
  - Check role before delete
  - Hide UI elements for viewers
  - Show "no permission" message

---

## Phase 2: Mobile & Essential UX (Week 3-4)
> **Goal**: Make app usable on mobile devices

### 2.1 Mobile Layout
- [ ] **Responsive sidebar**
  - Create mobile hamburger menu
  - Slide-out drawer for navigation
  - Overlay backdrop

- [ ] **Responsive player bar**
  - Stack controls vertically on mobile
  - Larger touch targets
  - Mini-player option

- [ ] **Responsive song list**
  - Single column layout on mobile
  - Swipe actions (queue, delete)
  - Simplified table

### 2.2 Mobile Navigation
- [ ] **Bottom tab bar**
  - Home, Search, Library tabs
  - Active state indication
  - Hide on desktop

### 2.3 Touch Interactions
- [ ] **Pull-to-refresh**
- [ ] **Swipe to go back**
- [ ] **Long-press context menu**

---

## Phase 3: User Experience (Week 5-6)
> **Goal**: Polish core features and add essential enhancements

### 3.1 User Profile
- [ ] **Profile page**
  - Display name editing
  - Email display
  - Account created date
  - Vaults membership list

- [ ] **Profile picture**
  - Upload avatar
  - Crop/resize
  - Display in header and vaults

### 3.2 Song Metadata
- [ ] **Edit song modal**
  - Edit title, artist, album
  - Replace cover art
  - Move to different vault

- [ ] **Song details view**
  - Full metadata display
  - Uploaded by attribution
  - Play count

### 3.3 Queue Improvements
- [ ] **Clear queue functionality**
  - Wire up existing button
  - Clear user queue
  - Keep current song playing

- [ ] **Remove from queue**
  - X button on queue items
  - Confirmation optional

- [ ] **Drag-and-drop reorder**
  - Install dnd library
  - Implement in RightSidebar

### 3.4 Vault Enhancements
- [ ] **Fix vault cover upload**
  - Store file in CreateVaultModal
  - Upload to Supabase Storage
  - Update vault with URL

- [ ] **Song sorting**
  - Sort by date, title, artist
  - Ascending/descending toggle
  - Persist sort preference

---

## Phase 4: Social & Discovery (Week 7-8)
> **Goal**: Add engagement features and content discovery

### 4.1 Favorites System
- [ ] **Like/unlike songs**
  - Create `favorites` table
  - Wire up Heart button
  - Show liked songs view

- [ ] **Liked Songs playlist**
  - Auto-generated playlist
  - Filter by liked songs

### 4.2 Play Tracking
- [ ] **Track play counts**
  - Create `play_history` table
  - Increment on song play
  - Display play count

- [ ] **Recently played**
  - Store last played songs
  - Display in sidebar/home

### 4.3 Sharing
- [ ] **Share vault link**
  - Generate shareable URL
  - Copy to clipboard button
  - Open in new tab preview

- [ ] **Share song link**
  - Deep link to specific song
  - Preview card metadata

### 4.4 OAuth Authentication
- [ ] **Google sign-in**
  - Configure in Supabase
  - Add Google button to Login
  - Handle OAuth callback

---

## Phase 5: Playlists (Week 9-10)
> **Goal**: Implement personal and collaborative playlists

### 5.1 Database Schema
- [ ] **Create playlists table**
  ```sql
  CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    owner_id UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```

- [ ] **Create playlist_songs table**
  ```sql
  CREATE TABLE playlist_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT now(),
    added_by UUID REFERENCES auth.users(id)
  );
  ```

### 5.2 Playlist UI
- [ ] **Create playlist modal**
- [ ] **Playlist view page**
- [ ] **Add to playlist from song menu**
- [ ] **Reorder songs in playlist**
- [ ] **Remove songs from playlist**

### 5.3 Playlist in Sidebar
- [ ] **"Your Playlists" section**
- [ ] **Create playlist button**
- [ ] **Playlist navigation**

---

## Phase 6: Performance & Polish (Week 11-12)
> **Goal**: Optimize performance and add final polish

### 6.1 Performance
- [ ] **Virtual scrolling**
  - Install react-virtual or similar
  - Implement in SongList
  - Implement in Queue

- [ ] **Image optimization**
  - Lazy loading with placeholders
  - Responsive image sizes
  - WebP conversion

- [ ] **Audio preloading**
  - Preload next track
  - Buffer management

### 6.2 PWA Support
- [ ] **Web manifest**
  - App name, icons, colors
  - Standalone display mode

- [ ] **Service worker**
  - Cache static assets
  - Offline fallback page

- [ ] **Install prompt**
  - "Add to home screen" prompt
  - Install instructions

### 6.3 Search Enhancements
- [ ] **Search history**
  - Store recent searches
  - Display on search focus
  - Clear history option

- [ ] **Fuzzy search**
  - Typo tolerance
  - Phonetic matching

### 6.4 Final Polish
- [ ] **Loading skeletons**
  - Song list skeleton
  - Vault card skeleton
  - Profile skeleton

- [ ] **Animations**
  - Page transitions
  - List animations
  - Micro-interactions

- [ ] **Keyboard shortcuts**
  - Document all shortcuts
  - Settings to customize
  - Shortcuts modal (?)

---

## Phase 7: Infrastructure & Security (Week 13-14)
> **Goal**: Production-ready infrastructure

### 7.1 Environment Configuration
- [ ] **Environment variables**
  - Create `.env.example`
  - Move Supabase keys to env
  - Document all variables

- [ ] **Build configuration**
  - Production optimizations
  - Source maps for debugging
  - Bundle analysis

### 7.2 Database Improvements
- [ ] **Fix schema issues**
  - Change `songs.group_id` to UUID
  - Add proper foreign key constraints
  - Add `uploaded_by` column

- [ ] **Add indexes**
  - Index on `songs.group_id`
  - Index on `songs.created_at`
  - Index on `vault_members.user_id`

### 7.3 Security
- [ ] **RLS policies review**
  - Audit all policies
  - Test policy enforcement
  - Document access rules

- [ ] **Rate limiting**
  - Upload rate limits
  - API rate limits

### 7.4 Monitoring
- [ ] **Error tracking**
  - Integrate Sentry or similar
  - Error reporting

- [ ] **Analytics**
  - Basic usage analytics
  - Performance monitoring

---

## Phase 8: Testing & Launch (Week 15-16)
> **Goal**: Ensure quality and prepare for launch

### 8.1 Testing
- [ ] **Unit tests**
  - PlayerContext tests
  - Utility function tests
  - Component tests

- [ ] **Integration tests**
  - Auth flow tests
  - Upload flow tests
  - Playback tests

- [ ] **E2E tests**
  - Critical user journeys
  - Cross-browser testing
  - Mobile testing

### 8.2 Documentation
- [ ] **User documentation**
  - Getting started guide
  - Feature documentation
  - FAQ

- [ ] **Developer documentation**
  - Setup instructions
  - Architecture overview
  - API documentation

### 8.3 Launch Preparation
- [ ] **Beta testing**
  - Invite beta users
  - Collect feedback
  - Fix critical issues

- [ ] **Launch checklist**
  - SSL certificate
  - Domain setup
  - Backup strategy
  - Monitoring alerts

---

# 📈 Progress Tracking

## Phase Status
| Phase | Description | Status | Completion |
|-------|-------------|--------|------------|
| 1 | Critical Fixes | 🔴 Not Started | 0% |
| 2 | Mobile & UX | 🔴 Not Started | 0% |
| 3 | User Experience | 🔴 Not Started | 0% |
| 4 | Social & Discovery | 🔴 Not Started | 0% |
| 5 | Playlists | 🔴 Not Started | 0% |
| 6 | Performance & Polish | 🔴 Not Started | 0% |
| 7 | Infrastructure | 🔴 Not Started | 0% |
| 8 | Testing & Launch | 🔴 Not Started | 0% |

## Legend
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete
- ⏸️ On Hold

---

# 🎯 Quick Wins (Can Do Today)

These are small fixes that provide immediate value:

1. **Fix hardcoded "R" initials** - Use `currentUser.email[0].toUpperCase()`
2. **Add logout button** - Single line: `supabase.auth.signOut()`
3. **Fix "2 weeks ago"** - Format `song.created_at`
4. **Wire up Clear Queue** - Add `setUserQueue([])`
5. **Show toast on upload success** - Already have state, just need UI

---

# 📝 Notes

## Known Technical Debt
1. `mockData.js` still contains hardcoded mock songs mixed with real data
2. Comments in code reference outdated implementations
3. Some CSS could be refactored into Tailwind components
4. PlayerContext is large (900+ lines) - consider splitting

## Design Decisions to Make
1. Should playlists be vault-scoped or global?
2. Public vault discovery - curated or open?
3. Free tier limits (storage, uploads)?
4. Premium features to consider?

---

*Last Updated: December 2024*
*Document Version: 1.0*

