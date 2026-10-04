export function winRate(wins: number, losses: number): number | null {
  const n = wins + losses;
  if (n <= 0) return null;
  return wins / n;
}

export function formatPercent(rate: number | null): string {
  if (rate === null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

export function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

/** Wilson score interval. The lower bound ranks lists; it is not a true win rate. */
export function wilsonInterval(wins: number, n: number, z = 1.96): { lower: number; upper: number } | null {
  if (n <= 0) return null;
  const p = wins / n;
  const z2 = z * z;
  const denominator = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return { lower: (centre - margin) / denominator, upper: (centre + margin) / denominator };
}

export function wilsonLower(wins: number, n: number, z = 1.96): number | null {
  return wilsonInterval(wins, n, z)?.lower ?? null;
}

export function kda(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(deaths, 1);
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function formatWhen(isoOrUnix: string | number | null): string {
  if (isoOrUnix === null || isoOrUnix === 0) return "—";
  const date = typeof isoOrUnix === "number" ? new Date(isoOrUnix * 1000) : new Date(isoOrUnix);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatFreshness(fetchedAt: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - fetchedAt) / 60000));
  if (minutes < 1) return "только что";
  if (minutes === 1) return "1 минуту назад";
  if (minutes < 5) return `${minutes} минуты назад`;
  return `${minutes} минут назад`;
}

const MEDALS: Record<number, string> = {
  1: "Herald",
  2: "Guardian",
  3: "Crusader",
  4: "Archon",
  5: "Legend",
  6: "Ancient",
  7: "Divine",
  8: "Immortal",
};

export function rankIcon(rankTier: number | null, place?: number | null): string | null {
  if (!rankTier) return null;
  const medal = Math.floor(rankTier / 10);
  if (medal < 1 || medal > 8) return null;
  if (medal < 8) return `/ranks/${medal}.png`;
  const rank = place != null && place > 0 ? place : 0;
  if (rank <= 0) return "/ranks/8x.png";
  if (rank <= 10) return "/ranks/8c.png";
  if (rank <= 100) return "/ranks/8b.png";
  if (rank <= 5000) return "/ranks/8a.png";
  return "/ranks/8.png";
}

export function rankStar(rankTier: number | null): string | null {
  if (!rankTier) return null;
  const medal = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  if (medal < 1 || medal > 7 || stars < 1 || stars > 7) return null;
  return `/ranks/pip${stars}.png`;
}

export function rankLabel(rankTier: number | null): string | null {
  if (!rankTier) return null;
  const medal = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  const name = MEDALS[medal];
  if (!name) return `unmapped rank code ${rankTier}`;
  if (medal === 8) return "Immortal";
  return stars > 0 ? `${name} ${stars}` : name;
}

export function gamesPhrase(n: number): string {
  const mod10 = Math.abs(n) % 10;
  const mod100 = Math.abs(n) % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "игра" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "игры" : "игр";
  return `${formatNumber(n)} ${word}`;
}

export function sampleMark(games: number): "low" | "early" | "enough" {
  if (games < 20) return "low";
  if (games < 50) return "early";
  return "enough";
}

export function playerWon(slot: number, radiantWin: boolean): boolean {
  return (slot < 128) === radiantWin;
}
