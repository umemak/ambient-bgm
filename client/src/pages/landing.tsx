import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Cloud, Sun, CloudRain, Sparkles, Loader2 } from "lucide-react";
import { WeatherBackground } from "@/components/weather-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/demo-login");
      // Reload page to trigger authentication check
      window.location.reload();
    } catch (error) {
      toast({
        title: "ログインエラー",
        description: "ログインに失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

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
          
          <Button 
            onClick={handleDemoLogin}
            disabled={isLoading}
            size="lg" 
            className="w-full glass text-white hover:bg-white/20 text-lg py-6"
            data-testid="button-demo-login"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ログイン中...
              </>
            ) : (
              "デモログインして始める"
            )}
          </Button>
          
          <p className="text-white/40 text-sm mt-4">
            デモアカウントでアプリを試せます
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
