import { useState, useEffect } from 'react';

/**
 * Custom hook to handle PWA install prompt
 * Returns install prompt handler and helper functions
 */
export const useInstallPrompt = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if running in standalone mode
        const checkStandalone = () => {
            const standalone = window.matchMedia('(display-mode: standalone)').matches 
                || window.navigator.standalone 
                || document.referrer.includes('android-app://');
            setIsStandalone(standalone);
            setIsInstalled(standalone);
        };

        // Check if iOS
        const checkIOS = () => {
            const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            setIsIOS(ios);
        };

        checkStandalone();
        checkIOS();

        // Listen for beforeinstallprompt (Chrome/Edge)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        // Listen for app installed
        const handleAppInstalled = () => {
            setInstallPrompt(null);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (!installPrompt) {
            return false;
        }

        // Show the install prompt
        installPrompt.prompt();

        // Wait for the user to respond
        const { outcome } = await installPrompt.userChoice;

        // Clear the saved prompt
        setInstallPrompt(null);

        return outcome === 'accepted';
    };

    return {
        installPrompt,
        promptInstall,
        isInstalled,
        isIOS,
        isStandalone,
        canInstall: !!installPrompt || (isIOS && !isStandalone)
    };
};
