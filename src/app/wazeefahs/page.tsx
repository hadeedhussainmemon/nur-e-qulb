export const dynamic = 'force-dynamic';
import React from 'react';
import { Calendar } from 'lucide-react';
import { getApprovedWazeefahs } from '@/app/actions/wazeefahActions';
import { getUserWazeefahs } from '@/app/actions/userWazeefahActions';
import { WazeefahPageClient } from '@/components/wazeefah/WazeefahPageClient';

export default async function WazeefahsPage() {
  const wazeefahs = await getApprovedWazeefahs();
  const userWazeefahs = await getUserWazeefahs();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <div className="text-center space-y-4 py-8 border-b border-blue-100 dark:border-blue-900/30">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">Community Wazeefahs</h1>
        <p className="text-muted-foreground">Discover powerful authentic Wazeefahs shared by the community.</p>
      </div>

      <WazeefahPageClient initialWazeefahs={wazeefahs} initialUserWazeefahs={userWazeefahs} />
    </div>
  );
}

