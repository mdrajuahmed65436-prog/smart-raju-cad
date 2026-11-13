import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Box, Download, Loader2 } from 'lucide-react';
import type { Group } from 'three';
import type { FloorPlan } from '@/lib/floorPlan';
import type { Fixtures } from '@/lib/fixtures';
import type { SolarResult } from '@/lib/solar';
import { exportGlb, exportStl } from '@/lib/exporters';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/uiClasses';
import type { PlanConfig, RoofView } from '@/types/plan';
import ModelScene from '@/components/three/ModelScene';

interface ModelViewProps {
  plan: FloorPlan;
  config: PlanConfig;
  solar: SolarResult;
  fixtures: Fixtures;
}

const ROOF_VIEWS: { value: RoofView; label: string }[] = [
  { value: 'solid', label: 'Solid roof' },
  { value: 'transparent', label: 'Transparent' },
  { value: 'hidden', label: 'Hide roof' },
];

export default function ModelView({ plan, config, solar, fixtures }: ModelViewProps) {
  const buildingRef = useRef<Group>(null);
  const [roofView, setRoofView] = useState<RoofView>('solid');
  const [busy, setBusy] = useState<'glb' | 'stl' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const span = Math.max(plan.length, plan.width);

  const runExport = async (kind: 'glb' | 'stl') => {
    if (!buildingRef.current) return;
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'glb') await exportGlb(buildingRef.current, 'smart-raju-cad-model.glb');
      else exportStl(buildingRef.current, 'smart-raju-cad-model.stl');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The 3D model could not be exported.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">3D Model</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Drag to orbit, scroll to zoom. Hide or fade the roof to see inside.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON_SECONDARY} onClick={() => runExport('stl')} disabled={busy !== null}>
            {busy === 'stl' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4" />}
            Export STL
          </button>
          <button type="button" className={BUTTON_PRIMARY} onClick={() => runExport('glb')} disabled={busy !== null}>
            {busy === 'glb' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export GLB
          </button>
        </div>
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900" role="group" aria-label="Roof visibility">
        {ROOF_VIEWS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={roofView === option.value}
            onClick={() => setRoofView(option.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
              roofView === option.value
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}

      <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200 shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 sm:h-[560px]">
        <Canvas dpr={[1, 2]} camera={{ position: [span * 0.9, span * 0.7, span * 0.9], fov: 45, near: 0.1, far: span * 20 }}>
          <ModelScene
            plan={plan}
            roofType={config.roofType}
            roofView={roofView}
            doorStyle={config.doorStyle}
            windowStyle={config.windowStyle}
            solar={solar}
            fixtures={fixtures}
            buildingRef={buildingRef}
          />
        </Canvas>
      </div>
    </div>
  );
}
