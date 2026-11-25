import type { PoursuiteRecord } from '../types/data';

export type TypeEtudeId = 'univ' | 'sts' | 'autres' | 'iut' | 'cpge';

export interface TypeEtudeStat {
  id: TypeEtudeId;
  label: string;
  shortLabel: string;
  effectif: number;
  /** Pourcentage par rapport au nombre total de néo-bacheliers. */
  pourcentageBacheliers: number;
  /** Part parmi les néo-bacheliers poursuivant leurs études. */
  pourcentagePoursuivants: number;
  color: string;
}

export interface PoursuiteParTypeSummary {
  totalBacheliers: number;
  totalPoursuite: number;
  tauxPoursuiteGlobal: number;
  sansPoursuiteEffectif: number;
  sansPoursuitePourcentage: number;
  parType: TypeEtudeStat[];
}

const TYPE_META: Array<{
  id: TypeEtudeId;
  label: string;
  shortLabel: string;
  color: string;
  extract: (r: PoursuiteRecord) => number;
}> = [
  {
    id: 'univ',
    label: 'Université (hors IUT)',
    shortLabel: 'Université',
    color: '#4f46e5',
    extract: (r) => r.univ,
  },
  {
    id: 'sts',
    label: 'STS / BTS',
    shortLabel: 'STS / BTS',
    color: '#0891b2',
    extract: (r) => r.stsPublic + r.stsPrive + r.stsNr,
  },
  {
    id: 'autres',
    label: 'Autres formations',
    shortLabel: 'Autres',
    color: '#6366f1',
    extract: (r) => r.autresPublic + r.autresPrive + r.autresNr,
  },
  {
    id: 'iut',
    label: 'IUT (BUT / DUT)',
    shortLabel: 'IUT',
    color: '#0d9488',
    extract: (r) => r.iut,
  },
  {
    id: 'cpge',
    label: 'CPGE (Classes prépa)',
    shortLabel: 'CPGE',
    color: '#d97706',
    extract: (r) => r.cpgePublic + r.cpgePrive,
  },
];

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/** Liste les années disponibles par ordre décroissant. */
export function listPoursuiteAnnees(records: PoursuiteRecord[]): number[] {
  const set = new Set<number>();
  for (const r of records) {
    if (r.annee > 0) set.add(r.annee);
  }
  return Array.from(set).sort((a, b) => b - a);
}

/**
 * Calcule le pourcentage et l'effectif de poursuite d'études
 * par type de formation (Université, IUT, CPGE, STS/BTS, Autres).
 */
export function computePoursuiteParType(records: PoursuiteRecord[]): PoursuiteParTypeSummary {
  let totalBacheliers = 0;
  let totalPoursuite = 0;

  const totalsByType: Record<TypeEtudeId, number> = {
    univ: 0,
    sts: 0,
    autres: 0,
    iut: 0,
    cpge: 0,
  };

  for (const r of records) {
    totalBacheliers += r.bacheliers;
    totalPoursuite += r.totalPoursuite;
    for (const meta of TYPE_META) {
      totalsByType[meta.id] += meta.extract(r);
    }
  }

  const parType: TypeEtudeStat[] = TYPE_META.map((meta) => {
    const effectif = Math.round(totalsByType[meta.id]);
    return {
      id: meta.id,
      label: meta.label,
      shortLabel: meta.shortLabel,
      effectif,
      pourcentageBacheliers: pct(totalsByType[meta.id], totalBacheliers),
      pourcentagePoursuivants: pct(totalsByType[meta.id], totalPoursuite),
      color: meta.color,
    };
  }).sort((a, b) => b.pourcentageBacheliers - a.pourcentageBacheliers);

  const sansPoursuiteEffectif = Math.max(0, Math.round(totalBacheliers - totalPoursuite));

  return {
    totalBacheliers: Math.round(totalBacheliers),
    totalPoursuite: Math.round(totalPoursuite),
    tauxPoursuiteGlobal: pct(totalPoursuite, totalBacheliers),
    sansPoursuiteEffectif,
    sansPoursuitePourcentage: pct(Math.max(0, totalBacheliers - totalPoursuite), totalBacheliers),
    parType,
  };
}
