'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useRoom } from '@/hooks/useRoom';
import { 
  Home, Copy, Check, Users, Shield, LogOut, Plus, LogIn, 
  AlertCircle, Trash2, ShieldCheck, Key, Lock, Unlock, 
  Settings, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { getScoreTier, getScoreColor } from '@/lib/services/credit-score';

export default function RoomPage() {
  const { data: session } = useSession();
  const { 
    room, 
    loading, 
    error, 
    createRoom, 
    joinRoom, 
    leaveRoom, 
    removeMember, 
    transferOwnership, 
    updateRoomSettings, 
    deleteRoom, 
    regenerateInviteCode 
  } = useRoom();

  const [newRoomName, setNewRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Administrative form states
  const [editName, setEditName] = useState('');
  const [editMaxMembers, setEditMaxMembers] = useState(6);
  const [editIsLocked, setEditIsLocked] = useState(false);
  const [showTransferSelect, setShowTransferSelect] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // Initialize administrative edit values when room loads
  React.useEffect(() => {
    if (room) {
      setEditName(room.name);
      setEditMaxMembers(room.maxMembers);
      setEditIsLocked(room.isLocked || false);
    }
  }, [room]);

  const currentUserId = session?.user?.id;
  const currentMember = room?.members.find(m => m.userId === currentUserId);
  const isOwner = currentMember?.role === 'OWNER';
  const isAdmin = currentMember?.role === 'ADMIN';
  const canAdminister = isOwner || isAdmin;

  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setActionError(null);
    setActionSuccess(null);
    setSubmitting(true);
    try {
      await createRoom({ name: newRoomName });
      setActionSuccess('Room created successfully!');
      setNewRoomName('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setActionError(null);
    setActionSuccess(null);
    setSubmitting(true);
    try {
      await joinRoom({ code: inviteCode.toUpperCase() });
      setActionSuccess('Joined room successfully!');
      setInviteCode('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    if (!confirm('Are you sure you want to leave this room? All your balance records will remain in history.')) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await leaveRoom(room.id);
      setActionSuccess('Left room successfully.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to leave room');
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!room) return;
    if (!confirm(`Are you sure you want to remove ${name} from this room?`)) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await removeMember(room.id, userId);
      setActionSuccess(`${name} has been removed successfully.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !selectedNewOwner) return;
    if (!confirm('Are you sure you want to transfer ownership? This will demote you to a regular member.')) return;
    setActionError(null);
    setActionSuccess(null);
    setSubmitting(true);
    try {
      await transferOwnership(room.id, selectedNewOwner);
      setActionSuccess('Room ownership transferred successfully!');
      setShowTransferSelect(false);
      setSelectedNewOwner('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to transfer ownership');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    setActionError(null);
    setActionSuccess(null);
    setSubmitting(true);
    try {
      await updateRoomSettings(room.id, {
        name: editName,
        maxMembers: Number(editMaxMembers),
        isLocked: editIsLocked,
      });
      setActionSuccess('Room settings updated successfully!');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!room) return;
    if (!confirm('WARNING: Are you sure you want to delete this room? This will permanently delete all expenses, wallet balances, loans, and audit logs. This action CANNOT be undone!')) return;
    if (prompt('Type DELETE to confirm room deletion:') !== 'DELETE') {
      alert('Delete cancelled. Confirmation phrase did not match.');
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    try {
      await deleteRoom(room.id);
      setActionSuccess('Room deleted successfully.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete room');
    }
  };

  const handleRegenerateCode = async () => {
    if (!room) return;
    setActionError(null);
    setActionSuccess(null);
    setRegenerating(true);
    try {
      const data = await regenerateInviteCode(room.id);
      setActionSuccess(`New invite code generated: ${data.inviteCode}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to regenerate code');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded-xl" />
        <div className="animate-pulse bg-gray-200 h-48 rounded-2xl" />
        <div className="animate-pulse bg-gray-200 h-64 rounded-2xl" />
      </div>
    );
  }

  // --- RENDER ROOM BOARD (If user belongs to a room) ---
  if (room) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2">
              <Home className="w-8 h-8 text-[#2563EB]" /> Room Settings
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage roommates and room properties.</p>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Leave Room
          </button>
        </div>

        {actionError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Room Header Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50/40 rounded-full translate-x-8 -translate-y-8" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Active Room
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">{room.name}</h2>
              <p className="text-xs text-slate-400 mt-1">Created on {new Date(room.createdAt).toLocaleDateString('en-IN')}</p>
            </div>

            {/* Invite Code Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 w-full md:max-w-md">
              <div className="text-center sm:text-left">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Invite Code</p>
                <p className="text-lg font-mono font-bold text-slate-800 tracking-wider mt-0.5">{room.code}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:border-blue-500 rounded-lg text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                {canAdminister && (
                  <button
                    onClick={handleRegenerateCode}
                    disabled={regenerating}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:border-blue-500 rounded-lg text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Room Members List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-800">Room Members ({room.members.length}/{room.maxMembers})</h3>
            </div>
            {isOwner && room.members.length > 1 && (
              <button
                onClick={() => setShowTransferSelect(!showTransferSelect)}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Key className="w-3.5 h-3.5" />
                {showTransferSelect ? 'Cancel Transfer' : 'Transfer Ownership'}
              </button>
            )}
          </div>

          {/* Transfer Ownership Form */}
          {showTransferSelect && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-blue-50/30 border border-blue-100 rounded-2xl"
            >
              <form onSubmit={handleTransferOwnership} className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select New Owner</label>
                  <select
                    value={selectedNewOwner}
                    onChange={(e) => setSelectedNewOwner(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  >
                    <option value="">-- Select Roommate --</option>
                    {room.members
                      .filter(m => m.userId !== currentUserId)
                      .map(m => (
                        <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.email})</option>
                      ))
                    }
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition"
                >
                  {submitting ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </form>
            </motion.div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {room.members.map((member) => {
              const tier = getScoreTier(member.user.creditScore);
              const scoreColor = getScoreColor(tier);
              const isTargetOwner = member.role === 'OWNER';
              const isTargetAdmin = member.role === 'ADMIN';

              // Decide if current user can remove this member
              // Owner can remove anyone (except self). Admin can remove regular members.
              const canRemove = 
                member.userId !== currentUserId && 
                ((isOwner && !isTargetOwner) || (isAdmin && !isTargetOwner && !isTargetAdmin));

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-50 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-inner">
                      {member.user.name
                        ?.split(' ')
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'RM'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{member.user.name}</p>
                        {member.role === 'OWNER' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded-full">
                            Owner
                          </span>
                        )}
                        {member.role === 'ADMIN' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Member Score Indicator */}
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Credit Score</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: scoreColor }}>
                        {member.user.creditScore}{' '}
                        <span className="text-[10px] font-medium text-slate-400">({tier})</span>
                      </p>
                    </div>

                    {/* Admin Actions */}
                    {canRemove && (
                      <button
                        onClick={() => handleRemoveMember(member.userId, member.user.name || 'Roommate')}
                        title="Remove member"
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Administration Panel (Owner/Admin settings) */}
        {canAdminister && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Settings className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-800">Administrative Settings</h3>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Members</label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    required
                    value={editMaxMembers}
                    onChange={(e) => setEditMaxMembers(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Room Locking Option */}
              <div className="flex items-center justify-between p-3.5 border border-slate-50 rounded-xl bg-slate-50/30">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    {editIsLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5 text-green-600" />}
                    Lock Room Membership
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">When locked, roommates will not be able to join using invite codes.</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsLocked}
                  onChange={(e) => setEditIsLocked(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Room Settings'}
                </button>

                {isOwner && (
                  <button
                    type="button"
                    onClick={handleDeleteRoom}
                    className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-100 transition-all ml-auto"
                  >
                    Delete Room
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER ONBOARDING (If user does not belong to any room) ---
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 text-center">
          Get Started with BachelorsPay
        </h1>
        <p className="text-slate-500 text-sm text-center mt-2">
          Create a new room for your flat or join your roommates using an invite code.
        </p>
      </div>

      {actionError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        {/* Card 1: Create Room */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Create a New Room</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Start a new shared workspace. You will be set as the Owner of the room, generate invite codes, and initialize the shared wallet.
            </p>
          </div>

          <form onSubmit={handleCreateRoom} className="mt-8 space-y-3">
            <input
              type="text"
              required
              placeholder="e.g. Sunshine Apartment 4B"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="
                w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white
                text-sm text-slate-800 placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                transition-all duration-200
              "
            />
            <button
              type="submit"
              disabled={submitting}
              className="
                w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold
                hover:bg-[#1d4ed8] focus:outline-none transition-all duration-200 shadow-md
              "
            >
              {submitting ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        </motion.div>

        {/* Card 2: Join Room */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <LogIn className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Join Existing Room</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Have your roommate share their 6-character room invite code, and enter it below to join the flat and start splitting bills immediately.
            </p>
          </div>

          <form onSubmit={handleJoinRoom} className="mt-8 space-y-3">
            <input
              type="text"
              required
              maxLength={12}
              placeholder="e.g. SUN4B2"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="
                w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-center font-mono font-bold uppercase tracking-widest
                text-sm text-slate-800 placeholder-slate-400 placeholder:font-sans placeholder:tracking-normal
                focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                transition-all duration-200
              "
            />
            <button
              type="submit"
              disabled={submitting}
              className="
                w-full py-2.5 rounded-xl bg-[#22C55E] text-white text-sm font-semibold
                hover:bg-[#16a34a] focus:outline-none transition-all duration-200 shadow-md
              "
            >
              {submitting ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
