// Utility functions for generating vault colors dynamically
// Colors are based on vault ID for consistency across the app

const colorSchemes = [
    { color: 'from-purple-600 to-indigo-600', text: 'text-purple-400', border: 'border-purple-500/30', bg_hex: '#2e1065' },
    { color: 'from-blue-500 to-cyan-500', text: 'text-blue-400', border: 'border-blue-500/30', bg_hex: '#1e3a8a' },
    { color: 'from-red-600 to-orange-600', text: 'text-red-400', border: 'border-red-500/30', bg_hex: '#7f1d1d' },
    { color: 'from-emerald-600 to-teal-600', text: 'text-emerald-400', border: 'border-emerald-500/30', bg_hex: '#047857' },
    { color: 'from-yellow-500 to-orange-500', text: 'text-yellow-400', border: 'border-yellow-500/30', bg_hex: '#713f12' },
    { color: 'from-pink-600 to-rose-600', text: 'text-pink-400', border: 'border-pink-500/30', bg_hex: '#831843' },
    { color: 'from-cyan-600 to-blue-600', text: 'text-cyan-400', border: 'border-cyan-500/30', bg_hex: '#164e63' },
    { color: 'from-violet-600 to-purple-600', text: 'text-violet-400', border: 'border-violet-500/30', bg_hex: '#4c1d95' },
];

// Simple hash function to convert vault ID to a number
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

// Get color scheme for a vault based on its ID
export function getVaultColors(vaultId) {
    if (!vaultId) {
        return colorSchemes[0]; // Default to first color
    }

    const hash = hashString(vaultId);
    const index = hash % colorSchemes.length;
    return colorSchemes[index];
}

// Get gradient classes for a vault
export function getVaultGradient(vaultId) {
    return getVaultColors(vaultId).color;
}

// Get text color class for a vault
export function getVaultTextColor(vaultId) {
    return getVaultColors(vaultId).text;
}

// Get border color class for a vault
export function getVaultBorderColor(vaultId) {
    return getVaultColors(vaultId).border;
}

// Get background hex color for a vault
export function getVaultBgHex(vaultId) {
    return getVaultColors(vaultId).bg_hex;
}
