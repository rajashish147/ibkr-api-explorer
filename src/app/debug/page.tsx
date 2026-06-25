'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function DebugPage() {
  const [goldenRequestText, setGoldenRequestText] = useState('');
  const [goldenHeaders, setGoldenHeaders] = useState<Record<string, string>>({});
  
  const [reports, setReports] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const parseGoldenRequest = () => {
    // Basic parser for raw HTTP request string
    try {
      const lines = goldenRequestText.split('\n').map(l => l.trim()).filter(Boolean);
      const headers: Record<string, string> = {};
      lines.forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
          const k = line.substring(0, idx).trim().toLowerCase();
          const v = line.substring(idx + 1).trim();
          headers[k] = v;
        }
      });
      setGoldenHeaders(headers);
    } catch (e) {
      alert('Failed to parse Golden Request');
    }
  };

  const runTest = async (mode: 'A' | 'B' | 'C' | 'D') => {
    setLoading(true);
    try {
      const runSingle = async () => {
        const res = await fetch(`/api/debug/ibkr?mode=${mode}`, {
          method: 'POST',
          headers: mode === 'D' ? { 'x-golden-headers': JSON.stringify(goldenHeaders) } : undefined,
        });
        return await res.json();
      };

      // Run once
      const report1 = await runSingle();
      
      // Replay to ensure it isn't a one-time fluke
      const report2 = await runSingle();

      setReports(prev => ({
        ...prev,
        [mode]: { run1: report1, run2: report2 }
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderDiff = (mode: string) => {
    const report = reports[mode]?.run1;
    if (!report) return null;

    const actualHeaders = report.request?.actualForwardedHeaders || {};
    
    // Compare with Golden
    const missing: string[] = [];
    const extra: string[] = [];
    const diffVal: string[] = [];

    const skipGolden = ['host', 'connection', 'content-length', 'accept-encoding'];

    for (const [k, v] of Object.entries(goldenHeaders)) {
      if (skipGolden.includes(k)) continue;
      if (!actualHeaders[k]) {
        missing.push(k);
      } else if (actualHeaders[k] !== v && k !== 'cookie') {
        diffVal.push(`${k}: Golden="${v}" vs Actual="${actualHeaders[k]}"`);
      }
    }

    for (const k of Object.keys(actualHeaders)) {
      if (skipGolden.includes(k)) continue;
      if (!goldenHeaders[k]) {
        extra.push(k);
      }
    }

    return (
      <div className="mt-4 text-xs">
        <h4 className="font-bold text-gray-200">Comparison with Golden</h4>
        {missing.length > 0 && <div className="text-red-400">Missing: {missing.join(', ')}</div>}
        {extra.length > 0 && <div className="text-yellow-400">Extra: {extra.join(', ')}</div>}
        {diffVal.length > 0 && <div className="text-orange-400">Values Diff: {diffVal.join(' | ')}</div>}
        {missing.length === 0 && extra.length === 0 && diffVal.length === 0 && (
          <div className="text-emerald-400">Perfect Match (excluding hop-by-hop)</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">IBKR Gateway Diagnostic Tool</h1>
      
      {/* Golden Request Section */}
      <div className="bg-[#1a1a2e] p-6 rounded-lg border border-[#2a2a3e] mb-8">
        <h2 className="text-xl font-semibold mb-2 text-yellow-400">Phase 4: Golden Request</h2>
        <p className="text-sm text-gray-400 mb-4">
          Paste the Raw HTTP Request headers from Postman here. This will be used as the baseline.
        </p>
        <textarea
          className="w-full h-32 bg-[#0d0d1a] border border-[#2a2a3e] rounded p-2 text-sm text-gray-300 mb-4 font-mono"
          placeholder="GET /v1/api/iserver/auth/status HTTP/1.1&#10;Host: localhost:5000&#10;Accept: */*&#10;..."
          value={goldenRequestText}
          onChange={(e) => setGoldenRequestText(e.target.value)}
        />
        <Button onClick={parseGoldenRequest}>Parse Golden Request</Button>
        {Object.keys(goldenHeaders).length > 0 && (
          <div className="mt-4 p-4 bg-[#0d0d1a] rounded text-xs text-gray-400">
            Parsed Headers: {Object.keys(goldenHeaders).join(', ')}
          </div>
        )}
      </div>

      {/* Test Panels */}
      <div className="grid grid-cols-2 gap-8">
        
        {/* Test A */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg border border-[#2a2a3e]">
          <h2 className="text-lg font-semibold mb-2 text-blue-400">Test A (Current)</h2>
          <p className="text-sm text-gray-400 mb-4">Forwards all browser headers unmodified.</p>
          <Button onClick={() => runTest('A')} disabled={loading}>Run Test A</Button>
          {reports['A'] && (
            <div className="mt-4">
              <div className="font-bold">Run 1: HTTP {reports['A'].run1.response?.statusCode}</div>
              <div className="font-bold">Run 2: HTTP {reports['A'].run2.response?.statusCode}</div>
              {renderDiff('A')}
            </div>
          )}
        </div>

        {/* Test B */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg border border-[#2a2a3e]">
          <h2 className="text-lg font-semibold mb-2 text-orange-400">Test B (No CORS Headers)</h2>
          <p className="text-sm text-gray-400 mb-4">Strips Origin and Referer.</p>
          <Button onClick={() => runTest('B')} disabled={loading} variant="secondary">Run Test B</Button>
          {reports['B'] && (
            <div className="mt-4">
              <div className="font-bold">Run 1: HTTP {reports['B'].run1.response?.statusCode}</div>
              <div className="font-bold">Run 2: HTTP {reports['B'].run2.response?.statusCode}</div>
              {renderDiff('B')}
            </div>
          )}
        </div>

        {/* Test C */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg border border-[#2a2a3e]">
          <h2 className="text-lg font-semibold mb-2 text-purple-400">Test C (Minimal)</h2>
          <p className="text-sm text-gray-400 mb-4">Strips everything except basic HTTP headers.</p>
          <Button onClick={() => runTest('C')} disabled={loading} variant="outline" className="text-gray-900 bg-white hover:bg-gray-200">Run Test C</Button>
          {reports['C'] && (
            <div className="mt-4">
              <div className="font-bold">Run 1: HTTP {reports['C'].run1.response?.statusCode}</div>
              <div className="font-bold">Run 2: HTTP {reports['C'].run2.response?.statusCode}</div>
              {renderDiff('C')}
            </div>
          )}
        </div>

        {/* Test D */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg border border-[#2a2a3e]">
          <h2 className="text-lg font-semibold mb-2 text-emerald-400">Test D (cURL Replay)</h2>
          <p className="text-sm text-gray-400 mb-4">Executes raw cURL from the Node server using Golden Headers.</p>
          <Button onClick={() => runTest('D')} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">Run Test D</Button>
          {reports['D'] && (
            <div className="mt-4">
              <div className="font-bold">Run 1: HTTP {reports['D'].run1.response?.statusCode}</div>
              <div className="font-bold">Run 2: HTTP {reports['D'].run2.response?.statusCode}</div>
              <div className="mt-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
                Command: {reports['D'].run1.request?.cmd}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Raw Output */}
      {Object.keys(reports).length > 0 && (
        <div className="mt-8 bg-[#1a1a2e] p-6 rounded-lg border border-[#2a2a3e]">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Raw JSON Reports</h2>
          <pre className="bg-[#0d0d1a] p-4 rounded text-xs overflow-auto max-h-[400px] text-gray-300">
            {JSON.stringify(reports, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
