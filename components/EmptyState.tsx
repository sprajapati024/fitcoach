'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-surface-2 p-4">
          <Icon className="h-8 w-8 text-text-muted" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <PrimaryButton onClick={action.onClick} className="min-w-[160px]">
          {action.label}
        </PrimaryButton>
      )}
      {children}
    </div>
  );
}
