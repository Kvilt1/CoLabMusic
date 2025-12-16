# Search Features Implementation

## Overview
Two complementary search features have been implemented for the CoLabMusic app:
1. **Global Search** - Search across all songs in the database
2. **List Filter** - Filter songs in the current view (vault or home stream)

## Features Implemented

---

## Feature 1: Global Search

### 1. **Search View Component** (`src/components/SearchView.jsx`)
   - **Search Input**: Large, prominent search bar with placeholder text "What do you want to listen to?"
   - **Auto-focus**: Search input automatically receives focus when the view opens
   - **Real-time Search**: Searches as you type with 300ms debounce for performance
   - **Database Integration**: Queries Supabase database using case-insensitive search across:
     - Song titles
     - Artist names
     - Album names
   - **Clear Button**: X button appears when there's text, allowing quick clearing
   - **Loading State**: Shows spinner while searching
   - **Empty States**:
     - Default: Shows search icon with helpful message
     - No results: Shows "No results found" with suggestion to try different keywords
   - **Results Display**:
     - Shows count of results
     - Grid layout with song covers, title, artist, album, vault name, and duration
     - Hover effects for better UX
     - Visual indicator for currently playing song
     - Click to play any song from results

### 2. **Navigation Updates**
   - **Left Sidebar** (`src/components/Layout/LeftSidebar.jsx`):
     - Search button now functional (previously just a `#` link)
     - Active state highlighting when on search view
     - Keyboard shortcut hint (⌘K) displays on hover
   
   - **Main View** (`src/components/Layout/MainView.jsx`):
     - Conditional rendering to show SearchView when currentView === 'search'
     - Maintains consistent header with Upload button and user profile

### 3. **Keyboard Shortcuts** (`src/App.jsx`)
   - **⌘K (Mac) / Ctrl+K (Windows/Linux)**: Quick access to search from anywhere
   - Non-intrusive: Won't interfere with typing in inputs/textareas
   - Visual hint in sidebar shows users the shortcut

### 4. **Responsive Design**
   - Matches the app's existing dark theme
   - Emerald green accent colors for consistency
   - Smooth transitions and hover effects
   - Mobile-friendly layout (responsive grid)

---

## Feature 2: List Filter Search

### 1. **In-List Search UI** (`src/components/Hero.jsx`)
   - **Toggle Button**: "Search in list" button in the action bar
   - **Inline Search Input**: Appears when activated, replacing action buttons
   - **Auto-focus**: Input automatically receives focus when opened
   - **Real-time Filtering**: Filters as you type (no debounce needed - client-side)
   - **Clear Button**: X button to clear the filter
   - **Close Button**: Returns to normal view, clearing the filter

### 2. **Context Integration** (`src/context/PlayerContext.jsx`)
   - **State Management**: `listSearchQuery` state tracks the current filter
   - **Filter Logic**: Applied in `getFilteredSongs()` function
   - **View Persistence**: Filter is cleared when switching between views
   - **Client-side Filtering**: Filters already-loaded songs for instant results

### 3. **Enhanced Song List** (`src/components/SongList.jsx`)
   - **No Results Message**: Shows specific message when filter returns no results
   - **Clear Filter Button**: Quick way to reset the filter from empty state
   - **Seamless Integration**: Works with existing song display logic

### 4. **Search Scope**
   - Filters songs in the **current view only**:
     - If on "Home Stream" → filters all songs
     - If on a specific vault → filters only that vault's songs
   - Searches across: title, artist, and album
   - Case-insensitive partial matching

## How to Use

### Global Search:
1. **Method 1**: Click the "Search" button in the left sidebar
2. **Method 2**: Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) from anywhere in the app
3. Type your search query (song title, artist name, or album name)
4. Results appear automatically as you type
5. Click any song to play it
6. Use the X button or clear the text to reset the search

### List Filter Search:
1. Navigate to any view (Home Stream or a specific vault)
2. Click the "Search in list" button in the hero section
3. Type your filter query in the inline search box
4. The song list updates instantly as you type
5. Click "Close" or press Escape to exit filter mode
6. Filter is automatically cleared when switching views

### Search Query Examples:
- "Deyða" - finds songs with titles containing "Deyða"
- "Lazar" - finds all songs by artist Lazar
- "Unknown Album" - finds songs from that album
- Search is case-insensitive and partial matches work

## Technical Details

### Global Search - Database Query
```javascript
supabase
  .from('songs')
  .select('*')
  .or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
  .order('created_at', { ascending: false })
```

### List Filter - Client-side Filtering
```javascript
filtered = filtered.filter(song => 
    song.title?.toLowerCase().includes(query) ||
    song.artist?.toLowerCase().includes(query) ||
    song.album?.toLowerCase().includes(query)
);
```

### State Management
- Uses existing PlayerContext for:
  - `currentView` state (switches to 'search' for global search)
  - `listSearchQuery` state (tracks list filter)
  - `playSong()` function to play selected songs
  - `currentSong` and `isPlaying` for visual indicators
  - `groups` data to show vault names
  - `getFilteredSongs()` applies both view and search filters

### Performance
- **Global Search**: 300ms debounce prevents excessive database queries
- **List Filter**: Instant client-side filtering (no debounce needed)
- **Efficient rendering**: Only re-renders on query change
- **Smart clearing**: Filter clears when switching views

## Files Modified/Created

### Created:
- `src/components/SearchView.jsx` - Global search component
- `SEARCH_FEATURE.md` - This documentation file

### Modified:
- `src/components/Layout/LeftSidebar.jsx` - Made search button functional, added keyboard hint
- `src/components/Layout/MainView.jsx` - Added conditional rendering for SearchView
- `src/App.jsx` - Added global keyboard shortcut handler
- `src/components/Hero.jsx` - Added inline list filter search UI
- `src/context/PlayerContext.jsx` - Added list search state and filtering logic
- `src/components/SongList.jsx` - Enhanced empty state for filtered results

## Testing

### Testing Global Search:
1. Sign in to the app
2. Click "Search" in the sidebar or press ⌘K/Ctrl+K
3. Try searching for:
   - "Disco" → should find "Disco Pissiling"
   - "Rókur" → should find songs by Rókur
   - "Lazar" → should find multiple songs by Lazar
   - Any partial match will work

### Testing List Filter:
1. Sign in and navigate to Home Stream or a vault
2. Click "Search in list" button in the hero section
3. Try filtering for:
   - "Beat" → should filter to songs with "Beat" in the title
   - "Balls" → should filter to songs by artist Balls
   - Enter gibberish → should show "No songs match" message
4. Click "Close" to exit filter mode
5. Switch to a different vault → filter should auto-clear

## Comparison: Global Search vs List Filter

| Feature | Global Search | List Filter |
|---------|---------------|-------------|
| **Scope** | All songs in database | Current view only |
| **Access** | Sidebar button or ⌘K/Ctrl+K | "Search in list" button |
| **Search Type** | Database query | Client-side filter |
| **Debounce** | Yes (300ms) | No (instant) |
| **View Change** | Switches to search view | Stays in current view |
| **Best For** | Finding any song | Narrowing down a list |
| **Performance** | Network dependent | Instant |
| **Results** | Dedicated results page | Filtered song list |

## When to Use Which?

- **Use Global Search** when:
  - You want to find a specific song across all vaults
  - You're not sure which vault contains the song
  - You want to see all matches from everywhere

- **Use List Filter** when:
  - You're already in the right vault/view
  - You want to quickly narrow down a long list
  - You want to find songs without leaving the current context
  - You need instant results without network delay

## Future Enhancements (Optional)

Potential improvements that could be added:
- Search history (recent searches) for global search
- Advanced filters (by vault, by date, by duration)
- Search suggestions/autocomplete
- Fuzzy search for typo tolerance
- Search by lyrics (requires lyrics data)
- Voice search
- Search analytics (popular searches)
- Save search filters as smart playlists
- Export filtered results

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Works on desktop and mobile devices

## Dependencies

All dependencies were already in the project:
- `lucide-react` - For icons (Search, X, Music, Clock)
- `clsx` - For conditional class names
- `@supabase/supabase-js` - For database queries
- React hooks (useState, useEffect, useRef)

## Notes

- Search only queries the Supabase database (not local/mock data)
- Results are limited by database content
- Search respects user authentication (only searches user's accessible songs)
- Maintains playback state when switching between search and other views

