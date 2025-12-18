import React, { useState, useRef, useEffect } from 'react';
import { Waves, Home, Search, Plus, FolderPlus, UserPlus, Disc } from 'lucide-react';
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
        <aside className="w-64 bg-dark-900 flex-shrink-0 flex flex-col h-full border-r border-dark-700 z-50">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-white group cursor-default">
                    <div className="bg-gradient-to-tr from-orange-500 to-orange-400 p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(255,85,0,0.3)]">
                        <Disc className="text-white w-5 h-5 animate-spin-slow" />
                    </div>
                    CoLab
                </h1>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 space-y-6">
                <ul className="space-y-1">
                    <li>
                        <button
                            onClick={() => switchView('all')}
                            className={clsx(
                                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium cursor-pointer",
                                currentView === 'all'
                                    ? "text-white bg-dark-700 shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-dark-800"
                            )}
                        >
                            <Home className={clsx("w-5 h-5", currentView === 'all' && "text-orange-500")} /> Home Stream
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => switchView('search')}
                            className={clsx(
                                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-medium group cursor-pointer",
                                currentView === 'search'
                                    ? "text-white bg-dark-700 shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-dark-800"
                            )}
                        >
                            <span className="flex items-center gap-4">
                                <Search className={clsx("w-5 h-5", currentView === 'search' && "text-orange-500")} /> Search
                            </span>
                            <kbd className="hidden group-hover:inline-flex items-center gap-1 px-2 py-0.5 bg-dark-900/50 rounded text-xs font-mono border border-white/5 text-gray-500">
                                <span className="text-[10px]">⌘</span>K
                            </kbd>
                        </button>
                    </li>
                </ul>

                <div>
                    <div className="flex items-center justify-between px-4 mb-2 group relative" ref={menuRef}>
                        <h2 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Your Vaults</h2>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={clsx(
                                "text-gray-400 hover:text-orange-500 transition p-1 rounded-full cursor-pointer",
                                showMenu ? "bg-dark-700 text-orange-500" : "hover:bg-dark-700"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-dark-800 rounded-xl shadow-2xl border border-dark-600 py-1 z-50 animate-fade-in overflow-hidden">
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onCreateVault();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-dark-700 hover:text-orange-500 transition cursor-pointer"
                                >
                                    <FolderPlus className="w-4 h-4" />
                                    Create New Vault
                                </button>
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onJoinVault();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-dark-700 hover:text-orange-500 transition cursor-pointer"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Join with Code
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="h-[1px] bg-dark-700 mx-4 mb-3"></div>
                    <ul className="space-y-1">
                        {groups.map(g => (
                            <li key={g.id}>
                                <button
                                    onClick={() => switchView(g.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition rounded-xl group hover:bg-dark-800 cursor-pointer",
                                        currentView === g.id && "bg-dark-800 text-white"
                                    )}
                                >
                                    {g.cover_url ? (
                                        <img src={g.cover_url} alt={g.name} className="w-8 h-8 rounded-lg object-cover shadow-sm group-hover:shadow-orange-500/20 transition-all" />
                                    ) : (
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g.color || 'from-dark-700 to-dark-600'} flex items-center justify-center text-xs font-bold uppercase text-white shadow-sm border border-white/5`}>
                                            {g.name.substring(0, 2)}
                                        </div>
                                    )}
                                    <span className={clsx("font-medium truncate transition-colors", currentView === g.id && "text-orange-500")}>{g.name}</span>
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
