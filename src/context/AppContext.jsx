/**
 * App Context - Manages UI state and user session
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useServices } from '../services';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { auth } = useServices();

  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [currentView, setCurrentView] = useState('all');
  const [viewData, setViewData] = useState(null);
  const [listSearchQuery, setListSearchQuery] = useState('');

  /**
   * Initialize user session
   */
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        const { data: user } = await auth.getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [auth]);

  /**
   * Switch view (e.g., 'all' or specific vault ID)
   */
  const switchView = useCallback((viewId, data = null) => {
    setCurrentView(viewId);
    setViewData(data);
    setListSearchQuery(''); // Clear search when switching views
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      switchView('all'); // Reset view on logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [auth, switchView]);

  const value = {
    // User state
    currentUser,
    isLoading,
    logout,

    // UI state
    currentView,
    viewData,
    listSearchQuery,

    // UI actions
    switchView,
    setListSearchQuery
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
