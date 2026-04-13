# Weather App (Open-Meteo)

Application météo Next.js conçue pour afficher la météo d'une ville pré-configurée, sans champ de recherche.

## Fonctionnalités

1. Données météo récupérées via l'API [Open-Meteo](https://open-meteo.com/), sans clé API.
2. Ville configurable via `config/location.json`.
3. Affichage de la date/heure locale, température, ressenti, humidité, vent, visibilité, lever/coucher du soleil.
4. Bascule d'unités métrique/impériale côté interface.
5. Rafraîchissement automatique des données toutes les heures.
6. Gestion des états de chargement et d'erreur.

## Configuration de la ville

Le fichier `config/location.json` contient la localisation affichée :

```json
{
  "city": "Riga",
  "language": "fr",
  "fallbackTimezone": "Europe/Paris"
}
```

- `city` : ville à afficher.
- `language` : langue utilisée par l'API de géocodage.
- `fallbackTimezone` : fuseau de secours si la timezone de la ville n'est pas disponible.

## Installation

1. Installer les dépendances :
   - `npm install`
2. Lancer l'application :
   - `npm run dev`
3. Ouvrir [http://localhost:3000](http://localhost:3000)

## Compatibilité Node.js

Ce projet utilise `Next.js 11`. Avec des versions récentes de Node.js (OpenSSL 3), les scripts incluent déjà :

- `NODE_OPTIONS=--openssl-legacy-provider`

Cela évite l'erreur `ERR_OSSL_EVP_UNSUPPORTED` au démarrage.

## Structure utile

- `pages/index.js` : page principale et rafraîchissement horaire.
- `pages/api/data.js` : route API (géocodage + forecast Open-Meteo).
- `services/openmeteo.js` : adaptation du format Open-Meteo vers le format attendu par les composants.
- `config/location.json` : configuration de la ville.

## License

The project is under [MIT license](https://choosealicense.com/licenses/mit/).
