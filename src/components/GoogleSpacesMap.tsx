import { useEffect, useRef, useState } from 'react';
import { DEFAULT_CITY_CENTER, DURHAM_RECS } from '@/config/city';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Category emoji mapping
const getCategoryEmoji = (type: string = 'default'): string => {
  const iconMap: Record<string, string> = {
    coffee: '☕',
    stadium: '⚽',
    garden: '🌿',
    sight: '🏛️',
    hangout: '🍺',
    restaurant: '🍴',
    study: '📚',
    shopping: '🛍️',
    default: '📍',
  };
  return iconMap[type] || iconMap.default;
};

interface Location {
  name: string;
  lat: number;
  lng: number;
  category?: string;
  id?: string;
  type?: string;
}

interface GoogleSpacesMapProps {
  venues?: Location[];
  onVenueSelect?: (venue: Location) => void;
  selectedVenueId?: string | null;
  height?: string;
  showHeader?: boolean;
  locationCounts?: Record<string, number>;
}

export const GoogleSpacesMap = ({ 
  venues = DURHAM_RECS, 
  onVenueSelect,
  selectedVenueId = null,
  height = "300px",
  showHeader = true,
  locationCounts = {}
}: GoogleSpacesMapProps) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      if (!containerRef.current || mapRef.current) return;

      try {
        // Fetch API key from backend
        const { data: keyData } = await supabase.functions.invoke('google-maps-proxy');
        
        if (!keyData?.apiKey) {
          throw new Error('Failed to get Google Maps API key');
        }

        // Check if script already loaded
        if (!window.google) {
          // Load Google Maps script with Places library
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${keyData.apiKey}&libraries=places,marker&v=weekly`;
          script.async = true;
          script.defer = true;
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        // Initialize map
        const map = new google.maps.Map(containerRef.current, {
          center: { lat: DEFAULT_CITY_CENTER.lat, lng: DEFAULT_CITY_CENTER.lng },
          zoom: 14,
          mapId: 'DEMO_MAP_ID',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        });

        mapRef.current = map;

        // Add markers for our venues
        venues.forEach((location) => {
          const marker = new google.maps.Marker({
            map,
            position: { lat: location.lat, lng: location.lng },
            title: location.name,
          });

          // Add click listener to marker
          marker.addListener('click', () => {
            if (onVenueSelect) {
              onVenueSelect(location);
            }
          });

          if (location.id) {
            markersRef.current.set(location.id, marker as any);
          }
        });

        // Add listener for clicks on map POIs (Google's built-in pins)
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          // Check if click was on a POI
          const placeId = (event as any).placeId;
          if (placeId && onVenueSelect) {
            // Get place details
            const service = new google.maps.places.PlacesService(map);
            service.getDetails(
              { placeId: placeId, fields: ['name', 'geometry', 'formatted_address', 'types', 'rating', 'opening_hours'] },
              (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
                  // Create a venue object from the place
                  const venue: Location = {
                    id: placeId,
                    name: place.name || 'Unknown Place',
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    category: place.types?.[0] || 'place',
                    type: place.types?.[0] || 'place',
                  };
                  onVenueSelect(venue);
                }
              }
            );
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        toast.error('Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach(marker => {
        (marker as any).setMap(null);
      });
      markersRef.current.clear();
      mapRef.current = null;
    };
  }, [venues, onVenueSelect]);

  // Update markers when counts change
  useEffect(() => {
    if (!mapRef.current) return;

    // Markers will update through the info windows when clicked
    // No need to modify marker appearance
  }, [selectedVenueId, locationCounts, venues]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-soft" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      {showHeader && (
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg z-[1000]">
          <h3 className="font-semibold text-sm">Durham, NC</h3>
          <p className="text-xs text-muted-foreground">Live connections at spots</p>
        </div>
      )}
    </div>
  );
};
