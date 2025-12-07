import realSongs from './realSongs.json';

export const groups = [
    { id: 'einkigin', name: 'Einkigin', color: 'from-emerald-600 to-teal-600', text: 'text-emerald-400', border: 'border-emerald-500/30', bg_hex: '#047857' },
    { id: 'g1', name: 'JukeboxHQ', color: 'from-purple-600 to-indigo-600', text: 'text-purple-400', border: 'border-purple-500/30', bg_hex: '#2e1065' },
    { id: 'g2', name: 'Chill Vibes', color: 'from-blue-500 to-cyan-500', text: 'text-blue-400', border: 'border-blue-500/30', bg_hex: '#1e3a8a' },
    { id: 'g3', name: 'Gym Crew', color: 'from-red-600 to-orange-600', text: 'text-red-400', border: 'border-red-500/30', bg_hex: '#7f1d1d' },
    { id: 'g4', name: 'Indie Discoveries', color: 'from-yellow-500 to-orange-500', text: 'text-yellow-400', border: 'border-yellow-500/30', bg_hex: '#713f12' }
];

const mockSongs = [
    { id: 1001, title: 'Midnight City (Unreleased Remix)', artist: 'M83', album: 'Private Edit', group: 'g1', duration: '4:03', date: '2 days ago' },
    { id: 1002, title: 'Lo-Fi Study Beats Mix', artist: 'Unknown', album: 'YouTube Rip', group: 'g2', duration: '45:12', date: '1 week ago' },
];

export const songs = [...realSongs, ...mockSongs];
