'use client';

import React from 'react';
import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 2000, // deduplicate requests with the same key in this time span (in ms)
        errorRetryCount: 3,
        revalidateOnFocus: true,
        fetcher: (resource, init) => fetch(resource, init).then(res => res.json())
      }}
    >
      {children}
    </SWRConfig>
  );
}
