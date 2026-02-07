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

// Mock offer data for demo mode - follows exact Dify contract with new fields
const MOCK_OFFERS: DifyOffer[] = [
  {
    property_id: 1,
    lat: 52.5234,
    long: 13.4114,
    rank: 0.92,
    photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'],
    price: 950,
    rent_or_buy: true,
    adress: 'Prenzlauer Allee 45, 10405 Berlin',
    redirect_url: 'https://www.immobilienscout24.de/expose/123456',
    nice_to_have: {
      posted_date: '2024-01-15',
      area_m2: 65,
      rooms: 2,
      deposit: 1900,
      furnished: false,
      requirements: ['Proof of income', 'SCHUFA report'],
    },
    analysis: {
      summary: 'A well-located apartment perfect for those seeking tranquility near green spaces with excellent transit access.',
      pros: ['Near Volkspark', 'Excellent transit (U2)', 'Quiet residential area'],
      cons: ['Limited parking', 'No balcony'],
    },
    closest_amenity_ids: [1, 5, 12],
  },
  {
    property_id: 2,
    lat: 52.5167,
    long: 13.3833,
    rank: 0.87,
    photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'],
    price: 1100,
    rent_or_buy: true,
    adress: 'Invalidenstraße 112, 10115 Berlin',
    redirect_url: 'https://www.immobilienscout24.de/expose/234567',
    nice_to_have: {
      posted_date: '2024-01-10',
      area_m2: 75,
      rooms: 3,
      deposit: 2200,
      furnished: true,
      requirements: ['Employment contract'],
    },
    analysis: {
      summary: 'Modern apartment in the heart of Berlin with easy access to the main train station and all amenities.',
      pros: ['Central location', 'Modern kitchen', 'Close to Hauptbahnhof'],
      cons: ['Busy street', 'Higher price point'],
    },
    closest_amenity_ids: [3, 8, 15],
  },
  {
    property_id: 3,
    lat: 52.5089,
    long: 13.4515,
    rank: 0.85,
    photos: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600'],
    price: 890,
    rent_or_buy: true,
    adress: 'Boxhagener Str. 78, 10245 Berlin',
    redirect_url: 'https://www.immobilienscout24.de/expose/345678',
    nice_to_have: {
      posted_date: '2024-01-18',
      area_m2: 55,
      rooms: 2,
      deposit: 1780,
      furnished: false,
    },
    analysis: {
      summary: 'Charming apartment in vibrant Friedrichshain, surrounded by cafes and nightlife options.',
      pros: ['Vibrant neighborhood', 'Many cafes nearby', 'Good value'],
      cons: ['Nightlife noise on weekends', 'Older building'],
    },
    closest_amenity_ids: [2, 7, 11],
  },
  {
    property_id: 4,
    lat: 52.5328,
    long: 13.3996,
    rank: 0.82,
    photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'],
    price: 1180,
    rent_or_buy: true,
    adress: 'Schönhauser Allee 167, 10435 Berlin',
    redirect_url: 'https://www.immobilienscout24.de/expose/456789',
    nice_to_have: {
      posted_date: '2024-01-12',
      area_m2: 80,
      rooms: 3,
      deposit: 2360,
      furnished: false,
      requirements: ['Proof of income', 'References'],
    },
    analysis: {
      summary: 'Spacious family-friendly apartment with park views and excellent schools in the area.',
      pros: ['Spacious 3-room', 'Park views', 'Great schools nearby'],
      cons: ['Street-facing noise', 'No elevator'],
    },
    closest_amenity_ids: [4, 9, 14],
  },
  {
    property_id: 5,
    lat: 52.4951,
    long: 13.4252,
    rank: 0.79,
    photos: ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=600'],
    price: 780,
    rent_or_buy: true,
    adress: 'Karl-Marx-Str. 203, 12055 Berlin',
    redirect_url: 'https://www.immobilienscout24.de/expose/567890',
    nice_to_have: {
      posted_date: '2024-01-20',
      area_m2: 45,
      rooms: 1,
      deposit: 1560,
      furnished: true,
    },
    analysis: {
      summary: 'Budget-friendly option in a diverse neighborhood with good transit connections.',
      pros: ['Best value in area', 'U-Bahn connection', 'Diverse neighborhood'],
      cons: ['Smaller space', 'Gentrifying area'],
    },
    closest_amenity_ids: [6, 10, 13],
  },
];

// Mock amenities for demo mode
const MOCK_AMENITIES: DifyAmenity[] = [
  { amenity_id: 1, lat: 52.524, long: 13.412, category: 'parks', description: 'Volkspark Friedrichshain' },
  { amenity_id: 2, lat: 52.509, long: 13.452, category: 'parks', description: 'Boxhagener Platz' },
  { amenity_id: 3, lat: 52.517, long: 13.383, category: 'transit', description: 'Berlin Hauptbahnhof' },
  { amenity_id: 4, lat: 52.533, long: 13.400, category: 'transit', description: 'U Schönhauser Allee' },
  { amenity_id: 5, lat: 52.523, long: 13.410, category: 'transit', description: 'U Prenzlauer Allee' },
  { amenity_id: 6, lat: 52.495, long: 13.426, category: 'transit', description: 'U Karl-Marx-Straße' },
  { amenity_id: 7, lat: 52.508, long: 13.450, category: 'groceries', description: 'REWE Boxhagener' },
  { amenity_id: 8, lat: 52.518, long: 13.385, category: 'groceries', description: 'Edeka Invalidenstraße' },
  { amenity_id: 9, lat: 52.532, long: 13.398, category: 'schools', description: 'Grundschule am Planetarium' },
  { amenity_id: 10, lat: 52.496, long: 13.427, category: 'schools', description: 'Rixdorfer Schule' },
  { amenity_id: 11, lat: 52.507, long: 13.448, category: 'fitness', description: 'McFit Friedrichshain' },
  { amenity_id: 12, lat: 52.522, long: 13.409, category: 'fitness', description: 'FitX Prenzlauer Berg' },
  { amenity_id: 13, lat: 52.494, long: 13.424, category: 'healtcare', description: 'Vivantes Klinikum Neukölln' },
  { amenity_id: 14, lat: 52.531, long: 13.397, category: 'healtcare', description: 'Praxis Dr. Weber' },
  { amenity_id: 15, lat: 52.516, long: 13.381, category: 'healtcare', description: 'Charité Campus Mitte' },
];

// Convert Dify offer to internal Listing format
function difyOfferToListing(offer: DifyOffer, index: number): Listing {
  // Normalize lng from long/lng (Dify uses "long")
  const lng = offer.lng ?? offer.long ?? 0;
  const rank = offer.rank ?? 0;
  const score = Math.round(rank * 10); // 0-10 scale
  
  return {
    id: `dify-${offer.property_id || index}`,
    title: offer.adress || `Property ${offer.property_id || index}`,
    price: {
      amount: offer.price || 0,
      currency: 'EUR',
      period: offer.rent_or_buy === true ? 'month' : 'total',
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

// Placeholder API endpoint - would be replaced with actual backend
const DIFY_ENDPOINT = '/api/dify/run';

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
      assistantText = `I found some great options matching "${userPrompt}" in the area! To narrow down the best matches, what's your monthly budget? You can use the quick chips below or tell me directly.`;
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
        const listingsData = mockResponse.offers.map((offer, i) => difyOfferToListing(offer, i));
        setListings(listingsData);
      }

      setIsLoading(false);
      return mockResponse;
    }

    // Real API call (for when backend is connected)
    const request: DifyRequest = {
      mode,
      user_prompt: userPrompt,
      session_id: sessionId,
      user_id: userId,
      locale: navigator.language?.split('-')[0] || 'en',
      countryCode: countryCode || 'DE',
      price_min: priceMin,
      price_max: priceMax,
      radiusKm,
      location: { lat: location.lat, lng: location.lng },
    };

    try {
      const response = await fetch(DIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: DifyResponse = await response.json();
      
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
        const listingsData = data.offers.map((offer, i) => difyOfferToListing(offer, i));
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
        const listingsData = mockResponse.offers.map((offer, i) => difyOfferToListing(offer, i));
        setListings(listingsData);
      }
      
      setError(null); // Don't show error since we have fallback
      setIsLoading(false);
      return mockResponse;
    }
  }, [location, sessionId, userId, radiusKm, priceMin, priceMax, countryCode, addMessage, setListings, setDifyAmenities, isDemoMode, getMockResponse]);

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
      const response = await fetch(DIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
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
