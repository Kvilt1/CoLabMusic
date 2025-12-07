# **🎵 CloudSync**

**CloudSync** is a modern, React-based web music player designed for organizing and streaming local music collections. It organizes tracks into "Vaults" (groups) and features a polished, Spotify-inspired interface with advanced queue management, shuffling, and context-aware playback.

## **✨ Features**

* **Vault System:** Organize music into distinct groups/playlists (e.g., "Einkigin", "JukeboxHQ") with custom theming.  
* **Audio Engine:** Powered by Howler.js for reliable playback, volume control, and seeking.  
* **Advanced Queue:**  
  * **User Queue:** Priority queue for "Play Next" functionality.  
  * **Context Queue:** Auto-fills from the current Vault or Home Stream.  
* **Playback Controls:** Shuffle, Repeat (All/One), Next/Prev, and Seek.  
* **Metadata Generation:** Includes a Node.js script to automatically generate JSON metadata and extract cover art from audio files located in the public directory.  
* **Modern UI:** Built with Tailwind CSS v4, featuring glassmorphism effects, dynamic background gradients based on context, and smooth transitions.

## **🛠️ Tech Stack**

* **Framework:** [React 19](https://react.dev/) \+ [Vite](https://vitejs.dev/)  
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)  
* **Audio:** [Howler.js](https://howlerjs.com/)  
* **Icons:** [Lucide React](https://lucide.dev/)  
* **Utils:** music-metadata (Node.js) for parsing audio tags

## **🚀 Getting Started**

### **Prerequisites**

* Node.js (v18+ recommended)  
* npm or yarn

### **Installation**

1. **Clone the repository:**  
   git clone \[https://github.com/yourusername/cloudsync.git\](https://github.com/yourusername/cloudsync.git)  
   cd cloudsync

2. **Install dependencies:**  
   npm install

3. **Run the development server:**  
   npm run dev

## **📂 Adding Music**

Currently, CloudSync operates on local files served via the public directory. To add new music:

1. Place Audio Files:  
   Drop your .mp3, .m4a, .wav, or .flac files into the public/music/ directory.  
2. Generate Metadata:  
   Run the included script to parse file tags (Artist, Title, Album, Cover Art) and update src/data/realSongs.json:  
   node scripts/generate-metadata.js

   *This script automatically extracts embedded cover art to public/covers/ and formats the JSON data required by the app.*  
3. Refresh:  
   The application will now load the new songs from realSongs.json.

## **🏗️ Project Structure**

public/  
├── music/               \# Place audio files here  
├── covers/              \# Generated cover art lands here  
scripts/  
└── generate-metadata.js \# Node script to parse audio files  
src/  
├── components/  
│   ├── Layout/          \# Sidebar, PlayerBar, RightSidebar  
│   ├── Hero.jsx         \# Dynamic header component  
│   ├── SongList.jsx     \# Main track table view  
│   └── ...  
├── context/  
│   └── PlayerContext.jsx \# Core audio state & logic (Howler implementation)  
├── data/  
│   ├── mockData.js      \# Vault definitions  
│   └── realSongs.json   \# Generated song metadata  
└── App.jsx              \# Main layout assembly

## **⚠️ Current Limitations**

* **Upload Feature:** The "Upload" button in the UI is currently a prototype and does not persist files to a server.  
* **Backend:** This is a frontend-focused application; data persistence is handled via local JSON files.

## **🤝 Contributing**

1. Fork the Project  
2. Create your Feature Branch (git checkout \-b feature/AmazingFeature)  
3. Commit your Changes (git commit \-m 'Add some AmazingFeature')  
4. Push to the Branch (git push origin feature/AmazingFeature)  
5. Open a Pull Request

## **📄 License**

Distributed under the MIT License.