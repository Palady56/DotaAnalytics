"use client";

import { useEffect } from "react";

export type RecentPlayer = { id: number; name: string; avatar: string | null };

const KEY = "passport-recent";

export function readRecent(): RecentPlayer[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentPlayer[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => Number.isInteger(row.id) && typeof row.name === "string").slice(0, 8);
  } catch {
    return [];
  }
}

export function rememberPlayer(player: RecentPlayer) {
  const next = [player, ...readRecent().filter((row) => row.id !== player.id)].slice(0, 8);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function RememberRecent({ id, name, avatar }: RecentPlayer) {
  useEffect(() => {
    rememberPlayer({ id, name, avatar });
  }, [id, name, avatar]);
  return null;
}
