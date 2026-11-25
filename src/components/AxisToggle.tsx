import { GraduationCap, Users } from 'lucide-react';
import type { ParcoursupAxis } from '../services/parcoursupFilters';

interface AxisToggleProps {
  value: ParcoursupAxis;
  onChange: (axis: ParcoursupAxis) => void;
}

const OPTIONS: { value: ParcoursupAxis; label: string; Icon: typeof Users }[] = [
  { value: 'formations', label: 'Formations', Icon: GraduationCap },
  { value: 'candidatures', label: 'Candidatures', Icon: Users },
];

/** Sélecteur de l'axe principal d'analyse (Formations ou Candidatures). */
export default function AxisToggle({ value, onChange }: AxisToggleProps) {
  return (
    <div role="radiogroup" aria-label="Axe d'analyse" className="inline-flex rounded-lg bg-slate-100 p-1">
      {OPTIONS.map(({ value: option, label, Icon }) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              active ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
