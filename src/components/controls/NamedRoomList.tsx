import { Plus, X } from 'lucide-react';
import type { NamedRoom } from '@/types/plan';
import { createId } from '@/lib/planConfig';
import { BUTTON_SECONDARY, INPUT_CLASS, LABEL_CLASS } from '@/lib/uiClasses';

interface NamedRoomListProps {
  label: string;
  items: NamedRoom[];
  min: number;
  max: number;
  placeholder: string;
  onChange: (items: NamedRoom[]) => void;
}

export default function NamedRoomList({ label, items, min, max, placeholder, onChange }: NamedRoomListProps) {
  const update = (id: string, name: string) => onChange(items.map((item) => (item.id === id ? { ...item, name } : item)));
  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));
  const add = () => onChange([...items, { id: createId(), name: `${placeholder} ${items.length + 1}` }]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className={LABEL_CLASS}>
          {label} <span className="normal-case tracking-normal text-slate-400">({items.length})</span>
        </span>
        <button
          type="button"
          onClick={add}
          disabled={items.length >= max}
          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 transition hover:text-sky-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-400"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 animate-fade-in-up">
            <input
              className={INPUT_CLASS}
              value={item.name}
              maxLength={40}
              onChange={(e) => update(item.id, e.target.value)}
              aria-label={`${placeholder} name`}
            />
            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={items.length <= min}
              aria-label={`Remove ${item.name}`}
              className={`${BUTTON_SECONDARY} !px-2 !py-2 hover:!text-rose-600 disabled:opacity-40`}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
