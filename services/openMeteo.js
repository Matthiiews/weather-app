/**
 * Aide pour Open-Meteo : codes météo WMO → texte et icônes (style OpenWeatherMap pour /icons/*.svg).
 * Doc WMO : https://open-meteo.com/en/docs

 * services/openMeteo.js

 * Rôle : adapter la réponse de l'API Open-Meteo au format attendu
 *        par les composants React existants (MainCard, MetricsBox,
 *        DateAndTime…) — format calqué sur l'ancienne API OpenWeatherMap.
 
 * Champs consommés par le frontend (index.js) :
 *   weatherData.name                      → nom de la ville
 *   weatherData.sys.country               → code pays
 *  weatherData.weather[0].description    → condition lisible ("Pluie légère"…)
 *   weatherData.weather[0].icon           → code icône
 *  weatherData.main.temp                 → température actuelle (en m/s brut)
 *   weatherData.main.feels_like
 *   weatherData.main.humidity
 *   weatherData.wind.speed                → vitesse vent (m/s, unité native)
 *   weatherData.wind.deg                  → direction vent en degrés
 *   weatherData.visibility                → visibilité en mètres
 *   weatherData.sys.sunrise               → timestamp Unix (secondes)
 *   weatherData.sys.sunset                → timestamp Unix (secondes)
 *   weatherData.timezone                  → offset UTC en secondes
 *   weatherData.dt                        → timestamp Unix courant (secondes)
 *   weatherData.coord.lat / .lon
 * =============================================================================

 * Table de correspondance : code WMO → { description, icon }

 * Conventions d'icônes calquées sur OpenWeatherMap pour que les composants
 * existants (qui utilisent weatherData.weather[0].icon) continuent de
 * fonctionner sans modification.
 *   "01d/01n" → ciel dégagé jour/nuit
 *   "02d/02n" → quelques nuages
 *   "03d/03n" → nuages épars
 *   "04d/04n" → nuages brisés / couvert
 *   "09d/09n" → averses
 *   "10d/10n" → pluie
 *   "11d/11n" → orage
 *   "13d/13n" → neige
 *   "50d/50n" → brouillard / brume
 */

export function wmoWeatherDescription(code) {
  const map = {
    0: "Ciel dégagé",
    1: "Principalement dégagé",
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée",
    55: "Bruine dense",
    56: "Bruine verglaçante légère",
    57: "Bruine verglaçante dense",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Pluie forte",
    66: "Pluie verglaçante légère",
    67: "Pluie verglaçante forte",
    71: "Neige légère",
    73: "Neige modérée",
    75: "Neige forte",
    77: "Grains de neige",
    80: "Averses de pluie légères",
    81: "Averses de pluie modérées",
    82: "Averses de pluie violentes",
    85: "Averses de neige légères",
    86: "Averses de neige fortes",
    95: "Orage",
    96: "Orage avec grêle légère",
    99: "Orage avec grêle forte",
  };
  return map[code] ?? "Conditions variables";
}

/**
 * @param {number} code - code WMO
 * @param {number} isDay - 1 jour / 0 nuit (champ is_day d'Open-Meteo)
 */
export function wmoToIconName(code, isDay) {
  const d = isDay ? "d" : "n";
  if (code === 0) return `01${d}`;
  if (code === 1) return `02${d}`;
  if (code === 2) return `03${d}`;
  if (code === 3) return `04${d}`;
  if (code === 45 || code === 48) return `50${d}`;
  if (code >= 51 && code <= 67) return `10${d}`;
  if (code >= 71 && code <= 77) return `13${d}`; 
  if (code >= 80 && code <= 82) return `09${d}`;
  if (code === 85 || code === 86) return `13${d}`;
  if (code >= 95 && code <= 99) return `11${d}`;
  return `02${d}`;
}

/**
 * Transforme la réponse Open-Meteo (+ infos géocodage) en objet proche du format OpenWeatherMap
 * pour réutiliser les composants existants (MainCard, MetricsBox, DateAndTime).
 */
export function toOpenWeatherLikeShape(geo, om) {
  const cur = om.current;
  const daily = om.daily;
  const isday = cur.is_day != null ? cur.is_day : 1;
  const code = cur.weather_code ?? 0;

  const sunrise = daily?.sunrise?.[0];
  const sunset = daily?.sunset?.[0];

  return {
    name: geo.name,
    /** Système / méta */
    sys: {
      country: geo.country_code ?? "",
      sunrise: sunrise ?? 0,
      sunset: sunset ?? 0,
    },
    weather: [
      {
        description: wmoWeatherDescription(code),
        icon: wmoToIconName(code, isday),
      },
    ],
    /** Températures & humidité 
    * Open-Meteo fournit déjà tout en °C avec wind_speed_unit=ms dans data.js.
    * Le frontend gère lui-même la conversion °C ↔ °F via unitSystem.
    */
    main: {
      temp: cur.temperature_2m,
      feels_like: cur.apparent_temperature,
      humidity: cur.relative_humidity_2m,
    },
    /** wind_speed_unit=ms dans la requête → déjà en m/s, cohérent avec OWM.*/
    wind: {
      speed: cur.wind_speed_10m ?? 0,
      deg: cur.wind_direction_10m ?? 0,
    },
    /** Visibilité 
    * Open-Meteo renvoie la visibilité en mètres (identique à OWM).
    */
    visibility: cur.visibility ?? 10000,
    /** Timestamp et fuseau */
    dt: cur.time,
    timezone: om.utc_offset_seconds ?? 0,
  };
}