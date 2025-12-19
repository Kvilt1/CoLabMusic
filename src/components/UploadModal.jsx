import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, ChevronDown, Plus, Trash2, Image as ImageIcon, Loader2, AlertCircle, Check } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { supabase } from '../supabaseClient';
import * as tus from 'tus-js-client';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';

const UploadModal = ({ isOpen, onClose, onSongUploaded }) => {
    const { groups, currentView } = usePlayer();
    const toast = useToast();
    const [artists, setArtists] = useState(['']);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    const [selectedVault, setSelectedVault] = useState('');
    
    // Check if user has any vaults to upload to
    const hasVaults = groups.length > 0;
    
    // Sync selectedVault when groups load or change
    useEffect(() => {
        if (groups.length > 0 && !selectedVault) {
            // Default to current view if it's a specific vault, otherwise first available
            const defaultVault = groups.find(g => g.id === currentView)?.id || groups[0]?.id || '';
            setSelectedVault(defaultVault);
        }
    }, [groups, currentView, selectedVault]);

    // Audio State
    const [audioFile, setAudioFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [trackTitle, setTrackTitle] = useState('');
    const [duration, setDuration] = useState('');

    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
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

    // Drag & Drop Handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        validateAndSetAudio(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        validateAndSetAudio(file);
    };

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const validateAndSetAudio = (file) => {
        if (!file) return;

        // Validation: Type
        if (!file.type.startsWith('audio/')) {
            setErrorMessage('Please upload a valid audio file (MP3, WAV, FLAC).');
            return;
        }

        // Validation: Size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            setErrorMessage('File size exceeds 50MB limit.');
            return;
        }

        setErrorMessage('');
        setAudioFile(file);

        // Calculate Duration
        const audio = new Audio(URL.createObjectURL(file));
        audio.onloadedmetadata = () => {
            setDuration(formatDuration(audio.duration));
            URL.revokeObjectURL(audio.src); // Cleanup
        };

        // Auto-fill title if empty
        if (!trackTitle) {
            const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            setTrackTitle(name);
        }
    };

    const uploadFile = async () => {
        if (!hasVaults) {
            setErrorMessage("You need to create or join a vault before uploading music.");
            return;
        }
        
        if (!selectedVault) {
            setErrorMessage("Please select a vault to upload to.");
            return;
        }

        if (!audioFile || !trackTitle) {
            setErrorMessage("Please select a file and provide a title.");
            return;
        }

        setUploadStatus('uploading');
        setUploadProgress(0);

        try {
            const fileName = `${Date.now()}-${audioFile.name}`;
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('You must be logged in to upload files');
            }

            const upload = new tus.Upload(audioFile, {
                endpoint: `${supabase.supabaseUrl}/storage/v1/upload/resumable`,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    authorization: `Bearer ${session.access_token}`,
                    'x-upsert': 'true', // optional
                },
                uploadDataDuringCreation: true,
                removeFingerprintOnSuccess: true, // Important for re-uploads
                metadata: {
                    bucketName: 'songs',
                    objectName: fileName,
                    contentType: audioFile.type,
                    cacheControl: 3600,
                },
                chunkSize: 6 * 1024 * 1024, // 6MB chunks
                onError: (error) => {
                    console.error('Upload failed:', error);
                    setErrorMessage('Upload failed: ' + error.message);
                    setUploadStatus('error');
                    toast.error(`Upload failed: ${error.message}`);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
                    setUploadProgress(Number(percentage));
                },
                onSuccess: async () => {
                    console.log('Upload finished:', upload.url);

                    // Get fresh session to ensure auth context
                    const { data: { session: currentSession } } = await supabase.auth.getSession();

                    if (!currentSession?.user?.id) {
                        console.error('No valid session found');
                        setErrorMessage('Session expired. Please refresh and try again.');
                        setUploadStatus('error');
                        toast.error('Session expired. Please refresh and try again.');
                        return;
                    }

                    // Explicitly set the session to ensure auth context for database operations
                    await supabase.auth.setSession({
                        access_token: currentSession.access_token,
                        refresh_token: currentSession.refresh_token,
                    });

                    // 2. Upload Cover Art (Standard Upload)
                    let coverUrl = null;
                    if (coverFile) {
                        const coverName = `covers/${Date.now()}-${coverFile.name}`;
                        const { data: coverData, error: coverError } = await supabase.storage
                            .from('covers')
                            .upload(coverName, coverFile);

                        if (!coverError) {
                            const { data: { publicUrl } } = supabase.storage
                                .from('covers')
                                .getPublicUrl(coverName);
                            coverUrl = publicUrl;
                        }
                    }

                    // 3. Get Public URL for Audio
                    const { data: { publicUrl: audioUrl } } = supabase.storage
                        .from('songs')
                        .getPublicUrl(fileName);

                    // 4. Save Metadata to Database
                    // Parse duration from "M:SS" to seconds
                    const durationParts = duration.split(':');
                    const durationSeconds = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1] || 0);

                    // Use direct fetch with auth headers since Supabase client may not pass auth in callbacks
                    const songPayload = {
                        title: trackTitle,
                        artist: artists.filter(a => a.trim() !== '').join(', ') || null,
                        file_url: audioUrl,
                        cover_url: coverUrl,
                        original_filename: audioFile.name,
                        file_size_bytes: audioFile.size,
                        duration_seconds: durationSeconds,
                        uploaded_by: currentSession.user.id,
                        processing_status: 'ready'
                    };

                    const { data: songData, error: dbError } = await supabase
                        .from('songs')
                        .insert(songPayload)
                        .select()
                        .single();

                    if (dbError) {
                        console.error('Database Error:', dbError);
                        setErrorMessage('File uploaded but database save failed.');
                        setUploadStatus('error');
                        toast.error('File uploaded but database save failed.');
                    } else if (songData) {
                        // 5. Link song to vault via vault_songs junction table
                        const { error: vaultSongError } = await supabase
                            .from('vault_songs')
                            .insert({
                                vault_id: selectedVault,
                                song_id: songData.id,
                                added_by: currentSession.user.id
                            });

                        if (vaultSongError) {
                            console.error('Vault Song Link Error:', vaultSongError);
                            // Rollback: Delete the song we just created
                            await supabase
                                .from('songs')
                                .delete()
                                .eq('id', songData.id);
                            setErrorMessage('Failed to link song to vault.');
                            setUploadStatus('error');
                            toast.error('Failed to link song to vault.');
                        } else {
                            setUploadStatus('success');
                            toast.success('Upload complete!');
                            // Notify parent about the new song for immediate UI update
                            if (onSongUploaded) {
                                // Add vault_id for compatibility
                                onSongUploaded({ ...songData, vault_id: selectedVault });
                            }
                            setTimeout(() => {
                                onClose();
                                // Reset state
                                setAudioFile(null);
                                setUploadStatus('idle');
                                setTrackTitle('');
                                setArtists(['']);
                                setCoverFile(null);
                                setCoverPreview(null);
                            }, 1500);
                        }
                    }
                },
            });

            upload.findPreviousUploads().then(function (previousUploads) {
                if (previousUploads.length) {
                    upload.resumeFromPreviousUpload(previousUploads[0]);
                }
                upload.start();
            });

        } catch (err) {
            console.error(err);
            setErrorMessage('An unexpected error occurred.');
            setUploadStatus('error');
            toast.error('An unexpected error occurred.');
        }
    };

    return (
        <div className="fixed inset-0 bg-dark-900/80 z-[70] flex items-center justify-center backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-dark-800 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Add Music</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); uploadFile(); }}>

                    {/* No Vaults Warning */}
                    {!hasVaults && (
                        <div className="p-4 bg-orange-500/10 text-orange-400 text-sm rounded-xl border border-orange-500/20 flex items-start gap-3">
                            <div className="text-orange-500 mt-0.5">⚠️</div>
                            <div>
                                <p className="font-bold mb-1">No vaults available</p>
                                <p className="text-orange-400/80">You need to create or join a vault before uploading music.</p>
                            </div>
                        </div>
                    )}

                    {/* Audio File Upload Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('audio-upload').click()}
                        className={clsx(
                            "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group relative overflow-hidden",
                            isDragging 
                                ? "border-orange-500 bg-orange-500/5 scale-[1.02]" 
                                : "border-white/10 hover:border-orange-500/50 hover:bg-white/5",
                            audioFile && "border-orange-500/30 bg-orange-500/5"
                        )}
                    >
                        {audioFile ? (
                            <div className="flex flex-col items-center relative z-10">
                                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4 text-orange-500 shadow-[0_0_20px_rgba(255,85,0,0.2)]">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <p className="text-white font-bold truncate max-w-[250px] mb-1">{audioFile.name}</p>
                                <p className="text-sm text-gray-400">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                                    className="mt-3 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs hover:bg-red-500/20 transition font-bold"
                                >
                                    Change File
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition duration-300 group-hover:bg-orange-500/20 group-hover:text-orange-500">
                                    <Upload className="w-8 h-8 text-gray-500 group-hover:text-orange-500 transition-colors" />
                                </div>
                                <p className="text-lg text-white font-bold mb-1">Drag & Drop audio file</p>
                                <p className="text-sm text-gray-500">MP3, WAV, FLAC (Max 50MB)</p>
                            </div>
                        )}
                        <input id="audio-upload" type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
                    </div>

                    {errorMessage && (
                        <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {errorMessage}
                        </div>
                    )}

                    {/* Progress Bar */}
                    {uploadStatus === 'uploading' && (
                        <div className="w-full bg-dark-900 rounded-full h-2 overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full transition-all duration-300 relative" style={{ width: `${uploadProgress}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    )}

                    {uploadStatus === 'success' && (
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 text-sm rounded-xl border border-emerald-500/20 text-center font-bold flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" /> Upload Complete!
                        </div>
                    )}

                    <div className="flex gap-6">
                        {/* Cover Art Upload */}
                        <div className="w-32 flex-shrink-0">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 pl-1">Cover Art</label>
                            <div className="relative w-32 h-32 bg-dark-900 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden hover:border-orange-500 transition group cursor-pointer shadow-inner">
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-600 group-hover:text-orange-500 transition-colors" />
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
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 pl-1">Track Title</label>
                                <input
                                    type="text"
                                    placeholder="Song Name"
                                    value={trackTitle}
                                    onChange={(e) => setTrackTitle(e.target.value)}
                                    className="w-full bg-dark-900 border border-white/10 rounded-xl p-3 text-sm focus:border-orange-500 focus:outline-none text-white transition-colors"
                                />
                            </div>

                            {/* Dynamic Vault Selection */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 pl-1">Select Vault</label>
                                <div className="relative">
                                    <select
                                        value={selectedVault}
                                        onChange={(e) => setSelectedVault(e.target.value)}
                                        className="w-full bg-dark-900 border border-white/10 rounded-xl p-3 text-sm focus:border-orange-500 focus:outline-none text-white appearance-none cursor-pointer"
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
                        <div className="flex justify-between items-center mb-2 pl-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Artists</label>
                            <button type="button" onClick={addArtist} className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1 font-bold uppercase tracking-wide">
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
                                        className="flex-1 bg-dark-900 border border-white/10 rounded-xl p-3 text-sm focus:border-orange-500 focus:outline-none text-white transition-colors"
                                    />
                                    {artists.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArtist(index)}
                                            className="p-3 text-gray-500 hover:text-red-500 hover:bg-white/5 rounded-xl transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={uploadStatus === 'uploading' || uploadStatus === 'success' || !hasVaults}
                            className={`w-full font-bold py-4 rounded-xl shadow-lg text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                                ${(uploadStatus === 'uploading' || !hasVaults)
                                    ? 'bg-dark-900 text-gray-500 cursor-not-allowed border border-white/5'
                                    : 'bg-orange-500 text-white hover:scale-[1.02] hover:bg-orange-600 active:scale-[0.98]'
                                }
                            `}
                        >
                            {uploadStatus === 'uploading' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Uploading... {uploadProgress}%
                                </>
                            ) : 'Start Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;
