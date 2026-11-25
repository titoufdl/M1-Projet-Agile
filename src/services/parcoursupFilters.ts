import type { ParcoursupRecord } from '../types/data';

/** Axe d'analyse principal de la vue Parcoursup (US02). */
export type ParcoursupAxis = 'formations' | 'candidatures';

export interface ParcoursupFilters {
  academie: string;
  etablissement: string;
  recherche: string;
}

export const EMPTY_FILTERS: ParcoursupFilters = {
  academie: '',
  etablissement: '',
  recherche: '',
};

export interface ParcoursupTotals {
  formations: number;
  etablissements: number;
  places: number;
  candidatures: number;
  /** Candidatures par place offerte (null si aucune place). */
  pression: number | null;
}

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Liste triée des académies présentes dans les données. */
export function listAcademies(records: ParcoursupRecord[]): string[] {
  return [...new Set(records.map((r) => r.academie).filter(Boolean))].sort(collator.compare);
}

/** Liste triée des établissements, éventuellement restreinte à une académie. */
export function listEtablissements(records: ParcoursupRecord[], academie: string): string[] {
  const source = academie ? records.filter((r) => r.academie === academie) : records;
  return [...new Set(source.map((r) => r.etablissement).filter(Boolean))].sort(collator.compare);
}

/** Applique les filtres académie / établissement / recherche libre. */
export function filterParcoursup(
  records: ParcoursupRecord[],
  filters: ParcoursupFilters,
): ParcoursupRecord[] {
  const query = normalize(filters.recherche.trim());
  return records.filter(
    (r) =>
      (!filters.academie || r.academie === filters.academie) &&
      (!filters.etablissement || r.etablissement === filters.etablissement) &&
      (!query || normalize(r.formationDetail).includes(query)),
  );
}

/** Trie selon l'axe choisi : places offertes ou nombre de candidatures (décroissant). */
export function sortByAxis(records: ParcoursupRecord[], axis: ParcoursupAxis): ParcoursupRecord[] {
  const key: keyof ParcoursupRecord = axis === 'formations' ? 'capacite' : 'voeuxTotal';
  return [...records].sort((a, b) => (b[key] as number) - (a[key] as number));
}

export function computeTotals(records: ParcoursupRecord[]): ParcoursupTotals {
  let places = 0;
  let candidatures = 0;
  const etablissements = new Set<string>();
  for (const r of records) {
    places += r.capacite;
    candidatures += r.voeuxTotal;
    etablissements.add(r.codeUai);
  }
  return {
    formations: records.length,
    etablissements: etablissements.size,
    places,
    candidatures,
    pression: places > 0 ? candidatures / places : null,
  };
}
