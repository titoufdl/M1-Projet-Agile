import type { ParcoursupRecord } from '../types/data';

/** Établissement agrégé pour la carte interactive (US15). */
export interface EtablissementCarte {
  key: string;
  codeUai: string;
  etablissement: string;
  ville: string;
  academie: string;
  lat: number;
  lon: number;
  formations: number;
  places: number;
  candidats: number;
}

export interface CarteData {
  etablissements: EtablissementCarte[];
  /** Formations ignorées faute de coordonnées GPS. */
  formationsSansCoordonnees: number;
}

/**
 * Regroupe les formations Parcoursup par établissement (code UAI + nom de site)
 * et compte le nombre de formations de chacun. Les coordonnées retenues sont la
 * moyenne de celles des formations du site.
 */
export function aggregateEtablissements(
  records: ParcoursupRecord[],
  academie = '',
): CarteData {
  const map = new Map<string, EtablissementCarte & { n: number }>();
  let formationsSansCoordonnees = 0;

  for (const r of records) {
    if (academie && r.academie !== academie) continue;
    if (r.lat === null || r.lon === null) {
      formationsSansCoordonnees += 1;
      continue;
    }
    const key = `${r.codeUai}|${r.etablissement}`;
    const e = map.get(key);
    if (e) {
      e.formations += 1;
      e.places += r.capacite;
      e.candidats += r.voeuxTotal;
      e.lat += r.lat;
      e.lon += r.lon;
      e.n += 1;
    } else {
      map.set(key, {
        key,
        codeUai: r.codeUai,
        etablissement: r.etablissement,
        ville: r.ville,
        academie: r.academie,
        lat: r.lat,
        lon: r.lon,
        formations: 1,
        places: r.capacite,
        candidats: r.voeuxTotal,
        n: 1,
      });
    }
  }

  const etablissements = [...map.values()]
    .map(({ n, ...e }) => ({ ...e, lat: e.lat / n, lon: e.lon / n }))
    .sort((a, b) => b.formations - a.formations);

  return { etablissements, formationsSansCoordonnees };
}

/** Rayon du cercle (px) proportionnel à la racine du nombre de formations. */
export function rayonMarqueur(formations: number): number {
  return Math.min(4 + 2.2 * Math.sqrt(formations), 24);
}

/** Classes de couleur selon le nombre de formations proposées. */
export const CLASSES_FORMATIONS = [
  { min: 20, color: '#312e81', label: '20 et plus' },
  { min: 10, color: '#4f46e5', label: '10 à 19' },
  { min: 4, color: '#818cf8', label: '4 à 9' },
  { min: 1, color: '#c7d2fe', label: '1 à 3' },
] as const;

export function couleurMarqueur(formations: number): string {
  return (CLASSES_FORMATIONS.find((c) => formations >= c.min) ?? CLASSES_FORMATIONS[3]).color;
}
