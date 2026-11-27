import type { ParcoursupRecord } from '../types/data';

export interface FormationUniversiteStat {
  id: string;
  formation: string;
  filiere: string;
  selectivite: string;
  statut: string;
  academie: string;
  ville: string;
  places: number;
  candidatures: number;
  /** Nombre de candidats par place disponible (null si capacité = 0). */
  tauxPression: number | null;
  voeuxBacGeneral: number;
  voeuxBacTechno: number;
  voeuxBacPro: number;
  voeuxAutres: number;
  pctBacGeneral: number;
  pctBacTechno: number;
  pctBacPro: number;
  pctAutres: number;
}

export interface UniversiteSummary {
  etablissement: string;
  academie: string;
  ville: string;
  nbFormations: number;
  totalPlaces: number;
  totalCandidatures: number;
  tauxPressionMoyen: number | null;
  pctBacGeneral: number;
  pctBacTechno: number;
  pctBacPro: number;
  pctAutres: number;
  formations: FormationUniversiteStat[];
}

export interface NationalFiliereStat {
  filiere: string;
  nbFormations: number;
  places: number;
  candidatures: number;
  tauxPression: number | null;
  voeuxBacGeneral: number;
  voeuxBacTechno: number;
  voeuxBacPro: number;
  voeuxAutres: number;
  pctBacGeneral: number;
  pctBacTechno: number;
  pctBacPro: number;
  pctAutres: number;
}

export interface NationalRecapSummary {
  rows: NationalFiliereStat[];
  totals: NationalFiliereStat;
}

const collator = new Intl.Collator('fr', { sensitivity: 'base' });
const UNIVERSITE_REGEX = /universit/i;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return round1((part / total) * 100);
}

/**
 * Liste les établissements disponibles (par défaut uniquement les universités).
 */
export function listUniversites(
  records: ParcoursupRecord[],
  onlyUniversites = true,
): string[] {
  const set = new Set<string>();
  for (const r of records) {
    if (!r.etablissement) continue;
    if (onlyUniversites && !UNIVERSITE_REGEX.test(r.etablissement)) continue;
    set.add(r.etablissement);
  }
  return Array.from(set).sort(collator.compare);
}

/**
 * Calcule le détail des formations pour une université donnée :
 * places, candidatures, taux de pression et proportion de bacheliers par filière de bac.
 */
export function computeFormationsUniversite(
  records: ParcoursupRecord[],
  etablissement: string,
): UniversiteSummary | null {
  if (!etablissement) return null;

  const matching = records.filter((r) => r.etablissement === etablissement);
  if (matching.length === 0) return null;

  let totalPlaces = 0;
  let totalCandidatures = 0;
  let totalBg = 0;
  let totalBt = 0;
  let totalBp = 0;
  let totalAt = 0;

  const formations: FormationUniversiteStat[] = matching.map((r, idx) => {
    totalPlaces += r.capacite;
    totalCandidatures += r.voeuxTotal;
    totalBg += r.voeuxBacGeneral;
    totalBt += r.voeuxBacTechno;
    totalBp += r.voeuxBacPro;
    totalAt += r.voeuxAutres;

    const baseBac = r.voeuxBacGeneral + r.voeuxBacTechno + r.voeuxBacPro + r.voeuxAutres;
    const denom = baseBac > 0 ? baseBac : r.voeuxTotal;

    return {
      id: `${r.codeUai}-${idx}`,
      formation: r.formation || r.formationDetail,
      filiere: r.filiere || 'Autre formation',
      selectivite: r.selectivite,
      statut: r.statut,
      academie: r.academie,
      ville: r.ville,
      places: r.capacite,
      candidatures: r.voeuxTotal,
      tauxPression: r.capacite > 0 ? round2(r.voeuxTotal / r.capacite) : null,
      voeuxBacGeneral: r.voeuxBacGeneral,
      voeuxBacTechno: r.voeuxBacTechno,
      voeuxBacPro: r.voeuxBacPro,
      voeuxAutres: r.voeuxAutres,
      pctBacGeneral: pct(r.voeuxBacGeneral, denom),
      pctBacTechno: pct(r.voeuxBacTechno, denom),
      pctBacPro: pct(r.voeuxBacPro, denom),
      pctAutres: pct(r.voeuxAutres, denom),
    };
  });

  const totalBaseBac = totalBg + totalBt + totalBp + totalAt;
  const totalDenom = totalBaseBac > 0 ? totalBaseBac : totalCandidatures;

  return {
    etablissement,
    academie: matching[0].academie,
    ville: matching[0].ville,
    nbFormations: formations.length,
    totalPlaces,
    totalCandidatures,
    tauxPressionMoyen: totalPlaces > 0 ? round2(totalCandidatures / totalPlaces) : null,
    pctBacGeneral: pct(totalBg, totalDenom),
    pctBacTechno: pct(totalBt, totalDenom),
    pctBacPro: pct(totalBp, totalDenom),
    pctAutres: pct(totalAt, totalDenom),
    formations,
  };
}

/**
 * Calcule le tableau récapitulatif national par type de formation (filière) :
 * places offertes, candidatures totales, taux de pression et répartition par type de bac.
 */
export function computeRecapNational(records: ParcoursupRecord[]): NationalRecapSummary {
  const byFiliere = new Map<
    string,
    {
      nbFormations: number;
      places: number;
      candidatures: number;
      voeuxBacGeneral: number;
      voeuxBacTechno: number;
      voeuxBacPro: number;
      voeuxAutres: number;
    }
  >();

  let grandNb = 0;
  let grandPlaces = 0;
  let grandCand = 0;
  let grandBg = 0;
  let grandBt = 0;
  let grandBp = 0;
  let grandAt = 0;

  for (const r of records) {
    const key = r.filiere || 'Autre formation';
    const cur = byFiliere.get(key) ?? {
      nbFormations: 0,
      places: 0,
      candidatures: 0,
      voeuxBacGeneral: 0,
      voeuxBacTechno: 0,
      voeuxBacPro: 0,
      voeuxAutres: 0,
    };

    cur.nbFormations += 1;
    cur.places += r.capacite;
    cur.candidatures += r.voeuxTotal;
    cur.voeuxBacGeneral += r.voeuxBacGeneral;
    cur.voeuxBacTechno += r.voeuxBacTechno;
    cur.voeuxBacPro += r.voeuxBacPro;
    cur.voeuxAutres += r.voeuxAutres;
    byFiliere.set(key, cur);

    grandNb += 1;
    grandPlaces += r.capacite;
    grandCand += r.voeuxTotal;
    grandBg += r.voeuxBacGeneral;
    grandBt += r.voeuxBacTechno;
    grandBp += r.voeuxBacPro;
    grandAt += r.voeuxAutres;
  }

  const buildRow = (
    filiere: string,
    stats: {
      nbFormations: number;
      places: number;
      candidatures: number;
      voeuxBacGeneral: number;
      voeuxBacTechno: number;
      voeuxBacPro: number;
      voeuxAutres: number;
    },
  ): NationalFiliereStat => {
    const baseBac =
      stats.voeuxBacGeneral + stats.voeuxBacTechno + stats.voeuxBacPro + stats.voeuxAutres;
    const denom = baseBac > 0 ? baseBac : stats.candidatures;
    return {
      filiere,
      nbFormations: stats.nbFormations,
      places: stats.places,
      candidatures: stats.candidatures,
      tauxPression: stats.places > 0 ? round2(stats.candidatures / stats.places) : null,
      voeuxBacGeneral: stats.voeuxBacGeneral,
      voeuxBacTechno: stats.voeuxBacTechno,
      voeuxBacPro: stats.voeuxBacPro,
      voeuxAutres: stats.voeuxAutres,
      pctBacGeneral: pct(stats.voeuxBacGeneral, denom),
      pctBacTechno: pct(stats.voeuxBacTechno, denom),
      pctBacPro: pct(stats.voeuxBacPro, denom),
      pctAutres: pct(stats.voeuxAutres, denom),
    };
  };

  const rows = Array.from(byFiliere.entries())
    .map(([filiere, stats]) => buildRow(filiere, stats))
    .sort((a, b) => b.candidatures - a.candidatures);

  const totals = buildRow('Total national', {
    nbFormations: grandNb,
    places: grandPlaces,
    candidatures: grandCand,
    voeuxBacGeneral: grandBg,
    voeuxBacTechno: grandBt,
    voeuxBacPro: grandBp,
    voeuxAutres: grandAt,
  });

  return { rows, totals };
}
