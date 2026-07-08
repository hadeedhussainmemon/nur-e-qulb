'use client';

import React, { useRef, useState, useEffect } from 'react';
// html2canvas is dynamically imported in handleDownload/handleShare to reduce bundle size
import { Download, Loader2, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareCardProps {
  arabicText?: string;
  translationText?: string;
  urduText?: string;
  reference: string;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'verse' | 'calendar' | 'inspiration';
  calendarData?: {
    gregorianDate: string;
    hijriDate: string;
    location: string;
    timings: { name: string; start: string; end: string }[];
  };
}

type ThemeKey = 'emerald' | 'slate' | 'rose' | 'stone';

const THEMES: Record<ThemeKey, { name: string; gradient: string; dividerColor: string; badge: string }> = {
  emerald: {
    name: 'Deep Emerald',
    gradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)',
    dividerColor: 'rgba(16, 185, 129, 0.3)',
    badge: 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
  },
  slate: {
    name: 'Midnight Slate',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    dividerColor: 'rgba(148, 163, 184, 0.3)',
    badge: 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
  },
  rose: {
    name: 'Sunset Rose',
    gradient: 'linear-gradient(135deg, #1c0a21 0%, #581c4c 50%, #1c0a21 100%)',
    dividerColor: 'rgba(236, 72, 153, 0.3)',
    badge: 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
  },
  stone: {
    name: 'Desert Gold',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #78350f 50%, #1c1917 100%)',
    dividerColor: 'rgba(245, 158, 11, 0.3)',
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  }
};

export function ShareCard({ 
  arabicText = '', 
  translationText = '', 
  urduText, 
  reference, 
  isOpen, 
  onClose,
  mode = 'verse',
  calendarData
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('emerald');
  const [language, setLanguage] = useState<'english' | 'urdu' | 'both'>('english');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Local states for the long-press download modal
  const [downloadImageUrl, setDownloadImageUrl] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  // Sync language selection options when the card opens or urduText availability changes
  useEffect(() => {
    if (isOpen) {
      setLanguage(urduText ? 'both' : 'english');
    }
  }, [isOpen, urduText]);

  // Load logo as base64 on mount to prevent canvas taint issues
  useEffect(() => {
    async function loadLogoAsBase64() {
      try {
        const response = await fetch('/logo.png');
        if (!response.ok) throw new Error('Failed to fetch logo file');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('Failed to load logo as base64 data URL:', err);
      }
    }
    if (isOpen) {
      loadLogoAsBase64();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasUrdu = !!urduText;

  // Dynamic font sizing based on character length for the 280px width card
  const totalLength = arabicText.length + 
    (language === 'english' || language === 'both' ? translationText.length : 0) + 
    (language === 'urdu' || language === 'both' ? (urduText?.length || 0) : 0);
  
  let arabicFontSizePx = '24px';
  let transFontSizePx = '14px';
  let spacingClassGap = '20px';

  if (totalLength > 400) {
    arabicFontSizePx = '18px';
    transFontSizePx = '11px';
    spacingClassGap = '12px';
  } else if (totalLength > 200) {
    arabicFontSizePx = '20px';
    transFontSizePx = '12px';
    spacingClassGap = '16px';
  }

  const generateCanvas = async () => {
    if (!cardRef.current) return null;

    // Temporarily mask document.styleSheets to return an empty list.
    // This stops html2canvas from reading/parsing Next.js/Tailwind v4 production CSS bundles
    // containing oklch() or lab() functions, preventing parser crashes.
    const originalProperty = Object.getOwnPropertyDescriptor(Document.prototype, 'styleSheets');
    Object.defineProperty(document, 'styleSheets', {
      get: () => {
        const list: any = [];
        list.item = () => null;
        return list;
      },
      configurable: true
    });

    try {
      const html2canvas = (await import('html2canvas')).default;
      return await html2canvas(cardRef.current, {
        scale: 4, // 4x scale outputs a crisp 1120x1988 resolution image
        useCORS: true,
        backgroundColor: null,
        logging: false
      });
    } finally {
      // Restore original styleSheets getter descriptor
      if (originalProperty) {
        Object.defineProperty(document, 'styleSheets', originalProperty);
      } else {
        delete (document as any).styleSheets;
      }
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvas();
      if (canvas) {
        const image = canvas.toDataURL('image/png', 1.0);
        setDownloadImageUrl(image);
        setIsDownloadModalOpen(true);
        
        // Try programmatic download as a primary attempt
        try {
          const link = document.createElement('a');
          const prefix = mode === 'calendar' ? 'NamazSchedule' : mode === 'inspiration' ? 'DailyInspiration' : 'NurEQulb';
          link.download = `${prefix}-${reference.replace(/\s+/g, '-')}.png`;
          link.href = image;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (downloadErr) {
          console.warn('Programmatic download failed, falling back to modal preview:', downloadErr);
        }
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('Failed to generate image preview. Please screenshot the screen or try on another browser.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error('Canvas generation failed');

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Blob generation failed');

      const filePrefix = mode === 'calendar' ? 'NamazSchedule' : mode === 'inspiration' ? 'DailyInspiration' : 'NurEQulb';
      const file = new File([blob], `${filePrefix}-${reference.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

      // Check if browser supports Web Share API file sharing
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        const promoText = `Start using Nur-e-Qulb today to make your prayers and adhkar better! Visit: https://nur-e-qulb.vercel.app`;
        const shareText = mode === 'calendar' 
          ? `Namaz schedule for ${reference}\n\n${promoText}`
          : mode === 'inspiration'
            ? `Daily Inspiration: "${translationText}" — ${reference}\n\n${promoText}`
            : `Quran Verse: "${translationText}" — ${reference}\n\n${promoText}`;

        await navigator.share({
          files: [file],
          title: mode === 'calendar' ? "Today's Prayer Schedule" : mode === 'inspiration' ? 'Daily Spiritual Reminder' : 'Nur-e-Qulb Share',
          text: shareText
        });
      } else {
        // Fallback to download preview if sharing is not supported
        const image = canvas.toDataURL('image/png', 1.0);
        setDownloadImageUrl(image);
        setIsDownloadModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to share image:', error);
      alert('Failed to generate sharing image. Please try screenshotting or saving manually.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-500" /> {mode === 'calendar' ? "Share Namaz Schedule" : mode === 'inspiration' ? "Share Daily Inspiration" : "Share Quran Verse"}
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-850">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Customization Controls */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-slate-900/20 text-xs font-semibold">
            {/* Theme Selector */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-muted-foreground mr-1">Theme:</span>
              {(Object.keys(THEMES) as ThemeKey[]).map((themeKey) => (
                <button
                  key={themeKey}
                  onClick={() => setActiveTheme(themeKey)}
                  className={`px-3 py-1.5 rounded-full transition-all border cursor-pointer border-solid ${
                    activeTheme === themeKey
                      ? THEMES[themeKey].badge
                      : 'bg-transparent border-slate-200 dark:border-slate-800 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {THEMES[themeKey].name}
                </button>
              ))}
            </div>

            {/* Language Selector (Only show if Urdu translation is available and in verse mode) */}
            {mode === 'verse' && hasUrdu && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground mr-1">Language:</span>
                {(['english', 'urdu', 'both'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full capitalize transition-all border border-solid cursor-pointer ${
                      language === lang
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400'
                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lang === 'both' ? 'English & Urdu' : lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview Area */}
          <div className="p-5 overflow-y-auto flex-1 flex justify-center bg-slate-100 dark:bg-slate-900/80 relative">
            {/* The visible card that is captured directly (no scale, no offscreen hides) */}
            {/* 100% inline styled to render perfectly when global styleSheets are masked */}
            <div 
              ref={cardRef} 
              style={{
                position: 'relative',
                width: '280px',
                height: '497px',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                color: '#ffffff',
                background: THEMES[activeTheme].gradient,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Embedded Local Fonts without external network imports to prevent taints */}
              <style dangerouslySetInnerHTML={{__html: `
                .font-arabic { font-family: 'Amiri', 'Scheherazade', 'Noto Naskh Arabic', serif; }
                .font-outfit { font-family: 'Outfit', 'Inter', 'Helvetica Neue', sans-serif; }
              `}} />

              {/* Branding Header (Original Base64 Logo - Taint proof) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative', zIndex: 10 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '9999px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(15,23,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800/40 animate-pulse" />
                  )}
                </div>
                <h4 className="font-outfit" style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.15em', color: '#ffffff', textTransform: 'uppercase', margin: 0, marginTop: '4px' }}>
                  NUR-E-QULB
                </h4>
                <div style={{ width: '24px', height: '2px', backgroundColor: '#10b981', borderRadius: '9999px', marginTop: '2px' }} />
              </div>

              {/* Dynamic Content Switching based on Mode */}
              {mode === 'calendar' && calendarData ? (
                /* Calendar / Timings Share Layout */
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 10 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p className="font-outfit" style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: '#34d399' }}>
                      {calendarData.hijriDate}
                    </p>
                    <p className="font-outfit" style={{ fontSize: '10px', fontWeight: 500, margin: 0, marginTop: '1px', color: '#cbd5e1', opacity: 0.9 }}>
                      {calendarData.gregorianDate}
                    </p>
                    <p className="font-outfit" style={{ fontSize: '9px', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginTop: '4px' }}>
                      📍 {calendarData.location}
                    </p>
                  </div>

                  <div style={{ width: '48px', height: '1.5px', backgroundColor: THEMES[activeTheme].dividerColor, margin: '0 auto', borderRadius: '9999px' }} />

                  {/* Timings List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {calendarData.timings.map((prayer) => (
                      <div 
                        key={prayer.name}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '7px 11px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <span className="font-outfit" style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}>
                          {prayer.name}
                        </span>
                        <span className="font-outfit" style={{ fontSize: '10px', fontWeight: 500, color: '#e2e8f0' }}>
                          {prayer.start} – {prayer.end}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Standard Quran Verse / Hadith Share Layout */
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: spacingClassGap, position: 'relative', zIndex: 10 }}>
                  <p className="font-arabic" style={{ textAlign: 'center', lineHeight: 2, color: '#ffffff', fontSize: arabicFontSizePx, margin: 0 }}>
                    {arabicText}
                  </p>

                  <div style={{ width: '48px', height: '2px', backgroundColor: THEMES[activeTheme].dividerColor, margin: '0 auto', borderRadius: '9999px' }} />

                  {(language === 'english' || language === 'both') && (
                    <p className="font-outfit" style={{ textAlign: 'center', fontWeight: 500, lineHeight: 1.5, color: '#e2e8f0', fontSize: transFontSizePx, margin: 0 }}>
                      "{translationText}"
                    </p>
                  )}

                  {(language === 'urdu' || language === 'both') && urduText && (
                    <p className="font-arabic" style={{ textAlign: 'center', lineHeight: 2, color: '#e2e8f0', fontSize: transFontSizePx, margin: 0 }}>
                      "{urduText}"
                    </p>
                  )}

                  <p className="font-outfit" style={{ fontSize: '10px', textAlign: 'center', color: '#34d399', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                    — {reference}
                  </p>
                </div>
              )}

              {/* Branding Link Footer */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', opacity: 0.85, position: 'relative', zIndex: 10 }}>
                <span className="font-outfit" style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.1em', color: '#34d399', textTransform: 'uppercase' }}>
                  {mode === 'calendar' ? "DAILY NAMAZ SCHEDULE" : mode === 'inspiration' ? "DAILY INSPIRATION" : "READ QURAN ONLINE"}
                </span>
                <span className="font-outfit" style={{ fontSize: '9px', fontWeight: 500, color: '#cbd5e1', letterSpacing: '0.05em' }}>
                  nur-e-qulb.vercel.app
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
            <Button variant="outline" onClick={onClose} className="rounded-xl font-semibold border-slate-200 dark:border-slate-800">
              Cancel
            </Button>

            <div className="flex gap-2">
              {/* Share Button (Web Share API for direct WhatsApp sharing) */}
              <Button 
                onClick={handleShare} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer border-0"
                disabled={isSharing || isGenerating}
              >
                {isSharing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                Share Status
              </Button>

              {/* Download Button */}
              <Button 
                onClick={handleDownload} 
                variant="secondary"
                className="rounded-xl font-semibold flex items-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                disabled={isSharing || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Save Image
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Long-press Helper Dialog (Ultimate fallback for standalone PWA and mobile restrictions) */}
      {isDownloadModalOpen && downloadImageUrl && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-center border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-white">Save Image</h4>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsDownloadModalOpen(false)}
                className="rounded-full h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-850"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
              📲 <strong>Press and hold (long-press)</strong> the image below and select <strong>"Save Image"</strong> or <strong>"Download Image"</strong> to save it directly to your photos.
            </p>

            {/* Displaying the real base64 image tag for long-press support */}
            <div className="relative rounded-2xl overflow-hidden shadow-md max-h-[50vh] flex justify-center bg-slate-950/10 p-1">
              <img 
                src={downloadImageUrl} 
                alt="Generated Quran Verse" 
                className="max-h-[48vh] w-auto object-contain border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>

            <Button 
              onClick={() => setIsDownloadModalOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full rounded-xl font-semibold border-0 cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
