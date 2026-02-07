import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import type { DifyRequest, DifyResponse, DifyCompareRequest, DifyCompareResponse, Listing, AmenitiesData, normalizeOfferLng, normalizeCategory } from '@/types';

// Convert Dify offer to internal Listing format
function difyOfferToListing(offer: any, index: number): Listing {
  const lng = offer.lng ?? offer.long ?? 0;
  const score = Math.round((offer.rank ?? 0) * 100);
  
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
    rooms: 0, // Not in Dify schema
    areaM2: 0, // Not in Dify schema
    provider: 'NestAI',
    source_url: '#',
    badges: [],
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
  } = useAppStore();

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

    const request: DifyRequest = {
      mode,
      user_prompt: userPrompt,
      session_id: sessionId,
      user_id: userId,
      locale: navigator.language?.split('-')[0] || 'en',
      countryCode: countryCode || 'FR',
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
      setError(err instanceof Error ? err.message : 'Failed to call AI');
      setIsLoading(false);
      return null;
    }
  }, [location, sessionId, userId, radiusKm, priceMin, priceMax, countryCode, addMessage, setListings]);

  const compareOffers = useCallback(async (
    offerId1: number,
    offerId2: number
  ): Promise<DifyCompareResponse | null> => {
    setIsLoading(true);
    setError(null);

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
  }, [sessionId, userId]);

  return {
    isLoading,
    error,
    callDify,
    compareOffers,
  };
}
