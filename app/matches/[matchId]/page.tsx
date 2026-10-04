import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvantageChart } from "@/components/AdvantageChart";
import { gameModeLabel, laneRoleLabel, lobbyLabel, regionLabel } from "@/lib/labels";
import { draftSide, inventory, readParty, standingTowers } from "@/lib/matches";
import { type HeroStat, type ItemConstant, type MatchPlayer, type NamedConstant } from "@/lib/opendota";
import { dota } from "@/lib/sources";
import { formatDuration, formatNumber, formatWhen, rankIcon } from "@/lib/stats";

export const dynamic = "force-dynamic";

function cdn(path?: string | null) {
  return path ? `https://cdn.cloudflare.steamstatic.com${path}` : null;
}

function ItemIcon({ id, items, neutral }: { id: number; items: Map<number, ItemConstant>; neutral?: boolean }) {
  const item = items.get(id);
  const img = cdn(item?.img);
  if (!img) return <span className={neutral ? "item-empty neutral" : "item-empty"} title={item?.dname} />;
  return <img className={neutral ? "neutral" : undefined} src={img} alt={item?.dname ?? ""} title={item?.dname ?? ""} />;
}

function Slots({ player, items }: { player: MatchPlayer; items: Map<number, ItemConstant> }) {
  const bag = inventory(player);
  return (
    <span className="items">
      {bag.slots.map((id, index) =>
        id > 0 ? <ItemIcon key={index} id={id} items={items} /> : <span key={index} className="item-empty" />,
      )}
      {bag.neutral ? <ItemIcon id={bag.neutral} items={items} neutral /> : null}
    </span>
  );
}

function sum(players: MatchPlayer[], key: keyof MatchPlayer): number {
  return players.reduce((total, player) => total + (typeof player[key] === "number" ? (player[key] as number) : 0), 0);
}

function RosterRow({
  player,
  heroes,
  items,
  focus,
}: {
  player: MatchPlayer;
  heroes: Map<number, HeroStat>;
  items: Map<number, ItemConstant>;
  focus: boolean;
}) {
  const hero = player.hero_id ? heroes.get(player.hero_id) : undefined;
  const img = cdn(hero?.img);
  const medal = rankIcon(player.rank_tier ?? null);
  const anonymous = player.account_id == null;
  return (
    <article className={focus ? "roster-row focus" : "roster-row"}>
      <span className="face">
        {img ? <img src={img} alt="" /> : <span className="portrait-fallback" />}
        {player.level != null ? <i>{formatNumber(player.level)}</i> : null}
      </span>
      <span className="roster-name">
        <b>
          {hero?.localized_name ?? "Герой"}
          {medal ? <img className="tiny-medal" src={medal} alt="" /> : null}
        </b>
        {anonymous ? (
          <span className="muted">скрыт</span>
        ) : (
          <Link href={`/players/${player.account_id}`}>{player.personaname || "Игрок"}</Link>
        )}
        <span className="muted">
          {formatNumber(player.gold_per_min)} золота · {formatNumber(player.xp_per_min)} опыта · урон {formatNumber(player.hero_damage)} · строения{" "}
          {formatNumber(player.tower_damage)} · лечение {formatNumber(player.hero_healing)}
          {player.lane_role ? ` · ${laneRoleLabel(player.lane_role)}` : ""}
        </span>
      </span>
      <span className="roster-kda">
        {formatNumber(player.kills)}
        <span className="muted"> / {formatNumber(player.deaths)} / {formatNumber(player.assists)}</span>
      </span>
      <span className="roster-net">
        <b>{formatNumber(player.net_worth)}</b>
        <span className="muted">
          {formatNumber(player.last_hits)} / {formatNumber(player.denies)}
        </span>
      </span>
      <Slots player={player} items={items} />
    </article>
  );
}

function Team({
  title,
  won,
  score,
  players,
  heroes,
  items,
  focusId,
  side,
}: {
  title: string;
  won: boolean | null;
  score: number | null | undefined;
  players: MatchPlayer[];
  heroes: Map<number, HeroStat>;
  items: Map<number, ItemConstant>;
  focusId: number | null;
  side: "radiant" | "dire";
}) {
  const outcome = won === true ? "win" : won === false ? "loss" : "";
  return (
    <section className={`roster ${side}`}>
      <header className="roster-head">
        <h2 className={outcome ? `side-title ${outcome}` : "side-title"}>
          {title} {score == null ? "" : formatNumber(score)}
        </h2>
        <p className="muted">
          {formatNumber(sum(players, "kills"))} / {formatNumber(sum(players, "deaths"))} / {formatNumber(sum(players, "assists"))}
          {" · "}
          {formatNumber(sum(players, "net_worth"))} ценности
        </p>
      </header>
      {players.map((player) => (
        <RosterRow
          key={player.player_slot}
          player={player}
          heroes={heroes}
          items={items}
          focus={focusId != null && player.account_id === focusId}
        />
      ))}
    </section>
  );
}

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ player?: string }>;
}) {
  const { matchId } = await params;
  const query = await searchParams;
  if (!/^\d+$/.test(matchId)) notFound();
  const id = Number(matchId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const focusId = query.player && /^\d+$/.test(query.player) ? Number(query.player) : null;

  const [matchR, heroesR, itemsR, modesR, lobbiesR, patchesR, regionsR] = await Promise.allSettled([
    dota.getMatch(id),
    dota.getHeroCatalog(),
    dota.getItems(),
    dota.getGameModes(),
    dota.getLobbyTypes(),
    dota.getPatches(),
    dota.getRegions(),
  ]);
  if (matchR.status === "rejected") throw matchR.reason instanceof Error ? matchR.reason : new Error("Матч недоступен");

  const match = matchR.value.data;
  if (!match || match.match_id == null) throw new Error("Матч не загрузился.");

  const heroes = new Map<number, HeroStat>();
  if (heroesR.status === "fulfilled") {
    for (const hero of heroesR.value.data) heroes.set(hero.id, hero);
  }
  const items = new Map<number, ItemConstant>();
  if (itemsR.status === "fulfilled") {
    for (const item of Object.values(itemsR.value.data)) {
      if (item?.id) items.set(item.id, item);
    }
  }
  const modes = new Map<number, string>();
  if (modesR.status === "fulfilled") {
    for (const mode of Object.values(modesR.value.data) as NamedConstant[]) modes.set(mode.id, mode.name);
  }
  const lobbies = new Map<number, string>();
  if (lobbiesR.status === "fulfilled") {
    for (const lobby of Object.values(lobbiesR.value.data) as NamedConstant[]) lobbies.set(lobby.id, lobby.name);
  }
  const patch = patchesR.status === "fulfilled" ? patchesR.value.data.find((entry) => entry.id === match.patch) : undefined;
  const regionName =
    regionsR.status === "fulfilled" && match.region != null ? regionsR.value.data[String(match.region)] : undefined;

  const players = match.players ?? [];
  const radiant = players.filter((player) => player.player_slot < 128).sort((a, b) => a.player_slot - b.player_slot);
  const dire = players.filter((player) => player.player_slot >= 128).sort((a, b) => a.player_slot - b.player_slot);
  const picks = match.picks_bans?.length ? [...match.picks_bans].sort((a, b) => (a.order ?? a.ord ?? 0) - (b.order ?? b.ord ?? 0)) : [];
  const radiantHeroes = new Set(radiant.map((player) => player.hero_id).filter((hero): hero is number => typeof hero === "number"));
  const direHeroes = new Set(dire.map((player) => player.hero_id).filter((hero): hero is number => typeof hero === "number"));
  const party = readParty(players);
  const radiantTowers = standingTowers(match.tower_status_radiant);
  const direTowers = standingTowers(match.tower_status_dire);
  const gold = Array.isArray(match.radiant_gold_adv) ? match.radiant_gold_adv : [];
  const xp = Array.isArray(match.radiant_xp_adv) ? match.radiant_xp_adv : [];
  const winner = match.radiant_win ? "Победа Radiant" : match.radiant_win === false ? "Победа Dire" : "Матч";

  return (
    <main className="sheet">
      <p className="muted">
        {focusId ? <Link href={`/players/${focusId}/matches`}>Матчи</Link> : <Link href="/">Поиск</Link>}
        {" · "}
        {match.match_id}
      </p>
      <h1>{winner}</h1>
      <p className="lead score-line">
        <b>
          {formatNumber(match.radiant_score)}–{formatNumber(match.dire_score)}
        </b>
        <span>
          {formatDuration(match.duration ?? null)} · {formatWhen(match.start_time ?? null)}
        </span>
      </p>
      {matchR.value.stale ? <p className="muted">Показаны сохранённые цифры.</p> : null}
      <p className="chips">
        <span className="chip">{gameModeLabel(match.game_mode == null ? undefined : modes.get(match.game_mode))}</span>
        <span className="chip">{lobbyLabel(match.lobby_type == null ? undefined : lobbies.get(match.lobby_type))}</span>
        {patch ? <span className="chip">патч {patch.name}</span> : null}
        {regionName ? <span className="chip">{regionLabel(regionName)}</span> : null}
        {match.first_blood_time != null && match.first_blood_time > 0 ? (
          <span className="chip">первая кровь {formatDuration(match.first_blood_time)}</span>
        ) : null}
        {radiantTowers != null && direTowers != null ? (
          <span className="chip">
            башни живы {radiantTowers}–{direTowers}
          </span>
        ) : null}
      </p>

      <Team
        title="Radiant"
        side="radiant"
        won={match.radiant_win === true ? true : match.radiant_win === false ? false : null}
        score={match.radiant_score}
        players={radiant}
        heroes={heroes}
        items={items}
        focusId={focusId}
      />
      <Team
        title="Dire"
        side="dire"
        won={match.radiant_win === false ? true : match.radiant_win === true ? false : null}
        score={match.dire_score}
        players={dire}
        heroes={heroes}
        items={items}
        focusId={focusId}
      />
      {players.length === 0 ? <p className="empty">Игроков в матче нет.</p> : null}
      {players.length > 0 && players.length < 10 ? <p className="muted">В карточке не все десять игроков.</p> : null}

      {gold.length >= 2 || xp.length >= 2 ? (
        <section className="block">
          <h2>Преимущество Radiant</h2>
          <div className="advantage-grid">
            <AdvantageChart title="Золото" series={gold} color="#e2b657" />
            <AdvantageChart title="Опыт" series={xp} color="#8eb4ff" />
          </div>
          <p className="muted">Линия выше нуля — Radiant впереди.</p>
        </section>
      ) : null}

      {picks.length > 0 ? (
        <section className="block">
          <h2>Драфт</h2>
          <div className="draft-board">
            {picks.map((pick, index) => {
              const hero = pick.hero_id ? heroes.get(pick.hero_id) : undefined;
              const img = cdn(hero?.img);
              const side = pick.team == null ? "" : draftSide(pick.team, picks, radiantHeroes, direHeroes);
              return img ? (
                <img
                  key={`${pick.order ?? pick.ord ?? index}-${pick.hero_id ?? "x"}`}
                  className={pick.is_pick ? undefined : "ban"}
                  src={img}
                  alt=""
                  title={`${pick.is_pick ? "Пик" : "Бан"}${side ? ` · ${side}` : ""} · ${hero?.localized_name ?? "Герой"}`}
                />
              ) : (
                <span key={`${pick.order ?? index}-empty`} className="portrait-fallback" />
              );
            })}
          </div>
        </section>
      ) : null}

      {party.groups.length > 0 ? (
        <section className="block">
          <h2>В одной группе</h2>
          {party.groups.map((group) => (
            <p key={group.partyId}>{group.names.join(", ")}</p>
          ))}
        </section>
      ) : null}
    </main>
  );
}
