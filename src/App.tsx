import { useCallback, useMemo, useState } from 'react';
import { BarChart3, Box, Ruler, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { DEFAULT_PLAN_CONFIG } from '@/lib/planConfig';
import { computeFloorPlan } from '@/lib/floorPlan';
import { computeSolar } from '@/lib/solar';
import { computeFixtures } from '@/lib/fixtures';
import type { PlanConfig } from '@/types/plan';
import Header from '@/components/layout/Header';
import ControlPanel from '@/components/controls/ControlPanel';
import BlueprintView from '@/components/views/BlueprintView';
import ModelView from '@/components/views/ModelView';
import AnalysisView from '@/components/views/AnalysisView';
import AboutModal from '@/components/about/AboutModal';

type TabId = 'blueprint' | 'model' | 'analysis';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'blueprint', label: '2D Blueprint', icon: Ruler },
  { id: 'model', label: '3D Model', icon: Box },
  { id: 'analysis', label: 'Solar & Materials', icon: BarChart3 },
];

function App() {
  const { theme, toggleTheme } = useTheme();
  const [config, setConfig] = useState<PlanConfig>(DEFAULT_PLAN_CONFIG);
  const [activeTab, setActiveTab] = useState<TabId>('blueprint');
  const [aboutOpen, setAboutOpen] = useState(false);

  const updateConfig = useCallback((patch: Partial<PlanConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  }, []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);

  const plan = useMemo(() => computeFloorPlan(config), [config]);
  const solar = useMemo(() => computeSolar(plan, config.roofType, config.sunHours), [plan, config.roofType, config.sunHours]);
  const fixtures = useMemo(() => computeFixtures(plan), [plan]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Header theme={theme} onToggleTheme={toggleTheme} onOpenAbout={() => setAboutOpen(true)} />

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:py-8">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <SlidersHorizontal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Design inputs
          </div>
          <ControlPanel config={config} roomScale={plan.roomScale} onChange={updateConfig} />
        </aside>

        <main className="min-w-0 space-y-5">
          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900" role="tablist" aria-label="Views">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    selected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div role="tabpanel">
            {activeTab === 'blueprint' && <BlueprintView plan={plan} />}
            {activeTab === 'model' && <ModelView plan={plan} config={config} solar={solar} fixtures={fixtures} />}
            {activeTab === 'analysis' && <AnalysisView plan={plan} config={config} solar={solar} fixtures={fixtures} />}
          </div>
        </main>
      </div>

      <AboutModal open={aboutOpen} onClose={closeAbout} />
    </div>
  );
}

export default App;
