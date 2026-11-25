import type { PoursuiteRecord } from '../types/data';

export interface PoursuiteFilters {
  annee: number | null;
  voieBac: string;
  academie: string;
  genre: string;
}

/** Type d'études agrégé (les secteurs public / privé / non renseigné sont cumulés). */
export interface TypeEtudesStat {
  type: string;
  effectif: number;
  /** Part des néo-bacheliers (0-100). */
  pourcentage: number;
}

export interface PoursuiteStats {
  bacheliers: number;
  poursuivants: number;
  /** Taux global de poursuite (0-100), null si aucun bachelier. */
  tauxPoursuite: number | null;
  parType: TypeEtudesStat[];
}

/** Définition des types d'études affichés (US05) à partir des colonnes du jeu de données. */
export const TYPES_ETUDES: { type: string; value: (r: PoursuiteRecord) => number }[] = [
  { type: 'Université', value: (r) => r.univ },
  { type: 'IUT', value: (r) => r.iut },
  { type: 'CPGE', value: (r) => r.cpgePublic + r.cpgePrive },
  { type: 'STS (BTS)', value: (r) => r.stsPublic + r.stsPrive + r.stsNr },
  { type: 'Autres formations', value: (r) => r.autresPublic + r.autresPrive + r.autresNr },
];

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort(collator.compare);
}

export function listAnnees(records: PoursuiteRecord[]): number[] {
  return [...new Set(records.map((r) => r.annee))].sort((a, b) => b - a);
}

export function listVoiesBac(records: PoursuiteRecord[]): string[] {
  return uniqueSorted(records.map((r) => r.voieBac));
}

export function listAcademiesPoursuite(records: PoursuiteRecord[]): string[] {
  return uniqueSorted(records.map((r) => r.academie));
}

export function listGenres(records: PoursuiteRecord[]): string[] {
  return uniqueSorted(records.map((r) => r.genre));
}

export function filterPoursuite(
  records: PoursuiteRecord[],
  filters: PoursuiteFilters,
): PoursuiteRecord[] {
  return records.filter(
    (r) =>
      (filters.annee === null || r.annee === filters.annee) &&
      (!filters.voieBac || r.voieBac === filters.voieBac) &&
      (!filters.academie || r.academie === filters.academie) &&
      (!filters.genre || r.genre === filters.genre),
  );
}

/**
 * Calcule le pourcentage de néo-bacheliers poursuivant leurs études par type d'études.
 * Les pourcentages sont rapportés au nombre total de bacheliers de la sélection.
 */
export function computePoursuiteStats(records: PoursuiteRecord[]): PoursuiteStats {
  let bacheliers = 0;
  let poursuivants = 0;
  const effectifs = TYPES_ETUDES.map(() => 0);

  for (const r of records) {
    bacheliers += r.bacheliers;
    poursuivants += r.totalPoursuite;
    TYPES_ETUDES.forEach((t, i) => {
      effectifs[i] += t.value(r);
    });
  }

  const pct = (v: number) => (bacheliers > 0 ? (v / bacheliers) * 100 : 0);

  return {
    bacheliers,
    poursuivants,
    tauxPoursuite: bacheliers > 0 ? pct(poursuivants) : null,
    parType: TYPES_ETUDES.map((t, i) => ({
      type: t.type,
      effectif: effectifs[i],
      pourcentage: pct(effectifs[i]),
    })),
  };
}
