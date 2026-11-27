import type { PoursuiteRecord } from '../types/data';
import { TYPE_META, type TypeEtudeId } from './poursuiteStats';

/** Bornes par défaut de l'analyse temporelle. */
export const EVOLUTION_DEBUT = 2015;
export const EVOLUTION_FIN = 2025;

/** Indicateurs d'une session (année) pour le périmètre sélectionné. */
export interface EvolutionPoint {
  annee: number;
  bacheliers: number;
  poursuivants: number;
  /** Taux de poursuite global (% des néo-bacheliers). */
  tauxPoursuite: number;
  /** Part des néo-bacheliers par type de formation (%). */
  parts: Record<TypeEtudeId, number>;
  /** Effectifs par type de formation. */
  effectifs: Record<TypeEtudeId, number>;
}

/** Ligne « à plat » directement exploitable par Recharts. */
export type EvolutionRow = {
  annee: number;
  bacheliers: number;
  poursuivants: number;
  tauxPoursuite: number;
} & Record<`pct_${TypeEtudeId}` | `eff_${TypeEtudeId}`, number>;

export interface EvolutionSummary {
  points: EvolutionPoint[];
  rows: EvolutionRow[];
  debut: EvolutionPoint | null;
  fin: EvolutionPoint | null;
  /** Écart du taux global entre la première et la dernière session (en points). */
  ecartTauxPoints: number;
  /** Variation relative du nombre de néo-bacheliers (%). */
  variationBacheliersPct: number;
  /** Session au taux de poursuite le plus élevé. */
  pic: EvolutionPoint | null;
}

export interface EvolutionFilters {
  voieBac: string;
  academie: string;
  genre: string;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function emptyByType(): Record<TypeEtudeId, number> {
  return { univ: 0, sts: 0, autres: 0, iut: 0, cpge: 0 };
}

export function filterEvolution(
  records: PoursuiteRecord[],
  filters: EvolutionFilters,
): PoursuiteRecord[] {
  return records.filter(
    (r) =>
      (!filters.voieBac || r.voieBac === filters.voieBac) &&
      (!filters.academie || r.academie === filters.academie) &&
      (!filters.genre || r.genre === filters.genre),
  );
}

/** Agrège les enregistrements par session entre `debut` et `fin` (inclus). */
export function computeEvolutionPoints(
  records: PoursuiteRecord[],
  debut = EVOLUTION_DEBUT,
  fin = EVOLUTION_FIN,
): EvolutionPoint[] {
  const byYear = new Map<
    number,
    { bacheliers: number; poursuivants: number; effectifs: Record<TypeEtudeId, number> }
  >();

  for (const r of records) {
    if (r.annee < debut || r.annee > fin) continue;
    let acc = byYear.get(r.annee);
    if (!acc) {
      acc = { bacheliers: 0, poursuivants: 0, effectifs: emptyByType() };
      byYear.set(r.annee, acc);
    }
    acc.bacheliers += r.bacheliers;
    acc.poursuivants += r.totalPoursuite;
    for (const meta of TYPE_META) acc.effectifs[meta.id] += meta.extract(r);
  }

  return [...byYear]
    .sort(([a], [b]) => a - b)
    .map(([annee, acc]) => {
      const parts = emptyByType();
      const effectifs = emptyByType();
      for (const meta of TYPE_META) {
        parts[meta.id] = pct(acc.effectifs[meta.id], acc.bacheliers);
        effectifs[meta.id] = Math.round(acc.effectifs[meta.id]);
      }
      return {
        annee,
        bacheliers: Math.round(acc.bacheliers),
        poursuivants: Math.round(acc.poursuivants),
        tauxPoursuite: pct(acc.poursuivants, acc.bacheliers),
        parts,
        effectifs,
      };
    });
}

function toRow(p: EvolutionPoint): EvolutionRow {
  const row = {
    annee: p.annee,
    bacheliers: p.bacheliers,
    poursuivants: p.poursuivants,
    tauxPoursuite: p.tauxPoursuite,
  } as EvolutionRow;
  for (const meta of TYPE_META) {
    row[`pct_${meta.id}`] = p.parts[meta.id];
    row[`eff_${meta.id}`] = p.effectifs[meta.id];
  }
  return row;
}

/** Synthèse de l'évolution des poursuites d'études sur la période. */
export function computeEvolution(
  records: PoursuiteRecord[],
  debut = EVOLUTION_DEBUT,
  fin = EVOLUTION_FIN,
): EvolutionSummary {
  const points = computeEvolutionPoints(records, debut, fin);
  const first = points[0] ?? null;
  const last = points[points.length - 1] ?? null;
  const pic = points.reduce<EvolutionPoint | null>(
    (best, p) => (best === null || p.tauxPoursuite > best.tauxPoursuite ? p : best),
    null,
  );

  return {
    points,
    rows: points.map(toRow),
    debut: first,
    fin: last,
    ecartTauxPoints:
      first && last ? Math.round((last.tauxPoursuite - first.tauxPoursuite) * 10) / 10 : 0,
    variationBacheliersPct:
      first && last && first.bacheliers > 0
        ? Math.round(((last.bacheliers - first.bacheliers) / first.bacheliers) * 1000) / 10
        : 0,
    pic,
  };
}

/**
 * Taux de poursuite par session pour chaque valeur d'une dimension
 * (voie du bac, genre…). Renvoie une ligne par année : { annee, [valeur]: taux }.
 */
export function computeTauxParDimension(
  records: PoursuiteRecord[],
  keyOf: (r: PoursuiteRecord) => string,
  debut = EVOLUTION_DEBUT,
  fin = EVOLUTION_FIN,
): { keys: string[]; rows: Array<Record<string, number>> } {
  const acc = new Map<number, Map<string, { b: number; p: number }>>();
  const keys = new Set<string>();

  for (const r of records) {
    if (r.annee < debut || r.annee > fin) continue;
    const key = keyOf(r);
    if (!key) continue;
    keys.add(key);
    let year = acc.get(r.annee);
    if (!year) {
      year = new Map();
      acc.set(r.annee, year);
    }
    const cell = year.get(key) ?? { b: 0, p: 0 };
    cell.b += r.bacheliers;
    cell.p += r.totalPoursuite;
    year.set(key, cell);
  }

  const rows = [...acc]
    .sort(([a], [b]) => a - b)
    .map(([annee, year]) => {
      const row: Record<string, number> = { annee };
      for (const [key, cell] of year) row[key] = pct(cell.p, cell.b);
      return row;
    });

  return { keys: [...keys], rows };
}
