import { useState } from "react";
import { User, Clock, MapPin, Settings, Shield } from "lucide-react";
import { TabNavigation } from "@/components/TabNavigation";
import { WeeklyPresence } from "@/components/WeeklyPresence";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const mockUserProfile = {
  name: "You",
  avatar: "😊",
  tagline: "Exploring bookstores lately",
  weeklyVisits: [2, 3, 1, 2, 3, 4, 1],
  topActivities: [
    { icon: "☕", name: "Café", frequency: "3×/week" },
    { icon: "📚", name: "Reading", frequency: "2×/week" },
    { icon: "🏃", name: "Running", frequency: "2×/week" },
  ],
  typicalTimes: "Evenings 6-8 PM, Weekends 10-12 AM",
  preferences: {
    showPresenceHistory: true,
  },
};

const Profile = () => {
  const [safetyCheckins, setSafetyCheckins] = useState(false);
  const [emergencyNumber, setEmergencyNumber] = useState('911');

  return (
    <div className="min-h-screen bg-gradient-subtle pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-base">Profile</h1>
                <p className="text-xs text-muted-foreground">
                  Your presence & preferences
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="gradient-card rounded-3xl p-6 shadow-soft text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
            {mockUserProfile.avatar}
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">{mockUserProfile.name}</h2>
          <p className="text-sm text-muted-foreground mb-4">{mockUserProfile.tagline}</p>
          
          <Button variant="outline" className="rounded-full">
            Edit Profile
          </Button>
        </div>

        {/* Weekly Presence */}
        <div className="gradient-card rounded-3xl p-6 shadow-soft">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Weekly Presence
          </h3>
          <WeeklyPresence visits={mockUserProfile.weeklyVisits} />
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Checked in {mockUserProfile.weeklyVisits.reduce((a, b) => a + b, 0)}× this week
          </p>
        </div>

        {/* Top Activities */}
        <div className="gradient-card rounded-3xl p-6 shadow-soft">
          <h3 className="font-semibold text-foreground mb-4">Top Activities</h3>
          <div className="space-y-3">
            {mockUserProfile.topActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activity.icon}</span>
                  <span className="text-sm font-medium text-foreground">{activity.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.frequency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Typical Times */}
        <div className="gradient-card rounded-3xl p-6 shadow-soft">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Usually Here
          </h3>
          <p className="text-sm text-muted-foreground">{mockUserProfile.typicalTimes}</p>
        </div>

        {/* My Trends (Optional) */}
        <div className="gradient-card rounded-3xl p-6 shadow-soft">
          <h3 className="font-semibold text-foreground mb-3">My Trends</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>🌆 You tend to connect in evenings</p>
            <p>☕ 65% of connections at cafés</p>
            <p>📅 Most active on weekends</p>
          </div>
        </div>

        {/* Safety Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground px-1 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Safety
          </h3>
          
          <Card className="p-4 gradient-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="checkins" className="text-sm font-medium">
                    Quick check-ins
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get a safety prompt 30 min after meet starts
                  </p>
                </div>
                <Switch
                  id="checkins"
                  checked={safetyCheckins}
                  onCheckedChange={setSafetyCheckins}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency" className="text-sm font-medium">
                  Emergency number
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Default: {emergencyNumber} (US)
                </p>
              </div>

              <div className="pt-2 border-t border-border">
                <Button variant="link" className="text-xs p-0 h-auto">
                  About Safety & Privacy
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Settings Options */}
        <div className="space-y-2">
          <button className="w-full gradient-card rounded-3xl p-4 text-left hover:shadow-elegant transition-all shadow-soft">
            <p className="text-sm font-medium text-foreground">Privacy Settings</p>
            <p className="text-xs text-muted-foreground mt-1">Control who sees you</p>
          </button>
          <button className="w-full gradient-card rounded-3xl p-4 text-left hover:shadow-elegant transition-all shadow-soft">
            <p className="text-sm font-medium text-foreground">Edit Interests</p>
            <p className="text-xs text-muted-foreground mt-1">Update your activities</p>
          </button>
          <button className="w-full gradient-card rounded-3xl p-4 text-left hover:shadow-elegant transition-all shadow-soft">
            <p className="text-sm font-medium text-foreground">About Spotmate</p>
            <p className="text-xs text-muted-foreground mt-1">Learn more</p>
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-4">
          Less app, more friend
        </p>
      </div>

      <TabNavigation />
    </div>
  );
};

export default Profile;
