import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const CreateVaultModal = ({ isOpen, onClose }) => {
    const { addVault } = usePlayer();
    const [name, setName] = useState('');
    const [coverPreview, setCoverPreview] = useState(null);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        addVault(name, coverPreview);
        setName('');
        setCoverPreview(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#282828] rounded-xl p-8 w-full max-w-sm shadow-2xl border border-[#333] animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Create New Vault</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#333] p-1 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>

                    {/* Cover Art Upload */}
                    <div className="flex justify-center">
                        <div className="relative w-32 h-32 bg-[#181818] border border-[#333] rounded-lg flex items-center justify-center overflow-hidden hover:border-emerald-500 transition group cursor-pointer">
                            {coverPreview ? (
                                <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <ImageIcon className="w-8 h-8 text-gray-600 mx-auto group-hover:text-gray-400" />
                                    <span className="text-[10px] text-gray-600 uppercase font-bold mt-2 block">Add Cover</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Vault Name */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1">Vault Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Vault"
                            autoFocus
                            className="w-full bg-[#181818] border border-[#333] rounded p-3 text-sm focus:border-emerald-500 focus:outline-none text-white transition-colors"
                        />
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={!name} className="w-full bg-emerald-500 text-black font-bold py-3 rounded-full hover:scale-[1.02] hover:bg-emerald-400 transition shadow-lg text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed">
                            Create Vault
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateVaultModal;
