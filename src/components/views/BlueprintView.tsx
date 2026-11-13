import { useRef, useState } from 'react';
import { Download, FileImage, Loader2 } from 'lucide-react';
import type { FloorPlan } from '@/lib/floorPlan';
import { downloadBlueprintPdf, downloadPng, svgToPng } from '@/lib/exporters';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/uiClasses';
import BlueprintSvg from '@/components/views/BlueprintSvg';

interface BlueprintViewProps {
  plan: FloorPlan;
}

export default function BlueprintView({ plan }: BlueprintViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runExport = async (kind: 'png' | 'pdf') => {
    if (!svgRef.current) return;
    setBusy(kind);
    setError(null);
    try {
      const image = await svgToPng(svgRef.current);
      if (kind === 'png') downloadPng(image, 'smart-raju-cad-blueprint.png');
      else downloadBlueprintPdf(image, 'smart-raju-cad-blueprint.pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The blueprint could not be exported.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">2D Blueprint</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Scaled ground floor plan with doors, windows, balconies and room areas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON_SECONDARY} onClick={() => runExport('png')} disabled={busy !== null}>
            {busy === 'png' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileImage className="h-4 w-4" />}
            Export PNG
          </button>
          <button type="button" className={BUTTON_PRIMARY} onClick={() => runExport('pdf')} disabled={busy !== null}>
            {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export PDF
          </button>
        </div>
      </div>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#12395c] p-2 shadow-lg dark:border-slate-800 sm:p-4">
        <BlueprintSvg plan={plan} svgRef={svgRef} />
      </div>
    </div>
  );
}
