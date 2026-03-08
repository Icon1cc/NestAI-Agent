import type {
  DifyOffer,
  DifyAmenity,
  ListingType,
  Listing,
} from '@/types';
import { calculateDistance } from '@/lib/geo';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function normalizeAmenityCategory(raw: string | undefined): DifyAmenity['category'] {
  if (!raw) return 'transit';
  const normalized = raw.toLowerCase();
  if (normalized === 'healtcare' || normalized === 'healthcare' || normalized === 'hospital') {
    return 'healthcare' as DifyAmenity['category'];
  }
  if (['groceries', 'supermarket'].includes(normalized)) return 'groceries';
  if (['parks', 'park', 'garden'].includes(normalized)) return 'parks';
  if (['school', 'schools', 'education'].includes(normalized)) return 'schools';
  if (['transit', 'transport', 'bus', 'metro', 'train', 'stop_position', 'platform'].includes(normalized)) {
    return 'transit';
  }
  if (['fitness', 'gym', 'sports'].includes(normalized)) return 'fitness';
  return 'transit';
}

export function normalizeOffer(raw: any, index: number): DifyOffer {
  const lat = raw?.lat ?? raw?.latitude ?? raw?.location?.lat ?? raw?.location_lat ?? 0;
  const lng =
    raw?.lng ??
    raw?.long ??
    raw?.longitude ??
    raw?.location?.lon ??
    raw?.location?.lng ??
    raw?.location_lng ??
    0;

  const propertyIdRaw = raw?.property_id ?? raw?.uuid ?? raw?.id ?? index + 1;
  const property_id = Number.isFinite(Number(propertyIdRaw)) ? Number(propertyIdRaw) : index + 1;

  const matchScoreRaw = raw?.match_score ?? raw?.matchScore ?? raw?.matchscore;

  let rank: number;
  if (matchScoreRaw !== undefined && matchScoreRaw !== null && !Number.isNaN(Number(matchScoreRaw))) {
    const matchScore = Number(matchScoreRaw);
    let normalized = matchScore;
    if (matchScore > 1 && matchScore <= 10) {
      normalized = matchScore / 10;
    } else if (matchScore > 10) {
      normalized = matchScore / 100;
    }
    rank = clamp01(normalized);
  } else {
    rank = clamp01(Number(raw?.rank ?? raw?.score ?? 0.6));
  }

  const price = Number(raw?.price ?? raw?.amount ?? 0) || 0;

  const txNewRaw = raw?.transaction_type ?? raw?.transactiontype;
  const transactionTypeNew = txNewRaw === undefined || txNewRaw === null ? undefined : Number(txNewRaw);

  const txLegacyRaw = transactionTypeNew === undefined ? raw?.transactionType : undefined;
  const transactionTypeLegacy = txLegacyRaw === undefined || txLegacyRaw === null ? undefined : Number(txLegacyRaw);

  let rent_or_buy: boolean;
  if (transactionTypeNew === 1) {
    rent_or_buy = true;
  } else if (transactionTypeNew === 0) {
    rent_or_buy = false;
  } else if (transactionTypeLegacy === 1) {
    rent_or_buy = true;
  } else if (transactionTypeLegacy === 0) {
    rent_or_buy = false;
  } else if (typeof raw?.rent_or_buy === 'string') {
    rent_or_buy = raw.rent_or_buy.toLowerCase() !== 'buy';
  } else if (typeof raw?.rent_or_buy === 'boolean') {
    rent_or_buy = raw.rent_or_buy;
  } else {
    rent_or_buy = true;
  }

  const photos: string[] = raw?.photos ?? raw?.images ?? [];

  const summary =
    raw?.analysis?.summary ??
    raw?.summary ??
    (typeof raw?.description === 'string' ? raw.description.slice(0, 240) : undefined);

  const amenitiesFromOffer = Array.isArray(raw?.amenities)
    ? raw.amenities.map((a: any, amenityIndex: number) => {
        const amenityIdRaw = a?.amenity_id ?? a?.id ?? `${property_id}-${amenityIndex + 1}`;
        const amenity_id = Number.isFinite(Number(amenityIdRaw))
          ? Number(amenityIdRaw)
          : Number(`${property_id}${amenityIndex + 1}`);
        const amenityLat = a?.lat ?? a?.latitude ?? 0;
        const amenityLng = a?.lon ?? a?.lng ?? a?.long ?? a?.longitude ?? 0;
        const category = normalizeAmenityCategory(a?.category ?? a?.type);
        const description = a?.description ?? a?.name ?? 'Nearby amenity';
        return {
          amenity_id,
          lat: amenityLat,
          lng: amenityLng,
          category,
          description,
          name: a?.name,
          address: a?.address,
          distance: typeof a?.distance === 'number' ? a.distance : undefined,
          property_id,
        } as DifyAmenity;
      })
    : undefined;

  const closest_amenity_ids =
    raw?.closest_amenity_ids ??
    (amenitiesFromOffer
      ? amenitiesFromOffer.map((a: any) => a?.amenity_id).filter((id: any) => typeof id === 'number')
      : []);

  return {
    property_id,
    lat,
    long: lng,
    rank,
    photos,
    price,
    rent_or_buy,
    adress: raw?.adress ?? raw?.address ?? raw?.city ?? raw?.title ?? `Property ${property_id}`,
    redirect_url: raw?.redirect_url ?? raw?.url,
    nice_to_have: {
      posted_date: raw?.posted_date ?? raw?.createdAt,
      area_m2: raw?.area_m2 ?? raw?.surface,
      rooms: raw?.rooms ?? raw?.bedrooms ?? raw?.room,
      deposit: raw?.deposit,
      furnished: raw?.furnished,
      requirements: raw?.requirements,
    },
    analysis: {
      summary,
      pros: raw?.analysis?.pros ?? raw?.pros ?? [],
      cons: raw?.analysis?.cons ?? raw?.cons ?? [],
    },
    closest_amenity_ids,
    amenities: amenitiesFromOffer,
  };
}

export function difyOfferToListing(
  offer: DifyOffer,
  index: number,
  listingTypeOverride?: ListingType,
  distanceKm?: number
): Listing {
  const lng = offer.lng ?? offer.long ?? 0;
  const rank = offer.rank ?? 0;
  const score = Math.round(rank * 10);
  let period: 'month' | 'total' = offer.rent_or_buy === true ? 'month' : 'total';
  if (listingTypeOverride === 'buy' && period === 'month') {
    period = 'total';
  }

  const amenitiesWithDistance = offer.amenities?.map((amenity) => {
    const amenityLng = amenity.lng ?? amenity.long ?? 0;
    const distance = amenity.distance ?? calculateDistance(offer.lat || 0, lng, amenity.lat, amenityLng);
    return { ...amenity, distance };
  });

  return {
    id: `dify-${offer.property_id || index}`,
    title: offer.adress || `Property ${offer.property_id || index}`,
    price: {
      amount: offer.price || 0,
      currency: 'EUR',
      period,
    },
    address: offer.adress || '',
    lat: offer.lat || 0,
    lng,
    photos: offer.photos || [],
    rooms: offer.nice_to_have?.rooms || 0,
    areaM2: offer.nice_to_have?.area_m2 || 0,
    provider: 'NestAI',
    source_url: offer.redirect_url || '#',
    redirect_url: offer.redirect_url,
    badges: rank >= 0.85 ? ['Top Match'] : [],
    score,
    rank,
    summary: offer.analysis?.summary,
    pros: offer.analysis?.pros || [],
    cons: offer.analysis?.cons || [],
    nice_to_have: offer.nice_to_have,
    closest_amenity_ids: offer.closest_amenity_ids || [],
    amenities: amenitiesWithDistance,
    distance: distanceKm,
  };
}

export function tryParseJson(value: unknown): any | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}
