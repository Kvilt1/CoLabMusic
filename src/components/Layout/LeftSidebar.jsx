import React, { useState, useRef, useEffect } from 'react';
import { Waves, Home, Search, Plus, FolderPlus, UserPlus } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import clsx from 'clsx';

const Sidebar = ({ onCreateVault, onJoinVault }) => {
    const { groups, currentView, switchView } = usePlayer();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <aside className="w-64 bg-black flex-shrink-0 flex flex-col h-full border-r border-[#282828]">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-white">
                    <div className="bg-gradient-to-tr from-emerald-500 to-teal-500 p-1.5 rounded-lg">
                        <Waves className="text-black w-5 h-5" />
                    </div>
                    CloudSync
                </h1>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 space-y-6">
                <ul className="space-y-1">
                    <li>
                        <button
                            onClick={() => switchView('all')}
                            className={clsx(
                                "w-full flex items-center gap-4 px-4 py-3 rounded-md transition font-medium",
                                currentView === 'all'
                                    ? "text-white bg-[#282828]"
                                    : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                            )}
                        >
                            <Home className="w-5 h-5" /> Home Stream
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => switchView('search')}
                            className={clsx(
                                "w-full flex items-center justify-between px-4 py-3 rounded-md transition font-medium group",
                                currentView === 'search'
                                    ? "text-white bg-[#282828]"
                                    : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                            )}
                        >
                            <span className="flex items-center gap-4">
                                <Search className="w-5 h-5" /> Search
                            </span>
                            <kbd className="hidden group-hover:inline-flex items-center gap-1 px-2 py-0.5 bg-black/40 rounded text-xs font-mono border border-white/10">
                                <span className="text-[10px]">⌘</span>K
                            </kbd>
                        </button>
                    </li>
                </ul>

                <div>
                    <div className="flex items-center justify-between px-4 mb-2 group relative" ref={menuRef}>
                        <h2 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Your Vaults</h2>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={clsx(
                                "text-gray-400 hover:text-white transition p-1 rounded-full",
                                showMenu ? "bg-[#333] text-white" : "hover:bg-[#282828]"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-[#282828] rounded-lg shadow-xl border border-[#333] py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onCreateVault();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#333] hover:text-white transition"
                                >
                                    <FolderPlus className="w-4 h-4" />
                                    Create New Vault
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onJoinVault();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#333] hover:text-white transition"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Join with Code
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="h-[1px] bg-[#282828] mx-4 mb-3"></div>
                    <ul className="space-y-1">
                        {groups.map(g => (
                            <li key={g.id}>
                                <button
                                    onClick={() => switchView(g.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition rounded-md group hover:bg-[#1a1a1a]",
                                        currentView === g.id && "bg-[#1a1a1a] text-white"
                                    )}
                                >
                                    {g.cover_url ? (
                                        <img src={g.cover_url} alt={g.name} className="w-8 h-8 rounded object-cover shadow-sm" />
                                    ) : (
                                        <div className={`w-8 h-8 rounded bg-gradient-to-br ${g.color || 'from-gray-700 to-gray-800'} flex items-center justify-center text-xs font-bold uppercase text-white shadow-sm`}>
                                            {g.name.substring(0, 2)}
                                        </div>
                                    )}
                                    <span className="font-medium truncate">{g.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
