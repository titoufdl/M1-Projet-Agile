import { useMemo, useState } from 'react';
import type { ParcoursupRecord } from '../../types/data';
import AxeSelector from './AxeSelector';
import { AXES, calculerIndicateurs, type Axe } from './axeIndicateurs';

interface AxeIndicateursProps {
  /** Formations à analyser (déjà filtrées par académie/établissement si besoin). */
  records: ParcoursupRecord[];
  /** Mode contrôlé (optionnel) : à fournir si l'axe doit être partagé avec d'autres vues. */
  axe?: Axe;
  onAxeChange?: (axe: Axe) => void;
  /** Axe initial en mode non contrôlé. */
  axeInitial?: Axe;
}

/**
 * US : Choisir l'axe Formations ou Candidatures pour centrer l'affichage.
 * CA : le choix de l'axe change les indicateurs affichés.
 */
export default function AxeIndicateurs({
  records,
  axe: axeControle,
  onAxeChange,
  axeInitial = 'formations',
}: AxeIndicateursProps) {
  const [axeInterne, setAxeInterne] = useState<Axe>(axeInitial);
  const axe = axeControle ?? axeInterne;

  const changerAxe = (nouvel: Axe) => {
    if (axeControle === undefined) setAxeInterne(nouvel);
    onAxeChange?.(nouvel);
  };

  const indicateurs = useMemo(() => calculerIndicateurs(axe, records), [axe, records]);
  const description = AXES.find((a) => a.value === axe)?.description;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Indicateurs clés</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <AxeSelector value={axe} onChange={changerAxe} />
      </div>

      <div
        key={axe}
        aria-live="polite"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        {indicateurs.map((ind) => (
          <article
            key={ind.id}
            data-testid={`indicateur-${ind.id}`}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{ind.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{ind.valeur}</p>
            {ind.detail && <p className="mt-1 text-xs text-slate-500">{ind.detail}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
