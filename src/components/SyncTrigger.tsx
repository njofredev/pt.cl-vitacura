'use client';

import { useEffect } from 'react';

export default function SyncTrigger() {
  useEffect(() => {
    // Execute synchronization in the background after a short delay
    const timer = setTimeout(() => {
      fetch('/api/sync/cases')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.totalUpdated > 0) {
            console.log(`[SyncTrigger] Automatically synchronized ${data.totalUpdated} cases in the background.`);
          }
        })
        .catch(err => {
          console.warn('[SyncTrigger] Background sync failed:', err);
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
