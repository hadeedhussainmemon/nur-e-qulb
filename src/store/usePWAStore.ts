import { create } from 'zustand';

interface PWAState {
  deferredPrompt: any | null;
  isStandalone: boolean;
  isInstalled: boolean;
  setDeferredPrompt: (prompt: any | null) => void;
  setIsStandalone: (isStandalone: boolean) => void;
  setIsInstalled: (isInstalled: boolean) => void;
  triggerInstall: () => Promise<boolean>;
}

export const usePWAStore = create<PWAState>((set, get) => ({
  deferredPrompt: null,
  isStandalone: false,
  isInstalled: false,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  setIsStandalone: (isStandalone) => {
    set({ isStandalone });
    if (isStandalone && typeof window !== 'undefined') {
      localStorage.setItem('nurequlb_pwa_installed', 'true');
      set({ isInstalled: true });
    }
  },
  setIsInstalled: (isInstalled) => {
    set({ isInstalled });
    if (isInstalled && typeof window !== 'undefined') {
      localStorage.setItem('nurequlb_pwa_installed', 'true');
    }
  },
  triggerInstall: async () => {
    const prompt = get().deferredPrompt;
    if (!prompt) return false;
    
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        set({ deferredPrompt: null, isInstalled: true });
        if (typeof window !== 'undefined') {
          localStorage.setItem('nurequlb_pwa_installed', 'true');
        }
        return true;
      }
    } catch (err) {
      console.error('Error triggering PWA install:', err);
    }
    return false;
  }
}));
