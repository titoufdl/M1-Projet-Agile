import { useEffect, useMemo, useState } from 'react';
import { loadParcoursupData } from '../services/dataLoader';
import type { ParcoursupRecord } from '../types/data';
import './VoeuxParcoursup.css';

const PAGE_SIZE = 50;
const nf = new Intl.NumberFormat('fr-FR');

export default function VoeuxParcoursup() {
  const [data, setData] = useState<ParcoursupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [academie, setAcademie] = useState('');
  const [uai, setUai] = useState('');
  const [page, setPage] = useState(0);

  // Chargement des données une seule fois
  useEffect(() => {
    loadParcoursupData()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Liste des académies
  const academies = useMemo(
    () =>
      [...new Set(data.map((r) => r.academie).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'fr'),
      ),
    [data],
  );

  // Établissements de l'académie choisie
  const etablissements = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of data) {
      if (academie && r.academie !== academie) continue;
      if (!map.has(r.codeUai)) map.set(r.codeUai, `${r.etablissement} (${r.ville})`);
    }
    return [...map.entries()]
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }, [data, academie]);

  // Lignes filtrées
  const filtered = useMemo(
    () => data.filter((r) => (!academie || r.academie === academie) && (!uai || r.codeUai === uai)),
    [data, academie, uai],
  );

  // Totaux
  const totaux = useMemo(
    () => ({
      capacite: filtered.reduce((s, r) => s + r.capacite, 0),
      voeux: filtered.reduce((s, r) => s + r.voeuxTotal, 0),
      admis: filtered.reduce((s, r) => s + r.admisTotal, 0),
    }),
    [filtered],
  );

  // Pagination
  const nbPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, nbPages - 1);
  const slice = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function onAcademieChange(value: string) {
    setAcademie(value);
    setUai(''); // l'ancien établissement n'est peut-être plus dans l'académie
    setPage(0);
  }

  function onEtabChange(value: string) {
    setUai(value);
    setPage(0);
  }

  function reset() {
    setAcademie('');
    setUai('');
    setPage(0);
  }

  if (loading) return <p>Chargement des données Parcoursup…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
    <section className="vp">
      <h2>Vœux Parcoursup 2025</h2>

      <div className="vp-filtres">
        <label>
          Académie
          <select value={academie} onChange={(e) => onAcademieChange(e.target.value)}>
            <option value="">Toutes les académies</option>
            {academies.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label>
          Établissement
          <select value={uai} onChange={(e) => onEtabChange(e.target.value)}>
            <option value="">Tous les établissements</option>
            {etablissements.map((e) => (
              <option key={e.code} value={e.code}>
                {e.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={reset}>
          Réinitialiser
        </button>
      </div>

      <div className="vp-resume">
        <div className="vp-carte">
          <span>Formations</span>
          <strong>{nf.format(filtered.length)}</strong>
        </div>
        <div className="vp-carte">
          <span>Capacité</span>
          <strong>{nf.format(totaux.capacite)}</strong>
        </div>
        <div className="vp-carte">
          <span>Vœux</span>
          <strong>{nf.format(totaux.voeux)}</strong>
        </div>
        <div className="vp-carte">
          <span>Admis</span>
          <strong>{nf.format(totaux.admis)}</strong>
        </div>
      </div>

      <div className="vp-table-wrap">
        <table className="vp-table">
          <thead>
            <tr>
              <th>Établissement</th>
              <th>Ville</th>
              <th>Formation</th>
              <th className="num">Capacité</th>
              <th className="num">Vœux</th>
              <th className="num">Admis</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={6} className="vp-vide">
                  Aucun résultat
                </td>
              </tr>
            ) : (
              slice.map((r, i) => (
                <tr key={`${r.codeUai}-${r.formation}-${r.formationDetail}-${i}`}>
                  <td>{r.etablissement}</td>
                  <td>{r.ville}</td>
                  <td>
                    {r.formation}
                    {r.formationDetail ? ` – ${r.formationDetail}` : ''}
                  </td>
                  <td className="num">{nf.format(r.capacite)}</td>
                  <td className="num">{nf.format(r.voeuxTotal)}</td>
                  <td className="num">{nf.format(r.admisTotal)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="vp-pagination">
        <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
          Précédent
        </button>
        <span>
          Page {currentPage + 1} / {nbPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= nbPages - 1}
          onClick={() => setPage(currentPage + 1)}
        >
          Suivant
        </button>
      </div>
    </section>
  );
}