'use client';

import React, { useRef, useState } from 'react';
// html2canvas is dynamically imported in handleDownload
import { Download, Loader2, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareCardProps {
  arabicText: string;
  translationText: string;
  reference: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareCard({ arabicText, translationText, reference, isOpen, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // Dynamically import html2canvas to reduce initial bundle size
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: null, // preserve rounded corners
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `NurEQalbb-${reference.replace(/\s+/g, '-')}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Failed to generate image", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2"><Share2 className="w-4 h-4" /> Share to Social</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* Preview Area (Scrollable if needed) */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-slate-100 dark:bg-slate-900">
          
          {/* The Actual Card to Capture */}
          <div 
            ref={cardRef} 
            className="w-[1080px] h-[1920px] max-w-[320px] max-h-[568px] relative rounded-3xl overflow-hidden shrink-0 shadow-xl"
            style={{ 
              // We render a 9:16 aspect ratio scaled down for preview, but html2canvas will capture the scaled down version.
              // To capture true 1080x1920, we would render it offscreen at full size. 
              // For this scaffold, a standard high-res capture of this container works well enough for testing.
              background: 'linear-gradient(to bottom right, #064e3b, #022c22)' // Deep emerald to slate
            }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="absolute inset-0 p-8 flex flex-col justify-center text-white space-y-8">
              <p className="text-3xl font-arabic text-center leading-loose" style={{ fontFamily: 'Amiri, serif', lineHeight: '2' }}>
                {arabicText}
              </p>
              
              <div className="w-12 h-1 bg-emerald-500 mx-auto rounded-full" />
              
              <p className="text-base text-center font-medium text-emerald-50 leading-relaxed">
                "{translationText}"
              </p>
              
              <p className="text-sm text-center text-emerald-300 font-semibold mt-8 tracking-widest uppercase">
                — {reference}
              </p>
            </div>

            {/* Branding Footer */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-2 opacity-80">
              <div className="w-5 h-5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold tracking-wider">NUR E QALBB</span>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="p-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download Image
          </Button>
        </div>

      </div>
    </div>
  );
}
