'use client';

import React, { useState } from 'react';
import { Heart, MoonStar, Search, ArrowRight, HeartHandshake, Eye, BookOpen, Share2 } from 'lucide-react';
import { TasbihCounter } from '@/components/dua/TasbihCounter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShareCard } from '@/components/quran/ShareCard';

interface DuaItem {
  id: string;
  title: string;
  category: 'Protection' | 'Rizq' | 'Anxiety' | 'Forgiveness' | 'Parents';
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
}

const DUAS: DuaItem[] = [
  {
    id: '1',
    title: 'Sayyidul Istighfar (Chief of Forgiveness)',
    category: 'Forgiveness',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration: "Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu. A'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u laka bidhanbi faghfir li, fa-innahu la yaghfirudh-dhunuba illa Anta.",
    translation: "O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil, which I have committed. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none can forgive sins except You.",
    source: 'Sahih al-Bukhari',
  },
  {
    id: '2',
    title: 'Dua for Protection (Leaving Home)',
    category: 'Protection',
    arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'Bismillahi tawakkaltu alallahi, la hawla wala quwwata illa billah.',
    translation: 'In the name of Allah, I place my trust in Allah, and there is no power or might except with Allah.',
    source: 'Sunan Abi Dawud',
  },
  {
    id: '3',
    title: 'Dua of Prophet Yunus (In Distress)',
    category: 'Anxiety',
    arabic: 'لَّا إِلَٰهَ إِلَّآ أَنتَ سُبْحَٰنَكَ إِنِّى كُنتُ مِنَ ٱلظَّٰلِمِينَ',
    transliteration: 'La ilaha illa Anta subhanaka inni kuntu minadh-dhalimin.',
    translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    source: 'Surah Al-Anbiya (21:87)',
  },
  {
    id: '4',
    title: 'Dua of Prophet Musa (For Sustenance & Need)',
    category: 'Rizq',
    arabic: 'رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ',
    transliteration: 'Rabbi inni lima anzalta ilayya min khayrin faqir.',
    translation: 'My Lord, indeed I am, for whatever good You would send down to me, in need.',
    source: 'Surah Al-Qasas (28:24)',
  },
  {
    id: '5',
    title: 'Dua for Parents',
    category: 'Parents',
    arabic: 'رَّبِّ ٱرْحَمْهُمَا كَمَا رَبَّيَانِى صَغِيرًا',
    transliteration: 'Rabbi irhamhuma kama rabbayani saghira.',
    translation: 'My Lord, have mercy upon them [my parents] as they brought me up when I was small.',
    source: 'Surah Al-Isra (17:24)',
  },
  {
    id: '6',
    title: 'Dua of Prophet Ibrahim in Difficulty',
    category: 'Anxiety',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: 'Hasbunallahu wa ni’mal wakeel.',
    translation: 'Sufficient for us is Allah, and [He is] the best Disposer of affairs.',
    source: 'Surah Ali ‘Imran (3:173)',
  },
  {
    id: '7',
    title: 'Dua for Protection against Evil',
    category: 'Protection',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: 'Bismillahi-lladhi la yadurru ma’as-mihi shay’un fil-ardi wa la fis-sama’i, wa Huwas-Sami’ul-’Alim.',
    translation: 'In the name of Allah, with Whose name nothing is harmed in the earth nor in the heaven, and He is the All-Hearing, the All-Knowing.',
    source: 'Sunan al-Tirmidhi',
  }
];

export default function DuaPage() {
  const [activeTab, setActiveTab] = useState<'tasbih' | 'duas'>('tasbih');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Custom Local Storage favorites simulation
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeDuaDetails, setActiveDuaDetails] = useState<DuaItem | null>(null);

  // Sharing states
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareData, setShareData] = useState<{ arabic: string; translation: string; source: string } | null>(null);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const categories = ['All', 'Protection', 'Rizq', 'Anxiety', 'Forgiveness', 'Parents'];

  const filteredDuas = DUAS.filter((dua) => {
    const matchesSearch = dua.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dua.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dua.transliteration.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || dua.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="text-center space-y-4 py-6 border-b border-rose-100 dark:border-rose-900/30">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 rounded-full flex items-center justify-center mx-auto mb-2 text-rose-600 dark:text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-rose-600 dark:text-rose-400">Dua & Dhikr</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">Grow closer to Allah through daily supplications and consistent remembrance.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('tasbih')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'tasbih'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          Tasbih Counter
        </button>
        <button
          onClick={() => setActiveTab('duas')}
          className={`pb-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'duas'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-muted-foreground hover:text-slate-800'
          }`}
        >
          Dua Library
        </button>
      </div>

      {activeTab === 'tasbih' ? (
        <div className="max-w-md mx-auto flex flex-col justify-center py-6">
          <TasbihCounter />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls: Category badges & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                    selectedCategory === cat
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-muted-foreground hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search Duas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Duas List */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5" /> Supplications ({filteredDuas.length})
              </h3>
              
              {filteredDuas.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground text-sm">
                  No supplications matched your search.
                </div>
              ) : (
                filteredDuas.map((dua) => {
                  const isFav = favorites.includes(dua.id);
                  return (
                    <Card 
                      key={dua.id} 
                      className={`hover:border-rose-300 dark:hover:border-rose-950 transition-all cursor-pointer ${
                        activeDuaDetails?.id === dua.id ? 'border-rose-400 dark:border-rose-950 ring-1 ring-rose-400' : 'border-slate-100 dark:border-slate-900'
                      }`}
                      onClick={() => setActiveDuaDetails(dua)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1 overflow-hidden min-w-0 pr-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 text-[9px] uppercase border-transparent shrink-0">
                              {dua.category}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{dua.title}</h4>
                          <p className="text-[10px] text-muted-foreground truncate italic">Source: {dua.source}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(dua.id);
                            }}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isFav ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'text-slate-400 hover:text-rose-500 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Dua Details Column */}
            <div>
              {activeDuaDetails ? (
                <Card className="sticky top-6 border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-rose-500 text-white uppercase tracking-wider text-[10px] font-bold">
                        {activeDuaDetails.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{activeDuaDetails.source}</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">{activeDuaDetails.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Arabic */}
                    <div className="text-right">
                      <p className="text-2xl md:text-3xl leading-loose font-arabic text-rose-950 dark:text-rose-400" style={{ fontFamily: 'Amiri, serif', lineHeight: '2.3' }}>
                        {activeDuaDetails.arabic}
                      </p>
                    </div>

                    {/* Transliteration */}
                    <div className="space-y-1.5 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-slate-700 dark:text-slate-300">
                      <h5 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Pronunciation / Transliteration</h5>
                      <p className="text-xs italic leading-relaxed">{activeDuaDetails.transliteration}</p>
                    </div>

                    {/* Translation */}
                    <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">English Meaning</h5>
                      <p className="text-sm leading-relaxed">{activeDuaDetails.translation}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="px-6 pb-6 pt-0 border-t-0 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex items-center gap-1.5 border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                      onClick={() => {
                        setShareData({
                          arabic: activeDuaDetails.arabic,
                          translation: activeDuaDetails.translation,
                          source: activeDuaDetails.source
                        });
                        setIsShareOpen(true);
                      }}
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share Card
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="h-[250px] border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground text-sm p-6 text-center">
                  <BookOpen className="w-8 h-8 text-rose-300 mb-2" />
                  Select a Dua from the library to view its Arabic script, English translation, and pronunciation helper.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {shareData && (
        <ShareCard 
          arabicText={shareData.arabic}
          translationText={shareData.translation}
          reference={shareData.source}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}

