import { AxeVue } from './components/axe';
import VoeuxParcoursup from './components/VoeuxParcoursup';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tableau de bord — Poursuites d&apos;études &amp; Parcoursup 2025
        </h1>

        {/* Vues provisoires pour tester la bascule, à remplacer à l'intégration */}
        <AxeVue
          formations={<p className="text-slate-600">Vue Formations</p>}
          candidatures={<VoeuxParcoursup/>}
        />
      </div>
    </div>
    
  );
}
