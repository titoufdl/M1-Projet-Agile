import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RotateCcw, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import { loadPoursuiteData } from '../services/dataLoader';
import {
  computeEvolution,
  computeTauxParDimension,
  EVOLUTION_DEBUT,
  EVOLUTION_FIN,
  filterEvolution,
  type EvolutionFilters,
} from '../services/poursuiteEvolution';
import {
  listAcademiesPoursuite,
  listGenres,
  listVoiesBac,
  TYPE_META,
} from '../services/poursuiteStats';
import type { PoursuiteRecord } from '../types/data';

type Mode = 'taux' | 'effectifs';

const EMPTY_FILTERS: EvolutionFilters = { voieBac: '', academie: '', genre: '' };

const VOIE_COLORS: Record<string, string> = {
  'Bac général': '#4f46e5',
  'Bac technologique': '#0891b2',
  'Bac professionnel': '#d97706',
};
const GENRE_COLORS: Record<string, string> = {
  Féminin: '#db2777',
  Masculin: '#2563eb',
};
const ORDRE_VOIES = Object.keys(VOIE_COLORS);
const FALLBACK_COLORS = ['#64748b', '#0d9488', '#9333ea'];

const nfInt = new Intl.NumberFormat('fr-FR');
const nfPct = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfSigned = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const nfCompact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

const formatPct = (v: number) => `${nfPct.format(v)} %`;
const tooltipPct = (v: unknown) => (typeof v === 'number' ? formatPct(v) : String(v));
const tooltipInt = (v: unknown) => (typeof v === 'number' ? nfInt.format(v) : String(v));
const sessionLabel = (l: unknown) => `Session ${String(l)}`;

const AXIS_TICK = { fontSize: 12, fill: '#64748b' };

/** Repères clés : arrivée de la génération 2000 (Millennials) en 2018 et Covid-19 en 2020. */
function KeyEventMarkers(yAxisId?: string) {
  return (
    <>
      <ReferenceLine
        yAxisId={yAxisId}
        x={2018}
        stroke="#d97706"
        strokeDasharray="4 4"
        label={{
          value: 'Millennials (gén. 2000)',
          position: 'insideTopLeft',
          fill: '#b45309',
          fontSize: 11,
        }}
      />
      <ReferenceLine
        yAxisId={yAxisId}
        x={2020}
        stroke="#94a3b8"
        strokeDasharray="4 4"
        label={{ value: 'Covid-19', position: 'insideTopRight', fill: '#64748b', fontSize: 11 }}
      />
    </>
  );
}

function ChartCard({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      <div className="mt-4 h-80 w-full">{children}</div>
    </div>
  );
}

/**
 * Onglet Évolution : suivi des poursuites d'études des néo-bacheliers
 * de 2015 à 2025 (taux global, par type de formation, par voie du bac et par genre).
 */
export default function EvolutionPage() {
  const [records, setRecords] = useState<PoursuiteRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EvolutionFilters>(EMPTY_FILTERS);
  const [mode, setMode] = useState<Mode>('taux');

  useEffect(() => {
    loadPoursuiteData()
      .then(setRecords)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const data = useMemo(() => records ?? [], [records]);
  const voiesBac = useMemo(() => listVoiesBac(data), [data]);
  const academies = useMemo(() => listAcademiesPoursuite(data), [data]);
  const genres = useMemo(() => listGenres(data), [data]);

  const filtered = useMemo(() => filterEvolution(data, filters), [data, filters]);
  const summary = useMemo(() => computeEvolution(filtered), [filtered]);

  // Les comparaisons par voie / genre ignorent leur propre filtre pour rester lisibles.
  const parVoie = useMemo(
    () =>
      computeTauxParDimension(filterEvolution(data, { ...filters, voieBac: '' }), (r) => r.voieBac),
    [data, filters],
  );
  const parGenre = useMemo(
    () =>
      computeTauxParDimension(filterEvolution(data, { ...filters, genre: '' }), (r) => r.genre),
    [data, filters],
  );

  const scopeLabel = useMemo(() => {
    const parts: string[] = [];
    if (filters.voieBac) parts.push(filters.voieBac);
    if (filters.academie) parts.push(`Académie de ${filters.academie}`);
    if (filters.genre) parts.push(filters.genre);
    return parts.length > 0 ? parts.join(' · ') : 'France entière';
  }, [filters]);

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

  const { debut, fin, pic } = summary;
  const typesOrdered = [...TYPE_META].sort(
    (a, b) => (fin?.parts[b.id] ?? 0) - (fin?.parts[a.id] ?? 0),
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <TrendingUp className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Évolution des poursuites d&apos;études ({EVOLUTION_DEBUT}–{EVOLUTION_FIN})
          </h2>
          <p className="text-sm text-slate-500">{scopeLabel}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_auto_auto]">
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

        <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Affichage
          <div role="radiogroup" aria-label="Unité" className="inline-flex rounded-lg bg-slate-100 p-1">
            {(
              [
                ['taux', '% bacheliers'],
                ['effectifs', 'Effectifs'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  mode === value
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFilters(EMPTY_FILTERS);
            setMode('taux');
          }}
          className="flex items-center justify-center gap-2 self-end rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Réinitialiser
        </button>
      </div>

      {summary.points.length === 0 || !debut || !fin ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Aucune donnée disponible pour cette sélection sur {EVOLUTION_DEBUT}–{EVOLUTION_FIN}.
        </div>
      ) : (
        <>
          {/* Indicateurs clés */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={`Taux de poursuite ${debut.annee}`}
              value={formatPct(debut.tauxPoursuite)}
            />
            <StatCard
              label={`Taux de poursuite ${fin.annee}`}
              value={formatPct(fin.tauxPoursuite)}
              highlighted
            />
            <StatCard
              label={`Évolution ${debut.annee} → ${fin.annee}`}
              value={`${nfSigned.format(summary.ecartTauxPoints)} pts`}
            />
            <StatCard
              label={pic ? `Pic : session ${pic.annee}` : 'Pic'}
              value={pic ? formatPct(pic.tauxPoursuite) : '—'}
            />
          </div>

          {/* Taux global + volume de bacheliers */}
          <ChartCard
            title="Taux global de poursuite et nombre de néo-bacheliers"
            description={`Néo-bacheliers : ${nfInt.format(debut.bacheliers)} en ${debut.annee} → ${nfInt.format(fin.bacheliers)} en ${fin.annee} (${nfSigned.format(summary.variationBacheliersPct)} %)`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={summary.rows} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="annee" tick={AXIS_TICK} />
                <YAxis
                  yAxisId="taux"
                  domain={[(min: number) => Math.max(0, Math.floor(min - 5)), (max: number) => Math.min(100, Math.ceil(max + 3))]}
                  tickFormatter={(v: number) => `${v} %`}
                  tick={AXIS_TICK}
                  width={56}
                />
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  tickFormatter={(v: number) => nfCompact.format(v)}
                  tick={AXIS_TICK}
                  width={56}
                />
                <Tooltip
                  labelFormatter={sessionLabel}
                  formatter={(v: unknown, name: unknown) =>
                    name === 'Néo-bacheliers' ? tooltipInt(v) : tooltipPct(v)
                  }
                />
                <Legend />
                {KeyEventMarkers('taux')}
                <Bar
                  yAxisId="volume"
                  dataKey="bacheliers"
                  name="Néo-bacheliers"
                  fill="#c7d2fe"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
                <Line
                  yAxisId="taux"
                  type="monotone"
                  dataKey="tauxPoursuite"
                  name="Taux de poursuite"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Par type de formation */}
          <ChartCard
            title="Évolution par type de formation"
            description={
              mode === 'taux'
                ? 'Part des néo-bacheliers inscrits dans chaque filière, session par session'
                : 'Nombre de néo-bacheliers inscrits dans chaque filière (cumulé)'
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              {mode === 'taux' ? (
                <LineChart data={summary.rows} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="annee" tick={AXIS_TICK} />
                  <YAxis tickFormatter={(v: number) => `${v} %`} tick={AXIS_TICK} width={56} />
                  <Tooltip labelFormatter={sessionLabel} formatter={tooltipPct} />
                  <Legend />
                  {KeyEventMarkers()}
                  {typesOrdered.map((meta) => (
                    <Line
                      key={meta.id}
                      type="monotone"
                      dataKey={`pct_${meta.id}`}
                      name={meta.shortLabel}
                      stroke={meta.color}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <AreaChart data={summary.rows} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="annee" tick={AXIS_TICK} />
                  <YAxis tickFormatter={(v: number) => nfCompact.format(v)} tick={AXIS_TICK} width={56} />
                  <Tooltip labelFormatter={sessionLabel} formatter={tooltipInt} />
                  <Legend />
                  {KeyEventMarkers()}
                  {typesOrdered.map((meta) => (
                    <Area
                      key={meta.id}
                      type="monotone"
                      dataKey={`eff_${meta.id}`}
                      name={meta.shortLabel}
                      stackId="types"
                      stroke={meta.color}
                      fill={meta.color}
                      fillOpacity={0.55}
                    />
                  ))}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          {/* Par voie du bac et par genre */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard
              title="Taux de poursuite par voie du bac"
              description="Comparaison des trois voies (le filtre « Voie du bac » met une voie en avant)"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={parVoie.rows} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="annee" tick={AXIS_TICK} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v} %`}
                    tick={AXIS_TICK}
                    width={56}
                  />
                  <Tooltip labelFormatter={sessionLabel} formatter={tooltipPct} />
                  <Legend />
                  {KeyEventMarkers()}
                  {[...parVoie.keys]
                    .sort((a, b) => ORDRE_VOIES.indexOf(a) - ORDRE_VOIES.indexOf(b))
                    .map((key, i) => {
                      const dimmed = filters.voieBac !== '' && filters.voieBac !== key;
                      return (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={key}
                          stroke={VOIE_COLORS[key] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                          strokeWidth={dimmed ? 1.5 : 2.5}
                          strokeOpacity={dimmed ? 0.3 : 1}
                          dot={{ r: dimmed ? 0 : 3 }}
                        />
                      );
                    })}
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Taux de poursuite par genre"
              description="Comparaison filles / garçons (le filtre « Genre » met un genre en avant)"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={parGenre.rows} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="annee" tick={AXIS_TICK} />
                  <YAxis
                    domain={[(min: number) => Math.max(0, Math.floor(min - 5)), (max: number) => Math.min(100, Math.ceil(max + 3))]}
                    tickFormatter={(v: number) => `${v} %`}
                    tick={AXIS_TICK}
                    width={56}
                  />
                  <Tooltip labelFormatter={sessionLabel} formatter={tooltipPct} />
                  <Legend />
                  {KeyEventMarkers()}
                  {[...parGenre.keys].sort().map((key, i) => {
                    const dimmed = filters.genre !== '' && filters.genre !== key;
                    return (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={key}
                        stroke={GENRE_COLORS[key] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                        strokeWidth={dimmed ? 1.5 : 2.5}
                        strokeOpacity={dimmed ? 0.3 : 1}
                        dot={{ r: dimmed ? 0 : 3 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <p className="text-xs text-slate-500">
            Source : MESR, « Taux de poursuite des néo-bacheliers dans l&apos;enseignement supérieur
            par académie ». Le taux rapporte les inscriptions dans le supérieur à la rentrée qui
            suit le bac au nombre de néo-bacheliers de la session. Les lignes pointillées marquent
            l&apos;arrivée de la génération 2000 (Millennials) au bac en 2018 et la session 2020
            (bac en contrôle continu, Covid-19).
          </p>
        </>
      )}
    </div>
  );
}
