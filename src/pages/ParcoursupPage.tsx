import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RotateCcw } from 'lucide-react';
import AxisToggle from '../components/AxisToggle';
import StatCard from '../components/StatCard';
import { loadParcoursupData } from '../services/dataLoader';
import {
  computeTotals,
  EMPTY_FILTERS,
  filterParcoursup,
  listAcademies,
  listEtablissements,
  sortByAxis,
  type ParcoursupAxis,
  type ParcoursupFilters,
} from '../services/parcoursupFilters';
import type { ParcoursupRecord } from '../types/data';

const PAGE_SIZE = 50;
const CHART_SIZE = 10;
const nf = new Intl.NumberFormat('fr-FR');
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

const AXIS_META: Record<
  ParcoursupAxis,
  { key: 'capacite' | 'voeuxTotal'; label: string; color: string }
> = {
  formations: { key: 'capacite', label: 'Places offertes', color: '#4f46e5' },
  candidatures: { key: 'voeuxTotal', label: 'Candidatures', color: '#0891b2' },
};

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * US02 — Vue Parcoursup 2025 : axe d'analyse Formations / Candidatures
 * et filtres par académie et par établissement.
 */
export default function ParcoursupPage() {
  const [records, setRecords] = useState<ParcoursupRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [axis, setAxis] = useState<ParcoursupAxis>('formations');
  const [filters, setFilters] = useState<ParcoursupFilters>(EMPTY_FILTERS);
  const [etabInput, setEtabInput] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    loadParcoursupData()
      .then(setRecords)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const data = useMemo(() => records ?? [], [records]);
  const academies = useMemo(() => listAcademies(data), [data]);
  const etablissements = useMemo(
    () => listEtablissements(data, filters.academie),
    [data, filters.academie],
  );
  const filtered = useMemo(() => filterParcoursup(data, filters), [data, filters]);
  const sorted = useMemo(() => sortByAxis(filtered, axis), [filtered, axis]);
  const totals = useMemo(() => computeTotals(filtered), [filtered]);

  const meta = AXIS_META[axis];
  const chartData = sorted.slice(0, CHART_SIZE).map((r) => ({
    nom: truncate(filters.etablissement ? r.formation : r.formationDetail, 45),
    detail: r.formationDetail,
    valeur: r[meta.key],
  }));

  function updateFilters(patch: Partial<ParcoursupFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setVisible(PAGE_SIZE);
  }

  function handleAcademieChange(academie: string) {
    setEtabInput('');
    updateFilters({ academie, etablissement: '' });
  }

  function handleEtabInput(value: string) {
    setEtabInput(value);
    if (value === '' || etablissements.includes(value)) {
      updateFilters({ etablissement: value });
    }
  }

  function resetFilters() {
    setEtabInput('');
    setFilters(EMPTY_FILTERS);
    setVisible(PAGE_SIZE);
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Erreur de chargement des données Parcoursup : {error}
      </p>
    );
  }

  if (!records) {
    return <p className="p-8 text-center text-slate-500">Chargement des données Parcoursup 2025…</p>;
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Parcoursup 2025</h2>
          <p className="text-slate-600">
            Formations et candidatures par établissement et par académie.
          </p>
        </div>
        <AxisToggle
          value={axis}
          onChange={(next) => {
            setAxis(next);
            setVisible(PAGE_SIZE);
          }}
        />
      </header>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_2fr_auto]">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Académie
          <select
            value={filters.academie}
            onChange={(e) => handleAcademieChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
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
          Établissement ({nf.format(etablissements.length)})
          <input
            list="parcoursup-etablissements"
            value={etabInput}
            onChange={(e) => handleEtabInput(e.target.value)}
            placeholder="Rechercher un établissement…"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          />
          <datalist id="parcoursup-etablissements">
            {etablissements.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Formation
          <input
            type="search"
            value={filters.recherche}
            onChange={(e) => updateFilters({ recherche: e.target.value })}
            placeholder="Ex. : BUT Informatique, Licence Droit…"
            className="rounded-md border border-slate-300 px-3 py-2 font-normal"
          />
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Formations" value={nf.format(totals.formations)} />
        <StatCard label="Établissements" value={nf.format(totals.etablissements)} />
        <StatCard
          label="Places offertes"
          value={nf.format(totals.places)}
          highlighted={axis === 'formations'}
        />
        <StatCard
          label="Candidatures"
          value={nf.format(totals.candidatures)}
          highlighted={axis === 'candidatures'}
        />
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Aucune formation ne correspond aux filtres sélectionnés.
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 font-semibold text-slate-900">
              Top {chartData.length} des formations — {meta.label.toLowerCase()}
            </h3>
            <ResponsiveContainer width="100%" height={chartData.length * 34 + 40}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => nf.format(v)} />
                <YAxis type="category" dataKey="nom" width={300} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => [nf.format(v), meta.label]}
                  labelFormatter={(_label, payload) =>
                    (payload?.[0]?.payload as { detail?: string } | undefined)?.detail ?? ''
                  }
                />
                <Bar dataKey="valeur" fill={meta.color} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Formation</th>
                  <th className="px-4 py-3 font-medium">Établissement</th>
                  <th className="px-4 py-3 font-medium">Académie</th>
                  <th
                    className={`px-4 py-3 text-right font-medium ${axis === 'formations' ? 'text-indigo-700' : ''}`}
                  >
                    Places
                  </th>
                  <th
                    className={`px-4 py-3 text-right font-medium ${axis === 'candidatures' ? 'text-cyan-700' : ''}`}
                  >
                    Candidatures
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Cand./place</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.slice(0, visible).map((r, i) => (
                  <tr key={`${r.codeUai}-${r.formationDetail}-${i}`} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-900">{r.formation}</p>
                      <p className="text-xs text-slate-500">
                        {r.filiere} · {r.selectivite} · {r.statut}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {r.etablissement}
                      <span className="block text-xs text-slate-500">{r.ville}</span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{r.academie}</td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums ${axis === 'formations' ? 'font-semibold text-indigo-700' : ''}`}
                    >
                      {nf.format(r.capacite)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right tabular-nums ${axis === 'candidatures' ? 'font-semibold text-cyan-700' : ''}`}
                    >
                      {nf.format(r.voeuxTotal)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                      {r.capacite > 0 ? nf1.format(r.voeuxTotal / r.capacite) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
              <span>
                {nf.format(Math.min(visible, sorted.length))} sur {nf.format(sorted.length)} formations
              </span>
              {visible < sorted.length && (
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                >
                  Afficher {PAGE_SIZE} de plus
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
