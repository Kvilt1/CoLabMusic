/**
 * Custom hook for queue management (playlist, shuffle, repeat)
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export function useQueue() {
  const [queue, setQueue] = useState([]);
  const [userQueue, setUserQueue] = useState([]); // Manual "Add to Queue" list
  const [originalQueue, setOriginalQueue] = useState([]); // Non-shuffled version
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: Off, 1: All, 2: One

  // Refs for callbacks to avoid stale closures
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const repeatModeRef = useRef(repeatMode);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  /**
   * Shuffle an array
   */
  const shuffleArray = useCallback((array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }, []);

  /**
   * Initialize queue with a list of songs
   */
  const initializeQueue = useCallback((songs, startSong = null, shouldShuffle = false) => {
    setOriginalQueue(songs);

    let newQueue;
    if (shouldShuffle && startSong) {
      const otherSongs = songs.filter(s => s.id !== startSong.id);
      newQueue = [startSong, ...shuffleArray(otherSongs)];
    } else if (shouldShuffle) {
      newQueue = shuffleArray(songs);
    } else {
      newQueue = songs;
    }

    setQueue(newQueue);

    if (startSong) {
      const newIndex = newQueue.findIndex(s => s.id === startSong.id);
      setQueueIndex(newIndex);
    } else {
      setQueueIndex(0);
    }

    return newQueue;
  }, [shuffleArray]);

  /**
   * Add a song to the user queue
   */
  const addToQueue = useCallback((song) => {
    setUserQueue(prev => [...prev, song]);
  }, []);

  /**
   * Remove a song from the user queue
   */
  const removeFromQueue = useCallback((songId) => {
    setUserQueue(prev => prev.filter(s => s.id !== songId));
  }, []);

  /**
   * Clear the user queue
   */
  const clearUserQueue = useCallback(() => {
    setUserQueue([]);
  }, []);

  /**
   * Get next song in queue
   */
  const getNextSong = useCallback(() => {
    const currentQ = queueRef.current;
    const currentIdx = queueIndexRef.current;
    const mode = repeatModeRef.current;

    if (currentQ.length === 0) return null;

    // Repeat One - return current song
    if (mode === 2) {
      return { song: currentQ[currentIdx], index: currentIdx };
    }

    let nextIdx = currentIdx + 1;

    // End of queue
    if (nextIdx >= currentQ.length) {
      if (mode === 1) {
        // Repeat All - go to beginning
        nextIdx = 0;
      } else {
        // No repeat - end playback
        return null;
      }
    }

    return { song: currentQ[nextIdx], index: nextIdx };
  }, []);

  /**
   * Get previous song in queue
   */
  const getPreviousSong = useCallback((currentSeek = 0) => {
    const currentQ = queueRef.current;
    const currentIdx = queueIndexRef.current;

    // If more than 3 seconds into song, restart current song
    if (currentSeek > 3) {
      return { song: currentQ[currentIdx], index: currentIdx, restart: true };
    }

    let prevIdx = currentIdx - 1;
    if (prevIdx < 0) {
      if (currentQ.length > 0) {
        prevIdx = currentQ.length - 1;
      } else {
        prevIdx = 0;
      }
    }

    return { song: currentQ[prevIdx], index: prevIdx, restart: false };
  }, []);

  /**
   * Move to next song
   */
  const moveToNext = useCallback(() => {
    const next = getNextSong();
    if (next) {
      setQueueIndex(next.index);
    }
    return next;
  }, [getNextSong]);

  /**
   * Move to previous song
   */
  const moveToPrevious = useCallback((currentSeek = 0) => {
    const prev = getPreviousSong(currentSeek);
    if (prev && !prev.restart) {
      setQueueIndex(prev.index);
    }
    return prev;
  }, [getPreviousSong]);

  /**
   * Toggle shuffle mode
   */
  const toggleShuffle = useCallback((currentSong = null) => {
    const newShuffleState = !isShuffled;
    setIsShuffled(newShuffleState);

    if (newShuffleState) {
      // Turning shuffle ON
      if (currentSong) {
        const otherSongs = originalQueue.filter(s => s.id !== currentSong.id);
        const newQueue = [currentSong, ...shuffleArray(otherSongs)];
        setQueue(newQueue);
        setQueueIndex(0); // Current song is now at index 0
      } else {
        setQueue(shuffleArray(originalQueue));
      }
    } else {
      // Turning shuffle OFF
      setQueue(originalQueue);
      // Find current song in original queue
      if (currentSong) {
        const originalIndex = originalQueue.findIndex(s => s.id === currentSong.id);
        setQueueIndex(originalIndex);
      }
    }
  }, [isShuffled, originalQueue, shuffleArray]);

  /**
   * Toggle repeat mode (Off -> All -> One -> Off)
   */
  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => (prev + 1) % 3);
  }, []);

  /**
   * Toggle queue visibility
   */
  const toggleQueue = useCallback(() => {
    setIsQueueOpen(prev => !prev);
  }, []);

  /**
   * Get current song from queue
   */
  const getCurrentSong = useCallback(() => {
    if (queueIndex >= 0 && queueIndex < queue.length) {
      return queue[queueIndex];
    }
    return null;
  }, [queue, queueIndex]);

  /**
   * Remove song from all queues (useful when song is deleted)
   */
  const removeSongFromQueues = useCallback((songId) => {
    setQueue(prev => prev.filter(s => s.id !== songId));
    setUserQueue(prev => prev.filter(s => s.id !== songId));
    setOriginalQueue(prev => prev.filter(s => s.id !== songId));
  }, []);

  return {
    // State
    queue,
    userQueue,
    originalQueue,
    queueIndex,
    isShuffled,
    isQueueOpen,
    repeatMode,

    // Actions
    initializeQueue,
    addToQueue,
    removeFromQueue,
    clearUserQueue,
    getNextSong,
    getPreviousSong,
    moveToNext,
    moveToPrevious,
    toggleShuffle,
    toggleRepeat,
    toggleQueue,
    getCurrentSong,
    removeSongFromQueues,
    setQueueIndex,

    // Refs
    queueRef,
    queueIndexRef,
    repeatModeRef
  };
}
