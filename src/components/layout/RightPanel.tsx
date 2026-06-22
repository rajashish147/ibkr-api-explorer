'use client';

import React from 'react';
import { ResponseViewer } from '@/components/response/ResponseViewer';

export function RightPanel() {
  return (
    <div className="h-full bg-[#0d0d1a] overflow-hidden">
      <ResponseViewer />
    </div>
  );
}
