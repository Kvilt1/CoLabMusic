import React, { useState, useRef } from 'react';
import { X, Upload, ChevronDown, Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { supabase } from '../supabaseClient';
import * as tus from 'tus-js-client';

const UploadModal = ({ isOpen, onClose }) => {
    const { groups, currentView } = usePlayer();
    const [artists, setArtists] = useState(['']);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    // Default to current view if it's a specific vault, otherwise first available
    const initialVault = groups.find(g => g.id === currentView)?.id || groups[0]?.id || '';
    const [selectedVault, setSelectedVault] = useState(initialVault);

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
        if (!audioFile || !trackTitle) {
            setErrorMessage("Please select a file and provide a title.");
            return;
        }

        setUploadStatus('uploading');
        setUploadProgress(0);

        try {
            // 1. Upload Audio using TUS for chunked upload / progress
            // Note: Supabase Storage uses TUS under the hood. We can use supabase-js or tus-js-client.
            // Using tus-js-client gives us fine-grained progress events which users expect.

            const fileName = `${Date.now()}-${audioFile.name}`;
            const { data: { session } } = await supabase.auth.getSession();

            // NOTE: For anon uploads to work, RLS must be disabled or Policies allowing anon insert must exist.
            // We are using standard supabase upload for simplicity first, as it handles auth better.
            // Only if we need RESUMABLE uploads specifically for very large files do we strictly need TUS manually.
            // User requested "Chunked upload for large files". 
            // Supabase client uses TUS automatically for files > 6MB.
            // BUT Supabase-js v2 doesn't expose the onProgress hook easily for the `upload` method wrapper.
            // So we will use TUS client manually.

            const upload = new tus.Upload(audioFile, {
                endpoint: `${supabase.supabaseUrl}/storage/v1/upload/resumable`,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    authorization: `Bearer ${supabase.supabaseKey}`,
                    'x-upsert': 'true', // optional
                },
                uploadDataDuringCreation: true,
                removeFingerprintOnSuccess: true, // Important for re-uploads
                metadata: {
                    bucketName: 'Music',
                    objectName: fileName,
                    contentType: audioFile.type,
                    cacheControl: 3600,
                },
                chunkSize: 6 * 1024 * 1024, // 6MB chunks
                onError: (error) => {
                    console.error('Upload failed:', error);
                    setErrorMessage('Upload failed: ' + error.message);
                    setUploadStatus('error');
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
                    setUploadProgress(Number(percentage));
                },
                onSuccess: async () => {
                    console.log('Upload finished:', upload.url);

                    // 2. Upload Cover Art (Standard Upload)
                    let coverUrl = null;
                    if (coverFile) {
                        const coverName = `covers/${Date.now()}-${coverFile.name}`;
                        const { data: coverData, error: coverError } = await supabase.storage
                            .from('Music')
                            .upload(coverName, coverFile);

                        if (!coverError) {
                            const { data: { publicUrl } } = supabase.storage
                                .from('Music')
                                .getPublicUrl(coverName);
                            coverUrl = publicUrl;
                        }
                    }

                    // 3. Get Public URL for Audio
                    const { data: { publicUrl: audioUrl } } = supabase.storage
                        .from('Music')
                        .getPublicUrl(fileName);

                    // 4. Save Metadata to Database
                    const { error: dbError } = await supabase
                        .from('songs')
                        .insert([
                            {
                                title: trackTitle,
                                artist: artists.filter(a => a.trim() !== '').join(', '),
                                url: audioUrl,
                                cover_url: coverUrl,
                                group_id: selectedVault,
                                duration: duration, // Add calculated duration
                            }
                        ]);

                    if (dbError) {
                        console.error('Database Error:', dbError);
                        setErrorMessage('File uploaded but database save failed.');
                        setUploadStatus('error');
                    } else {
                        setUploadStatus('success');
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
                },
            });

            // Start the upload
            // Check if prior upload exists? No, just start.
            // Note: TUS handling requires Bucket to be public? Or Auth token handles it.
            // We passed the anon key as Bearer token.
            upload.findPreviousUploads().then(function (previousUploads) {
                // Ask user if they want to resume? For now, just start fresh or resume latest if matches.
                if (previousUploads.length) {
                    upload.resumeFromPreviousUpload(previousUploads[0]);
                }
                upload.start();
            });

        } catch (err) {
            console.error(err);
            setErrorMessage('An unexpected error occurred.');
            setUploadStatus('error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-[#282828] rounded-xl p-8 w-full max-w-lg shadow-2xl border border-[#333] animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Add to Vault</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#333] p-1 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); uploadFile(); }}>

                    {/* Audio File Upload Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('audio-upload').click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer group relative
                            ${isDragging ? 'border-emerald-500 bg-[#333]' : 'border-[#444] hover:border-white hover:bg-[#333]'}
                            ${audioFile ? 'border-emerald-500/50 bg-[#333]/50' : ''}
                        `}
                    >
                        {audioFile ? (
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <p className="text-white font-bold truncate max-w-[200px]">{audioFile.name}</p>
                                <p className="text-sm text-gray-500">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                                    className="mt-2 text-xs text-red-400 hover:text-red-300 z-10"
                                >
                                    Remove File
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-[#333] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition group-hover:bg-[#444]">
                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-white" />
                                </div>
                                <p className="text-base text-white font-bold">Drag and drop audio files</p>
                                <p className="text-sm text-gray-500 mt-1">MP3, WAV, FLAC (Max 50MB)</p>
                            </>
                        )}
                        <input id="audio-upload" type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
                    </div>

                    {errorMessage && (
                        <div className="p-3 bg-red-500/20 text-red-400 text-sm rounded border border-red-500/50">
                            {errorMessage}
                        </div>
                    )}

                    {/* Progress Bar */}
                    {uploadStatus === 'uploading' && (
                        <div className="w-full bg-[#333] rounded-full h-2.5 overflow-hidden">
                            <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    )}

                    {uploadStatus === 'success' && (
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 text-sm rounded border border-emerald-500/50 text-center font-bold">
                            Upload Complete!
                        </div>
                    )}

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
                                <input
                                    type="text"
                                    placeholder="Song Name"
                                    value={trackTitle}
                                    onChange={(e) => setTrackTitle(e.target.value)}
                                    className="w-full bg-[#181818] border border-[#333] rounded p-3 text-sm focus:border-emerald-500 focus:outline-none text-white mt-1 transition-colors"
                                />
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
                        <button
                            type="submit"
                            disabled={uploadStatus === 'uploading' || uploadStatus === 'success'}
                            className={`w-full font-bold py-3.5 rounded-full shadow-lg text-sm uppercase tracking-wide flex items-center justify-center gap-2
                                ${uploadStatus === 'uploading'
                                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                    : 'bg-emerald-500 text-black hover:scale-[1.02] hover:bg-emerald-400 transition'
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
