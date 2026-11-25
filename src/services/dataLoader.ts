import type { ParcoursupRecord, PoursuiteRecord } from '../types/data';

let poursuiteCache: Promise<PoursuiteRecord[]> | null = null;
let parcoursupCache: Promise<ParcoursupRecord[]> | null = null;

async function fetchJsonFile<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Impossible de charger ${path} (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

/**
 * Charge dynamiquement les données de taux de poursuite d'études (2010-2025)
 * avec mise en cache en mémoire.
 */
export function loadPoursuiteData(): Promise<PoursuiteRecord[]> {
  if (!poursuiteCache) {
    poursuiteCache = fetchJsonFile<PoursuiteRecord[]>('/data/taux-poursuite.json').catch((err) => {
      poursuiteCache = null;
      throw err;
    });
  }
  return poursuiteCache;
}

/**
 * Charge dynamiquement les données Parcoursup 2025
 * avec mise en cache en mémoire.
 */
export function loadParcoursupData(): Promise<ParcoursupRecord[]> {
  if (!parcoursupCache) {
    parcoursupCache = fetchJsonFile<ParcoursupRecord[]>('/data/parcoursup-2025.json').catch(
      (err) => {
        parcoursupCache = null;
        throw err;
      },
    );
  }
  return parcoursupCache;
}
