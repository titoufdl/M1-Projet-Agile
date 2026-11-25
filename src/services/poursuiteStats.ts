import type { PoursuiteRecord } from '../types/data';

export type TypeEtudeId = 'univ' | 'sts' | 'autres' | 'iut' | 'cpge';

export interface PoursuiteFilters {
  annee: number | null;
  voieBac: string;
  academie: string;
  genre: string;
}

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

export interface SecteurStat {
  id: 'public' | 'prive' | 'nr';
  label: string;
  effectif: number;
  pourcentageBacheliers: number;
  pourcentagePoursuivants: number;
  color: string;
}

export interface FiliereSecteurStat {
  filiere: string;
  publicPct: number;
  privePct: number;
  nrPct: number;
  publicEffectif: number;
  priveEffectif: number;
  nrEffectif: number;
}

export interface PoursuitePublicPriveSummary {
  totalBacheliers: number;
  totalPoursuite: number;
  secteurPublic: SecteurStat;
  secteurPrive: SecteurStat;
  secteurNr: SecteurStat;
  secteurs: SecteurStat[];
  parFiliere: FiliereSecteurStat[];
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

const collator = new Intl.Collator('fr', { sensitivity: 'base' });

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort(collator.compare);
}

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

/**
 * Compare les poursuites d'études entre secteur public et secteur privé
 * (globalement et par grande filière).
 */
export function computePoursuitePublicPrive(records: PoursuiteRecord[]): PoursuitePublicPriveSummary {
  let totalBacheliers = 0;
  let totalPoursuite = 0;
  let totalPublic = 0;
  let totalPrive = 0;
  let totalNr = 0;

  let univ = 0;
  let iut = 0;
  let cpgePublic = 0;
  let cpgePrive = 0;
  let stsPublic = 0;
  let stsPrive = 0;
  let stsNr = 0;
  let autresPublic = 0;
  let autresPrive = 0;
  let autresNr = 0;

  for (const r of records) {
    totalBacheliers += r.bacheliers;
    totalPoursuite += r.totalPoursuite;
    totalPublic += r.totalPublic;
    totalPrive += r.totalPrive;
    totalNr += r.totalNr;

    univ += r.univ;
    iut += r.iut;
    cpgePublic += r.cpgePublic;
    cpgePrive += r.cpgePrive;
    stsPublic += r.stsPublic;
    stsPrive += r.stsPrive;
    stsNr += r.stsNr;
    autresPublic += r.autresPublic;
    autresPrive += r.autresPrive;
    autresNr += r.autresNr;
  }

  const secteurPublic: SecteurStat = {
    id: 'public',
    label: 'Secteur public',
    effectif: Math.round(totalPublic),
    pourcentageBacheliers: pct(totalPublic, totalBacheliers),
    pourcentagePoursuivants: pct(totalPublic, totalPoursuite),
    color: '#2563eb',
  };

  const secteurPrive: SecteurStat = {
    id: 'prive',
    label: 'Secteur privé',
    effectif: Math.round(totalPrive),
    pourcentageBacheliers: pct(totalPrive, totalBacheliers),
    pourcentagePoursuivants: pct(totalPrive, totalPoursuite),
    color: '#d97706',
  };

  const secteurNr: SecteurStat = {
    id: 'nr',
    label: 'Secteur non renseigné',
    effectif: Math.round(totalNr),
    pourcentageBacheliers: pct(totalNr, totalBacheliers),
    pourcentagePoursuivants: pct(totalNr, totalPoursuite),
    color: '#94a3b8',
  };

  const parFiliere: FiliereSecteurStat[] = [
    {
      filiere: 'Université',
      publicPct: pct(univ, totalBacheliers),
      privePct: 0,
      nrPct: 0,
      publicEffectif: Math.round(univ),
      priveEffectif: 0,
      nrEffectif: 0,
    },
    {
      filiere: 'STS / BTS',
      publicPct: pct(stsPublic, totalBacheliers),
      privePct: pct(stsPrive, totalBacheliers),
      nrPct: pct(stsNr, totalBacheliers),
      publicEffectif: Math.round(stsPublic),
      priveEffectif: Math.round(stsPrive),
      nrEffectif: Math.round(stsNr),
    },
    {
      filiere: 'IUT',
      publicPct: pct(iut, totalBacheliers),
      privePct: 0,
      nrPct: 0,
      publicEffectif: Math.round(iut),
      priveEffectif: 0,
      nrEffectif: 0,
    },
    {
      filiere: 'CPGE',
      publicPct: pct(cpgePublic, totalBacheliers),
      privePct: pct(cpgePrive, totalBacheliers),
      nrPct: 0,
      publicEffectif: Math.round(cpgePublic),
      priveEffectif: Math.round(cpgePrive),
      nrEffectif: 0,
    },
    {
      filiere: 'Autres formations',
      publicPct: pct(autresPublic, totalBacheliers),
      privePct: pct(autresPrive, totalBacheliers),
      nrPct: pct(autresNr, totalBacheliers),
      publicEffectif: Math.round(autresPublic),
      priveEffectif: Math.round(autresPrive),
      nrEffectif: Math.round(autresNr),
    },
  ];

  const secteurs =
    secteurNr.effectif > 0 ? [secteurPublic, secteurPrive, secteurNr] : [secteurPublic, secteurPrive];

  return {
    totalBacheliers: Math.round(totalBacheliers),
    totalPoursuite: Math.round(totalPoursuite),
    secteurPublic,
    secteurPrive,
    secteurNr,
    secteurs,
    parFiliere,
  };
}
