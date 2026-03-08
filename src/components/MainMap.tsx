import { useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Crosshair, MapPin } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useReverseGeocode } from '@/hooks/useNominatim';
import { normalizeCategory } from '@/types';
import type { Listing } from '@/types';
import 'leaflet/dist/leaflet.css';
import { useI18n } from '@/lib/i18n';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create listing icon with rank-based color (red to green gradient)
function createListingIcon(rank: number, isSelected: boolean, isViewing: boolean) {
  // Map rank (0-1) to hue (0=red, 60=yellow, 120=green)
  const hue = Math.round(rank * 120);
  const saturation = 70;
  const lightness = isViewing ? 35 : 45;
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const size = isSelected || isViewing ? 44 : 36;
  const displayScore = Math.round(rank * 100);
  
  return new L.DivIcon({
    className: 'custom-listing-marker',
    html: `
      <div class="relative" style="width: ${size}px; height: ${size}px;">
        <div style="
          width: 100%;
          height: 100%;
          background: ${color};
          border: ${isViewing ? '4px' : '3px'} solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px -2px rgba(0,0,0,0.25)${isViewing ? ', 0 0 0 3px ' + color : ''};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${isSelected || isViewing ? '13px' : '11px'};
          color: white;
          transition: all 0.2s ease;
        ">
          ${displayScore}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Create amenity marker icon
function createAmenityIcon(category: string, isHighlighted: boolean) {
  const emojis: Record<string, string> = {
    groceries: '🛒',
    parks: '🌳',
    schools: '🏫',
    transit: '🚇',
    healthcare: '🏥',
    healtcare: '🏥',
    fitness: '💪',
  };
  const normalizedCat = normalizeCategory(category);
  const emoji = emojis[normalizedCat] || '📍';
  const size = isHighlighted ? 32 : 24;
  
  return new L.DivIcon({
    className: 'custom-amenity-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${isHighlighted ? 'white' : 'rgba(255,255,255,0.9)'};
        border: 2px solid ${isHighlighted ? 'hsl(160, 35%, 35%)' : 'rgba(0,0,0,0.1)'};
        border-radius: 50%;
        box-shadow: ${isHighlighted ? '0 4px 12px rgba(0,0,0,0.2), 0 0 0 3px hsl(160, 35%, 35%, 0.3)' : '0 2px 6px rgba(0,0,0,0.15)'};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isHighlighted ? '16px' : '12px'};
        transition: all 0.2s ease;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createCenterIcon() {
  return new L.DivIcon({
    className: 'center-marker',
    html: `
      <div class="w-6 h-6 flex items-center justify-center">
        <div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

interface MapRecenterProps {
  lat: number;
  lng: number;
  radiusKm: number;
}

function MapRecenter({ lat, lng, radiusKm }: MapRecenterProps) {
  const map = useMap();
  
  useEffect(() => {
    // Calculate bounds that include the full radius circle
    // Use fitBounds to ensure the entire circle is visible
    const radiusMeters = radiusKm * 1000;
    const center = L.latLng(lat, lng);
    const bounds = center.toBounds(radiusMeters * 2); // Diameter to show full circle
    
    map.fitBounds(bounds, {
      padding: [30, 30], // Add padding around the circle
      maxZoom: 16, // Don't zoom in too close
      animate: true,
      duration: 0.3,
    });
  }, [lat, lng, radiusKm, map]);
  
  return null;
}

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface ListingPopupProps {
  listing: Listing;
  onViewDetails: () => void;
}

function ListingPopupContent({ listing, onViewDetails }: ListingPopupProps) {
  const displayScore = Math.round(listing.rank * 100);
  const t = useI18n();
  
  return (
    <div className="w-64 p-3">
      {listing.photos[0] && (
        <img 
          src={listing.photos[0]} 
          alt={listing.title}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      )}
      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{listing.title}</h3>
      <p className="text-lg font-bold text-primary mb-2">
        €{listing.price.amount.toLocaleString()}
        {listing.price.period === 'month' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
      </p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="font-medium">{displayScore}/100</span>
        {listing.rooms > 0 && <span>{listing.rooms} {t('rooms').toLowerCase()}</span>}
        {listing.areaM2 > 0 && <span>{listing.areaM2} m²</span>}
      </div>
      {listing.summary && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{listing.summary}</p>
      )}
      <button
        onClick={onViewDetails}
        className="block w-full py-2 text-center text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t('offer_details')}
      </button>
    </div>
  );
}

interface MainMapProps {
  listings: Listing[];
  onRecenter: () => void;
  onChangeLocation: () => void;
  highlightedAmenityIds?: number[];
}

export function MainMap({ listings, onRecenter, onChangeLocation, highlightedAmenityIds = [] }: MainMapProps) {
  const { 
    location, 
    radiusKm, 
    selectedOfferIds, 
    selectedOfferId,
    setLocation,
    setSelectedOfferId,
    difyAmenities,
  } = useAppStore();
  const { reverseGeocode } = useReverseGeocode();
  const mapRef = useRef<L.Map | null>(null);
  const t = useI18n();

  const centerIcon = useMemo(() => createCenterIcon(), []);

  // Compute jittered positions for listings that share identical coordinates to avoid marker overlap
  const jitteredPositions = useMemo(() => {
    const groups = new Map<string, Listing[]>();

    listings.forEach((listing) => {
      const key = `${listing.lat.toFixed(6)},${listing.lng.toFixed(6)}`;
      const arr = groups.get(key) || [];
      arr.push(listing);
      groups.set(key, arr);
    });

    const result = new Map<string, [number, number]>();

    groups.forEach((group) => {
      // Stable order for deterministic jitter
      const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
      const count = sorted.length;

      sorted.forEach((listing, idx) => {
        if (count === 1) {
          result.set(listing.id, [listing.lat, listing.lng]);
          return;
        }

        // Spread markers in a small ring (~20m) around the original point
        const radiusMeters = 20;
        const angle = (2 * Math.PI * idx) / count;
        const latRad = (listing.lat * Math.PI) / 180;
        const deltaLat = (radiusMeters / 111320) * Math.sin(angle);
        const deltaLng =
          (radiusMeters / (111320 * Math.cos(latRad || 0.0001))) * Math.cos(angle);

        result.set(listing.id, [listing.lat + deltaLat, listing.lng + deltaLng]);
      });
    });

    return result;
  }, [listings]);

  // Get highlighted amenity IDs based on selected offer
  const activeHighlightIds = useMemo(() => {
    if (selectedOfferId) {
      const listing = listings.find(l => l.id === selectedOfferId);
      if (listing?.amenities && listing.amenities.length > 0) {
        return listing.amenities.map((a) => a.amenity_id);
      }
      if (listing?.closest_amenity_ids) {
        return listing.closest_amenity_ids;
      }
    }
    return highlightedAmenityIds;
  }, [selectedOfferId, listings, highlightedAmenityIds]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    // Update location when map is clicked
    const newLocation = await reverseGeocode(lat, lng);
    if (newLocation) {
      setLocation(newLocation);
    } else {
      setLocation({
        label: 'Selected location',
        lat,
        lng,
      });
    }
  }, [reverseGeocode, setLocation]);

  const handleRecenter = () => {
    if (location && mapRef.current) {
      // Use fitBounds to ensure the radius circle is visible
      const radiusMeters = radiusKm * 1000;
      const center = L.latLng(location.lat, location.lng);
      const bounds = center.toBounds(radiusMeters * 2);
      
      mapRef.current.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 16,
        animate: true,
        duration: 0.3,
      });
    }
    onRecenter();
  };

  const handleViewDetails = useCallback((listingId: string) => {
    setSelectedOfferId(listingId);
  }, [setSelectedOfferId]);

  if (!location) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative w-full h-full nest-map-container z-0"
    >
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={14}
        className="w-full h-full rounded-xl"
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapRecenter lat={location.lat} lng={location.lng} radiusKm={radiusKm} />
        <MapClickHandler onLocationSelect={handleMapClick} />

        {/* Center marker */}
        <Marker position={[location.lat, location.lng]} icon={centerIcon} />

        {/* Radius circle */}
        <Circle
          center={[location.lat, location.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: 'hsl(160, 35%, 35%)',
            fillColor: 'hsl(160, 35%, 35%)',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '8, 8',
          }}
        />

        {/* Amenity markers - show when an offer is selected */}
        {activeHighlightIds.length > 0 && difyAmenities.map((amenity) => {
          const isHighlighted = activeHighlightIds.includes(amenity.amenity_id);
          const lng = amenity.lng ?? amenity.long ?? 0;
          
          return (
            <Marker
              key={`amenity-${amenity.amenity_id}`}
              position={[amenity.lat, lng]}
              icon={createAmenityIcon(amenity.category, isHighlighted)}
              zIndexOffset={isHighlighted ? 500 : 0}
            >
              <Popup closeButton={false}>
                <div className="p-2 text-center">
                  <p className="font-medium text-sm">{amenity.description}</p>
                  <p className="text-xs text-muted-foreground capitalize">{normalizeCategory(amenity.category)}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Listing markers */}
        {listings.map((listing) => {
          const isSelected = selectedOfferIds.includes(listing.id);
          const isViewing = selectedOfferId === listing.id;
          const jittered = jitteredPositions.get(listing.id) || [listing.lat, listing.lng];
          return (
            <Marker
              key={listing.id}
              position={jittered}
              icon={createListingIcon(listing.rank, isSelected, isViewing)}
              zIndexOffset={isViewing ? 1000 : isSelected ? 500 : 0}
            >
              <Popup closeButton={false} className="nest-popup">
                <ListingPopupContent 
                  listing={listing} 
                  onViewDetails={() => handleViewDetails(listing.id)}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="w-10 h-10 bg-card rounded-lg shadow-nest-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          title={t('recenter_map')}
        >
          <Crosshair className="w-5 h-5" />
        </button>
        <button
          onClick={onChangeLocation}
          className="w-10 h-10 bg-card rounded-lg shadow-nest-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          title={t('change_location')}
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* Location label */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-nest-md">
          <p className="text-xs text-muted-foreground">{t('searching_within')}</p>
          <p className="text-sm font-medium">{radiusKm} {t('km_of')} {location.city || location.label.split(',')[0]}</p>
        </div>
      </div>
    </motion.div>
  );
}
