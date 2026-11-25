import { useState } from 'react';
import { AxeVue } from './components/axe';
import PoursuiteParType from './components/PoursuiteParType';
import VoeuxParcoursup from './components/VoeuxParcoursup';

type TabId = 'parcoursup' | 'poursuites';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('poursuites');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Tableau de bord — Poursuites d&apos;études &amp; Parcoursup 2025
          </h1>

          <nav
            aria-label="Vues du tableau de bord"
            className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs"
          >
            <button
              type="button"
              onClick={() => setActiveTab('poursuites')}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'poursuites'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Poursuites d&apos;études
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('parcoursup')}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'parcoursup'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parcoursup 2025
            </button>
          </nav>
        </div>

        {activeTab === 'poursuites' ? (
          <PoursuiteParType />
        ) : (
          <AxeVue
            formations={<p className="text-slate-600">Vue Formations</p>}
            candidatures={<VoeuxParcoursup />}
          />
        )}
      </div>
    </div>
  );
}
