import VoeuxParcoursup from './components/VoeuxParcoursup';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Tableau de bord — Poursuites d&apos;études &amp; Parcoursup 2025
      </h1>
      <p className="mt-3 max-w-xl text-slate-600">
        Socle technique prêt (React, TypeScript, Vite, Tailwind CSS, Recharts, Leaflet).
      </p>
      <VoeuxParcoursup />
    </div>
    
  );
}
