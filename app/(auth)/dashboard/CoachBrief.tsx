'use client';

interface CoachBriefProps {
  userId: string;
}

export function CoachBrief({ userId }: CoachBriefProps) {
  // Phase 1: Static placeholder
  // Phase 3: Will fetch from /api/coach/today with AI-generated brief

  return (
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4 mb-4">
      <p className="text-sm text-gray-700 leading-relaxed">
        Ready to train? Focus on form and progressive overload today. Let's get stronger!
      </p>
    </div>
  );
}
