import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PairForm } from "@/components/PairForm";
import { comparePath, duoPath, parseAccountId } from "@/lib/duo";
import { accountRefMessage, resolveAccountRef } from "@/lib/lookup";
import { loadPassport, type CountRow, type HeroRow, type Passport, type Section } from "@/lib/passport";
import { compareBlurb } from "@/lib/share";
import { RankMedal } from "@/components/RankMedal";
import { formatDecimal, formatDuration, formatNumber, formatPercent, rankLabel } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const first = parseAccountId(params.a);
  const second = parseAccountId(params.b);
  if (first === null || second === null || first === second) return { title: "Сравнение" };
  const [left, right] = await Promise.all([
    loadPassport(first).catch(() => null),
    loadPassport(second).catch(() => null),
  ]);
  if (!left || !right) return { title: "Сравнение" };
  const description = compareBlurb(left, right);
  const title = `${left.profile.persona} и ${right.profile.persona} — сравнение`;
  return { title, description, openGraph: { title, description } };
}

type Side = { id: number; passport: Passport } | { id: number; error: string };

function gamesOf(section: Section<{ wins: number; losses: number; winRate: number | null }>): number | null {
  if (!section.ok) return null;
  return section.data.wins + section.data.losses;
}

function textOf(section: Section<{ wins: number; losses: number; winRate: number | null }>): string {
  if (!section.ok) return section.message;
  return `${formatNumber(section.data.wins)}–${formatNumber(section.data.losses)} · ${formatPercent(section.data.winRate)}`;
}

function rateOf(section: Section<{ wins: number; losses: number; winRate: number | null }>): number | null {
  return section.ok ? section.data.winRate : null;
}

function average(passport: Passport, label: string): { value: number; n: number } | null {
  if (!passport.lifetime.ok) return null;
  const row = passport.lifetime.data.rows.find((item) => item.label === label);
  return row ? { value: row.value, n: row.n } : null;
}

function pp(a: number | null, b: number | null): string {
  if (a === null || b === null) return "—";
  const delta = (a - b) * 100;
  return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

function countDelta(a: number | null, b: number | null): string {
  if (a === null || b === null) return "—";
  const delta = a - b;
  return `${delta > 0 ? "+" : ""}${formatNumber(delta)}`;
}

function lifeText(passport: Passport, label: string, duration = false): string {
  const row = average(passport, label);
  if (!row) return passport.lifetime.ok ? "—" : passport.lifetime.message;
  return duration ? formatDuration(row.value) : formatDecimal(row.value);
}

function decimalDelta(a: number | null, b: number | null): string {
  if (a === null || b === null) return "—";
  const delta = a - b;
  return `${delta > 0 ? "+" : ""}${formatDecimal(delta)}`;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const firstRef = await resolveAccountRef(params.a);
  const secondRef = await resolveAccountRef(params.b);
  const first = firstRef.id;
  const second = secondRef.id;
  const firstError = params.a ? accountRefMessage(firstRef) : null;
  const secondError = params.b ? accountRefMessage(secondRef) : null;
  const same = first !== null && second !== null && first === second;
  const ready = first !== null && second !== null && !same;
  if (ready && (params.a !== String(first) || params.b !== String(second))) redirect(comparePath(first, second));

  let left: Side | null = null;
  let right: Side | null = null;
  if (ready && first && second) {
    const [a, b] = await Promise.all([
      loadPassport(first).then(
        (passport) => ({ id: first, passport }) as Side,
        (error: unknown) => ({ id: first, error: error instanceof Error ? error.message : "Профиль не открылся" }) as Side,
      ),
      loadPassport(second).then(
        (passport) => ({ id: second, passport }) as Side,
        (error: unknown) => ({ id: second, error: error instanceof Error ? error.message : "Профиль не открылся" }) as Side,
      ),
    ]);
    left = a;
    right = b;
  }

  const a = left && "passport" in left ? left.passport : null;
  const b = right && "passport" in right ? right.passport : null;

  return (
    <main className="sheet">
      <section className="home-hero plain">
        <div>
          <h1>Сравнение</h1>
          <p className="lead">Два профиля рядом: матчи, винрейт и герои.</p>
        </div>
        <PairForm action="/compare" a={params.a} b={params.b} submit="Сравнить" />
        <p className="muted">
          Можно номер или ссылку steamcommunity.com. <Link href="/">Найти игрока</Link>
          {" · "}
          <Link href="/duo">Дуэт</Link> смотрит общие игры, это сравнение их не считает.
        </p>
      </section>
      {firstError ? <p className="error">{firstError}</p> : null}
      {secondError ? <p className="error">{secondError}</p> : null}
      {same ? <p className="error">Нужны два разных игрока.</p> : null}
      {ready && first && second ? (
        <p>
          <Link className="action" href={duoPath(first, second)}>Открыть дуэт</Link>
        </p>
      ) : null}

      {left && right ? (
        <>
          <div className="pair compare-stage">
            <PlayerHead side={left} />
            <PlayerHead side={right} />
          </div>
          {a && b ? <CompareTable left={a} right={b} /> : null}
          {a?.heroes.ok && b?.heroes.ok ? (
            <Overlap
              left={a.heroes.data}
              right={b.heroes.data}
              leftId={a.accountId}
              rightId={b.accountId}
              leftName={a.profile.persona}
              rightName={b.profile.persona}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
}

function PlayerHead({ side }: { side: Side }) {
  if ("error" in side) {
    return (
      <article className="block">
        <h2>Игрок</h2>
        <p className="empty">Не загрузился.</p>
      </article>
    );
  }
  const profile = side.passport.profile;
  return (
    <article className="identity">
      {profile.avatar ? <img src={profile.avatar} alt="" /> : <span className="avatar-fallback" />}
      <div>
        <h2>
          <Link href={`/players/${side.id}`} dir="auto" title={profile.persona}>
            {profile.persona}
          </Link>
        </h2>
        <p className="muted">{rankLabel(profile.rankTier) ?? "Ранг не указан"}</p>
        {side.passport.recent.ok ? (
          <p className="pips">
            {side.passport.recent.data.marks.slice(0, 12).map((mark, index) => (
              <span key={`${mark}-${index}`} className={mark === "W" ? "pip win" : "pip loss"}>
                {mark}
              </span>
            ))}
          </p>
        ) : null}
      </div>
      {profile.rankTier ? <RankMedal tier={profile.rankTier} place={profile.leaderboardRank} /> : null}
    </article>
  );
}

function CompareTable({ left, right }: { left: Passport; right: Passport }) {
  const gpmA = average(left, "GPM");
  const gpmB = average(right, "GPM");
  const xpmA = average(left, "XPM");
  const xpmB = average(right, "XPM");
  const poolA = left.heroes.ok ? left.heroes.data.length : null;
  const poolB = right.heroes.ok ? right.heroes.data.length : null;
  const rows: { label: string; a: string; b: string; delta: string; tone?: boolean }[] = [
    {
      label: "Матчи",
      a: textOf(left.record),
      b: textOf(right.record),
      delta: countDelta(gamesOf(left.record), gamesOf(right.record)),
    },
    {
      label: `Патч ${left.patch.bucketName ?? right.patch.bucketName ?? ""}`.trim(),
      a: textOf(left.patchRecord),
      b: textOf(right.patchRecord),
      delta: pp(rateOf(left.patchRecord), rateOf(right.patchRecord)),
      tone: true,
    },
    {
      label: "Последние игры",
      a: left.recent.ok
        ? `${formatNumber(left.recent.data.n)} · ${formatPercent(left.recent.data.winRate)}${left.recent.data.n < 20 ? " · мало игр" : ""}`
        : left.recent.message,
      b: right.recent.ok
        ? `${formatNumber(right.recent.data.n)} · ${formatPercent(right.recent.data.winRate)}${right.recent.data.n < 20 ? " · мало игр" : ""}`
        : right.recent.message,
      delta: pp(left.recent.ok ? left.recent.data.winRate : null, right.recent.ok ? right.recent.data.winRate : null),
      tone: true,
    },
    {
      label: "KDA последних матчей",
      a: left.recent.ok ? formatDecimal(left.recent.data.kda) : left.recent.message,
      b: right.recent.ok ? formatDecimal(right.recent.data.kda) : right.recent.message,
      delta: decimalDelta(left.recent.ok ? left.recent.data.kda : null, right.recent.ok ? right.recent.data.kda : null),
    },
    {
      label: "Золото в минуту",
      a: gpmA ? formatDecimal(gpmA.value) : left.lifetime.ok ? "—" : left.lifetime.message,
      b: gpmB ? formatDecimal(gpmB.value) : right.lifetime.ok ? "—" : right.lifetime.message,
      delta: decimalDelta(gpmA?.value ?? null, gpmB?.value ?? null),
    },
    {
      label: "Опыт в минуту",
      a: xpmA ? formatDecimal(xpmA.value) : left.lifetime.ok ? "—" : left.lifetime.message,
      b: xpmB ? formatDecimal(xpmB.value) : right.lifetime.ok ? "—" : right.lifetime.message,
      delta: decimalDelta(xpmA?.value ?? null, xpmB?.value ?? null),
    },
    {
      label: "Убийства",
      a: lifeText(left, "Убийства"),
      b: lifeText(right, "Убийства"),
      delta: decimalDelta(average(left, "Убийства")?.value ?? null, average(right, "Убийства")?.value ?? null),
    },
    {
      label: "Смерти",
      a: lifeText(left, "Смерти"),
      b: lifeText(right, "Смерти"),
      delta: decimalDelta(average(left, "Смерти")?.value ?? null, average(right, "Смерти")?.value ?? null),
    },
    {
      label: "Помощи",
      a: lifeText(left, "Помощи"),
      b: lifeText(right, "Помощи"),
      delta: decimalDelta(average(left, "Помощи")?.value ?? null, average(right, "Помощи")?.value ?? null),
    },
    {
      label: "Ластхиты",
      a: lifeText(left, "Ластхиты"),
      b: lifeText(right, "Ластхиты"),
      delta: decimalDelta(average(left, "Ластхиты")?.value ?? null, average(right, "Ластхиты")?.value ?? null),
    },
    {
      label: "Длительность",
      a: lifeText(left, "Длительность", true),
      b: lifeText(right, "Длительность", true),
      delta: "—",
    },
    {
      label: "Пул героев",
      a: left.heroes.ok ? formatNumber(left.heroes.data.length) : left.heroes.message,
      b: right.heroes.ok ? formatNumber(right.heroes.data.length) : right.heroes.message,
      delta: countDelta(poolA, poolB),
    },
  ];

  return (
    <section className="block">
      <h2>Цифры</h2>
      <div className="cmp-list">
        {rows.map((row) => (
          <div className="cmp-row" key={row.label}>
            <span className="cmp-label">{row.label}</span>
            <span className="cmp-val" title={row.a}>{row.a}</span>
            <span className={row.tone && row.delta.startsWith("+") ? "cmp-delta win" : row.tone && row.delta.startsWith("-") ? "cmp-delta loss" : "cmp-delta"}>
              {row.delta}
            </span>
            <span className="cmp-val right" title={row.b}>{row.b}</span>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <CountBars title="Линии" rows={left.lanes.ok ? left.lanes.data : []} empty={left.lanes.ok ? "" : left.lanes.message} />
        <CountBars title="Линии" rows={right.lanes.ok ? right.lanes.data : []} empty={right.lanes.ok ? "" : right.lanes.message} />
      </div>
    </section>
  );
}

function CountBars({ title, rows, empty }: { title: string; rows: CountRow[]; empty: string }) {
  const shown = rows.filter((row) => row.id !== 0).slice(0, 4);
  const max = Math.max(1, ...shown.map((row) => row.games));
  return (
    <section>
      <h3>{title}</h3>
      {empty ? <p className="empty">{empty}</p> : null}
      {shown.map((row) => (
        <div className="cmp-bar" key={row.id}>
          <span>{row.label}</span>
          <span className="mini">
            <i className={(row.winRate ?? 0) >= 0.5 ? "win" : "loss"} style={{ width: `${Math.round((row.games / max) * 100)}%` }} />
          </span>
          <b className={(row.winRate ?? 0) >= 0.5 ? "win" : "loss"}>{formatPercent(row.winRate)}</b>
        </div>
      ))}
    </section>
  );
}

function HeroChips({ rows, accountId }: { rows: HeroRow[]; accountId: number }) {
  const shown = rows.slice(0, 8);
  if (shown.length === 0) return <p className="empty">Нет.</p>;
  return (
    <div className="hero-board">
      {shown.map((hero) => (
        <Link className="hero-tile" key={hero.heroId} href={`/heroes/${hero.heroId}?player=${accountId}`}>
          {hero.img ? <img src={hero.img} alt="" /> : <span className="portrait-fallback" />}
          <b>{hero.name}</b>
          <span className={(hero.winRate ?? 0) >= 0.5 ? "rate win" : "rate loss"}>{formatPercent(hero.winRate)}</span>
          <span className="muted">{formatNumber(hero.games)} игр</span>
        </Link>
      ))}
    </div>
  );
}

function Overlap({ left, right, leftId, rightId, leftName, rightName }: { left: HeroRow[]; right: HeroRow[]; leftId: number; rightId: number; leftName: string; rightName: string }) {
  const rightById = new Map(right.map((hero) => [hero.heroId, hero]));
  const leftIds = new Set(left.map((hero) => hero.heroId));
  const shared = left
    .filter((hero) => rightById.has(hero.heroId))
    .map((hero) => ({ hero, other: rightById.get(hero.heroId)! }))
    .sort((a, b) => b.hero.games + b.other.games - (a.hero.games + a.other.games));
  const onlyLeft = left.filter((hero) => !rightById.has(hero.heroId));
  const onlyRight = right.filter((hero) => !leftIds.has(hero.heroId));

  return (
    <section className="block">
      <div className="section-head">
        <h2>Общие герои</h2>
        <span className="muted">{formatNumber(shared.length)}</span>
      </div>
      {shared.length === 0 ? <p className="empty">Общих героев нет.</p> : null}
      <div className="match-feed">
        {shared.slice(0, 12).map(({ hero, other }) => (
          <Link className="cmp-hero" key={hero.heroId} href={`/heroes/${hero.heroId}`}>
            {hero.img ? <img src={hero.img} alt="" /> : <span className="portrait-fallback" />}
            <span>
              <b>{hero.name}</b>
              <span className="muted">{formatNumber(hero.games + other.games)} игр на двоих</span>
            </span>
            <span className={(hero.winRate ?? 0) >= 0.5 ? "rate win" : "rate loss"}>
              {formatPercent(hero.winRate)}
              <span className="muted">{formatNumber(hero.games)}</span>
            </span>
            <span className={(other.winRate ?? 0) >= 0.5 ? "rate win" : "rate loss"}>
              {formatPercent(other.winRate)}
              <span className="muted">{formatNumber(other.games)}</span>
            </span>
          </Link>
        ))}
      </div>
      <div className="grid-2">
        {onlyLeft.length > 0 ? (
          <section>
            <h3 title={leftName}>{leftName} · {formatNumber(onlyLeft.length)}</h3>
            <HeroChips rows={onlyLeft} accountId={leftId} />
          </section>
        ) : null}
        {onlyRight.length > 0 ? (
          <section>
            <h3 title={rightName}>{rightName} · {formatNumber(onlyRight.length)}</h3>
            <HeroChips rows={onlyRight} accountId={rightId} />
          </section>
        ) : null}
      </div>
    </section>
  );
}
