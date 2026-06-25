'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncTrigger() {
  const router = useRouter();

  useEffect(() => {
    const runSync = () => {
      fetch('/api/sync/cases')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.totalUpdated > 0) {
              console.log(`[SyncTrigger] Automatically synchronized ${data.totalUpdated} cases in the background.`);
              router.refresh();
            }
          }
        })
        .catch(err => {
          console.warn('[SyncTrigger] Background sync failed:', err);
        });
    };

    // Execute synchronization in the background after a short delay
    const timer = setTimeout(runSync, 1500);

    // Run periodically every 60 seconds
    const interval = setInterval(runSync, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
