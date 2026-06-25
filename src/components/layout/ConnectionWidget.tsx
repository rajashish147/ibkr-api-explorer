'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

type ConnectionState = 'connected' | 'disconnected' | 'authenticating' | 'error';

export function ConnectionWidget() {
  const [status, setStatus] = useState<ConnectionState>('authenticating');

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      try {
        const response = await fetch('/api/ibkr-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Ensure browser sends & receives cookies
          body: JSON.stringify({
            url: 'https://localhost:5000/v1/api/iserver/auth/status',
            method: 'POST',
            headers: {},
            body: null,
          }),
        });

        if (!mounted) return;

        if (!response.ok) {
          setStatus('error');
          return;
        }

        const data = await response.json();
        
        let bodyJson = data.body;
        if (typeof data.body === 'string') {
          try { bodyJson = JSON.parse(data.body); } catch {}
        }

        if (bodyJson?.authenticated) {
          setStatus('connected');
        } else {
          setStatus('disconnected');
        }
      } catch (error) {
        if (mounted) setStatus('error');
      }
    };

    // Initial check to populate the cookie jar immediately
    checkStatus();

    // Background loop to keep session alive and refreshed (every 30 seconds)
    const interval = setInterval(checkStatus, 30000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusDisplay = () => {
    switch (status) {
      case 'connected':
        return { label: 'Gateway Connected', color: 'bg-emerald-500', text: 'text-emerald-400' };
      case 'disconnected':
        return { label: 'Not Authenticated', color: 'bg-yellow-500', text: 'text-yellow-400' };
      case 'authenticating':
        return { label: 'Connecting...', color: 'bg-blue-500 animate-pulse', text: 'text-blue-400' };
      case 'error':
        return { label: 'Gateway Offline', color: 'bg-red-500', text: 'text-red-400' };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1a1a2e] border border-[#2a2a3e] ${display.text}`} title="IBKR Gateway Status">
      <div className={`w-2 h-2 rounded-full ${display.color}`} />
      <span className="text-xs font-medium">{display.label}</span>
    </div>
  );
}
