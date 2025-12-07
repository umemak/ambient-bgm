import { useState, useEffect } from "react";
import { MapPin, Navigation, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LocationSettingsProps {
  manualLocation: string;
  useAutoLocation: boolean;
  isLoadingLocation: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
  onManualLocationChange: (value: string) => void;
  onAutoLocationToggle: (value: boolean) => void;
  onApply: () => void;
}

export function LocationSettings({
  manualLocation,
  useAutoLocation,
  isLoadingLocation,
  locationError,
  onRequestLocation,
  onManualLocationChange,
  onAutoLocationToggle,
  onApply,
}: LocationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localManualLocation, setLocalManualLocation] = useState(manualLocation);

  // Sync local state when dialog opens or manualLocation prop changes
  useEffect(() => {
    setLocalManualLocation(manualLocation);
  }, [manualLocation, isOpen]);

  const handleApply = () => {
    onManualLocationChange(localManualLocation);
    onApply();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="glass text-white/80 hover:text-white hover:bg-white/20"
          aria-label="Location settings"
          data-testid="button-location-settings"
        >
          <MapPin className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-white/20 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-white">Location Settings</DialogTitle>
          <DialogDescription className="text-white/70">
            Configure how we detect your location for weather
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-white font-medium">Auto-detect location</Label>
              <p className="text-white/60 text-xs">
                Use your device's GPS
              </p>
            </div>
            <Switch
              checked={useAutoLocation}
              onCheckedChange={onAutoLocationToggle}
              data-testid="switch-auto-location"
            />
          </div>

          {useAutoLocation && (
            <div className="space-y-3">
              <Button
                onClick={onRequestLocation}
                disabled={isLoadingLocation}
                className="w-full glass text-white hover:bg-white/20 gap-2"
                variant="outline"
                data-testid="button-detect-location"
              >
                <Navigation className={`w-4 h-4 ${isLoadingLocation ? "animate-pulse" : ""}`} />
                {isLoadingLocation ? "Detecting..." : "Detect Current Location"}
              </Button>
              {locationError && (
                <p className="text-red-400 text-xs text-center" data-testid="text-location-error">
                  {locationError}
                </p>
              )}
            </div>
          )}

          {!useAutoLocation && (
            <div className="space-y-2">
              <Label htmlFor="manual-location" className="text-white">
                City name
              </Label>
              <Input
                id="manual-location"
                value={localManualLocation}
                onChange={(e) => setLocalManualLocation(e.target.value)}
                placeholder="e.g., Tokyo, London, New York"
                className="glass text-white placeholder:text-white/50 border-white/20 focus:border-white/40"
                data-testid="input-manual-location"
              />
              <p className="text-white/50 text-xs">
                Enter a city name to get local weather
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-location-cancel"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white"
            data-testid="button-location-apply"
          >
            <Check className="w-4 h-4 mr-2" />
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
