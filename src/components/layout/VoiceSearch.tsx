'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function VoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Basic intent parser
    if (transcript.toLowerCase().includes('surah yaseen')) {
      router.push('/quran/36');
      setTranscript('');
    } else if (transcript.toLowerCase().includes('surah rahman')) {
      router.push('/quran/55');
      setTranscript('');
    }
  }, [transcript, router]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support Voice Search. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current][0].transcript;
      setTranscript(result);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder={isListening ? "Listening..." : "Search Quran, Hadith..."}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className={`pl-8 pr-4 py-1.5 text-sm rounded-full border bg-slate-50 dark:bg-slate-900 transition-colors ${isListening ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-800'}`}
        />
      </div>
      <Button 
        variant={isListening ? "default" : "ghost"} 
        size="icon" 
        onClick={toggleListening}
        className={isListening ? "bg-red-500 hover:bg-red-600 text-white rounded-full animate-pulse" : "rounded-full"}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>
    </div>
  );
}
