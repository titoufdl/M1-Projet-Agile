import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, GraduationCap, Map as MapIcon, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';
import { loadParcoursupData, loadPoursuiteData } from '../services/dataLoader';
import { computeTotals } from '../services/parcoursupFilters';
import { computePoursuiteParType, listPoursuiteAnnees } from '../services/poursuiteStats';
import type { ParcoursupRecord, PoursuiteRecord } from '../types/data';

export type DashboardTab = 'general' | 'poursuites' | 'evolution' | 'parcoursup' | 'carte';

interface VueGeneralePageProps {
  onNavigate: (tab: DashboardTab) => void;
}

const nfInt = new Intl.NumberFormat('fr-FR');
const nfPct = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Vue générale : synthèse nationale des jeux de données et accès aux 4 vues du tableau de bord. */
export default function VueGeneralePage({ onNavigate }: VueGeneralePageProps) {
  const [poursuite, setPoursuite] = useState<PoursuiteRecord[] | null>(null);
  const [parcoursup, setParcoursup] = useState<ParcoursupRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadPoursuiteData(), loadParcoursupData()])
      .then(([pData, psData]) => {
        setPoursuite(pData);
        setParcoursup(psData);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const latestAnnee = useMemo(
    () => (poursuite ? (listPoursuiteAnnees(poursuite)[0] ?? null) : null),
    [poursuite],
  );

  const poursuiteSummary = useMemo(() => {
    if (!poursuite || latestAnnee === null) return null;
    return computePoursuiteParType(poursuite.filter((r) => r.annee === latestAnnee));
  }, [poursuite, latestAnnee]);

  const parcoursupTotals = useMemo(
    () => (parcoursup ? computeTotals(parcoursup) : null),
    [parcoursup],
  );

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Erreur de chargement des données : {error}
      </div>
    );
  }

  if (!poursuiteSummary || !parcoursupTotals) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Chargement de la synthèse nationale…
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vue générale</h2>
        <p className="text-sm text-slate-600">
          Synthèse nationale des poursuites d&apos;études ({latestAnnee}) et de Parcoursup 2025, et
          accès rapide aux différentes analyses du tableau de bord.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={`Néo-bacheliers (${latestAnnee})`}
          value={nfInt.format(poursuiteSummary.totalBacheliers)}
        />
        <StatCard
          label="Taux de poursuite"
          value={`${nfPct.format(poursuiteSummary.tauxPoursuiteGlobal)} %`}
          highlighted
        />
        <StatCard label="Formations Parcoursup" value={nfInt.format(parcoursupTotals.formations)} />
        <StatCard
          label="Candidatures Parcoursup"
          value={nfInt.format(parcoursupTotals.candidatures)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onNavigate('poursuites')}
          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Poursuites d&apos;études</h3>
            <p className="text-sm text-slate-600">
              Explorer les poursuites des néo-bacheliers par voie de bac et académie, la répartition
              par type d&apos;études (Université, IUT, CPGE, STS/BTS) et la comparaison Public /
              Privé.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition group-hover:translate-x-0.5">
            Consulter la vue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('evolution')}
          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:border-emerald-300 hover:shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Évolution 2015–2025</h3>
            <p className="text-sm text-slate-600">
              Suivre la trajectoire sur 10 ans du taux et des effectifs de poursuite d&apos;études
              par académie, filière, voie du bac et genre (repères Millennials 2018 et Covid-19).
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 transition group-hover:translate-x-0.5">
            Consulter la vue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('parcoursup')}
          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:border-cyan-300 hover:shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <BarChart3 className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Parcoursup 2025</h3>
            <p className="text-sm text-slate-600">
              Analyser les {nfInt.format(parcoursupTotals.places)} places offertes et{' '}
              {nfInt.format(parcoursupTotals.candidatures)} candidatures : exploration générale,
              détail par université (taux de pression, part des bacheliers) et tableau national.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 transition group-hover:translate-x-0.5">
            Consulter la vue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('carte')}
          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:border-amber-300 hover:shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <MapIcon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Carte des formations</h3>
            <p className="text-sm text-slate-600">
              Parcourir la carte interactive des {nfInt.format(parcoursupTotals.etablissements)}{' '}
              établissements Parcoursup 2025 par académie et comparer leur offre de formations.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 transition group-hover:translate-x-0.5">
            Consulter la vue
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </button>
      </div>
    </section>
  );
}
