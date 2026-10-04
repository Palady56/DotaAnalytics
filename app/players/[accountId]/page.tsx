import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { HiddenHistory } from "@/components/HiddenHistory";
import { LifetimeBoard } from "@/components/LifetimeBoard";
import { PlayerModes } from "@/components/PlayerModes";
import { RankedMatches, type FeedMatch } from "@/components/RankedMatches";
import { RankMedal } from "@/components/RankMedal";
import { RememberRecent } from "@/components/RememberRecent";
import { ShareProfile, type ProfileCard } from "@/components/ShareProfile";
import { namedLane } from "@/lib/compare-categories";
import { getSession } from "@/lib/current-session";
import { TURBO_MODE } from "@/lib/matches";
import { type HeroStat, type PlayerMatchRow } from "@/lib/opendota";
import { historyClosed, loadPassport, sortHeroes, type CountRow, type Passport } from "@/lib/passport";
import { dota } from "@/lib/sources";
import { passportBlurb } from "@/lib/share";
import {
  formatDecimal,
  formatDuration,
  formatNumber,
  formatPercent,
  gamesPhrase,
  playerWon,
  rankLabel,
} from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string }>;
}): Promise<Metadata> {
  const { accountId } = await params;
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id <= 0) return { title: "Профиль" };
  const passport = await loadPassport(id);
  const description = passportBlurb(passport);
  const title = `${passport.profile.persona} — профиль`;
  return { title, description, openGraph: { title, description } };
}

function Failed(_section?: { section?: { message: string } }) {
  return <p className="empty">Сейчас не загрузилось.</p>;
}

function rankedFeed(rows: PlayerMatchRow[], catalog: Map<number, HeroStat>): FeedMatch[] {
  return rows
    .filter((row) => row.hero_id && row.match_id && (row.lobby_type === 7 || row.game_mode === TURBO_MODE))
    .map((row) => {
      const meta = catalog.get(row.hero_id as number);
      return {
        matchId: row.match_id,
        hero: meta?.localized_name ?? "Герой",
        img: meta?.img ? `https://cdn.cloudflare.steamstatic.com${meta.img}` : null,
        won: playerWon(row.player_slot, row.radiant_win),
        kills: row.kills ?? 0,
        deaths: row.deaths ?? 0,
        assists: row.assists ?? 0,
        duration: row.duration,
        startTime: row.start_time ?? 0,
        turbo: row.game_mode === TURBO_MODE,
      };
    });
}

function Bars({ rows, excludeUnknown }: { rows: CountRow[]; excludeUnknown?: boolean }) {
  const shown = excludeUnknown ? rows.filter((row) => row.id !== 0) : rows;
  const unknown = excludeUnknown ? rows.find((row) => row.id === 0) : undefined;
  const max = Math.max(...shown.map((row) => row.games), 1);
  return (
    <>
      <div className="bars">
        {shown.map((row) => (
          <div className="bar" key={row.id}>
            <span>{row.label}</span>
            <span className="track">
              <i style={{ width: `${(row.games / max) * 100}%` }} />
            </span>
            <span>
              {formatNumber(row.games)} · {formatPercent(row.winRate)}
            </span>
          </div>
        ))}
      </div>
      {unknown ? (
        <p className="muted">
          Ещё {formatNumber(unknown.games)} игр без линии.
        </p>
      ) : null}
    </>
  );
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ heroes?: string; refreshed?: string; wait?: string }>;
}) {
  const { accountId } = await params;
  const query = await searchParams;
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const [passport, session, rankedR, turboR, catalogR, activityR] = await Promise.all([
    loadPassport(id),
    getSession(),
    dota.getPlayerMatches(id, { limit: 30, offset: 0, lobbyType: 7, significant: 0 }).catch(() => null),
    dota.getPlayerMatches(id, { limit: 20, offset: 0, gameMode: TURBO_MODE, significant: 0 }).catch(() => null),
    dota.getHeroCatalog().catch(() => null),
    dota.getPlayerActivity(id).catch(() => null),
  ]);
  const catalog = new Map<number, HeroStat>();
  if (catalogR) {
    for (const hero of catalogR.data) catalog.set(hero.id, hero);
  }
  const merged = new Map<number, FeedMatch>();
  if (rankedR) {
    for (const match of rankedFeed(rankedR.data, catalog)) merged.set(match.matchId, match);
  }
  if (turboR) {
    for (const match of rankedFeed(turboR.data, catalog)) merged.set(match.matchId, { ...match, turbo: true });
  }
  const ranked = merged.size
    ? [...merged.values()].sort((a, b) => b.startTime - a.startTime)
    : passport.recent.ok
      ? passport.recent.data.played
          .filter((match) => match.lobby === 7 || match.turbo)
          .map((match) => ({
            matchId: match.matchId,
            hero: match.hero,
            img: match.img,
            won: match.won,
            kills: match.kills,
            deaths: match.deaths,
            assists: match.assists,
            duration: match.duration,
            startTime: match.startTime,
            turbo: match.turbo,
          }))
      : [];
  const mine = session?.accountId === id;
  const waitSeconds = query.wait && /^\d+$/.test(query.wait) ? Number(query.wait) : null;
  const sort = query.heroes === "robust" || query.heroes === "raw" ? query.heroes : "played";
  const heroes = passport.heroes.ok ? sortHeroes(passport.heroes.data, sort) : [];
  const rank = rankLabel(passport.profile.rankTier);
  const letter = passport.patch.letter;
  const bucket = passport.patch.bucketName;
  const record = passport.record.ok ? passport.record.data : null;
  const games = record ? record.wins + record.losses : null;
  const played = passport.recent.ok ? passport.recent.data.played : [];
  const formMax = Math.max(1, ...played.map((match) => match.form));
  const closed = historyClosed(passport);
  const blank = closed && (games === null || games === 0);

  return (
    <main className="sheet">
      <header className="player-stage">
        {passport.profile.avatar ? (
          <img className="player-avatar" src={passport.profile.avatar} alt="" />
        ) : (
          <span className="avatar-fallback" />
        )}
        <div className="who">
          <h1>{passport.profile.persona}</h1>
          <p className="muted">{passport.profile.profileUrl ? <a href={passport.profile.profileUrl}>Steam</a> : "Steam"}</p>
          {mine ? (
            <form action="/me/refresh" method="post">
              <button className="action" type="submit">
                Обновить
              </button>
            </form>
          ) : null}
          <div className="profile-actions">
            <Link className="action" href={`/players/${passport.accountId}/evolution`}>
              Эволюция
            </Link>
            <ShareProfile card={profileCard(passport, games)} />
          </div>
        </div>
        {passport.profile.rankTier ? (
          <div className="rank-badge">
            <RankMedal tier={passport.profile.rankTier} place={passport.profile.leaderboardRank} />
            {rank ? <span className="rank-name">{rank}</span> : null}
          </div>
        ) : null}
      </header>
      <RememberRecent id={passport.accountId} name={passport.profile.persona} avatar={passport.profile.avatar} />
      <PlayerModes accountId={passport.accountId} current="overview" />

      {waitSeconds ? <p className="muted">Повторить обновление можно через {waitSeconds} с.</p> : null}
      {closed ? <HiddenHistory /> : null}
      {blank ? null : (
      <>
      <p className="mode-note">
        Обзор — короткая сводка игрока: ранг, винрейт, частые герои и последние матчи. Винрейт и число матчей сверху считаются без Turbo. В списке матчей ниже Turbo отмечен отдельно.
      </p>
      <div className="board">
        <article className="stat-tile">
          <span>Матчи</span>
          <strong>{games === null ? "—" : formatNumber(games)}</strong>
          <em>{record ? `${formatNumber(record.wins)} – ${formatNumber(record.losses)}` : "без Turbo"}</em>
          <div className="meter games">
            <i style={{ width: "100%" }} />
          </div>
        </article>
        <article className="stat-tile">
          <span>Винрейт</span>
          <strong className={record && (record.winRate ?? 0) >= 0.5 ? "win" : "loss"}>
            {record ? formatPercent(record.winRate) : "—"}
          </strong>
          <em>{bucket ? `патч ${bucket}` : "без Turbo"}{letter ? ` · ${letter}` : ""}</em>
          <div className="meter">
            <i style={{ width: `${Math.round((record?.winRate ?? 0) * 100)}%` }} />
          </div>
        </article>
        <article className="stat-tile">
          <span>Последние {played.length || ""}</span>
          {played.length > 0 ? (
            <div className="trend" aria-label="Форма последних матчей">
              {played.map((match) => (
                <i
                  key={match.matchId}
                  className={match.won ? "win" : "loss"}
                  style={{ height: `${Math.max(18, Math.round((match.form / formMax) * 100))}%` }}
                  title={`${match.hero} ${match.won ? "победа" : "поражение"}`}
                />
              ))}
            </div>
          ) : (
            <em>нет недавних матчей</em>
          )}
        </article>
      </div>

      <section className="block">
        <div className="section-head">
          <h2>Активность</h2>
          <span className="muted">3 месяца</span>
        </div>
        {activityR && activityR.data.length > 0 ? (
          <ActivityCalendar rows={activityR.data} truncated={activityR.data.length >= 500} />
        ) : (
          <p className="empty">{activityR ? "За 3 месяца матчей нет." : "Активность сейчас не загрузилась."}</p>
        )}
      </section>

      {passport.heroes.ok ? (
        <section id="heroes">
          <div className="section-head">
            <h2>Частые герои</h2>
          </div>
          <div className="hero-board">
            {heroes.slice(0, 8).map((row) => (
              <Link key={row.heroId} className="hero-tile" href={`/heroes/${row.heroId}?player=${id}`}>
                {row.img ? <img src={row.img} alt="" /> : <span className="portrait-fallback" />}
                <b>{row.name}</b>
                <span className={(row.winRate ?? 0) >= 0.5 ? "rate win" : "rate loss"}>{formatPercent(row.winRate)}</span>
                <span className="mini">
                  <i className={(row.winRate ?? 0) >= 0.5 ? "win" : "loss"} style={{ width: `${Math.round((row.winRate ?? 0) * 100)}%` }} />
                </span>
                <span className="muted">{formatNumber(row.games)} игр</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="section-head">
          <h2>Матчи</h2>
          <Link href={`/players/${id}/matches`}>Все матчи</Link>
        </div>
        {ranked.length === 0 ? (
          <p className="empty">{rankedR ? "Рейтинговых матчей нет." : "Рейтинговые матчи сейчас не загрузились."}</p>
        ) : (
          <RankedMatches accountId={id} matches={ranked} />
        )}
      </section>

      <div className="stack">

        <section className="block">
          <div className="section-head">
            <h2>Патч {bucket ?? ""}</h2>
            <Link href={`/players/${id}/meta`}>Своя мета</Link>
          </div>
          {passport.patchHeroes.ok ? (
            <div className="hero-board">
              {passport.patchHeroes.data.slice(0, 12).map((row) => (
                <Link key={row.heroId} className="hero-tile" href={`/heroes/${row.heroId}?player=${id}`}>
                  {row.img ? <img src={row.img} alt="" /> : <span className="portrait-fallback" />}
                  <b>{row.name}</b>
                  <span className={(row.winRate ?? 0) >= 0.5 ? "rate win" : "rate loss"}>{formatPercent(row.winRate)}</span>
                  <span className="mini">
                    <i className={(row.winRate ?? 0) >= 0.5 ? "win" : "loss"} style={{ width: `${Math.round((row.winRate ?? 0) * 100)}%` }} />
                  </span>
                  <span className="muted">{formatNumber(row.games)} игр</span>
                </Link>
              ))}
            </div>
          ) : (
            <Failed />
          )}
        </section>

        <div className="grid-2">
          <section className="block">
            <h2>Линии</h2>
            <p className="muted">Линии, на которых сыграны матчи.</p>
            {passport.lanes.ok ? <Bars rows={passport.lanes.data} excludeUnknown /> : <Failed section={passport.lanes} />}
          </section>
          <section className="block">
            <h2>Средние за историю</h2>
            <p className="muted">Средние за всю историю.</p>
            {passport.lifetime.ok ? (
              <table>
                <tbody>
                  {passport.lifetime.data.rows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>
                        {row.label.startsWith("Длительность") ? formatDuration(row.value) : formatDecimal(row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Failed section={passport.lifetime} />
            )}
          </section>
        </div>

      </div>

      {passport.lobbies.ok && passport.modes.ok && passport.factions.ok && passport.regions.ok ? (
        <section className="block">
          <div className="section-head">
            <h2>Вся история</h2>
          </div>
          <LifetimeBoard
            lobbies={passport.lobbies.data}
            modes={passport.modes.data}
            factions={passport.factions.data}
            regions={passport.regions.data}
          />
        </section>
      ) : null}
      </>
      )}
    </main>
  );
}

function profileCard(passport: Passport, games: number | null): ProfileCard {
  const top = passport.heroes.ok
    ? [...passport.heroes.data].sort((left, right) => right.games - left.games || left.heroId - right.heroId)[0]
    : undefined;
  const lane = namedLane(passport.lanes.ok ? passport.lanes.data : null);
  return {
    name: passport.profile.persona,
    rank: rankLabel(passport.profile.rankTier) ?? "Ранг не указан",
    winRate: passport.record.ok ? formatPercent(passport.record.data.winRate) : "—",
    matches: games === null ? "нет данных" : gamesPhrase(games),
    slice: "без Turbo",
    lane: lane ?? "линия не названа",
    heroName: top?.name ?? null,
    heroLine: top ? `${formatPercent(top.winRate)} · ${gamesPhrase(top.games)}` : null,
    heroImg: top?.img ?? null,
  };
}
