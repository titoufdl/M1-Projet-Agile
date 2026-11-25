# M1 Projet Agile — Tableau de bord ESR & Parcoursup 2025

Tableau de bord d'exploration des données open data de l'enseignement supérieur :
- **Poursuites d'études des néo-bacheliers par académie (2010–2025)**
- **Vœux Parcoursup 2025 par académie, établissement et filière**

## Équipe (TP1)

- **Scrum Master** : Victor Bonnenfant
- **Product Owner** : Titouan Ferdoel
- **Développeurs** : Maxime Bucher-Martin, Morgan Delmas, Axel Bureaux

## Stack technique

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4**
- **Recharts** (graphiques)
- **Leaflet / React-Leaflet** (carte interactive des formations)
- **Données Open Data locales** dans `public/data/` (chargées dynamiquement côté client, sans base de données)

## Démarrage rapide

```bash
npm install
npm run dev
```

## Scripts disponibles

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance le serveur de développement Vite |
| `npm run build` | Vérifie les types TypeScript et génère le build de production |
| `npm run preview` | Prévisualise le build de production |
| `npm run data:fetch` | Télécharge et normalise les jeux de données Open Data dans `public/data/` |

## Structure du projet

```text
├── public/data/          # Fichiers JSON normalisés (taux-poursuite, parcoursup-2025)
├── scripts/              # Script de récupération des données Open Data
└── src/
    ├── types/            # Interfaces TypeScript des jeux de données
    ├── services/         # Chargement dynamique et mise en cache des données
    ├── components/       # Composants réutilisables (à développer au fil des sprints)
    └── pages/            # Vues du tableau de bord (à développer au fil des sprints)
```
