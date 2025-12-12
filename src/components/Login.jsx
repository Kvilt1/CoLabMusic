import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';
import { MonitorSpeaker } from 'lucide-react';

const Login = () => {
    // Custom theme to match app aesthetics
    const customTheme = {
        default: {
            colors: {
                brand: '#10b981', // emerald-500
                brandAccent: '#059669', // emerald-600
                brandButtonText: 'white',
                defaultButtonBackground: '#262626',
                defaultButtonBackgroundHover: '#404040',
                inputBackground: '#262626',
                inputBorder: '#404040',
                inputBorderHover: '#10b981',
                inputBorderFocus: '#10b981',
                inputText: 'white',
                inputLabelText: '#a3a3a3',
                messageText: 'white',
                messageTextDanger: '#ef4444',
                anchorTextColor: '#10b981',
                anchorTextHoverColor: '#059669',
            },
            fontSizes: {
                baseInputSize: '16px',
            },
            space: {
                inputPadding: '12px',
                buttonPadding: '12px',
            },
            radii: {
                borderRadiusButton: '8px',
                borderRadiusInput: '8px',
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#181818] rounded-xl shadow-2xl border border-white/5 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                        <MonitorSpeaker className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-400">Sign in to access your vaults</p>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa, variables: customTheme }}
                    theme="dark"
                    providers={[]} // Email/Password only for now
                    redirectTo={window.location.origin}
                />
            </div>
        </div>
    );
};

export default Login;
