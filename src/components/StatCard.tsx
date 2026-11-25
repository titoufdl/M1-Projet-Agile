interface StatCardProps {
  label: string;
  value: string;
  highlighted?: boolean;
}

/** Carte d'indicateur clé. */
export default function StatCard({ label, value, highlighted = false }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlighted ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          highlighted ? 'text-indigo-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
