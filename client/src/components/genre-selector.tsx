import { Music2, Piano, Guitar, Headphones, Radio, Mic2, Waves, Sparkles, Zap, Activity, Music, Disc3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { musicGenres, genreLabels, type MusicGenre } from "@shared/schema";

interface GenreSelectorProps {
  value: MusicGenre;
  onChange: (value: MusicGenre) => void;
  disabled?: boolean;
}

const genreIcons: Record<MusicGenre, typeof Music2> = {
  "auto": Sparkles,
  "lo-fi": Headphones,
  "jazz": Mic2,
  "classical": Music2,
  "electronic": Radio,
  "ambient": Waves,
  "acoustic": Guitar,
  "piano": Piano,
  "house": Zap,
  "techno": Activity,
  "dnb": Zap,
  "edm": Activity,
  "funk": Music,
  "disco": Disc3,
  "rock": Guitar,
  "indie": Music,
};

const genreCategories = {
  "Auto": ["auto"],
  "Chill & Focus": ["lo-fi", "ambient", "classical", "piano", "jazz", "acoustic"],
  "Upbeat & Energetic": ["house", "techno", "dnb", "edm", "funk", "disco", "rock", "indie"],
} as const;

export function GenreSelector({ value, onChange, disabled }: GenreSelectorProps) {
  const Icon = genreIcons[value];
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-white/70 text-sm">
        <Icon className="w-4 h-4" />
        <span>Genre:</span>
      </div>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as MusicGenre)}
        disabled={disabled}
      >
        <SelectTrigger 
          className="w-48 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30"
          data-testid="select-genre"
        >
          <SelectValue placeholder="Select genre" />
        </SelectTrigger>
        <SelectContent className="bg-gray-900/95 backdrop-blur-xl border-white/20">
          {Object.entries(genreCategories).map(([category, genres], idx) => (
            <SelectGroup key={category}>
              {idx > 0 && <SelectSeparator className="bg-white/10" />}
              <SelectLabel className="text-white/50 text-xs font-semibold px-2 py-1.5">
                {category}
              </SelectLabel>
              {genres.map((genre) => {
                const GenreIcon = genreIcons[genre as MusicGenre];
                return (
                  <SelectItem
                    key={genre}
                    value={genre}
                    className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
                    data-testid={`select-genre-option-${genre}`}
                  >
                    <div className="flex items-center gap-2">
                      <GenreIcon className="w-4 h-4" />
                      <span>{genreLabels[genre as MusicGenre]}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
