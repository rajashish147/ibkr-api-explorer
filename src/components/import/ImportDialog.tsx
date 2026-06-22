'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useOpenApiParser } from '@/hooks/useOpenApiParser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Link, FileCode2, Loader2, CheckCircle2, AlertCircle, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ImportDialog() {
  const { isImportOpen, setImportOpen } = useAppStore();
  const { isLoading, error, parseFromFile, parseFromUrl, parseFromText } = useOpenApiParser();
  const [url, setUrl] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [lastResult, setLastResult] = useState<{ endpointCount: number; title: string } | null>(null);

  const handleFileImport = useCallback(async (file: File) => {
    const result = await parseFromFile(file);
    if (result) {
      setLastResult({ endpointCount: result.endpointCount, title: result.title });
      toast.success(`Imported ${result.endpointCount} endpoints from ${result.title}`);
      setTimeout(() => setImportOpen(false), 1000);
    }
  }, [parseFromFile, setImportOpen]);

  const handleUrlImport = async () => {
    if (!url.trim()) return;
    const result = await parseFromUrl(url.trim());
    if (result) {
      setLastResult({ endpointCount: result.endpointCount, title: result.title });
      toast.success(`Imported ${result.endpointCount} endpoints from ${result.title}`);
      setTimeout(() => setImportOpen(false), 1000);
    }
  };

  const handlePasteImport = async () => {
    if (!pasteContent.trim()) return;
    const result = await parseFromText(pasteContent, 'paste');
    if (result) {
      setLastResult({ endpointCount: result.endpointCount, title: result.title });
      toast.success(`Imported ${result.endpointCount} endpoints`);
      setTimeout(() => setImportOpen(false), 1000);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFileImport(file);
  }, [handleFileImport]);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFileImport(file);
  }, [handleFileImport]);

  return (
    <Dialog open={isImportOpen} onOpenChange={setImportOpen}>
      <DialogContent className="bg-[#0d0d1a] border-[#1e1e2e] text-gray-200 max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FileJson className="w-5 h-5 text-blue-400" />
            Import OpenAPI Specification
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            Supports OpenAPI 3.x and Swagger 2.0. JSON and YAML formats accepted.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="mt-2">
          <TabsList className="bg-[#111120] border border-[#1e1e2e] grid grid-cols-3">
            <TabsTrigger value="file" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Upload className="w-3.5 h-3.5 mr-1.5" /> File
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Link className="w-3.5 h-3.5 mr-1.5" /> URL
            </TabsTrigger>
            <TabsTrigger value="paste" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileCode2 className="w-3.5 h-3.5 mr-1.5" /> Paste
            </TabsTrigger>
          </TabsList>

          {/* File upload */}
          <TabsContent value="file" className="mt-4">
            <label
              className={cn(
                'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors',
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-[#2a2a3e] hover:border-blue-500/50 hover:bg-[#111120]'
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input type="file" accept=".json,.yaml,.yml" className="hidden" onChange={handleFileInputChange} />
              {isLoading ? (
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
              ) : lastResult ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
              ) : (
                <Upload className="w-10 h-10 text-gray-600 mb-3" />
              )}
              <p className="text-sm text-gray-400 font-medium">
                {isLoading ? 'Parsing...' : lastResult ? `✓ ${lastResult.endpointCount} endpoints loaded` : 'Drop your OpenAPI file here'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {isLoading ? '' : 'or click to browse — .json, .yaml, .yml'}
              </p>
            </label>
          </TabsContent>

          {/* URL import */}
          <TabsContent value="url" className="mt-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-gray-500">OpenAPI Specification URL</label>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/api/openapi.json"
                  className="flex-1 bg-[#111120] border-[#2a2a3e] text-sm text-gray-300 focus-visible:ring-blue-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                />
                <Button
                  onClick={handleUrlImport}
                  disabled={isLoading || !url.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import'}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-gray-600 font-medium">Quick import examples:</p>
              {[
                { label: 'Petstore (OpenAPI 3.0)', url: 'https://petstore3.swagger.io/api/v3/openapi.json' },
                { label: 'Petstore (Swagger 2.0)', url: 'https://petstore.swagger.io/v2/swagger.json' },
              ].map((ex) => (
                <button
                  key={ex.url}
                  onClick={() => setUrl(ex.url)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors block"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Paste */}
          <TabsContent value="paste" className="mt-4 space-y-3">
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste your OpenAPI JSON or YAML here..."
              className="w-full h-48 bg-[#111120] border border-[#2a2a3e] rounded-lg p-3 text-xs text-gray-300 font-mono focus:outline-none focus:border-blue-500/50 resize-none placeholder:text-gray-700"
            />
            <Button
              onClick={handlePasteImport}
              disabled={isLoading || !pasteContent.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Parsing...</>
              ) : (
                'Parse & Import'
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
