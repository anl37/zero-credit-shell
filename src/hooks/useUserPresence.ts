import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { GeolocationData } from './useGeolocation';

interface PresenceData {
  locationId: string;
  lat: number;
  lng: number;
  status: 'live' | 'paused';
}

export const useUserPresence = () => {
  const { user } = useAuth();
  const [locationCounts, setLocationCounts] = useState<Record<string, number>>({});

  // Update user's presence at a location
  const updatePresence = useCallback(async (location: GeolocationData, locationId: string, status: 'live' | 'paused') => {
    if (!user) return;

    const { error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: user.id,
        location_id: locationId,
        lat: location.lat,
        lng: location.lng,
        status,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id,location_id'
      });

    if (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  // Remove user's presence
  const removePresence = useCallback(async (locationId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_presence')
      .delete()
      .eq('user_id', user.id)
      .eq('location_id', locationId);

    if (error) {
      console.error('Error removing presence:', error);
    }
  }, [user]);

  // Fetch and subscribe to presence counts
  useEffect(() => {
    const fetchPresenceCounts = async () => {
      const { data, error } = await supabase
        .from('user_presence')
        .select('location_id, status')
        .eq('status', 'live');

      if (error) {
        console.error('Error fetching presence:', error);
        return;
      }

      // Count users per location
      const counts: Record<string, number> = {};
      data.forEach((presence) => {
        counts[presence.location_id] = (counts[presence.location_id] || 0) + 1;
      });
      setLocationCounts(counts);
    };

    fetchPresenceCounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        () => {
          // Refetch counts when presence changes
          fetchPresenceCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    locationCounts,
    updatePresence,
    removePresence,
  };
};
