import { useState } from 'react';
import { BarChart3, GraduationCap, LayoutDashboard, Map as MapIcon } from 'lucide-react';
import CartePage from './pages/CartePage';
import ParcoursupPage from './pages/ParcoursupPage';
import PoursuitesPage from './pages/PoursuitesPage';
import VueGeneralePage, { type DashboardTab } from './pages/VueGeneralePage';

const TABS: Array<{ id: DashboardTab; label: string; Icon: typeof LayoutDashboard }> = [
  { id: 'general', label: 'Vue générale', Icon: LayoutDashboard },
  { id: 'poursuites', label: "Poursuites d'études", Icon: GraduationCap },
  { id: 'parcoursup', label: 'Parcoursup 2025', Icon: BarChart3 },
  { id: 'carte', label: 'Carte', Icon: MapIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('general');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Tableau de bord ESR
              </h1>
              <p className="text-xs text-slate-500">
                Poursuites d&apos;études &amp; Parcoursup 2025
              </p>
            </div>
          </div>

          <nav
            aria-label="Navigation principale du tableau de bord"
            className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1"
          >
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        {activeTab === 'general' && <VueGeneralePage onNavigate={setActiveTab} />}
        {activeTab === 'poursuites' && <PoursuitesPage />}
        {activeTab === 'parcoursup' && <ParcoursupPage />}
        {activeTab === 'carte' && <CartePage />}
      </main>
    </div>
  );
}
