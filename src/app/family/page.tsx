import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { Users } from 'lucide-react';
import { getFamilyDetails } from '@/app/actions/familyActions';
import { getFamilyChallenges } from '@/app/actions/familyChallengeActions';
import { FamilyDashboard } from '@/components/family/FamilyDashboard';

export default async function FamilyPage() {
  const session = await getServerSession(authOptions);
  const familyData = await getFamilyDetails();
  const challengesData = await getFamilyChallenges();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex items-center gap-4 py-8 border-b border-indigo-100 dark:border-indigo-900/30">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">Family Circle</h1>
          <p className="text-muted-foreground">Keep your family accountable and grow together in your Deen.</p>
        </div>
      </div>

      <FamilyDashboard 
        initialFamily={familyData}
        initialChallenges={challengesData}
        currentUserEmail={session?.user?.email}
      />
    </div>
  );
}

