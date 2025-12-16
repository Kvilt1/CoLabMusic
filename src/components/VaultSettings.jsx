import React, { useState, useEffect, useCallback } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { 
    ArrowLeft, Save, Trash2, Users, Image as ImageIcon, X, Loader2, Copy, Check, 
    AlertCircle, RefreshCw, Crown, Shield, User, UserMinus, ChevronDown, 
    ArrowRightLeft, LogOut, MoreVertical, Info
} from 'lucide-react';

// Role configuration
const ROLES = {
    owner: { label: 'Owner', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', icon: Crown },
    admin: { label: 'Admin', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', icon: Shield },
    member: { label: 'Member', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', icon: User },
    viewer: { label: 'Viewer', color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/20', icon: User }
};

const VaultSettings = () => {
    const { 
        viewData, 
        groups, 
        switchView, 
        updateVault, 
        deleteVault,
        regenerateInviteCode,
        uploadVaultCover,
        getVaultMembers,
        updateMemberRole,
        removeMember,
        transferOwnership,
        leaveVault,
        currentUser
    } = usePlayer();
    
    const vaultId = viewData?.vaultId;
    const vault = groups.find(g => g.id === vaultId);

    const [activeTab, setActiveTab] = useState('edit');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [codeCopied, setCodeCopied] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [coverPreview, setCoverPreview] = useState(null);
    const [coverFile, setCoverFile] = useState(null);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Members State
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showKickConfirm, setShowKickConfirm] = useState(null);
    const [showTransferConfirm, setShowTransferConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Leave Vault State
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [leaving, setLeaving] = useState(false);

    // Current user from context
    const currentUserId = currentUser?.id;
    const currentUserMember = members.find(m => m.user_id === currentUserId);
    const isOwner = currentUserMember?.role === 'owner' || vault?.owner_id === currentUserId;

    // Initialize form with vault data
    useEffect(() => {
        if (vault) {
            setName(vault.name || '');
            setDescription(vault.description || '');
            setIsPrivate(vault.is_private !== false);
            setCoverPreview(vault.cover_url || null);
        }
    }, [vault]);

    // Fetch members when Members tab is active
    const fetchMembers = useCallback(async () => {
        if (!vaultId) return;
        setLoadingMembers(true);
        
        const realMembers = await getVaultMembers(vaultId);
        setMembers(realMembers);
        setLoadingMembers(false);
    }, [vaultId, getVaultMembers]);

    useEffect(() => {
        // Fetch members for both members tab and danger tab (needed for leave vault)
        if (activeTab === 'members' || activeTab === 'danger') {
            fetchMembers();
        }
    }, [activeTab, fetchMembers]);

    if (!vault) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p>Vault not found</p>
                <button onClick={() => switchView('all')} className="mt-4 text-emerald-500 hover:text-emerald-400">Return Home</button>
            </div>
        );
    }

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        let coverUrl = vault.cover_url;

        if (coverFile) {
            const { url, error: uploadError } = await uploadVaultCover(vaultId, coverFile);
            if (uploadError) {
                setError('Failed to upload cover image');
                setSaving(false);
                return;
            }
            coverUrl = url;
        }

        const { error: updateError } = await updateVault(vaultId, {
            name,
            description,
            is_private: isPrivate,
            cover_url: coverUrl
        });

        setSaving(false);

        if (updateError) {
            setError('Failed to save changes');
        } else {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== vault.name) return;
        
        setDeleting(true);
        const { error } = await deleteVault(vaultId);
        
        if (error) {
            setError('Failed to delete vault');
            setDeleting(false);
        } else {
            switchView('all');
        }
    };

    const handleRegenerateCode = async () => {
        setRegenerating(true);
        const { error } = await regenerateInviteCode(vaultId);
        if (error) {
            setError('Failed to regenerate invite code');
        }
        setRegenerating(false);
    };

    const copyInviteCode = () => {
        navigator.clipboard.writeText(vault.invite_code || '');
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        setActionLoading(memberId);
        const { error } = await updateMemberRole(memberId, newRole);
        if (!error) {
            // Update locally on success
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
        } else {
            setError('Failed to update role');
        }
        setActionLoading(null);
        setSelectedMember(null);
    };

    const handleKickMember = async (memberId) => {
        setActionLoading(memberId);
        const { error } = await removeMember(memberId);
        if (!error) {
            // Remove locally on success
            setMembers(prev => prev.filter(m => m.id !== memberId));
        } else {
            setError('Failed to remove member');
        }
        setActionLoading(null);
        setShowKickConfirm(null);
    };

    const handleTransferOwnership = async (memberId) => {
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        setActionLoading(memberId);
        const { error } = await transferOwnership(vaultId, member.user_id);
        
        if (!error) {
            // Update roles locally on success
            setMembers(prev => prev.map(m => {
                if (m.user_id === currentUserId) return { ...m, role: 'admin' };
                if (m.id === memberId) return { ...m, role: 'owner' };
                return m;
            }));
        } else {
            setError('Failed to transfer ownership');
        }
        setActionLoading(null);
        setShowTransferConfirm(null);
    };

    const handleLeaveVault = async () => {
        setLeaving(true);
        const { error } = await leaveVault(vaultId, members);
        setLeaving(false);
        if (error) {
            setError(error.message);
            setShowLeaveConfirm(false);
        }
        // If successful, leaveVault switches view to 'all' automatically
    };

    // Get next owner preview for confirmation dialog
    const getNextOwnerPreview = () => {
        if (!isOwner || members.length <= 1) return null;
        
        const otherMembers = members.filter(m => m.user_id !== currentUserId);
        if (otherMembers.length === 0) return null;
        
        const rolePriority = { admin: 1, member: 2, viewer: 3 };
        const sorted = [...otherMembers].sort((a, b) => {
            const pA = rolePriority[a.role] || 99;
            const pB = rolePriority[b.role] || 99;
            if (pA !== pB) return pA - pB;
            return new Date(a.created_at) - new Date(b.created_at);
        });
        
        return sorted[0];
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    };

    const formatJoinDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    const sortedMembers = [...members].sort((a, b) => {
        const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
        return (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4);
    });

    const TabButton = ({ id, label, icon: Icon, badge }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${
                activeTab === id 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'text-gray-400 hover:bg-[#222] hover:text-white'
            }`}
        >
            <Icon className="w-4 h-4" />
            {label}
            {badge && <span className="ml-auto text-xs bg-[#222] text-gray-400 px-2 py-0.5 rounded-full">{badge}</span>}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-[#121212] text-white">
            {/* Header */}
            <div className="flex-shrink-0 px-8 py-6 border-b border-[#282828] flex items-center gap-4 bg-[#121212]/95 backdrop-blur-sm sticky top-0 z-10">
                <button 
                    onClick={() => switchView(vaultId)} 
                    className="p-2 rounded-full hover:bg-[#222] text-gray-400 hover:text-white transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        {vault.name}
                        <span className="text-gray-500 font-normal text-sm">/ Settings</span>
                    </h1>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0 border-r border-[#282828] p-4 overflow-y-auto">
                    <div className="space-y-1">
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Configuration</div>
                        <TabButton id="edit" label="General" icon={Save} />
                        <TabButton id="members" label="Members" icon={Users} badge={members.length} />
                        <TabButton id="invite" label="Invite Code" icon={Copy} />
                        
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">Actions</div>
                        <button 
                            onClick={() => setActiveTab('danger')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${
                                activeTab === 'danger' 
                                ? 'bg-red-500/10 text-red-400' 
                                : 'text-gray-400 hover:bg-red-500/5 hover:text-red-400'
                            }`}
                        >
                            <Trash2 className="w-4 h-4" />
                            Danger Zone
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto">
                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-red-400">{error}</span>
                                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {activeTab === 'edit' && (
                            <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-6">
                                        <div className="group relative w-32 h-32 rounded-xl bg-[#222] border border-[#333] overflow-hidden flex-shrink-0 cursor-pointer hover:border-emerald-500 transition">
                                            {coverPreview ? (
                                                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                                                <ImageIcon className="w-5 h-5 text-white" />
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wide">Change</span>
                                            </div>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleCoverChange}
                                            />
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Vault Name</label>
                                                <input 
                                                    type="text" 
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                                    placeholder="e.g. Summer Vibes 2024"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                                                <textarea 
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    rows={2}
                                                    className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
                                                    placeholder="What's this vault about?"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#181818] rounded-xl border border-[#282828] p-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-white">Private Vault</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">Only invited members can see and access this vault.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={isPrivate} 
                                                onChange={(e) => setIsPrivate(e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        className="bg-emerald-500 text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'members' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Manage Members</h3>
                                        <p className="text-gray-400 text-sm">People with access to this vault</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowPermissions(!showPermissions)}
                                        className="text-xs font-medium text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                                    >
                                        <Info className="w-3 h-3" />
                                        {showPermissions ? 'Hide Roles' : 'View Roles'}
                                    </button>
                                </div>

                                {showPermissions && (
                                    <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 grid grid-cols-2 gap-4 text-xs animate-fade-in">
                                        {Object.entries(ROLES).map(([key, role]) => (
                                            <div key={key} className="flex items-start gap-3">
                                                <div className={`p-1.5 rounded-md ${role.bgColor} ${role.color}`}>
                                                    <role.icon className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <span className={`font-bold block mb-0.5 ${role.color}`}>{role.label}</span>
                                                    <p className="text-gray-500 leading-relaxed">
                                                        {key === 'owner' && "Full control, delete vault, transfer ownership."}
                                                        {key === 'admin' && "Upload/delete songs, manage members."}
                                                        {key === 'member' && "Upload songs, create playlists."}
                                                        {key === 'viewer' && "Listen only, read-only access."}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {sortedMembers.length === 0 ? (
                                    <div className="text-center py-12 bg-[#181818] rounded-xl border border-[#282828]">
                                        <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-400 text-sm mb-2">No members yet</p>
                                        <p className="text-gray-500 text-xs">Share your invite code to add people to this vault.</p>
                                        <button 
                                            onClick={() => setActiveTab('invite')}
                                            className="mt-4 text-emerald-500 text-sm font-medium hover:text-emerald-400"
                                        >
                                            View Invite Code →
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                    {sortedMembers.map(member => {
                                        const roleConfig = ROLES[member.role] || ROLES.member;
                                        const RoleIcon = roleConfig.icon;
                                        const isSelf = member.user_id === currentUserId;

                                        return (
                                            <div 
                                                key={member.id}
                                                className="group flex items-center gap-4 bg-[#181818] hover:bg-[#222] border border-[#282828] hover:border-[#333] rounded-xl p-3 transition"
                                            >
                                                <div className={`w-10 h-10 rounded-full ${roleConfig.bgColor} flex items-center justify-center text-sm font-bold ${roleConfig.color}`}>
                                                    {getInitials(member.display_name || member.email)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-white truncate">
                                                            {member.display_name || member.email}
                                                        </span>
                                                        {isSelf && (
                                                            <span className="text-[10px] font-bold bg-[#333] text-gray-400 px-1.5 py-0.5 rounded">YOU</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Joined {formatJoinDate(member.joined_at || member.created_at)}
                                                    </div>
                                                </div>

                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.bgColor} ${roleConfig.color}`}>
                                                    <RoleIcon className="w-3 h-3" />
                                                    {roleConfig.label}
                                                </div>

                                                {isOwner && !isSelf && member.role !== 'owner' && (
                                                    <div className="relative">
                                                        <button 
                                                            onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                                                            className="p-2 text-gray-500 hover:text-white hover:bg-[#333] rounded-full transition"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {selectedMember === member.id && (
                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#222] border border-[#333] rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                                                <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Change Role</div>
                                                                {['admin', 'member', 'viewer'].filter(r => r !== member.role).map(role => (
                                                                    <button
                                                                        key={role}
                                                                        onClick={() => handleRoleChange(member.id, role)}
                                                                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white flex items-center gap-2"
                                                                    >
                                                                        <div className={`w-2 h-2 rounded-full ${ROLES[role].bgColor.replace('/10', '')}`}></div>
                                                                        {ROLES[role].label}
                                                                    </button>
                                                                ))}
                                                                <div className="h-px bg-[#333] my-1"></div>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedMember(null);
                                                                        setShowTransferConfirm(member.id);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-amber-500 hover:bg-amber-500/10 flex items-center gap-2"
                                                                >
                                                                    <Crown className="w-3 h-3" />
                                                                    Transfer Owner
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedMember(null);
                                                                        setShowKickConfirm(member.id);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                                                                >
                                                                    <UserMinus className="w-3 h-3" />
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    </div>
                                )}
                                
                                {/* Confirmations */}
                                {showKickConfirm && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
                                        <p className="text-red-400 text-sm font-medium">Remove this member?</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleKickMember(showKickConfirm)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition">Confirm Remove</button>
                                            <button onClick={() => setShowKickConfirm(null)} className="bg-[#333] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#444] transition">Cancel</button>
                                        </div>
                                    </div>
                                )}
                                
                                {showTransferConfirm && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
                                        <p className="text-amber-400 text-sm font-medium">Transfer ownership? You will become an Admin.</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleTransferOwnership(showTransferConfirm)} className="bg-amber-500 text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-600 transition">Confirm Transfer</button>
                                            <button onClick={() => setShowTransferConfirm(null)} className="bg-[#333] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#444] transition">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'invite' && (
                            <div className="flex flex-col items-center text-center space-y-8 animate-fade-in py-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Invite Code</h3>
                                    <p className="text-gray-400 max-w-md mx-auto">Share this code with others to grant them access to <span className="text-white font-medium">{vault.name}</span>.</p>
                                </div>

                                <div className="relative group">
                                    <div className="text-6xl font-mono font-black tracking-widest text-emerald-500 select-all">
                                        {vault.invite_code || '------'}
                                    </div>
                                    <div className="absolute -inset-4 bg-emerald-500/5 blur-xl -z-10 rounded-full opacity-50"></div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={copyInviteCode}
                                        className="bg-white text-black font-bold px-6 py-2.5 rounded-full hover:scale-105 transition flex items-center gap-2"
                                    >
                                        {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {codeCopied ? 'Copied' : 'Copy Code'}
                                    </button>
                                    <button 
                                        onClick={handleRegenerateCode}
                                        disabled={regenerating}
                                        className="bg-[#222] text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#333] transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                                        Regenerate
                                    </button>
                                </div>

                                <div className="max-w-md w-full bg-[#181818] rounded-xl border border-[#282828] p-6 mt-8">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">How to Join</h4>
                                    <div className="space-y-3 text-left">
                                        <div className="flex gap-3 text-sm text-gray-300">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-500">1</span>
                                            <span>Click the <span className="text-white font-bold">+</span> button in the sidebar</span>
                                        </div>
                                        <div className="flex gap-3 text-sm text-gray-300">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-500">2</span>
                                            <span>Select <span className="text-white font-bold">Join Vault</span></span>
                                        </div>
                                        <div className="flex gap-3 text-sm text-gray-300">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-gray-500">3</span>
                                            <span>Enter the 6-character code above</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'danger' && (
                            <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
                                <div className="bg-[#181818] border border-[#282828] rounded-xl overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                                <LogOut className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">Leave Vault</h3>
                                                <p className="text-sm text-gray-500">Remove this vault from your sidebar</p>
                                            </div>
                                        </div>
                                        
                                        {showLeaveConfirm ? (
                                            <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                                                <p className="text-orange-400 text-sm mb-3">
                                                    Are you sure? 
                                                    {isOwner && members.length > 1 && (
                                                        <span className="block mt-1 text-orange-300/80 text-xs">
                                                            Ownership will transfer to <strong>{getNextOwnerPreview()?.display_name || getNextOwnerPreview()?.email}</strong>
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={handleLeaveVault}
                                                        disabled={leaving}
                                                        className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition flex items-center gap-2"
                                                    >
                                                        {leaving && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        Confirm Leave
                                                    </button>
                                                    <button 
                                                        onClick={() => setShowLeaveConfirm(false)}
                                                        className="bg-[#222] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#333] transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 flex justify-end">
                                                {isOwner && members.length <= 1 ? (
                                                    <p className="text-xs text-red-400">Sole owner cannot leave. Delete instead.</p>
                                                ) : (
                                                    <button 
                                                        onClick={() => setShowLeaveConfirm(true)}
                                                        className="text-sm font-medium text-orange-500 hover:text-orange-400 hover:underline"
                                                    >
                                                        Leave Vault
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isOwner && (
                                    <div className="bg-[#181818] border border-red-900/30 rounded-xl overflow-hidden">
                                        <div className="p-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                                    <Trash2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white">Delete Vault</h3>
                                                    <p className="text-sm text-gray-500">Permanently delete this vault and all data</p>
                                                </div>
                                            </div>

                                            {showDeleteConfirm ? (
                                                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                                    <p className="text-red-400 text-sm mb-3">Type <strong>{vault.name}</strong> to confirm:</p>
                                                    <input 
                                                        type="text" 
                                                        value={deleteConfirmText}
                                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                        className="w-full bg-[#121212] border border-red-500/30 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 mb-3"
                                                        placeholder={vault.name}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={handleDelete}
                                                            disabled={deleteConfirmText !== vault.name || deleting}
                                                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                                                            Delete Forever
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setShowDeleteConfirm(false);
                                                                setDeleteConfirmText('');
                                                            }}
                                                            className="bg-[#222] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#333] transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-4 flex justify-end">
                                                    <button 
                                                        onClick={() => setShowDeleteConfirm(true)}
                                                        className="text-sm font-medium text-red-500 hover:text-red-400 hover:underline"
                                                    >
                                                        Delete Vault
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop for mobile or dropdowns */}
            {selectedMember && (
                <div 
                    className="fixed inset-0 z-40 bg-black/20" 
                    onClick={() => setSelectedMember(null)}
                />
            )}
        </div>
    );
};

export default VaultSettings;
