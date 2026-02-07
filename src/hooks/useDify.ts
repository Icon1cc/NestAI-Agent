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
} from '@/types';

// Mock offer data for demo mode - follows exact Dify contract
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
    analysis: {
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
    analysis: {
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
    analysis: {
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
    analysis: {
      pros: ['Spacious 2-room', 'Park views', 'Great schools nearby'],
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
    analysis: {
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
  const score = Math.round(offer.rank * 100);
  
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
    rooms: 2, // Default if not provided
    areaM2: 65, // Default if not provided
    provider: 'NestAI',
    source_url: '#',
    badges: score >= 85 ? ['Top Match'] : [],
    score: score / 10, // Convert to 0-10 scale
    pros: offer.analysis?.pros || [],
    cons: offer.analysis?.cons || [],
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
    isDemoMode,
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
      
      // Convert offers to listings
      if (mockResponse.offers && mockResponse.offers.length > 0) {
        const listings = mockResponse.offers.map((offer, i) => difyOfferToListing(offer, i));
        setListings(listings);
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
      
      // Convert offers to listings
      if (data.offers && data.offers.length > 0) {
        const listings = data.offers.map((offer, i) => difyOfferToListing(offer, i));
        setListings(listings);
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
      
      if (mockResponse.offers.length > 0) {
        const listings = mockResponse.offers.map((offer, i) => difyOfferToListing(offer, i));
        setListings(listings);
      }
      
      setError(null); // Don't show error since we have fallback
      setIsLoading(false);
      return mockResponse;
    }
  }, [location, sessionId, userId, radiusKm, priceMin, priceMax, countryCode, addMessage, setListings, isDemoMode, getMockResponse]);

  const compareOffers = useCallback(async (
    offerId1: number,
    offerId2: number
  ): Promise<DifyCompareResponse | null> => {
    setIsLoading(true);
    setError(null);

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

    // Real API call
    const request: DifyCompareRequest = {
      mode: 'compare',
      session_id: sessionId,
      user_id: userId,
      offer_id1: offerId1,
      offer_id2: offerId2,
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
  }, [sessionId, userId, isDemoMode]);

  return {
    isLoading,
    error,
    callDify,
    compareOffers,
  };
}
