import React, { useState, useEffect } from 'react';
import Hero from '../Hero';
import SongList from '../SongList';
import SearchView from '../SearchView';
import VaultSettings from '../VaultSettings';
import UserMenu from '../UserMenu';
import clsx from 'clsx';
import { useApp } from '../../context';
import { Upload } from 'lucide-react';

const MainView = ({ onUpload }) => {
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

    const { currentView } = useApp();

    // Show search view when in search mode
    if (currentView === 'search') {
        return (
            <main id="main-scroll" className="flex-1 overflow-y-auto relative bg-dark-900 m-2 rounded-2xl ml-0 overflow-hidden custom-scrollbar border border-dark-700 shadow-2xl">
                {/* Header for Search View */}
                <div className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between bg-dark-900/95 backdrop-blur-xl border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             {/* Navigation Placeholders */}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onUpload}
                            className="px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:scale-105 transition hover:bg-orange-500 hover:text-white flex items-center gap-2 shadow-lg"
                        >
                            <Upload className="w-4 h-4" />
                            Upload
                        </button>
                        <UserMenu />
                    </div>
                </div>
                <SearchView />
            </main>
        );
    }

    if (currentView === 'vault-settings') {
        return (
            <main id="main-scroll" className="flex-1 overflow-y-auto relative bg-dark-900 m-2 rounded-2xl ml-0 overflow-hidden custom-scrollbar border border-dark-700 shadow-2xl">
                <div className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between bg-dark-900/90 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-4">
                        {/* Placeholder for navigation history if needed */}
                    </div>
                    <div className="flex items-center gap-4">
                        <UserMenu />
                    </div>
                </div>
                <VaultSettings />
            </main>
        );
    }

    return (
        <main id="main-scroll" className="flex-1 overflow-y-auto relative bg-dark-900 m-2 rounded-2xl ml-0 overflow-hidden custom-scrollbar border border-dark-700 shadow-2xl">
            {/* Header Gradient / Glass */}
            <div className={clsx("sticky top-0 z-30 px-8 py-4 flex items-center justify-between transition-all duration-300", scrolled ? "bg-dark-900/90 backdrop-blur-md shadow-lg border-b border-white/5" : "bg-transparent")}>
                <div className="flex items-center gap-4">
                    {/* Navigation placeholders removed or kept subtle */}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onUpload}
                        className={clsx(
                            "px-5 py-2 text-sm font-bold rounded-full hover:scale-105 transition flex items-center gap-2 shadow-lg",
                            scrolled ? "bg-white text-black hover:bg-orange-500 hover:text-white" : "bg-black/40 text-white backdrop-blur-md hover:bg-white hover:text-black"
                        )}
                    >
                        <Upload className="w-4 h-4" />
                        Upload
                    </button>
                    <UserMenu />
                </div>
            </div>

            <Hero />
            <SongList onUpload={onUpload} />

            <div className="h-32"></div> {/* Spacer for floating player */}
        </main>
    );
};

export default MainView;
