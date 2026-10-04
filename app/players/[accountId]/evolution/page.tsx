import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiddenHistory } from "@/components/HiddenHistory";
import { PlayerModes } from "@/components/PlayerModes";
import { RankMedal } from "@/components/RankMedal";
import { RememberRecent } from "@/components/RememberRecent";
import { formatRateDelta, type EvolutionReport, type HeroEvolution, type PatchColumn, type PeriodSummary } from "@/lib/evolution";
import { loadPlayerEvolution } from "@/lib/evolution-load";
import { historyClosed, loadPassport } from "@/lib/passport";
import { dota } from "@/lib/sources";
import { formatDecimal, formatDuration, formatNumber, formatPercent, gamesPhrase, rankLabel } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accountId: string }>;
}): Promise<Metadata> {
  const { accountId } = await params;
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id <= 0) return { title: "Эволюция" };
  const player = await dota.getPlayer(id).catch(() => null);
  const name = player?.data.profile?.personaname || "Эволюция";
  return { title: `${name} — эволюция` };
}

export default async function EvolutionPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { accountId } = await params;
  const query = await searchParams;
  const id = Number(accountId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const [player, data, passport] = await Promise.all([
    dota.getPlayer(id),
    loadPlayerEvolution(id, query.view),
    loadPassport(id),
  ]);
  if (!player.data.profile) throw new Error("OpenDota не нашёл профиль по этому account id.");

  const profile = player.data.profile;
  const persona = profile.personaname || "Без ника";
  const report = data.report;
  const rank = rankLabel(player.data.rank_tier);
  const current = report.comparison === "ready" ? report.current : report.loaded > 0 ? report.loadedPeriod : null;
  const previous = report.comparison === "ready" ? report.previous : null;
  const changes = spokenChanges(report.changes);
  const metaCount = data.metaHeroIds ? data.playedHeroIds.filter((heroId) => data.metaHeroIds?.has(heroId)).length : null;
  const patches = [...report.patches].reverse();
  const shownPatches = patches.slice(0, 6);
  const olderPatches = patches.length - shownPatches.length;
  const closed = historyClosed(passport);
  const blank = closed && report.loaded === 0;

  return (
    <main className="sheet">
      <header className="player-stage">
        {profile.avatarfull ? <img className="player-avatar" src={profile.avatarfull} alt="" /> : <span className="avatar-fallback" />}
        <div className="who">
          <h1>{persona}</h1>
          <p className="muted">{profile.profileurl ? <a href={profile.profileurl}>Steam</a> : "Steam"}</p>
        </div>
        {player.data.rank_tier ? (
          <div className="rank-badge">
            <RankMedal tier={player.data.rank_tier} place={player.data.leaderboard_rank} />
            {rank ? <span className="rank-name">{rank}</span> : null}
          </div>
        ) : null}
      </header>
      <RememberRecent id={id} name={persona} avatar={profile.avatarfull} />
      <PlayerModes accountId={id} current="evolution" />
      {closed ? <HiddenHistory /> : null}
      {blank ? null : (
      <>
      <p className="mode-note">{evolutionLead(report.mode, report.sliceLabel)}</p>
      {data.stale ? <p className="muted">Показаны сохранённые цифры.</p> : null}

      {data.view.show20 || data.view.show50 || data.view.showPatch ? (
        <nav className="modes" aria-label="Окна эволюции">
          {data.view.show20 ? <ModeLink id={id} view="20" current={report.mode} label="20 матчей" /> : null}
          {data.view.show50 ? <ModeLink id={id} view="50" current={report.mode} label="50 матчей" /> : null}
          {data.view.showPatch ? <ModeLink id={id} view="patch" current={report.mode} label="Патчи" /> : null}
        </nav>
      ) : null}

      {report.loaded === 0 ? <p className="empty">{report.unavailableReason}</p> : null}
      {current ? <Focus current={current} previous={previous} /> : null}
      {report.loaded > 0 && report.comparison !== "ready" ? <p className="muted">{windowNote(report)}</p> : null}

      {changes.length > 0 ? (
        <section className="block">
          <h2>Что изменилось</h2>
          <ul className="evo-notes">
            {changes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.loaded > 0 ? <HeroBlock accountId={id} report={report} images={data.images} /> : null}

      {current ? (
        <section className="block">
          <h2>Линии</h2>
          <LaneBars current={current} previous={previous} />
        </section>
      ) : null}

      {shownPatches.length > 0 ? (
        <section className="block">
          <h2>Патчи</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Патч</th>
                  <th>Матчи</th>
                  <th>Винрейт</th>
                  <th>Герои</th>
                  <th>Линия</th>
                </tr>
              </thead>
              <tbody>
                {shownPatches.map((column) => (
                  <PatchRow key={column.id} column={column} />
                ))}
              </tbody>
            </table>
          </div>
          {olderPatches > 0 ? <p className="muted">Ещё {countPhrase(olderPatches, "патч", "патча", "патчей")} раньше.</p> : null}
          {!data.patchesLoaded && report.dated > 0 ? <p className="muted">Список патчей не загрузился.</p> : null}
        </section>
      ) : null}

      <section className="block">
        <div className="section-head">
          <h2>В мете сейчас</h2>
          <Link href={`/players/${id}/meta`}>Своя мета</Link>
        </div>
        {metaCount !== null && metaCount > 0 ? <p>{heroesPhrase(metaCount)} из этих матчей.</p> : null}
        {metaCount === 0 ? <p className="muted">Этих героев сейчас в мете нет.</p> : null}
      </section>
      </>
      )}
    </main>
  );
}

function evolutionLead(mode: string, sliceLabel: string): string {
  const window =
    mode === "patch"
      ? "Режим «Патчи» сравнивает последний патч с предыдущим: изменились ли винрейт, герои и линия после обновления."
      : mode === "50"
        ? "Режим «50 матчей» сравнивает последние 50 игр с 50 играми перед ними."
        : "Режим «20 матчей» сравнивает последние 20 игр с 20 играми перед ними.";
  return `Эволюция смотрит, как игрок меняется со временем. ${window} Матчи здесь ${sliceLabel}.`;
}

function ModeLink({ id, view, current, label }: { id: number; view: "20" | "50" | "patch"; current: string; label: string }) {
  return (
    <Link className="mode" href={`/players/${id}/evolution?view=${view}`} aria-current={current === view ? "page" : undefined}>
      {label}
    </Link>
  );
}

function Focus({ current, previous }: { current: PeriodSummary; previous: PeriodSummary | null }) {
  const wrClass = current.winRate === null ? undefined : current.winRate >= 0.5 ? "win" : "loss";
  const wasRate = previous && current.winRate !== null && previous.winRate !== null ? formatRateDelta(current.winRate, previous.winRate) : null;
  return (
    <section>
      <div className="section-head">
        <h2>{current.label}</h2>
        {current.mainLane ? <span>Чаще всего: {current.mainLane.label}</span> : null}
      </div>
      <div className="board evo-board">
        <article className="stat-tile">
          <span>Винрейт</span>
          <strong className={wrClass}>{formatPercent(current.winRate)}</strong>
          <em>
            {formatNumber(current.wins)} – {formatNumber(current.losses)}
            {previous ? ` · было ${formatPercent(previous.winRate)}` : ""}
            {wasRate ? ` · ${wasRate}` : ""}
          </em>
          <div className="meter">
            <i style={{ width: `${Math.round((current.winRate ?? 0) * 100)}%` }} />
          </div>
        </article>
        <article className="stat-tile">
          <span>KDA</span>
          <strong>{current.kda ? formatDecimal(current.kda.value) : "—"}</strong>
          <em>{kdaCaption(current, previous)}</em>
        </article>
        <article className="stat-tile">
          <span>Герои</span>
          <strong>{formatNumber(current.uniqueHeroes)}</strong>
          <em>{heroCaption(current, previous)}</em>
        </article>
        <article className="stat-tile">
          <span>Длительность</span>
          <strong>{formatDuration(current.avgDurationSec)}</strong>
          <em>{previous?.avgDurationSec != null ? `было ${formatDuration(previous.avgDurationSec)}` : "средняя длина"}</em>
        </article>
      </div>
    </section>
  );
}

function HeroBlock({
  accountId,
  report,
  images,
}: {
  accountId: number;
  report: EvolutionReport;
  images: Map<number, string | null>;
}) {
  const rows = report.heroes
    .filter((hero) => hero.currentGames > 0)
    .sort((left, right) => right.currentGames - left.currentGames || left.heroId - right.heroId)
    .slice(0, 8);
  const fresh = report.adopted.slice(0, 5);
  const gone = report.dropped.slice(0, 5);
  return (
    <section>
      <div className="section-head">
        <h2>Герои</h2>
      </div>
      {rows.length === 0 ? (
        <p className="empty">В этих матчах героев нет.</p>
      ) : (
        <div className="hero-board">
          {rows.map((hero) => (
            <HeroTile key={hero.heroId} accountId={accountId} hero={hero} img={images.get(hero.heroId) ?? null} compared={report.comparison === "ready"} />
          ))}
        </div>
      )}
      {fresh.length > 0 || gone.length > 0 ? (
        <div className="evo-split">
          {fresh.length > 0 ? <Cameos title="Новые" heroes={fresh} images={images} rest={report.adopted.length - fresh.length} /> : null}
          {gone.length > 0 ? <Cameos title="Были в прошлый раз" heroes={gone} images={images} rest={report.dropped.length - gone.length} /> : null}
        </div>
      ) : null}
    </section>
  );
}

function HeroTile({
  accountId,
  hero,
  img,
  compared,
}: {
  accountId: number;
  hero: HeroEvolution;
  img: string | null;
  compared: boolean;
}) {
  const rateClass = hero.currentWinRate === null ? undefined : hero.currentWinRate >= 0.5 ? "win" : "loss";
  return (
    <Link className="hero-tile" href={`/heroes/${hero.heroId}?player=${accountId}`}>
      {img ? <img src={img} alt="" /> : <span className="portrait-fallback" />}
      <b>{hero.name}</b>
      <span className={rateClass ? `rate ${rateClass}` : "rate"}>{formatPercent(hero.currentWinRate)}</span>
      <span className="mini">
        <i className={rateClass} style={{ width: `${Math.round((hero.currentWinRate ?? 0) * 100)}%` }} />
      </span>
      <span className="muted">
        {gamesPhrase(hero.currentGames)}
        {compared && hero.previousGames ? ` · было ${formatNumber(hero.previousGames)}` : ""}
        {hero.comparable && hero.currentWinRate !== null && hero.previousWinRate !== null ? ` · ${formatRateDelta(hero.currentWinRate, hero.previousWinRate)}` : ""}
      </span>
    </Link>
  );
}

function Cameos({
  title,
  heroes,
  images,
  rest,
}: {
  title: string;
  heroes: { heroId: number; name: string; games: number }[];
  images: Map<number, string | null>;
  rest: number;
}) {
  return (
    <div>
      <h3>{title}</h3>
      {heroes.map((hero) => {
        const img = images.get(hero.heroId);
        return (
          <p className="evo-cameo" key={hero.heroId}>
            {img ? <img src={img} alt="" /> : <span className="portrait-fallback" />}
            <span>
              <b>{hero.name}</b>
              <span>{gamesPhrase(hero.games)}</span>
            </span>
          </p>
        );
      })}
      {rest > 0 ? <p className="muted">ещё {formatNumber(rest)}</p> : null}
    </div>
  );
}

function LaneBars({ current, previous }: { current: PeriodSummary; previous: PeriodSummary | null }) {
  const lanes = current.lanes.filter((lane) => lane.n > 0);
  const max = Math.max(...lanes.map((lane) => lane.n), 1);
  if (lanes.length === 0 && current.roaming === 0) {
    return <p className="muted">Линии в этих матчах не определились.</p>;
  }
  return (
    <>
      <div className="bars">
        {lanes.map((lane) => {
          const before = previous?.lanes.find((item) => item.role === lane.role)?.n;
          return (
            <div className="bar" key={lane.role}>
              <span>{lane.label}</span>
              <span className="track">
                <i style={{ width: `${(lane.n / max) * 100}%` }} />
              </span>
              <span>
                {gamesPhrase(lane.n)}
                {before !== undefined && before !== lane.n ? ` · было ${formatNumber(before)}` : ""}
              </span>
            </div>
          );
        })}
        {current.roaming > 0 ? (
          <div className="bar">
            <span>Роуминг</span>
            <span className="track">
              <i style={{ width: `${(current.roaming / max) * 100}%` }} />
            </span>
            <span>
              {formatNumber(current.roaming)}
              {previous ? ` · было ${formatNumber(previous.roaming)}` : ""}
            </span>
          </div>
        ) : null}
      </div>
      {current.unknownLanes > 0 ? <p className="muted">Ещё {gamesPhrase(current.unknownLanes)} без линии.</p> : null}
    </>
  );
}

function PatchRow({ column }: { column: PatchColumn }) {
  const wrClass = column.winRate === null ? undefined : column.winRate >= 0.5 ? "win" : "loss";
  return (
    <tr>
      <td>Патч {column.name}</td>
      <td>{formatNumber(column.n)}</td>
      <td className={wrClass}>{formatPercent(column.winRate)}</td>
      <td>{formatNumber(column.uniqueHeroes)}</td>
      <td>{column.mainLane ? column.mainLane.label : "—"}</td>
    </tr>
  );
}

function kdaCaption(current: PeriodSummary, previous: PeriodSummary | null): string {
  if (!current.kda) return "нет данных";
  const was = previous?.kda ? `было ${formatDecimal(previous.kda.value)}` : null;
  const known = current.kda.known < current.n ? `известно в ${formatNumber(current.kda.known)} из ${formatNumber(current.n)}` : null;
  return [was, known].filter(Boolean).join(" · ") || `${formatNumber(current.n)} матчей`;
}

function heroCaption(current: PeriodSummary, previous: PeriodSummary | null): string {
  const name = current.topHero?.name ?? null;
  if (previous?.topHero && current.topHero && previous.topHero.heroId !== current.topHero.heroId) {
    return name ? `${name} · раньше ${previous.topHero.name}` : `раньше ${previous.topHero.name}`;
  }
  if (previous && previous.uniqueHeroes !== current.uniqueHeroes) {
    const was = `было ${heroesPhrase(previous.uniqueHeroes)}`;
    return name ? `чаще ${name} · ${was}` : was;
  }
  return name ? `чаще ${name}` : "разных героев";
}

function windowNote(report: EvolutionReport): string {
  if (report.dated === 0) return "Даты матчей не пришли, поставить два отрезка рядом нельзя.";
  if (report.mode === "patch") return "В этих матчах один патч, предыдущего рядом нет.";
  const need = report.mode === "50" ? 100 : 40;
  return `Чтобы поставить два отрезка рядом, нужно хотя бы ${formatNumber(need)} матчей. Сейчас ${formatNumber(report.dated)}.`;
}

function spokenChanges(lines: string[]): string[] {
  return lines.flatMap((line) => {
    const spoken = speakChange(line);
    return spoken ? [spoken] : [];
  });
}

function speakChange(line: string): string | null {
  if (line.includes("по правилам порога") || line.startsWith("Уникальных героев") || line.startsWith("Средняя длительность") || line.startsWith("Винрейт патча")) {
    return null;
  }
  const share = /^Доля самого частого героя: было ([\d.]+%), стало ([\d.]+%)\.$/.exec(line);
  if (share) return `Самый частый герой занимает ${share[2]} матчей. Раньше было ${share[1]}.`;
  const lane = /^Доля линии ([^:]+): было ([\d.]+%), стало ([\d.]+%)\.$/.exec(line);
  if (lane) return `${lane[1]} — ${lane[3]} матчей, раньше ${lane[2]}.`;
  if (/^Самый частый герой сменился с /.test(line)) return null;
  return line;
}

function heroesPhrase(n: number): string {
  return countPhrase(n, "герой", "героя", "героев");
}

function countPhrase(n: number, one: string, few: string, many: string): string {
  const mod10 = Math.abs(n) % 10;
  const mod100 = Math.abs(n) % 100;
  const word = mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
  return `${formatNumber(n)} ${word}`;
}
