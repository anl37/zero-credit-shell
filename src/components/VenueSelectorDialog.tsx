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


        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Finding the best spots for you...</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No venues found. Try different interests or check back later.</p>
            </div>
          ) : (
            <>
              {/* Top 10 Venues List */}
              <h3 className="font-semibold text-lg mb-1">Top 10 Spots for You</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Based on your shared interests in {commonInterests.join(", ")}
              </p>
              <div className="space-y-3 mb-8">
                {venues.map((venue) => (
                  <div
                    key={venue.id}
                    className="gradient-card rounded-2xl p-4 transition-all hover:shadow-md"
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
                    {venue.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {venue.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs text-muted-foreground">
                            {tag}
                            {idx < venue.tags.length - 1 && " •"}
                          </span>
                        ))}
                      </div>
                    )}

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
                      variant="default"
                    >
                      Select this spot
                    </Button>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border"></div>
                <p className="text-sm text-muted-foreground">Or explore more on the map</p>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              {/* Map Section */}
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-1">Explore on Map</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click any pin on Google Maps to see details and select
                </p>
                <div className="relative">
                  <GoogleSpacesMap 
                    venues={venues}
                    onVenueSelect={handleMapVenueClick}
                    selectedVenueId={selectedMapVenue?.id}
                    height="500px"
                    showHeader={false}
                  />
                  
                  {/* Select Button - Floating at Bottom */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000]">
                    <Button
                      onClick={handleConfirmMapSelection}
                      disabled={!selectedMapVenue}
                      size="lg"
                      className="shadow-lg"
                      aria-disabled={!selectedMapVenue}
                    >
                      {selectedMapVenue ? `Select ${selectedMapVenue.name}` : 'Select a pin on the map'}
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
