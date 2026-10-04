import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiddenHistory } from "@/components/HiddenHistory";
import { PlayerModes } from "@/components/PlayerModes";
import { RankMedal } from "@/components/RankMedal";
import { RememberRecent } from "@/components/RememberRecent";
import { buildMeta, type MetaRow } from "@/lib/meta";
import { historyClosed, loadPassport, type Passport } from "@/lib/passport";
import { dota } from "@/lib/sources";
import { formatNumber, formatPercent, gamesPhrase, rankLabel } from "@/lib/stats";
import {
  FAMILIAR_GAMES,
  heroesIn,
  yourMetaBlurb,
  buildYourMeta,
  type AdviceCard,
  type PlacedHero,
  type YourMetaReport,
} from "@/lib/your-meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string }>;
}): Promise<Metadata> {
  const { accountId } = await params;
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id <= 0) return { title: "Своя мета" };
  const passport = await loadPassport(id);
  const bucket = passport.patch.bucketName ?? "патч";
  const report = await reportFor(bucket, passport);
  const description = yourMetaBlurb(passport.profile.persona, bucket, report);
  const title = `${passport.profile.persona} — своя мета`;
  return { title, description, openGraph: { title, description } };
}

async function reportFor(bucketName: string, passport: Passport) {
  let meta = null;
  try {
    const catalog = await dota.getHeroCatalog();
    meta = buildMeta(catalog.data, "pub");
  } catch {
    meta = null;
  }
  return buildYourMeta({
    bucketName,
    baseline: passport.patchRecord.ok
      ? { wins: passport.patchRecord.data.wins, losses: passport.patchRecord.data.losses }
      : null,
    patchHeroes: passport.patchHeroes.ok ? passport.patchHeroes.data : [],
    lifetimeHeroes: passport.heroes.ok ? passport.heroes.data : [],
    heroesKnown: passport.patchHeroes.ok,
    lifetimeKnown: passport.heroes.ok,
    meta,
  });
}

export default async function YourMetaPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const passport = await loadPassport(id);
  const bucket = passport.patch.bucketName;
  let metaError = false;
  let meta: MetaRow[] | null = null;
  try {
    const catalog = await dota.getHeroCatalog();
    meta = buildMeta(catalog.data, "pub");
  } catch {
    metaError = true;
  }

  const report = buildYourMeta({
    bucketName: bucket ?? "патч",
    baseline: passport.patchRecord.ok
      ? { wins: passport.patchRecord.data.wins, losses: passport.patchRecord.data.losses }
      : null,
    patchHeroes: passport.patchHeroes.ok ? passport.patchHeroes.data : [],
    lifetimeHeroes: passport.heroes.ok ? passport.heroes.data : [],
    heroesKnown: passport.patchHeroes.ok,
    lifetimeKnown: passport.heroes.ok,
    meta,
  });
  const closed = historyClosed(passport);
  const games = passport.record.ok ? passport.record.data.wins + passport.record.data.losses : 0;
  const blank = closed && games === 0 && report.played.length === 0;
  const rank = rankLabel(passport.profile.rankTier);
  const frequent = report.played.slice(0, 8);
  const inMeta = metaTiles(report, meta);
  const tableRows = tableHeroes(report.played);
  const patchName = bucket ? `патче ${bucket}` : "текущем патче";
  const gamesNote = report.baselineGames > 0 ? ` У него в этом патче ${gamesPhrase(report.baselineGames)}.` : "";
  const lead = `Своя мета ставит героев этого игрока в ${patchName} рядом с общей метой.${gamesNote} На карточках «Частые» процент — его собственный винрейт. В блоке «В мете» процент общий: так этот герой выигрывает у всех.`;

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
        </div>
        {passport.profile.rankTier ? (
          <div className="rank-badge">
            <RankMedal tier={passport.profile.rankTier} place={passport.profile.leaderboardRank} />
            {rank ? <span className="rank-name">{rank}</span> : null}
          </div>
        ) : null}
      </header>
      <RememberRecent id={id} name={passport.profile.persona} avatar={passport.profile.avatar} />
      <PlayerModes accountId={id} current="meta" />
      {closed ? <HiddenHistory /> : null}
      {blank ? null : (
        <>
          <p className="mode-note">{lead}</p>
          {report.thin ? <p className="muted">Мало игр, чтобы сравнивать с обычным винрейтом.</p> : null}
          {!bucket ? <p className="muted">Патч не прочитан.</p> : null}
          {!report.heroesKnown ? <p className="empty">Герои этого патча не загрузились.</p> : null}
          {!passport.patchRecord.ok ? <p className="muted">Винрейт этого патча не загрузился.</p> : null}

          {report.heroesKnown && passport.patchRecord.ok ? (
            <div className="board">
              <article className="stat-tile">
                <span>Винрейт</span>
                <strong className={(report.baselineRate ?? 0) >= 0.5 ? "win" : "loss"}>{formatPercent(report.baselineRate)}</strong>
                <em>{gamesPhrase(report.baselineGames)}</em>
              </article>
              <article className="stat-tile">
                <span>Матчи</span>
                <strong>{formatNumber(report.baselineGames)}</strong>
                <em>{bucket ? `патч ${bucket}` : "этот патч"}</em>
              </article>
              <article className="stat-tile">
                <span>Герои</span>
                <strong>{formatNumber(report.played.length)}</strong>
                <em>в этом патче</em>
              </article>
            </div>
          ) : null}

          {frequent.length > 0 ? (
            <section>
              <div className="section-head">
                <h2>Частые</h2>
              </div>
              <p className="section-note">Кого он брал чаще всего в этом патче. Зелёный процент — больше половины побед, красный — меньше.</p>
              <div className="hero-board">
                {frequent.map((hero) => (
                  <HeroTile key={hero.heroId} accountId={id} hero={hero} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="section-head">
              <h2>В мете</h2>
              <Link href="/meta">Все герои</Link>
            </div>
            <p className="section-note">Герои, которые выигрывают у всех, а у этого игрока на них ещё меньше 20 игр. Это не совет взять их в следующей игре.</p>
            {metaError || !report.metaReady ? (
              <p className="muted">Общий список героев не загрузился.</p>
            ) : inMeta.length === 0 ? (
              <p className="muted">Таких героев нет.</p>
            ) : (
              <div className="hero-board">
                {inMeta.map((tile) => (
                  <Link key={tile.heroId} className="hero-tile" href={`/heroes/${tile.heroId}?player=${id}`}>
                    {tile.img ? <img src={tile.img} alt="" /> : <span className="portrait-fallback" />}
                    <b>{tile.name}</b>
                    <span className={tile.publicRate === null ? "rate" : tile.publicRate >= 0.5 ? "rate win" : "rate loss"}>
                      {formatPercent(tile.publicRate)}
                    </span>
                    <span className="mini">
                      <i
                        className={(tile.publicRate ?? 0) >= 0.5 ? "win" : "loss"}
                        style={{ width: `${Math.round((tile.publicRate ?? 0) * 100)}%` }}
                      />
                    </span>
                    <span className="muted">{tile.note}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {tableRows.length > 0 ? (
            <section className="block">
              <h2>Этот патч</h2>
              <p className="section-note">
                Его герои патча, на которых есть хотя бы 5 игр. «У всех» — общий винрейт героя. «Как обычно» — результат рядом с его собственным винрейтом патча. «Мало игр» — меньше 20. «Выше обычного» и «ниже обычного» — заметно лучше или хуже его обычного результата.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Герой</th>
                      <th>Матчи</th>
                      <th>Винрейт</th>
                      {report.metaReady ? <th>У всех</th> : null}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((hero) => {
                      const word = statusWord(hero);
                      const tone = hero.signal === "above" ? "win" : hero.signal === "below" ? "loss" : undefined;
                      return (
                        <tr key={hero.heroId}>
                          <td>
                            <Link className="meta-who" href={`/heroes/${hero.heroId}?player=${id}`}>
                              {hero.img ? <img src={hero.img} alt="" /> : <span className="portrait-fallback" />}
                              <span>{hero.name}</span>
                            </Link>
                          </td>
                          <td>{formatNumber(hero.patchGames)}</td>
                          <td className={hero.patchWinRate === null ? undefined : hero.patchWinRate >= 0.5 ? "win" : "loss"}>
                            {formatPercent(hero.patchWinRate)}
                          </td>
                          {report.metaReady ? <td>{formatPercent(hero.metaWinRate)}</td> : null}
                          <td className={tone}>{word}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {report.played.length > tableRows.length ? (
                <p className="muted">Ещё {formatNumber(report.played.length - tableRows.length)} — меньше 5 игр.</p>
              ) : null}
            </section>
          ) : report.heroesKnown ? (
            <p className="muted">В этом патче игр на героях нет.</p>
          ) : null}
        </>
      )}
    </main>
  );
}

function HeroTile({ hero, accountId }: { hero: PlacedHero; accountId: number }) {
  const rate = hero.patchWinRate ?? 0;
  return (
    <Link className="hero-tile" href={`/heroes/${hero.heroId}?player=${accountId}`}>
      {hero.img ? <img src={hero.img} alt="" /> : <span className="portrait-fallback" />}
      <b>{hero.name}</b>
      <span className={hero.patchWinRate === null ? "rate" : rate >= 0.5 ? "rate win" : "rate loss"}>{formatPercent(hero.patchWinRate)}</span>
      <span className="mini">
        <i className={rate >= 0.5 ? "win" : "loss"} style={{ width: `${Math.round(rate * 100)}%` }} />
      </span>
      <span className="muted">
        {gamesPhrase(hero.patchGames)}
        {hero.signal === "above" ? " · выше обычного" : hero.signal === "below" ? " · ниже обычного" : ""}
      </span>
    </Link>
  );
}

type MetaTile = {
  heroId: number;
  name: string;
  img: string | null;
  publicRate: number | null;
  note: string;
};

function metaTiles(report: YourMetaReport, meta: MetaRow[] | null): MetaTile[] {
  const publicRate = new Map((meta ?? []).map((row) => [row.id, row.winRate]));
  const frequent = new Set(report.played.slice(0, 8).map((hero) => hero.heroId));
  const played = heroesIn(report, "meta-only")
    .filter((hero) => hero.patchGames < FAMILIAR_GAMES && !frequent.has(hero.heroId))
    .slice(0, 8);
  const tiles: MetaTile[] = played.map((hero) => ({
    heroId: hero.heroId,
    name: hero.name,
    img: hero.img,
    publicRate: hero.metaWinRate,
    note: hero.patchGames > 0 ? `у всех · ${gamesPhrase(hero.patchGames)}` : "у всех",
  }));
  if (tiles.length >= 8) return tiles;
  const seen = new Set(tiles.map((tile) => tile.heroId));
  for (const card of report.cards) {
    if (tiles.length >= 8) break;
    if (card.kind !== "practice" || seen.has(card.heroId) || frequent.has(card.heroId)) continue;
    tiles.push(tileFromPractice(card, report, publicRate));
    seen.add(card.heroId);
  }
  return tiles;
}

function tileFromPractice(card: AdviceCard, report: YourMetaReport, publicRate: Map<number, number | null>): MetaTile {
  const played = report.played.find((hero) => hero.heroId === card.heroId);
  const games = played?.patchGames ?? 0;
  return {
    heroId: card.heroId,
    name: card.name,
    img: card.img,
    publicRate: played?.metaWinRate ?? publicRate.get(card.heroId) ?? null,
    note: games > 0 ? `у всех · ${gamesPhrase(games)}` : "у всех · в этом патче нет игр",
  };
}

function tableHeroes(played: PlacedHero[]): PlacedHero[] {
  const listed = played.filter((hero) => hero.patchGames >= 5);
  return listed.length > 0 ? listed : played.slice(0, 8);
}

function statusWord(hero: PlacedHero): string {
  if (hero.signal === "above") return "выше обычного";
  if (hero.signal === "below") return "ниже обычного";
  if (hero.signal === "crosses") return "как обычно";
  if (hero.signal === "small") return "мало игр";
  return "—";
}
