import React, { useState, useRef, useEffect } from 'react';
import { X, Users, Loader2, Check, AlertCircle } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const JoinVaultModal = ({ isOpen, onClose }) => {
    const { joinVaultByCode, switchView } = usePlayer();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [isOpen]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCode(['', '', '', '', '', '']);
            setError(null);
            setSuccess(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (index, value) => {
        // Only allow alphanumeric characters
        const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (sanitized.length > 1) {
            // Handle paste
            const chars = sanitized.split('').slice(0, 6);
            const newCode = [...code];
            chars.forEach((char, i) => {
                if (index + i < 6) {
                    newCode[index + i] = char;
                }
            });
            setCode(newCode);
            const nextIndex = Math.min(index + chars.length, 5);
            inputRefs.current[nextIndex]?.focus();
        } else {
            const newCode = [...code];
            newCode[index] = sanitized;
            setCode(newCode);
            // Auto-focus next input
            if (sanitized && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
        setError(null);
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError('Please enter a complete 6-character code');
            return;
        }

        setLoading(true);
        setError(null);

        const { vault, error: joinError } = await joinVaultByCode(fullCode);

        setLoading(false);

        if (joinError) {
            setError(joinError.message);
        } else if (vault) {
            setSuccess(vault);
            setTimeout(() => {
                onClose();
                switchView(vault.id);
            }, 1500);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-2xl p-8 w-full max-w-md shadow-2xl border border-[#333] animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <Users className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-xl font-bold">Join a Vault</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#333] p-2 rounded-full transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">You're in!</h3>
                        <p className="text-gray-400">Welcome to <span className="text-white font-medium">{success.name}</span></p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-400 text-sm mb-6">Enter the 6-character invite code shared with you to join a vault.</p>

                        {/* Code Input Grid */}
                        <div className="flex justify-center gap-2 mb-6">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    maxLength={6}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-2xl font-mono font-bold bg-[#222] border-2 border-[#333] rounded-lg text-white focus:outline-none focus:border-emerald-500 transition uppercase"
                                    placeholder="•"
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm mb-4 justify-center">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={loading || code.join('').length !== 6}
                            className="w-full bg-emerald-500 text-black font-bold py-3 rounded-full hover:scale-[1.02] hover:bg-emerald-400 transition shadow-lg text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Joining...' : 'Join Vault'}
                        </button>

                        <p className="text-center text-gray-500 text-xs mt-4">
                            Don't have a code? Ask the vault owner to share their invite code with you.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default JoinVaultModal;

