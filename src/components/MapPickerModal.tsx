import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useReverseGeocode } from '@/hooks/useNominatim';
import { useAppStore } from '@/store/appStore';
import type { Location } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div class="w-10 h-10 flex items-center justify-center">
      <div class="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

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

interface MapCenterProps {
  center: [number, number];
}

function MapCenter({ center }: MapCenterProps) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Component to sync map with store location changes
function MapLocationSync() {
  const map = useMap();
  const { location, radiusKm } = useAppStore();
  
  useEffect(() => {
    if (location) {
      const zoom = radiusKm <= 1 ? 15 : radiusKm <= 3 ? 14 : radiusKm <= 7 ? 13 : 12;
      map.setView([location.lat, location.lng], zoom);
    }
  }, [location, radiusKm, map]);
  
  return null;
}

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MapPickerModal({ isOpen, onClose }: MapPickerModalProps) {
  const { location, radiusKm, setLocation } = useAppStore();
  const { reverseGeocode, isLoading } = useReverseGeocode();
  
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);

  // Use current location or default to Paris
  const mapCenter: [number, number] = location 
    ? [location.lat, location.lng] 
    : [48.8566, 2.3522];

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
    setLocationLabel('Loading...');
    
    const loc = await reverseGeocode(lat, lng);
    if (loc) {
      setLocationLabel(loc.label);
      setPendingLocation(loc);
    } else {
      const label = `Selected location`;
      setLocationLabel(label);
      setPendingLocation({
        label,
        lat,
        lng,
      });
    }
  }, [reverseGeocode]);

  const handleConfirm = () => {
    if (pendingLocation) {
      setLocation(pendingLocation);
      setSelectedPosition(null);
      setLocationLabel('');
      setPendingLocation(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedPosition(null);
    setLocationLabel('');
    setPendingLocation(null);
    onClose();
  };

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPosition(null);
      setLocationLabel('');
      setPendingLocation(null);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-background pt-16"
        >
          {/* Map area - leaves space for footer */}
          <div className="absolute inset-0 pt-16 pb-20">
            <MapContainer
              center={mapCenter}
              zoom={14}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />
              <MapLocationSync />
              
              {/* Always show radius circle */}
              <Circle
                center={selectedPosition || mapCenter}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: 'hsl(160, 35%, 35%)',
                  fillColor: 'hsl(160, 35%, 35%)',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
              
              {selectedPosition && (
                <>
                  <MapCenter center={selectedPosition} />
                  <Marker 
                    position={selectedPosition} 
                    icon={customIcon}
                    draggable
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const pos = marker.getLatLng();
                        handleLocationSelect(pos.lat, pos.lng);
                      },
                    }}
                  />
                </>
              )}
            </MapContainer>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-card rounded-lg shadow-nest-md flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              title="Close map picker"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Instruction hint when no selection */}
            {!selectedPosition && (
              <div className="absolute top-4 left-4 right-16 z-10">
                <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-nest-md">
                  <p className="text-sm text-muted-foreground">
                    Click anywhere on the map to select a location, or use the city dropdown above
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-10 h-20 nest-glass flex items-center px-4">
            <div className="w-full max-w-lg mx-auto flex items-center justify-between gap-4">
              {selectedPosition ? (
                <>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading address...</span>
                        </div>
                      ) : (
                        <p className="text-foreground font-medium truncate">{locationLabel}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleClose} className="nest-btn-secondary px-4 py-2">
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={!pendingLocation || isLoading}
                      className="nest-btn-hero px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm w-full text-center">
                  Select a point on the map to set your search center
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
