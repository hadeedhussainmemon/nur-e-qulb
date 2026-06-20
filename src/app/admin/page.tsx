import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { ShieldAlert, Users, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { getPendingWazeefahs } from '@/app/actions/wazeefahActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminWazeefahControls } from '@/components/admin/AdminWazeefahControls';
import { AdminDirectWazeefahForm } from '@/components/admin/AdminDirectWazeefahForm';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/');
  }

  const pendingWazeefahs = await getPendingWazeefahs();

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="text-sm font-medium">Pending Wazeefahs</span>
                <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">{pendingWazeefahs.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="text-sm font-medium">Total Users</span>
                <span className="font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">--</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <AdminDirectWazeefahForm />
            </CardContent>
          </Card>
        </div>


        {/* Right Column: Pending Approvals */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold border-b pb-4">Pending Approvals</h2>
          
          {pendingWazeefahs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              No pending submissions to review.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingWazeefahs.map((w: any) => (
                <Card key={w._id} className="border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10">
                  <CardHeader className="pb-3 border-b border-amber-100 dark:border-amber-900/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-800 rounded-md mb-2 inline-block">
                          {w.category}
                        </span>
                        <CardTitle>{w.title}</CardTitle>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        By {w.submittedBy?.name} on {new Date(w.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm bg-white dark:bg-slate-900 p-3 rounded border">{w.description}</p>
                    <div>
                      <h4 className="font-medium text-xs text-muted-foreground uppercase mb-2">Instructions</h4>
                      <ul className="text-sm list-decimal list-inside space-y-1">
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
