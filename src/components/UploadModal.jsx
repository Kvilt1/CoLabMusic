import React, { useState } from 'react';
import { X, Upload, ChevronDown, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const UploadModal = ({ isOpen, onClose }) => {
    const { groups } = usePlayer();
    const [artists, setArtists] = useState(['']);
    const [coverPreview, setCoverPreview] = useState(null);
    const [selectedVault, setSelectedVault] = useState(groups[0]?.id || '');

    if (!isOpen) return null;

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleArtistChange = (index, value) => {
        const newArtists = [...artists];
        newArtists[index] = value;
        setArtists(newArtists);
    };

    const addArtist = () => {
        setArtists([...artists, '']);
    };

    const removeArtist = (index) => {
        if (artists.length > 1) {
            const newArtists = artists.filter((_, i) => i !== index);
            setArtists(newArtists);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#282828] rounded-xl p-8 w-full max-w-lg shadow-2xl border border-[#333] animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Add to Vault</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#333] p-1 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Prototype: Upload!"); onClose(); }}>

                    {/* Audio File Upload */}
                    <div className="border-2 border-dashed border-[#444] rounded-xl p-8 text-center hover:border-white hover:bg-[#333] transition cursor-pointer group">
                        <div className="w-16 h-16 bg-[#333] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition group-hover:bg-[#444]">
                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-white" />
                        </div>
                        <p className="text-base text-white font-bold">Drag and drop audio files</p>
                        <p className="text-sm text-gray-500 mt-1">MP3, WAV, FLAC (Max 50MB)</p>
                    </div>

                    <div className="flex gap-4">
                        {/* Cover Art Upload */}
                        <div className="w-32 flex-shrink-0">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Cover Art</label>
                            <div className="relative w-32 h-32 bg-[#181818] border border-[#333] rounded-lg flex items-center justify-center overflow-hidden hover:border-emerald-500 transition group cursor-pointer">
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-600 group-hover:text-gray-400" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Track Title</label>
                                <input type="text" placeholder="Song Name" className="w-full bg-[#181818] border border-[#333] rounded p-3 text-sm focus:border-emerald-500 focus:outline-none text-white mt-1 transition-colors" />
                            </div>

                            {/* Dynamic Vault Selection */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Select Vault</label>
                                <div className="relative mt-1">
                                    <select
                                        value={selectedVault}
                                        onChange={(e) => setSelectedVault(e.target.value)}
                                        className="w-full bg-[#181818] border border-[#333] rounded p-3 text-sm focus:border-emerald-500 focus:outline-none text-white appearance-none"
                                    >
                                        {groups.map(group => (
                                            <option key={group.id} value={group.id}>{group.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Multiple Artists */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Artists</label>
                            <button type="button" onClick={addArtist} className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Artist
                            </button>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                            {artists.map((artist, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={artist}
                                        onChange={(e) => handleArtistChange(index, e.target.value)}
                                        placeholder="Artist Name"
                                        className="flex-1 bg-[#181818] border border-[#333] rounded p-3 text-sm focus:border-emerald-500 focus:outline-none text-white transition-colors"
                                    />
                                    {artists.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArtist(index)}
                                            className="p-3 text-gray-500 hover:text-red-500 hover:bg-[#333] rounded transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button type="submit" className="w-full bg-emerald-500 text-black font-bold py-3.5 rounded-full hover:scale-[1.02] hover:bg-emerald-400 transition shadow-lg text-sm uppercase tracking-wide">Start Upload</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;
