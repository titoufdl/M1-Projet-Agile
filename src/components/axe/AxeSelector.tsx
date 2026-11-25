import { GraduationCap, Users } from 'lucide-react';
import { AXES, type Axe } from './axeIndicateurs';

interface AxeSelectorProps {
  value: Axe;
  onChange: (axe: Axe) => void;
}

const ICONES = { formations: GraduationCap, candidatures: Users } as const;

/** Bascule segmentée Formations / Candidatures. */
export default function AxeSelector({ value, onChange }: AxeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Axe d'analyse"
      className="inline-flex rounded-xl bg-slate-100 p-1"
    >
      {AXES.map((axe) => {
        const Icone = ICONES[axe.value];
        const actif = axe.value === value;
        return (
          <button
            key={axe.value}
            type="button"
            role="radio"
            aria-checked={actif}
            title={axe.description}
            onClick={() => onChange(axe.value)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              actif ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icone className="h-4 w-4" aria-hidden />
            {axe.label}
          </button>
        );
      })}
    </div>
  );
}
