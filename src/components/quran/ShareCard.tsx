'use client';

import React, { useRef, useState, useEffect } from 'react';
// html2canvas is dynamically imported in handleDownload/handleShare to reduce bundle size
import { Download, Loader2, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareCardProps {
  arabicText: string;
  translationText: string;
  urduText?: string;
  reference: string;
  isOpen: boolean;
  onClose: () => void;
}

type ThemeKey = 'emerald' | 'slate' | 'rose' | 'stone';

const THEMES: Record<ThemeKey, { name: string; gradient: string; border: string; divider: string; badge: string }> = {
  emerald: {
    name: 'Deep Emerald',
    gradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)',
    border: 'border-emerald-500/20',
    divider: 'bg-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  },
  slate: {
    name: 'Midnight Slate',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    border: 'border-slate-500/20',
    divider: 'bg-slate-500/30',
    badge: 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
  },
  rose: {
    name: 'Sunset Rose',
    gradient: 'linear-gradient(135deg, #1c0a21 0%, #581c4c 50%, #1c0a21 100%)',
    border: 'border-pink-500/20',
    divider: 'bg-pink-500/30',
    badge: 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
  },
  stone: {
    name: 'Desert Gold',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #78350f 50%, #1c1917 100%)',
    border: 'border-amber-500/20',
    divider: 'bg-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  }
};

export function ShareCard({ arabicText, translationText, urduText, reference, isOpen, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('emerald');
  const [language, setLanguage] = useState<'english' | 'urdu' | 'both'>('english');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Sync language selection options when the card opens or urduText availability changes
  useEffect(() => {
    if (isOpen) {
      setLanguage(urduText ? 'both' : 'english');
    }
  }, [isOpen, urduText]);

  if (!isOpen) return null;

  const hasUrdu = !!urduText;

  // Dynamic font sizing based on character length to prevent overflow in 9:16 layout
  const totalLength = arabicText.length + 
    (language === 'english' || language === 'both' ? translationText.length : 0) + 
    (language === 'urdu' || language === 'both' ? (urduText?.length || 0) : 0);
  
  let arabicSize = 'text-5xl';
  let transSize = 'text-3xl';
  let spacingClass = 'space-y-12';

  if (totalLength > 500) {
    arabicSize = 'text-3xl';
    transSize = 'text-xl';
    spacingClass = 'space-y-6';
  } else if (totalLength > 300) {
    arabicSize = 'text-4xl';
    transSize = 'text-2xl';
    spacingClass = 'space-y-8';
  }

  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    const html2canvas = (await import('html2canvas')).default;
    return await html2canvas(cardRef.current, {
      scale: 2, // High resolution output
      useCORS: true,
      backgroundColor: null,
    });
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvas();
      if (canvas) {
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `NurEQulb-${reference.replace(/\s+/g, '-')}.png`;
        link.href = image;
        link.click();
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
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

      const file = new File([blob], `NurEQulb-${reference.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

      // Check if browser supports Web Share API file sharing
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Nur-e-Qulb Share',
          text: `Read Quran on Nur-e-Qulb: ${reference}`
        });
      } else {
        // Fallback to download if direct sharing is not supported
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `NurEQulb-${reference.replace(/\s+/g, '-')}.png`;
        link.href = image;
        link.click();
      }
    } catch (error) {
      console.error('Failed to share image:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-500" /> Share Quran Verse
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
                className={`px-3 py-1.5 rounded-full transition-all border cursor-pointer ${
                  activeTheme === themeKey
                    ? THEMES[themeKey].badge
                    : 'bg-transparent border-slate-200 dark:border-slate-800 text-muted-foreground hover:text-foreground'
                }`}
              >
                {THEMES[themeKey].name}
              </button>
            ))}
          </div>

          {/* Language Selector (Only show if Urdu translation is available) */}
          {hasUrdu && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground mr-1">Language:</span>
              {(['english', 'urdu', 'both'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full capitalize transition-all border cursor-pointer ${
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
          {/* Scaled Preview Wrapper (Using CSS scale to guarantee pixel perfection) */}
          <div className="w-[238px] h-[423px] relative rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-950">
            {/* The scaled offscreen content rendered inside the preview box */}
            <div 
              style={{
                width: '1080px',
                height: '1920px',
                transform: 'scale(0.22)',
                transformOrigin: 'top left',
                background: THEMES[activeTheme].gradient,
              }}
              className="absolute inset-0 select-none flex flex-col justify-between p-16 text-white overflow-hidden"
            >
              {/* Google Font Embed for Amiri and Outfit */}
              <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Outfit:wght@300;400;600;700&display=swap');
                .font-arabic { font-family: 'Amiri', serif; }
                .font-outfit { font-family: 'Outfit', sans-serif; }
              `}} />

              {/* Decorative Geometric Dot Pattern Overlay */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 4px 4px, white 2px, transparent 0)', backgroundSize: '48px 48px' }}></div>

              {/* Branding Header */}
              <div className="flex flex-col items-center space-y-4 relative z-10">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-white/20 bg-slate-900/20 p-2.5 flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-4xl font-bold tracking-widest text-white uppercase font-outfit">
                  NUR-E-QULB
                </h4>
                <div className="w-16 h-0.5 bg-emerald-500 rounded-full" />
              </div>

              {/* Verses & Translations Block */}
              <div className={`w-full ${spacingClass} relative z-10 flex flex-col justify-center`}>
                <p className={`font-arabic text-center leading-[2] text-white ${arabicSize}`} style={{ fontFamily: 'Amiri, serif' }}>
                  {arabicText}
                </p>

                <div className={`w-28 h-0.5 ${THEMES[activeTheme].divider} mx-auto rounded-full`} />

                {(language === 'english' || language === 'both') && (
                  <p className={`text-center font-medium leading-relaxed text-emerald-100/90 ${transSize}`}>
                    "{translationText}"
                  </p>
                )}

                {(language === 'urdu' || language === 'both') && urduText && (
                  <p className={`text-center font-arabic leading-[2] text-emerald-100/90 ${transSize}`} style={{ fontFamily: 'Jameel Noori Nastaleeq, Amiri, serif' }}>
                    "{urduText}"
                  </p>
                )}

                <p className="text-2xl text-center text-emerald-400 font-bold uppercase tracking-wider font-outfit">
                  — {reference}
                </p>
              </div>

              {/* Branding Link Footer */}
              <div className="flex flex-col items-center space-y-2 opacity-85 relative z-10">
                <span className="text-xl font-bold tracking-widest text-emerald-400 uppercase font-outfit">
                  READ QURAN ONLINE
                </span>
                <span className="text-lg font-medium text-slate-350 tracking-wider">
                  nur-e-qulb.vercel.app
                </span>
              </div>
            </div>
          </div>

          {/* Offscreen Container: Full resolution 1080x1920 for html2canvas rendering */}
          <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', overflow: 'hidden' }}>
            <div 
              ref={cardRef} 
              style={{
                width: '1080px',
                height: '1920px',
                background: THEMES[activeTheme].gradient,
              }}
              className="flex flex-col justify-between p-16 text-white overflow-hidden relative"
            >
              {/* Google Font Embed for Amiri and Outfit */}
              <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Outfit:wght@300;400;600;700&display=swap');
                .font-arabic { font-family: 'Amiri', serif; }
                .font-outfit { font-family: 'Outfit', sans-serif; }
              `}} />

              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 4px 4px, white 2px, transparent 0)', backgroundSize: '48px 48px' }}></div>

              {/* Branding Header */}
              <div className="flex flex-col items-center space-y-4 relative z-10">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border border-white/20 bg-slate-900/20 p-2.5 flex items-center justify-center">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h4 className="text-4xl font-bold tracking-widest text-white uppercase font-outfit">
                  NUR-E-QULB
                </h4>
                <div className="w-16 h-0.5 bg-emerald-500 rounded-full" />
              </div>

              {/* Verses & Translations Block */}
              <div className={`w-full ${spacingClass} relative z-10 flex flex-col justify-center`}>
                <p className={`font-arabic text-center leading-[2] text-white ${arabicSize}`} style={{ fontFamily: 'Amiri, serif' }}>
                  {arabicText}
                </p>

                <div className={`w-28 h-0.5 ${THEMES[activeTheme].divider} mx-auto rounded-full`} />

                {(language === 'english' || language === 'both') && (
                  <p className={`text-center font-medium leading-relaxed text-emerald-100/90 ${transSize}`}>
                    "{translationText}"
                  </p>
                )}

                {(language === 'urdu' || language === 'both') && urduText && (
                  <p className={`text-center font-arabic leading-[2] text-emerald-100/90 ${transSize}`} style={{ fontFamily: 'Jameel Noori Nastaleeq, Amiri, serif' }}>
                    "{urduText}"
                  </p>
                )}

                <p className="text-2xl text-center text-emerald-400 font-bold uppercase tracking-wider font-outfit">
                  — {reference}
                </p>
              </div>

              {/* Branding Link Footer */}
              <div className="flex flex-col items-center space-y-2 opacity-85 relative z-10">
                <span className="text-xl font-bold tracking-widest text-emerald-400 uppercase font-outfit">
                  READ QURAN ONLINE
                </span>
                <span className="text-lg font-medium text-slate-350 tracking-wider font-outfit">
                  nur-e-qulb.vercel.app
                </span>
              </div>
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
  );
}
