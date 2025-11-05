'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-3 py-2 text-xs text-error-light',
        'bg-error-bg border border-error/40 rounded-lg',
        'animate-fade-in',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
      {error && <FormError message={error} />}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full px-4 py-3 rounded-xl transition-all',
        'bg-surface-0 border text-text-primary placeholder:text-text-muted',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
        error
          ? 'border-error/40 bg-error-bg focus:border-error'
          : 'border-surface-border focus:border-cyan-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full px-4 py-3 rounded-xl transition-all resize-none',
        'bg-surface-0 border text-text-primary placeholder:text-text-muted',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
        error
          ? 'border-error/40 bg-error-bg focus:border-error'
          : 'border-surface-border focus:border-cyan-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}
