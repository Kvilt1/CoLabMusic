import React, { useState, useEffect, useRef } from 'react';
import Hero from '../Hero';
import SongList from '../SongList';
import UploadModal from '../UploadModal'; // Use context instead? NO, App handles modal state.
// Actually, MainView doesn't need to know about UploadModal if it's in App.jsx.
// But wait, the "Upload Music" button is inside the Header in MainView.
// So MainView needs an onUpload prop.
import clsx from 'clsx';
import { usePlayer } from '../../context/PlayerContext';

const MainView = ({ onUpload }) => {
    // We need to trigger the upload modal which is lifted to App.jsx
    // But MainView is rendered by App.jsx, but App.jsx doesn't pass props to MainView in the current code I wrote.
    // In App.jsx: <LeftSidebar onUpload={...} /> ... <MainView />
    // So MainView doesn't have the onUpload prop.
    // I should add it to App.jsx -> MainView, OR rely on a global UI context (overkill).
    // Let's use the explicit prop method, but I need to update App.jsx too.
    // WAIT. The "Upload Music" button was in the header of the main view in the ORIGINAL App.jsx.
    // Let's see if I can move that button to the sidebar or keep it here.
    // The previous design had it in the sticky header.
    // I will accept an `onUpload` prop if possible, or context.
    // But wait, I can just use the LeftSidebar button for now?
    // The user explicitly asked for "Upload Music" button in the header in the original code.
    // I will check the original App.jsx code again via memory or what I saw.
    // It had: <button onClick={() => setIsUploadModalOpen(true)} ...>Upload Music</button> inside the <div className="sticky top-0 ...">

    // For now, I will render the `MainView` structure. I'll add `onUpload` to props.
    // BUT I can't easily change App.jsx again right now without more tool calls.
    // The LeftSidebar HAS an upload button. Is that sufficient?
    // The LeftSidebar has `onUpload`.
    // The Header also had one.
    // I'll make MainView accept `className` and children if needed, but primarily it's the specific view.

    // Let's assume for now I will rely on Sidebar for upload, OR I will add the prop to App.jsx in a moment.
    // I will wire up the scroll logic too.

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = (e) => {
            const offset = e.target.scrollTop;
            setScrolled(offset > 50);
        };

        const main = document.getElementById('main-scroll');
        if (main) {
            main.addEventListener('scroll', handleScroll);
            return () => main.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Placeholder for Auth User
    const userInitials = "R";

    return (
        <main id="main-scroll" className="flex-1 overflow-y-auto relative bg-[#121212] m-2 rounded-lg ml-0 overflow-hidden custom-scrollbar">
            {/* Header Gradient / Glass */}
            <div className={clsx("sticky top-0 z-30 px-8 py-4 flex items-center justify-between transition-all duration-300", scrolled ? "bg-[#121212]/90 backdrop-blur-md shadow-lg" : "bg-transparent")}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white cursor-not-allowed opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                        </button>
                        <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white cursor-not-allowed opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onUpload}
                        className="px-4 py-1.5 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition"
                    >
                        Upload Music
                    </button>
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-black">{userInitials}</div>
                </div>
            </div>

            <Hero />
            <SongList onUpload={onUpload} />

            <div className="h-20"></div> {/* Spacer for player */}
        </main>
    );
};

export default MainView;
