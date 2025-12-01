import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="glass text-white/80 hover:text-white hover:bg-white/20"
          aria-label="Toggle theme"
          data-testid="button-theme-toggle"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="glass-strong border-white/20"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="text-white/80 hover:text-white hover:bg-white/10 gap-2 cursor-pointer"
          data-testid="menu-item-light"
        >
          <Sun className="w-4 h-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="text-white/80 hover:text-white hover:bg-white/10 gap-2 cursor-pointer"
          data-testid="menu-item-dark"
        >
          <Moon className="w-4 h-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="text-white/80 hover:text-white hover:bg-white/10 gap-2 cursor-pointer"
          data-testid="menu-item-system"
        >
          <Monitor className="w-4 h-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
