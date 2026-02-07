import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2 } from 'lucide-react';
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

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MapPickerModal({ isOpen, onClose }: MapPickerModalProps) {
  const { radiusKm, setLocation } = useAppStore();
  const { reverseGeocode, isLoading } = useReverseGeocode();
  
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [pendingLocation, setPendingLocation] = useState<Location | null>(null);

  // Default center (Berlin)
  const defaultCenter: [number, number] = [52.52, 13.405];

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
    setLocationLabel('Loading...');
    
    const location = await reverseGeocode(lat, lng);
    if (location) {
      setLocationLabel(location.label);
      setPendingLocation(location);
    } else {
      setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setPendingLocation({
        label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat,
        lng,
      });
    }
  }, [reverseGeocode]);

  const handleConfirm = () => {
    if (pendingLocation) {
      setLocation(pendingLocation);
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedPosition(null);
    setLocationLabel('');
    setPendingLocation(null);
    onClose();
  };

  // Reset state when modal opens
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
          className="fixed inset-0 z-[100] bg-background"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-[110] h-16 nest-glass flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-lg">Select Location</h2>
            </div>
            <button onClick={handleCancel} className="nest-icon-btn">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Map */}
          <div className="absolute inset-0 pt-16 pb-24">
            <MapContainer
              center={defaultCenter}
              zoom={12}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />
              
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
                  <Circle
                    center={selectedPosition}
                    radius={radiusKm * 1000}
                    pathOptions={{
                      color: 'hsl(160, 35%, 35%)',
                      fillColor: 'hsl(160, 35%, 35%)',
                      fillOpacity: 0.1,
                      weight: 2,
                    }}
                  />
                </>
              )}
            </MapContainer>

            {/* Crosshair hint */}
            {!selectedPosition && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-background/80 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-muted-foreground">Click anywhere on the map to select a location</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-[110] p-4 nest-glass">
            <div className="max-w-lg mx-auto space-y-3">
              {selectedPosition && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Loading address...</span>
                      </div>
                    ) : (
                      <p className="text-foreground truncate">{locationLabel}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button onClick={handleCancel} className="nest-btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!pendingLocation || isLoading}
                  className="nest-btn-hero flex-1 disabled:opacity-50"
                >
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
