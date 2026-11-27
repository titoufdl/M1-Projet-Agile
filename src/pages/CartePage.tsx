import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import StatCard from '../components/StatCard';
import { loadParcoursupData } from '../services/dataLoader';
import { listAcademies } from '../services/parcoursupFilters';
import {
  aggregateEtablissements,
  CLASSES_FORMATIONS,
  couleurMarqueur,
  rayonMarqueur,
  type EtablissementCarte,
} from '../services/carteStats';
import type { ParcoursupRecord } from '../types/data';

const nf = new Intl.NumberFormat('fr-FR');
const FRANCE_BOUNDS: LatLngBoundsExpression = [
  [41.3, -5.2],
  [51.1, 9.6],
];

/** Recadre la carte sur les établissements affichés à chaque changement d'académie. */
function FitBounds({ points, academie }: { points: EtablissementCarte[]; academie: string }) {
  const map = useMap();
  useEffect(() => {
    if (!academie || points.length === 0) {
      map.fitBounds(FRANCE_BOUNDS);
      return;
    }
    map.fitBounds(
      points.map((p) => [p.lat, p.lon] as [number, number]),
      { padding: [30, 30], maxZoom: 12 },
    );
    // Recadrage uniquement lorsque l'académie change.
  }, [academie, map]);
  return null;
}

/** Centre la carte sur l'établissement sélectionné dans le classement. */
function FocusSelection({ point }: { point: EtablissementCarte | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lon], Math.max(map.getZoom(), 11), { duration: 0.6 });
  }, [point, map]);
  return null;
}

/**
 * US15 — Carte interactive d'une académie montrant le nombre de formations
 * Parcoursup 2025 proposées par chaque établissement.
 */
type MarkerMode = 'couleur' | 'taille';

const FIXED_RADIUS = 7;
const FIXED_COLOR = '#4f46e5';
const LEGEND_SIZES = [
  { count: 1, label: '1 formation' },
  { count: 5, label: '5 formations' },
  { count: 15, label: '15 formations' },
  { count: 30, label: '30 et plus' },
] as const;

export default function CartePage() {
  const [records, setRecords] = useState<ParcoursupRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [academie, setAcademie] = useState('');
  const [markerMode, setMarkerMode] = useState<MarkerMode>('couleur');
  const [selection, setSelection] = useState<string | null>(null);

  useEffect(() => {
    loadParcoursupData()
      .then(setRecords)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const academies = useMemo(() => (records ? listAcademies(records) : []), [records]);
  const carte = useMemo(
    () => aggregateEtablissements(records ?? [], academie),
    [records, academie],
  );
  const totalFormations = useMemo(
    () => carte.etablissements.reduce((s, e) => s + e.formations, 0),
    [carte],
  );

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Erreur de chargement des données Parcoursup : {error}
      </p>
    );
  }

  if (!records) {
    return <p className="p-8 text-center text-slate-500">Chargement de la carte…</p>;
  }

  const top = carte.etablissements.slice(0, 10);

  return (
    <section className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Carte des formations
          </h2>
          <p className="text-slate-600">
            Nombre de formations Parcoursup 2025 proposées par chaque établissement.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Représentation
            <div
              role="radiogroup"
              aria-label="Mode de représentation des cercles"
              className="inline-flex rounded-lg bg-slate-100 p-1"
            >
              {(
                [
                  ['couleur', 'Couleur'],
                  ['taille', 'Taille'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={markerMode === value}
                  onClick={() => setMarkerMode(value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    markerMode === value
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-slate-700 sm:w-72">
            Académie
            <select
              value={academie}
              onChange={(e) => {
                setAcademie(e.target.value);
                setSelection(null);
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"
            >
              <option value="">Toutes les académies</option>
              {academies.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Établissements" value={nf.format(carte.etablissements.length)} />
        <StatCard label="Formations localisées" value={nf.format(totalFormations)} highlighted />
        <StatCard
          label="Formations par établissement (moy.)"
          value={
            carte.etablissements.length
              ? nf.format(Math.round((totalFormations / carte.etablissements.length) * 10) / 10)
              : '—'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
          <MapContainer
            bounds={FRANCE_BOUNDS}
            preferCanvas
            scrollWheelZoom
            className="h-[520px] w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={carte.etablissements} academie={academie} />
            <FocusSelection point={carte.etablissements.find((e) => e.key === selection)} />
            {[...carte.etablissements].reverse().map((e) => (
              <CircleMarker
                key={`${e.key}-${markerMode}`}
                center={[e.lat, e.lon]}
                radius={markerMode === 'taille' ? rayonMarqueur(e.formations) : FIXED_RADIUS}
                pathOptions={{
                  color: selection === e.key ? '#dc2626' : '#1e1b4b',
                  weight: selection === e.key ? 3 : 1,
                  fillColor:
                    markerMode === 'couleur' ? couleurMarqueur(e.formations) : FIXED_COLOR,
                  fillOpacity: 0.8,
                }}
                eventHandlers={{ click: () => setSelection(e.key) }}
              >
                <Popup>
                  <p className="font-semibold">{e.etablissement}</p>
                  <p className="text-slate-600">
                    {e.ville} · {e.academie}
                  </p>
                  <p className="mt-1">
                    <strong>{nf.format(e.formations)}</strong> formation(s) ·{' '}
                    {nf.format(e.places)} places · {nf.format(e.candidats)} candidatures
                  </p>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/95 p-2.5 text-xs text-slate-700 shadow">
            <p className="mb-1.5 font-medium">Nombre de formations</p>
            {markerMode === 'couleur' ? (
              <div className="space-y-1">
                {CLASSES_FORMATIONS.map((c) => (
                  <p key={c.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-indigo-950"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.label}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {LEGEND_SIZES.map((item) => {
                  const d = Math.round(rayonMarqueur(item.count) * 1.4);
                  return (
                    <p key={item.label} className="flex items-center gap-2">
                      <span className="flex w-7 items-center justify-center">
                        <span
                          className="inline-block rounded-full border border-indigo-950"
                          style={{
                            width: `${d}px`,
                            height: `${d}px`,
                            backgroundColor: FIXED_COLOR,
                            opacity: 0.8,
                          }}
                        />
                      </span>
                      {item.label}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-slate-900">
            Établissements proposant le plus de formations
          </h3>
          <ol className="flex flex-col gap-1 text-sm">
            {top.map((e, i) => (
              <li key={e.key}>
                <button
                  type="button"
                  onClick={() => setSelection(e.key)}
                  className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50 ${
                    selection === e.key ? 'bg-indigo-50' : ''
                  }`}
                >
                  <span className="w-5 shrink-0 text-slate-400">{i + 1}.</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-slate-900" title={e.etablissement}>
                      {e.etablissement}
                    </span>
                    <span className="text-xs text-slate-500">{e.ville}</span>
                  </span>
                  <span className="font-semibold tabular-nums text-indigo-700">
                    {nf.format(e.formations)}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {carte.formationsSansCoordonnees > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {nf.format(carte.formationsSansCoordonnees)} formation(s) sans coordonnées GPS ne
              sont pas affichées.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
