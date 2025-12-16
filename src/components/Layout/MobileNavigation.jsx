import React from 'react';
import { Home, Search, Library, User } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import clsx from 'clsx';

const MobileNavigation = ({ onSearch, onLibrary, onProfile }) => {
    const { switchView } = usePlayer();
    const [activeTab, setActiveTab] = React.useState('home');

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        if (tab === 'home') {
            switchView('all');
        } else if (tab === 'search') {
            onSearch?.();
        } else if (tab === 'library') {
            onLibrary?.();
        } else if (tab === 'profile') {
            onProfile?.();
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#181818]/95 backdrop-blur-md border-t border-[#282828] z-40 pb-safe md:hidden">
            <div className="flex items-center justify-around h-16">
                <button
                    onClick={() => handleTabClick('home')}
                    className={clsx(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                        activeTab === 'home' ? "text-white" : "text-gray-400"
                    )}
                >
                    <Home className={clsx("w-6 h-6", activeTab === 'home' && "fill-current")} />
                    <span className="text-[10px] font-medium">Home</span>
                </button>
                
                <button
                    onClick={() => handleTabClick('search')}
                    className={clsx(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                        activeTab === 'search' ? "text-white" : "text-gray-400"
                    )}
                >
                    <Search className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Search</span>
                </button>
                
                <button
                    onClick={() => handleTabClick('library')}
                    className={clsx(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                        activeTab === 'library' ? "text-white" : "text-gray-400"
                    )}
                >
                    <Library className={clsx("w-6 h-6", activeTab === 'library' && "fill-current")} />
                    <span className="text-[10px] font-medium">Library</span>
                </button>
                
                <button
                    onClick={() => handleTabClick('profile')}
                    className={clsx(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                        activeTab === 'profile' ? "text-white" : "text-gray-400"
                    )}
                >
                    <User className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Profile</span>
                </button>
            </div>
        </nav>
    );
};

export default MobileNavigation;
