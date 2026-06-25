'use client';

import React from 'react';
import { Users, Key, Shield, Network, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminFamiliesTab({ initialFamilies }: { initialFamilies: any[] }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Family Trees Overview</h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-full border dark:border-slate-850">
          Active Groups: {initialFamilies.length}
        </span>
      </div>

      {initialFamilies.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-slate-350 dark:border-slate-800">
          No family groups have been created yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {initialFamilies.map((f: any) => (
            <Card key={f._id} className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950/20">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-850">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Network className="w-5 h-5 text-indigo-500" />
                      <span>{f.name}</span>
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">Created at {new Date(f.createdAt).toLocaleDateString()}</CardDescription>
                  </div>

                  <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 px-2 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider shrink-0">
                    <Key className="w-3.5 h-3.5" />
                    <span>{f.joinCode}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Family Admin details */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border dark:border-slate-850 space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-500" /> Family Admin / Head
                  </span>
                  {f.adminId ? (
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{f.adminId.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{f.adminId.email}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-500 font-semibold italic">Admin account missing or deleted</div>
                  )}
                </div>

                {/* Family Members roster */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3 text-indigo-500" /> Group Members ({f.members?.length || 0})
                  </span>

                  {!f.members || f.members.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No members in this family group yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-900 max-h-40 overflow-y-auto pr-1">
                      {f.members.map((m: any) => (
                        <div key={m._id} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{m.name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" />
                              <span>{m.email}</span>
                            </div>
                          </div>

                          {m._id === f.adminId?._id && (
                            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-250/20">
                              Head
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
