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
import { ArrowUpDown, Building2, Gauge, Users } from 'lucide-react';
import StatCard from './StatCard';
import {
  computeFormationsUniversite,
  listUniversites,
  type FormationUniversiteStat,
} from '../services/parcoursupStats';
import type { ParcoursupRecord } from '../types/data';

interface ParcoursupUniversiteProps {
  records: ParcoursupRecord[];
}

type SortKey = 'tauxPression' | 'candidatures' | 'places' | 'formation';

const DEFAULT_UNIVERSITE = 'La Rochelle Université';
const CHART_LIMIT = 12;

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

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function PressionBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-slate-400">—</span>;
  }
  const cls =
    value >= 10
      ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
      : value >= 3
        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${cls}`}>
      {nfDec2.format(value)}×
    </span>
  );
}

/**
 * Sprint 3 — Détail des formations par université :
 * places disponibles, candidatures, taux de pression et part des bacheliers par filière de bac.
 */
export default function ParcoursupUniversite({ records }: ParcoursupUniversiteProps) {
  const [onlyUniversites, setOnlyUniversites] = useState(true);
  const [searchEtab, setSearchEtab] = useState('');
  const [selectedEtab, setSelectedEtab] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortKey>('tauxPression');
  const [sortDesc, setSortDesc] = useState(true);

  const etablissements = useMemo(
    () => listUniversites(records, onlyUniversites),
    [records, onlyUniversites],
  );

  const filteredEtablissements = useMemo(() => {
    const q = searchEtab.trim().toLowerCase();
    if (!q) return etablissements;
    return etablissements.filter((e) => e.toLowerCase().includes(q));
  }, [etablissements, searchEtab]);

  const effectiveEtab = useMemo(() => {
    if (selectedEtab && etablissements.includes(selectedEtab)) return selectedEtab;
    if (etablissements.includes(DEFAULT_UNIVERSITE)) return DEFAULT_UNIVERSITE;
    return etablissements[0] ?? '';
  }, [selectedEtab, etablissements]);

  const summary = useMemo(
    () => computeFormationsUniversite(records, effectiveEtab),
    [records, effectiveEtab],
  );

  const sortedFormations = useMemo(() => {
    if (!summary) return [];
    const copy = [...summary.formations];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'formation') {
        cmp = a.formation.localeCompare(b.formation, 'fr');
      } else if (sortBy === 'tauxPression') {
        cmp = (a.tauxPression ?? -1) - (b.tauxPression ?? -1);
      } else {
        cmp = a[sortBy] - b[sortBy];
      }
      return sortDesc ? -cmp : cmp;
    });
    return copy;
  }, [summary, sortBy, sortDesc]);

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDesc((d) => !d);
    } else {
      setSortBy(key);
      setSortDesc(key !== 'formation');
    }
  }

  const chartPressionData = useMemo(
    () =>
      sortedFormations.slice(0, CHART_LIMIT).map((f) => ({
        nom: truncate(f.formation, 38),
        detail: f.formation,
        tauxPression: f.tauxPression ?? 0,
        places: f.places,
        candidatures: f.candidatures,
      })),
    [sortedFormations],
  );

  const chartBacData = useMemo(
    () =>
      sortedFormations.slice(0, CHART_LIMIT).map((f) => ({
        nom: truncate(f.formation, 38),
        detail: f.formation,
        pctBacGeneral: f.pctBacGeneral,
        pctBacTechno: f.pctBacTechno,
        pctBacPro: f.pctBacPro,
        pctAutres: f.pctAutres,
      })),
    [sortedFormations],
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Détail des formations par université
              </h3>
              <p className="text-sm text-slate-500">
                Places disponibles, candidatures, taux de pression et part des bacheliers par
                filière de bac
              </p>
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={onlyUniversites}
              onChange={(e) => {
                setOnlyUniversites(e.target.checked);
                setSearchEtab('');
              }}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Universités uniquement ({listUniversites(records, true).length})
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Filtrer la liste
            <input
              type="search"
              value={searchEtab}
              onChange={(e) => setSearchEtab(e.target.value)}
              placeholder="Ex. : La Rochelle, Bordeaux, Paris…"
              className="rounded-md border border-slate-300 px-3 py-2 font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Université / établissement ({nfInt.format(filteredEtablissements.length)})
            <select
              value={effectiveEtab}
              onChange={(e) => setSelectedEtab(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
            >
              {filteredEtablissements.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {!summary ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Sélectionnez une université pour consulter ses formations.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Formations" value={nfInt.format(summary.nbFormations)} />
            <StatCard label="Places disponibles" value={nfInt.format(summary.totalPlaces)} />
            <StatCard label="Candidatures totales" value={nfInt.format(summary.totalCandidatures)} />
            <StatCard
              label="Taux de pression moyen"
              value={
                summary.tauxPressionMoyen !== null
                  ? `${nfDec2.format(summary.tauxPressionMoyen)} cand./place`
                  : '—'
              }
              highlighted
            />
          </div>

          {/* Graphiques côte à côte : Taux de pression & Répartition par filière de bac */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-indigo-600" aria-hidden />
                <h4 className="font-semibold text-slate-900">
                  Taux de pression par formation (Top {chartPressionData.length})
                </h4>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Nombre de candidats par place disponible — {summary.etablissement} ({summary.academie})
              </p>

              <div className="mt-4 w-full" style={{ height: Math.max(260, chartPressionData.length * 32 + 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartPressionData}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      tickFormatter={(v: number) => `${v}×`}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="nom"
                      width={210}
                      tick={{ fontSize: 11, fill: '#334155' }}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${nfDec2.format(v)} cand./place`, 'Taux de pression']}
                      labelFormatter={(_label, payload) =>
                        (payload?.[0]?.payload as { detail?: string } | undefined)?.detail ?? ''
                      }
                    />
                    <Bar dataKey="tauxPression" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-600" aria-hidden />
                <h4 className="font-semibold text-slate-900">
                  Part des bacheliers par filière de bac (Top {chartBacData.length})
                </h4>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Proportion de candidats par type de bac (Général, Technologique, Pro, Autres)
              </p>

              <div className="mt-4 w-full" style={{ height: Math.max(260, chartBacData.length * 32 + 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartBacData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(v: number) => `${v} %`}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="nom"
                      width={210}
                      tick={{ fontSize: 11, fill: '#334155' }}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [`${nfDec1.format(v)} %`, name]}
                      labelFormatter={(_label, payload) =>
                        (payload?.[0]?.payload as { detail?: string } | undefined)?.detail ?? ''
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="pctBacGeneral" name="Bac général" stackId="bac" fill={BAC_COLORS.general} />
                    <Bar dataKey="pctBacTechno" name="Bac techno" stackId="bac" fill={BAC_COLORS.techno} />
                    <Bar dataKey="pctBacPro" name="Bac pro" stackId="bac" fill={BAC_COLORS.pro} />
                    <Bar dataKey="pctAutres" name="Autres" stackId="bac" fill={BAC_COLORS.autres} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tableau détaillé de toutes les formations de l'université */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <div>
                <h4 className="font-semibold text-slate-900">
                  Toutes les formations — {summary.etablissement}
                </h4>
                <p className="text-xs text-slate-500">
                  {summary.ville} · Académie de {summary.academie} · Cliquez sur une colonne pour
                  trier
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAC_COLORS.general }} />
                  Général ({nfDec1.format(summary.pctBacGeneral)} %)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAC_COLORS.techno }} />
                  Techno ({nfDec1.format(summary.pctBacTechno)} %)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAC_COLORS.pro }} />
                  Pro ({nfDec1.format(summary.pctBacPro)} %)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAC_COLORS.autres }} />
                  Autres ({nfDec1.format(summary.pctAutres)} %)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => handleSort('formation')}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Formation
                        <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => handleSort('places')}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Places
                        <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => handleSort('candidatures')}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Candidatures
                        <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => handleSort('tauxPression')}
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                      >
                        Taux de pression
                        <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">Part des bacheliers par filière</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedFormations.map((f: FormationUniversiteStat) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{f.formation}</p>
                        <p className="text-xs text-slate-500">
                          {f.filiere} · {f.selectivite}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-800">
                        {nfInt.format(f.places)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-800">
                        {nfInt.format(f.candidatures)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PressionBadge value={f.tauxPression} />
                      </td>
                      <td className="min-w-64 px-4 py-3">
                        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            title={`Bac général : ${nfDec1.format(f.pctBacGeneral)} % (${nfInt.format(f.voeuxBacGeneral)})`}
                            style={{ width: `${f.pctBacGeneral}%`, backgroundColor: BAC_COLORS.general }}
                          />
                          <div
                            title={`Bac techno : ${nfDec1.format(f.pctBacTechno)} % (${nfInt.format(f.voeuxBacTechno)})`}
                            style={{ width: `${f.pctBacTechno}%`, backgroundColor: BAC_COLORS.techno }}
                          />
                          <div
                            title={`Bac pro : ${nfDec1.format(f.pctBacPro)} % (${nfInt.format(f.voeuxBacPro)})`}
                            style={{ width: `${f.pctBacPro}%`, backgroundColor: BAC_COLORS.pro }}
                          />
                          <div
                            title={`Autres : ${nfDec1.format(f.pctAutres)} % (${nfInt.format(f.voeuxAutres)})`}
                            style={{ width: `${f.pctAutres}%`, backgroundColor: BAC_COLORS.autres }}
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-slate-600">
                          <span>
                            Gén. <strong className="text-indigo-700">{nfDec1.format(f.pctBacGeneral)}%</strong>
                          </span>
                          <span>
                            Tech. <strong className="text-cyan-700">{nfDec1.format(f.pctBacTechno)}%</strong>
                          </span>
                          <span>
                            Pro <strong className="text-amber-700">{nfDec1.format(f.pctBacPro)}%</strong>
                          </span>
                          <span>
                            Aut. <strong className="text-slate-700">{nfDec1.format(f.pctAutres)}%</strong>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
