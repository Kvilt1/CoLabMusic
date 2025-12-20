import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useApp } from '../context';
import clsx from 'clsx';

const getUserInitials = (user) => {
    if (!user) return '?';
    const displayName = user.user_metadata?.display_name;
    if (displayName) {
        return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || '?';
};

const UserMenu = () => {
    const { currentUser, logout } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsOpen(false);
        await logout();
    };

    const initials = getUserInitials(currentUser);
    const displayName = currentUser?.user_metadata?.display_name || currentUser?.email?.split('@')[0] || 'User';
    const email = currentUser?.email || '';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-2 p-1 rounded-full transition-all duration-200",
                    "hover:bg-white/10",
                    isOpen && "bg-white/10"
                )}
            >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-black text-white">
                    {initials}
                </div>
                <ChevronDown className={clsx(
                    "w-4 h-4 text-gray-400 transition-transform duration-200",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#282828] rounded-lg shadow-xl border border-[#333] py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-[#333]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-sm text-white">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                                <p className="text-xs text-gray-400 truncate">{email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                // Future: navigate to profile page
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#333] hover:text-white transition"
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </button>
                        <div className="h-px bg-[#333] my-1" />
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#333] hover:text-white transition"
                        >
                            <LogOut className="w-4 h-4" />
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;

