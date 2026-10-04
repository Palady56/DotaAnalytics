import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PairForm } from "@/components/PairForm";
import { RankMedal } from "@/components/RankMedal";
import {
  PAIR_BADGE_N,
  comparePath,
  duoBlurb,
  loadDuo,
  parseAccountId,
  type HeroPair,
  type LanePair,
  type SharedMatch,
} from "@/lib/duo";
import {
  duoCopyText,
  outcomeCards,
  patchColumns,
  pointsPhrase,
  synergyStatusLabel,
  tenCompare,
} from "@/lib/duo-layout";
import { formatDecimal, formatDuration, formatNumber, formatPercent, formatWhen, gamesPhrase, rankLabel } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ a: string; b: string }>;
}): Promise<Metadata> {
  const raw = await params;
  const a = parseAccountId(raw.a);
  const b = parseAccountId(raw.b);
  if (a === null || b === null || a === b) return { title: "Дуэт" };
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const report = await loadDuo(lo, hi);
  const description = duoBlurb(report);
  const title = `${report.names.a} и ${report.names.b} — дуэт`;
  return { title, description, openGraph: { title, description } };
}

function PairBadges({ pair }: { pair: HeroPair }) {
  return (
    <>
      {pair.mostPlayed ? <span className="chip stable">чаще всего</span> : null}
      {pair.games < PAIR_BADGE_N ? <span className="chip low">мало игр</span> : null}
    </>
  );
}

export default async function DuoPairPage({ params }: { params: Promise<{ a: string; b: string }> }) {
  const raw = await params;
  const a = parseAccountId(raw.a);
  const b = parseAccountId(raw.b);
  if (a === null || b === null) notFound();
  if (a === b) {
    return (
      <main className="sheet">
        <h1>Дуэт</h1>
        <p className="error">Нужны два разных игрока.</p>
        <PairForm action="/duo" submit="Открыть дуэт" />
      </main>
    );
  }
  if (a > b) redirect(`/duo/${b}/${a}`);

  const report = await loadDuo(a, b);
  const window = report.window;
  const scoreClass =
    window?.synergy.status === "above" ? "score-above" : window?.synergy.status === "below" ? "score-below" : "score-muted";

  const peer = report.peers.ok ? report.peers.row : null;
  const togetherGames = peer?.with_games ?? 0;
  const togetherWins = peer?.with_win ?? 0;
  const againstGames = peer?.against_games ?? 0;
  const againstWins = peer?.against_win ?? 0;
  const togetherRate = togetherGames > 0 ? togetherWins / togetherGames : null;
  const againstRate = againstGames > 0 ? againstWins / againstGames : null;
  const togetherGpm = peer?.with_games && peer.with_gpm_sum != null ? peer.with_gpm_sum / peer.with_games : null;
  const togetherXpm = peer?.with_games && peer.with_xpm_sum != null ? peer.with_xpm_sum / peer.with_games : null;
  const matches = window ? [...window.same, ...window.against].sort((left, right) => (right.startTime ?? 0) - (left.startTime ?? 0)) : [];

  return (
    <main className="sheet">
      <div className="pair duo-stage">
        <DuoHead id={a} name={report.names.a} avatar={report.avatars.a} tier={report.ranks.a.tier} place={report.ranks.a.place} />
        <p className="together-mark">вместе</p>
        <DuoHead id={b} name={report.names.b} avatar={report.avatars.b} tier={report.ranks.b.tier} place={report.ranks.b.place} />
      </div>
      <p className="mode-note">
        Дуэт считает общие игры этих двоих: сколько раз они были в одной команде и сколько раз друг против друга. Оценка показывает, выигрывают ли они вместе чаще, чем каждый играет сам по себе. Это уже сыгранные матчи, не прогноз следующей игры.
      </p>
      <p>
        <Link className="action" href={comparePath(a, b)}>Открыть сравнение</Link>
      </p>
      <PairForm action="/duo" a={String(a)} b={String(b)} submit="Другая пара" />

      {window?.stale || (report.peers.ok && report.peers.stale) ? <p className="muted">Показаны сохранённые цифры.</p> : null}
      {report.windowError ? <p className="empty">Общие матчи сейчас не загрузились.</p> : null}

      <section className="block">
        <div className="section-head">
          <h2>За всё время</h2>
          {peer?.last_played ? <span className="muted">последняя общая игра {formatWhen(peer.last_played)}</span> : null}
        </div>
        {report.peers.ok ? (
          peer ? (
            <section className="board">
              <article className="stat-tile">
                <span>Вместе</span>
                <strong>{formatNumber(togetherGames)}</strong>
                <span className={togetherRate === null ? "muted" : togetherRate >= 0.5 ? "win" : "loss"}>{formatPercent(togetherRate)}</span>
                <span className="muted">
                  {formatNumber(togetherWins)}–{formatNumber(Math.max(togetherGames - togetherWins, 0))}
                </span>
                <div className="meter">
                  <i style={{ width: `${Math.round((togetherRate ?? 0) * 100)}%` }} />
                </div>
              </article>
              <article className="stat-tile">
                <span>Друг против друга</span>
                <strong>{formatNumber(againstGames)}</strong>
                <span className={againstRate === null ? "muted" : againstRate >= 0.5 ? "win" : "loss"}>{formatPercent(againstRate)}</span>
                <em>
                  {report.names.a} {formatNumber(againstWins)} · {report.names.b} {formatNumber(Math.max(againstGames - againstWins, 0))}
                </em>
              </article>
              <article className="stat-tile">
                <span>Золото в минуту</span>
                <strong>{togetherGpm === null ? "—" : formatDecimal(togetherGpm)}</strong>
                <em>опыт {togetherXpm === null ? "—" : formatDecimal(togetherXpm)}</em>
              </article>
            </section>
          ) : (
            <p className="empty">В общей истории этой пары нет. Ниже только последние общие матчи, если они нашлись.</p>
          )
        ) : (
          <p className="empty">Общая история не загрузилась.</p>
        )}
      </section>

      {window ? (
        <>
          <div className="section-head">
            <h2>В одной команде</h2>
            <span className="muted">{window.truncated ? `последние ${formatNumber(window.limit)} общих` : `${formatNumber(window.same.length)} игр`}</span>
          </div>
          <section className="board">
            <article className="stat-tile">
              <span>Игры</span>
              <strong>{formatNumber(window.synergy.n)}</strong>
              <span className="muted">
                {formatNumber(window.synergy.wins)}–{formatNumber(window.same.length - window.synergy.wins)}
              </span>
            </article>
            <article className="stat-tile">
              <span>Винрейт</span>
              <strong className={(window.synergy.observed ?? 0) >= 0.5 ? "win" : "loss"}>
                {formatPercent(window.synergy.observed)}
              </strong>
              <em>по отдельности {formatPercent(window.synergy.pA)} и {formatPercent(window.synergy.pB)}</em>
            </article>
            <article className="stat-tile">
              <span>Оценка</span>
              <strong className={scoreClass}>
                {window.synergy.score === null ? "—" : formatDecimal(window.synergy.score)}
              </strong>
              <em>{window.synergy.score === null ? "оценки нет" : `${scoreWords(window.synergy.status, window.synergy.n)} · из 100`}</em>
            </article>
          </section>
          <p>
            Вместе {formatPercent(window.synergy.observed)}
            {window.synergy.expected !== null ? `, по их отдельным играм выходило около ${formatPercent(window.synergy.expected)}` : ""}.
            Средняя игра {formatDuration(window.avgDuration)}.
          </p>
          {window.trend ? (
            <p>Последние 20 — {formatPercent(window.trend.recent.winRate)}. До этого — {formatPercent(window.trend.previous.winRate)}.</p>
          ) : null}
          <DuoReadout reportNames={report.names} window={window} patches={report.patches} />

          <section className="block">
            <h2>Герои вместе</h2>
            {window.pairs.length === 0 ? (
              <p className="empty">Вместе на героях пока пусто.</p>
            ) : (
              <div className="match-feed">
                {window.pairs.map((pair) => (
                  <div className="pair-line" key={`${pair.heroA}-${pair.heroB}`}>
                    {pair.imgA ? <img src={pair.imgA} alt="" /> : <span className="portrait-fallback" />}
                    {pair.imgB ? <img src={pair.imgB} alt="" /> : <span className="portrait-fallback" />}
                    <span>
                      <b>
                        {pair.nameA} + {pair.nameB}
                      </b>
                      <span className="muted">
                        {formatNumber(pair.games)} игр · {formatNumber(pair.wins)} побед <PairBadges pair={pair} />
                      </span>
                    </span>
                    {pair.games < 5 ? null : (
                      <span className={pair.games >= PAIR_BADGE_N && (pair.winRate ?? 0) >= 0.5 ? "rate win" : pair.games >= PAIR_BADGE_N ? "rate loss" : "muted"}>
                        {formatPercent(pair.winRate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="block">
            <h2>Линии</h2>
            {window.lanes.length === 0 ? (
              <p className="empty">Линии вместе не определились.</p>
            ) : (
              <div className="match-feed">
                {window.lanes.map((lane: LanePair) => (
                  <div className="pair-line lanes" key={`${lane.laneA}-${lane.laneB}`}>
                    <span>
                      <b>
                        {lane.labelA} + {lane.labelB}
                      </b>
                      <span className="muted">
                        {formatNumber(lane.games)} игр · {formatDuration(lane.avgDuration)}
                      </span>
                    </span>
                    <span className={lane.games >= PAIR_BADGE_N && (lane.winRate ?? 0) >= 0.5 ? "rate win" : lane.games >= PAIR_BADGE_N ? "rate loss" : "muted"}>
                      {formatPercent(lane.winRate)}
                      {lane.games < PAIR_BADGE_N ? " · мало матчей" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="block">
            <h2>Матчи</h2>
            {window.against.length > 0 ? (
              <p>
                Друг против друга: {report.names.a} выиграл {formatNumber(window.against.filter((match) => match.won).length)} из{" "}
                {gamesPhrase(window.against.length)}.
              </p>
            ) : null}
            <MatchList matches={matches} accountId={a} />
            <p>
              <Link href={`/players/${a}/matches?with=${b}`}>Все матчи с этим игроком</Link>
            </p>
          </section>
        </>
      ) : null}
    </main>
  );
}

function DuoReadout({
  reportNames,
  window,
  patches,
}: {
  reportNames: { a: string; b: string };
  window: NonNullable<Awaited<ReturnType<typeof loadDuo>>["window"]>;
  patches: { id: number; name: string; date: string }[];
}) {
  const synergy = window.synergy;
  const status = synergyStatusLabel(synergy.status, synergy.n);
  const matches = window.same.map((match) => ({
    startTime: match.startTime,
    won: match.won,
    heroA: match.heroA,
    heroB: match.heroB,
    imgA: match.imgA,
    imgB: match.imgB,
  }));
  const columns = patchColumns(matches, patches);
  const cards = outcomeCards(window.pairs, window.lanes, columns.columns);
  const tens = tenCompare(matches, patches);
  const top = cards.find((card) => card.kind === "пара героев") ?? null;
  const copy = duoCopyText({
    nameA: reportNames.a,
    nameB: reportNames.b,
    same: synergy.n,
    winRate: synergy.observed,
    score: synergy.score,
    status,
    topPair: top && top.n >= 15 ? top.title : null,
  });
  const lastTen = matches.slice().sort((left, right) => (right.startTime ?? 0) - (left.startTime ?? 0)).slice(0, 10);
  const lastTenRate = lastTen.length >= 10 ? lastTen.filter((match) => match.won).length / 10 : null;
  const highlights = [...window.pairs].sort((left, right) => right.games - left.games || left.heroA - right.heroA).slice(0, 3);

  return (
    <>
      {highlights.length > 0 ? (
        <section>
          <h2>Чаще вместе</h2>
          <div className="hero-board">
            {highlights.map((pair) => {
              const wrClass = pair.winRate !== null && pair.games >= 5 && pair.winRate >= 0.5 ? "win" : pair.winRate !== null && pair.games >= 5 ? "loss" : undefined;
              return (
                <article className="hero-tile" key={`${pair.heroA}-${pair.heroB}`}>
                  <span className="duo-faces">
                    {pair.imgA ? <img src={pair.imgA} alt="" /> : <span className="portrait-fallback" />}
                    {pair.imgB ? <img src={pair.imgB} alt="" /> : <span className="portrait-fallback" />}
                  </span>
                  <b>{pair.nameA} + {pair.nameB}</b>
                  <span className={wrClass ? `rate ${wrClass}` : "muted"}>{pair.games < 5 ? gamesPhrase(pair.games) : formatPercent(pair.winRate)}</span>
                  {pair.games >= 5 ? <span className="muted">{gamesPhrase(pair.games)}</span> : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {columns.columns.length > 0 ? (
        <section className="block">
          <h2>Патчи</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Патч</th>
                  <th>Матчи</th>
                  <th>Винрейт</th>
                </tr>
              </thead>
              <tbody>
                {columns.columns.map((column) => (
                  <tr key={column.name}>
                    <td>Патч {column.name}</td>
                    <td>{formatNumber(column.n)}{column.n < 15 ? " · мало" : ""}</td>
                    <td className={column.winRate !== null && column.winRate >= 0.5 ? "win" : column.winRate !== null ? "loss" : undefined}>
                      {formatPercent(column.winRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tens.enough && tens.recent && tens.previous ? (
        <p>
          Последние 10 — {formatPercent(tens.recent.winRate)}. Десятка до этого — {formatPercent(tens.previous.winRate)}, {pointsPhrase((tens.recent.winRate ?? 0) - (tens.previous.winRate ?? 0))}
          {tens.pairChanged ? ` Частая пара сменилась: ${tens.previous.pair} → ${tens.recent.pair}.` : ""}
        </p>
      ) : lastTenRate !== null ? (
        <p>Последние 10 вместе — {formatPercent(lastTenRate)}.</p>
      ) : null}

      <details>
        <summary>Откуда оценка</summary>
        <p>
          {status}. Разница {pointsPhrase(synergy.delta)}. Интервал {formatPercent(synergy.lower)}–{formatPercent(synergy.upper)}.
        </p>
        <p className="duo-copy">{copy}</p>
      </details>
    </>
  );
}

function scoreWords(status: string, n: number): string {
  if (status === "above") return "выше, чем по отдельности";
  if (status === "below") return "ниже, чем по отдельности";
  if (status === "none") return "оценки нет";
  return n < 30 ? "пока мало общих игр" : "рядом с их обычным результатом";
}

function DuoHead({
  id,
  name,
  avatar,
  tier,
  place,
}: {
  id: number;
  name: string;
  avatar: string | null;
  tier: number | null;
  place: number | null;
}) {
  const rank = rankLabel(tier);
  return (
    <article className="identity">
      <Link href={`/players/${id}`}>
        {avatar ? <img src={avatar} alt="" /> : <span className="avatar-fallback" />}
      </Link>
      <div>
        <h2>
          <Link href={`/players/${id}`} dir="auto" title={name}>
            {name}
          </Link>
        </h2>
        <p className="muted">{rank ?? "Ранг не указан"}</p>
      </div>
      {tier ? <RankMedal tier={tier} place={place} /> : null}
    </article>
  );
}

function MatchList({ matches, accountId }: { matches: SharedMatch[]; accountId: number }) {
  if (matches.length === 0) return <p className="empty">Общих матчей нет.</p>;
  return (
    <div className="match-feed">
      {matches.map((match) => (
        <Link key={match.matchId} className="duo-match" href={`/matches/${match.matchId}?player=${accountId}`}>
          {match.imgA ? <img src={match.imgA} alt="" /> : <span className="portrait-fallback" />}
          {match.imgB ? <img src={match.imgB} alt="" /> : <span className="portrait-fallback" />}
          <span className={match.won ? "pip win" : "pip loss"}>{match.won ? "W" : "L"}</span>
          <span className="match-main">
            <b>
              {match.heroA} + {match.heroB}
            </b>
            <span className="kda">
              {formatNumber(match.kills)} / {formatNumber(match.deaths)} / {formatNumber(match.assists)}
              {match.killsB !== null ? ` · ${formatNumber(match.killsB)} / ${formatNumber(match.deathsB)} / ${formatNumber(match.assistsB)}` : ""}
              {` · ${match.side === "same" ? "Вместе" : "Против"}`}
            </span>
          </span>
          <span className="match-side">
            <b>{formatDuration(match.duration)}</b>
            {formatWhen(match.startTime)}
          </span>
        </Link>
      ))}
    </div>
  );
}
