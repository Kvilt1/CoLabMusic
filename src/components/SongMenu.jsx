import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, ListPlus, Download } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const SongMenu = ({ song }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const { addToQueue } = usePlayer();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleAddToQueue = (e) => {
        e.stopPropagation();
        addToQueue(song);
        setIsOpen(false);
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        if (song.url) {
            const link = document.createElement('a');
            link.href = song.url;
            link.download = `${song.artist} - ${song.title}.m4a`; // Suggest filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`p-2 rounded-full hover:bg-white/10 transition ${isOpen ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#282828] rounded-md shadow-xl border border-[#333] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button
                        onClick={handleAddToQueue}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#333] flex items-center gap-3 transition"
                    >
                        <ListPlus className="w-4 h-4" />
                        Add to queue
                    </button>
                    <button
                        onClick={handleDownload}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#333] flex items-center gap-3 transition border-t border-[#333]"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
            )}
        </div>
    );
};

export default SongMenu;
