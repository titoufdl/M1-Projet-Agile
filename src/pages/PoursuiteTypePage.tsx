import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RotateCcw } from 'lucide-react';
import StatCard from '../components/StatCard';
import { loadPoursuiteData } from '../services/dataLoader';
import {
  computePoursuiteStats,
  filterPoursuite,
  listAcademiesPoursuite,
  listAnnees,
  listGenres,
  listVoiesBac,
  type PoursuiteFilters,
} from '../services/poursuiteStats';
import type { PoursuiteRecord } from '../types/data';

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const pf = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatPct = (v: number) => `${pf.format(v)} %`;

const SELECT_CLASS = 'rounded-md border border-slate-300 px-3 py-2 font-normal';
const LABEL_CLASS = 'flex flex-col gap-1 text-sm font-medium text-slate-700';

/**
 * US05 — Pourcentage de néo-bacheliers poursuivant leurs études
 * par type d'études (Université, IUT, CPGE, STS, autres).
 */
export default function PoursuiteTypePage() {
  const [records, setRecords] = useState<PoursuiteRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PoursuiteFilters>({
    annee: null,
    voieBac: '',
    academie: '',
    genre: '',
  });

  useEffect(() => {
    loadPoursuiteData()
      .then((data) => {
        setRecords(data);
        const derniereAnnee = listAnnees(data)[0] ?? null;
        setFilters((prev) => ({ ...prev, annee: derniereAnnee }));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const data = useMemo(() => records ?? [], [records]);
  const annees = useMemo(() => listAnnees(data), [data]);
  const voies = useMemo(() => listVoiesBac(data), [data]);
  const academies = useMemo(() => listAcademiesPoursuite(data), [data]);
  const genres = useMemo(() => listGenres(data), [data]);
  const stats = useMemo(
    () => computePoursuiteStats(filterPoursuite(data, filters)),
    [data, filters],
  );

  function update(patch: Partial<PoursuiteFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Erreur de chargement des données de poursuite d&apos;études : {error}
      </p>
    );
  }

  if (!records) {
    return (
      <p className="p-8 text-center text-slate-500">Chargement des données de poursuite d&apos;études…</p>
    );
  }

  const nonPoursuivants = Math.max(stats.bacheliers - stats.poursuivants, 0);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-8">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Poursuite d&apos;études par type de formation
        </h2>
        <p className="text-slate-600">
          Part des néo-bacheliers qui poursuivent leurs études dans l&apos;enseignement supérieur,
          selon le type de formation.
        </p>
      </header>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <label className={LABEL_CLASS}>
          Année de rentrée
          <select
            value={filters.annee ?? ''}
            onChange={(e) => update({ annee: e.target.value ? Number(e.target.value) : null })}
            className={SELECT_CLASS}
          >
            <option value="">Toutes les années (cumul)</option>
            {annees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL_CLASS}>
          Voie du bac
          <select
            value={filters.voieBac}
            onChange={(e) => update({ voieBac: e.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">Toutes les voies</option>
            {voies.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL_CLASS}>
          Académie
          <select
            value={filters.academie}
            onChange={(e) => update({ academie: e.target.value })}
            className={SELECT_CLASS}
          >
            <option value="">Toutes les académies</option>
            {academies.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL_CLASS}>
          Genre
          <select
            value={filters.genre}
            onChange={(e) => update({ genre: e.target.value })}
            className={SELECT_CLASS}
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
          onClick={() =>
            setFilters({ annee: annees[0] ?? null, voieBac: '', academie: '', genre: '' })
          }
          className="flex items-center justify-center gap-2 self-end rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Réinitialiser
        </button>
      </div>

      {stats.bacheliers === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Aucune donnée pour cette sélection.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Néo-bacheliers" value={nf.format(stats.bacheliers)} />
            <StatCard label="Poursuivent leurs études" value={nf.format(stats.poursuivants)} />
            <StatCard
              label="Taux de poursuite"
              value={stats.tauxPoursuite === null ? '—' : formatPct(stats.tauxPoursuite)}
              highlighted
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-2 font-semibold text-slate-900">
                % de néo-bacheliers par type d&apos;études
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.parType} layout="vertical" margin={{ left: 8, right: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 'auto']} tickFormatter={(v: number) => `${v} %`} />
                  <YAxis type="category" dataKey="type" width={130} tick={{ fontSize: 13 }} />
                  <Tooltip formatter={(v: number) => [formatPct(v), 'Part des néo-bacheliers']} />
                  <Bar dataKey="pourcentage" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="pourcentage"
                      position="right"
                      formatter={(v: number) => formatPct(v)}
                      className="fill-slate-700 text-xs"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Type d&apos;études</th>
                    <th className="px-4 py-3 text-right font-medium">Effectif</th>
                    <th className="px-4 py-3 text-right font-medium">% des bacheliers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.parType.map((t) => (
                    <tr key={t.type}>
                      <td className="px-4 py-2 text-slate-900">{t.type}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{nf.format(t.effectif)}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums text-indigo-700">
                        {formatPct(t.pourcentage)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-4 py-2">Total poursuite</td>
                    <td className="px-4 py-2 text-right tabular-nums">{nf.format(stats.poursuivants)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {stats.tauxPoursuite === null ? '—' : formatPct(stats.tauxPoursuite)}
                    </td>
                  </tr>
                  <tr className="text-slate-500">
                    <td className="px-4 py-2">Ne poursuivent pas</td>
                    <td className="px-4 py-2 text-right tabular-nums">{nf.format(nonPoursuivants)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatPct((nonPoursuivants / stats.bacheliers) * 100)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Source : MESR, taux de poursuite des néo-bacheliers dans l&apos;enseignement supérieur par
            académie. Les effectifs par type sont des estimations (secteurs public, privé et non
            renseigné cumulés).
          </p>
        </>
      )}
    </section>
  );
}
