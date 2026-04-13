// pages/api/data.js
//
// Route API Next.js : reçoit un nom de ville, interroge l'API Open-Meteo
// (géocodage puis météo), et retourne un payload normalisé au format
// "OpenWeatherMap-like" grâce au service toOpenWeatherLikeShape().
//
// Changements par rapport à l'ancienne version OpenWeatherMap :
//   1. URL de base → api.open-meteo.com (pas de clé API requise)
//   2. Géocodage → geocoding-api.open-meteo.com
//   3. Paramètres de requête adaptés au format Open-Meteo
//   4. La mise en forme de la réponse est déléguée à toOpenWeatherLikeShape()

import { toOpenWeatherLikeShape } from "../../services/openmeteo";
import locationConfig from "../../config/location.json";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// Variables "current" demandées à Open-Meteo.
// Correspondent exactement aux champs aux utilisés dans toOpenWeatherLikeShape().
const CURRENT_VARS = [
  "temperature_2m", // → main.temp
  "relative_humidity_2m", // → main.humidity
  "apparent_temperature", // → main.feels_like
  "weather_code", // → weather[0].description + icon (via table WMO)
  "wind_speed_10m", // → wind.speed  (en m/s grâce à wind_speed_unit=ms)
  "wind_direction_10m", // → wind.deg
  "visibility", // → visibility (en mètres, identique à OWM)
  "is_day", // → permet de choisir icône "d" ou "n"
].join(",");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const cityName = (locationConfig?.city || "").trim();
    
  if (!cityName) {
    return res.status(200).json({ message: "City not found, try again !" });
  }

  const geocodeUrl =
    `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}` +
    `&count=1&language=${locationConfig?.language || "fr"}&format=json`;
  const geocodeResponse = await fetch(geocodeUrl);
  const geocodeData = await geocodeResponse.json();
  const place = geocodeData?.results?.[0];

  if (!place) {
    return res.status(200).json({ message: "City not found, try again" });
  }

  const timezone = encodeURIComponent(
    place.timezone || locationConfig?.fallbackTimezone || "Europe/Paris"
  );
  
  /**  ÉTAPE 2 : Requête météo vers l'API Forecast Open-Meteo
  * Paramètres clés :
  * latitude / longitude → coordonnées issues du géocodage
  * timezone             → fuseau local (pour sunrise/sunset corrects)
  * wind_speed_unit=ms   → m/s, cohérent avec l'unité OWM d'origine
  * timeformat=unixtime  → current.time sera un entier Unix (secondes)
  *                           → utilisé dans toOpenWeatherLikeShape pour "dt"
  *      current=…            → variables météo instantanées (voir CURRENT_VARS)
  *      daily=sunrise,sunset → lever/coucher du soleil du jour (indice [0])
  *      forecast_days=1      → on ne demande qu'une seule journée
  */
  const forecastUrl =
    `${FORECAST_URL}?latitude=${place.latitude}` +
    `&longitude=${place.longitude}` +
    `&timezone=${timezone}` +
    `&wind_speed_unit=ms` +
    `&timeformat=unixtime` +
    `&current=${CURRENT_VARS}` +
    `&hourly=visibility` +
    `&daily=sunrise,sunset` +
    `&forecast_days=1`;

  const forecastResponse = await fetch(forecastUrl);
  const forecastData = await forecastResponse.json();
  
  /** Open-Meteo retourne { error: true, reason: "..." } sur erreur HTTP 400 */
  if (forecastData?.error) {
      return res.status(200).json({
        message: forecastData.reason || "Weather data unavailable",
    });
  }
  
  /** ÉTAPE 3 : Transformation de la réponse
  * toOpenWeatherLikeShape() adapte la structure Open-Meteo au format
  * attendu par les composants React (MainCard, MetricsBox, DateAndTime…)
  * sans qu'aucun de ces composants n'ait besoin d'être modifié.
  */ 
  const payload = toOpenWeatherLikeShape(place, forecastData);
  return res.status(200).json(payload);
  } catch (error) {
    return res.status(200).json({ message: "Weather data unavailable" });
  }
}
