import { patchAt, preparePatches, type PatchRef } from "./evolution";
import { formatNumber, formatPercent, wilsonInterval, winRate } from "./stats";

export type DuoStatus = "none" | "inconclusive" | "above" | "below";

export type LayoutMatch = {
  startTime: number | null;
  won: boolean;
  heroA: string;
  heroB: string;
  imgA: string | null;
  imgB: string | null;
};

export type LayoutPair = {
  heroA: number;
  heroB: number;
  nameA: string;
  nameB: string;
  imgA: string | null;
  imgB: string | null;
  games: number;
  wins: number;
  wilson: number | null;
};

export type LayoutLane = {
  labelA: string;
  labelB: string;
  games: number;
  wins: number;
};

export function synergyStatusLabel(status: DuoStatus, n: number): string {
  if (status === "none") return "оценки нет";
  if (status === "above") return "Выше ожидания";
  if (status === "below") return "Ниже ожидания";
  if (n < 30) return "Невывод";
  return "Невывод. Интервал пересекает ожидание.";
}

export function pointsPhrase(delta: number | null): string {
  if (delta === null || !Number.isFinite(delta)) return "—";
  const points = delta * 100;
  const sign = points > 0 ? "+" : "";
  return `${sign}${points.toFixed(1)} п.п.`;
}

export type DuoCard = {
  key: string;
  title: string;
  n: number;
  winRate: number | null;
  wilson: number;
  patch: string;
  kind: string;
};

export function outcomeCards(pairs: LayoutPair[], lanes: LayoutLane[], patches: PatchColumn[]): DuoCard[] {
  const cards: DuoCard[] = [];
  for (const pair of pairs) {
    if (pair.games < 15 || pair.wilson === null) continue;
    cards.push({
      key: `hero-${pair.heroA}-${pair.heroB}`,
      title: `${pair.nameA} + ${pair.nameB}`,
      n: pair.games,
      winRate: winRate(pair.wins, pair.games - pair.wins),
      wilson: pair.wilson,
      patch: "все патчи окна",
      kind: "пара героев",
    });
  }
  for (const lane of lanes) {
    const lower = wilsonInterval(lane.wins, lane.games)?.lower;
    if (lane.games < 15 || lower === undefined) continue;
    cards.push({
      key: `lane-${lane.labelA}-${lane.labelB}`,
      title: `${lane.labelA} + ${lane.labelB}`,
      n: lane.games,
      winRate: winRate(lane.wins, lane.games - lane.wins),
      wilson: lower,
      patch: "все патчи окна",
      kind: "пара линий",
    });
  }
  for (const patch of patches) {
    const lower = wilsonInterval(patch.wins, patch.n)?.lower;
    if (patch.n < 15 || lower === undefined || patch.name === null) continue;
    cards.push({
      key: `patch-${patch.name}`,
      title: `Патч ${patch.name}`,
      n: patch.n,
      winRate: patch.winRate,
      wilson: lower,
      patch: patch.name,
      kind: "патч окна",
    });
  }
  return cards.sort((left, right) => right.wilson - left.wilson || right.n - left.n).slice(0, 6);
}

export type MatrixCell = {
  games: number;
  winRate: number | null;
  wilson: number | null;
  showRate: boolean;
  comparable: boolean;
};

export type MatrixAxis = { id: number; name: string; img: string | null };

export type DuoMatrix = {
  rows: MatrixAxis[];
  cols: MatrixAxis[];
  cells: MatrixCell[][];
  list: { nameA: string; nameB: string; imgA: string | null; imgB: string | null; cell: MatrixCell }[];
};

export function heroMatrix(pairs: LayoutPair[]): DuoMatrix {
  const rows = topHeroes(pairs, "a");
  const cols = topHeroes(pairs, "b");
  const found = new Map(pairs.map((pair) => [`${pair.heroA}:${pair.heroB}`, pair]));
  const cells = rows.map((row) =>
    cols.map((col) => {
      const pair = found.get(`${row.id}:${col.id}`);
      if (!pair) return { games: 0, winRate: null, wilson: null, showRate: false, comparable: false };
      return {
        games: pair.games,
        winRate: pair.games >= 5 ? winRate(pair.wins, pair.games - pair.wins) : null,
        wilson: pair.wilson,
        showRate: pair.games >= 5,
        comparable: pair.games >= 15,
      };
    }),
  );
  const list = rows.flatMap((row, rowIndex) =>
    cols.flatMap((col, colIndex) => {
      const cell = cells[rowIndex][colIndex];
      if (cell.games <= 0) return [];
      return [{ nameA: row.name, nameB: col.name, imgA: row.img, imgB: col.img, cell }];
    }),
  );
  list.sort((left, right) => (right.cell.wilson ?? -1) - (left.cell.wilson ?? -1) || right.cell.games - left.cell.games);
  return { rows, cols, cells, list };
}

function topHeroes(pairs: LayoutPair[], side: "a" | "b"): MatrixAxis[] {
  const totals = new Map<number, { name: string; img: string | null; games: number }>();
  for (const pair of pairs) {
    const id = side === "a" ? pair.heroA : pair.heroB;
    const name = side === "a" ? pair.nameA : pair.nameB;
    const img = side === "a" ? pair.imgA : pair.imgB;
    const cell = totals.get(id) ?? { name, img, games: 0 };
    cell.games += pair.games;
    totals.set(id, cell);
  }
  return [...totals.entries()]
    .sort((left, right) => right[1].games - left[1].games || left[0] - right[0])
    .slice(0, 5)
    .map(([id, cell]) => ({ id, name: cell.name, img: cell.img }));
}

export type PatchColumn = {
  name: string | null;
  n: number;
  wins: number;
  winRate: number | null;
};

export function patchColumns(matches: LayoutMatch[], patches: PatchRef[]): { columns: PatchColumn[]; patchesLoaded: boolean } {
  if (patches.length === 0) return { columns: [], patchesLoaded: false };
  const prepared = preparePatches(patches);
  const groups = new Map<string, PatchColumn>();
  for (const match of matches) {
    const patch = patchAt(match.startTime, prepared);
    const name = patch?.name ?? null;
    const key = name ?? "none";
    const cell = groups.get(key) ?? { name, n: 0, wins: 0, winRate: null };
    cell.n += 1;
    if (match.won) cell.wins += 1;
    cell.winRate = winRate(cell.wins, cell.n - cell.wins);
    groups.set(key, cell);
  }
  const columns = [...groups.values()].filter((column) => column.name !== null);
  columns.sort((left, right) => patchOrder(left.name, prepared) - patchOrder(right.name, prepared));
  return { columns, patchesLoaded: true };
}

function patchOrder(name: string | null, patches: ReturnType<typeof preparePatches>): number {
  return patches.find((patch) => patch.name === name)?.startMs ?? 0;
}

export type TenSlice = {
  n: number;
  winRate: number | null;
  patch: string | null;
  pair: string | null;
};

export type TenCompare = {
  enough: boolean;
  have: number;
  recent: TenSlice | null;
  previous: TenSlice | null;
  pairChanged: boolean;
};

export function tenCompare(matches: LayoutMatch[], patches: PatchRef[]): TenCompare {
  const ordered = [...matches].sort((left, right) => (right.startTime ?? 0) - (left.startTime ?? 0));
  if (ordered.length < 20) {
    return { enough: false, have: ordered.length, recent: ordered.length >= 10 ? sliceOf(ordered.slice(0, 10), patches) : null, previous: null, pairChanged: false };
  }
  const recent = sliceOf(ordered.slice(0, 10), patches);
  const previous = sliceOf(ordered.slice(10, 20), patches);
  return {
    enough: true,
    have: ordered.length,
    recent,
    previous,
    pairChanged: recent.pair !== null && previous.pair !== null && recent.pair !== previous.pair,
  };
}

function sliceOf(rows: LayoutMatch[], patches: PatchRef[]): TenSlice {
  const wins = rows.filter((row) => row.won).length;
  return {
    n: rows.length,
    winRate: winRate(wins, rows.length - wins),
    patch: modePatch(rows, patches),
    pair: modePair(rows),
  };
}

function modePatch(rows: LayoutMatch[], patches: PatchRef[]): string | null {
  const prepared = preparePatches(patches);
  const counts = new Map<string, number>();
  for (const row of rows) {
    const name = patchAt(row.startTime, prepared)?.name;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function modePair(rows: LayoutMatch[]): string | null {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(`${row.heroA} + ${row.heroB}`, (counts.get(`${row.heroA} + ${row.heroB}`) ?? 0) + 1);
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

export function duoCopyText(input: {
  nameA: string;
  nameB: string;
  same: number;
  winRate: number | null;
  score: number | null;
  status: string;
  topPair: string | null;
}): string {
  const pair = input.topPair ? ` Пара: ${input.topPair}.` : "";
  const score = input.score === null ? input.status : `${input.score.toFixed(1)} из 100. ${input.status}`;
  return `${input.nameA} и ${input.nameB}. Матчей одной команды: ${formatNumber(input.same)}. WR ${formatPercent(input.winRate)}. ${score}.${pair} Dota Analytics.`;
}
