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
} from '@/types';

// Mock offer data for demo mode - Paris properties following exact Dify contract
const MOCK_OFFERS: DifyOffer[] = [
  {
    property_id: 1,
    lat: 48.8606,
    long: 2.3376,
    rank: 0.92,
    photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'],
    price: 950,
    rent_or_buy: true,
    adress: '15 Rue de Rivoli, 75001 Paris',
    redirect_url: 'https://www.seloger.com/annonces/123456',
    nice_to_have: {
      posted_date: '2024-01-15',
      area_m2: 45,
      rooms: 2,
      deposit: 1900,
      furnished: false,
      requirements: ['Proof of income', 'Guarantor'],
    },
    analysis: {
      summary: 'Charming apartment in the heart of Paris near the Louvre with excellent metro access.',
      pros: ['Central location', 'Near Louvre & Tuileries', 'Metro line 1 access'],
      cons: ['Tourist area noise', 'No elevator'],
    },
    closest_amenity_ids: [1, 5, 12],
  },
  {
    property_id: 2,
    lat: 48.8530,
    long: 2.3499,
    rank: 0.87,
    photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'],
    price: 1100,
    rent_or_buy: true,
    adress: '42 Rue Mouffetard, 75005 Paris',
    redirect_url: 'https://www.seloger.com/annonces/234567',
    nice_to_have: {
      posted_date: '2024-01-10',
      area_m2: 55,
      rooms: 2,
      deposit: 2200,
      furnished: true,
      requirements: ['Employment contract'],
    },
    analysis: {
      summary: 'Lovely apartment in the Latin Quarter, perfect for students and young professionals.',
      pros: ['Vibrant neighborhood', 'Near universities', 'Great restaurants nearby'],
      cons: ['Busy street market', 'Limited parking'],
    },
    closest_amenity_ids: [3, 8, 15],
  },
  {
    property_id: 3,
    lat: 48.8566,
    long: 2.3619,
    rank: 0.85,
    photos: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600'],
    price: 890,
    rent_or_buy: true,
    adress: '28 Rue des Francs Bourgeois, 75003 Paris',
    redirect_url: 'https://www.seloger.com/annonces/345678',
    nice_to_have: {
      posted_date: '2024-01-18',
      area_m2: 38,
      rooms: 1,
      deposit: 1780,
      furnished: false,
    },
    analysis: {
      summary: 'Cozy studio in the trendy Marais district with historic charm.',
      pros: ['Trendy Marais location', 'Near Place des Vosges', 'Good value'],
      cons: ['Small space', 'Old building'],
    },
    closest_amenity_ids: [2, 7, 11],
  },
  {
    property_id: 4,
    lat: 48.8738,
    long: 2.2950,
    rank: 0.82,
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'],
    price: 1180,
    rent_or_buy: true,
    adress: '8 Avenue de Wagram, 75017 Paris',
    redirect_url: 'https://www.seloger.com/annonces/456789',
    nice_to_have: {
      posted_date: '2024-01-12',
      area_m2: 65,
      rooms: 3,
      deposit: 2360,
      furnished: false,
      requirements: ['Proof of income', 'References'],
    },
    analysis: {
      summary: 'Spacious family apartment near Arc de Triomphe with excellent schools.',
      pros: ['Near Arc de Triomphe', 'Family-friendly area', 'Good schools'],
      cons: ['Higher price', 'Far from nightlife'],
    },
    closest_amenity_ids: [4, 9, 14],
  },
  {
    property_id: 5,
    lat: 48.8462,
    long: 2.3706,
    rank: 0.79,
    photos: ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=600'],
    price: 780,
    rent_or_buy: true,
    adress: '55 Rue de Bercy, 75012 Paris',
    redirect_url: 'https://www.seloger.com/annonces/567890',
    nice_to_have: {
      posted_date: '2024-01-20',
      area_m2: 32,
      rooms: 1,
      deposit: 1560,
      furnished: true,
    },
    analysis: {
      summary: 'Budget-friendly option near Bercy Village with good transit connections.',
      pros: ['Best value in area', 'Near Gare de Lyon', 'Bercy Park nearby'],
      cons: ['Smaller space', 'Less central'],
    },
    closest_amenity_ids: [6, 10, 13],
  },
];

// Mock amenities for demo mode - Paris locations
const MOCK_AMENITIES: DifyAmenity[] = [
  { amenity_id: 1, lat: 48.8611, long: 2.3364, category: 'parks', description: 'Jardin des Tuileries' },
  { amenity_id: 2, lat: 48.8556, long: 2.3617, category: 'parks', description: 'Place des Vosges' },
  { amenity_id: 3, lat: 48.8530, long: 2.3470, category: 'transit', description: 'Métro Maubert-Mutualité' },
  { amenity_id: 4, lat: 48.8738, long: 2.2950, category: 'transit', description: 'Métro Charles de Gaulle-Étoile' },
  { amenity_id: 5, lat: 48.8607, long: 2.3374, category: 'transit', description: 'Métro Palais Royal' },
  { amenity_id: 6, lat: 48.8462, long: 2.3794, category: 'transit', description: 'Gare de Lyon' },
  { amenity_id: 7, lat: 48.8567, long: 2.3620, category: 'groceries', description: 'Carrefour City Marais' },
  { amenity_id: 8, lat: 48.8525, long: 2.3485, category: 'groceries', description: 'Monoprix Latin Quarter' },
  { amenity_id: 9, lat: 48.8750, long: 2.2980, category: 'schools', description: 'Lycée Carnot' },
  { amenity_id: 10, lat: 48.8470, long: 2.3720, category: 'schools', description: 'École Bercy' },
  { amenity_id: 11, lat: 48.8560, long: 2.3600, category: 'fitness', description: 'Fitness Park Marais' },
  { amenity_id: 12, lat: 48.8600, long: 2.3380, category: 'fitness', description: 'Club Med Gym Louvre' },
  { amenity_id: 13, lat: 48.8450, long: 2.3700, category: 'healtcare', description: 'Hôpital Saint-Antoine' },
  { amenity_id: 14, lat: 48.8740, long: 2.2960, category: 'healtcare', description: 'Clinique Wagram' },
  { amenity_id: 15, lat: 48.8520, long: 2.3450, category: 'healtcare', description: 'Hôpital Hôtel-Dieu' },
];

// Clamp helper
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

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

  const rank = clamp01(Number(raw?.rank ?? raw?.score ?? 0.6));
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

  const closest_amenity_ids =
    raw?.closest_amenity_ids ??
    (Array.isArray(raw?.amenities)
      ? raw.amenities
          .map((a: any) => a?.amenity_id ?? a?.id)
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
  };
}

// Convert Dify offer to internal Listing format
function difyOfferToListing(
  offer: DifyOffer,
  index: number,
  listingTypeOverride?: ListingType
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
    priceMin, 
    priceMax,
    countryCode,
    listingType,
    addMessage,
    setListings,
    setDifyAmenities,
    isDemoMode,
    listings,
    difyAmenities,
  } = useAppStore();

  // Generate mock response for demo mode
  const getMockResponse = useCallback((userPrompt: string): DifyResponse => {
    const hasBudget = priceMax > 0;
    
    // Filter offers by price if budget is set
    let filteredOffers = MOCK_OFFERS;
    if (hasBudget) {
      filteredOffers = MOCK_OFFERS.filter(o => o.price <= priceMax && o.price >= priceMin);
    }
    
    // Sort by rank descending
    filteredOffers = [...filteredOffers].sort((a, b) => b.rank - a.rank);
    
    // Generate appropriate assistant text
    let assistantText = '';
    if (!hasBudget && !userPrompt.toLowerCase().includes('budget')) {
      assistantText = `I found some great options matching "${userPrompt}" in the area! To narrow down the best matches, what's your monthly budget?`;
    } else {
      const budgetText = hasBudget ? ` within your €${priceMax} budget` : '';
      assistantText = `Based on your preferences for "${userPrompt}"${budgetText}, I found ${filteredOffers.length} properties. They're ranked by how well they match your criteria - quiet areas, park access, and transit connections. The top match scores 92/100 and is in Prenzlauer Berg!`;
    }
    
    return {
      assistant_text: assistantText,
      session_id: sessionId,
      user_id: userId,
      offers: filteredOffers,
      amenities: MOCK_AMENITIES,
    };
  }, [sessionId, userId, priceMin, priceMax]);

  const callDify = useCallback(async (
    userPrompt: string,
    mode: 'chat' | 'compare' = 'chat'
  ): Promise<DifyResponse | null> => {
    if (!location) {
      setError('Location is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    // If in demo mode, use mock data
    if (isDemoMode) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockResponse = getMockResponse(userPrompt);
      
      // Add assistant message
      if (mockResponse.assistant_text) {
        addMessage({ role: 'assistant', content: mockResponse.assistant_text });
      }
      
      // Store Dify amenities
      if (mockResponse.amenities && mockResponse.amenities.length > 0) {
        setDifyAmenities(mockResponse.amenities);
      }
      
      // Convert offers to listings
      if (mockResponse.offers && mockResponse.offers.length > 0) {
        const listingsData = mockResponse.offers.map((offer, i) =>
          difyOfferToListing(offer, i, listingType)
        );
        setListings(listingsData);
      }

      setIsLoading(false);
      return mockResponse;
    }

    // Real API call (for when backend is connected)
    // Build minimal inputs object required by Dify backend
    const transactionType: 0 | 1 = listingType === 'rent' ? 1 : 0; // 1 = rent, 0 = buy (current Dify mapping)
    const latitude = Math.trunc(Number(location.lat));
    const longitude = Math.trunc(Number(location.lng));
    const radius = Math.trunc(Number(radiusKm));
    const inputs: DifyRequest = {
      user_prompt: userPrompt,
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
              query: userPrompt,
              user: userIdentity,
              response_mode: 'blocking',
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

      const outputs =
        DIFY_MODE === 'chat'
          ? raw?.data || raw
          : raw?.data?.outputs || raw?.outputs || raw;

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

      const data: DifyResponse = {
        assistant_text: outputs.assistant_text || outputs.text || outputs.answer,
        session_id: outputs.session_id || sessionId,
        user_id: userId,
        offers: normalizedOffers,
        amenities: outputs.amenities || [],
      };
      
      // Add assistant message
      if (data.assistant_text) {
        addMessage({ role: 'assistant', content: data.assistant_text });
      }
      
      // Store Dify amenities
      if (data.amenities && data.amenities.length > 0) {
        setDifyAmenities(data.amenities);
      }
      
      // Convert offers to listings
      if (data.offers && data.offers.length > 0) {
        const listingsData = data.offers.map((offer, i) =>
          difyOfferToListing(offer, i, listingType)
        );
        setListings(listingsData);
      }

      setIsLoading(false);
      return data;
    } catch (err) {
      console.error('Dify API error:', err);
      
      // Fallback to mock in case of API error
      const mockResponse = getMockResponse(userPrompt);
      addMessage({ 
        role: 'assistant', 
        content: `(Demo mode - backend not connected) ${mockResponse.assistant_text}` 
      });
      
      if (mockResponse.amenities.length > 0) {
        setDifyAmenities(mockResponse.amenities);
      }
      
      if (mockResponse.offers.length > 0) {
        const listingsData = mockResponse.offers.map((offer, i) =>
          difyOfferToListing(offer, i, listingType)
        );
        setListings(listingsData);
      }
      
      setError(null); // Don't show error since we have fallback
      setIsLoading(false);
      return mockResponse;
    }
  }, [location, sessionId, radiusKm, priceMin, priceMax, countryCode, listingType, addMessage, setListings, setDifyAmenities, isDemoMode, getMockResponse]);

  // Resolve amenities for an offer
  const resolveOfferAmenities = useCallback((listing: Listing): DifyAmenity[] => {
    if (!listing.closest_amenity_ids || listing.closest_amenity_ids.length === 0) {
      return [];
    }
    return difyAmenities.filter(a => listing.closest_amenity_ids?.includes(a.amenity_id));
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

    // Mock compare response for demo mode
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const offer1 = MOCK_OFFERS.find(o => o.property_id === offerId1);
      const offer2 = MOCK_OFFERS.find(o => o.property_id === offerId2);
      
      const mockResponse: DifyCompareResponse = {
        action: 'compare',
        assistant_text_property1: offer1 
          ? `${offer1.adress} is an excellent choice for those prioritizing ${offer1.analysis.pros[0].toLowerCase()}. At €${offer1.price}/month with a score of ${Math.round(offer1.rank * 100)}/100, it offers ${offer1.analysis.pros.slice(1).join(', ').toLowerCase()}. Consider that ${offer1.analysis.cons.join(' and ').toLowerCase()}.`
          : 'Property details not available.',
        assistant_text_property2: offer2
          ? `${offer2.adress} stands out for ${offer2.analysis.pros[0].toLowerCase()}. Priced at €${offer2.price}/month with a ${Math.round(offer2.rank * 100)}/100 score, you'll enjoy ${offer2.analysis.pros.slice(1).join(', ').toLowerCase()}. Note that ${offer2.analysis.cons.join(' and ').toLowerCase()}.`
          : 'Property details not available.',
      };
      
      setIsLoading(false);
      return mockResponse;
    }

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
  }, [sessionId, userId, isDemoMode, listings, resolveOfferAmenities]);

  return {
    isLoading,
    error,
    callDify,
    compareOffers,
    resolveOfferAmenities,
    difyAmenities,
  };
}
