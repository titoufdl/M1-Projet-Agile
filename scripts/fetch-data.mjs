import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/data');

const POURSUITE_URL =
  'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-taux-poursuite-enseignement-superieur-par-academie/exports/json';
const PARCOURSUP_URL =
  'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-parcoursup/exports/json';

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const round2 = (v) => Math.round(v * 100) / 100;
const round5 = (v) => Math.round(v * 1e5) / 1e5;

async function fetchJson(url, label) {
  console.log(`Téléchargement : ${label}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Erreur HTTP ${res.status} pour ${label}`);
  }
  const data = await res.json();
  console.log(`  -> ${data.length} enregistrements reçus.`);
  return data;
}

function normalizePoursuite(raw) {
  return raw.map((r) => {
    const univ = num(r.univ_flux_ar) + num(r.univ_flux_a) + num(r.univ_stable);
    const iut = num(r.iut_flux_ar) + num(r.iut_flux_a) + num(r.iut_stable);
    const cpgePublic =
      num(r.cpge_public_flux_ar) + num(r.cpge_public_flux_a) + num(r.cpge_public_stable);
    const cpgePrive =
      num(r.cpge_prive_flux_ar) + num(r.cpge_prive_flux_a) + num(r.cpge_prive_stable);
    const stsPublic =
      num(r.sts_public_flux_ar) + num(r.sts_public_flux_a) + num(r.sts_public_stable);
    const stsPrive =
      num(r.sts_prive_flux_ar) + num(r.sts_prive_flux_a) + num(r.sts_prive_stable);
    const stsNr = num(r.sts_nr_flux_ar) + num(r.sts_nr_flux_a) + num(r.sts_nr_stable);
    const autresPublic =
      num(r.autres_formations_public_flux_ar) +
      num(r.autres_formations_public_flux_a) +
      num(r.autres_formations_public_stable);
    const autresPrive =
      num(r.autres_formations_prive_flux_ar) +
      num(r.autres_formations_prive_flux_a) +
      num(r.autres_formations_prive_stable);
    const autresNr =
      num(r.autres_formations_nr_flux_ar) +
      num(r.autres_formations_nr_flux_a) +
      num(r.autres_formations_nr_stable);

    const totalPublic = univ + iut + cpgePublic + stsPublic + autresPublic;
    const totalPrive = cpgePrive + stsPrive + autresPrive;
    const totalNr = stsNr + autresNr;
    const totalPoursuite = totalPublic + totalPrive + totalNr;

    return {
      annee: Number(r.rentree_session) || 0,
      region: r.reg_lib ?? '',
      academie: r.aca_lib ?? '',
      academieCode: r.aca_code ?? '',
      voieBac: r.voie_du_baccalaureat ?? '',
      genre: r.genre ?? '',
      bacheliers: num(r.bacheliers),
      univ: round2(univ),
      iut: round2(iut),
      cpgePublic: round2(cpgePublic),
      cpgePrive: round2(cpgePrive),
      stsPublic: round2(stsPublic),
      stsPrive: round2(stsPrive),
      stsNr: round2(stsNr),
      autresPublic: round2(autresPublic),
      autresPrive: round2(autresPrive),
      autresNr: round2(autresNr),
      totalPublic: round2(totalPublic),
      totalPrive: round2(totalPrive),
      totalNr: round2(totalNr),
      totalPoursuite: round2(totalPoursuite),
    };
  });
}

function normalizeParcoursup(raw) {
  return raw.map((r) => {
    const geo = r.g_olocalisation_des_formations;
    const voeBg = num(r.nb_voe_pp_bg) + num(r.nb_voe_pc_bg);
    const voeBt = num(r.nb_voe_pp_bt) + num(r.nb_voe_pc_bt);
    const voeBp = num(r.nb_voe_pp_bp) + num(r.nb_voe_pc_bp);
    const voeAt = num(r.nb_voe_pp_at) + num(r.nb_voe_pc_at);

    return {
      session: Number(r.session) || 2025,
      statut: r.contrat_etab ?? '',
      codeUai: r.cod_uai ?? '',
      etablissement: r.g_ea_lib_vx ?? '',
      departementCode: r.dep ?? '',
      departement: r.dep_lib ?? '',
      region: r.region_etab_aff ?? '',
      academie: r.acad_mies ?? '',
      ville: r.ville_etab ?? '',
      formation: r.lib_for_voe_ins ?? '',
      formationDetail: r.lib_comp_voe_ins ?? '',
      filiere: r.fili ?? '',
      filiereCategorie: r.form_lib_voe_acc ?? '',
      selectivite: r.select_form ?? '',
      lat: geo && typeof geo.lat === 'number' ? round5(geo.lat) : null,
      lon: geo && typeof geo.lon === 'number' ? round5(geo.lon) : null,
      capacite: num(r.capa_fin),
      voeuxTotal: num(r.voe_tot),
      voeuxFemmes: num(r.voe_tot_f),
      voeuxBacGeneral: voeBg,
      voeuxBacTechno: voeBt,
      voeuxBacPro: voeBp,
      voeuxAutres: voeAt,
      admisTotal: num(r.acc_tot),
    };
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const [rawPoursuite, rawParcoursup] = await Promise.all([
    fetchJson(POURSUITE_URL, 'Taux de poursuite (2010-2025)'),
    fetchJson(PARCOURSUP_URL, 'Vœux Parcoursup 2025'),
  ]);

  const poursuite = normalizePoursuite(rawPoursuite);
  const parcoursup = normalizeParcoursup(rawParcoursup);

  const poursuitePath = resolve(OUT_DIR, 'taux-poursuite.json');
  const parcoursupPath = resolve(OUT_DIR, 'parcoursup-2025.json');

  await writeFile(poursuitePath, JSON.stringify(poursuite), 'utf-8');
  await writeFile(parcoursupPath, JSON.stringify(parcoursup), 'utf-8');

  console.log(`Fichiers écrits dans ${OUT_DIR} :`);
  console.log(`  - taux-poursuite.json (${poursuite.length} lignes)`);
  console.log(`  - parcoursup-2025.json (${parcoursup.length} lignes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
