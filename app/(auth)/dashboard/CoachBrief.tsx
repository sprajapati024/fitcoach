'use client';

import { Card } from '@/components/Card';

interface CoachBriefProps {
  userId: string;
}

export function CoachBrief({ userId }: CoachBriefProps) {
  void userId;
  // Phase 1: Static placeholder
  // Phase 3: Will fetch from /api/coach/today with AI-generated brief

  return (
    <Card className="space-y-2 bg-bg1 text-fg0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-fg2">Coach Note</h3>
      <p className="text-sm leading-relaxed text-fg1">
        Ready to train? Focus on form and progressive overload today. Let&apos;s get stronger!
      </p>
    </Card>
  );
}
