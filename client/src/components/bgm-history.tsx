import { History, Play, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { BGM } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface BGMHistoryProps {
  history: BGM[];
  currentBgmId: number | null;
  onSelectBgm: (bgm: BGM) => void;
  onClearHistory: () => void;
  onDeleteBgm?: (id: number) => void;
}

export function BGMHistory({
  history,
  currentBgmId,
  onSelectBgm,
  onClearHistory,
  onDeleteBgm,
}: BGMHistoryProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="glass text-white/80 hover:text-white hover:bg-white/20"
          aria-label="BGM history"
          data-testid="button-bgm-history"
        >
          <History className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="glass-strong border-white/20 text-white w-80">
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-white">BGM History</SheetTitle>
          <SheetDescription className="text-white/70">
            Previously generated tracks
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {history.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm" data-testid="text-no-history">No BGM history yet</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-3 pr-4">
                  {history.map((bgm) => (
                    <div
                      key={bgm.id}
                      className={`relative p-4 rounded-xl glass transition-all duration-200 hover:bg-white/10 ${
                        currentBgmId === bgm.id
                          ? "ring-2 ring-white/30 bg-white/10"
                          : ""
                      }`}
                    >
                      <button
                        onClick={() => onSelectBgm(bgm)}
                        className="w-full text-left"
                        data-testid={`button-history-item-${bgm.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-white text-sm leading-tight pr-6">
                            {bgm.title}
                          </h3>
                          {currentBgmId === bgm.id && (
                            <Badge className="glass text-white/80 text-xs shrink-0">
                              <Play className="w-2 h-2 mr-1" />
                              Now
                            </Badge>
                          )}
                        </div>
                        <p className="text-white/60 text-xs mb-2 line-clamp-2">
                          {bgm.mood}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="glass text-white/70 text-xs">
                            {bgm.genre}
                          </Badge>
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(bgm.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </button>
                      {onDeleteBgm && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 text-white/40 hover:text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteBgm(bgm.id);
                          }}
                          data-testid={`button-delete-bgm-${bgm.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-4 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearHistory}
                  className="w-full text-white/60 hover:text-white hover:bg-white/10 gap-2"
                  data-testid="button-clear-history"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear History
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
