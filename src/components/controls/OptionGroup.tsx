import { LABEL_CLASS } from '@/lib/uiClasses';

interface OptionGroupProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

export default function OptionGroup<T extends string>({ label, options, value, onChange }: OptionGroupProps<T>) {
  return (
    <div>
      <span className={LABEL_CLASS}>{label}</span>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option)}
              className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                active
                  ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-300'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
