import React, { useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const InstallPrompt = () => {
    const { promptInstall, isIOS, isStandalone, canInstall } = useInstallPrompt();
    const [isDismissed, setIsDismissed] = useState(() => {
        return localStorage.getItem('install-prompt-dismissed') === 'true';
    });

    const handleInstall = async () => {
        const accepted = await promptInstall();
        if (accepted) {
            setIsDismissed(true);
            localStorage.setItem('install-prompt-dismissed', 'true');
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('install-prompt-dismissed', 'true');
    };

    // Don't show if already installed, dismissed, or can't install
    if (isStandalone || isDismissed || !canInstall) {
        return null;
    }

    return (
        <div className="fixed bottom-20 md:bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-2xl z-40 animate-slide-up">
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                            <Download className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Install CloudSync</h3>
                            <p className="text-white/80 text-xs">Add to your home screen</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-white/70 hover:text-white transition p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isIOS ? (
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
                        <p className="text-white text-xs mb-2 font-medium">To install on iOS:</p>
                        <ol className="text-white/90 text-xs space-y-1.5">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-300">1.</span>
                                <span>Tap the <Share className="w-3 h-3 inline mx-0.5" /> Share button</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-300">2.</span>
                                <span>Scroll and tap "Add to Home Screen" <Plus className="w-3 h-3 inline" /></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-300">3.</span>
                                <span>Tap "Add" to confirm</span>
                            </li>
                        </ol>
                    </div>
                ) : (
                    <button
                        onClick={handleInstall}
                        className="w-full bg-white text-emerald-600 font-bold py-2.5 px-4 rounded-lg hover:bg-white/90 transition active:scale-95 text-sm"
                    >
                        Install App
                    </button>
                )}
            </div>
        </div>
    );
};

export default InstallPrompt;
