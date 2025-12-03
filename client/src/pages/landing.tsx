import { Button } from "@/components/ui/button";
import { Music, Cloud, Sun, CloudRain, Sparkles } from "lucide-react";
import { WeatherBackground } from "@/components/weather-background";

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <WeatherBackground condition="clear" timeOfDay="night" />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass-strong rounded-3xl p-8 md:p-12 max-w-lg text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <Music className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Ambient BGM
          </h1>
          
          <p className="text-white/70 text-lg mb-8">
            天気と時間帯に合わせた、あなただけの作業用BGMを生成します
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Sun className="w-4 h-4" />
              <span>天気連動</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Cloud className="w-4 h-4" />
              <span>AI生成</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>高品質音楽</span>
            </div>
          </div>
          
          <a href="/api/login" data-testid="button-login">
            <Button 
              size="lg" 
              className="w-full glass text-white hover:bg-white/20 text-lg py-6"
            >
              ログインして始める
            </Button>
          </a>
          
          <p className="text-white/40 text-sm mt-4">
            Google、GitHub、またはメールでログイン
          </p>
        </div>
        
        <div className="mt-8 flex items-center gap-2 text-white/40 text-sm">
          <CloudRain className="w-4 h-4" />
          <span>雨の日も晴れの日も、あなたの作業をサポート</span>
        </div>
      </div>
    </div>
  );
}
