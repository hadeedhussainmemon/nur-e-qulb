'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event to show the prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Optional: check if user already dismissed it today in localStorage
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If app is already installed
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true'); // Dismiss for later
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="bg-emerald-600 text-white rounded-2xl shadow-2xl p-4 pr-12 relative flex items-center gap-4">
        <button 
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-emerald-200 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="bg-white/20 p-3 rounded-xl shrink-0">
          <Download className="w-6 h-6" />
        </div>
        
        <div>
          <h3 className="font-bold">Install Nur E Qalbb</h3>
          <p className="text-sm text-emerald-100 mt-0.5">Read offline & get daily notifications.</p>
        </div>
        
        <Button 
          onClick={handleInstallClick}
          variant="secondary" 
          size="sm"
          className="ml-auto bg-white text-emerald-700 hover:bg-emerald-50 shrink-0"
        >
          Install
        </Button>
      </div>
    </div>
  );
}
