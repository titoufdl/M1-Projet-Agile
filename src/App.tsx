import ParcoursupPage from './pages/ParcoursupPage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Tableau de bord — Poursuites d&apos;études &amp; Parcoursup 2025
        </h1>
      </header>
      <main>
        <ParcoursupPage />
      </main>
    </div>
  );
}
