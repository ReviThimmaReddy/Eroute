import type { PassLocation } from '../types';
import { isWithinBengaluru } from './googleLocationService';

export interface RouteCalculationResult {
  roadDistanceKm: number;
  estimatedTimeMins: number;
  routePolyline: Array<[number, number]>;
}

export const calculateGoogleRoadRoute = async (
  fromLoc: PassLocation,
  toLoc: PassLocation
): Promise<RouteCalculationResult> => {
  if (!fromLoc || !toLoc) {
    throw new Error('Please select both From and To locations.');
  }

  if (fromLoc.placeId === toLoc.placeId || (fromLoc.latitude === toLoc.latitude && fromLoc.longitude === toLoc.longitude)) {
    throw new Error('Please select two different locations.');
  }

  if (!isWithinBengaluru(fromLoc.latitude, fromLoc.longitude) || !isWithinBengaluru(toLoc.latitude, toLoc.longitude)) {
    throw new Error('Please select a location within Bengaluru.');
  }

  // 1. Try Google Maps Directions API if available on window
  if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
    try {
      const directionsService = new (window as any).google.maps.DirectionsService();
      const response = await new Promise<any>((resolve, reject) => {
        directionsService.route({
          origin: new (window as any).google.maps.LatLng(fromLoc.latitude, fromLoc.longitude),
          destination: new (window as any).google.maps.LatLng(toLoc.latitude, toLoc.longitude),
          travelMode: (window as any).google.maps.TravelMode.DRIVING
        }, (result: any, status: string) => {
          if (status === 'OK' && result && result.routes && result.routes.length > 0) {
            resolve(result);
          } else {
            reject(new Error('Unable to calculate a driving route between these locations.'));
          }
        });
      });

      const leg = response.routes[0].legs[0];
      const distanceMeters = leg.distance.value;
      const durationSeconds = leg.duration.value;
      const pathPoints: Array<[number, number]> = response.routes[0].overview_path.map(
        (pt: any) => [pt.lat(), pt.lng()]
      );

      return {
        roadDistanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
        estimatedTimeMins: Math.max(1, Math.round(durationSeconds / 60)),
        routePolyline: pathPoints
      };
    } catch (e: any) {
      console.warn('Google Directions API fallback to OSRM road routing:', e);
    }
  }

  // 2. Fetch driving road route via OSRM Driving Engine API
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLoc.longitude},${fromLoc.latitude};${toLoc.longitude},${toLoc.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = Math.round((route.distance / 1000) * 10) / 10;
        const durMins = Math.max(1, Math.round(route.duration / 60));
        const polyline: Array<[number, number]> = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        return {
          roadDistanceKm: distKm,
          estimatedTimeMins: durMins,
          routePolyline: polyline
        };
      }
    }
  } catch (err) {
    console.warn('OSRM road routing error:', err);
  }

  // 3. Mathematical Road Network Distance (Haversine * 1.35 road factor estimate)
  const R = 6371;
  const dLat = (toLoc.latitude - fromLoc.latitude) * Math.PI / 180;
  const dLon = (toLoc.longitude - fromLoc.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(fromLoc.latitude * Math.PI / 180) * Math.cos(toLoc.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadKm = Math.round(straightKm * 1.35 * 10) / 10;
  const timeMins = Math.max(1, Math.round((roadKm / 35) * 60));

  return {
    roadDistanceKm: Math.max(1.0, roadKm),
    estimatedTimeMins: timeMins,
    routePolyline: [
      [fromLoc.latitude, fromLoc.longitude],
      [toLoc.latitude, toLoc.longitude]
    ]
  };
};
