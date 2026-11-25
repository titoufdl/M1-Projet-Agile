export interface PoursuiteRecord {
  annee: number;
  region: string;
  academie: string;
  academieCode: string;
  voieBac: string;
  genre: string;
  bacheliers: number;
  univ: number;
  iut: number;
  cpgePublic: number;
  cpgePrive: number;
  stsPublic: number;
  stsPrive: number;
  stsNr: number;
  autresPublic: number;
  autresPrive: number;
  autresNr: number;
  totalPublic: number;
  totalPrive: number;
  totalNr: number;
  totalPoursuite: number;
}

export interface ParcoursupRecord {
  session: number;
  statut: string;
  codeUai: string;
  etablissement: string;
  departementCode: string;
  departement: string;
  region: string;
  academie: string;
  ville: string;
  formation: string;
  formationDetail: string;
  filiere: string;
  filiereCategorie: string;
  selectivite: string;
  lat: number | null;
  lon: number | null;
  capacite: number;
  voeuxTotal: number;
  voeuxFemmes: number;
  voeuxBacGeneral: number;
  voeuxBacTechno: number;
  voeuxBacPro: number;
  voeuxAutres: number;
  admisTotal: number;
}
