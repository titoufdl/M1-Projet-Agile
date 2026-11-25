import type { ParcoursupRecord } from '../../types/data';

/** Axe d'analyse choisi par l'utilisateur. */
export type Axe = 'formations' | 'candidatures';

export const AXES: { value: Axe; label: string; description: string }[] = [
  {
    value: 'formations',
    label: 'Formations',
    description: "L'offre : formations, places et établissements",
  },
  {
    value: 'candidatures',
    label: 'Candidatures',
    description: 'La demande : vœux, pression et profils des candidats',
  },
];

export interface Indicateur {
  id: string;
  label: string;
  valeur: string;
  detail?: string;
}

const nf = new Intl.NumberFormat('fr-FR');
const pct = (part: number, total: number) =>
  total > 0 ? `${((part / total) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : '—';

function indicateursFormations(records: ParcoursupRecord[]): Indicateur[] {
  const places = records.reduce((s, r) => s + r.capacite, 0);
  const etablissements = new Set(records.map((r) => r.codeUai)).size;
  const selectives = records.filter((r) => r.selectivite === 'formation sélective').length;
  const publiques = records.filter((r) => r.statut === 'Public').length;

  return [
    { id: 'nb-formations', label: 'Formations', valeur: nf.format(records.length) },
    { id: 'places', label: 'Places offertes', valeur: nf.format(places) },
    { id: 'etablissements', label: 'Établissements', valeur: nf.format(etablissements) },
    {
      id: 'selectives',
      label: 'Formations sélectives',
      valeur: pct(selectives, records.length),
      detail: `${nf.format(selectives)} formations`,
    },
    {
      id: 'public',
      label: 'Secteur public',
      valeur: pct(publiques, records.length),
      detail: `${nf.format(publiques)} formations`,
    },
  ];
}

function indicateursCandidatures(records: ParcoursupRecord[]): Indicateur[] {
  const voeux = records.reduce((s, r) => s + r.voeuxTotal, 0);
  const places = records.reduce((s, r) => s + r.capacite, 0);
  const admis = records.reduce((s, r) => s + r.admisTotal, 0);
  const general = records.reduce((s, r) => s + r.voeuxBacGeneral, 0);
  const techno = records.reduce((s, r) => s + r.voeuxBacTechno, 0);
  const pro = records.reduce((s, r) => s + r.voeuxBacPro, 0);

  return [
    { id: 'voeux', label: 'Candidatures (vœux)', valeur: nf.format(voeux) },
    {
      id: 'pression',
      label: 'Taux de pression',
      valeur: places > 0 ? (voeux / places).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—',
      detail: 'vœux par place offerte',
    },
    { id: 'admis', label: 'Admis', valeur: nf.format(admis), detail: `${pct(admis, places)} des places` },
    { id: 'bac-general', label: 'Candidats bac général', valeur: pct(general, voeux) },
    { id: 'bac-techno', label: 'Candidats bac techno', valeur: pct(techno, voeux) },
    { id: 'bac-pro', label: 'Candidats bac pro', valeur: pct(pro, voeux) },
  ];
}

/** Calcule les indicateurs à afficher selon l'axe choisi. Fonction pure, testable. */
export function calculerIndicateurs(axe: Axe, records: ParcoursupRecord[]): Indicateur[] {
  return axe === 'formations' ? indicateursFormations(records) : indicateursCandidatures(records);
}
