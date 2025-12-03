import { bgms, playlists, playlistItems, users, type BGMDb, type InsertBGMDb, type Playlist, type InsertPlaylist, type PlaylistItem, type User, type UpsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // BGM operations
  getBgm(id: number): Promise<BGMDb | undefined>;
  getAllBgms(): Promise<BGMDb[]>;
  createBgm(bgm: InsertBGMDb): Promise<BGMDb>;
  deleteBgm(id: number): Promise<boolean>;
  clearBgms(): Promise<void>;
  toggleFavorite(id: number): Promise<BGMDb | undefined>;
  getFavorites(): Promise<BGMDb[]>;
  updateBgmAudioUrl(id: number, audioUrl: string): Promise<BGMDb | undefined>;
  
  // Playlist operations
  getPlaylist(id: number): Promise<Playlist | undefined>;
  getAllPlaylists(): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: number, data: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;
  
  getPlaylistItems(playlistId: number): Promise<BGMDb[]>;
  addToPlaylist(playlistId: number, bgmId: number): Promise<PlaylistItem>;
  removeFromPlaylist(playlistId: number, bgmId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // BGM operations
  async getBgm(id: number): Promise<BGMDb | undefined> {
    const [bgm] = await db.select().from(bgms).where(eq(bgms.id, id));
    return bgm || undefined;
  }

  async getAllBgms(): Promise<BGMDb[]> {
    return db.select().from(bgms).orderBy(desc(bgms.createdAt));
  }

  async createBgm(insertBgm: InsertBGMDb): Promise<BGMDb> {
    const [bgm] = await db
      .insert(bgms)
      .values(insertBgm)
      .returning();
    return bgm;
  }

  async deleteBgm(id: number): Promise<boolean> {
    const result = await db.delete(bgms).where(eq(bgms.id, id)).returning();
    return result.length > 0;
  }

  async clearBgms(): Promise<void> {
    await db.delete(playlistItems);
    await db.delete(bgms);
  }

  async toggleFavorite(id: number): Promise<BGMDb | undefined> {
    const bgm = await this.getBgm(id);
    if (!bgm) return undefined;
    
    const [updated] = await db
      .update(bgms)
      .set({ isFavorite: !bgm.isFavorite })
      .where(eq(bgms.id, id))
      .returning();
    return updated;
  }

  async getFavorites(): Promise<BGMDb[]> {
    return db.select().from(bgms).where(eq(bgms.isFavorite, true)).orderBy(desc(bgms.createdAt));
  }

  async updateBgmAudioUrl(id: number, audioUrl: string): Promise<BGMDb | undefined> {
    const [updated] = await db
      .update(bgms)
      .set({ audioUrl })
      .where(eq(bgms.id, id))
      .returning();
    return updated;
  }

  async getPlaylist(id: number): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    return db.select().from(playlists).orderBy(desc(playlists.createdAt));
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const [playlist] = await db
      .insert(playlists)
      .values(insertPlaylist)
      .returning();
    return playlist;
  }

  async updatePlaylist(id: number, data: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const [playlist] = await db
      .update(playlists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(playlists.id, id))
      .returning();
    return playlist || undefined;
  }

  async deletePlaylist(id: number): Promise<boolean> {
    await db.delete(playlistItems).where(eq(playlistItems.playlistId, id));
    const result = await db.delete(playlists).where(eq(playlists.id, id)).returning();
    return result.length > 0;
  }

  async getPlaylistItems(playlistId: number): Promise<BGMDb[]> {
    const items = await db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId))
      .orderBy(playlistItems.position);
    
    const bgmIds = items.map(item => item.bgmId);
    if (bgmIds.length === 0) return [];
    
    const bgmList: BGMDb[] = [];
    for (const bgmId of bgmIds) {
      const [bgm] = await db.select().from(bgms).where(eq(bgms.id, bgmId));
      if (bgm) bgmList.push(bgm);
    }
    return bgmList;
  }

  async addToPlaylist(playlistId: number, bgmId: number): Promise<PlaylistItem> {
    const existingItems = await db
      .select()
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId));
    
    const position = existingItems.length;
    
    const [item] = await db
      .insert(playlistItems)
      .values({ playlistId, bgmId, position })
      .returning();
    return item;
  }

  async removeFromPlaylist(playlistId: number, bgmId: number): Promise<boolean> {
    const result = await db
      .delete(playlistItems)
      .where(
        and(
          eq(playlistItems.playlistId, playlistId),
          eq(playlistItems.bgmId, bgmId)
        )
      )
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
