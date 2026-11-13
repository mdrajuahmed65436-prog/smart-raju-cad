import { Minus, Plus } from 'lucide-react';
import { LABEL_CLASS } from '@/lib/uiClasses';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export default function Stepper({ label, value, min, max, onChange }: StepperProps) {
  const button =
    'flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-sky-300';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={LABEL_CLASS}>{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label}`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
