import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Star, Loader2 } from "lucide-react";
import { VenueSuggestion, ConnectionProfile } from "@/types/connection";
import { formatDistance, metersBetween } from "@/lib/location-utils";
import { GoogleSpacesMap } from "./GoogleSpacesMap";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CITY_CENTER } from "@/config/city";
import { toast } from "sonner";

interface VenueSelectorDialogProps {
  open: boolean;
  connection: ConnectionProfile | null;
  venues: VenueSuggestion[];
  commonInterests: string[];
  onClose: () => void;
  onSelectVenue: (venue: VenueSuggestion) => void;
  onMapVenueSelect?: (venue: VenueSuggestion) => void;
}

export const VenueSelectorDialog = ({
  open,
  connection,
  venues: _unusedVenues,
  commonInterests,
  onClose,
  onSelectVenue,
  onMapVenueSelect,
}: VenueSelectorDialogProps) => {
  const [selectedVenue, setSelectedVenue] = useState<VenueSuggestion | null>(null);
  const [selectedMapVenue, setSelectedMapVenue] = useState<VenueSuggestion | null>(null);
  const [venues, setVenues] = useState<VenueSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real places from Google Maps when dialog opens
  useEffect(() => {
    if (open && connection) {
      setIsLoading(true);
      setVenues([]);
      
      const allInterests = [...new Set([...commonInterests])];
      
      supabase.functions.invoke('search-places', {
        body: {
          lat: DEFAULT_CITY_CENTER.lat,
          lng: DEFAULT_CITY_CENTER.lng,
          interests: allInterests,
          radius: 1000, // 1km radius
        }
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error fetching places:', error);
          toast.error('Failed to load venues');
          setIsLoading(false);
          return;
        }
        
        if (data?.places) {
          const mappedVenues: VenueSuggestion[] = data.places.map((place: any) => {
            const distanceM = metersBetween(
              DEFAULT_CITY_CENTER.lat,
              DEFAULT_CITY_CENTER.lng,
              place.lat,
              place.lng
            );
            
            return {
              id: place.id,
              name: place.name,
              category: formatCategory(place.category),
              lat: place.lat,
              lng: place.lng,
              distanceM,
              matchScore: Math.floor(place.rating * 20), // Convert 0-5 rating to 0-100 score
              tags: place.types?.slice(0, 3) || [],
              openNow: place.openNow,
              rating: place.rating,
              description: place.vicinity || '',
            };
          });
          
          setVenues(mappedVenues);
        }
        setIsLoading(false);
      });
    }
  }, [open, connection, commonInterests]);

  const formatCategory = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-success text-success-foreground";
    if (score >= 60) return "bg-accent text-accent-foreground";
    return "bg-muted text-muted-foreground";
  };

  const handleMapVenueClick = (venue: any) => {
    const matchedVenue = venues.find(v => v.id === venue.id);
    if (matchedVenue) {
      setSelectedMapVenue(matchedVenue);
    }
  };

  const handleConfirmMapSelection = () => {
    if (selectedMapVenue && onMapVenueSelect) {
      onMapVenueSelect(selectedMapVenue);
      setSelectedMapVenue(null);
    }
  };

  if (!connection) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <DialogTitle className="text-xl">Pick a spot with {connection.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your shared interests in {commonInterests.join(", ")}
              </p>
            </div>
          </div>
        </DialogHeader>


        {/* Venues List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Finding the best spots for you...</p>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                Top {venues.length} venues from Google Maps
              </h3>
              <div className="space-y-3">
                {venues.map((venue) => (
              <div
                key={venue.id}
                className={`gradient-card rounded-2xl p-4 transition-all ${
                  selectedVenue?.id === venue.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{venue.name}</h4>
                    <p className="text-sm text-muted-foreground">{venue.category}</p>
                  </div>
                  <Badge className={`${getMatchColor(venue.matchScore)} shrink-0`}>
                    {venue.matchScore}% match
                  </Badge>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {venue.tags.map((tag, idx) => (
                    <span key={idx} className="text-xs text-muted-foreground">
                      {tag}
                      {idx < venue.tags.length - 1 && " •"}
                    </span>
                  ))}
                </div>

                {/* Info */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {formatDistance(venue.distanceM)}
                  </span>
                  {venue.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {venue.rating.toFixed(1)}
                    </span>
                  )}
                  {venue.openNow !== undefined && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className={venue.openNow ? "text-success" : "text-muted-foreground"}>
                        {venue.openNow ? "Open now" : "Closed"}
                      </span>
                    </span>
                  )}
                </div>

                <Button
                  onClick={() => onSelectVenue(venue)}
                  className="w-full"
                  variant={selectedVenue?.id === venue.id ? "default" : "outline"}
                >
                  Select this spot
                </Button>
              </div>
            ))}
              </div>

              {/* Map Section */}
              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-1">Explore on Map</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tap any pin to view details and select
                </p>
                <div className="relative">
                  <GoogleSpacesMap 
                    venues={venues}
                    onVenueSelect={handleMapVenueClick}
                    selectedVenueId={selectedMapVenue?.id}
                    height="500px"
                    showHeader={false}
                  />
                  
                  {/* Info Panel - Bottom Left */}
                  {selectedMapVenue && (
                    <div 
                      className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-xl p-4 shadow-lg z-[1000] max-w-xs"
                      role="region"
                      aria-live="polite"
                    >
                      <h4 className="font-semibold text-foreground truncate mb-1">
                        {selectedMapVenue.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {selectedMapVenue.category}
                      </p>
                      <div className="flex flex-col gap-1 text-xs">
                        {selectedMapVenue.openNow !== undefined && (
                          <span className={`flex items-center gap-1 ${selectedMapVenue.openNow ? 'text-success' : 'text-muted-foreground'}`}>
                            <Clock className="w-3 h-3" />
                            {selectedMapVenue.openNow ? "Open now" : "Closed"}
                          </span>
                        )}
                        {selectedMapVenue.rating && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Star className="w-3 h-3" />
                            {selectedMapVenue.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {formatDistance(selectedMapVenue.distanceM)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Select Button - Bottom Right */}
                  <div className="absolute bottom-4 right-4 z-[1000]">
                    <Button
                      onClick={handleConfirmMapSelection}
                      disabled={!selectedMapVenue}
                      size="lg"
                      className="shadow-lg"
                      aria-disabled={!selectedMapVenue}
                    >
                      Select This Spot
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
