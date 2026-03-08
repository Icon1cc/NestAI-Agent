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
import { calculateDistance } from '@/lib/geo';
import { API } from '@/config/constants';
import {
  normalizeOffer,
  normalizeAmenityCategory,
  difyOfferToListing,
  tryParseJson,
} from '@/lib/dify-normalizers';

const DEV_DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY;
const DIFY_MODE = (import.meta.env.VITE_DIFY_MODE || 'workflow').toLowerCase();
const devRawEndpoint = import.meta.env.VITE_DIFY_ENDPOINT;
const devDefaultEndpoint = DIFY_MODE === 'chat' ? API.DIFY_CHAT_ENDPOINT : API.DIFY_WORKFLOW_ENDPOINT;
const devDirectEndpoint =
  devRawEndpoint && devRawEndpoint.startsWith('http') ? devRawEndpoint : devDefaultEndpoint;

const USE_DIRECT_DIFY = import.meta.env.DEV && Boolean(DEV_DIFY_API_KEY);
const DIFY_ENDPOINT = USE_DIRECT_DIFY ? devDirectEndpoint : '/api/dify';

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

  const callDify = useCallback(
    async (userPrompt: string, _mode: 'chat' | 'compare' = 'chat'): Promise<DifyResponse | null> => {
      if (!location) {
        setError('Location is required');
        return null;
      }

      const last = messages[messages.length - 1];
      const historyWithLatest =
        last && last.role === 'user' && last.content === userPrompt
          ? messages
          : [...messages, { role: 'user' as const, content: userPrompt }];

      const historyString = historyWithLatest
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');
      const combinedPrompt = historyString
        ? `Conversation so far:\n${historyString}\n\nCurrent request: ${userPrompt}`
        : userPrompt;

      setIsLoading(true);
      setError(null);

      const transactionType: 0 | 1 = listingType === 'rent' ? 1 : 0;
      const inputs: DifyRequest = {
        user_prompt: combinedPrompt,
        latitude: Number(location.lat),
        longitude: Number(location.lng),
        radius: Number(radiusKm),
        transaction_type: transactionType,
      };

      try {
        if (USE_DIRECT_DIFY && !DEV_DIFY_API_KEY) {
          throw new Error('Missing VITE_DIFY_API_KEY for direct dev calls');
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

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (USE_DIRECT_DIFY) {
          headers['Authorization'] = `Bearer ${DEV_DIFY_API_KEY}`;
        }

        const response = await fetch(DIFY_ENDPOINT, {
          method: 'POST',
          headers,
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

        const rawStatus = raw?.status || raw?.data?.status;
        const rawError = raw?.error || raw?.data?.error;
        if (rawStatus === 'failed' || rawError) {
          throw new Error(rawError || 'Dify workflow failed');
        }

        let outputs = DIFY_MODE === 'chat' ? raw?.data || raw : raw?.data?.outputs || raw?.outputs || raw;

        const conversationId =
          raw?.conversation_id || raw?.data?.conversation_id || outputs?.conversation_id || raw?.id;
        if (conversationId) {
          setDifyConversationId(String(conversationId));
        }

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

        const rawOffers = Array.isArray(outputs?.offers)
          ? outputs.offers
          : Array.isArray(outputs?.result)
            ? outputs.result
            : [];

        const normalizedOffersAll = rawOffers.map((offer: any, i: number) => normalizeOffer(offer, i));

        const filteredByType = normalizedOffersAll.filter((offer: DifyOffer) => {
          if (listingType === 'rent') return offer.rent_or_buy !== false;
          return offer.rent_or_buy === false;
        });

        const normalizedOffers = filteredByType.length > 0 ? filteredByType : normalizedOffersAll;

        const passedFlagRaw = (outputs as any)?.passed ?? (outputs as any)?.llm_out?.passed;
        const passedFlag =
          typeof passedFlagRaw === 'string' ? passedFlagRaw.trim() !== '0' : Boolean(passedFlagRaw ?? 1);

        const agentSummary = outputs?.llm_out?.agent_summary;

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

        const aggregatedAmenities =
          outputs.amenities && Array.isArray(outputs.amenities) && outputs.amenities.length > 0
            ? outputs.amenities.map((a: any, idx: number) => ({
                amenity_id: Number.isFinite(Number(a?.amenity_id ?? a?.id))
                  ? Number(a?.amenity_id ?? a?.id)
                  : idx + 1,
                lat: a?.lat ?? a?.latitude ?? 0,
                lng: a?.lng ?? a?.lon ?? a?.long ?? a?.longitude ?? 0,
                category: normalizeAmenityCategory(a?.category ?? a?.type),
                description: a?.description ?? a?.name ?? 'Nearby amenity',
                name: a?.name,
                address: a?.address,
                distance: a?.distance,
              }))
            : normalizedOffers.flatMap((offer: DifyOffer) => offer.amenities || []);

        const offersWithDistance = normalizedOffers.map((offer: DifyOffer, i: number) => {
          const offerLng = offer.lng ?? offer.long ?? 0;
          const distanceKm = calculateDistance(location.lat, location.lng, offer.lat, offerLng);
          return { offer, index: i, distanceKm };
        });

        const withinRadius = offersWithDistance.filter(
          (item) => Number.isFinite(item.distanceKm) && item.distanceKm <= radiusKm
        );

        const data: DifyResponse = {
          assistant_text: outputs.assistant_text || outputs.text || outputs.answer || agentSummary,
          session_id: outputs.session_id || sessionId,
          user_id: userId,
          offers: normalizedOffers,
          amenities: aggregatedAmenities || [],
        };

        if (data.assistant_text) {
          addMessage({ role: 'assistant', content: data.assistant_text });
        } else if (agentSummary) {
          addMessage({ role: 'assistant', content: agentSummary });
        }

        if (data.amenities && data.amenities.length > 0) {
          setDifyAmenities(data.amenities);
        }

        if (withinRadius.length > 0) {
          const listingsData = withinRadius.map(({ offer, index, distanceKm }) =>
            difyOfferToListing(offer, index, listingType, distanceKm)
          );
          setListings(listingsData);
        } else if (offersWithDistance.length > 0) {
          const listingsData = offersWithDistance
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .map(({ offer, index, distanceKm }) => difyOfferToListing(offer, index, listingType, distanceKm));
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
    },
    [
      location,
      sessionId,
      radiusKm,
      listingType,
      addMessage,
      setListings,
      setDifyAmenities,
      messages,
      difyConversationId,
      setDifyConversationId,
      userId,
    ]
  );

  const resolveOfferAmenities = useCallback(
    (listing: Listing): DifyAmenity[] => {
      if (listing.amenities && listing.amenities.length > 0) {
        return listing.amenities;
      }
      if (!listing.closest_amenity_ids || listing.closest_amenity_ids.length === 0) {
        return [];
      }
      return difyAmenities
        .filter((a) => listing.closest_amenity_ids?.includes(a.amenity_id))
        .map((amenity) => {
          const lng = amenity.lng ?? amenity.long ?? 0;
          const distance = amenity.distance ?? calculateDistance(listing.lat, listing.lng, amenity.lat, lng);
          return { ...amenity, distance };
        });
    },
    [difyAmenities]
  );

  const compareOffers = useCallback(
    async (offerId1: number, offerId2: number): Promise<DifyCompareResponse | null> => {
      setIsLoading(true);
      setError(null);

      const listing1 = listings.find((l) => l.id === `dify-${offerId1}`);
      const listing2 = listings.find((l) => l.id === `dify-${offerId2}`);

      const amenities1 = listing1 ? resolveOfferAmenities(listing1) : [];
      const amenities2 = listing2 ? resolveOfferAmenities(listing2) : [];

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
        if (USE_DIRECT_DIFY && !DEV_DIFY_API_KEY) {
          throw new Error('Missing VITE_DIFY_API_KEY for direct dev calls');
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (USE_DIRECT_DIFY) {
          headers['Authorization'] = `Bearer ${DEV_DIFY_API_KEY}`;
        }

        const response = await fetch(DIFY_ENDPOINT, {
          method: 'POST',
          headers,
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
    },
    [sessionId, userId, listings, resolveOfferAmenities]
  );

  return {
    isLoading,
    error,
    callDify,
    compareOffers,
    resolveOfferAmenities,
    difyAmenities,
  };
}
