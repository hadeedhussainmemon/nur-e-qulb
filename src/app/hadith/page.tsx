'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { BookMarked, Bookmark, Search, ArrowRight, Loader2 } from 'lucide-react';
import { getHadithBookmarks } from '@/app/actions/bookmarkActions';
import { useSession } from 'next-auth/react';

const COLLECTIONS = [
  { id: 'bukhari', name: 'Sahih Bukhari', arabic: 'صحيح البخاري', author: 'Imam Bukhari', color: 'border-emerald-500' },
  { id: 'muslim', name: 'Sahih Muslim', arabic: 'صحيح مسلم', author: 'Imam Muslim', color: 'border-blue-500' },
  { id: 'abudawud', name: 'Sunan Abu Dawood', arabic: 'سنن أبي داود', author: 'Imam Abu Dawood', color: 'border-amber-500' },
  { id: 'tirmidhi', name: 'Jami At-Tirmidhi', arabic: 'جامع الترمذي', author: 'Imam Tirmidhi', color: 'border-rose-500' },
  { id: 'nasai', name: 'Sunan an-Nasa\'i', arabic: 'سنن النسائي', author: 'Imam an-Nasa\'i', color: 'border-indigo-500' },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه', author: 'Imam Ibn Majah', color: 'border-teal-500' },
];

export default function HadithIndexPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'collections' | 'bookmarks'>('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      if (session) {
        const data = await getHadithBookmarks();
        setBookmarks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadBookmarks();
    } else {
      setLoading(false);
    }
  }, [session]);

  const getCollectionName = (id: string) => {
    const coll = COLLECTIONS.find((c) => c.id === id);
    return coll ? coll.name : id;
  };

  const getCollectionColor = (id: string) => {
    const coll = COLLECTIONS.find((c) => c.id === id);
    return coll ? coll.color : 'border-slate-500';
  };

  const filteredCollections = COLLECTIONS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-muted-foreground text-sm">Opening Hadith Library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">Hadith Collections</h2>
          <p className="text-muted-foreground mt-1">Explore the 6 major authentic collections of the Prophet's (ﷺ) traditions.</p>
        </div>
      </div>

      {/* Tabs & Search controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('collections')}
            className={`pb-2 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'collections'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-muted-foreground hover:text-slate-800'
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`pb-2 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'bookmarks'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-muted-foreground hover:text-slate-800'
            }`}
          >
            Bookmarks ({bookmarks.length})
          </button>
        </div>

        {activeTab === 'collections' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {activeTab === 'collections' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Link href={`/hadith/${collection.id}`} key={collection.id}>
              <Card className={`hover:shadow-lg hover:border-emerald-500/20 transition-all cursor-pointer border-l-4 ${collection.color} border-slate-200 dark:border-slate-800 bg-card`}>
                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center border border-slate-200 dark:border-slate-800/80">
                      <BookMarked className={`w-6 h-6 ${collection.color.replace('border-', 'text-')}`} />
                    </div>
                    <h3 className="text-2xl font-arabic text-right text-slate-800 dark:text-slate-200" style={{ fontFamily: 'Amiri, serif' }}>
                      {collection.arabic}
                    </h3>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{collection.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Compiled by {collection.author}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground text-sm">
              No bookmarked traditions yet. While reading collections, click the bookmark icon to save Hadiths here.
            </div>
          ) : (
            bookmarks.map((bookmark) => {
              const collectionName = getCollectionName(bookmark.collectionName);
              const color = getCollectionColor(bookmark.collectionName);
              
              return (
                <Link href={`/hadith/${bookmark.collectionName}#hadith-${bookmark.hadithNumber}`} key={bookmark._id}>
                  <Card className={`hover:shadow-md hover:border-emerald-500/30 transition-all cursor-pointer border-l-4 ${color} border-slate-200 dark:border-slate-800 bg-card`}>
                    <CardContent className="p-4 px-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Bookmark className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base text-slate-800 dark:text-slate-200">
                            {collectionName} (Hadith #{bookmark.hadithNumber})
                          </h4>
                          <p className="text-xs text-muted-foreground">Saved on {new Date(bookmark.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
