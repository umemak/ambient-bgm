import type { BGM, InsertBGM } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getBgm(id: string): Promise<BGM | undefined>;
  getAllBgms(): Promise<BGM[]>;
  createBgm(bgm: InsertBGM): Promise<BGM>;
  deleteBgm(id: string): Promise<boolean>;
  clearBgms(): Promise<void>;
}

export class MemStorage implements IStorage {
  private bgms: Map<string, BGM>;

  constructor() {
    this.bgms = new Map();
  }

  async getBgm(id: string): Promise<BGM | undefined> {
    return this.bgms.get(id);
  }

  async getAllBgms(): Promise<BGM[]> {
    return Array.from(this.bgms.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createBgm(insertBgm: InsertBGM): Promise<BGM> {
    const id = randomUUID();
    const bgm: BGM = {
      ...insertBgm,
      id,
      createdAt: new Date().toISOString(),
    };
    this.bgms.set(id, bgm);
    return bgm;
  }

  async deleteBgm(id: string): Promise<boolean> {
    return this.bgms.delete(id);
  }

  async clearBgms(): Promise<void> {
    this.bgms.clear();
  }
}

export const storage = new MemStorage();
