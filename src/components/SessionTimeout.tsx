'use client';

import { useEffect, useRef } from 'react';
import { handleLogout } from '@/app/actions/authActions';

// 15 minutes in milliseconds
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; 

export default function SessionTimeout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(async () => {
      // Trigger logout action
      await handleLogout();
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Initialize timer
    resetTimer();

    // Bind event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup listeners and timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return null;
}
