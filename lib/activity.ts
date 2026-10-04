import type { ActivityMatch } from "@/lib/opendota";
import { playerWon } from "@/lib/stats";

export type ActivityDay = {
  key: number;
  games: number;
  wins: number;
  future: boolean;
};

export type ActivityWeek = {
  label: string | null;
  days: ActivityDay[];
};

const WEEKS = 14;

function localDay(unixSeconds: number): number {
  const date = new Date(unixSeconds * 1000);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildActivity(rows: ActivityMatch[], now = Date.now()): ActivityWeek[] {
  const buckets = new Map<number, { games: number; wins: number }>();
  for (const row of rows) {
    if (!Number.isFinite(row.start_time)) continue;
    const key = localDay(row.start_time);
    const cell = buckets.get(key) ?? { games: 0, wins: 0 };
    cell.games += 1;
    if (playerWon(row.player_slot, row.radiant_win)) cell.wins += 1;
    buckets.set(key, cell);
  }

  const todayDate = new Date(now);
  const today = Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  const sunday = new Date(today);
  sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
  const first = new Date(sunday);
  first.setUTCDate(first.getUTCDate() - (WEEKS - 1) * 7);

  const weeks: ActivityWeek[] = [];
  for (let week = 0; week < WEEKS; week += 1) {
    const days: ActivityDay[] = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(first);
      date.setUTCDate(first.getUTCDate() + week * 7 + day);
      const key = date.getTime();
      const cell = buckets.get(key) ?? { games: 0, wins: 0 };
      days.push({ key, games: cell.games, wins: cell.wins, future: key > today });
    }
    const firstOfMonth = days.find((day) => new Date(day.key).getUTCDate() === 1);
    const labelDay = firstOfMonth ?? (week === 0 ? days[0] : null);
    weeks.push({
      label: labelDay
        ? new Date(labelDay.key).toLocaleDateString("ru-RU", { month: "short", timeZone: "UTC" }).replace(".", "")
        : null,
      days,
    });
  }
  return weeks;
}
