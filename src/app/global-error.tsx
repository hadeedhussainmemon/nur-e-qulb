'use client';

import { Inter, Outfit } from 'next/font/google';
import '../app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <div className="flex h-screen w-full flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center max-w-md text-center">
            <h1 className="text-4xl font-bold font-outfit mb-4 text-red-600">Fatal Error</h1>
            <p className="text-muted-foreground mb-8">
              A critical error occurred at the application root level.
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
