'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, MapPin, Loader2, Save } from 'lucide-react';

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'other',
    city: '',
    country: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setFormData({
          name: data.name || '',
          gender: data.gender || 'other',
          city: data.location?.city || '',
          country: data.location?.country || '',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDetectLocation = () => {
    setDetecting(true);
    setMessage(null);

    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocoding using OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
          if (!res.ok) throw new Error('Failed to fetch address');
          const data = await res.json();

          const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
          const country = data.address.country || '';

          setFormData((prev) => ({ ...prev, city, country }));
          setMessage({ type: 'success', text: 'Location auto-detected successfully!' });
        } catch (error) {
          setMessage({ type: 'error', text: 'Failed to retrieve city and country from coordinates.' });
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error(error);
        setMessage({ type: 'error', text: 'Location access denied or unavailable.' });
        setDetecting(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          gender: formData.gender,
          location: {
            city: formData.city,
            country: formData.country,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to save profile');
      setMessage({ type: 'success', text: 'Profile saved successfully! Prayer times on Home will now use this location.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your personal information and location settings.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
        }`}>
          {message.text}
        </div>
      )}

      <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-xl">Personal Information</CardTitle>
            <CardDescription>Update your name and gender preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-emerald-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>
          </CardContent>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              Location Settings
              <Button type="button" variant="outline" size="sm" onClick={handleDetectLocation} disabled={detecting} className="gap-2">
                {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                Auto-Detect Location
              </Button>
            </CardTitle>
            <CardDescription>Your location is used to calculate accurate daily prayer times.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. London"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g. United Kingdom"
                  required
                />
              </div>
            </div>
          </CardContent>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
