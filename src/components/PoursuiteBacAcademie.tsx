import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDown, ArrowUp, Map as MapIcon } from 'lucide-react';
import {
  computeDestinationsEnsemble,
  computeDestinationsParAcademie,
  computeDestinationsParVoieBac,
  filterPoursuite,
  TYPE_META,
  type DestinationsGroupe,
  type PoursuiteFilters,
  type TypeEtudeId,
} from '../services/poursuiteStats';
import type { PoursuiteRecord } from '../types/data';

interface PoursuiteBacAcademieProps {
  /** Jeu de données complet (non filtré). */
  records: PoursuiteRecord[];
  /** Filtres partagés de la page Poursuites d'études. */
  filters: PoursuiteFilters;
  /** Permet de sélectionner une voie / une académie depuis les graphiques et tableaux. */
  onFiltersChange: (patch: Partial<PoursuiteFilters>) => void;
}

const nfInt = new Intl.NumberFormat('fr-FR');
const nfPct = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatPct = (v: number) => `${nfPct.format(v)} %`;

const SANS_POURSUITE = { id: 'sansPoursuite', label: 'Sans poursuite immédiate', color: '#cbd5e1' };
const ENSEMBLE = 'Ensemble';

const SERIES: Array<{ id: string; label: string; color: string }> = [
  ...TYPE_META.map(({ id, shortLabel, color }) => ({ id, label: shortLabel, color })),
  SANS_POURSUITE,
];
const SERIES_LABEL = Object.fromEntries(SERIES.map((s) => [s.id, s.label]));

type SortKey = 'label' | 'bacheliers' | 'tauxPoursuite' | 'sansPoursuitePct' | TypeEtudeId;

function shortVoie(voie: string): string {
  const court = voie.replace(/^Bac\s+/i, '');
  return court.charAt(0).toUpperCase() + court.slice(1);
}

function sortValue(g: DestinationsGroupe, key: SortKey): number | string {
  if (key === 'label' || key === 'bacheliers' || key === 'tauxPoursuite' || key === 'sansPoursuitePct') {
    return g[key];
  }
  return g.parts[key];
}

/**
 * Filtrer les poursuites d'études par bac et académie :
 * ce que font les néo-bacheliers après le bac, selon leur voie de bac et leur académie.
 */
export default function PoursuiteBacAcademie({
  records,
  filters,
  onFiltersChange,
}: PoursuiteBacAcademieProps) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: 'tauxPoursuite',
    desc: true,
  });

  // Comparaison des voies : tous les filtres sauf la voie du bac.
  const parVoie = useMemo(
    () => computeDestinationsParVoieBac(filterPoursuite(records, { ...filters, voieBac: '' })),
    [records, filters],
  );
  // Comparaison des académies : tous les filtres sauf l'académie.
  const parAcademieRecords = useMemo(
    () => filterPoursuite(records, { ...filters, academie: '' }),
    [records, filters],
  );
  const parAcademie = useMemo(
    () => computeDestinationsParAcademie(parAcademieRecords),
    [parAcademieRecords],
  );
  const national = useMemo(
    () => computeDestinationsEnsemble(parAcademieRecords, 'France entière'),
    [parAcademieRecords],
  );

  const voieChart = useMemo(() => {
    const ensemble = computeDestinationsEnsemble(
      filterPoursuite(records, { ...filters, voieBac: '' }),
      ENSEMBLE,
    );
    const rows = parVoie.length > 1 ? [...parVoie, ensemble] : parVoie;
    return rows.map((g) => ({
      ...g,
      ...g.parts,
      sansPoursuite: g.sansPoursuitePct,
    }));
  }, [records, filters, parVoie]);

  const sortedAcademies = useMemo(
    () =>
      [...parAcademie].sort((a, b) => {
        const va = sortValue(a, sort.key);
        const vb = sortValue(b, sort.key);
        const cmp =
          typeof va === 'string' && typeof vb === 'string'
            ? va.localeCompare(vb, 'fr')
            : (va as number) - (vb as number);
        return sort.desc ? -cmp : cmp;
      }),
    [parAcademie, sort],
  );

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, desc: !prev.desc } : { key, desc: key !== 'label' },
    );
  }

  function selectVoie(label: string | undefined) {
    if (!label || label === ENSEMBLE) return;
    onFiltersChange({ voieBac: filters.voieBac === label ? '' : label });
  }

  const contexteVoies = [
    filters.annee !== null ? `Session ${filters.annee}` : 'Toutes sessions',
    filters.academie ? `Académie de ${filters.academie}` : 'France entière',
    filters.genre,
  ]
    .filter(Boolean)
    .join(' · ');

  const contexteAcademies = [
    filters.annee !== null ? `Session ${filters.annee}` : 'Toutes sessions',
    filters.voieBac || 'Toutes voies',
    filters.genre,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <MapIcon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Poursuites d&apos;études par bac et par académie
          </h2>
          <p className="text-sm text-slate-500">
            Ce que font les néo-bacheliers après le bac, selon leur voie de bac et leur académie.
          </p>
        </div>
      </div>

      {/* Selon la voie du bac */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Selon la voie du bac</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {contexteVoies} — cliquez sur une voie pour filtrer la page.
        </p>

        {voieChart.length === 0 ? (
          <p className="mt-4 text-center text-sm text-slate-500">
            Aucune donnée pour cette sélection.
          </p>
        ) : (
          <>
            <div className="mt-4 w-full" style={{ height: voieChart.length * 52 + 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={voieChart}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  onClick={(state) => selectVoie(state?.activeLabel)}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    allowDataOverflow
                    tickFormatter={(v: number) => `${v} %`}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={130}
                    tickFormatter={(v: string) => (v === ENSEMBLE ? v : shortVoie(v))}
                    tick={{ fontSize: 13, fill: '#334155' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(v: number, name: string) => [formatPct(v), SERIES_LABEL[name] ?? name]}
                  />
                  <Legend formatter={(value: string) => SERIES_LABEL[value] ?? value} />
                  {SERIES.map((s) => (
                    <Bar key={s.id} dataKey={s.id} stackId="destinations" fill={s.color}>
                      {voieChart.map((row) => (
                        <Cell
                          key={row.label}
                          fillOpacity={
                            !filters.voieBac || row.label === filters.voieBac ? 1 : 0.3
                          }
                        />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Voie du bac</th>
                    <th className="px-3 py-2 text-right font-medium">Bacheliers</th>
                    <th className="px-3 py-2 text-right font-medium">Poursuite</th>
                    {SERIES.map((s) => (
                      <th key={s.id} className="px-3 py-2 text-right font-medium">
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {voieChart.map((g) => {
                    const selected = g.label === filters.voieBac;
                    const isEnsemble = g.label === ENSEMBLE;
                    return (
                      <tr
                        key={g.label}
                        onClick={() => selectVoie(g.label)}
                        aria-selected={selected}
                        className={`${isEnsemble ? 'font-semibold' : 'cursor-pointer hover:bg-slate-50'} ${selected ? 'bg-indigo-50 text-indigo-900' : ''}`}
                      >
                        <td className="px-3 py-2">{g.label}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {nfInt.format(g.bacheliers)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-indigo-700">
                          {formatPct(g.tauxPoursuite)}
                        </td>
                        {TYPE_META.map((t) => (
                          <td key={t.id} className="px-3 py-2 text-right tabular-nums">
                            {formatPct(g.parts[t.id])}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                          {formatPct(g.sansPoursuitePct)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Selon l'académie */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="p-5 pb-3">
          <h3 className="text-base font-semibold text-slate-900">Selon l&apos;académie</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {contexteAcademies} — cliquez sur une académie pour filtrer la page.
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <SortableTh label="Académie" sortKey="label" sort={sort} onSort={toggleSort} />
              <SortableTh label="Bacheliers" sortKey="bacheliers" sort={sort} onSort={toggleSort} numeric />
              <SortableTh label="Poursuite" sortKey="tauxPoursuite" sort={sort} onSort={toggleSort} numeric />
              {TYPE_META.map((t) => (
                <SortableTh
                  key={t.id}
                  label={t.shortLabel}
                  sortKey={t.id}
                  sort={sort}
                  onSort={toggleSort}
                  numeric
                />
              ))}
              <SortableTh
                label="Sans poursuite"
                sortKey="sansPoursuitePct"
                sort={sort}
                onSort={toggleSort}
                numeric
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedAcademies.length === 0 ? (
              <tr>
                <td colSpan={TYPE_META.length + 4} className="px-3 py-6 text-center text-slate-500">
                  Aucune donnée pour cette sélection.
                </td>
              </tr>
            ) : (
              sortedAcademies.map((g) => {
                const selected = g.label === filters.academie;
                return (
                  <tr
                    key={g.label}
                    onClick={() => onFiltersChange({ academie: selected ? '' : g.label })}
                    aria-selected={selected}
                    className={`cursor-pointer ${selected ? 'bg-indigo-50 font-semibold text-indigo-900' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-3 py-2">{g.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{nfInt.format(g.bacheliers)}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-indigo-700">
                      {formatPct(g.tauxPoursuite)}
                    </td>
                    {TYPE_META.map((t) => (
                      <td key={t.id} className="px-3 py-2 text-right tabular-nums">
                        {formatPct(g.parts[t.id])}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {formatPct(g.sansPoursuitePct)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {sortedAcademies.length > 0 && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
              <tr>
                <td className="px-3 py-2">{national.label}</td>
                <td className="px-3 py-2 text-right tabular-nums">{nfInt.format(national.bacheliers)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-indigo-700">
                  {formatPct(national.tauxPoursuite)}
                </td>
                {TYPE_META.map((t) => (
                  <td key={t.id} className="px-3 py-2 text-right tabular-nums">
                    {formatPct(national.parts[t.id])}
                  </td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                  {formatPct(national.sansPoursuitePct)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Parts calculées par rapport au nombre de néo-bacheliers. Les inscriptions sont comptées dans
        l&apos;académie de la formation : du fait des mobilités, le taux de poursuite d&apos;une
        académie peut dépasser 100 %.
      </p>
    </section>
  );
}

interface SortableThProps {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; desc: boolean };
  onSort: (key: SortKey) => void;
  numeric?: boolean;
}

function SortableTh({ label, sortKey, sort, onSort, numeric = false }: SortableThProps) {
  const active = sort.key === sortKey;
  const Icon = sort.desc ? ArrowDown : ArrowUp;
  return (
    <th
      className={`px-3 py-2 font-medium ${numeric ? 'text-right' : ''}`}
      aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-slate-900 ${active ? 'text-indigo-700' : ''}`}
      >
        {label}
        {active && <Icon className="h-3.5 w-3.5" aria-hidden />}
      </button>
    </th>
  );
}
