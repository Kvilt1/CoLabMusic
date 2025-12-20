/**
 * Custom hook for audio playback management using Howler.js
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Howl, Howler } from 'howler';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const soundRef = useRef(null);
  const rafRef = useRef(null);
  const onEndCallbackRef = useRef(null);

  /**
   * Internal play function that loads and plays a song
   */
  const playInternal = useCallback((song) => {
    if (soundRef.current) {
      soundRef.current.unload();
    }

    const sound = new Howl({
      src: [song.file_url || song.url],
      html5: true,
      volume: volume,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onend: () => {
        setIsPlaying(false);
        if (onEndCallbackRef.current) {
          onEndCallbackRef.current();
        }
      },
      onloaderror: (id, err) => console.error('Load Error:', err),
      onplayerror: (id, err) => {
        sound.once('unlock', () => {
          sound.play();
        });
      }
    });

    soundRef.current = sound;
    setCurrentSong(song);
    sound.play();

    if (sound.state() === 'loaded') {
      setDuration(sound.duration());
    } else {
      sound.once('load', () => {
        setDuration(sound.duration());
      });
    }
  }, [volume]);

  /**
   * Toggle play/pause
   */
  const togglePlay = useCallback(() => {
    if (soundRef.current) {
      if (isPlaying) {
        soundRef.current.pause();
      } else {
        soundRef.current.play();
      }
    }
  }, [isPlaying]);

  /**
   * Seek to a specific time in the current song
   */
  const seek = useCallback((time) => {
    if (soundRef.current) {
      soundRef.current.seek(time);
      setCurrentTime(time);
    }
  }, []);

  /**
   * Stop playback and unload current song
   */
  const stop = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.unload();
      soundRef.current = null;
    }
    setCurrentSong(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  /**
   * Set callback for when song ends
   */
  const setOnEnd = useCallback((callback) => {
    onEndCallbackRef.current = callback;
  }, []);

  // Global Volume
  useEffect(() => {
    Howler.volume(volume);
  }, [volume]);

  // Progress Loop
  useEffect(() => {
    const updateProgress = () => {
      if (soundRef.current && isPlaying) {
        const seek = soundRef.current.seek();
        setCurrentTime(seek || 0);
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying]);

  // Keyboard Shortcuts (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        const activeTag = document.activeElement.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  // Media Session API (Hardware Keys)
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      if ('MediaMetadata' in window) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.title,
          artist: currentSong.artist || 'Unknown Artist',
          artwork: [
            { src: currentSong.cover_url || currentSong.cover || '', sizes: '512x512', type: 'image/png' }
          ]
        });
      }
    }
  }, [currentSong]);

  return {
    // State
    isPlaying,
    currentSong,
    volume,
    currentTime,
    duration,

    // Actions
    playInternal,
    togglePlay,
    seek,
    stop,
    setVolume,
    setOnEnd,

    // Refs (for external access if needed)
    soundRef
  };
}
