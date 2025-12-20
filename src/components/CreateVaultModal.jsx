import React, { useState } from 'react';
import { X, Image as ImageIcon, Check } from 'lucide-react';
import { useVaults } from '../context';
import { useToast } from '../context/ToastContext';

const CreateVaultModal = ({ isOpen, onClose }) => {
    const { createVault } = useVaults();
    const toast = useToast();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const { error } = await createVault(name, coverPreview);
        if (error) {
            toast.error(error.message || 'Failed to create vault.');
            return;
        }
        toast.success('Vault created.');
        setName('');
        setCoverPreview(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-dark-900/80 z-70 flex items-center justify-center backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-dark-800 rounded-2xl p-8 w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Create Vault</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>

                    {/* Cover Art Upload */}
                    <div className="flex justify-center">
                        <div className="relative w-40 h-40 bg-dark-900 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center overflow-hidden hover:border-orange-500 transition-colors group cursor-pointer shadow-inner">
                            {coverPreview ? (
                                <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500/20 group-hover:text-orange-500 transition-colors">
                                        <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-orange-500 transition-colors" />
                                    </div>
                                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider group-hover:text-gray-300">Add Cover</span>
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
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 pl-1">Vault Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Vault"
                            autoFocus
                            className="w-full bg-dark-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 focus:outline-none transition-all placeholder-gray-600 font-medium"
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={!name} 
                            className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Create Vault
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateVaultModal;
