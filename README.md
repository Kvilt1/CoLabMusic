# 🎵 CoLabMusic

A modern, collaborative music streaming platform built with React and Supabase. CoLabMusic allows users to create music vaults (shared playlists), upload songs, and enjoy music together in real-time with advanced playback features.

## ✨ Features

### 🎼 Core Features
- **Vault System**: Create and manage collaborative music vaults (playlists) with custom colors and invite codes
- **Real-time Collaboration**: Multi-user support with real-time updates using Supabase Realtime
- **Music Upload**: Upload your own music files with automatic metadata extraction
- **Advanced Audio Player**: Built on Howler.js with support for:
  - Play/Pause, Next/Previous track
  - Shuffle and Repeat modes (All/One)
  - Volume control and seeking
  - Queue management
  - Keyboard shortcuts (Spacebar for play/pause, Cmd/Ctrl+K for search)
  - Media Session API integration for hardware controls

### 👥 Collaboration Features
- **Vault Roles**: Owner, Admin, Member, and Viewer permissions
- **Invite System**: Share vaults with unique invite codes
- **Member Management**: Add, remove, and update member roles
- **Ownership Transfer**: Transfer vault ownership to other members

### 🎨 Modern UI
- **Spotify-inspired Interface**: Clean, intuitive design
- **Dynamic Theming**: Vault-specific color schemes
- **Glassmorphism Effects**: Modern visual effects
- **Responsive Layout**: Works on all screen sizes
- **Toast Notifications**: User-friendly feedback system

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Audio Engine**: [Howler.js](https://howlerjs.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **File Upload**: [tus-js-client](https://github.com/tus/tus-js-client) for resumable uploads
- **Metadata Extraction**: [music-metadata](https://github.com/Borewit/music-metadata-browser)

### Backend
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions

### Architecture Patterns
- **Dependency Injection**: Service layer with abstract interfaces
- **Custom Hooks**: Separated business logic from UI components
- **Context API**: Multiple focused contexts for different concerns
- **Error Handling**: Centralized error handling utilities
- **Validation**: Comprehensive input validation layer

## 📁 Project Structure

```
CoLabMusic/
├── src/
│   ├── components/           # React components
│   │   ├── Layout/          # Layout components (Sidebar, PlayerBar, etc.)
│   │   ├── Login.jsx        # Authentication UI
│   │   ├── UploadModal.jsx  # Music upload interface
│   │   ├── VaultSettings.jsx # Vault management
│   │   └── ...              # Other UI components
│   │
│   ├── context/             # React Context providers
│   │   ├── AppContext.jsx   # App state (user, UI state)
│   │   ├── AudioContext.jsx # Audio playback and queue
│   │   ├── VaultContext.jsx # Vaults and songs management
│   │   ├── ToastContext.jsx # Toast notifications
│   │   └── index.js         # Context exports
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAudio.js      # Audio playback logic
│   │   ├── useQueue.js      # Queue management
│   │   ├── useVaultOperations.js # Vault CRUD operations
│   │   ├── useSongOperations.js  # Song CRUD operations
│   │   ├── useRealtime.js   # Real-time subscriptions
│   │   └── index.js         # Hook exports
│   │
│   ├── services/            # Service layer (Dependency Injection)
│   │   ├── auth/            # Authentication services
│   │   ├── vault/           # Vault services
│   │   ├── vaultMember/     # Member management services
│   │   ├── song/            # Song services
│   │   ├── storage/         # File storage services
│   │   ├── realtime/        # Real-time subscription services
│   │   ├── ServiceProvider.jsx # DI container
│   │   └── index.js         # Service exports
│   │
│   ├── utils/               # Utility functions
│   │   ├── errors.js        # Error handling utilities
│   │   ├── validation.js    # Input validation
│   │   └── vaultColors.js   # Color scheme generator
│   │
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # App entry point
│   └── supabaseClient.js    # Supabase client setup
│
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Supabase account ([sign up here](https://supabase.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/CoLabMusic.git
   cd CoLabMusic
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   - Create a new project on [Supabase](https://supabase.com/)
   - Run the database schema (see Database Schema section)
   - Enable Storage bucket for songs and covers
   - Enable Realtime for tables: `vaults`, `songs`, `vault_songs`

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🗄️ Database Schema

The application uses the following Supabase tables:

- **users**: User accounts (managed by Supabase Auth)
- **vaults**: Music vaults/playlists
- **vault_members**: Vault membership and roles
- **vault_songs**: Song-to-vault relationships
- **songs**: Song metadata and file references

**Storage Buckets:**
- **songs**: Audio file storage
- **covers**: Album artwork storage

## 🏛️ Architecture & Best Practices

### Modular Context Architecture

The application uses a multi-context architecture for better separation of concerns:

1. **AppContext**: Manages user session and UI state
2. **VaultContext**: Handles vaults and songs with real-time updates
3. **AudioContext**: Controls audio playback and queue management
4. **ToastContext**: Provides user feedback notifications

### Custom Hooks Layer

Business logic is extracted into reusable custom hooks:

- `useAudio`: Audio playback controls
- `useQueue`: Queue and shuffle management
- `useVaultOperations`: Vault CRUD operations
- `useSongOperations`: Song CRUD operations
- `useRealtime`: Real-time subscription management

### Service Layer Pattern

The service layer uses dependency injection for:
- **Testability**: Easy to mock services for testing
- **Flexibility**: Swap implementations without changing components
- **Separation**: Business logic isolated from UI

Each service domain has:
- Abstract interface defining the contract
- Supabase implementation for production
- Mock implementation for testing

### Error Handling

Centralized error handling with:
- Custom error classes (`AuthError`, `VaultError`, `SongError`, etc.)
- Error handler utilities with user-friendly messages
- Retry logic with exponential backoff
- Optimistic updates with rollback on error

### Input Validation

Comprehensive validation utilities for:
- Email and password validation
- File upload validation (type, size)
- Song metadata validation
- Vault name and invite code validation
- Form validation with sanitization

## 🎹 Usage

### Creating a Vault

1. Click "Create Vault" in the sidebar
2. Enter a vault name
3. Share the generated invite code with collaborators

### Uploading Music

1. Select a vault or create a new one
2. Click the "Upload" button
3. Select audio files (MP3, M4A, WAV, FLAC, OGG)
4. Metadata will be automatically extracted
5. Songs will be uploaded and added to the vault

### Managing Members

1. Open Vault Settings
2. View current members and their roles
3. Update roles or remove members
4. Transfer ownership if needed

### Playback Controls

- **Spacebar**: Play/Pause
- **Cmd/Ctrl + K**: Open search
- **Click song**: Play from song list
- **Queue buttons**: Manage playback queue
- **Shuffle**: Randomize playback order
- **Repeat**: Loop all songs or repeat one song

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- User authentication required for all operations
- File uploads validated and sanitized
- Input validation prevents XSS and injection attacks

## 🚧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Style

- ESLint configured for React best practices
- Functional components with hooks
- PropTypes or JSDoc for type documentation
- Consistent file naming and organization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- [Howler.js](https://howlerjs.com/) for the excellent audio library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Lucide](https://lucide.dev/) for beautiful icons

---

**Built with ❤️ by the CoLabMusic team**
