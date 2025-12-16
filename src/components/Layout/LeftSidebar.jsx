import React from 'react';
import { Waves, Home, Search, Plus, Download } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import clsx from 'clsx';

const Sidebar = ({ onCreateVault }) => {
    const { groups, currentView, switchView } = usePlayer();

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
                        <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-white transition rounded-md font-medium hover:bg-[#1a1a1a]">
                            <Search className="w-5 h-5" /> Search
                        </a>
                    </li>
                </ul>

                <div>
                    <div className="flex items-center justify-between px-4 mb-2 group">
                        <h2 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Your Vaults</h2>
                        <button
                            onClick={onCreateVault}
                            className="text-gray-400 hover:text-white transition p-1 hover:bg-[#282828] rounded-full"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
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
                                    {g.coverUrl ? (
                                        <img src={g.coverUrl} alt={g.name} className="w-8 h-8 rounded object-cover shadow-sm" />
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

            <div className="p-4 border-t border-[#282828]">
                <button className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition w-full px-2 py-2">
                    <Download className="w-4 h-4" /> Install Desktop App
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
