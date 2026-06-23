'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { LeftSidebar } from './LeftSidebar';
import { CenterPanel } from './CenterPanel';
import { RightPanel } from './RightPanel';
import { TopBar } from './TopBar';
import { ImportDialog } from '@/components/import/ImportDialog';
import { EnvironmentManager } from '@/components/environment/EnvironmentManager';
import { Toaster } from 'sonner';

export function AppShell() {
  const { sidebarWidth, rightPanelWidth, setSidebarWidth, setRightPanelWidth } = useAppStore();
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMoveLeft = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingLeft.current) return;
      setSidebarWidth(e.clientX);
    },
    [setSidebarWidth]
  );

  const handleMouseMoveRight = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRight.current) return;
      const windowWidth = window.innerWidth;
      setRightPanelWidth(windowWidth - e.clientX);
    },
    [setRightPanelWidth]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingLeft.current = false;
    isDraggingRight.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleMouseMoveLeft);
    window.removeEventListener('mousemove', handleMouseMoveRight);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMoveLeft, handleMouseMoveRight]);

  const startDragLeft = useCallback(() => {
    isDraggingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMoveLeft);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMoveLeft, handleMouseUp]);

  const startDragRight = useCallback(() => {
    isDraggingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMoveRight);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMoveRight, handleMouseUp]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden">
        <div className="h-12 flex-shrink-0 border-b border-[#1e1e2e] bg-[#0d0d1a]" />
        <div className="flex flex-1 overflow-hidden" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-gray-100 overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div
          className="flex-shrink-0 overflow-hidden border-r border-[#1e1e2e]"
          style={{ width: sidebarWidth }}
        >
          <LeftSidebar />
        </div>

        {/* Left resize handle */}
        <div
          className="w-1 flex-shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/30 transition-colors active:bg-blue-500/50 z-10"
          onMouseDown={startDragLeft}
        />

        {/* Center Panel */}
        <div className="flex-1 overflow-hidden min-w-0">
          <CenterPanel />
        </div>

        {/* Right resize handle */}
        <div
          className="w-1 flex-shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/30 transition-colors active:bg-blue-500/50 z-10"
          onMouseDown={startDragRight}
        />

        {/* Right Panel */}
        <div
          className="flex-shrink-0 overflow-hidden border-l border-[#1e1e2e]"
          style={{ width: rightPanelWidth }}
        >
          <RightPanel />
        </div>
      </div>

      <ImportDialog />
      <EnvironmentManager />
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#1e1e2e',
            border: '1px solid #2e2e3e',
            color: '#e2e8f0',
          },
        }}
      />
    </div>
  );
}
