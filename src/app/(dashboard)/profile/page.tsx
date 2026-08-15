'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRoom } from '@/hooks/useRoom';
import { 
  User, Mail, Phone, Shield, Award, Home, 
  CheckCircle2, AlertCircle, Edit, Save, X 
} from 'lucide-react';
import { getScoreTier, getScoreColor } from '@/lib/services/credit-score';

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const { room } = useRoom();
  
  // Find current user's room details
  const currentUserMember = room?.members.find((m) => m.userId === session?.user?.id);
  const creditScore = currentUserMember?.user.creditScore ?? 700;
  const scoreTier = getScoreTier(creditScore);
  const scoreColor = getScoreColor(scoreTier);
  const userPhone = currentUserMember?.user.phone ?? '+919876543210';
  const userRole = currentUserMember?.role ?? 'MEMBER';

  // Form edit state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');
  const [phone, setPhone] = useState(userPhone);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    // Mock update: in production we would send a PATCH to /api/profile
    setTimeout(() => {
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
      setSaving(false);
      // Optional: trigger NextAuth session refresh if we had a backend update
    }, 800);
  };

  const userName = session?.user?.name || 'User';
  const userInitials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2">
          <User className="w-8 h-8 text-[#2563EB]" /> Profile
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information and house standing.</p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-green-50 text-green-700 border border-green-100 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Card: Avatar + Credit Standing */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          {/* Large Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/10">
            {userInitials}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800">{userName}</h2>
            <p className="text-xs text-slate-400 mt-1 capitalize">{userRole.toLowerCase()}</p>
          </div>

          {/* Credit Score Ring */}
          <div className="w-full border-t border-slate-50 pt-4 flex flex-col items-center">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Credit Rating</p>
            <div className="flex items-center gap-2 mt-2">
              <Award className="w-5 h-5" style={{ color: scoreColor }} />
              <span className="text-xl font-bold" style={{ color: scoreColor }}>
                {creditScore}
              </span>
            </div>
            <span className="text-[10px] font-bold mt-1 px-2.5 py-0.5 rounded-full border" style={{ borderColor: scoreColor, color: scoreColor }}>
              {scoreTier}
            </span>
          </div>

          {/* Room context */}
          {room && (
            <div className="w-full border-t border-slate-50 pt-4 text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Home className="w-4 h-4 text-slate-400" />
              <span>Flat: <strong className="text-slate-700">{room.name}</strong></span>
            </div>
          )}
        </div>

        {/* Right Columns: Profile Details Form */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-50">
            <h3 className="text-base font-bold text-slate-800">Account Details</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 shadow-sm transition-all"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-red-500 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-500 shadow-sm transition-all"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="
                    w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                    disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-100
                  "
                />
              </div>
            </div>

            {/* Email (Read Only always) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={session?.user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 text-sm focus:outline-none cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Email address cannot be changed once registered.</p>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="
                    w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                    disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-100
                  "
                />
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
