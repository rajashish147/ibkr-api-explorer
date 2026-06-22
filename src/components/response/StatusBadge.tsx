'use client';

import React from 'react';
import { getStatusBg, cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: number;
  statusText: string;
}

export function StatusBadge({ status, statusText }: StatusBadgeProps) {
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono font-bold', getStatusBg(status))}>
      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse" />
      {status} {statusText}
    </div>
  );
}
