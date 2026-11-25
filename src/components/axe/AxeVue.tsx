import { useState, type ReactNode } from 'react';
import AxeSelector from './AxeSelector';
import type { Axe } from './axe';

interface AxeVueProps {
  /** Vue affichée quand l'axe Formations est sélectionné. */
  formations: ReactNode;
  /** Vue affichée quand l'axe Candidatures est sélectionné. */
  candidatures: ReactNode;
  /** Mode contrôlé (optionnel) si l'axe doit être partagé avec d'autres composants. */
  axe?: Axe;
  onAxeChange?: (axe: Axe) => void;
  axeInitial?: Axe;
}

/**
 * US : Choisir l'axe Formations ou Candidatures pour centrer l'affichage.
 * CA : le choix de l'axe change les indicateurs affichés.
 */
export default function AxeVue({
  formations,
  candidatures,
  axe: axeControle,
  onAxeChange,
  axeInitial = 'formations',
}: AxeVueProps) {
  const [axeInterne, setAxeInterne] = useState<Axe>(axeInitial);
  const axe = axeControle ?? axeInterne;

  const changerAxe = (nouvel: Axe) => {
    if (axeControle === undefined) setAxeInterne(nouvel);
    onAxeChange?.(nouvel);
  };

  return (
    <section className="space-y-4">
      <AxeSelector value={axe} onChange={changerAxe} />
      <div aria-live="polite">{axe === 'formations' ? formations : candidatures}</div>
    </section>
  );
}
