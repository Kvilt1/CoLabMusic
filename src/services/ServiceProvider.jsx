import React, { createContext, useContext } from 'react';

/**
 * Service context for dependency injection
 */
const ServiceContext = createContext(null);

/**
 * Hook to access services from context
 * @returns {Object} Service instances
 */
export const useServices = () => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return services;
};

/**
 * Service provider component for dependency injection
 * @param {Object} props
 * @param {Object} props.services - Service instances to inject
 * @param {Object} props.services.auth - AuthService instance
 * @param {Object} props.services.vault - VaultService instance
 * @param {Object} props.services.vaultMember - VaultMemberService instance
 * @param {Object} props.services.song - SongService instance
 * @param {Object} props.services.storage - StorageService instance
 * @param {Object} props.services.realtime - RealtimeService instance
 * @param {React.ReactNode} props.children
 */
export const ServiceProvider = ({ services, children }) => {
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};
