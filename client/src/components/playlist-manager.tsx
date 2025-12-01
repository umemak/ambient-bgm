import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ListMusic, Plus, Trash2, Heart, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BGM, Playlist } from "@shared/schema";

interface PlaylistManagerProps {
  currentBgmId: number | null;
  onSelectBgm?: (bgm: BGM) => void;
}

export function PlaylistManager({ currentBgmId, onSelectBgm }: PlaylistManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const playlistsQuery = useQuery<{ success: boolean; data: Playlist[] }>({
    queryKey: ["/api/playlists"],
    staleTime: 30000,
  });

  const favoritesQuery = useQuery<{ success: boolean; data: BGM[] }>({
    queryKey: ["/api/favorites"],
    staleTime: 30000,
  });

  const playlistItemsQuery = useQuery<{ success: boolean; data: BGM[] }>({
    queryKey: ["/api/playlists", selectedPlaylist?.id ?? 0, "items"],
    queryFn: async () => {
      if (!selectedPlaylist) return { success: true, data: [] };
      const res = await fetch(`/api/playlists/${selectedPlaylist.id}/items`);
      return res.json();
    },
    enabled: !!selectedPlaylist,
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/playlists", { name });
      return response as Playlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setIsCreateOpen(false);
      setNewPlaylistName("");
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/playlists/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setSelectedPlaylist(null);
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, bgmId }: { playlistId: number; bgmId: number }) => {
      await apiRequest("POST", `/api/playlists/${playlistId}/items/${bgmId}`);
      return { playlistId, bgmId };
    },
    onSuccess: ({ playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", playlistId, "items"] });
    },
  });

  const removeFromPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, bgmId }: { playlistId: number; bgmId: number }) => {
      await apiRequest("DELETE", `/api/playlists/${playlistId}/items/${bgmId}`);
      return { playlistId, bgmId };
    },
    onSuccess: ({ playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists", playlistId, "items"] });
    },
  });

  const playlists = playlistsQuery.data?.data ?? [];
  const favorites = favoritesQuery.data?.data ?? [];
  const playlistItems = playlistItemsQuery.data?.data ?? [];

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylistMutation.mutate(newPlaylistName.trim());
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="glass text-white/80 hover:text-white hover:bg-white/20"
          aria-label="Playlists"
          data-testid="button-playlists"
        >
          <ListMusic className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="glass-strong border-white/20 text-white w-80">
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-white">
            {selectedPlaylist ? selectedPlaylist.name : "Library"}
          </SheetTitle>
          <SheetDescription className="text-white/70">
            {selectedPlaylist ? "Playlist tracks" : "Your favorites and playlists"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {selectedPlaylist ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPlaylist(null)}
                className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
                data-testid="button-back-to-library"
              >
                <X className="w-4 h-4" />
                Back to Library
              </Button>

              {playlistItems.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <ListMusic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tracks in this playlist</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2 pr-4">
                    {playlistItems.map((bgm) => (
                      <div
                        key={bgm.id}
                        className={`flex items-center justify-between p-3 rounded-lg glass ${
                          currentBgmId === bgm.id ? "ring-1 ring-white/30 bg-white/10" : ""
                        }`}
                      >
                        <button
                          onClick={() => onSelectBgm?.(bgm)}
                          className="flex-1 text-left"
                          data-testid={`button-playlist-item-${bgm.id}`}
                        >
                          <h4 className="text-sm font-medium text-white truncate">
                            {bgm.title}
                          </h4>
                          <p className="text-xs text-white/60">{bgm.genre}</p>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/20"
                          onClick={() => removeFromPlaylistMutation.mutate({
                            playlistId: selectedPlaylist.id,
                            bgmId: bgm.id,
                          })}
                          data-testid={`button-remove-from-playlist-${bgm.id}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePlaylistMutation.mutate(selectedPlaylist.id)}
                  className="w-full text-red-400/80 hover:text-red-400 hover:bg-red-400/10 gap-2"
                  data-testid="button-delete-playlist"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Playlist
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Favorites ({favorites.length})
                </h3>
                {favorites.length === 0 ? (
                  <p className="text-sm text-white/50 text-center py-4">
                    No favorites yet
                  </p>
                ) : (
                  <ScrollArea className="h-40">
                    <div className="space-y-2 pr-4">
                      {favorites.map((bgm) => (
                        <button
                          key={bgm.id}
                          onClick={() => onSelectBgm?.(bgm)}
                          className={`w-full text-left p-3 rounded-lg glass hover:bg-white/10 ${
                            currentBgmId === bgm.id ? "ring-1 ring-white/30 bg-white/10" : ""
                          }`}
                          data-testid={`button-favorite-${bgm.id}`}
                        >
                          <h4 className="text-sm font-medium text-white truncate">
                            {bgm.title}
                          </h4>
                          <p className="text-xs text-white/60">{bgm.genre}</p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
                    <ListMusic className="w-4 h-4" />
                    Playlists ({playlists.length})
                  </h3>
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/20"
                        data-testid="button-create-playlist"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-strong border-white/20 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create Playlist</DialogTitle>
                        <DialogDescription className="text-white/70">
                          Give your playlist a name
                        </DialogDescription>
                      </DialogHeader>
                      <Input
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="Playlist name"
                        className="glass border-white/20 text-white placeholder:text-white/40"
                        data-testid="input-playlist-name"
                      />
                      <DialogFooter>
                        <Button
                          onClick={handleCreatePlaylist}
                          disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
                          className="glass bg-white/20 hover:bg-white/30 text-white"
                          data-testid="button-confirm-create-playlist"
                        >
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {playlists.length === 0 ? (
                  <p className="text-sm text-white/50 text-center py-4">
                    No playlists yet
                  </p>
                ) : (
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                      {playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          onClick={() => setSelectedPlaylist(playlist)}
                          className="w-full flex items-center justify-between p-3 rounded-lg glass hover:bg-white/10"
                          data-testid={`button-playlist-${playlist.id}`}
                        >
                          <div className="text-left">
                            <h4 className="text-sm font-medium text-white">
                              {playlist.name}
                            </h4>
                            {playlist.description && (
                              <p className="text-xs text-white/60 truncate">
                                {playlist.description}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/40" />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {currentBgmId && playlists.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-xs font-medium text-white/60 mb-2">
                    Add current track to playlist:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {playlists.map((playlist) => (
                      <Badge
                        key={playlist.id}
                        variant="secondary"
                        className="glass text-white/80 cursor-pointer hover:bg-white/20"
                        onClick={() => addToPlaylistMutation.mutate({
                          playlistId: playlist.id,
                          bgmId: currentBgmId,
                        })}
                        data-testid={`badge-add-to-playlist-${playlist.id}`}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {playlist.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
