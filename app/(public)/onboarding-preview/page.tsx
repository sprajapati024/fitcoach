'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OnboardingFormNew } from './OnboardingFormNew';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function OnboardingPreviewPage() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const handlePreviewSubmit = (data: any) => {
    console.log('🎨 Preview Mode - Form Data:', data);
    setFormData(data);
    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 px-4 py-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 mx-auto">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Onboarding Complete!</h1>
            <p className="text-gray-400">This was a preview - no data was saved.</p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Form Data Preview</p>
            <pre className="text-xs text-gray-300 overflow-auto max-h-64">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Preview Mode Banner */}
      <div className="sticky top-0 z-50 border-b border-yellow-500/20 bg-yellow-500/10 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <p className="text-xs font-medium text-yellow-500 sm:text-sm">
              Preview Mode - Changes won't be saved
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-medium text-gray-400 hover:text-white transition"
          >
            Exit
          </Link>
        </div>
      </div>

      <OnboardingFormNew onSubmit={handlePreviewSubmit} isPreview={true} />
    </div>
  );
}
