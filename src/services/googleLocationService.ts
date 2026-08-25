import type { PassLocation } from '../types';

// Bengaluru City Bounding Box
export const BENGALURU_BOUNDS = {
  minLat: 12.75,
  maxLat: 13.25,
  minLng: 77.35,
  maxLng: 77.85
};

export const isWithinBengaluru = (lat: number, lng: number): boolean => {
  return (
    lat >= BENGALURU_BOUNDS.minLat &&
    lat <= BENGALURU_BOUNDS.maxLat &&
    lng >= BENGALURU_BOUNDS.minLng &&
    lng <= BENGALURU_BOUNDS.maxLng
  );
};

// Comprehensive Bengaluru Hub Places Database (Google Places Compatible Schema)
export const BENGALURU_PLACES_DATABASE: PassLocation[] = [
  {
    placeId: 'ChIJbU60yYAWrjsR5x6e0m8n9Yg',
    name: 'Electronic City',
    address: 'Electronic City, Bengaluru, Karnataka 560100',
    latitude: 12.8452,
    longitude: 77.6602
  },
  {
    placeId: 'ChIJKRx82OIVrjsR8OQ6_9b8wXY',
    name: 'Whitefield',
    address: 'Whitefield, Bengaluru, Karnataka 560066',
    latitude: 12.9698,
    longitude: 77.7499
  },
  {
    placeId: 'ChIJv8X2Y4IVrjsRh_1X8Q8Z_QY',
    name: 'Marathahalli',
    address: 'Marathahalli, Bengaluru, Karnataka 560037',
    latitude: 12.9592,
    longitude: 77.6974
  },
  {
    placeId: 'ChIJ81k_2_wWrjsRp0a1x9Z9yXY',
    name: 'Indiranagar',
    address: 'Indiranagar, Bengaluru, Karnataka 560038',
    latitude: 12.9784,
    longitude: 77.6408
  },
  {
    placeId: 'ChIJp3Z0x4EWrjsRr_3W8X9Z_QY',
    name: 'Yelahanka',
    address: 'Yelahanka, Bengaluru, Karnataka 560064',
    latitude: 13.1007,
    longitude: 77.5963
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QY',
    name: 'BTM Layout',
    address: 'BTM Layout, Bengaluru, Karnataka 560076',
    latitude: 12.9166,
    longitude: 77.6101
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QZ',
    name: 'Hebbal',
    address: 'Hebbal, Bengaluru, Karnataka 560024',
    latitude: 13.0358,
    longitude: 77.5970
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QA',
    name: 'Koramangala',
    address: 'Koramangala, Bengaluru, Karnataka 560034',
    latitude: 12.9352,
    longitude: 77.6245
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QB',
    name: 'Silk Board Junction',
    address: 'Central Silk Board, Hosur Rd, Bengaluru, Karnataka 560068',
    latitude: 12.9172,
    longitude: 77.6228
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QC',
    name: 'Banashankari',
    address: 'Banashankari, Bengaluru, Karnataka 560050',
    latitude: 12.9255,
    longitude: 77.5468
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QD',
    name: 'Bellandur',
    address: 'Bellandur, Bengaluru, Karnataka 560103',
    latitude: 12.9304,
    longitude: 77.6784
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QE',
    name: 'Sarjapur Road',
    address: 'Sarjapur Main Road, Bengaluru, Karnataka 560035',
    latitude: 12.9116,
    longitude: 77.6741
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QF',
    name: 'Jayanagar',
    address: 'Jayanagar, Bengaluru, Karnataka 560041',
    latitude: 12.9299,
    longitude: 77.5824
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QG',
    name: 'Rajajinagar',
    address: 'Rajajinagar, Bengaluru, Karnataka 560010',
    latitude: 12.9982,
    longitude: 77.5530
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QH',
    name: 'Majestic (KSR Bengaluru Station)',
    address: 'Majestic, Bengaluru, Karnataka 560023',
    latitude: 12.9767,
    longitude: 77.5713
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QI',
    name: 'Manyata Tech Park',
    address: 'Thanisandra Main Rd, Nagavara, Bengaluru, Karnataka 560045',
    latitude: 13.0475,
    longitude: 77.6200
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QJ',
    name: 'HSR Layout',
    address: 'HSR Layout, Bengaluru, Karnataka 560102',
    latitude: 12.9121,
    longitude: 77.6446
  },
  {
    placeId: 'ChIJx8V0xYMWrjsRh91W8X9Z_QK',
    name: 'Kengeri Satellite Town',
    address: 'Kengeri, Bengaluru, Karnataka 560060',
    latitude: 12.8997,
    longitude: 77.4827
  }
];

export const searchGooglePlacesBengaluru = async (query: string): Promise<PassLocation[]> => {
  if (!query || query.trim().length === 0) return [];

  const normalized = query.trim().toLowerCase();

  // Filter places from database
  const matches = BENGALURU_PLACES_DATABASE.filter(p => 
    p.name.toLowerCase().includes(normalized) ||
    (p.address || '').toLowerCase().includes(normalized)
  );

  // If google maps places service is loaded on window, query Google Places API
  if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
    try {
      const autocompleteService = new (window as any).google.maps.places.AutocompleteService();
      const predictions = await new Promise<any[]>((resolve) => {
        autocompleteService.getPlacePredictions({
          input: query,
          componentRestrictions: { country: 'in' },
          locationRestriction: new (window as any).google.maps.LatLngBounds(
            new (window as any).google.maps.LatLng(BENGALURU_BOUNDS.minLat, BENGALURU_BOUNDS.minLng),
            new (window as any).google.maps.LatLng(BENGALURU_BOUNDS.maxLat, BENGALURU_BOUNDS.maxLng)
          )
        }, (res: any[]) => resolve(res || []));
      });

      if (predictions && predictions.length > 0) {
        const placesService = new (window as any).google.maps.places.PlacesService(document.createElement('div'));
        const detailedPlaces = await Promise.all(
          predictions.slice(0, 5).map(async (pred) => {
            return new Promise<PassLocation | null>((resolve) => {
              placesService.getDetails({ placeId: pred.place_id, fields: ['place_id', 'name', 'formatted_address', 'geometry'] }, (place: any) => {
                if (place && place.geometry && place.geometry.location) {
                  const lat = place.geometry.location.lat();
                  const lng = place.geometry.location.lng();
                  if (isWithinBengaluru(lat, lng)) {
                    resolve({
                      placeId: place.place_id,
                      name: place.name || pred.structured_formatting.main_text,
                      address: place.formatted_address || pred.description,
                      latitude: lat,
                      longitude: lng
                    });
                    return;
                  }
                }
                resolve(null);
              });
            });
          })
        );

        const validGooglePlaces = detailedPlaces.filter((p): p is PassLocation => p !== null);
        if (validGooglePlaces.length > 0) return validGooglePlaces;
      }
    } catch (e) {
      console.warn('Google Places API query fallback:', e);
    }
  }

  return matches;
};
