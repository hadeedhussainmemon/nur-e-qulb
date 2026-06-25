import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import { getPendingWazeefahs } from '@/app/actions/wazeefahActions';
import {
  getAllUsers,
  getAllFamilies,
  getCustomUserWazeefas,
  getTasbihPresets,
  getPlatformStats,
} from '@/app/actions/adminActions';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== 'admin') {
    redirect('/');
  }

  const pendingWazeefahsRes = await getPendingWazeefahs();
  const usersRes = await getAllUsers();
  const familiesRes = await getAllFamilies();
  const customWazeefasRes = await getCustomUserWazeefas();
  const tasbihPresets = await getTasbihPresets();
  const statsRes = await getPlatformStats();

  return (
    <AdminDashboardClient
      initialPendingWazeefahs={pendingWazeefahsRes.data || []}
      initialUsers={usersRes.data || []}
      initialFamilies={familiesRes.data || []}
      initialCustomWazeefas={customWazeefasRes.data || []}
      initialTasbihPresets={tasbihPresets}
      initialStats={statsRes.stats || null}
    />
  );
}
