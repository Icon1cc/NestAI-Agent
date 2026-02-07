import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Crosshair, MapPin } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Listing, Amenity, AmenityCategory } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createListingIcon(score: number, isSelected: boolean) {
  const hue = score >= 8 ? 160 : score >= 6 ? 45 : 0;
  const color = `hsl(${hue}, 60%, 45%)`;
  const size = isSelected ? 44 : 36;
  
  return new L.DivIcon({
    className: 'custom-listing-marker',
    html: `
      <div class="relative" style="width: ${size}px; height: ${size}px;">
        <div style="
          width: 100%;
          height: 100%;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px -2px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${isSelected ? '14px' : '12px'};
          color: white;
          ${isSelected ? 'transform: scale(1.1); box-shadow: 0 6px 20px -4px rgba(0,0,0,0.35);' : ''}
        ">
          ${score.toFixed(0)}
        </div>
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
    const zoom = radiusKm <= 1 ? 15 : radiusKm <= 3 ? 14 : radiusKm <= 7 ? 13 : 12;
    map.setView([lat, lng], zoom);
  }, [lat, lng, radiusKm, map]);
  
  return null;
}

interface ListingPopupProps {
  listing: Listing;
}

function ListingPopupContent({ listing }: ListingPopupProps) {
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
        <span>{listing.rooms} rooms</span>
        <span>{listing.areaM2} m²</span>
        {listing.distance && <span>{listing.distance.toFixed(1)} km</span>}
      </div>
      {listing.pros && listing.pros.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-nest-success">✓ {listing.pros[0]}</p>
        </div>
      )}
      <a
        href={listing.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-2 text-center text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        View on {listing.provider}
      </a>
    </div>
  );
}

interface MainMapProps {
  listings: Listing[];
  onRecenter: () => void;
  onChangeLocation: () => void;
}

export function MainMap({ listings, onRecenter, onChangeLocation }: MainMapProps) {
  const { location, radiusKm, selectedOfferIds } = useAppStore();
  const mapRef = useRef<L.Map | null>(null);

  const centerIcon = useMemo(() => createCenterIcon(), []);

  const handleRecenter = () => {
    if (location && mapRef.current) {
      const zoom = radiusKm <= 1 ? 15 : radiusKm <= 3 ? 14 : radiusKm <= 7 ? 13 : 12;
      mapRef.current.setView([location.lat, location.lng], zoom);
    }
    onRecenter();
  };

  if (!location) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative w-full h-full nest-map-container"
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

        {/* Listing markers */}
        {listings.map((listing) => {
          const isSelected = selectedOfferIds.includes(listing.id);
          return (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lng]}
              icon={createListingIcon(listing.score, isSelected)}
            >
              <Popup closeButton={false} className="nest-popup">
                <ListingPopupContent listing={listing} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="w-10 h-10 bg-card rounded-lg shadow-nest-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          title="Recenter map"
        >
          <Crosshair className="w-5 h-5" />
        </button>
        <button
          onClick={onChangeLocation}
          className="w-10 h-10 bg-card rounded-lg shadow-nest-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          title="Change location"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>

      {/* Location label */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-nest-md">
          <p className="text-xs text-muted-foreground">Searching within</p>
          <p className="text-sm font-medium">{radiusKm} km of {location.city || location.label.split(',')[0]}</p>
        </div>
      </div>
    </motion.div>
  );
}
