import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import type { 
  DifyRequest, 
  DifyResponse, 
  DifyCompareRequest, 
  DifyCompareResponse, 
  Listing, 
  DifyOffer,
  DifyAmenity,
  OfferAnalysis,
  ListingType,
} from '@/types';
import { calculateDistance } from '@/types';

// Clamp helper
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const tryParseJson = (value: unknown): any | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    console.warn('Failed to parse JSON string from Dify answer:', err);
    return null;
  }
};

function normalizeAmenityCategory(raw: string | undefined): DifyAmenity['category'] {
  if (!raw) return 'transit';
  const normalized = raw.toLowerCase();
  if (normalized === 'healtcare' || normalized === 'healthcare' || normalized === 'hospital') return 'healthcare' as any;
  if (['groceries', 'supermarket'].includes(normalized)) return 'groceries';
  if (['parks', 'park', 'garden'].includes(normalized)) return 'parks';
  if (['school', 'schools', 'education'].includes(normalized)) return 'schools';
  if (['transit', 'transport', 'bus', 'metro', 'train', 'stop_position', 'platform'].includes(normalized)) return 'transit';
  if (['fitness', 'gym', 'sports'].includes(normalized)) return 'fitness';
  return 'transit';
}

// Normalize any incoming offer shape to the DifyOffer contract used in the UI
function normalizeOffer(raw: any, index: number): DifyOffer {
  const lat =
    raw?.lat ??
    raw?.latitude ??
    raw?.location?.lat ??
    raw?.location_lat ??
    0;

  const lng =
    raw?.lng ??
    raw?.long ??
    raw?.longitude ??
    raw?.location?.lon ??
    raw?.location?.lng ??
    raw?.location_lng ??
    0;

  const propertyIdRaw = raw?.property_id ?? raw?.uuid ?? raw?.id ?? index + 1;
  const property_id = Number.isFinite(Number(propertyIdRaw))
    ? Number(propertyIdRaw)
    : index + 1;

  // Prefer explicit match_score from Dify (typically 0-10 scale) then fall back to rank/score
  const matchScoreRaw =
    raw?.match_score ??
    raw?.matchScore ??
    raw?.matchscore;

  let rank: number;
  if (matchScoreRaw !== undefined && matchScoreRaw !== null && !Number.isNaN(Number(matchScoreRaw))) {
    const matchScore = Number(matchScoreRaw);
    // Handle common scales: 0-10 or 0-100. If already 0-1 we'll clamp below.
    let normalized = matchScore;
    if (matchScore > 1 && matchScore <= 10) {
      normalized = matchScore / 10; // e.g., 8 -> 0.8 (80/100)
    } else if (matchScore > 10) {
      normalized = matchScore / 100; // e.g., 85 -> 0.85
    }
    rank = clamp01(normalized);
  } else {
    rank = clamp01(Number(raw?.rank ?? raw?.score ?? 0.6));
  }
  const price = Number(raw?.price ?? raw?.amount ?? 0) || 0;

  // transaction_type: 1 = rent, 0 = buy (new mapping)
  const txNewRaw = raw?.transaction_type ?? raw?.transactiontype;
  const transactionTypeNew =
    txNewRaw === undefined || txNewRaw === null
      ? undefined
      : Number(txNewRaw);

  // legacy transactionType: 0 = sale, 1 = rent
  const txLegacyRaw = transactionTypeNew === undefined ? raw?.transactionType : undefined;
  const transactionTypeLegacy =
    txLegacyRaw === undefined || txLegacyRaw === null
      ? undefined
      : Number(txLegacyRaw);

  // Prioritize explicit transaction_type signals over any rent_or_buy flag
  let rent_or_buy: boolean;
  if (transactionTypeNew === 1) {
    rent_or_buy = true; // rent
  } else if (transactionTypeNew === 0) {
    rent_or_buy = false; // buy
  } else if (transactionTypeLegacy === 1) {
    rent_or_buy = true; // rent (legacy)
  } else if (transactionTypeLegacy === 0) {
    rent_or_buy = false; // buy (legacy)
  } else if (typeof raw?.rent_or_buy === 'string') {
    rent_or_buy = raw.rent_or_buy.toLowerCase() !== 'buy';
  } else if (typeof raw?.rent_or_buy === 'boolean') {
    rent_or_buy = raw.rent_or_buy;
  } else {
    rent_or_buy = true; // default to rent if unknown
  }

  const photos: string[] = raw?.photos ?? raw?.images ?? [];

  const summary =
    raw?.analysis?.summary ??
    raw?.summary ??
    (typeof raw?.description === 'string'
      ? raw.description.slice(0, 240)
      : undefined);

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
      ? amenitiesFromOffer
          .map((a: any) => a?.amenity_id)
          .filter((id: any) => typeof id === 'number')
      : []);

  return {
    property_id,
    lat,
    long: lng, // preserve Dify's `long` key; downstream normalizes to `lng`
    rank,
    photos,
    price,
    rent_or_buy,
    adress:
      raw?.adress ??
      raw?.address ??
      raw?.city ??
      raw?.title ??
      `Property ${property_id}`,
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

// Convert Dify offer to internal Listing format
function difyOfferToListing(
  offer: DifyOffer,
  index: number,
  listingTypeOverride?: ListingType,
  distanceKm?: number
): Listing {
  // Normalize lng from long/lng (Dify uses "long")
  const lng = offer.lng ?? offer.long ?? 0;
  const rank = offer.rank ?? 0;
  const score = Math.round(rank * 10); // 0-10 scale
  let period: 'month' | 'total' = offer.rent_or_buy === true ? 'month' : 'total';
  // If we're in buy mode but the offer claims rent, force purchase price display
  if (listingTypeOverride === 'buy' && period === 'month') {
    period = 'total';
  }

  const amenitiesWithDistance = offer.amenities?.map((amenity) => {
    const amenityLng = amenity.lng ?? amenity.long ?? 0;
    const distance =
      amenity.distance ??
      calculateDistance(offer.lat || 0, lng, amenity.lat, amenityLng);
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

const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_MODE = (import.meta.env.VITE_DIFY_MODE || 'workflow').toLowerCase(); // 'workflow' | 'chat'
const defaultEndpoint =
  DIFY_MODE === 'chat'
    ? 'https://api.dify.ai/v1/chat-messages'
    : 'https://api.dify.ai/v1/workflows/run';
const rawEndpointEnv = import.meta.env.VITE_DIFY_ENDPOINT;

// If env endpoint is provided and absolute, use it verbatim; else fall back to sensible default
const DIFY_ENDPOINT =
  rawEndpointEnv && rawEndpointEnv.startsWith('http')
    ? rawEndpointEnv
    : defaultEndpoint;

export function useDify() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    sessionId, 
    userId, 
    location, 
    radiusKm, 
    listingType,
    addMessage,
    setListings,
    setDifyAmenities,
    listings,
    difyAmenities,
    messages,
    difyConversationId,
    setDifyConversationId,
  } = useAppStore();

  const callDify = useCallback(async (
    userPrompt: string,
    mode: 'chat' | 'compare' = 'chat'
  ): Promise<DifyResponse | null> => {
    if (!location) {
      setError('Location is required');
      return null;
    }

    // Build conversation-aware prompt (kept as plain string to avoid extra token objects)
    const last = messages[messages.length - 1];
    const historyWithLatest =
      last && last.role === 'user' && last.content === userPrompt
        ? messages
        : [...messages, { role: 'user' as const, content: userPrompt }];

    const historyString = historyWithLatest
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');
    const combinedPrompt = historyString
      ? `Conversation so far:\n${historyString}\n\nCurrent request: ${userPrompt}`
      : userPrompt;

    setIsLoading(true);
    setError(null);

    // Real API call (for when backend is connected)
    // Build minimal inputs object required by Dify backend
    const transactionType: 0 | 1 = listingType === 'rent' ? 1 : 0; // 1 = rent, 0 = buy (current Dify mapping)
    const latitude = Number(location.lat);
    const longitude = Number(location.lng);
    const radius = Number(radiusKm);
    const inputs: DifyRequest = {
      user_prompt: combinedPrompt,
      latitude,
      longitude,
      radius,
      transaction_type: transactionType,
    };

    try {
      if (!DIFY_API_KEY) {
        throw new Error('Missing VITE_DIFY_API_KEY');
      }

      const userIdentity = String(sessionId || 'web-user');
      const payload =
        DIFY_MODE === 'chat'
          ? {
              inputs,
              query: combinedPrompt,
              user: userIdentity,
              response_mode: 'blocking',
              conversation_id: difyConversationId || undefined,
            }
          : {
              inputs,
              user: userIdentity,
              response_mode: 'blocking',
            };

      const response = await fetch(DIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIFY_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let detail = '';
        try {
          const errJson = await response.json();
          detail = errJson?.message || JSON.stringify(errJson);
        } catch {
          detail = await response.text();
        }
        throw new Error(`API error: ${response.status}${detail ? ` - ${detail}` : ''}`);
      }

      const raw = await response.json();

      // Bubble up workflow-level failures returned with 200 status
      const rawStatus = raw?.status || raw?.data?.status;
      const rawError = raw?.error || raw?.data?.error;
      if (rawStatus === 'failed' || rawError) {
        throw new Error(rawError || 'Dify workflow failed');
      }

      let outputs =
        DIFY_MODE === 'chat'
          ? raw?.data || raw
          : raw?.data?.outputs || raw?.outputs || raw;

      // Capture conversation_id for subsequent chat calls (Dify chat API)
      const conversationId =
        raw?.conversation_id ||
        raw?.data?.conversation_id ||
        outputs?.conversation_id ||
        raw?.id;
      if (conversationId) {
        setDifyConversationId(String(conversationId));
      }

      // If answer is a JSON string, parse it to surface embedded offers/amenities
      let parsedFromAnswer: any | null = null;
      if (typeof outputs === 'string') {
        parsedFromAnswer = tryParseJson(outputs);
        if (parsedFromAnswer) outputs = parsedFromAnswer;
      } else if (typeof outputs?.answer === 'string') {
        parsedFromAnswer = tryParseJson(outputs.answer);
        if (parsedFromAnswer) {
          outputs = { ...outputs, ...parsedFromAnswer };
        }
      }

      // Accept either `offers` or a generic `result` array from the workflow
      const rawOffers = Array.isArray(outputs?.offers)
        ? outputs.offers
        : Array.isArray(outputs?.result)
          ? outputs.result
          : [];

      const normalizedOffersAll = rawOffers.map((offer: any, i: number) =>
        normalizeOffer(offer, i)
      );

      // Prefer matching listingType, but fall back to showing all if filter would empty results
      const filteredByType = normalizedOffersAll.filter((offer: DifyOffer) => {
        if (listingType === 'rent') return offer.rent_or_buy !== false; // keep rentals/unknown
        return offer.rent_or_buy === false; // buy only
      });

      const normalizedOffers =
        filteredByType.length > 0 ? filteredByType : normalizedOffersAll;

      // Short-circuit if the workflow signals "not passed" (ask for more info)
      const passedFlagRaw = (outputs as any)?.passed ?? (outputs as any)?.llm_out?.passed;
      const passedFlag = typeof passedFlagRaw === 'string'
        ? passedFlagRaw.trim() !== '0'
        : Boolean(passedFlagRaw ?? 1);

      if (!passedFlag) {
        const askMore =
          outputs.result ||
          outputs.assistant_text ||
          outputs.text ||
          outputs.answer ||
          agentSummary ||
          'Could you share a bit more so I can search effectively?';

        const fallback: DifyResponse = {
          assistant_text: askMore,
          session_id: outputs.session_id || sessionId,
          user_id: userId,
          offers: [],
          amenities: [],
        };

        addMessage({ role: 'assistant', content: askMore });
        setDifyAmenities([]);
        setListings([]);
        setIsLoading(false);
        return fallback;
      }

      // Aggregate amenities from response or offers
      const aggregatedAmenities =
        (outputs.amenities && Array.isArray(outputs.amenities) && outputs.amenities.length > 0)
          ? outputs.amenities.map((a: any, idx: number) => ({
              amenity_id: Number.isFinite(Number(a?.amenity_id ?? a?.id)) ? Number(a?.amenity_id ?? a?.id) : idx + 1,
              lat: a?.lat ?? a?.latitude ?? 0,
              lng: a?.lng ?? a?.lon ?? a?.long ?? a?.longitude ?? 0,
              category: normalizeAmenityCategory(a?.category ?? a?.type),
              description: a?.description ?? a?.name ?? 'Nearby amenity',
              name: a?.name,
              address: a?.address,
              distance: a?.distance,
            }))
          : normalizedOffers.flatMap((offer: DifyOffer) => offer.amenities || []);

      // Filter by radius (km) using current location
      const offersWithDistance = normalizedOffers.map((offer: DifyOffer, i: number) => {
        const offerLng = offer.lng ?? offer.long ?? 0;
        const distanceKm = calculateDistance(location.lat, location.lng, offer.lat, offerLng);
        return { offer, index: i, distanceKm };
      });

      const withinRadius = offersWithDistance.filter(
        (item) => Number.isFinite(item.distanceKm) && item.distanceKm <= radiusKm
      );

      const outsideRadius = offersWithDistance.filter(
        (item) => !withinRadius.includes(item)
      );

      const agentSummary = outputs?.llm_out?.agent_summary;

      const data: DifyResponse = {
        assistant_text:
          outputs.assistant_text ||
          outputs.text ||
          outputs.answer ||
          agentSummary,
        session_id: outputs.session_id || sessionId,
        user_id: userId,
        offers: normalizedOffers,
        amenities: aggregatedAmenities || [],
      };
      
      // Debug logs to inspect parsed data during integration
      console.log('[Dify] raw response', raw);
      console.log('[Dify] outputs', outputs);
      if (parsedFromAnswer) {
        console.log('[Dify] parsed answer JSON', parsedFromAnswer);
      }
      
      // Add assistant message
      if (data.assistant_text) {
        addMessage({ role: 'assistant', content: data.assistant_text });
      } else if (agentSummary) {
        addMessage({ role: 'assistant', content: agentSummary });
      }
      
      // Store Dify amenities
      if (data.amenities && data.amenities.length > 0) {
        setDifyAmenities(data.amenities);
      }
      
      // Convert offers to listings with graceful fallback
      if (withinRadius.length > 0) {
        const listingsData = withinRadius.map(({ offer, index, distanceKm }) =>
          difyOfferToListing(offer, index, listingType, distanceKm)
        );
        setListings(listingsData);
      } else if (offersWithDistance.length > 0) {
        const listingsData = offersWithDistance
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .map(({ offer, index, distanceKm }) =>
            difyOfferToListing(offer, index, listingType, distanceKm)
          );
        setListings(listingsData);
        addMessage({
          role: 'assistant',
          content: `No properties found within ${radiusKm} km. Showing nearest matches instead.`,
        });
      } else {
        setListings([]);
        addMessage({
          role: 'assistant',
          content: `No properties found within ${radiusKm} km. Try widening the radius or adjusting filters.`,
        });
      }

      setIsLoading(false);
      return data;
    } catch (err) {
      console.error('Dify API error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch offers');
      setIsLoading(false);
      return null;
    }
  }, [location, sessionId, radiusKm, listingType, addMessage, setListings, setDifyAmenities, messages, difyConversationId, setDifyConversationId]);

  // Resolve amenities for an offer
  const resolveOfferAmenities = useCallback((listing: Listing): DifyAmenity[] => {
    if (listing.amenities && listing.amenities.length > 0) {
      return listing.amenities;
    }
    if (!listing.closest_amenity_ids || listing.closest_amenity_ids.length === 0) {
      return [];
    }
    return difyAmenities
      .filter(a => listing.closest_amenity_ids?.includes(a.amenity_id))
      .map((amenity) => {
        const lng = amenity.lng ?? amenity.long ?? 0;
        const distance =
          amenity.distance ?? calculateDistance(listing.lat, listing.lng, amenity.lat, lng);
        return { ...amenity, distance };
      });
  }, [difyAmenities]);

  const compareOffers = useCallback(async (
    offerId1: number,
    offerId2: number
  ): Promise<DifyCompareResponse | null> => {
    setIsLoading(true);
    setError(null);

    // Find listings
    const listing1 = listings.find(l => l.id === `dify-${offerId1}`);
    const listing2 = listings.find(l => l.id === `dify-${offerId2}`);

    // Resolve amenities for each offer
    const amenities1 = listing1 ? resolveOfferAmenities(listing1) : [];
    const amenities2 = listing2 ? resolveOfferAmenities(listing2) : [];

    // Build the full compare request with offer data
    const request: DifyCompareRequest = {
      mode: 'compare',
      session_id: sessionId,
      user_id: userId,
      offer_id1: offerId1,
      offer_id2: offerId2,
      offer1: {
        property_id: offerId1,
        analysis: {
          summary: listing1?.summary,
          pros: listing1?.pros || [],
          cons: listing1?.cons || [],
        },
        amenities: amenities1,
      },
      offer2: {
        property_id: offerId2,
        analysis: {
          summary: listing2?.summary,
          pros: listing2?.pros || [],
          cons: listing2?.cons || [],
        },
        amenities: amenities2,
      },
    };

    try {
      if (!DIFY_API_KEY) {
        throw new Error('Missing VITE_DIFY_API_KEY');
      }

      const response = await fetch(DIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIFY_API_KEY}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let detail = '';
        try {
          const errJson = await response.json();
          detail = errJson?.message || JSON.stringify(errJson);
        } catch {
          detail = await response.text();
        }
        throw new Error(`API error: ${response.status}${detail ? ` - ${detail}` : ''}`);
      }

      const data: DifyCompareResponse = await response.json();
      setIsLoading(false);
      return data;
    } catch (err) {
      console.error('Dify compare error:', err);
      setError(err instanceof Error ? err.message : 'Failed to compare offers');
      setIsLoading(false);
      return null;
    }
  }, [sessionId, userId, listings, resolveOfferAmenities]);

  return {
    isLoading,
    error,
    callDify,
    compareOffers,
    resolveOfferAmenities,
    difyAmenities,
  };
}
