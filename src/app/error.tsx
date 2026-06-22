'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center max-w-md text-center p-8 bg-card border rounded-2xl shadow-sm">
        <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold font-outfit mb-3">Something went wrong!</h2>
        <p className="text-muted-foreground mb-8">
          We encountered an unexpected error while rendering this page.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
