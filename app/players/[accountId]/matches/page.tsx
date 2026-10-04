import Link from "next/link";
import { notFound } from "next/navigation";
import { HiddenHistory } from "@/components/HiddenHistory";
import { MatchFiltersForm } from "@/components/MatchFiltersForm";
import { MatchLine } from "@/components/MatchLine";
import { PlayerModes } from "@/components/PlayerModes";
import { gameModeLabel, lobbyLabel } from "@/lib/labels";
import {
  MATCH_PAGE_SIZE,
  duoRelation,
  matchListHref,
  parseMatchFilters,
  playerWonRow,
  relationLabel,
  significantFlag,
} from "@/lib/matches";
import { type HeroStat, type NamedConstant, type PatchConstant } from "@/lib/opendota";
import { historyClosed, loadPassport } from "@/lib/passport";
import { dota } from "@/lib/sources";
import { formatNumber } from "@/lib/stats";

export const dynamic = "force-dynamic";

function heroImg(path?: string) {
  return path ? `https://cdn.cloudflare.steamstatic.com${path}` : null;
}

export default async function MatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { accountId } = await params;
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const filters = parseMatchFilters(await searchParams);
  const [listR, playerR, heroesR, modesR, lobbiesR, patchesR, passportR] = await Promise.allSettled([
    dota.getPlayerMatches(id, {
      limit: MATCH_PAGE_SIZE,
      offset: filters.offset,
      patch: filters.patch,
      gameMode: filters.gameMode,
      lobbyType: filters.lobbyType,
      heroId: filters.heroId,
      laneRole: filters.laneRole,
      win: filters.win,
      isRadiant: filters.isRadiant,
      dateDays: filters.dateDays,
      includedAccountId: filters.includedAccountId,
      significant: significantFlag(filters),
    }),
    dota.getPlayer(id),
    dota.getHeroCatalog(),
    dota.getGameModes(),
    dota.getLobbyTypes(),
    dota.getPatches(),
    loadPassport(id),
  ]);

  if (listR.status === "rejected") throw listR.reason instanceof Error ? listR.reason : new Error("История матчей недоступна");

  const heroes = new Map<number, HeroStat>();
  if (heroesR.status === "fulfilled") {
    for (const hero of heroesR.value.data) heroes.set(hero.id, hero);
  }
  const modes = new Map<number, string>();
  if (modesR.status === "fulfilled") {
    for (const mode of Object.values(modesR.value.data) as NamedConstant[]) modes.set(mode.id, mode.name);
  }
  const lobbies = new Map<number, string>();
  if (lobbiesR.status === "fulfilled") {
    for (const lobby of Object.values(lobbiesR.value.data) as NamedConstant[]) lobbies.set(lobby.id, lobby.name);
  }
  const patches: PatchConstant[] = patchesR.status === "fulfilled" ? [...patchesR.value.data].sort((a, b) => b.id - a.id) : [];
  const persona = playerR.status === "fulfilled" ? playerR.value.data.profile?.personaname : null;
  const closed = passportR.status === "fulfilled" && historyClosed(passportR.value);
  const rows = listR.value.data;
  const from = rows.length ? filters.offset + 1 : 0;
  const to = filters.offset + rows.length;
  const heroOptions = [...heroes.values()].sort((a, b) => a.localized_name.localeCompare(b.localized_name, "ru"));

  return (
    <main className="sheet">
      <h1>{persona ?? "Матчи"}</h1>
      <PlayerModes accountId={id} current="matches" />
      {closed ? <HiddenHistory /> : null}
      {closed && rows.length === 0 ? null : (
        <p className="mode-note">
          Матчи — список игр этого игрока. В строке герой, счёт, длительность и победа или поражение. Пока не включено «включая Turbo», здесь обычные матчи. Фильтры оставляют патч, героя, линию или только победы.
        </p>
      )}

      {closed && rows.length === 0 ? null : (
      <details className="filters-drawer">
        <summary>Фильтры</summary>
      <MatchFiltersForm
        accountId={id}
        values={{
          patch: filters.patch === undefined ? "" : String(filters.patch),
          mode: filters.gameMode === undefined ? "" : String(filters.gameMode),
          lobby: filters.lobbyType === undefined ? "" : String(filters.lobbyType),
          hero: filters.heroId === undefined ? "" : String(filters.heroId),
          lane: filters.laneRole === undefined ? "" : String(filters.laneRole),
          result: filters.win === undefined ? "" : String(filters.win),
          side: filters.isRadiant === undefined ? "" : String(filters.isRadiant),
          days: filters.dateDays === undefined ? "" : String(filters.dateDays),
          with: filters.includedAccountId === undefined ? "" : String(filters.includedAccountId),
          broad: filters.broad,
        }}
        patches={patches.map((patch) => ({ value: String(patch.id), label: patch.name }))}
        modes={[...modes.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([modeId, name]) => ({ value: String(modeId), label: gameModeLabel(name) }))}
        lobbies={[...lobbies.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([lobbyId, name]) => ({ value: String(lobbyId), label: lobbyLabel(name) }))}
        heroes={heroOptions.map((hero) => ({ value: String(hero.id), label: hero.localized_name }))}
      />
      </details>
      )}

      {rows.length === 0 ? (
        closed ? null : <p className="empty">Матчей нет.</p>
      ) : (
        <div className="match-feed">
          {rows.map((row) => {
            const hero = row.hero_id ? heroes.get(row.hero_id) : undefined;
            const won = playerWonRow(row);
            const relation = filters.includedAccountId ? duoRelation(row.heroes, id, filters.includedAccountId) : null;
            return (
              <MatchLine
                key={row.match_id}
                href={`/matches/${row.match_id}?player=${id}`}
                img={heroImg(hero?.img)}
                hero={hero?.localized_name ?? "Герой"}
                won={won}
                kills={row.kills ?? 0}
                deaths={row.deaths ?? 0}
                assists={row.assists ?? 0}
                duration={row.duration}
                when={row.start_time ?? null}
                detail={[gameModeLabel(modes.get(row.game_mode)), relation ? relationLabel(relation) : null]
                  .filter(Boolean)
                  .join(" · ")}
              />
            );
          })}
        </div>
      )}

      {closed && rows.length === 0 ? null : (
      <p className="pager">
        {filters.offset > 0 ? (
          <Link href={matchListHref(id, filters, Math.max(0, filters.offset - MATCH_PAGE_SIZE))}>Назад</Link>
        ) : (
          <span className="muted">Назад</span>
        )}
        <span>
          {rows.length ? `${formatNumber(from)}–${formatNumber(to)}` : "пусто"}
        </span>
        {rows.length === MATCH_PAGE_SIZE ? (
          <Link href={matchListHref(id, filters, filters.offset + MATCH_PAGE_SIZE)}>Дальше</Link>
        ) : (
          <span className="muted">Дальше матчей в этом срезе нет</span>
        )}
      </p>
      )}
    </main>
  );
}
