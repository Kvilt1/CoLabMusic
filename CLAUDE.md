# CLAUDE.md - AI Assistant Guide for CoLabMusic

> Comprehensive guide for AI assistants working on the CoLabMusic codebase. Last updated: 2025-12-20

---

## 📋 Quick Reference

**Project Type**: React + Vite web application
**Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
**Primary Language**: JavaScript (ES6+)
**Package Manager**: npm
**Node Version**: 18+ recommended

**Key Commands**:
```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🎯 Project Overview

CoLabMusic is a collaborative music streaming platform where users create "Vaults" (shared playlists) to upload, organize, and play music together in real-time. Think Spotify meets collaborative workspaces.

### Core Features
- **Vault System**: Collaborative music collections with role-based permissions (Owner, Admin, Member, Viewer)
- **Music Upload**: Chunked resumable uploads with automatic metadata extraction
- **Real-time Collaboration**: Live updates via Supabase Realtime subscriptions
- **Advanced Audio Player**: Howler.js-powered playback with queue, shuffle, repeat
- **Member Management**: Invite codes, role management, ownership transfer
- **Search**: Global search across all songs (Cmd/Ctrl+K)

---

## 📁 Project Structure

```
CoLabMusic/
├── src/
│   ├── components/              # React UI components
│   │   ├── Layout/             # Layout components (Sidebar, PlayerBar, etc.)
│   │   │   ├── LeftSidebar.jsx
│   │   │   ├── RightSidebar.jsx
│   │   │   ├── PlayerBar.jsx
│   │   │   └── MainView.jsx
│   │   ├── CreateVaultModal.jsx
│   │   ├── JoinVaultModal.jsx
│   │   ├── UploadModal.jsx
│   │   ├── VaultSettings.jsx
│   │   ├── SongList.jsx
│   │   ├── SongMenu.jsx
│   │   ├── SearchView.jsx
│   │   ├── Login.jsx
│   │   ├── Hero.jsx
│   │   ├── UserMenu.jsx
│   │   ├── ConfirmDialog.jsx
│   │   └── ErrorBoundary.jsx
│   │
│   ├── context/                 # React Context providers
│   │   ├── AppContext.jsx      # User session, UI state
│   │   ├── VaultContext.jsx    # Vaults and songs management
│   │   ├── AudioContext.jsx    # Audio playback and queue
│   │   ├── ToastContext.jsx    # Toast notifications
│   │   └── index.js            # Context exports
│   │
│   ├── hooks/                   # Custom React hooks (business logic)
│   │   ├── useAudio.js         # Audio playback controls
│   │   ├── useQueue.js         # Queue and shuffle management
│   │   ├── useVaultOperations.js  # Vault CRUD operations
│   │   ├── useSongOperations.js   # Song CRUD operations
│   │   ├── useRealtime.js      # Real-time subscription management
│   │   └── index.js            # Hook exports
│   │
│   ├── services/                # Service layer (Dependency Injection)
│   │   ├── auth/               # Authentication services
│   │   │   ├── AuthService.js          # Abstract interface
│   │   │   ├── SupabaseAuthService.js  # Production implementation
│   │   │   └── MockAuthService.js      # Testing implementation
│   │   ├── vault/              # Vault services
│   │   │   ├── VaultService.js
│   │   │   ├── SupabaseVaultService.js
│   │   │   └── MockVaultService.js
│   │   ├── vaultMember/        # Member management services
│   │   │   ├── VaultMemberService.js
│   │   │   ├── SupabaseVaultMemberService.js
│   │   │   └── MockVaultMemberService.js
│   │   ├── song/               # Song services
│   │   │   ├── SongService.js
│   │   │   ├── SupabaseSongService.js
│   │   │   └── MockSongService.js
│   │   ├── storage/            # File storage services
│   │   │   ├── StorageService.js
│   │   │   ├── SupabaseStorageService.js
│   │   │   └── MockStorageService.js
│   │   ├── realtime/           # Real-time subscription services
│   │   │   ├── RealtimeService.js
│   │   │   ├── SupabaseRealtimeService.js
│   │   │   └── MockRealtimeService.js
│   │   ├── ServiceProvider.jsx # DI container
│   │   ├── types.js            # TypeScript-style type definitions
│   │   └── index.js            # Service exports
│   │
│   ├── utils/                   # Utility functions
│   │   ├── errors.js           # Error classes and handlers
│   │   ├── validation.js       # Input validation utilities
│   │   └── vaultColors.js      # Color scheme generator
│   │
│   ├── assets/                  # Static assets (images, fonts)
│   ├── App.jsx                  # Main application component
│   ├── main.jsx                 # Application entry point
│   └── supabaseClient.js        # Supabase client configuration
│
├── public/                      # Static files served directly
├── scripts/                     # Build/deployment scripts
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite bundler configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML entry point
├── README.md                    # User-facing documentation
├── IMPLEMENTATION_ROADMAP.md    # Feature roadmap
└── SEARCH_FEATURE.md            # Search feature documentation
```

---

## 🏗️ Architecture Patterns

### 1. Dependency Injection (Service Layer)

The codebase uses a service layer pattern with dependency injection for better testability and flexibility.

**Pattern**:
- Each domain (auth, vault, song, etc.) has an **abstract interface** defining the contract
- **SupabaseXxxService** implements the interface for production
- **MockXxxService** implements the interface for testing
- Services are injected via `ServiceProvider` context

**Example**:
```javascript
// Abstract interface (src/services/vault/VaultService.js)
export class VaultService {
  async getUserVaults(userId) {
    throw new Error('getUserVaults() must be implemented');
  }
}

// Production implementation (src/services/vault/SupabaseVaultService.js)
export class SupabaseVaultService extends VaultService {
  async getUserVaults(userId) {
    const { data, error } = await this.supabase
      .from('vaults')
      .select('*')
      .eq('owner_user_id', userId);
    return { data, error };
  }
}

// Usage in components/hooks
const services = useServices();
const { data } = await services.vault.getUserVaults(userId);
```

**Key Service Files**:
- `src/services/ServiceProvider.jsx` - DI container
- `src/services/types.js` - Type definitions
- `src/services/index.js` - Service exports

### 2. Multi-Context Architecture

State management is split into focused contexts for separation of concerns.

**Contexts**:
1. **AppContext** (`src/context/AppContext.jsx`)
   - User session management
   - Global UI state (modals, loading, search)
   - Authentication state

2. **VaultContext** (`src/context/VaultContext.jsx`)
   - Vaults and songs data
   - Real-time subscriptions
   - Vault/song CRUD operations

3. **AudioContext** (`src/context/AudioContext.jsx`)
   - Audio playback state (Howler.js instance)
   - Queue management
   - Playback controls (play, pause, skip, shuffle, repeat)

4. **ToastContext** (`src/context/ToastContext.jsx`)
   - Toast notification system
   - User feedback messages

**Usage Pattern**:
```javascript
// Components use contexts via custom hooks
import { useApp } from '../context/AppContext';
import { useVaults } from '../context/VaultContext';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';

function MyComponent() {
  const { currentUser, setCurrentView } = useApp();
  const { vaults, currentVault, setCurrentVault } = useVaults();
  const { currentSong, play, pause } = useAudio();
  const { showToast } = useToast();

  // Component logic...
}
```

### 3. Custom Hooks Layer

Business logic is extracted into reusable custom hooks, keeping components clean and focused on UI.

**Key Hooks** (`src/hooks/`):
- `useAudio.js` - Audio playback controls, volume, seeking
- `useQueue.js` - Queue management, shuffle, next/previous
- `useVaultOperations.js` - Vault CRUD (create, update, delete, join)
- `useSongOperations.js` - Song CRUD and upload
- `useRealtime.js` - Supabase real-time subscription management

**Example**:
```javascript
// Hook handles all business logic
export function useVaultOperations(services, currentUser) {
  const createVault = async (name, color) => {
    const validation = validateVaultName(name);
    if (!validation.isValid) {
      return { error: validation.errors[0] };
    }
    return await services.vault.createVault({ name, color, owner_user_id: currentUser.id });
  };

  return { createVault, updateVault, deleteVault };
}

// Component uses hook
function CreateVaultModal() {
  const { createVault } = useVaultOperations(services, currentUser);
  const handleSubmit = async () => {
    const { error } = await createVault(name, color);
    if (error) showToast(error);
  };
}
```

### 4. Error Handling

Centralized error handling with custom error classes and user-friendly messages.

**Error Classes** (`src/utils/errors.js`):
- `AppError` - Base error class
- `AuthError` - Authentication errors
- `VaultError` - Vault operation errors
- `SongError` - Song operation errors
- `StorageError` - File storage errors
- `NetworkError` - Network/connectivity errors
- `ValidationError` - Input validation errors

**Usage Pattern**:
```javascript
import { VaultError, handleError } from '../utils/errors';

try {
  const result = await createVault(data);
  if (result.error) throw new VaultError(result.error.message);
} catch (error) {
  const errorResponse = handleError(error, {
    logError: true,
    onError: (err) => showToast(err.error)
  });
}
```

**Retry Logic**:
```javascript
import { withRetry } from '../utils/errors';

const result = await withRetry(
  () => uploadFile(file),
  {
    maxRetries: 3,
    initialDelay: 1000,
    shouldRetry: (error) => error instanceof NetworkError
  }
);
```

### 5. Input Validation

Comprehensive validation utilities prevent XSS, injection attacks, and bad data.

**Validation Functions** (`src/utils/validation.js`):
- `isValidEmail(email)` - Email format validation
- `validatePassword(password, options)` - Password strength validation
- `validateVaultName(name)` - Vault name validation
- `validateMusicFile(file, options)` - Audio file validation
- `validateImageFile(file, options)` - Image file validation
- `validateSongMetadata(metadata)` - Song metadata validation
- `validateInviteCode(code)` - Invite code validation
- `sanitizeInput(input)` - XSS prevention
- `validateForm(data, schema)` - Generic form validation

**Example**:
```javascript
import { validateMusicFile, assertValid } from '../utils/validation';

const validation = validateMusicFile(file, {
  maxSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ['audio/mpeg', 'audio/mp3']
});

if (!validation.isValid) {
  showToast(validation.errors[0]);
  return;
}

// Or use assertValid to throw ValidationError
assertValid(validation, 'File upload');
```

---

## 🗄️ Database Schema (Supabase)

### Tables

**`users`** (managed by Supabase Auth)
- `id` (uuid, primary key)
- `email` (text)
- `created_at` (timestamp)

**`vaults`**
- `id` (uuid, primary key)
- `name` (text) - Vault name
- `color` (text) - Hex color code for theming
- `owner_user_id` (uuid, foreign key → users.id)
- `invite_code` (text, unique) - 8-character invite code
- `created_at` (timestamp)
- `updated_at` (timestamp)

**`vault_members`**
- `id` (uuid, primary key)
- `vault_id` (uuid, foreign key → vaults.id)
- `user_id` (uuid, foreign key → users.id)
- `role` (text) - 'owner' | 'admin' | 'member' | 'viewer'
- `joined_at` (timestamp)

**`songs`**
- `id` (uuid, primary key)
- `title` (text) - Song title
- `artist` (text) - Artist name
- `album` (text) - Album name
- `duration` (integer) - Duration in seconds
- `year` (integer) - Release year
- `file_path` (text) - Storage path to audio file
- `cover_path` (text) - Storage path to cover image
- `uploaded_by` (uuid, foreign key → users.id)
- `created_at` (timestamp)

**`vault_songs`** (junction table)
- `id` (uuid, primary key)
- `vault_id` (uuid, foreign key → vaults.id)
- `song_id` (uuid, foreign key → songs.id)
- `added_by` (uuid, foreign key → users.id)
- `added_at` (timestamp)

### Storage Buckets

**`songs`**
- Audio files (MP3, M4A, WAV, FLAC, OGG)
- Path format: `{user_id}/{song_id}.{ext}`

**`covers`**
- Album artwork images (JPEG, PNG, WebP)
- Path format: `{song_id}.{ext}`

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:
- Users can only access vaults they own or are members of
- Song uploads require vault membership
- Only vault owners can delete vaults
- Only owners/admins can manage members

---

## 🔧 Development Workflows

### Git Workflow

**Branch Naming Convention**:
- Feature branches: `claude/feature-name-{sessionId}`
- Bug fixes: `claude/fix-issue-{sessionId}`
- Refactors: `claude/refactor-area-{sessionId}`

**Example**:
```bash
# Current branch
git branch  # claude/add-claude-documentation-rsjUQ

# Always develop on designated branch
git status
git add .
git commit -m "Add comprehensive CLAUDE.md documentation"
git push -u origin claude/add-claude-documentation-rsjUQ
```

**Commit Message Convention**:
```
<type>: <description>

Examples:
- "Add user profile settings page"
- "Fix: Resolve playback queue bug"
- "Refactor: Extract audio controls to custom hook"
- "Update: Improve error messages for upload failures"
```

**Pull Request Process**:
1. Push changes to feature branch
2. Create PR against main branch
3. Include clear description of changes
4. Reference related issues if applicable

### Environment Setup

**Required Environment Variables** (`.env`):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Setup Steps**:
```bash
# 1. Clone repository
git clone https://github.com/Kvilt1/CoLabMusic.git
cd CoLabMusic

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start development server
npm run dev
# Open http://localhost:5173
```

### Common Development Tasks

**Adding a New Feature**:
1. Create feature branch: `git checkout -b claude/feature-name-{sessionId}`
2. Determine which layer(s) to modify:
   - **Service layer**: For new data operations
   - **Hook layer**: For new business logic
   - **Context layer**: For new global state
   - **Component layer**: For new UI
3. Follow existing patterns (see examples below)
4. Test locally
5. Commit and push

**Adding a New Service**:
```bash
# Example: Adding a "Playlist" service

# 1. Create abstract interface
src/services/playlist/PlaylistService.js

# 2. Create Supabase implementation
src/services/playlist/SupabasePlaylistService.js

# 3. Create mock implementation
src/services/playlist/MockPlaylistService.js

# 4. Register in ServiceProvider
src/services/ServiceProvider.jsx
```

**Adding a New Component**:
```bash
# 1. Create component file
src/components/MyComponent.jsx

# 2. Import necessary hooks
import { useApp } from '../context/AppContext';
import { useVaults } from '../context/VaultContext';

# 3. Follow existing component patterns
# - Functional components with hooks
# - PropTypes or JSDoc for documentation
# - Tailwind CSS for styling
# - Error boundaries where appropriate
```

---

## 🎨 Code Conventions

### File Naming
- **Components**: PascalCase (e.g., `VaultSettings.jsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useVaultOperations.js`)
- **Services**: PascalCase (e.g., `SupabaseVaultService.js`)
- **Utils**: camelCase (e.g., `validation.js`)
- **Contexts**: PascalCase (e.g., `VaultContext.jsx`)

### Code Style
- **Functional components** with hooks (no class components)
- **Async/await** for asynchronous operations
- **Destructuring** for props and state
- **Early returns** for error handling
- **JSDoc comments** for complex functions
- **Consistent indentation** (2 spaces)

### Styling
- **Tailwind CSS** for all styling
- **CSS variables** for theme colors (defined in `tailwind.config.js`)
- **Responsive design** with Tailwind breakpoints
- **Glassmorphism effects** for modern UI (backdrop-blur)

### Error Handling
- Always validate user input before processing
- Use custom error classes for specific error types
- Provide user-friendly error messages
- Log errors to console in development
- Handle network failures with retry logic

### State Management
- Keep component state local when possible
- Use contexts for global/shared state
- Extract business logic to custom hooks
- Avoid prop drilling (use contexts)

---

## 🔍 Important Files Reference

### Core Configuration
- `src/supabaseClient.js` - Supabase client setup (auth, headers)
- `vite.config.js` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS theme and plugins
- `package.json` - Dependencies and scripts

### Entry Points
- `index.html` - HTML template
- `src/main.jsx` - React app mount point
- `src/App.jsx` - Main application component with routing

### Key Utilities
- `src/utils/errors.js` - Error handling utilities
- `src/utils/validation.js` - Input validation
- `src/utils/vaultColors.js` - Color scheme generator

### Service Layer
- `src/services/ServiceProvider.jsx` - DI container (wraps entire app)
- `src/services/index.js` - Service exports and `useServices` hook
- `src/services/types.js` - Type definitions (JSDoc style)

### Context Providers
- `src/context/AppContext.jsx` - User session and UI state
- `src/context/VaultContext.jsx` - Vaults and songs data
- `src/context/AudioContext.jsx` - Audio playback state
- `src/context/ToastContext.jsx` - Toast notifications

### Custom Hooks
- `src/hooks/useAudio.js` - Audio playback controls
- `src/hooks/useQueue.js` - Queue management
- `src/hooks/useVaultOperations.js` - Vault operations
- `src/hooks/useSongOperations.js` - Song operations
- `src/hooks/useRealtime.js` - Real-time subscriptions

---

## 🧪 Testing Approach

### Current State
- No formal test suite yet (uses manual testing)
- Mock services available for future unit tests
- ESLint configured for code quality

### Testing Strategy (Future)
1. **Unit Tests**: Test individual functions (utils, validators)
2. **Integration Tests**: Test service layer with mock implementations
3. **Component Tests**: Test React components with React Testing Library
4. **E2E Tests**: Test user flows with Playwright/Cypress

### Manual Testing Checklist
- ✅ User authentication (sign up, login, logout)
- ✅ Vault creation and deletion
- ✅ Invite code generation and joining
- ✅ Song upload with metadata extraction
- ✅ Audio playback (play, pause, skip, seek)
- ✅ Queue management (shuffle, repeat)
- ✅ Real-time updates (multi-user scenarios)
- ✅ Member role management
- ✅ Search functionality

---

## 🐛 Common Issues & Troubleshooting

### Issue: Audio not playing
**Cause**: Browser autoplay policy blocking playback
**Solution**: User must interact with page first (click play button)

### Issue: Upload failing
**Cause**: File size exceeds limit or invalid file type
**Solution**: Check validation in `src/utils/validation.js` - max 100MB, allowed types in `validateMusicFile`

### Issue: Real-time updates not working
**Cause**: Supabase Realtime not enabled for tables
**Solution**: Enable Realtime in Supabase dashboard for `vaults`, `songs`, `vault_songs` tables

### Issue: Environment variables not loading
**Cause**: `.env` file missing or incorrectly named
**Solution**: Copy `.env.example` to `.env` and add Supabase credentials

### Issue: Supabase API key errors
**Cause**: Missing or incorrect API key in headers
**Solution**: Check `src/supabaseClient.js` - `apikey` header should be set in `global.headers`

### Issue: Metadata extraction failing
**Cause**: File format not supported by `music-metadata` library
**Solution**: Verify file format is standard MP3/M4A/FLAC. Some proprietary formats may fail.

---

## 📚 Key Dependencies

### Production
- **react** (18.2.0) - UI framework
- **react-dom** (18.2.0) - React DOM bindings
- **@supabase/supabase-js** (2.87.1) - Supabase client
- **@supabase/auth-ui-react** (0.4.7) - Supabase auth components
- **howler** (2.2.4) - Audio playback engine
- **music-metadata** (11.10.3) - Metadata extraction from audio files
- **tus-js-client** (4.3.1) - Resumable file uploads
- **lucide-react** (0.556.0) - Icon library
- **clsx** (2.1.1) - Conditional class names
- **tailwind-merge** (3.4.0) - Merge Tailwind classes

### Development
- **vite** (7.2.4) - Build tool and dev server
- **@vitejs/plugin-react** (4.2.1) - React support for Vite
- **tailwindcss** (4.1.17) - CSS framework
- **eslint** (9.39.1) - Linter
- **postcss** (8.5.6) - CSS processor
- **autoprefixer** (10.4.22) - CSS vendor prefixes

---

## 🚀 Feature Roadmap

See `IMPLEMENTATION_ROADMAP.md` for detailed feature planning.

### Critical Missing Features
- User profile settings (display name, profile picture)
- Song deletion and metadata editing
- Vault-specific queue management
- Like/favorite functionality
- Advanced search filters
- Collaborative playback (sync play state)
- Notifications system
- Mobile responsive improvements

### Future Enhancements
- Playlist recommendations
- Social features (followers, activity feed)
- Third-party integrations (Spotify import)
- Lyrics support
- Equalizer and audio effects
- Offline mode (PWA)
- Analytics dashboard

---

## 🤖 AI Assistant Guidelines

### When Making Changes

1. **Read First**: Always read existing files before modifying. Understand the current implementation.

2. **Follow Patterns**: Use existing patterns for new features:
   - Services follow abstract interface → Supabase implementation
   - Business logic goes in custom hooks
   - UI components use contexts via hooks
   - Validation happens before operations
   - Errors use custom error classes

3. **Maintain Consistency**:
   - File naming conventions
   - Code style (functional components, async/await)
   - Import order (React → third-party → local)
   - JSDoc comments for complex functions

4. **Test Locally**: Run `npm run dev` and manually test changes before committing.

5. **Handle Errors**: Add proper error handling and validation for all user inputs and external operations.

6. **Update Documentation**: If adding significant features, update README.md or relevant docs.

### Common Modification Patterns

**Adding a new Vault feature**:
```
1. Update VaultService.js (abstract interface)
2. Implement in SupabaseVaultService.js
3. Add to useVaultOperations hook
4. Update VaultContext if needed
5. Update UI component (e.g., VaultSettings.jsx)
```

**Adding a new UI component**:
```
1. Create component in src/components/
2. Import necessary contexts via hooks
3. Follow Tailwind CSS styling patterns
4. Add error boundaries if needed
5. Update parent component to render new component
```

**Adding real-time functionality**:
```
1. Identify table to subscribe to
2. Update useRealtime hook with new subscription
3. Add handler in appropriate context (VaultContext/AudioContext)
4. Ensure RLS policies allow real-time access
```

### Security Checklist
- ✅ Validate all user inputs
- ✅ Sanitize text to prevent XSS
- ✅ Check file types and sizes before upload
- ✅ Verify user permissions before operations
- ✅ Use RLS policies for database access
- ✅ Never expose API keys in frontend code
- ✅ Use HTTPS in production

### Performance Best Practices
- Memoize expensive computations with `useMemo`
- Debounce search inputs
- Lazy load components where appropriate
- Optimize images (use WebP for covers)
- Minimize bundle size (check with `npm run build`)
- Use Supabase batch operations for multiple records

---

## 📞 Support & Resources

### Documentation
- **README.md**: User-facing project documentation
- **IMPLEMENTATION_ROADMAP.md**: Feature planning and missing features
- **SEARCH_FEATURE.md**: Search functionality documentation
- **CLAUDE.md**: This file - AI assistant guide

### External Resources
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Howler.js Documentation](https://howlerjs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

### Repository
- **GitHub**: https://github.com/Kvilt1/CoLabMusic
- **Issues**: Report bugs and request features via GitHub Issues

---

## 📝 Changelog

### 2025-12-20
- Initial CLAUDE.md creation
- Comprehensive codebase documentation
- Architecture patterns documentation
- Development workflow guidelines

---

**Built with ❤️ for collaborative music experiences**
