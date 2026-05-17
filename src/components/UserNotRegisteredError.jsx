import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-white/60 mb-6">
          You don't have permission to access this application. Please contact an administrator to get access.
        </p>
        <div className="text-left bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
          <p className="text-sm text-white/50">Troubleshooting:</p>
          <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
            <li>Verify you're using the correct account</li>
            <li>Try logging out and back in</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
}