'use client';

import React, { useState } from 'react';
import { ShieldAlert, Users, BookOpen, Sparkles, Bell, Network, BarChart3 } from 'lucide-react';
import { AdminStatsTab } from './AdminStatsTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminFamiliesTab } from './AdminFamiliesTab';
import { AdminCustomWazeefasTab } from './AdminCustomWazeefasTab';
import { AdminTasbihTab } from './AdminTasbihTab';
import { AdminNotificationsTab } from './AdminNotificationsTab';

export function AdminDashboardClient({
  initialPendingWazeefahs,
  initialApprovedWazeefahs,
  initialUsers,
  initialFamilies,
  initialCustomWazeefas,
  initialTasbihPresets,
  initialStats,
}: {
  initialPendingWazeefahs: any[];
  initialApprovedWazeefahs: any[];
  initialUsers: any[];
  initialFamilies: any[];
  initialCustomWazeefas: any[];
  initialTasbihPresets: any[];
  initialStats: any;
}) {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'families' | 'wazeefahs' | 'tasbih' | 'notifications'>('stats');

  // Lists state for responsive updates
  const [pendingWazeefahs, setPendingWazeefahs] = useState(initialPendingWazeefahs);
  const [approvedWazeefahs, setApprovedWazeefahs] = useState(initialApprovedWazeefahs);
  const [users, setUsers] = useState(initialUsers);
  const [families, setFamilies] = useState(initialFamilies);
  const [customWazeefas, setCustomWazeefas] = useState(initialCustomWazeefas);
  const [tasbihPresets, setTasbihPresets] = useState(initialTasbihPresets);
  const [stats, setStats] = useState(initialStats);

  const TABS = [
    { id: 'stats', label: 'Platform Stats', icon: BarChart3 },
    { id: 'users', label: 'Users Directory', icon: Users },
    { id: 'families', label: 'Family Trees', icon: Network },
    { id: 'wazeefahs', label: 'Wazeefas & Approvals', icon: BookOpen },
    { id: 'tasbih', label: 'Tasbih Customizer', icon: Sparkles },
    { id: 'notifications', label: 'Send Notifications', icon: Bell },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8 border-b border-rose-100 dark:border-rose-900/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/50 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Admin Console
            </h1>
            <p className="text-muted-foreground text-sm">Monitor platform metrics, manage database entries, and review submissions.</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation buttons */}
      <div className="flex overflow-x-auto scrollbar-none md:flex-wrap gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-850">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/15'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'stats' && <AdminStatsTab stats={stats} onUpdateStats={setStats} />}
        {activeTab === 'users' && <AdminUsersTab initialUsers={users} />}
        {activeTab === 'families' && <AdminFamiliesTab initialFamilies={families} />}
        {activeTab === 'wazeefahs' && (
          <AdminCustomWazeefasTab
            initialPending={pendingWazeefahs}
            initialApproved={approvedWazeefahs}
            initialCustom={customWazeefas}
            onUpdatePending={setPendingWazeefahs}
            onUpdateApproved={setApprovedWazeefahs}
            onUpdateCustom={setCustomWazeefas}
          />
        )}
        {activeTab === 'tasbih' && (
          <AdminTasbihTab initialPresets={tasbihPresets} onUpdatePresets={setTasbihPresets} />
        )}
        {activeTab === 'notifications' && <AdminNotificationsTab users={users} />}
      </div>
    </div>
  );
}
