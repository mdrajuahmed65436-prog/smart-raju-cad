import { AlertTriangle, Building2, Home, Palette, Ruler } from 'lucide-react';
import {
  BALCONY_SIDES,
  DOOR_STYLES,
  LIMITS,
  ROOF_TYPES,
  STAIRCASE_POSITIONS,
  STAIRCASE_TYPES,
  WINDOW_STYLES,
  type BalconySide,
  type PlanConfig,
} from '@/types/plan';
import { LABEL_CLASS } from '@/lib/uiClasses';
import CollapsibleSection from '@/components/controls/CollapsibleSection';
import NamedRoomList from '@/components/controls/NamedRoomList';
import NumberField from '@/components/controls/NumberField';
import OptionGroup from '@/components/controls/OptionGroup';
import Stepper from '@/components/controls/Stepper';

interface ControlPanelProps {
  config: PlanConfig;
  roomScale: number;
  onChange: (patch: Partial<PlanConfig>) => void;
}

export default function ControlPanel({ config, roomScale, onChange }: ControlPanelProps) {
  const toggleBalcony = (side: BalconySide) => {
    const next = config.balconies.includes(side)
      ? config.balconies.filter((s) => s !== side)
      : BALCONY_SIDES.filter((s) => s === side || config.balconies.includes(s));
    onChange({ balconies: next });
  };

  return (
    <div className="space-y-3">
      <CollapsibleSection title="Land and Floor" icon={<Ruler className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Length (X)"
            value={config.lengthFt}
            min={LIMITS.dimMin}
            max={LIMITS.dimMax}
            suffix="ft"
            onChange={(lengthFt) => onChange({ lengthFt })}
          />
          <NumberField
            label="Width (Y)"
            value={config.widthFt}
            min={LIMITS.dimMin}
            max={LIMITS.dimMax}
            suffix="ft"
            onChange={(widthFt) => onChange({ widthFt })}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Footprint: <span className="font-semibold text-slate-700 dark:text-slate-200">{config.lengthFt * config.widthFt} sq ft</span>
        </p>
        {roomScale < 0.75 && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            This many rooms is tight for the footprint. Rooms will be compact; consider a larger plot.
          </p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Rooms" icon={<Home className="h-4 w-4" />}>
        <NamedRoomList
          label="Bedrooms"
          items={config.bedrooms}
          min={1}
          max={LIMITS.bedroomsMax}
          placeholder="Bedroom"
          onChange={(bedrooms) => onChange({ bedrooms })}
        />
        <Stepper
          label="Bathrooms"
          value={config.bathrooms}
          min={1}
          max={LIMITS.bathroomsMax}
          onChange={(bathrooms) => onChange({ bathrooms })}
        />
        <Stepper
          label="Kitchens"
          value={config.kitchens}
          min={1}
          max={LIMITS.kitchensMax}
          onChange={(kitchens) => onChange({ kitchens })}
        />
        <NamedRoomList
          label="Dining rooms"
          items={config.diningRooms}
          min={0}
          max={LIMITS.diningMax}
          placeholder="Dining"
          onChange={(diningRooms) => onChange({ diningRooms })}
        />
        <div>
          <span className={LABEL_CLASS}>Balconies</span>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {BALCONY_SIDES.map((side) => {
              const active = config.balconies.includes(side);
              return (
                <button
                  key={side}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleBalcony(side)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    active
                      ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {side}
                </button>
              );
            })}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Architecture" icon={<Building2 className="h-4 w-4" />}>
        <OptionGroup
          label="Staircase position"
          options={STAIRCASE_POSITIONS}
          value={config.staircasePosition}
          onChange={(staircasePosition) => onChange({ staircasePosition })}
        />
        <OptionGroup
          label="Staircase type"
          options={STAIRCASE_TYPES}
          value={config.staircaseType}
          onChange={(staircaseType) => onChange({ staircaseType })}
        />
        <OptionGroup
          label="Roof type"
          options={ROOF_TYPES}
          value={config.roofType}
          onChange={(roofType) => onChange({ roofType })}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Doors and Windows" icon={<Palette className="h-4 w-4" />} defaultOpen={false}>
        <OptionGroup
          label="Door style"
          options={DOOR_STYLES}
          value={config.doorStyle}
          onChange={(doorStyle) => onChange({ doorStyle })}
        />
        <OptionGroup
          label="Window style"
          options={WINDOW_STYLES}
          value={config.windowStyle}
          onChange={(windowStyle) => onChange({ windowStyle })}
        />
      </CollapsibleSection>
    </div>
  );
}
