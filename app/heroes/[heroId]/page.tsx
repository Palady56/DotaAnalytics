import Link from "next/link";
import { notFound } from "next/navigation";
import { SliceLinks } from "@/components/SliceLinks";
import { Sparkline } from "@/components/Sparkline";
import {
  META_MIN_SAMPLE,
  SLICES,
  attrLabel,
  buildMeta,
  heroHref,
  metaHref,
  parseSlice,
  presentMatchups,
  playPosition,
  presentUsedItems,
  sliceMedal,
  type PresentedMatchup,
  type SliceId,
} from "@/lib/meta";
import { dota } from "@/lib/sources";
import { formatNumber, formatPercent, sampleMark, winRate } from "@/lib/stats";

export const dynamic = "force-dynamic";

const BRACKETS: SliceId[] = ["1", "2", "3", "4", "5", "6", "7", "8"];

function MatchupList({ title, rows }: { title: string; rows: PresentedMatchup[] }) {
  return (
    <section>
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="empty">Мало игр.</p>
      ) : (
        <div className="match-feed">
          {rows.map((opponent) => (
            <Link key={opponent.heroId} className="match-line versus" href={`/heroes/${opponent.heroId}`}>
              {opponent.img ? <img src={opponent.img} alt="" /> : <span className="portrait-fallback" />}
              <span className="match-main">
                <b>{opponent.name}</b>
                <span className="muted">{formatNumber(opponent.games)} игр</span>
              </span>
              <span className={(opponent.winRate ?? 0) >= 0.5 ? "match-kda win" : "match-kda loss"}>
                {formatPercent(opponent.winRate)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function HeroPage({
  params,
  searchParams,
}: {
  params: Promise<{ heroId: string }>;
  searchParams: Promise<{ slice?: string; player?: string }>;
}) {
  const { heroId } = await params;
  const query = await searchParams;
  if (!/^\d+$/.test(heroId)) notFound();
  const id = Number(heroId);
  const slice = parseSlice(query.slice);
  const playerId = query.player && /^\d+$/.test(query.player) ? Number(query.player) : null;

  const catalogR = await dota.getHeroCatalog().catch((error: unknown) => {
    throw error instanceof Error ? error : new Error("heroStats недоступен");
  });
  const hero = catalogR.data.find((item) => item.id === id);
  if (!hero) {
    return (
      <main className="sheet">
        <h1>Такого героя в каталоге нет</h1>
        <p className="empty">id {id} нет в текущем ответе heroStats. Чужие цифры вместо пустого каталога не подставляются.</p>
        <p>
          <Link href="/meta">К мете</Link>
        </p>
      </main>
    );
  }

  const rows = buildMeta(catalogR.data, slice);
  const row = rows.find((item) => item.id === id);
  if (!row) notFound();
  const bracketRows = BRACKETS.map((bracket) => buildMeta([hero], bracket)[0]);
  const names = new Map(
    catalogR.data.map((item) => [
      item.id,
      {
        name: item.localized_name,
        img: item.img ? `https://cdn.cloudflare.steamstatic.com${item.img}` : null,
      },
    ]),
  );
  const [matchups, itemsR, timingsR] = await Promise.all([
    dota.getHeroMatchups(id).then(
      (result) => presentMatchups(result.data, names),
      () => null,
    ),
    dota.getItems().catch(() => null),
    dota.getHeroItemTimings(id).catch(() => null),
  ]);
  const usedItems = timingsR ? presentUsedItems(timingsR.data, itemsR?.data ?? null) : null;
  const usedMax = usedItems?.reduce((max, item) => Math.max(max, item.games), 0) ?? 0;
  const solid = matchups ? matchups.rows.filter((row) => row.games >= META_MIN_SAMPLE && row.winRate != null) : [];
  const best = [...solid].sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0) || b.games - a.games).slice(0, 8);
  const bestIds = new Set(best.map((row) => row.heroId));
  const worst = [...solid]
    .sort((a, b) => (a.winRate ?? 0) - (b.winRate ?? 0) || b.games - a.games)
    .filter((row) => !bestIds.has(row.heroId))
    .slice(0, 8);

  let playerBlock: { name: string; games: number; wins: number; winRate: number | null; sample: ReturnType<typeof sampleMark> } | { error: string } | null = null;
  if (playerId) {
    try {
      const [player, heroes] = await Promise.all([dota.getPlayer(playerId), dota.getPlayerHeroes(playerId)]);
      const played = heroes.data.find((item) => item.hero_id === id);
      playerBlock = {
        name: player.data.profile?.personaname || `account ${playerId}`,
        games: played?.games ?? 0,
        wins: played?.win ?? 0,
        winRate: played ? winRate(played.win, Math.max(played.games - played.win, 0)) : null,
        sample: sampleMark(played?.games ?? 0),
      };
    } catch (error) {
      playerBlock = { error: error instanceof Error ? error.message : "Игры игрока на этом герое не загрузились." };
    }
  }

  return (
    <main className="sheet">
      <p className="muted">
        <Link href={metaHref(slice, "winning")}>Все герои</Link>
      </p>
      <div className="player-hero">
        {row.img ? <img className="player-avatar" src={row.img} alt="" /> : <span className="avatar-fallback" />}
        <div>
          <h1>{row.name}</h1>
          <p className="muted">
            {attrLabel(hero.primary_attr)}
            {playPosition(hero.roles ?? []) ? ` · ${playPosition(hero.roles ?? [])}` : ""}
          </p>
          <SliceLinks current={slice} hrefFor={(item) => heroHref(id, item)} />
        </div>
      </div>

      {row.picks === 0 ? (
        <p className="empty">На этом герое в выбранных играх пусто.</p>
      ) : (
        <section className="board">
          <article className="stat-tile">
            <span>Игры</span>
            <strong>{formatNumber(row.picks)}</strong>
            <span className="muted">{formatPercent(row.pickShare)} всех пиков</span>
            <div className="meter games">
              <i style={{ width: `${Math.round((row.pickShare ?? 0) * 100)}%` }} />
            </div>
          </article>
          <article className="stat-tile">
            <span>Винрейт</span>
            <strong className={(row.winRate ?? 0) >= 0.5 ? "win" : "loss"}>{formatPercent(row.winRate)}</strong>
            <span className="muted">{formatNumber(row.wins)} побед</span>
            <div className="meter">
              <i style={{ width: `${Math.round((row.winRate ?? 0) * 100)}%` }} />
            </div>
          </article>
          <article className="stat-tile">
            <span>Место</span>
            <strong>{row.rank ?? "—"}</strong>
            <span className="muted">{row.picks < META_MIN_SAMPLE ? "мало игр" : "в топе"}</span>
            <Sparkline points={row.trend} />
          </article>
        </section>
      )}

      {slice === "pro" ? <p className="muted">Баны в профессиональных матчах: {formatNumber(row.bans)}</p> : null}

      <section className="block">
        <div className="section-head">
          <h2>Частые предметы</h2>
          <span className="muted">Разобранные игры, не за неделю</span>
        </div>
        {usedItems == null ? (
          <p className="empty">Список предметов сейчас не загрузился.</p>
        ) : usedItems.length === 0 ? (
          <p className="empty">Предметов нет.</p>
        ) : (
          <div className="item-table">
            <div className="item-head">
              <span>Предмет</span>
              <span />
              <span>Винрейт</span>
              <span>Матчи</span>
              <span>Победы</span>
            </div>
            {usedItems.map((item) => {
              const rate = winRate(item.wins, item.games - item.wins);
              const share = usedMax > 0 ? (item.games / usedMax) * 100 : 0;
              const winPart = item.games > 0 ? (item.wins / item.games) * 100 : 0;
              return (
                <div className="item-row" key={item.key}>
                  <span className="item-name">
                    {item.img ? <img src={item.img} alt="" /> : <span className="item-empty" />}
                    <b>{item.name}</b>
                  </span>
                  <span className="item-track">
                    <span className="item-meter" style={{ width: `${Math.max(share, 4)}%` }}>
                      <i className="win" style={{ width: `${winPart}%` }} />
                      <i className="loss" style={{ width: `${100 - winPart}%` }} />
                    </span>
                  </span>
                  <span className={rate != null && rate >= 0.5 ? "item-num win" : "item-num loss"}>{formatPercent(rate)}</span>
                  <span className="item-num item-matches">{formatNumber(item.games)}</span>
                  <span className="item-num item-wins">{formatNumber(item.wins)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="block">
        <div className="section-head">
          <h2>Против кого</h2>
          <span className="muted">За всё время</span>
        </div>
        {matchups == null ? (
          <p className="empty">Список соперников сейчас не загрузился.</p>
        ) : best.length === 0 ? (
          <p className="empty">Мало игр, чтобы сравнить соперников.</p>
        ) : (
          <div className="grid-2">
            <MatchupList title="Сильнее против" rows={best} />
            <MatchupList title="Слабее против" rows={worst} />
          </div>
        )}
      </section>

      <section className="block">
        <h2>По рангам</h2>
        <div className="hero-board">
          {bracketRows.map((bracket, index) => {
            const medal = sliceMedal(BRACKETS[index]);
            const label = SLICES.find((item) => item.id === BRACKETS[index])?.label ?? "";
            return (
              <Link key={BRACKETS[index]} className="hero-tile" href={heroHref(id, BRACKETS[index])}>
                {medal ? <img className="rank-medal" src={medal} alt={label} /> : <b>{label}</b>}
                <span className={(bracket.winRate ?? 0) >= 0.5 ? "win" : "loss"}>{formatPercent(bracket.winRate)}</span>
                <span className="muted">{formatNumber(bracket.picks)} игр</span>
              </Link>
            );
          })}
        </div>
      </section>

      {playerBlock && "error" in playerBlock ? <p className="empty">Игры этого игрока на герое не загрузились.</p> : null}
      {playerBlock && !("error" in playerBlock) ? (
        <section className="block">
          <div className="section-head">
            <h2>{playerBlock.name}</h2>
            <Link href={`/players/${playerId}`}>Обзор</Link>
          </div>
          <section className="board">
            <article className="stat-tile">
              <span>Игры</span>
              <strong>{formatNumber(playerBlock.games)}</strong>
            </article>
            <article className="stat-tile">
              <span>Винрейт</span>
              <strong className={(playerBlock.winRate ?? 0) >= 0.5 ? "win" : "loss"}>{formatPercent(playerBlock.winRate)}</strong>
              <span className="muted">{formatNumber(playerBlock.wins)} побед</span>
            </article>
          </section>
        </section>
      ) : null}
    </main>
  );
}
