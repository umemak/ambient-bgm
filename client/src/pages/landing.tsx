import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Cloud, Sun, CloudRain, Sparkles, Loader2, Lock, User } from "lucide-react";
import { WeatherBackground } from "@/components/weather-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "入力エラー",
        description: "ユーザー名とパスワードを入力してください。",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", { username, password });
      // Reload page to trigger authentication check
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "ログインエラー",
        description: error.message || "ユーザー名またはパスワードが正しくありません。",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WeatherBackground condition="clear" timeOfDay="night" />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass-strong rounded-3xl p-8 md:p-12 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <Music className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2 text-center">
            Ambient BGM
          </h1>
          
          <p className="text-white/70 text-center mb-8">
            天気と時間帯に合わせた、あなただけの作業用BGMを生成します
          </p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/90 text-sm font-medium">
                ユーザー名
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ユーザー名を入力"
                  className="pl-10 glass text-white placeholder:text-white/30 border-white/20 focus:border-white/40"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                パスワード
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="pl-10 glass text-white placeholder:text-white/30 border-white/20 focus:border-white/40"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button 
              type="submit"
              disabled={isLoading}
              size="lg" 
              className="w-full glass text-white hover:bg-white/20 text-base py-6 mt-6"
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>
        </div>
        
        <div className="mt-8 flex items-center gap-2 text-white/40 text-sm">
          <CloudRain className="w-4 h-4" />
          <span>雨の日も晴れの日も、あなたの作業をサポート</span>
        </div>
      </div>
    </div>
  );
}
