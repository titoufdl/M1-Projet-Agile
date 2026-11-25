import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GraduationCap } from 'lucide-react';
import StatCard from './StatCard';
import { loadPoursuiteData } from '../services/dataLoader';
import {
  computePoursuiteParType,
  listPoursuiteAnnees,
  type TypeEtudeStat,
} from '../services/poursuiteStats';
import type { PoursuiteRecord } from '../types/data';

interface PoursuiteParTypeProps {
  /**
   * Données déjà filtrées (par année, académie, bac...).
   * Si omis, le composant charge le jeu de données complet et propose un sélecteur d'année.
   */
  records?: PoursuiteRecord[];
  /** Titre optionnel pour contextualiser le périmètre filtré. */
  subtitle?: string;
}

const nfInt = new Intl.NumberFormat('fr-FR');
const nfPct = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatPct(value: number): string {
  return `${nfPct.format(value)} %`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TypeEtudeStat }>;
}

function PoursuiteTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-md">
      <p className="font-semibold text-slate-900">{item.label}</p>
      <dl className="mt-2 space-y-1 text-slate-600">
        <div className="flex justify-between gap-4">
          <dt>% des néo-bacheliers :</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {formatPct(item.pourcentageBacheliers)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Part parmi les poursuivants :</dt>
          <dd className="font-medium tabular-nums text-slate-800">
            {formatPct(item.pourcentagePoursuivants)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Effectif :</dt>
          <dd className="font-medium tabular-nums text-slate-800">
            {nfInt.format(item.effectif)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Affiche le pourcentage de néo-bacheliers poursuivant leurs études
 * par type de formation (Université, IUT, CPGE, STS/BTS, Autres).
 */
export default function PoursuiteParType({ records: externalRecords, subtitle }: PoursuiteParTypeProps) {
  const isControlled = externalRecords !== undefined;

  const [loadedRecords, setLoadedRecords] = useState<PoursuiteRecord[] | null>(null);
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isControlled) return;
    loadPoursuiteData()
      .then((data) => {
        setLoadedRecords(data);
        const annees = listPoursuiteAnnees(data);
        if (annees.length > 0) {
          setSelectedAnnee(annees[0]);
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, [isControlled]);

  const annees = useMemo(
    () => (loadedRecords ? listPoursuiteAnnees(loadedRecords) : []),
    [loadedRecords],
  );

  const activeRecords = useMemo(() => {
    if (isControlled) return externalRecords;
    if (!loadedRecords) return [];
    if (selectedAnnee === null) return loadedRecords;
    return loadedRecords.filter((r) => r.annee === selectedAnnee);
  }, [isControlled, externalRecords, loadedRecords, selectedAnnee]);

  const summary = useMemo(() => computePoursuiteParType(activeRecords), [activeRecords]);

  if (!isControlled && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Erreur lors du chargement des poursuites d&apos;études : {error}
      </div>
    );
  }

  if (!isControlled && loadedRecords === null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement des données de poursuite d&apos;études…
      </div>
    );
  }

  const topType = summary.parType[0];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Poursuite d&apos;études par type de formation
            </h2>
            <p className="text-sm text-slate-500">
              {subtitle ??
                (selectedAnnee !== null
                  ? `Répartition des néo-bacheliers — session ${selectedAnnee}`
                  : 'Répartition des néo-bacheliers par type de formation')}
            </p>
          </div>
        </div>

        {!isControlled && annees.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="poursuite-annee-select" className="text-sm font-medium text-slate-600">
              Session :
            </label>
            <select
              id="poursuite-annee-select"
              value={selectedAnnee ?? ''}
              onChange={(e) => setSelectedAnnee(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {annees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {summary.totalBacheliers === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Aucune donnée de poursuite d&apos;études disponible pour cette sélection.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Néo-bacheliers" value={nfInt.format(summary.totalBacheliers)} />
            <StatCard
              label="Taux global de poursuite"
              value={formatPct(summary.tauxPoursuiteGlobal)}
              highlighted
            />
            <StatCard
              label="1re voie de poursuite"
              value={
                topType
                  ? `${topType.shortLabel} (${formatPct(topType.pourcentageBacheliers)})`
                  : '—'
              }
            />
            <StatCard
              label="Sans poursuite immédiate"
              value={formatPct(summary.sansPoursuitePourcentage)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
              <h3 className="text-base font-semibold text-slate-900">
                % de néo-bacheliers par type d&apos;études
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Part des néo-bacheliers s&apos;inscrivant dans chaque filière de l&apos;enseignement
                supérieur
              </p>

              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.parType}
                    layout="vertical"
                    margin={{ top: 8, right: 56, left: 16, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      domain={[0, (dataMax: number) => Math.min(100, Math.ceil((dataMax + 5) / 10) * 10)]}
                      tickFormatter={(v: number) => `${v} %`}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={150}
                      tick={{ fontSize: 12, fill: '#334155' }}
                    />
                    <Tooltip content={<PoursuiteTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="pourcentageBacheliers" radius={[0, 6, 6, 0]} barSize={28}>
                      {summary.parType.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey="pourcentageBacheliers"
                        position="right"
                        formatter={(value: unknown) =>
                          typeof value === 'number' ? formatPct(value) : ''
                        }
                        style={{ fill: '#0f172a', fontSize: 12, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
              <h3 className="text-base font-semibold text-slate-900">Détail par filière</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Effectifs et part parmi les {nfInt.format(summary.totalPoursuite)} poursuivants
              </p>

              <ul className="mt-4 divide-y divide-slate-100">
                {summary.parType.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-slate-800">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-slate-900">
                        {formatPct(item.pourcentageBacheliers)}
                      </span>
                    </div>

                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, item.pourcentageBacheliers)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>

                    <div className="mt-1 flex justify-between text-xs text-slate-500 tabular-nums">
                      <span>{nfInt.format(item.effectif)} bacheliers</span>
                      <span>{formatPct(item.pourcentagePoursuivants)} des poursuivants</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
