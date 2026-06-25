'use client';

import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Mail, Loader2 } from 'lucide-react';
import { toggleUserRole } from '@/app/actions/adminActions';

export function AdminUsersTab({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    setLoadingUserId(userId);
    try {
      const res = await toggleUserRole(userId, newRole);
      if (res.success) {
        setUsers(users.map(u => (u._id === userId ? { ...u, role: newRole } : u)));
      } else {
        alert(res.error || 'Failed to update user role.');
      }
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">User Directory</h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-full border dark:border-slate-850">
          Total Users: {users.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-850">
        <table className="w-full border-collapse text-left text-xs bg-white dark:bg-slate-950/20">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-850">
              <th className="p-3.5">Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5 text-center">Onboarding</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5 text-center">Role</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
            {users.map((u: any) => {
              const isAdmin = u.role === 'admin';
              const signupDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A';

              return (
                <tr key={u._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                  {/* Name */}
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{u.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Joined {signupDate}</div>
                  </td>

                  {/* Email */}
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{u.email || 'No email (Guest)'}</span>
                    </div>
                  </td>

                  {/* Onboarding Completed */}
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.onboardingCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {u.onboardingCompleted ? 'Done' : 'Pending'}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    {u.location?.city ? `${u.location.city}, ${u.location.country}` : 'Not configured'}
                  </td>

                  {/* Role */}
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAdmin
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-450 border border-rose-200 dark:border-rose-900/30'
                          : 'bg-blue-100 dark:bg-blue-950/40 text-blue-850 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30'
                      }`}
                    >
                      {isAdmin ? <ShieldCheck className="w-3 h-3 shrink-0" /> : <UserCheck className="w-3 h-3 shrink-0" />}
                      <span>{u.role || 'user'}</span>
                    </span>
                  </td>

                  {/* Actions Toggle */}
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleRoleToggle(u._id, u.role)}
                      disabled={loadingUserId !== null}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all border ${
                        isAdmin
                          ? 'border-blue-200 dark:border-blue-900 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                          : 'border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {loadingUserId === u._id ? (
                        <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                      ) : isAdmin ? (
                        'Make User'
                      ) : (
                        'Make Admin'
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
