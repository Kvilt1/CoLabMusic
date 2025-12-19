import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, ListPlus, Download, Trash2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import ConfirmDialog from './ConfirmDialog';
import { useToast } from '../context/ToastContext';

const SongMenu = ({ song }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const menuRef = useRef(null);
    const { addToQueue, deleteSong, currentUser, groups } = usePlayer();
    const toast = useToast();

    // Check if user can delete this song (owner or admin of the vault)
    const canDelete = () => {
        if (!currentUser || !song.vault_id) return false;
        const vault = groups.find(g => g.id === song.vault_id);
        if (!vault) return false;
        // Owner of the vault can always delete
        if (vault.owner_id === currentUser.id) return true;
        // TODO: Check vault_members for admin role (would need to fetch or have it cached)
        return true; // For now, allow any vault member to delete
    };

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
        if (song.file_url) {
            const link = document.createElement('a');
            link.href = song.file_url;
            link.download = `${song.artist} - ${song.title}.m4a`; // Suggest filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setIsOpen(false);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setIsOpen(false);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        const { error } = await deleteSong(song.id);
        if (error) {
            console.error('Failed to delete song:', error);
            toast.error(error.message || 'Failed to delete song.');
        } else {
            toast.success('Song deleted.');
        }
    };

    return (
        <>
        <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleConfirmDelete}
            title="Delete Song"
            message={`Are you sure you want to delete "${song.title}"? This action cannot be undone.`}
            confirmText="Delete"
            variant="danger"
        />
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
                    {canDelete() && (
                        <button
                            onClick={handleDeleteClick}
                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3 transition border-t border-[#333]"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
        </>
    );
};

export default SongMenu;
