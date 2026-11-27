import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpDown, Globe2 } from 'lucide-react';
import StatCard from './StatCard';
import { computeRecapNational, type NationalFiliereStat } from '../services/parcoursupStats';
import type { ParcoursupRecord } from '../types/data';

interface ParcoursupNationalTableProps {
  records: ParcoursupRecord[];
}

type SortKey =
  | 'filiere'
  | 'places'
  | 'candidatures'
  | 'tauxPression'
  | 'voeuxBacGeneral'
  | 'voeuxBacTechno'
  | 'voeuxBacPro'
  | 'voeuxAutres';

type DisplayMode = 'effectifs' | 'pourcentages';

const nfInt = new Intl.NumberFormat('fr-FR');
const nfDec1 = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const nfDec2 = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const BAC_COLORS = {
  general: '#4f46e5',
  techno: '#0891b2',
  pro: '#d97706',
  autres: '#94a3b8',
} as const;

/**
 * Sprint 3 — Tableau récapitulatif national Parcoursup 2025 par type de formation :
 * nombre de places offertes, nombre total de candidats et répartition par type de bac.
 */
export default function ParcoursupNationalTable({ records }: ParcoursupNationalTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>('candidatures');
  const [sortDesc, setSortDesc] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('pourcentages');

  const recap = useMemo(() => computeRecapNational(records), [records]);

  const sortedRows = useMemo(() => {
    const copy = [...recap.rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'filiere') {
        cmp = a.filiere.localeCompare(b.filiere, 'fr');
      } else if (sortBy === 'tauxPression') {
        cmp = (a.tauxPression ?? -1) - (b.tauxPression ?? -1);
      } else {
        cmp = a[sortBy] - b[sortBy];
      }
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [recap.rows, sortBy, sortDesc]);

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDesc((d) => !d);
    } else {
      setSortBy(key);
      setSortDesc(key !== 'filiere');
    }
  }

  function renderBacCell(count: number, pctVal: number) {
    if (displayMode === 'pourcentages') {
      return (
        <span className="tabular-nums">
          <strong className="font-medium text-slate-900">{nfDec1.format(pctVal)} %</strong>
          <span className="block text-[11px] text-slate-400">{nfInt.format(count)}</span>
        </span>
      );
    }
    return (
      <span className="tabular-nums">
        <strong className="font-medium text-slate-900">{nfInt.format(count)}</strong>
        <span className="block text-[11px] text-slate-400">{nfDec1.format(pctVal)} %</span>
      </span>
    );
  }

  const { totals } = recap;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <Globe2 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Tableau récapitulatif national — Parcoursup 2025
            </h3>
            <p className="text-sm text-slate-500">
              Nombre de places offertes, candidatures et répartition nationale par type de bac pour
              chaque type de formation
            </p>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Mode d'affichage des colonnes bac"
          className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium"
        >
          <button
            type="button"
            role="radio"
            aria-checked={displayMode === 'pourcentages'}
            onClick={() => setDisplayMode('pourcentages')}
            className={`rounded-md px-3 py-1.5 transition ${
              displayMode === 'pourcentages'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pourcentages prioritaires
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={displayMode === 'effectifs'}
            onClick={() => setDisplayMode('effectifs')}
            className={`rounded-md px-3 py-1.5 transition ${
              displayMode === 'effectifs'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Effectifs prioritaires
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Types de formation" value={nfInt.format(recap.rows.length)} />
        <StatCard label="Places offertes (France)" value={nfInt.format(totals.places)} />
        <StatCard
          label="Candidats totaux (vœux)"
          value={nfInt.format(totals.candidatures)}
          highlighted
        />
        <StatCard
          label="Part Bac général (national)"
          value={`${nfDec1.format(totals.pctBacGeneral)} %`}
        />
      </div>

      {/* Tableau national complet */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('filiere')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Type de formation
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('places')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Places offertes
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('candidatures')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Candidats (total)
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('tauxPression')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Pression
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-indigo-700">
                  <button
                    type="button"
                    onClick={() => handleSort('voeuxBacGeneral')}
                    className="inline-flex items-center gap-1 hover:text-indigo-900"
                  >
                    Bac général
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-cyan-700">
                  <button
                    type="button"
                    onClick={() => handleSort('voeuxBacTechno')}
                    className="inline-flex items-center gap-1 hover:text-cyan-900"
                  >
                    Bac techno
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-amber-700">
                  <button
                    type="button"
                    onClick={() => handleSort('voeuxBacPro')}
                    className="inline-flex items-center gap-1 hover:text-amber-900"
                  >
                    Bac pro
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => handleSort('voeuxAutres')}
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Autres
                    <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRows.map((row: NationalFiliereStat) => (
                <tr key={row.filiere} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.filiere}</p>
                    <p className="text-xs text-slate-500">
                      {nfInt.format(row.nbFormations)} formations
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-800">
                    {nfInt.format(row.places)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {nfInt.format(row.candidatures)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {row.tauxPression !== null ? `${nfDec2.format(row.tauxPression)}×` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {renderBacCell(row.voeuxBacGeneral, row.pctBacGeneral)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {renderBacCell(row.voeuxBacTechno, row.pctBacTechno)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {renderBacCell(row.voeuxBacPro, row.pctBacPro)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {renderBacCell(row.voeuxAutres, row.pctAutres)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-3 text-slate-900">
                  {totals.filiere} ({nfInt.format(totals.nbFormations)} formations)
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                  {nfInt.format(totals.places)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-indigo-700">
                  {nfInt.format(totals.candidatures)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                  {totals.tauxPression !== null ? `${nfDec2.format(totals.tauxPression)}×` : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {renderBacCell(totals.voeuxBacGeneral, totals.pctBacGeneral)}
                </td>
                <td className="px-4 py-3 text-right">
                  {renderBacCell(totals.voeuxBacTechno, totals.pctBacTechno)}
                </td>
                <td className="px-4 py-3 text-right">
                  {renderBacCell(totals.voeuxBacPro, totals.pctBacPro)}
                </td>
                <td className="px-4 py-3 text-right">
                  {renderBacCell(totals.voeuxAutres, totals.pctAutres)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Graphique empilé de la répartition nationale des candidats par type de bac */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h4 className="font-semibold text-slate-900">
          Répartition nationale des candidats par type de bac et type de formation
        </h4>
        <p className="mt-0.5 text-xs text-slate-500">
          {displayMode === 'effectifs'
            ? 'Nombre total de candidats (vœux) par origine scolaire'
            : 'Proportion (%) de chaque type de bac au sein de chaque type de formation'}
        </p>

        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedRows}
              margin={{ top: 8, right: 20, left: 16, bottom: 48 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="filiere"
                angle={-25}
                textAnchor="end"
                interval={0}
                height={64}
                tick={{ fontSize: 11, fill: '#334155' }}
              />
              <YAxis
                domain={displayMode === 'pourcentages' ? [0, 100] : [0, 'auto']}
                tickFormatter={(v: number) =>
                  displayMode === 'pourcentages'
                    ? `${v} %`
                    : v >= 1_000_000
                      ? `${nfDec1.format(v / 1_000_000)}M`
                      : v >= 1_000
                        ? `${Math.round(v / 1_000)}k`
                        : String(v)
                }
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  displayMode === 'pourcentages' ? `${nfDec1.format(v)} %` : nfInt.format(v),
                  name,
                ]}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey={displayMode === 'effectifs' ? 'voeuxBacGeneral' : 'pctBacGeneral'}
                name="Bac général"
                stackId="bac"
                fill={BAC_COLORS.general}
              />
              <Bar
                dataKey={displayMode === 'effectifs' ? 'voeuxBacTechno' : 'pctBacTechno'}
                name="Bac technologique"
                stackId="bac"
                fill={BAC_COLORS.techno}
              />
              <Bar
                dataKey={displayMode === 'effectifs' ? 'voeuxBacPro' : 'pctBacPro'}
                name="Bac professionnel"
                stackId="bac"
                fill={BAC_COLORS.pro}
              />
              <Bar
                dataKey={displayMode === 'effectifs' ? 'voeuxAutres' : 'pctAutres'}
                name="Autres candidats"
                stackId="bac"
                fill={BAC_COLORS.autres}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
