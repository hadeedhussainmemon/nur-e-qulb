import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { ShieldAlert, Users, BookOpen, Sparkles } from 'lucide-react';
import { getPendingWazeefahs } from '@/app/actions/wazeefahActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminWazeefahControls } from '@/components/admin/AdminWazeefahControls';
import { AdminDirectWazeefahForm } from '@/components/admin/AdminDirectWazeefahForm';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/');
  }

  const pendingWazeefahs = await getPendingWazeefahs();

  // Load actual total user count from the database
  await connectToDatabase();
  const totalUsers = await User.countDocuments();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <div className="flex items-center gap-4 py-8 border-b border-rose-100 dark:border-rose-900/30">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-rose-600 dark:text-rose-400">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, moderate content, and approve community submissions.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Nav */}
        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm"><Users className="w-5 h-5" /> Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-850">
                <span className="text-sm font-medium">Pending Wazeefahs</span>
                <span className="font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded">{pendingWazeefahs.data.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-850">
                <span className="text-sm font-medium">Total Users</span>
                <span className="font-bold text-blue-600 bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 rounded">{totalUsers}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <AdminDirectWazeefahForm />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pending Approvals */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold border-b pb-4">Pending Approvals</h2>
          
          {pendingWazeefahs.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-slate-300 dark:border-slate-800">
              No pending submissions to review.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingWazeefahs.data.map((w: any) => (
                <Card key={w._id} className="border-amber-200 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-950/5">
                  <CardHeader className="pb-3 border-b border-amber-100 dark:border-amber-900/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-semibold px-2 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-md mb-2 inline-block">
                          {w.category}
                        </span>
                        <CardTitle className="text-lg">{w.title}</CardTitle>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        By {w.submittedBy?.name || 'Unknown'} on {new Date(w.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm bg-white dark:bg-slate-900/50 p-3 rounded border dark:border-slate-800">{w.description}</p>
                    
                    {/* Wazeefah Specifications */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg border dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Target Count</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{w.targetCount || 33} recitations</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Recommended Reminder</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{w.reminderTime || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider mb-0.5">Quran Reference</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          {w.quranRef ? (
                            <>
                              <BookOpen className="w-3.5 h-3.5 shrink-0" />
                              <span>{w.quranRef.surahName} ({w.quranRef.surahNumber}:{w.quranRef.fromAyah || 1}{w.quranRef.toAyah ? `-${w.quranRef.toAyah}` : ''})</span>
                            </>
                          ) : (
                            'None'
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Instructions</h4>
                      <ul className="text-sm list-decimal list-inside space-y-1 bg-white dark:bg-slate-900/30 p-3 rounded border dark:border-slate-850">
                        {w.instructions.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                      </ul>
                    </div>
                    
                    <AdminWazeefahControls wazeefahId={w._id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
