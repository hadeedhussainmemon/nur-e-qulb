'use client';

import React, { useState } from 'react';
import { Bell, Send, Loader2 } from 'lucide-react';
import { sendAnnouncement } from '@/app/actions/adminActions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function AdminNotificationsTab({ users }: { users: any[] }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'single'>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchEmail.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      alert('Please fill in all fields');
      return;
    }

    if (recipientType === 'single' && !targetUserId) {
      alert('Please select a specific user recipient.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendAnnouncement(
        title.trim(),
        message.trim(),
        recipientType === 'single' ? targetUserId : undefined
      );

      if (res.success) {
        alert(
          recipientType === 'all'
            ? 'Announcement successfully broadcasted to all users!'
            : 'Notification successfully sent to selected user!'
        );
        // Reset form
        setTitle('');
        setMessage('');
        setRecipientType('all');
        setTargetUserId('');
        setSearchEmail('');
      } else {
        alert(res.error || 'Failed to dispatch notification.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950/20">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-850">
          <CardTitle className="text-base flex items-center gap-2 text-slate-850 dark:text-slate-200">
            <Bell className="w-5 h-5 text-indigo-500" /> Dispatch Announcement
          </CardTitle>
          <CardDescription>Compose system announcements, user alerts, or personalized greetings.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipient scope Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Recipient Group</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={recipientType === 'all'}
                    onChange={() => { setRecipientType('all'); setTargetUserId(''); setSearchEmail(''); }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Broadcast to All Users</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    checked={recipientType === 'single'}
                    onChange={() => setRecipientType('single')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Specific User / Email</span>
                </label>
              </div>
            </div>

            {/* Single User search dropdown */}
            {recipientType === 'single' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Select Target User</label>
                <Input
                  value={searchEmail}
                  onChange={e => { setSearchEmail(e.target.value); setTargetUserId(''); }}
                  placeholder="Type name or email to search..."
                  className="h-9 border-slate-300 dark:border-slate-800"
                />

                {searchEmail && !targetUserId && (
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-background divide-y divide-slate-100 dark:divide-slate-900 mt-1">
                    {filteredUsers.length === 0 ? (
                      <p className="text-xs text-slate-500 p-2 text-center">No matching user found</p>
                    ) : (
                      filteredUsers.slice(0, 15).map(u => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => { setTargetUserId(u._id); setSearchEmail(`${u.name} (${u.email || 'Guest'})`); }}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-left cursor-pointer transition-colors"
                        >
                          <span className="font-semibold">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{u.email || 'Guest ID'}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notification Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Notification Title</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Ramadan Mubarak!"
                required
                className="h-9 border-slate-300 dark:border-slate-800"
              />
            </div>

            {/* Notification message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Message Body</label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your greeting or announcement details here..."
                required
                rows={4}
                className="border-slate-300 dark:border-slate-800"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10 mt-4 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Send Notification
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
