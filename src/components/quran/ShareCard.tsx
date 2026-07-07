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

const THEMES: Record<ThemeKey, { name: string; bgClass: string; border: string; divider: string; badge: string }> = {
  emerald: {
    name: 'Deep Emerald',
    bgClass: 'bg-gradient-to-br from-teal-950 via-emerald-900 to-teal-950',
    border: 'border-emerald-500/20',
    divider: 'bg-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
  },
  slate: {
    name: 'Midnight Slate',
    bgClass: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
    border: 'border-slate-500/20',
    divider: 'bg-slate-500/30',
    badge: 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
  },
  rose: {
    name: 'Sunset Rose',
    bgClass: 'bg-gradient-to-br from-purple-950 via-pink-950 to-purple-950',
    border: 'border-pink-500/20',
    divider: 'bg-pink-500/30',
    badge: 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
  },
  stone: {
    name: 'Desert Gold',
    bgClass: 'bg-gradient-to-br from-stone-950 via-amber-950 to-stone-950',
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
  
  let arabicSize = 'text-2xl';
  let transSize = 'text-sm';
  let spacingClass = 'space-y-5';

  if (totalLength > 400) {
    arabicSize = 'text-lg';
    transSize = 'text-xs';
    spacingClass = 'space-y-3';
  } else if (totalLength > 200) {
    arabicSize = 'text-xl';
    transSize = 'text-xs';
    spacingClass = 'space-y-4';
  }

  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    const html2canvas = (await import('html2canvas')).default;
    return await html2canvas(cardRef.current, {
      scale: 4, // 4x scale outputs a crisp 1120x1988 resolution image
      useCORS: true,
      backgroundColor: null,
      logging: false
    });
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
          link.download = `NurEQulb-${reference.replace(/\s+/g, '-')}.png`;
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

      const file = new File([blob], `NurEQulb-${reference.replace(/\s+/g, '-')}.png`, { type: 'image/png' });

      // Check if browser supports Web Share API file sharing
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Nur-e-Qulb Share',
          text: `Read Quran on Nur-e-Qulb: ${reference}`
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

            {/* Language Selector (Only show if Urdu translation is available) */}
            {hasUrdu && (
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
            <div 
              ref={cardRef} 
              className={`relative rounded-2xl overflow-hidden shadow-2xl shrink-0 flex flex-col justify-between p-6 text-white ${THEMES[activeTheme].bgClass}`}
              style={{
                width: '280px',
                height: '497px',
              }}
            >
              {/* Embedded Local Fonts without external network imports to prevent taints */}
              <style dangerouslySetInnerHTML={{__html: `
                .font-arabic { font-family: 'Amiri', 'Scheherazade', 'Noto Naskh Arabic', serif; }
                .font-outfit { font-family: 'Outfit', 'Inter', 'Helvetica Neue', sans-serif; }
              `}} />

              {/* Branding Header (Original Base64 Logo - Taint proof) */}
              <div className="flex flex-col items-center space-y-1 relative z-10">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-slate-900/20 flex items-center justify-center relative">
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800/40 animate-pulse" />
                  )}
                </div>
                <h4 className="text-[10px] font-bold tracking-widest text-white uppercase font-outfit">
                  NUR-E-QULB
                </h4>
                <div className="w-6 h-0.5 bg-emerald-500 rounded-full" />
              </div>

              {/* Verses & Translations Block */}
              <div className={`w-full ${spacingClass} relative z-10 flex flex-col justify-center`}>
                <p className={`font-arabic text-center leading-[2] text-white ${arabicSize}`}>
                  {arabicText}
                </p>

                <div className={`w-12 h-0.5 ${THEMES[activeTheme].divider} mx-auto rounded-full`} />

                {(language === 'english' || language === 'both') && (
                  <p className={`text-center font-medium leading-relaxed text-emerald-100/90 ${transSize}`}>
                    "{translationText}"
                  </p>
                )}

                {(language === 'urdu' || language === 'both') && urduText && (
                  <p className={`text-center font-arabic leading-[2] text-emerald-100/90 ${transSize}`}>
                    "{urduText}"
                  </p>
                )}

                <p className="text-[10px] text-center text-emerald-400 font-bold uppercase tracking-wider font-outfit">
                  — {reference}
                </p>
              </div>

              {/* Branding Link Footer */}
              <div className="flex flex-col items-center space-y-0.5 opacity-85 relative z-10">
                <span className="text-[8px] font-bold tracking-widest text-emerald-400 uppercase font-outfit">
                  READ QURAN ONLINE
                </span>
                <span className="text-[9px] font-medium text-slate-350 tracking-wider font-outfit">
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
