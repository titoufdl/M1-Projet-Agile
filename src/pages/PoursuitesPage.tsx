import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import PoursuiteBacAcademie from '../components/PoursuiteBacAcademie';
import PoursuiteParType from '../components/PoursuiteParType';
import PoursuitePublicPrive from '../components/PoursuitePublicPrive';
import { loadPoursuiteData } from '../services/dataLoader';
import {
  filterPoursuite,
  listAcademiesPoursuite,
  listGenres,
  listPoursuiteAnnees,
  listVoiesBac,
  type PoursuiteFilters,
} from '../services/poursuiteStats';
import type { PoursuiteRecord } from '../types/data';

const EMPTY_FILTERS: PoursuiteFilters = {
  annee: null,
  voieBac: '',
  academie: '',
  genre: '',
};

/**
 * Vue Poursuites d'études : filtres (session, voie du bac, académie, genre),
 * répartition par type de formation, comparaison par bac et par académie
 * et comparaison Public / Privé.
 */
export default function PoursuitesPage() {
  const [records, setRecords] = useState<PoursuiteRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PoursuiteFilters>(EMPTY_FILTERS);
  const [defaultAnnee, setDefaultAnnee] = useState<number | null>(null);

  useEffect(() => {
    loadPoursuiteData()
      .then((data) => {
        setRecords(data);
        const latest = listPoursuiteAnnees(data)[0] ?? null;
        setDefaultAnnee(latest);
        setFilters((prev) => ({ ...prev, annee: latest }));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const data = useMemo(() => records ?? [], [records]);
  const annees = useMemo(() => listPoursuiteAnnees(data), [data]);
  const voiesBac = useMemo(() => listVoiesBac(data), [data]);
  const academies = useMemo(() => listAcademiesPoursuite(data), [data]);
  const genres = useMemo(() => listGenres(data), [data]);
  const filtered = useMemo(() => filterPoursuite(data, filters), [data, filters]);

  const scopeLabel = useMemo(() => {
    const parts: string[] = [];
    if (filters.annee !== null) parts.push(`Session ${filters.annee}`);
    if (filters.voieBac) parts.push(filters.voieBac);
    if (filters.academie) parts.push(`Académie de ${filters.academie}`);
    if (filters.genre) parts.push(filters.genre);
    return parts.length > 0 ? parts.join(' · ') : 'France entière (toutes sessions)';
  }, [filters]);

  function resetFilters() {
    setFilters({ ...EMPTY_FILTERS, annee: defaultAnnee });
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Erreur lors du chargement des poursuites d&apos;études : {error}
      </div>
    );
  }

  if (!records) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement des données de poursuite d&apos;études…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_1fr_auto]">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Session
          <select
            value={filters.annee ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                annee: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
          >
            <option value="">Toutes les sessions</option>
            {annees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Voie du bac
          <select
            value={filters.voieBac}
            onChange={(e) => setFilters((prev) => ({ ...prev, voieBac: e.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
          >
            <option value="">Toutes les voies</option>
            {voiesBac.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Académie
          <select
            value={filters.academie}
            onChange={(e) => setFilters((prev) => ({ ...prev, academie: e.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
          >
            <option value="">Toutes les académies</option>
            {academies.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Genre
          <select
            value={filters.genre}
            onChange={(e) => setFilters((prev) => ({ ...prev, genre: e.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
          >
            <option value="">Tous</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 self-end rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Réinitialiser
        </button>
      </div>

      <PoursuiteParType records={filtered} subtitle={scopeLabel} />

      <hr className="border-slate-200" />

      <PoursuiteBacAcademie
        records={data}
        filters={filters}
        onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
      />

      <hr className="border-slate-200" />

      <PoursuitePublicPrive records={filtered} subtitle={scopeLabel} />
    </div>
  );
}
