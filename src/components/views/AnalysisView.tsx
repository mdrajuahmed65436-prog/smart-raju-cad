import { useMemo, useState } from 'react';
import { FileText, Fan, Lightbulb, Sun } from 'lucide-react';
import type { FloorPlan } from '@/lib/floorPlan';
import type { Fixtures } from '@/lib/fixtures';
import type { SolarResult } from '@/lib/solar';
import { buildBillOfMaterials } from '@/lib/materials';
import { downloadReportPdf, type ReportSection } from '@/lib/exporters';
import { BUTTON_PRIMARY } from '@/lib/uiClasses';
import type { PlanConfig } from '@/types/plan';

interface AnalysisViewProps {
  plan: FloorPlan;
  config: PlanConfig;
  solar: SolarResult;
  fixtures: Fixtures;
}

interface StatProps {
  label: string;
  value: string;
  hint?: string;
}

function Stat({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

const number = (n: number, digits = 0) => n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });

export default function AnalysisView({ plan, config, solar, fixtures }: AnalysisViewProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bom = useMemo(() => buildBillOfMaterials(plan, config, solar, fixtures), [plan, config, solar, fixtures]);
  const bomSections = useMemo(() => [...new Set(bom.map((row) => row.section))], [bom]);

  const exportReport = () => {
    setExporting(true);
    setError(null);
    try {
      const sections: ReportSection[] = [
        {
          heading: 'Plot and rooms',
          lines: [
            `Plot: ${config.lengthFt} ft x ${config.widthFt} ft (${number(plan.footprintArea)} sq ft)`,
            `Bedrooms: ${config.bedrooms.map((b) => b.name).join(', ')}`,
            `Bathrooms: ${config.bathrooms}, Kitchens: ${config.kitchens}, Dining: ${config.diningRooms.length}`,
            `Staircase: ${config.staircaseType}, ${config.staircasePosition}. Roof: ${config.roofType}`,
          ],
        },
        {
          heading: 'Solar',
          lines: [
            `Panels: ${solar.panelCount} (${number(solar.kWp, 2)} kWp)`,
            `Daily generation: ${number(solar.dailyKwh, 1)} kWh at ${config.sunHours} sun hours`,
            `Monthly: ${number(solar.monthlyKwh)} kWh, Annual: ${number(solar.annualKwh)} kWh`,
          ],
        },
        {
          heading: 'Fixtures',
          lines: [`Ceiling fans: ${fixtures.fans.length}`, `LED ceiling lights: ${fixtures.lights.length}`],
        },
        ...bomSections.map((section) => ({
          heading: `Bill of materials: ${section}`,
          lines: bom
            .filter((row) => row.section === section)
            .map((row) => `${row.item}: ${number(row.quantity)} ${row.unit}`),
        })),
      ];
      downloadReportPdf('Smart Raju CAD Material and Solar Report', sections, 'smart-raju-cad-report.pdf');
    } catch {
      setError('The report could not be created. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Solar, fixtures and materials</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Estimates based on your plan, roof and sun hours.</p>
        </div>
        <button type="button" className={BUTTON_PRIMARY} onClick={exportReport} disabled={exporting}>
          <FileText className="h-4 w-4" />
          Export report PDF
        </button>
      </div>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Panels" value={number(solar.panelCount)} hint={`${number(solar.kWp, 2)} kWp system`} />
        <Stat label="Daily output" value={`${number(solar.dailyKwh, 1)} kWh`} hint={`${config.sunHours} sun hours`} />
        <Stat label="Monthly output" value={`${number(solar.monthlyKwh)} kWh`} />
        <Stat label="Annual output" value={`${number(solar.annualKwh)} kWh`} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Fan className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Ceiling fans ({fixtures.fans.length})
          </h3>
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            {fixtures.fans.map((fan) => (
              <li key={fan.id}>{fan.roomName}</li>
            ))}
            {fixtures.fans.length === 0 && <li>No fans in this plan.</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-amber-500" /> Lights ({fixtures.lights.length})
          </h3>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            {[...new Set(fixtures.lights.map((light) => light.roomName))].map((room) => (
              <li key={room}>
                {room}: {fixtures.lights.filter((light) => light.roomName === room).length}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Sun className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Bill of materials</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-semibold">Section</th>
                <th className="px-4 py-2 font-semibold">Item</th>
                <th className="px-4 py-2 text-right font-semibold">Quantity</th>
                <th className="px-4 py-2 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {bom.map((row) => (
                <tr key={`${row.section}-${row.item}`} className="text-slate-700 dark:text-slate-200">
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{row.section}</td>
                  <td className="px-4 py-2.5 font-medium">{row.item}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                    {number(row.quantity)} {row.unit}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
