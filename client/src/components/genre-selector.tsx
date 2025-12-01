import { Music2, Piano, Guitar, Headphones, Radio, Mic2, Waves, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
};

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
          {musicGenres.map((genre) => {
            const GenreIcon = genreIcons[genre];
            return (
              <SelectItem
                key={genre}
                value={genre}
                className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer"
                data-testid={`select-genre-option-${genre}`}
              >
                <div className="flex items-center gap-2">
                  <GenreIcon className="w-4 h-4" />
                  <span>{genreLabels[genre]}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
