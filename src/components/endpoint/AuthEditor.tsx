'use client';

import React from 'react';
import { AuthConfig, AuthType } from '@/types/endpoint';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface AuthEditorProps {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apikey', label: 'API Key' },
  { value: 'cookie', label: 'Cookie / Session' },
  { value: 'session', label: 'IBKR Session' },
];

function SecretInput({
  value,
  onChange,
  placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-8 bg-[#111120] border-[#2a2a3e] text-xs text-gray-300 focus-visible:ring-blue-500/50"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
      >
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
  const update = (updates: Partial<AuthConfig>) => onChange({ ...auth, ...updates });

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex flex-wrap gap-1.5">
        {AUTH_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => update({ type: value })}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-md border transition-colors',
              auth.type === value
                ? 'border-blue-500/50 bg-blue-600/10 text-blue-400'
                : 'border-[#2a2a3e] text-gray-600 hover:text-gray-400 hover:border-[#3a3a4e]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Auth fields */}
      {auth.type === 'bearer' && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Token</Label>
          <SecretInput
            value={auth.bearerToken ?? ''}
            onChange={(v) => update({ bearerToken: v })}
            placeholder="Enter bearer token or {{token}}"
          />
          <p className="text-[10px] text-gray-700">Sent as: Authorization: Bearer &lt;token&gt;</p>
        </div>
      )}

      {auth.type === 'basic' && (
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-gray-500">Username</Label>
            <Input
              value={auth.basicUsername ?? ''}
              onChange={(e) => update({ basicUsername: e.target.value })}
              placeholder="username"
              className="mt-1 bg-[#111120] border-[#2a2a3e] text-xs text-gray-300 focus-visible:ring-blue-500/50"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Password</Label>
            <SecretInput
              value={auth.basicPassword ?? ''}
              onChange={(v) => update({ basicPassword: v })}
              placeholder="password"
            />
          </div>
        </div>
      )}

      {auth.type === 'apikey' && (
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-gray-500">Key Name</Label>
            <Input
              value={auth.apiKeyName ?? ''}
              onChange={(e) => update({ apiKeyName: e.target.value })}
              placeholder="X-API-Key"
              className="mt-1 bg-[#111120] border-[#2a2a3e] text-xs text-gray-300 focus-visible:ring-blue-500/50"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Value</Label>
            <SecretInput
              value={auth.apiKeyValue ?? ''}
              onChange={(v) => update({ apiKeyValue: v })}
              placeholder="your-api-key"
            />
          </div>
          <div className="flex gap-2">
            {(['header', 'query', 'cookie'] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => update({ apiKeyLocation: loc })}
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded border transition-colors',
                  auth.apiKeyLocation === loc
                    ? 'border-blue-500/50 bg-blue-600/10 text-blue-400'
                    : 'border-[#2a2a3e] text-gray-600'
                )}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}

      {(auth.type === 'cookie' || auth.type === 'session') && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">
            {auth.type === 'session' ? 'IBKR Session Cookie' : 'Cookie Value'}
          </Label>
          <SecretInput
            value={auth.cookieValue ?? ''}
            onChange={(v) => update({ cookieValue: v })}
            placeholder={auth.type === 'session' ? 'Set via /sso/validate endpoint' : 'cookie=value'}
          />
          {auth.type === 'session' && (
            <p className="text-[10px] text-gray-700">
              For IBKR Web API, authentication is managed via the Gateway/Client Portal session.
              The session cookie is automatically sent with credential: include.
            </p>
          )}
        </div>
      )}

      {auth.type === 'none' && (
        <div className="text-xs text-gray-600 py-2">
          No authentication will be sent with this request.
        </div>
      )}
    </div>
  );
}
