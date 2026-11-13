import { Moon, Sun, Info, Compass } from 'lucide-react';
import type { Theme } from '@/hooks/useTheme';
import { BUTTON_SECONDARY } from '@/lib/uiClasses';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenAbout: () => void;
}

export default function Header({ theme, onToggleTheme, onOpenAbout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md">
            <Compass className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100 sm:text-lg">Smart Raju CAD</h1>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Generate 2D, 3D Blueprints &amp; Smart Architectural Designs</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className={BUTTON_SECONDARY} onClick={onOpenAbout}>
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">About the Creator</span>
            <span className="sm:hidden">About</span>
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-sky-400 hover:text-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-sky-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
