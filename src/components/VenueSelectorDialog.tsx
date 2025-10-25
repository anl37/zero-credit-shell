import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Star } from "lucide-react";
import { VenueSuggestion, ConnectionProfile } from "@/types/connection";
import { formatDistance } from "@/lib/location-utils";
import { getDurhamVenues } from "@/lib/durham-venues";
import { SpacesMap } from "./SpacesMap";
import { getVenueStatus } from "@/lib/venue-hours";

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
  venues,
  commonInterests,
  onClose,
  onSelectVenue,
  onMapVenueSelect,
}: VenueSelectorDialogProps) => {
  const [selectedVenue, setSelectedVenue] = useState<VenueSuggestion | null>(null);
  const [selectedMapVenue, setSelectedMapVenue] = useState<VenueSuggestion | null>(null);
  const [allVenues] = useState<VenueSuggestion[]>(() => getDurhamVenues());

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-success text-success-foreground";
    if (score >= 60) return "bg-accent text-accent-foreground";
    return "bg-muted text-muted-foreground";
  };

  const handleMapVenueClick = (venue: any) => {
    const durhamVenue = allVenues.find(v => v.id === venue.id);
    if (durhamVenue) {
      setSelectedMapVenue(durhamVenue);
    }
  };

  const handleConfirmMapSelection = () => {
    if (selectedMapVenue && onMapVenueSelect) {
      onMapVenueSelect(selectedMapVenue);
      setSelectedMapVenue(null);
    }
  };

  const selectedVenueStatus = selectedMapVenue ? getVenueStatus(selectedMapVenue) : null;

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
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">
            Top {venues.length} venues for you
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
                  {(() => {
                    const status = getVenueStatus(venue);
                    return (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className={status.open ? "text-success" : "text-muted-foreground"}>
                          {status.label}
                        </span>
                      </span>
                    );
                  })()}
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
            <h3 className="font-semibold text-lg mb-1">Explore 50+ Durham Spots</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tap any pin to view details and select
            </p>
            <div className="relative">
              <SpacesMap 
                venues={allVenues}
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
                    {selectedVenueStatus && (
                      <span className={`flex items-center gap-1 ${selectedVenueStatus.open ? 'text-success' : 'text-muted-foreground'}`}>
                        <Clock className="w-3 h-3" />
                        {selectedVenueStatus.label}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
