import { 
  collection, doc, getDocs, setDoc, query, where 
} from 'firebase/firestore';
import { db } from './firebase';
import type { PassPricingDocument } from '../types';

export interface DynamicFareBreakdown {
  oneWayKm: number;
  roundTripKm: number;
  dailyDistanceKm: number;
  monthlyKm: number;
  normalFarePerKm: number;
  normalMonthlyFare: number;
  discountPercentage: number;
  discountAmount: number;
  monthlyPassPrice: number;
  durationMonths: number;
  totalFare: number;
}

export const calculateDynamicPassFare = (
  roadDistanceKm: number,
  normalFarePerKm: number = 1.0,
  discountPercentage: number = 20.0,
  durationMonths: number = 1
): DynamicFareBreakdown => {
  const oneWayKm = Math.max(0.1, roadDistanceKm);
  const roundTripKm = Math.round(oneWayKm * 2 * 10) / 10;
  const dailyDistanceKm = roundTripKm;
  const monthlyKm = Math.round(roundTripKm * 30);
  const normalMonthlyFare = Math.round(monthlyKm * normalFarePerKm);
  const discountAmount = Math.round(normalMonthlyFare * (discountPercentage / 100));
  const monthlyPassPrice = Math.max(0, normalMonthlyFare - discountAmount);
  const validDuration = Math.min(12, Math.max(1, durationMonths));
  const totalFare = Math.round(monthlyPassPrice * validDuration);

  return {
    oneWayKm,
    roundTripKm,
    dailyDistanceKm,
    monthlyKm,
    normalFarePerKm,
    normalMonthlyFare,
    discountPercentage,
    discountAmount,
    monthlyPassPrice,
    durationMonths: validDuration,
    totalFare
  };
};

export const calculatePricingBreakdown = (
  oneWayDistanceKm: number,
  normalFarePerKm: number = 1.0,
  monthlyPassPrice: number = 480,
  durationMonths: number = 1
) => {
  const roundTripDistanceKm = oneWayDistanceKm * 2;
  const dailyDistanceKm = roundTripDistanceKm;
  const monthlyDistanceKm = dailyDistanceKm * 30;
  const normalMonthlyFare = Math.round(monthlyDistanceKm * normalFarePerKm);
  const discountAmount = Math.max(0, normalMonthlyFare - monthlyPassPrice);
  const totalFare = Math.round(monthlyPassPrice * durationMonths);

  return {
    oneWayDistanceKm,
    roundTripDistanceKm,
    dailyDistanceKm,
    monthlyDistanceKm,
    normalFarePerKm,
    normalMonthlyFare,
    monthlyPassPrice,
    discountAmount,
    durationMonths,
    totalFare
  };
};

export const getPassPricing = async (
  routeId: string, 
  fromStopId: string, 
  toStopId: string
): Promise<PassPricingDocument | null> => {
  try {
    const q = query(
      collection(db, 'passPricing'),
      where('routeId', '==', routeId),
      where('fromStopId', '==', fromStopId),
      where('toStopId', '==', toStopId),
      where('status', '==', 'Active')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as PassPricingDocument;
    }
  } catch (e) {
    console.warn('Firestore passPricing lookup note:', e);
  }
  return null;
};

export const getAllPassPricing = async (): Promise<PassPricingDocument[]> => {
  try {
    const snap = await getDocs(collection(db, 'passPricing'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PassPricingDocument));
  } catch (e) {
    console.error('Error loading all pass pricing:', e);
    return [];
  }
};

export const savePassPricing = async (pricing: Partial<PassPricingDocument> & { id?: string }): Promise<string> => {
  const docId = pricing.id || `PRICING_${pricing.routeId}_${pricing.fromStopId}_${pricing.toStopId}`.replace(/[^a-zA-Z0-9_]/g, '');
  const ref = doc(db, 'passPricing', docId);

  const oneWay = pricing.oneWayDistanceKm || 10;
  const breakdown = calculateDynamicPassFare(
    oneWay,
    pricing.normalFarePerKm || 1,
    20,
    1
  );

  const payload: PassPricingDocument = {
    id: docId,
    routeId: pricing.routeId || '',
    routeName: pricing.routeName || '',
    fromStopId: pricing.fromStopId || '',
    fromStopName: pricing.fromStopName || '',
    toStopId: pricing.toStopId || '',
    toStopName: pricing.toStopName || '',
    oneWayDistanceKm: breakdown.oneWayKm,
    roundTripDistanceKm: breakdown.roundTripKm,
    dailyDistanceKm: breakdown.dailyDistanceKm,
    monthlyDistanceKm: breakdown.monthlyKm,
    normalFarePerKm: breakdown.normalFarePerKm,
    normalMonthlyFare: breakdown.normalMonthlyFare,
    monthlyPassPrice: breakdown.monthlyPassPrice,
    discountAmount: breakdown.discountAmount,
    currency: pricing.currency || '₹',
    status: pricing.status || 'Active',
    createdAt: pricing.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(ref, payload, { merge: true });
  return docId;
};
