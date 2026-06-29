'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Plus,
  ListChecks,
  Clock,
  Trash2,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Edit3,
} from 'lucide-react';
import { SubmitWazeefahForm } from './SubmitWazeefahForm';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { getWazeefahById } from '@/app/actions/wazeefahActions';
import {
  subscribeToWazeefah,
  createCustomWazeefah,
  logWazeefahProgress,
  deleteUserWazeefah
} from '@/app/actions/userWazeefahActions';

// All 114 Surahs
export const SURAHS = [
  { n: 1, name: 'Al-Fatihah', ayahs: 7 }, { n: 2, name: 'Al-Baqarah', ayahs: 286 },
  { n: 3, name: 'Ali \'Imran', ayahs: 200 }, { n: 4, name: 'An-Nisa', ayahs: 176 },
  { n: 5, name: 'Al-Ma\'idah', ayahs: 120 }, { n: 6, name: 'Al-An\'am', ayahs: 165 },
  { n: 7, name: 'Al-A\'raf', ayahs: 206 }, { n: 8, name: 'Al-Anfal', ayahs: 75 },
  { n: 9, name: 'At-Tawbah', ayahs: 129 }, { n: 10, name: 'Yunus', ayahs: 109 },
  { n: 11, name: 'Hud', ayahs: 123 }, { n: 12, name: 'Yusuf', ayahs: 111 },
  { n: 13, name: 'Ar-Ra\'d', ayahs: 43 }, { n: 14, name: 'Ibrahim', ayahs: 52 },
  { n: 15, name: 'Al-Hijr', ayahs: 99 }, { n: 16, name: 'An-Nahl', ayahs: 128 },
  { n: 17, name: 'Al-Isra', ayahs: 111 }, { n: 18, name: 'Al-Kahf', ayahs: 110 },
  { n: 19, name: 'Maryam', ayahs: 98 }, { n: 20, name: 'Ta-Ha', ayahs: 135 },
  { n: 21, name: 'Al-Anbiya', ayahs: 112 }, { n: 22, name: 'Al-Hajj', ayahs: 78 },
  { n: 23, name: 'Al-Mu\'minun', ayahs: 118 }, { n: 24, name: 'An-Nur', ayahs: 64 },
  { n: 25, name: 'Al-Furqan', ayahs: 77 }, { n: 26, name: 'Ash-Shu\'ara', ayahs: 227 },
  { n: 27, name: 'An-Naml', ayahs: 93 }, { n: 28, name: 'Al-Qasas', ayahs: 88 },
  { n: 29, name: 'Al-\'Ankabut', ayahs: 69 }, { n: 30, name: 'Ar-Rum', ayahs: 60 },
  { n: 31, name: 'Luqman', ayahs: 34 }, { n: 32, name: 'As-Sajdah', ayahs: 30 },
  { n: 33, name: 'Al-Ahzab', ayahs: 73 }, { n: 34, name: 'Saba', ayahs: 54 },
  { n: 35, name: 'Fatir', ayahs: 45 }, { n: 36, name: 'Ya-Sin', ayahs: 83 },
  { n: 37, name: 'As-Saffat', ayahs: 182 }, { n: 38, name: 'Sad', ayahs: 88 },
  { n: 39, name: 'Az-Zumar', ayahs: 75 }, { n: 40, name: 'Ghafir', ayahs: 85 },
  { n: 41, name: 'Fussilat', ayahs: 54 }, { n: 42, name: 'Ash-Shura', ayahs: 53 },
  { n: 43, name: 'Az-Zukhruf', ayahs: 89 }, { n: 44, name: 'Ad-Dukhan', ayahs: 59 },
  { n: 45, name: 'Al-Jathiyah', ayahs: 37 }, { n: 46, name: 'Al-Ahqaf', ayahs: 35 },
  { n: 47, name: 'Muhammad', ayahs: 38 }, { n: 48, name: 'Al-Fath', ayahs: 29 },
  { n: 49, name: 'Al-Hujurat', ayahs: 18 }, { n: 50, name: 'Qaf', ayahs: 45 },
  { n: 51, name: 'Adh-Dhariyat', ayahs: 60 }, { n: 52, name: 'At-Tur', ayahs: 49 },
  { n: 53, name: 'An-Najm', ayahs: 62 }, { n: 54, name: 'Al-Qamar', ayahs: 55 },
  { n: 55, name: 'Ar-Rahman', ayahs: 78 }, { n: 56, name: 'Al-Waqi\'ah', ayahs: 96 },
  { n: 57, name: 'Al-Hadid', ayahs: 29 }, { n: 58, name: 'Al-Mujadila', ayahs: 22 },
  { n: 59, name: 'Al-Hashr', ayahs: 24 }, { n: 60, name: 'Al-Mumtahanah', ayahs: 13 },
  { n: 61, name: 'As-Saf', ayahs: 14 }, { n: 62, name: 'Al-Jumu\'ah', ayahs: 11 },
  { n: 63, name: 'Al-Munafiqun', ayahs: 11 }, { n: 64, name: 'At-Taghabun', ayahs: 18 },
  { n: 65, name: 'At-Talaq', ayahs: 12 }, { n: 66, name: 'At-Tahrim', ayahs: 12 },
  { n: 67, name: 'Al-Mulk', ayahs: 30 }, { n: 68, name: 'Al-Qalam', ayahs: 52 },
  { n: 69, name: 'Al-Haqqah', ayahs: 52 }, { n: 70, name: 'Al-Ma\'arij', ayahs: 44 },
  { n: 71, name: 'Nuh', ayahs: 28 }, { n: 72, name: 'Al-Jinn', ayahs: 28 },
  { n: 73, name: 'Al-Muzzammil', ayahs: 20 }, { n: 74, name: 'Al-Muddaththir', ayahs: 56 },
  { n: 75, name: 'Al-Qiyamah', ayahs: 40 }, { n: 76, name: 'Al-Insan', ayahs: 31 },
  { n: 77, name: 'Al-Mursalat', ayahs: 50 }, { n: 78, name: 'An-Naba', ayahs: 40 },
  { n: 79, name: 'An-Nazi\'at', ayahs: 46 }, { n: 80, name: 'Abasa', ayahs: 42 },
  { n: 81, name: 'At-Takwir', ayahs: 29 }, { n: 82, name: 'Al-Infitar', ayahs: 19 },
  { n: 83, name: 'Al-Mutaffifin', ayahs: 36 }, { n: 84, name: 'Al-Inshiqaq', ayahs: 25 },
  { n: 85, name: 'Al-Buruj', ayahs: 22 }, { n: 86, name: 'At-Tariq', ayahs: 17 },
  { n: 87, name: 'Al-A\'la', ayahs: 19 }, { n: 88, name: 'Al-Ghashiyah', ayahs: 26 },
  { n: 89, name: 'Al-Fajr', ayahs: 30 }, { n: 90, name: 'Al-Balad', ayahs: 20 },
  { n: 91, name: 'Ash-Shams', ayahs: 15 }, { n: 92, name: 'Al-Layl', ayahs: 21 },
  { n: 93, name: 'Ad-Duha', ayahs: 11 }, { n: 94, name: 'Ash-Sharh', ayahs: 8 },
  { n: 95, name: 'At-Tin', ayahs: 8 }, { n: 96, name: 'Al-\'Alaq', ayahs: 19 },
  { n: 97, name: 'Al-Qadr', ayahs: 5 }, { n: 98, name: 'Al-Bayyinah', ayahs: 8 },
  { n: 99, name: 'Az-Zalzalah', ayahs: 8 }, { n: 100, name: 'Al-\'Adiyat', ayahs: 11 },
  { n: 101, name: 'Al-Qari\'ah', ayahs: 11 }, { n: 102, name: 'At-Takathur', ayahs: 8 },
  { n: 103, name: 'Al-\'Asr', ayahs: 3 }, { n: 104, name: 'Al-Humazah', ayahs: 9 },
  { n: 105, name: 'Al-Fil', ayahs: 5 }, { n: 106, name: 'Quraysh', ayahs: 4 },
  { n: 107, name: 'Al-Ma\'un', ayahs: 7 }, { n: 108, name: 'Al-Kawthar', ayahs: 3 },
  { n: 109, name: 'Al-Kafirun', ayahs: 6 }, { n: 110, name: 'An-Nasr', ayahs: 3 },
  { n: 111, name: 'Al-Masad', ayahs: 5 }, { n: 112, name: 'Al-Ikhlas', ayahs: 4 },
  { n: 113, name: 'Al-Falaq', ayahs: 5 }, { n: 114, name: 'An-Nas', ayahs: 6 },
];

export function WazeefahPageClient({
  initialWazeefahs,
  initialUserWazeefahs
}: {
  initialWazeefahs: any[];
  initialUserWazeefahs: any[];
}) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'explore'>('schedule');
  const [wazeefahs, setWazeefahs] = useState(initialWazeefahs);
  const [userWazeefahs, setUserWazeefahs] = useState(initialUserWazeefahs);

  // Modals/Forms State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [editingUserWazeefah, setEditingUserWazeefah] = useState<any>(null);

  // Subscription Details
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [subTargetCount, setSubTargetCount] = useState<number>(33);
  const [subReminderTime, setSubReminderTime] = useState<string>('Fajr');

  // Custom Wazeefah Details
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customInstructionsText, setCustomInstructionsText] = useState('');
  const [customTarget, setCustomTarget] = useState<number>(33);
  const [customReminder, setCustomReminder] = useState('Fajr');
  const [customReference, setCustomReference] = useState('');
  const [customSelectedDays, setCustomSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const toggleCustomDay = (day: number) => {
    setCustomSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const [subSelectedDays, setSubSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const toggleSubDay = (day: number) => {
    setSubSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  // User Wazeefah Edit States
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editInstructionsText, setEditInstructionsText] = useState('');
  const [editTarget, setEditTarget] = useState<number>(33);
  const [editReminder, setEditReminder] = useState('Fajr');
  const [editReference, setEditReference] = useState('');
  const [editSelectedDays, setEditSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [editShowQuranRef, setEditShowQuranRef] = useState(false);
  const [editSurahSearch, setEditSurahSearch] = useState('');
  const [editSelectedSurah, setEditSelectedSurah] = useState<typeof SURAHS[0] | null>(null);
  const [editFromAyah, setEditFromAyah] = useState<string>('');
  const [editToAyah, setEditToAyah] = useState<string>('');

  const toggleEditDay = (day: number) => {
    setEditSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  // Search parameters for detail modal
  const searchParams = useSearchParams();
  const router = useRouter();
  const [detailWazeefah, setDetailWazeefah] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const detailWazeefahId = searchParams.get('id') || searchParams.get('wazeefahId');

  React.useEffect(() => {
    if (detailWazeefahId) {
      setDetailLoading(true);
      getWazeefahById(detailWazeefahId).then(res => {
        if (res.success && res.data) {
          setDetailWazeefah(res.data);
        } else {
          console.error('Failed to load wazeefah details:', res.error);
        }
        setDetailLoading(false);
      });
    } else {
      setDetailWazeefah(null);
    }
  }, [detailWazeefahId]);

  // Quran Ref state
  const [showQuranRef, setShowQuranRef] = useState(false);
  const [surahSearch, setSurahSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<typeof SURAHS[0] | null>(null);
  const [fromAyah, setFromAyah] = useState<string>('');
  const [toAyah, setToAyah] = useState<string>('');

  const filteredSurahs = useMemo(() =>
    SURAHS.filter(s =>
      s.name.toLowerCase().includes(surahSearch.toLowerCase()) ||
      String(s.n).includes(surahSearch)
    ).slice(0, 20),
  [surahSearch]);

  const filteredEditSurahs = useMemo(() =>
    SURAHS.filter(s =>
      s.name.toLowerCase().includes(editSurahSearch.toLowerCase()) ||
      String(s.n).includes(editSurahSearch)
    ).slice(0, 20),
  [editSurahSearch]);

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const localTodayDateString = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local time

  const handleCommunitySubmitSuccess = () => {
    setIsSubmitOpen(false);
    alert('Wazeefah submitted successfully! It will appear under the community tab once approved by an admin.');
  };

  const handleOpenSubscribe = (wazeefah: any) => {
    setSelectedTemplate(wazeefah);
    setSubTargetCount(wazeefah.targetCount || 33);
    setSubReminderTime(wazeefah.reminderTime || 'Fajr');
    setSubSelectedDays(wazeefah.reminderDays || [0, 1, 2, 3, 4, 5, 6]);
    setIsSubscribeOpen(true);
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setLoadingActionId('subscribe');
    try {
      const res = await subscribeToWazeefah(selectedTemplate._id, subTargetCount, subReminderTime, subSelectedDays);
      if (res.success) {
        setUserWazeefahs([res.userWazeefah, ...userWazeefahs]);
        setIsSubscribeOpen(false);
        setActiveTab('schedule');
      } else {
        alert(res.error || 'Failed to add Wazeefah.');
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle) return;

    setLoadingActionId('custom');
    const instructions = customInstructionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const quranRef = selectedSurah
      ? {
          surahNumber: selectedSurah.n,
          surahName: selectedSurah.name,
          fromAyah: fromAyah ? parseInt(fromAyah) : undefined,
          toAyah: toAyah ? parseInt(toAyah) : undefined,
        }
      : null;

    try {
      const res = await createCustomWazeefah(customTitle, customDesc, instructions, customTarget, customReminder, quranRef, customReference || null, customSelectedDays);
      if (res.success) {
        setUserWazeefahs([res.userWazeefah, ...userWazeefahs]);
        setIsCustomOpen(false);
        // Reset form
        setCustomTitle('');
        setCustomDesc('');
        setCustomInstructionsText('');
        setCustomTarget(33);
        setCustomReminder('Fajr');
        setCustomReference('');
        setCustomSelectedDays([0, 1, 2, 3, 4, 5, 6]);
        setShowQuranRef(false);
        setSurahSearch('');
        setSelectedSurah(null);
        setFromAyah('');
        setToAyah('');
        setActiveTab('schedule');
      } else {
        alert(res.error || 'Failed to create wazeefah.');
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleIncrement = async (userWazeefah: any, amount: number) => {
    const actionId = `inc-${userWazeefah._id}`;
    setLoadingActionId(actionId);
    try {
      const todayCompletion = userWazeefah.completions.find((c: any) => c.date === localTodayDateString);
      const currentCount = todayCompletion ? todayCompletion.count : 0;
      const newCount = currentCount + amount;

      const res = await logWazeefahProgress(userWazeefah._id, newCount, localTodayDateString);
      if (res.success) {
        setUserWazeefahs(userWazeefahs.map((w) => (w._id === userWazeefah._id ? res.userWazeefah : w)));
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleResetCount = async (userWazeefah: any) => {
    const actionId = `reset-${userWazeefah._id}`;
    setLoadingActionId(actionId);
    try {
      const res = await logWazeefahProgress(userWazeefah._id, 0, localTodayDateString);
      if (res.success) {
        setUserWazeefahs(userWazeefahs.map((w) => (w._id === userWazeefah._id ? res.userWazeefah : w)));
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCompleteDirectly = async (userWazeefah: any) => {
    const actionId = `complete-${userWazeefah._id}`;
    setLoadingActionId(actionId);
    try {
      const res = await logWazeefahProgress(userWazeefah._id, userWazeefah.targetCount, localTodayDateString);
      if (res.success) {
        setUserWazeefahs(userWazeefahs.map((w) => (w._id === userWazeefah._id ? res.userWazeefah : w)));
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDeleteSchedule = async (userWazeefahId: string) => {
    if (!window.confirm('Are you sure you want to remove this Wazeefah from your schedule?')) return;

    const actionId = `delete-${userWazeefahId}`;
    setLoadingActionId(actionId);
    try {
      const res = await deleteUserWazeefah(userWazeefahId);
      if (res.success) {
        setUserWazeefahs(userWazeefahs.filter((w) => w._id !== userWazeefahId));
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleEditUserWazeefahClick = (uw: any) => {
    setEditingUserWazeefah(uw);
    setEditTitle(uw.title);
    setEditDesc(uw.description || '');
    setEditInstructionsText(uw.instructions ? uw.instructions.join('\n') : '');
    setEditTarget(uw.targetCount || 33);
    setEditReminder(uw.reminderTime || 'Fajr');
    setEditReference(uw.reference || '');
    setEditSelectedDays(uw.reminderDays || [0, 1, 2, 3, 4, 5, 6]);

    if (uw.quranRef) {
      const surah = SURAHS.find(s => s.n === uw.quranRef.surahNumber);
      setEditSelectedSurah(surah || null);
      setEditSurahSearch(surah ? surah.name : '');
      setEditFromAyah(uw.quranRef.fromAyah ? String(uw.quranRef.fromAyah) : '');
      setEditToAyah(uw.quranRef.toAyah ? String(uw.quranRef.toAyah) : '');
      setEditShowQuranRef(true);
    } else {
      setEditSelectedSurah(null);
      setEditSurahSearch('');
      setEditFromAyah('');
      setEditToAyah('');
      setEditShowQuranRef(false);
    }
  };

  const handleUserWazeefahEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserWazeefah) return;

    setLoadingActionId(`edit-${editingUserWazeefah._id}`);

    const instructions = editInstructionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const quranRef = editSelectedSurah
      ? {
          surahNumber: editSelectedSurah.n,
          surahName: editSelectedSurah.name,
          fromAyah: editFromAyah ? parseInt(editFromAyah) : undefined,
          toAyah: editToAyah ? parseInt(editToAyah) : undefined,
        }
      : null;

    try {
      const { updateUserWazeefah } = await import('@/app/actions/userWazeefahActions');
      const res = await updateUserWazeefah(editingUserWazeefah._id, {
        title: editTitle,
        description: editDesc || undefined,
        instructions,
        targetCount: editTarget,
        reminderTime: editReminder,
        reference: editReference || undefined,
        reminderDays: editSelectedDays,
        quranRef,
      });

      if (res.success) {
        setUserWazeefahs(userWazeefahs.map((w) => (w._id === editingUserWazeefah._id ? res.userWazeefah : w)));
        setEditingUserWazeefah(null);
      } else {
        alert(res.error || 'Failed to update wazeefah.');
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs Controller */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'schedule'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          My Schedule ({userWazeefahs.length})
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'explore'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          Explore Community ({wazeefahs.length})
        </button>
      </div>

      {/* Top Banner Action Bar */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          {activeTab === 'schedule'
            ? 'Track your daily personal adhkar and wazeefahs.'
            : 'All community wazeefahs are reviewed for authenticity.'}
        </p>
        <div className="flex gap-2">
          {activeTab === 'schedule' ? (
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsCustomOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Custom
            </Button>
          ) : (
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsSubmitOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Submit Wazeefah
            </Button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'schedule' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userWazeefahs.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl space-y-4">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No Wazeefahs Scheduled</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Add custom Wazeefahs or browse community presets to build your daily spiritual schedule.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('explore')}>
                  Browse Presets
                </Button>
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsCustomOpen(true)}>
                  Create Custom
                </Button>
              </div>
            </div>
          ) : (
            userWazeefahs.map((uw: any) => {
              const todayCompletion = uw.completions.find((c: any) => c.date === localTodayDateString);
              const count = todayCompletion ? todayCompletion.count : 0;
              const isCompleted = count >= uw.targetCount;
              const pct = Math.min(100, Math.round((count / uw.targetCount) * 100));

              return (
                <Card key={uw._id} className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden">
                  {isCompleted && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rotate-45 translate-x-10 -translate-y-10 flex items-end justify-center pb-2 select-none pointer-events-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Done</span>
                    </div>
                  )}

                  <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600 dark:text-blue-400">
                        {uw.isCustom ? 'Custom' : 'Preset'}
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-semibold">{uw.reminderTime || 'Fajr'}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-snug line-clamp-1">{uw.title}</CardTitle>
                    {uw.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{uw.description}</p>}
                  </CardHeader>

                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-5">
                    {/* Progress details */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-end text-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Daily Progress</span>
                        <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                          {count} <span className="text-muted-foreground font-normal text-xs">/ {uw.targetCount}</span>
                        </span>
                      </div>
                      <Progress value={pct} className={`h-2 [&>div]:transition-all ${isCompleted ? '[&>div]:bg-emerald-500' : '[&>div]:bg-blue-600'}`} />
                    </div>

                    {/* Instructions List (small preview) */}
                  {uw.instructions && uw.instructions.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5 text-blue-500" /> Method
                      </p>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {uw.instructions.slice(0, 2).map((inst: string, idx: number) => (
                          <li key={idx} className="flex gap-1.5 items-start">
                            <span className="font-semibold text-blue-500 select-none">{idx + 1}.</span>
                            <span className="line-clamp-1">{inst}</span>
                          </li>
                        ))}
                        {uw.instructions.length > 2 && (
                          <li className="text-[10px] text-muted-foreground italic pl-3">+ {uw.instructions.length - 2} more steps</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Reference Display */}
                  {uw.reference && (
                    <div className="text-[10px] text-muted-foreground flex items-start gap-1 p-2 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-800 rounded-lg">
                      <span className="font-bold text-slate-400 shrink-0">Source:</span>
                      <span className="line-clamp-1 italic">{uw.reference}</span>
                    </div>
                  )}

                  {/* Quran Ref Badge */}
                  {uw.quranRef?.surahName && (
                    <Link
                      href={`/quran?surah=${uw.quranRef.surahNumber}${uw.quranRef.fromAyah ? `&ayah=${uw.quranRef.fromAyah}` : ''}`}
                      className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg hover:bg-emerald-500/10 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-400 truncate">
                          {uw.quranRef.surahNumber}. {uw.quranRef.surahName}
                          {uw.quranRef.fromAyah && (
                            <span className="font-normal text-emerald-400/70">
                              {' '}:{uw.quranRef.fromAyah}{uw.quranRef.toAyah && uw.quranRef.toAyah !== uw.quranRef.fromAyah ? `–${uw.quranRef.toAyah}` : ''}
                            </span>
                          )}
                        </p>
                        <p className="text-[9px] text-muted-foreground">Tap to open in Quran</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-emerald-400/50 group-hover:text-emerald-400 transition-colors shrink-0" />
                    </Link>
                  )}

                    {/* Progress Control Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 border-slate-100 dark:border-slate-850">
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-semibold"
                          disabled={loadingActionId !== null}
                          onClick={() => handleIncrement(uw, 1)}
                        >
                          +1
                        </Button>
                        {uw.targetCount >= 10 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold"
                            disabled={loadingActionId !== null}
                            onClick={() => handleIncrement(uw, 10)}
                          >
                            +10
                          </Button>
                        )}
                        {count > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-muted-foreground hover:text-slate-800"
                            disabled={loadingActionId !== null}
                            onClick={() => handleResetCount(uw)}
                          >
                            Reset
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!isCompleted ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                            disabled={loadingActionId !== null}
                            onClick={() => handleCompleteDirectly(uw)}
                          >
                            Complete
                          </Button>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-650 rounded-full"
                          disabled={loadingActionId !== null}
                          onClick={() => handleEditUserWazeefahClick(uw)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 rounded-full"
                          disabled={loadingActionId !== null}
                          onClick={() => handleDeleteSchedule(uw._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wazeefahs.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              No approved community presets yet. Be the first to submit!
            </div>
          ) : (
            wazeefahs.map((w: any) => (
              <Card key={w._id} className="flex flex-col justify-between border-blue-100 dark:border-blue-900">
                <CardHeader className="bg-blue-50/50 dark:bg-blue-950/10 border-b border-blue-100 dark:border-blue-900/50 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md">
                      {w.category}
                    </span>
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/40">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-xs font-bold">{w.authenticityScore}% Authentic</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl leading-snug">{w.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{w.description}</p>
                </CardHeader>
                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <ListChecks className="w-4 h-4 text-blue-500" /> Instructions
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                        {w.instructions.map((inst: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-5 h-5 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {i + 1}
                            </span>
                            <span className="pt-0.5 text-xs sm:text-sm">{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {w.reference && (
                    <div className="text-[10px] text-muted-foreground mt-3 flex items-start gap-1 p-2 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-800 rounded-lg">
                      <span className="font-bold text-slate-400 shrink-0">Source:</span>
                      <span className="line-clamp-2 italic">{w.reference}</span>
                    </div>
                  )}

                  {w.quranRef?.surahName && (
                    <Link
                      href={`/quran?surah=${w.quranRef.surahNumber}${w.quranRef.fromAyah ? `&ayah=${w.quranRef.fromAyah}` : ''}`}
                      className="mt-3 flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 p-2 rounded-lg hover:bg-emerald-500/10 transition-colors group"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-500 truncate">
                          {w.quranRef.surahNumber}. {w.quranRef.surahName}
                          {w.quranRef.fromAyah && ` :${w.quranRef.fromAyah}`}
                        </p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-emerald-500/50 group-hover:text-emerald-500 transition-colors shrink-0" />
                    </Link>
                  )}

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Added: {new Date(w.createdAt).toLocaleDateString()}</span>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenSubscribe(w)}>
                      Add to Schedule <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Dialog for Custom Submission Form */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submit to Community</DialogTitle>
          </DialogHeader>
          <SubmitWazeefahForm onSuccess={handleCommunitySubmitSuccess} />
        </DialogContent>
      </Dialog>

      {/* Dialog to Subscribe to Community Presets */}
      <Dialog open={isSubscribeOpen} onOpenChange={setIsSubscribeOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" /> Add to Daily Routine
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubscribeSubmit} className="space-y-4 pt-2">
            {selectedTemplate && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{selectedTemplate.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedTemplate.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Daily Target Count</label>
              <Input
                type="number"
                min={1}
                required
                value={subTargetCount}
                onChange={(e) => setSubTargetCount(parseInt(e.target.value, 10))}
                placeholder="e.g. 33 or 100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Reminder / Schedule</label>
              <select
                value={subReminderTime}
                onChange={(e) => setSubReminderTime(e.target.value)}
                className="w-full h-10 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Fajr">After Fajr</option>
                <option value="Dhuhr">After Dhuhr</option>
                <option value="Asr">After Asr</option>
                <option value="Maghrib">After Maghrib</option>
                <option value="Isha">After Isha</option>
                <option value="Morning">Morning Adhkar</option>
                <option value="Evening">Evening Adhkar</option>
                <option value="Before Sleep">Before Sleep</option>
              </select>
            </div>

            {/* Weekday Selection for Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Reminder Days</label>
              <div className="flex gap-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => {
                  const isSelected = subSelectedDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleSubDay(idx)}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-background border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {dayName}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSubscribeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={loadingActionId !== null}>
                {loadingActionId === 'subscribe' ? 'Scheduling...' : 'Add to Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Custom Wazeefah Routine Setup */}
      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b dark:border-slate-800 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" /> Setup Custom Adhkar
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCustomSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Wazeefah / Adhkar Title</label>
                <Input
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Istighfar 100x"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Description (Optional)</label>
                <Textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="What is the virtue of this adhkar or details on recitation..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355 flex items-center justify-between">
                  <span>Method / Instructions</span>
                  <span className="text-[10px] text-muted-foreground font-normal">One step per line</span>
                </label>
                <Textarea
                  value={customInstructionsText}
                  onChange={(e) => setCustomInstructionsText(e.target.value)}
                  placeholder={`Step 1: Recite Astaghfirullah&#10;Step 2: Contemplate forgiveness...`}
                  rows={3}
                />
              </div>

              {/* Quran Reference Section */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setShowQuranRef(v => !v); if (showQuranRef) { setSelectedSurah(null); setSurahSearch(''); setFromAyah(''); setToAyah(''); } }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    {selectedSurah ? `Surah ${selectedSurah.n}. ${selectedSurah.name}${fromAyah ? ` :${fromAyah}` : ''}${toAyah && toAyah !== fromAyah ? `–${toAyah}` : ''}` : 'Add Surah / Ayat (optional)'}
                  </span>
                  {showQuranRef ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showQuranRef && (
                  <div className="border border-slate-700/50 bg-slate-800/40 rounded-lg p-3 space-y-3">
                    {/* Surah search */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Surah</label>
                      <Input
                        value={surahSearch}
                        onChange={e => { setSurahSearch(e.target.value); setSelectedSurah(null); }}
                        placeholder="e.g. Al-Kahf or 18"
                        className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-8 text-xs"
                      />
                      {surahSearch && !selectedSurah && (
                        <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 divide-y divide-slate-800">
                          {filteredSurahs.length === 0 ? (
                            <p className="text-xs text-slate-500 p-2 text-center">No surah found</p>
                          ) : filteredSurahs.map(s => (
                            <button
                              key={s.n}
                              type="button"
                              onClick={() => { setSelectedSurah(s); setSurahSearch(s.name); setFromAyah(''); setToAyah(''); }}
                              className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-800 text-slate-200 cursor-pointer text-left transition-colors"
                            >
                              <span><span className="text-slate-500 mr-1.5">{s.n}.</span>{s.name}</span>
                              <span className="text-slate-500">{s.ayahs} ayahs</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedSurah && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-xs text-emerald-400 font-semibold">{selectedSurah.n}. {selectedSurah.name}</span>
                          <span className="text-[9px] text-slate-500 ml-auto">{selectedSurah.ayahs} ayahs</span>
                        </div>
                      )}
                    </div>

                    {/* Ayat range */}
                    {selectedSurah && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From Ayah</label>
                          <Input
                            type="number"
                            min={1}
                            max={selectedSurah.ayahs}
                            value={fromAyah}
                            onChange={e => setFromAyah(e.target.value)}
                            placeholder={`1–${selectedSurah.ayahs}`}
                            className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To Ayah</label>
                          <Input
                            type="number"
                            min={fromAyah ? parseInt(fromAyah) : 1}
                            max={selectedSurah.ayahs}
                            value={toAyah}
                            onChange={e => setToAyah(e.target.value)}
                            placeholder={`up to ${selectedSurah.ayahs}`}
                            className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Reference / Source (Optional)</label>
                <Input
                  value={customReference}
                  onChange={(e) => setCustomReference(e.target.value)}
                  placeholder="e.g. Sahih al-Bukhari, Hadith 6405 or Al-Kahf 18:10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Target Count</label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={customTarget}
                    onChange={(e) => setCustomTarget(parseInt(e.target.value, 10))}
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Reminder Schedule</label>
                  <select
                    value={customReminder}
                    onChange={(e) => setCustomReminder(e.target.value)}
                    className="w-full h-10 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Fajr">After Fajr</option>
                    <option value="Dhuhr">After Dhuhr</option>
                    <option value="Asr">After Asr</option>
                    <option value="Maghrib">After Maghrib</option>
                    <option value="Isha">After Isha</option>
                    <option value="Morning">Morning Adhkar</option>
                    <option value="Evening">Evening Adhkar</option>
                    <option value="Before Sleep">Before Sleep</option>
                  </select>
                </div>
              </div>

              {/* Weekday Selection for Custom */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Reminder Days</label>
                <div className="flex gap-1.5">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => {
                    const isSelected = customSelectedDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleCustomDay(idx)}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-background border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {dayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-800 shrink-0 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsCustomOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={loadingActionId !== null}>
                {loadingActionId === 'custom' ? 'Creating...' : 'Create Wazeefah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Editing User Wazeefah */}
      <Dialog open={!!editingUserWazeefah} onOpenChange={(open) => { if (!open) setEditingUserWazeefah(null); }}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b dark:border-slate-800 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Edit3 className="w-5 h-5" /> Edit Scheduled Wazeefah
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserWazeefahEditSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Wazeefah / Adhkar Title</label>
                <Input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Istighfar 100x"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Description (Optional)</label>
                <Textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="What is the virtue of this adhkar or details on recitation..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355 flex items-center justify-between">
                  <span>Method / Instructions</span>
                  <span className="text-[10px] text-muted-foreground font-normal">One step per line</span>
                </label>
                <Textarea
                  value={editInstructionsText}
                  onChange={(e) => setEditInstructionsText(e.target.value)}
                  placeholder={`Step 1: Recite Astaghfirullah\nStep 2: Contemplate forgiveness...`}
                  rows={3}
                />
              </div>

              {/* Quran Reference Section */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setEditShowQuranRef(v => !v); if (editShowQuranRef) { setEditSelectedSurah(null); setEditSurahSearch(''); setEditFromAyah(''); setEditToAyah(''); } }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-405 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    {editSelectedSurah ? `Surah ${editSelectedSurah.n}. ${editSelectedSurah.name}${editFromAyah ? ` :${editFromAyah}` : ''}${editToAyah && editToAyah !== editFromAyah ? `–${editToAyah}` : ''}` : 'Add Surah / Ayat (optional)'}
                  </span>
                  {editShowQuranRef ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {editShowQuranRef && (
                  <div className="border border-slate-700/50 bg-slate-800/40 rounded-lg p-3 space-y-3">
                    {/* Surah search */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Surah</label>
                      <Input
                        value={editSurahSearch}
                        onChange={e => { setEditSurahSearch(e.target.value); setEditSelectedSurah(null); }}
                        placeholder="e.g. Al-Kahf or 18"
                        className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-8 text-xs"
                      />
                      {editSurahSearch && !editSelectedSurah && (
                        <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 divide-y divide-slate-800">
                          {filteredEditSurahs.length === 0 ? (
                            <p className="text-xs text-slate-500 p-2 text-center">No surah found</p>
                          ) : filteredEditSurahs.map(s => (
                            <button
                              key={s.n}
                              type="button"
                              onClick={() => { setEditSelectedSurah(s); setEditSurahSearch(s.name); setEditFromAyah(''); setEditToAyah(''); }}
                              className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-800 text-slate-200 cursor-pointer text-left transition-colors"
                            >
                              <span><span className="text-slate-500 mr-1.5">{s.n}.</span>{s.name}</span>
                              <span className="text-slate-500">{s.ayahs} ayahs</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {editSelectedSurah && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-xs text-emerald-400 font-semibold">{editSelectedSurah.n}. {editSelectedSurah.name}</span>
                          <span className="text-[9px] text-slate-500 ml-auto">{editSelectedSurah.ayahs} ayahs</span>
                        </div>
                      )}
                    </div>

                    {/* Ayat range */}
                    {editSelectedSurah && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From Ayah</label>
                          <Input
                            type="number"
                            min={1}
                            max={editSelectedSurah.ayahs}
                            value={editFromAyah}
                            onChange={e => setEditFromAyah(e.target.value)}
                            placeholder={`1–${editSelectedSurah.ayahs}`}
                            className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To Ayah</label>
                          <Input
                            type="number"
                            min={editFromAyah ? parseInt(editFromAyah) : 1}
                            max={editSelectedSurah.ayahs}
                            value={editToAyah}
                            onChange={e => setEditToAyah(e.target.value)}
                            placeholder={`up to ${editSelectedSurah.ayahs}`}
                            className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Reference / Source (Optional)</label>
                <Input
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  placeholder="e.g. Sahih al-Bukhari, Hadith 6405 or Al-Kahf 18:10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Daily Target Count</label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={editTarget}
                    onChange={(e) => setEditTarget(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Reminder Time</label>
                  <select
                    value={editReminder}
                    onChange={(e) => setEditReminder(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Fajr">After Fajr</option>
                    <option value="Dhuhr">After Dhuhr</option>
                    <option value="Asr">After Asr</option>
                    <option value="Maghrib">After Maghrib</option>
                    <option value="Isha">After Isha</option>
                    <option value="Morning">Morning Adhkar</option>
                    <option value="Evening">Evening Adhkar</option>
                    <option value="Before Sleep">Before Sleep</option>
                  </select>
                </div>
              </div>

              {/* Weekday Selection for Reminders */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355">Reminder Days</label>
                <div className="flex gap-1.5">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => {
                    const isSelected = editSelectedDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleEditDay(idx)}
                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-background border-slate-300 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {dayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-800 shrink-0 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUserWazeefah(null)}
                disabled={loadingActionId === `edit-${editingUserWazeefah?._id}`}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                disabled={loadingActionId === `edit-${editingUserWazeefah?._id}`}
              >
                {loadingActionId === `edit-${editingUserWazeefah?._id}` ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Wazeefah Detail View */}
      <Dialog open={!!detailWazeefah} onOpenChange={(open) => { if (!open) { setDetailWazeefah(null); router.push('/wazeefahs'); } }}>
        <DialogContent className="sm:max-w-[425px]">
          {detailLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : detailWazeefah ? (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600 dark:text-blue-400">
                    {detailWazeefah.category || 'Wazeefah'}
                  </Badge>
                  {detailWazeefah.reminderTime && (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{detailWazeefah.reminderTime}</span>
                    </div>
                  )}
                </div>
                <DialogTitle className="text-xl font-bold mt-2">{detailWazeefah.title}</DialogTitle>
                {detailWazeefah.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{detailWazeefah.description}</p>
                )}
              </DialogHeader>

              {/* Reference */}
              {detailWazeefah.reference && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-lg text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Source / Reference</span>
                  <span className="font-medium text-slate-700 dark:text-slate-350">{detailWazeefah.reference}</span>
                </div>
              )}

              {/* Instructions */}
              {detailWazeefah.instructions && detailWazeefah.instructions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instructions</span>
                  <ol className="text-sm list-decimal list-inside space-y-1 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border dark:border-slate-800">
                    {detailWazeefah.instructions.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                  </ol>
                </div>
              )}

              {/* Quran reference */}
              {detailWazeefah.quranRef?.surahName && (
                <Link
                  href={`/quran?surah=${detailWazeefah.quranRef.surahNumber}${detailWazeefah.quranRef.fromAyah ? `&ayah=${detailWazeefah.quranRef.fromAyah}` : ''}`}
                  onClick={() => setDetailWazeefah(null)}
                  className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg hover:bg-emerald-500/10 transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-500 truncate">
                      {detailWazeefah.quranRef.surahNumber}. {detailWazeefah.quranRef.surahName}
                      {detailWazeefah.quranRef.fromAyah && ` :${detailWazeefah.quranRef.fromAyah}`}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Jump to verse in Quran Reader</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-500/50 group-hover:text-emerald-500 transition-colors shrink-0" />
                </Link>
              )}

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => { setDetailWazeefah(null); router.push('/wazeefahs'); }}>
                  Close
                </Button>
                {!detailWazeefah.userId && (
                  <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setDetailWazeefah(null); handleOpenSubscribe(detailWazeefah); }}>
                    Add to Schedule
                  </Button>
                )}
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
