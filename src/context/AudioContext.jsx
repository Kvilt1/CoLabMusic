/**
 * Audio Context - Manages audio playback and queue
 */

import React, { createContext, useContext, useCallback } from 'react';
import { useAudio } from '../hooks/useAudio';
import { useQueue } from '../hooks/useQueue';

const AudioContext = createContext();

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const audio = useAudio();
  const queue = useQueue();

  /**
   * Play a song and initialize queue
   */
  const playSong = useCallback((song, songsList, shouldShuffle = queue.isShuffled) => {
    // If clicking the same song that's already loaded, just toggle play
    if (audio.currentSong?.id === song.id && audio.soundRef.current) {
      audio.togglePlay();
      return;
    }

    // Initialize queue with the songs list
    const newQueue = queue.initializeQueue(songsList, song, shouldShuffle);

    // Play the song
    audio.playInternal(song);
  }, [audio, queue]);

  /**
   * Go to next song in queue
   */
  const nextSong = useCallback(() => {
    const next = queue.moveToNext();
    if (next && next.song) {
      audio.playInternal(next.song);
    }
  }, [queue, audio]);

  /**
   * Go to previous song in queue
   */
  const prevSong = useCallback(() => {
    const currentSeek = audio.soundRef.current?.seek() || 0;
    const prev = queue.moveToPrevious(currentSeek);

    if (prev) {
      if (prev.restart) {
        // Restart current song
        audio.seek(0);
      } else {
        // Play previous song
        audio.playInternal(prev.song);
      }
    }
  }, [queue, audio]);

  /**
   * Toggle shuffle and update queue
   */
  const toggleShuffle = useCallback(() => {
    queue.toggleShuffle(audio.currentSong);
  }, [queue, audio.currentSong]);

  // Set up auto-next when song ends
  React.useEffect(() => {
    audio.setOnEnd(() => {
      // Handle repeat one mode
      if (queue.repeatMode === 2) {
        audio.playInternal(audio.currentSong);
        return;
      }

      // Get next song
      const next = queue.getNextSong();
      if (next && next.song) {
        queue.setQueueIndex(next.index);
        audio.playInternal(next.song);
      }
    });
  }, [audio, queue]);

  // Media Session API handlers
  React.useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        if (!audio.isPlaying) audio.togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audio.isPlaying) audio.togglePlay();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
    }
  }, [audio, nextSong, prevSong]);

  const value = {
    // Audio state
    isPlaying: audio.isPlaying,
    currentSong: audio.currentSong,
    volume: audio.volume,
    currentTime: audio.currentTime,
    duration: audio.duration,

    // Audio actions
    playSong,
    togglePlay: audio.togglePlay,
    seek: audio.seek,
    stop: audio.stop,
    setVolume: audio.setVolume,
    nextSong,
    prevSong,

    // Queue state
    queue: queue.queue,
    userQueue: queue.userQueue,
    queueIndex: queue.queueIndex,
    isShuffled: queue.isShuffled,
    isQueueOpen: queue.isQueueOpen,
    repeatMode: queue.repeatMode,

    // Queue actions
    addToQueue: queue.addToQueue,
    removeFromQueue: queue.removeFromQueue,
    clearUserQueue: queue.clearUserQueue,
    toggleShuffle,
    toggleRepeat: queue.toggleRepeat,
    toggleQueue: queue.toggleQueue,
    removeSongFromQueues: queue.removeSongFromQueues
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
