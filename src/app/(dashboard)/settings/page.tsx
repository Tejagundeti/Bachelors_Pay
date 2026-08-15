'use client';

import React, { useState } from 'react';
import { 
  Settings, Bell, Lock, Globe, CheckCircle2, AlertCircle, 
  Save, RefreshCw, Calendar, IndianRupee, Trash2, Plus, 
  ToggleLeft, ToggleRight, Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRoom } from '@/hooks/useRoom';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { room, loading: roomLoading } = useRoom();
  const { 
    recurringExpenses, 
    loading: recurringLoading, 
    error: recurringError, 
    createRecurringExpense, 
    toggleRecurringActive, 
    deleteRecurringExpense 
  } = useRecurringExpenses();

  const [activeTab, setActiveTab] = useState<'notifications' | 'security' | 'recurring'>('notifications');

  // Toggle states (simulated user local prefs)
  const [emailExpenseAdded, setEmailExpenseAdded] = useState(true);
  const [emailPaymentReceived, setEmailPaymentReceived] = useState(true);
  const [emailDueReminders, setEmailDueReminders] = useState(true);
  const [emailLoanRequests, setEmailLoanRequests] = useState(true);
  
  const [pushLowWallet, setPushLowWallet] = useState(true);
  const [pushReminders, setPushReminders] = useState(false);

  // Password change states (simulated)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [updatingPw, setUpdatingPw] = useState(false);

  // Preference save states
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  // New recurring bill form states
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillCategory, setNewBillCategory] = useState('RENT');
  const [newBillDay, setNewBillDay] = useState('1');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [addingBill, setAddingBill] = useState(false);

  const currentUserId = session?.user?.id;
  const currentMember = room?.members.find(m => m.userId === currentUserId);
  const canManageBills = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsSuccess(false);

    setTimeout(() => {
      setSavingPrefs(false);
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 2000);
    }, 600);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }

    setUpdatingPw(true);

    setTimeout(() => {
      setPwSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setUpdatingPw(false);
    }, 1000);
  };

  const handleAddRecurringBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!newBillTitle.trim() || !newBillAmount || !newBillDay) {
      setActionError('Please fill in all bill fields.');
      return;
    }

    const amount = Number(newBillAmount);
    if (isNaN(amount) || amount <= 0) {
      setActionError('Amount must be a positive number.');
      return;
    }

    const day = Number(newBillDay);
    if (isNaN(day) || day < 1 || day > 31) {
      setActionError('Day of month must be between 1 and 31.');
      return;
    }

    setAddingBill(true);
    try {
      await createRecurringExpense({
        title: newBillTitle,
        amount,
        category: newBillCategory,
        dayOfMonth: day,
      });

      setActionSuccess('Recurring bill added successfully!');
      setNewBillTitle('');
      setNewBillAmount('');
      setNewBillCategory('RENT');
      setNewBillDay('1');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add recurring bill.');
    } finally {
      setAddingBill(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await toggleRecurringActive(id, currentActive);
      setActionSuccess('Status updated successfully.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to toggle status.');
    }
  };

  const handleDeleteRecurring = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the recurring bill for "${title}"?`)) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await deleteRecurringExpense(id);
      setActionSuccess('Recurring bill deleted successfully.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete recurring bill.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2">
          <Settings className="w-8 h-8 text-[#2563EB]" /> Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure your personal preferences and room monthly bills.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column Settings Navigation */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm h-fit space-y-1">
          {[
            { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
            { id: 'security', label: 'Security & Password', icon: <Lock className="w-4 h-4" /> },
            { id: 'recurring', label: 'Recurring Bills', icon: <Calendar className="w-4 h-4" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as 'notifications' | 'security' | 'recurring')}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-xl text-left transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Columns: Main settings content */}
        <div className="md:col-span-2 space-y-6">
          {actionError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-sm mb-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm mb-4">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Notifications Card */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" /> Notification Channels
              </h3>

              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Alerts</h4>
                  
                  {[
                    { label: 'Notify me when roommate adds an expense', state: emailExpenseAdded, setter: setEmailExpenseAdded },
                    { label: 'Notify me when roommate registers a payment', state: emailPaymentReceived, setter: setEmailPaymentReceived },
                    { label: 'Send me due date reminder emails', state: emailDueReminders, setter: setEmailDueReminders },
                    { label: 'Send me emails when peer loan requests occur', state: emailLoanRequests, setter: setEmailLoanRequests }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-600 font-medium">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-slate-50 pt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Push alerts (In-App)</h4>
                  
                  {[
                    { label: 'Warn me if shared wallet balance falls low', state: pushLowWallet, setter: setPushLowWallet },
                    { label: 'Send me daily reminder alerts for pending debts', state: pushReminders, setter: setPushReminders }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-600 font-medium">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.setter(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-50 pt-4 flex items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={savingPrefs}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                  >
                    <Save className="w-4 h-4" /> {savingPrefs ? 'Saving...' : 'Save Preferences'}
                  </button>
                  
                  {prefsSuccess && (
                    <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Saved!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Security & Password Card */}
          {activeTab === 'security' && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" /> Change Password
              </h3>

              {pwError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 text-xs mb-4">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <span>{pwError}</span>
                </div>
              )}
              
              {pwSuccess && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 text-green-700 border border-green-100 text-xs mb-4">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-green-500" />
                  <span>{pwSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingPw}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  {updatingPw ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* Recurring Bills Tab */}
          {activeTab === 'recurring' && (
            <div className="space-y-6">
              {roomLoading ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm animate-pulse h-48" />
              ) : !room ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm text-center">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-slate-800">No Active Room</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                    You must join or create a room before configuring monthly recurring expenses like Rent, Electricity, or WiFi.
                  </p>
                </div>
              ) : (
                <>
                  {/* Create Recurring Bill Form (Admin Only) */}
                  {canManageBills ? (
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-500" /> Create Recurring Bill
                      </h3>

                      <form onSubmit={handleAddRecurringBill} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. WiFi Monthly Plan"
                            value={newBillTitle}
                            onChange={(e) => setNewBillTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Amount</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="number"
                              required
                              min={1}
                              placeholder="e.g. 999"
                              value={newBillAmount}
                              onChange={(e) => setNewBillAmount(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                          <select
                            value={newBillCategory}
                            onChange={(e) => setNewBillCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none"
                          >
                            <option value="RENT">Rent</option>
                            <option value="ELECTRICITY">Electricity</option>
                            <option value="WATER">Water</option>
                            <option value="INTERNET">WiFi / Internet</option>
                            <option value="GROCERIES">Groceries</option>
                            <option value="GAS">Gas</option>
                            <option value="CLEANING">Cleaning</option>
                            <option value="FOOD">Food</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="OTHER">Other Custom</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Day of Month</label>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            required
                            placeholder="e.g. 5"
                            value={newBillDay}
                            onChange={(e) => setNewBillDay(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="sm:col-span-2 pt-2">
                          <button
                            type="submit"
                            disabled={addingBill}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                          >
                            {addingBill ? 'Adding Bill...' : 'Save Recurring Bill'}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-slate-500">
                      <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-700">Room Admin Feature Only</p>
                        <p className="mt-0.5">Only room owners or admins can configure new recurring bills. Regular members can view existing configured bills below.</p>
                      </div>
                    </div>
                  )}

                  {/* Recurring Bills List */}
                  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" /> Room Recurring Bills
                    </h3>

                    {recurringLoading ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="bg-gray-100 h-10 rounded-xl" />
                        <div className="bg-gray-100 h-10 rounded-xl" />
                      </div>
                    ) : recurringExpenses.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No recurring bills configured yet.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {recurringExpenses.map((bill) => (
                          <div 
                            key={bill.id}
                            className={`flex items-center justify-between p-4 border rounded-2xl bg-slate-50/30 transition-all ${
                              bill.isActive ? 'border-slate-100' : 'border-slate-100 opacity-60'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-slate-800">{bill.title}</h4>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                  {bill.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 font-medium">
                                <span className="flex items-center gap-0.5">
                                  <IndianRupee className="w-3.5 h-3.5" /> {bill.amount.toLocaleString('en-IN')} / month
                                </span>
                                <span>Due day: {bill.dayOfMonth}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Toggle active switch (Admin Only) */}
                              {canManageBills ? (
                                <>
                                  <button
                                    onClick={() => handleToggleActive(bill.id, bill.isActive)}
                                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                                    title={bill.isActive ? 'Deactivate' : 'Activate'}
                                  >
                                    {bill.isActive ? (
                                      <ToggleRight className="w-6 h-6 text-green-500" />
                                    ) : (
                                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRecurring(bill.id, bill.title)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Delete Bill"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  bill.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {bill.isActive ? 'Active' : 'Inactive'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
