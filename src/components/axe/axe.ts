/** Axe d'analyse choisi par l'utilisateur. */
export type Axe = 'formations' | 'candidatures';

export const AXES: { value: Axe; label: string }[] = [
  { value: 'formations', label: 'Formations' },
  { value: 'candidatures', label: 'Candidatures' },
];
