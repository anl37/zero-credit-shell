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

        // Create a Places service
        const service = new google.maps.places.PlacesService(map);

        // Search for places near each venue location
        venues.forEach((location) => {
          const request = {
            location: { lat: location.lat, lng: location.lng },
            radius: 50, // Search within 50 meters
            keyword: location.name,
          };

          service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
              const place = results[0];
              
              // Create an info window that will show on click
              const infoWindow = new google.maps.InfoWindow();
              
              // Create a marker for this place
              const marker = new google.maps.Marker({
                map,
                position: place.geometry?.location,
                title: place.name,
              });

              // Add click listener
              marker.addListener('click', () => {
                if (onVenueSelect && location.id) {
                  onVenueSelect(location);
                }
                
                const count = location.id ? locationCounts[location.id] || 0 : 0;
                const content = `
                  <div style="padding: 8px;">
                    <h3 style="margin: 0 0 8px 0; font-weight: bold;">${location.name}</h3>
                    <p style="margin: 0; font-size: 14px;">${count} ${count === 1 ? 'person' : 'people'} open to connect</p>
                  </div>
                `;
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
              });

              if (location.id) {
                markersRef.current.set(location.id, marker as any);
              }
            }
          });
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
