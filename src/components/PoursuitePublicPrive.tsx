import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building2 } from 'lucide-react';
import StatCard from './StatCard';
import {
  computePoursuitePublicPrive,
  type FiliereSecteurStat,
  type SecteurStat,
} from '../services/poursuiteStats';
import type { PoursuiteRecord } from '../types/data';

interface PoursuitePublicPriveProps {
  records: PoursuiteRecord[];
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

function SecteurTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SecteurStat }>;
}) {
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

function FiliereTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: FiliereSecteurStat }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-md">
      <p className="font-semibold text-slate-900">{row.filiere}</p>
      <dl className="mt-2 space-y-1 text-slate-600">
        <div className="flex justify-between gap-4">
          <dt className="text-blue-700">Public :</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {formatPct(row.publicPct)} ({nfInt.format(row.publicEffectif)})
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-amber-700">Privé :</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {formatPct(row.privePct)} ({nfInt.format(row.priveEffectif)})
          </dd>
        </div>
        {row.nrEffectif > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Non renseigné :</dt>
            <dd className="font-medium tabular-nums text-slate-700">
              {formatPct(row.nrPct)} ({nfInt.format(row.nrEffectif)})
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/**
 * Compare les poursuites d'études des néo-bacheliers
 * entre le secteur public et le secteur privé.
 */
export default function PoursuitePublicPrive({ records, subtitle }: PoursuitePublicPriveProps) {
  const summary = useMemo(() => computePoursuitePublicPrive(records), [records]);

  if (summary.totalBacheliers === 0) {
    return null;
  }

  const ecartPts =
    Math.round(
      (summary.secteurPublic.pourcentageBacheliers - summary.secteurPrive.pourcentageBacheliers) *
        10,
    ) / 10;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Comparaison Public vs Privé
          </h2>
          <p className="text-sm text-slate-500">
            {subtitle ??
              "Part des néo-bacheliers poursuivant leurs études dans l'enseignement supérieur public ou privé"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Secteur public (% bacheliers)"
          value={formatPct(summary.secteurPublic.pourcentageBacheliers)}
          highlighted
        />
        <StatCard
          label="Secteur privé (% bacheliers)"
          value={formatPct(summary.secteurPrive.pourcentageBacheliers)}
        />
        <StatCard
          label="Écart Public / Privé"
          value={`${ecartPts >= 0 ? '+' : ''}${nfPct.format(ecartPts)} pts`}
        />
        <StatCard
          label="Secteur non renseigné"
          value={formatPct(summary.secteurNr.pourcentageBacheliers)}
        />
      </div>

      {/* Barre de répartition proportionnelle parmi les poursuivants */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">
            Répartition parmi les {nfInt.format(summary.totalPoursuite)} poursuivants
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            {summary.secteurs.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label} : <strong className="text-slate-900">{formatPct(s.pourcentagePoursuivants)}</strong>{' '}
                ({nfInt.format(s.effectif)})
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
          {summary.secteurs.map((s) => (
            <div
              key={s.id}
              title={`${s.label} : ${formatPct(s.pourcentagePoursuivants)}`}
              style={{
                width: `${s.pourcentagePoursuivants}%`,
                backgroundColor: s.color,
              }}
              className="h-full transition-all"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Comparaison globale Public vs Privé */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900">
            % des néo-bacheliers par secteur
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Comparaison globale public, privé et non renseigné
          </p>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.secteurs}
                margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#334155' }}
                  interval={0}
                />
                <YAxis
                  domain={[0, (dataMax: number) => Math.min(100, Math.ceil((dataMax + 8) / 10) * 10)]}
                  tickFormatter={(v: number) => `${v} %`}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip content={<SecteurTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="pourcentageBacheliers" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {summary.secteurs.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                  <LabelList
                    dataKey="pourcentageBacheliers"
                    position="top"
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

        {/* Détail Public vs Privé par filière */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
          <h3 className="text-base font-semibold text-slate-900">
            Public vs Privé par type d&apos;études
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            En % de l&apos;ensemble des néo-bacheliers (Université et IUT relèvent du secteur public)
          </p>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.parFiliere}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="filiere" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis
                  tickFormatter={(v: number) => `${v} %`}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip content={<FiliereTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="publicPct"
                  name="Public"
                  stackId="secteur"
                  fill="#2563eb"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="privePct"
                  name="Privé"
                  stackId="secteur"
                  fill="#d97706"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
