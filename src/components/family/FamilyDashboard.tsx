'use client';

import React, { useState } from 'react';
import { 
  Users, Copy, Plus, Activity, Star, Calendar, Target, 
  Trophy, LogOut, CheckCircle, Sparkles, AlertCircle, 
  BookOpen, Heart, Flame, ShieldAlert, Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  createFamilyGroup, 
  joinFamilyGroup, 
  leaveFamilyGroup 
} from '@/app/actions/familyActions';
import { 
  createFamilyChallenge, 
  contributeToChallenge 
} from '@/app/actions/familyChallengeActions';

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface FamilyGroupData {
  _id: string;
  name: string;
  joinCode: string;
  adminId: string;
  members: Member[];
}

interface ChallengeProgress {
  userId: {
    _id: string;
    name: string;
  };
  count: number;
}

interface ChallengeData {
  _id: string;
  title: string;
  description?: string;
  type: 'quran' | 'dhikr' | 'fasting' | 'prayers';
  target: number;
  progress: ChallengeProgress[];
  endDate: string;
  isCompleted: boolean;
  createdAt: string;
}

interface FamilyDashboardProps {
  initialFamily: FamilyGroupData | null;
  initialChallenges: ChallengeData[];
  currentUserEmail: string | null | undefined;
}

export function FamilyDashboard({ initialFamily, initialChallenges, currentUserEmail }: FamilyDashboardProps) {
  const [family, setFamily] = useState<FamilyGroupData | null>(initialFamily);
  const [challenges, setChallenges] = useState<ChallengeData[]>(initialChallenges);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Group Create/Join inputs
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Challenge Create inputs
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeType, setChallengeType] = useState<'quran' | 'dhikr' | 'fasting' | 'prayers'>('dhikr');
  const [challengeTarget, setChallengeTarget] = useState<number>(1000);
  const [challengeEndDate, setChallengeEndDate] = useState('');

  // Contribution inputs per challenge
  const [contribAmounts, setContribAmounts] = useState<Record<string, number>>({});

  const handleCopyCode = () => {
    if (family?.joinCode) {
      navigator.clipboard.writeText(family.joinCode);
      setSuccess('Join code copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await createFamilyGroup(newGroupName);
      if (res.success && res.group) {
        // Fetch full populated group details or reload
        window.location.reload();
      } else {
        setError(res.error || 'Failed to create group');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await joinFamilyGroup(joinCodeInput);
      if (res.success && res.group) {
        window.location.reload();
      } else {
        setError(res.error || 'Failed to join group');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this family group?')) return;

    setLoading(true);
    setError(null);
    try {
      const res = await leaveFamilyGroup();
      if (res.success) {
        window.location.reload();
      } else {
        setError('Failed to leave group');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeTitle.trim() || challengeTarget <= 0 || !challengeEndDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await createFamilyChallenge(
        challengeTitle,
        challengeDesc,
        challengeType,
        challengeTarget,
        challengeEndDate
      );
      if (res.success && res.challenge) {
        setSuccess('Challenge created successfully!');
        setShowCreateChallenge(false);
        // Reset inputs
        setChallengeTitle('');
        setChallengeDesc('');
        setChallengeTarget(1000);
        setChallengeEndDate('');
        
        // Reload page to get populated author data
        window.location.reload();
      } else {
        setError(res.error || 'Failed to create challenge');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async (challengeId: string) => {
    const amount = contribAmounts[challengeId] || 0;
    if (amount <= 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await contributeToChallenge(challengeId, amount);
      if (res.success) {
        setSuccess('Contribution logged successfully!');
        setContribAmounts(prev => ({ ...prev, [challengeId]: 0 }));
        setTimeout(() => setSuccess(null), 3000);
        // Reload to update state
        window.location.reload();
      } else {
        setError(res.error || 'Failed to submit contribution');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (challengeId: string, amount: number) => {
    setContribAmounts(prev => ({
      ...prev,
      [challengeId]: (prev[challengeId] || 0) + amount
    }));
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'quran':
        return <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'dhikr':
        return <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'fasting':
        return <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'prayers':
        return <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Target className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getChallengeBadgeColor = (type: string) => {
    switch (type) {
      case 'quran':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'dhikr':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
      case 'fasting':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
      case 'prayers':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const formatChallengeType = (type: string) => {
    switch (type) {
      case 'quran': return 'Quran Reading';
      case 'dhikr': return 'Dhikr / Tasbihat';
      case 'fasting': return 'Fasting Days';
      case 'prayers': return 'Prayers Completed';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Action Failed</h4>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Success</h4>
            <p className="text-xs opacity-90">{success}</p>
          </div>
        </div>
      )}

      {!family ? (
        <div className="text-center space-y-8 py-8">
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-2xl font-extrabold tracking-tight">You aren't in a Family Group yet</h2>
            <p className="text-muted-foreground text-sm">
              Spiritual growth is better together. Create a new family circle and invite members, or enter a join code to join an existing group.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Create Family Card */}
            <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all">
              <CardContent className="p-8 space-y-5">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Create Family Circle</h3>
                  <p className="text-xs text-muted-foreground mt-1">Start a new group and share accountability stats.</p>
                </div>
                <form onSubmit={handleCreateGroup} className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="e.g. The Hussain Family" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                    required
                    disabled={loading}
                  />
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Family'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Join Family Card */}
            <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all">
              <CardContent className="p-8 space-y-5">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                  <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Join Existing Circle</h3>
                  <p className="text-xs text-muted-foreground mt-1">Enter a 6-digit invitation code sent by your family admin.</p>
                </div>
                <form onSubmit={handleJoinGroup} className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="e.g. X7B9M2" 
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm text-center font-mono tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                    maxLength={6}
                    required
                    disabled={loading}
                  />
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium" disabled={loading}>
                    {loading ? 'Joining...' : 'Join Group'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Family Circle Details */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-50/50 dark:bg-indigo-950/10 p-5 rounded-2xl border border-indigo-100/40 dark:border-indigo-950/30 gap-4">
            <div>
              <h2 className="font-extrabold text-xl text-indigo-950 dark:text-indigo-200">{family.name}</h2>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{family.members.length} Active Member{family.members.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">INVITE CODE:</span>
                <span className="text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-lg">
                  {family.joinCode}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyCode} className="border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Family Members</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {family.members.map((member) => {
                const isAdmin = member._id === family.adminId;
                const isCurrentUser = member.email === currentUserEmail;
                return (
                  <Card key={member._id} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200/60 dark:border-slate-850 relative overflow-hidden">
                    {isAdmin && (
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg tracking-wider uppercase">
                        Admin
                      </div>
                    )}
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {isCurrentUser && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={handleLeaveGroup} 
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 shrink-0"
                          title="Leave Group"
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Family Challenges Section */}
          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xl flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Family Goals & Challenges</span>
              </h3>
              {!showCreateChallenge && (
                <Button 
                  onClick={() => setShowCreateChallenge(true)} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 rounded-lg shadow-md"
                >
                  <Plus className="w-4 h-4" /> New Challenge
                </Button>
              )}
            </div>

            {/* Create Challenge Form */}
            {showCreateChallenge && (
              <Card className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Create a Collective Goal</span>
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-rose-500"
                    onClick={() => setShowCreateChallenge(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <form onSubmit={handleCreateChallenge} className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Goal Title *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ramadan 10,000 Astaghfirullah Collective" 
                      value={challengeTitle}
                      onChange={(e) => setChallengeTitle(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Activity Type *</label>
                    <select 
                      value={challengeType}
                      onChange={(e: any) => setChallengeType(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="dhikr">Dhikr / Tasbihat (Count)</option>
                      <option value="quran">Quran Reading (Juzu/Ayahs)</option>
                      <option value="fasting">Voluntary Fasting Days (Fasts)</option>
                      <option value="prayers">Completed Sunnah/Tahajjud Prayers</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Target Count *</label>
                    <input 
                      type="number" 
                      min={1}
                      value={challengeTarget}
                      onChange={(e) => setChallengeTarget(parseInt(e.target.value) || 0)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Description (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Let's finish this before the end of the month!" 
                      value={challengeDesc}
                      onChange={(e) => setChallengeDesc(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Target End Date *</label>
                    <input 
                      type="date" 
                      value={challengeEndDate}
                      onChange={(e) => setChallengeEndDate(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                      required
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium" disabled={loading}>
                      {loading ? 'Creating...' : 'Launch Challenge'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Challenges Display Grid */}
            {challenges.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-muted-foreground text-sm">
                No active challenges found. Create one above to motivate your family group!
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {challenges.map((challenge) => {
                  const totalProgress = challenge.progress.reduce((sum, p) => sum + p.count, 0);
                  const progressPct = Math.min(100, Math.round((totalProgress / challenge.target) * 100));
                  const isExpired = new Date(challenge.endDate) < new Date();
                  
                  // Sort contributions desc
                  const leaderboard = [...challenge.progress].sort((a, b) => b.count - a.count);

                  return (
                    <Card key={challenge._id} className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all rounded-2xl flex flex-col justify-between overflow-hidden">
                      <div className="p-5 space-y-4">
                        {/* Header info */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getChallengeBadgeColor(challenge.type)}`}>
                              {getChallengeIcon(challenge.type)}
                              <span>{formatChallengeType(challenge.type)}</span>
                            </span>
                            <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200 mt-2">{challenge.title}</h4>
                            {challenge.description && (
                              <p className="text-xs text-muted-foreground mt-1">{challenge.description}</p>
                            )}
                          </div>
                          {challenge.isCompleted && (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded border border-emerald-500/30 shrink-0 animate-pulse">
                              COMPLETED
                            </span>
                          )}
                        </div>

                        {/* Progress bar and text */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600 dark:text-slate-400">Progress</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{totalProgress.toLocaleString()} / {challenge.target.toLocaleString()} ({progressPct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                challenge.isCompleted 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                              }`} 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Leaderboard panel */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>Contributions Leaderboard</span>
                          </p>
                          {leaderboard.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No logs recorded yet. Be the first to contribute!</p>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                              {leaderboard.map((item, idx) => {
                                const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
                                return (
                                  <div key={item.userId._id} className="flex justify-between items-center text-xs p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/30">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold w-4 text-center text-[10px] ${idx < 3 ? rankColors[idx] : 'text-slate-400'}`}>
                                        #{idx + 1}
                                      </span>
                                      <span className="font-medium truncate max-w-[120px]">{item.userId?.name || 'Unknown User'}</span>
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.count.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Log Action Bar */}
                      {!challenge.isCompleted && !isExpired && (
                        <div className="bg-slate-50 dark:bg-slate-900/35 border-t border-slate-100 dark:border-slate-800/80 px-5 py-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
                          <div className="flex gap-1.5 w-full sm:w-auto">
                            {challenge.type === 'dhikr' ? (
                              <>
                                <Button variant="outline" size="sm" className="text-xs font-semibold px-2 h-8" onClick={() => handleQuickAdd(challenge._id, 100)}>+100</Button>
                                <Button variant="outline" size="sm" className="text-xs font-semibold px-2 h-8" onClick={() => handleQuickAdd(challenge._id, 500)}>+500</Button>
                              </>
                            ) : (
                              <>
                                <Button variant="outline" size="sm" className="text-xs font-semibold px-2 h-8" onClick={() => handleQuickAdd(challenge._id, 1)}>+1</Button>
                                <Button variant="outline" size="sm" className="text-xs font-semibold px-2 h-8" onClick={() => handleQuickAdd(challenge._id, 5)}>+5</Button>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <input 
                              type="number" 
                              placeholder="Count"
                              min={1}
                              value={contribAmounts[challenge._id] || ''}
                              onChange={(e) => setContribAmounts(prev => ({ ...prev, [challenge._id]: parseInt(e.target.value) || 0 }))}
                              className="w-20 text-center h-8 text-xs rounded border border-slate-200 dark:border-slate-800 bg-background px-2"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handleContribute(challenge._id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-8 px-3.5"
                              disabled={loading}
                            >
                              Add Log
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {isExpired && !challenge.isCompleted && (
                        <div className="bg-rose-500/5 dark:bg-rose-950/5 border-t border-slate-100 dark:border-slate-850 px-5 py-2.5 text-center text-rose-500 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5">
                          <ShieldAlert className="w-4 h-4" />
                          <span>Challenge Expired on {new Date(challenge.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
