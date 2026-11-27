import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, GraduationCap } from 'lucide-react';
import StatCard from '../components/StatCard';
import { loadParcoursupData, loadPoursuiteData } from '../services/dataLoader';
import { computeTotals } from '../services/parcoursupFilters';
import { computePoursuiteParType, listPoursuiteAnnees } from '../services/poursuiteStats';
import type { ParcoursupRecord, PoursuiteRecord } from '../types/data';

export type DashboardTab = 'general' | 'poursuites' | 'parcoursup' | 'carte';

interface VueGeneralePageProps {
  onNavigate: (tab: DashboardTab) => void;
}

const nfInt = new Intl.NumberFormat('fr-FR');
const nfPct = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Vue générale : synthèse nationale des deux jeux de données et accès aux vues détaillées. */
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
          Chiffres clés nationaux des poursuites d&apos;études ({latestAnnee}) et de Parcoursup 2025.
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
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Poursuites d&apos;études</h3>
            <p className="text-sm text-slate-600">
              Explorer le pourcentage de néo-bacheliers poursuivant leurs études par type de
              formation (Université, IUT, CPGE, STS/BTS, Autres) sur les sessions 2010–2025.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 group-hover:translate-x-0.5 transition">
            Consulter la vue
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('parcoursup')}
          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Parcoursup 2025</h3>
            <p className="text-sm text-slate-600">
              Analyser les {nfInt.format(parcoursupTotals.places)} places offertes et{' '}
              {nfInt.format(parcoursupTotals.candidatures)} candidatures par axe
              Formations/Candidatures, par académie et par établissement.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 group-hover:translate-x-0.5 transition">
            Consulter la vue
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </section>
  );
}
